import {
  SurveyContext,
} from "../data_types";

import { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { shuffleIndices } from "../utils";

import {
  Survey,
  SurveyItemKey,
  SurveyItemType,
  SurveyItem,
  QuestionItem,
  GroupItem,
  SurveyEndItem,
  SingleChoiceQuestionItem,
  ItemComponent,
  MultipleChoiceQuestionItem,
  ValueType,
  ExpectedValueType,
  initValueForType,
} from "../survey";
import { JsonSurveyItemResponse, ResponseItem, ResponseMeta, SurveyItemResponse, TimestampType } from "../survey/responses";
import { ExpressionEvaluator } from "../expressions/expression-evaluator";
import { Expression, TemplateValueDefinition } from "../expressions";


export type ScreenSize = "small" | "large";


export interface RenderedSurveyItem {
  key: SurveyItemKey;
  type: SurveyItemType;
  items?: Array<RenderedSurveyItem>
  responseCompOrder?: Array<string>;
}

export class SurveyEngineCore {
  private surveyDef: Survey;
  private renderedSurveyTree: RenderedSurveyItem;
  private context: SurveyContext;

  private responses: {
    [itemKey: string]: SurveyItemResponse;
  };
  private prefills?: {
    [itemKey: string]: SurveyItemResponse;
  };
  private _openedAt: number;
  private selectedLocale: string;
  private dateLocales: Array<{ code: string, locale: Locale }>;

  //private evalEngine: ExpressionEval;
  private showDebugMsg: boolean;

  private cache!: {
    validations: {
      [itemKey: string]: {
        [validationKey: string]: {
          expression: Expression;
          result: boolean;
        };
      };
    };
    displayConditions: {
      [itemKey: string]: {
        root?: {
          expression: Expression;
          result: boolean;
        };
        components?: {
          [componentKey: string]: {
            expression: Expression;
            result: boolean;
          };
        }
      };
    };
    templateValues: {
      [itemKey: string]: {
        [templateValueKey: string]: {
          value: ValueType;
          templateDef: TemplateValueDefinition | undefined;
        };
      };
    };
    disabledConditions: {
      [itemKey: string]: {
        components?: {
          [componentKey: string]: {
            expression: Expression;
            result: boolean;
          };
        }
      };
    };
  }

  constructor(
    survey: Survey,
    context?: SurveyContext,
    prefills?: JsonSurveyItemResponse[],
    showDebugMsg?: boolean,
    selectedLocale?: string,
    dateLocales?: Array<{ code: string, locale: Locale }>,
  ) {
    this._openedAt = Date.now();


    this.surveyDef = survey;

    this.context = context ? context : {};
    this.prefills = prefills ? prefills.reduce((acc, p) => {
      acc[p.key] = SurveyItemResponse.fromJson(p);
      return acc;
    }, {} as { [itemKey: string]: SurveyItemResponse }) : undefined;

    this.showDebugMsg = showDebugMsg !== undefined ? showDebugMsg : false;
    this.selectedLocale = selectedLocale || 'en';
    this.dateLocales = dateLocales || [{ code: 'en', locale: enUS }];
    this.responses = this.initResponseObject(this.surveyDef.surveyItems);

    this.initCache();
    this.evalExpressions();

    // init rendered survey
    this.renderedSurveyTree = this.renderGroup(survey.rootItem);
  }


  // PUBLIC METHODS
  setContext(context: SurveyContext) {
    this.context = context;
  }

  getSelectedLocale(): string {
    return this.selectedLocale;
  }

  getDateLocales(): Array<{ code: string, locale: Locale }> {
    return this.dateLocales.slice();
  }

  getCurrentDateLocale(): Locale | undefined {
    const found = this.dateLocales.find(dl => dl.code === this.selectedLocale);
    if (!found) {
      console.warn(`Locale '${this.selectedLocale}' is not available. Using default locale.`);
      if (this.dateLocales.length > 0) {
        return this.dateLocales[0].locale;
      }
      return enUS;
    }
    return found?.locale;
  }

  setSelectedLocale(locale: string) {
    this.selectedLocale = locale;

    // Re-render to update any locale-dependent expressions
    this.evalExpressions();
    this.reRenderSurveyTree();
  }


  setResponse(targetKey: string, response?: ResponseItem) {
    const target = this.getResponseItem(targetKey);
    if (!target) {
      throw new Error('setResponse: target not found for key: ' + targetKey);
    }

    target.response = response;
    this.setTimestampFor('responded', targetKey);

    this.evalExpressions();
    // re-render whole tree
    this.reRenderSurveyTree();
  }

  get openedAt(): number {
    return this._openedAt;
  }

  get survey(): Readonly<Survey> {
    return this.surveyDef;
  }

  getSurveyPages(size?: ScreenSize): RenderedSurveyItem[][] {
    const renderedSurvey = flattenTree(this.renderedSurveyTree);
    const pages = new Array<RenderedSurveyItem[]>();

    if (!size) {
      size = 'large';
    }

    let currentPage: RenderedSurveyItem[] = [];

    renderedSurvey.forEach(item => {
      if (item.type === SurveyItemType.PageBreak) {
        if (currentPage.length > 0) {
          pages.push([...currentPage]);
          currentPage = [];
        }
        return;
      }
      currentPage.push(item);

      if (!this.surveyDef.maxItemsPerPage) {
        return;
      }
      let max = 0;
      switch (size) {
        case 'large':
          max = this.surveyDef.maxItemsPerPage.large;
          break;
        case 'small':
          max = this.surveyDef.maxItemsPerPage.small;
          break
      }

      if (currentPage.length >= max) {
        pages.push([...currentPage]);
        currentPage = [];
      }
    });
    if (currentPage.length > 0) {
      pages.push([...currentPage]);
    }
    return pages;
  }

  onQuestionDisplayed(itemKey: string) {
    this.setTimestampFor('displayed', itemKey);
  }


  get surveyEndItem(): SurveyEndItem | undefined {
    const renderedSurvey = flattenTree(this.renderedSurveyTree);
    const firstRenderedSurveyEnd = renderedSurvey.find(item => item.type === SurveyItemType.SurveyEnd);
    if (!firstRenderedSurveyEnd) {
      return undefined;
    }
    return this.surveyDef.surveyItems[firstRenderedSurveyEnd.key.fullKey] as SurveyEndItem;
  }

  getResponses(): SurveyItemResponse[] {
    const renderedSurvey = flattenTree(this.renderedSurveyTree).filter(
      item => item.type !== SurveyItemType.PageBreak && item.type !== SurveyItemType.SurveyEnd
    );

    const responses: SurveyItemResponse[] = [];
    renderedSurvey.forEach((item, index) => {
      const response = this.getResponseItem(item.key.fullKey);
      if (!response) {
        return;
      }
      if (!response.meta) {
        response.meta = new ResponseMeta();
      }
      response.meta.setPosition(index);

      const itemDef = this.surveyDef.surveyItems[item.key.fullKey];
      if (itemDef instanceof QuestionItem) {
        response.confidentiality = itemDef.confidentiality;
      }

      responses.push(response);
    });
    return responses;
  }

  getDisplayConditionValue(itemKey: string, componentKey?: string): boolean | undefined {
    if (componentKey) {
      return this.cache.displayConditions[itemKey]?.components?.[componentKey]?.result;
    }
    return this.cache.displayConditions[itemKey]?.root?.result;
  }

  getDisabledConditionValue(itemKey: string, componentKey: string): boolean | undefined {
    return this.cache.disabledConditions[itemKey]?.components?.[componentKey]?.result;
  }

  getTemplateValue(itemKey: string, templateValueKey: string): {
    value: ValueType;
    templateDef: TemplateValueDefinition | undefined;
  } | undefined {
    return this.cache.templateValues[itemKey]?.[templateValueKey];
  }

  getValidationValues(itemKey: string): {
    [validationKey: string]: boolean;
  } | undefined {
    const validations = this.cache.validations[itemKey];
    if (!validations) {
      return undefined;
    }
    return Object.keys(validations).reduce((acc, validationKey) => {
      acc[validationKey] = validations[validationKey].result;
      return acc;
    }, {} as { [validationKey: string]: boolean });
  }

  // INIT METHODS

  private initCache() {
    this.cache = {
      validations: {},
      displayConditions: {},
      templateValues: {},
      disabledConditions: {},
    }

    Object.keys(this.surveyDef.surveyItems).forEach(itemKey => {
      // Init validations
      const item = this.surveyDef.surveyItems[itemKey];
      if (item instanceof QuestionItem && item.validations && Object.keys(item.validations).length > 0) {
        this.cache.validations[itemKey] = {};
        Object.keys(item.validations).forEach(validationKey => {
          const valExp = item.validations![validationKey];
          if (!valExp) {
            console.warn('initCache: validation expression not found: ' + itemKey + ' ' + validationKey);
            return;
          }
          this.cache.validations[itemKey][validationKey] = {
            expression: valExp,
            result: false,
          };
        });
      }

      // Init display conditions
      if (item.displayConditions !== undefined && (item.displayConditions.root || item.displayConditions.components)) {
        this.cache.displayConditions[itemKey] = {};
        if (item.displayConditions.root) {
          this.cache.displayConditions[itemKey].root = {
            expression: item.displayConditions.root,
            result: false,
          };
        }
        if (item.displayConditions.components) {
          this.cache.displayConditions[itemKey].components = {};
          Object.keys(item.displayConditions.components).forEach(componentKey => {
            const compExp = item.displayConditions?.components?.[componentKey];
            if (!compExp) {
              console.warn('initCache: display condition component expression not found: ' + itemKey + ' ' + componentKey);
              return;
            }
            this.cache.displayConditions[itemKey].components![componentKey] = {
              expression: compExp,
              result: false,
            };
          });
        }
      }

      // Init disable conditions
      if (item instanceof QuestionItem && item.disabledConditions !== undefined && item.disabledConditions.components !== undefined) {
        this.cache.disabledConditions[itemKey] = {
          components: {}
        };
        Object.keys(item.disabledConditions.components).forEach(componentKey => {
          const compExp = item.disabledConditions?.components?.[componentKey];
          if (!compExp) {
            console.warn('initCache: disabled condition component expression not found: ' + itemKey + ' ' + componentKey);
            return;
          }
          this.cache.disabledConditions[itemKey].components![componentKey] = {
            expression: compExp,
            result: false,
          };
        });
      }

      // Init template values
      if (item.templateValues) {
        this.cache.templateValues[itemKey] = {};
        Object.keys(item.templateValues).forEach(templateValueKey => {
          const templateDef = item.templateValues?.[templateValueKey];
          if (!templateDef) {
            console.warn('initCache: template value not found: ' + itemKey + ' ' + templateValueKey);
            return;
          }
          this.cache.templateValues[itemKey][templateValueKey] = {
            value: initValueForType(item.templateValues?.[templateValueKey].returnType || ExpectedValueType.String),
            templateDef: item.templateValues?.[templateValueKey],
          };
        });
      }
    });
  }


  private initResponseObject(items: {
    [itemKey: string]: SurveyItem
  }): {
    [itemKey: string]: SurveyItemResponse;
  } {
    const respGroup: {
      [itemKey: string]: SurveyItemResponse;
    } = {};

    Object.entries(items).forEach(([itemKey, item]) => {
      if (
        item.itemType === SurveyItemType.Group ||
        item.itemType === SurveyItemType.PageBreak ||
        item.itemType === SurveyItemType.SurveyEnd ||
        item.itemType === SurveyItemType.Display
      ) {
        return;
      } else {
        const prefill = this.prefills?.[itemKey];
        const applyPrefill = prefill && prefill.itemType === item.itemType;
        respGroup[itemKey] = new SurveyItemResponse(
          item,
          applyPrefill ? prefill.response : undefined,
        )
      }
    });

    return respGroup;
  }

  private shouldRender(fullItemKey: string, fullComponentKey?: string): boolean {
    const displayConditionResult = this.getDisplayConditionValue(fullItemKey, fullComponentKey);
    if (displayConditionResult !== undefined) {
      return displayConditionResult;
    }
    return true;
  }

  private sequentialRender(groupDef: GroupItem): RenderedSurveyItem {
    const newItems: RenderedSurveyItem[] = [];

    for (const fullItemKey of groupDef.items || []) {
      const shouldRender = this.shouldRender(fullItemKey);
      if (!shouldRender) {
        continue;
      }

      const itemDef = this.surveyDef.surveyItems[fullItemKey];
      if (!itemDef) {
        console.warn('sequentialRender: item not found: ' + fullItemKey);
        continue;
      }

      if (itemDef.itemType === SurveyItemType.Group) {
        newItems.push(this.renderGroup(itemDef as GroupItem));
        continue;
      }

      newItems.push(this.renderItem(itemDef));
    }

    return {
      key: groupDef.key,
      type: SurveyItemType.Group,
      items: newItems
    };
  }

  private randomizedItemRender(groupDef: GroupItem, parent: RenderedSurveyItem): RenderedSurveyItem {
    const newItems: RenderedSurveyItem[] = parent.items?.filter(rItem =>
      this.shouldRender(rItem.key.fullKey)
    ) || [];


    const itemKeys = groupDef.items || [];
    const shuffledIndices = shuffleIndices(itemKeys.length);

    for (const index of shuffledIndices) {
      const fullItemKey = itemKeys[index];
      const alreadyRenderedItem = parent.items?.find(rItem => rItem.key.fullKey === fullItemKey);
      if (alreadyRenderedItem) {
        continue;
      }

      const shouldRender = this.shouldRender(fullItemKey);
      if (!shouldRender) {
        continue;
      }

      const itemDef = this.surveyDef.surveyItems[fullItemKey];
      if (!itemDef) {
        console.warn('randomizedItemRender: item not found: ' + fullItemKey);
        continue;
      }

      if (itemDef.itemType === SurveyItemType.Group) {
        newItems.push(this.renderGroup(itemDef as GroupItem, parent));
        continue;
      }

      newItems.push(this.renderItem(itemDef));
    }

    return {
      key: groupDef.key,
      type: SurveyItemType.Group,
      items: newItems
    };
  }

  private renderGroup(groupDef: GroupItem, parent?: RenderedSurveyItem): RenderedSurveyItem {
    if (!parent) {
      parent = {
        key: groupDef.key,
        type: SurveyItemType.Group,
        items: []
      };
    }

    if (groupDef.shuffleItems) {
      return this.randomizedItemRender(groupDef, parent);
    }

    return this.sequentialRender(groupDef);
  }

  private renderItem(itemDef: SurveyItem): RenderedSurveyItem {
    let responseCompOrder: Array<ItemComponent> | undefined = undefined;
    let responseCompOrderIndexes: Array<number> | undefined = undefined;
    switch (itemDef.itemType) {
      case SurveyItemType.SingleChoiceQuestion:
        responseCompOrder = [];

        if ((itemDef as SingleChoiceQuestionItem).responseConfig.shuffleItems) {
          responseCompOrderIndexes = shuffleIndices((itemDef as SingleChoiceQuestionItem).responseConfig.options.length);
        } else {
          responseCompOrderIndexes = Array.from({ length: (itemDef as SingleChoiceQuestionItem).responseConfig.options.length }, (_, i) => i);
        }
        responseCompOrderIndexes.forEach(index => {
          const option = (itemDef as SingleChoiceQuestionItem).responseConfig.options[index];
          if (this.shouldRender(option.key.parentItemKey.fullKey, option.key.fullKey)) {
            responseCompOrder?.push(option);
          }
        });
        break;
      case SurveyItemType.MultipleChoiceQuestion:
        responseCompOrder = [];
        if ((itemDef as MultipleChoiceQuestionItem).responseConfig.shuffleItems) {
          responseCompOrderIndexes = shuffleIndices((itemDef as MultipleChoiceQuestionItem).responseConfig.options.length);
        } else {
          responseCompOrderIndexes = Array.from({ length: (itemDef as MultipleChoiceQuestionItem).responseConfig.options.length }, (_, i) => i);
        }
        responseCompOrderIndexes.forEach(index => {
          const option = (itemDef as MultipleChoiceQuestionItem).responseConfig.options[index];
          if (this.shouldRender(option.key.parentItemKey.fullKey, option.key.fullKey)) {
            responseCompOrder?.push(option);
          }
        });
        break;
      default:
        break;
    }

    const renderedItem = {
      key: itemDef.key,
      type: itemDef.itemType,
      responseCompOrder: responseCompOrder?.map(option => option.key.fullKey),
    }
    return renderedItem;
  }

  private reRenderSurveyTree() {
    this.renderedSurveyTree = this.renderGroup(this.surveyDef.rootItem);
  }

  /* TODO: private reRenderGroup(groupKey: string) {
    if (groupKey.split('.').length < 2) {
      this.reEvaluateDynamicValues();
    }

    const renderedGroup = this.findRenderedItem(groupKey);
    if (!renderedGroup || !isSurveyGroupItem(renderedGroup)) {
      console.warn('reRenderGroup: renderedGroup not found or not a group: ' + groupKey);
      return;
    }
    const groupDef = this.findSurveyDefItem(groupKey);
    if (!groupDef || !isSurveyGroupItem(groupDef)) {
      console.warn('reRenderGroup: groupDef not found or not a group: ' + groupKey);
      return;
    }

    if (groupDef.selectionMethod && groupDef.selectionMethod.name === 'sequential') {
      // simplified workflow:
      this.sequentialRender(groupDef, renderedGroup, true);
      return
    }

    // Add items to the front
    let currentIndex = 0;
    let nextItem = this.getNextItem(groupDef, renderedGroup, renderedGroup.key, true);
    while (nextItem !== null) {
      if (!nextItem) {
        break;
      }
      this.addRenderedItem(nextItem, renderedGroup, currentIndex);
      if (isSurveyGroupItem(nextItem)) {
        this.initRenderedGroup(nextItem, nextItem.key);
      }
      currentIndex += 1;
      nextItem = this.getNextItem(groupDef, renderedGroup, nextItem.key, true);
    }

    renderedGroup.items.forEach(
      item => {
        const itemDef = this.findSurveyDefItem(item.key);
        // Remove item if condition not true
        if (!itemDef || !this.evalConditions(itemDef.condition)) {
          renderedGroup.items = removeItemByKey(renderedGroup.items, item.key);
          // console.log('removed item: ' + item.key);
          return;
        }

        // Add direct follow ups
        currentIndex = renderedGroup.items.findIndex(ci => ci.key === item.key);
        if (currentIndex < 0) {
          // console.warn('reRenderGroup: index to insert items not found');
          return;
        }


        if (isSurveyGroupItem(item)) {
          // Re-Render groups recursively
          this.reRenderGroup(item.key);
        } else {
          renderedGroup.items[currentIndex] = this.renderSingleSurveyItem(itemDef as SurveySingleItem, true);
        }


        let nextItem = this.getNextItem(groupDef, renderedGroup, item.key, true);
        while (nextItem !== null) {
          if (!nextItem) {
            break;
          }
          currentIndex += 1;
          this.addRenderedItem(nextItem, renderedGroup, currentIndex);
          if (isSurveyGroupItem(nextItem)) {
            this.initRenderedGroup(nextItem, nextItem.key);
          }
          nextItem = this.getNextItem(groupDef, renderedGroup, nextItem.key, true);
        }
      });

    // Add items at the end if any
    const lastItem = renderedGroup.items[renderedGroup.items.length - 1];
    nextItem = this.getNextItem(groupDef, renderedGroup, lastItem.key, false);
    while (nextItem !== null) {
      if (!nextItem) {
        break;
      }
      this.addRenderedItem(nextItem, renderedGroup);
      if (isSurveyGroupItem(nextItem)) {
        this.initRenderedGroup(nextItem, nextItem.key);
      }
      nextItem = this.getNextItem(groupDef, renderedGroup, nextItem.key, false);
    }
  } */

  private setTimestampFor(type: TimestampType, itemID: string) {
    const obj = this.getResponseItem(itemID);
    if (!obj) {
      return;
    }
    if (!obj.meta) {
      obj.meta = new ResponseMeta();
    }

    obj.meta.addTimestamp(type, Date.now());
  }

  getResponseItem(itemFullKey: string): SurveyItemResponse | undefined {
    return this.responses[itemFullKey];
  }

  private evalExpressions() {
    const evalEngine = new ExpressionEvaluator(
      {
        responses: this.responses,
        // TODO: add context
      }
    );
    this.evalTemplateValues(evalEngine);
    this.evalDisplayConditions(evalEngine);
    this.evalDisableConditions(evalEngine);
    this.evalValidations(evalEngine);
  }


  private evalTemplateValues(evalEngine: ExpressionEvaluator) {
    Object.keys(this.cache.templateValues).forEach(itemKey => {
      Object.keys(this.cache.templateValues[itemKey]).forEach(templateValueKey => {
        const templateValue = this.cache.templateValues[itemKey][templateValueKey];
        if (!templateValue.templateDef?.expression) {
          console.warn('evalTemplateValues: template value expression not found: ' + itemKey + '.' + templateValueKey);
          return;
        }

        const resolvedValue = evalEngine.eval(templateValue.templateDef.expression);
        if (resolvedValue === undefined) {
          console.warn('evalTemplateValues: template value expression returned undefined: ' + itemKey + '.' + templateValueKey);
          return;
        }
        this.cache.templateValues[itemKey][templateValueKey].value = resolvedValue;
      });
    });
  }

  private evalDisplayConditions(evalEngine: ExpressionEvaluator) {
    Object.keys(this.cache.displayConditions).forEach(itemKey => {
      const displayCondition = this.cache.displayConditions[itemKey];
      if (displayCondition.root) {
        const resolvedValue = evalEngine.eval(displayCondition.root.expression);
        if (resolvedValue === undefined || typeof resolvedValue !== 'boolean') {
          console.warn('evalDisplayConditions: display condition expression returned undefined: ' + itemKey);
          return;
        }
        this.cache.displayConditions[itemKey].root!.result = resolvedValue;
      }
      if (displayCondition.components) {
        Object.keys(displayCondition.components).forEach(componentKey => {
          const resolvedValue = evalEngine.eval(displayCondition.components![componentKey].expression);
          if (resolvedValue === undefined || typeof resolvedValue !== 'boolean') {
            console.warn('evalDisplayConditions: display condition component expression returned undefined: ' + itemKey + '.' + componentKey);
            return;
          }
          this.cache.displayConditions[itemKey].components![componentKey].result = resolvedValue;
        });
      }
    });
  }

  private evalDisableConditions(evalEngine: ExpressionEvaluator) {
    Object.keys(this.cache.disabledConditions).forEach(itemKey => {
      const disableCondition = this.cache.disabledConditions[itemKey];
      if (disableCondition.components) {
        Object.keys(disableCondition.components).forEach(componentKey => {
          const resolvedValue = evalEngine.eval(disableCondition.components![componentKey].expression);
          if (resolvedValue === undefined || typeof resolvedValue !== 'boolean') {
            console.warn('evalDisableConditions: disable condition component expression returned undefined: ' + itemKey + '.' + componentKey);
            return;
          }
          this.cache.disabledConditions[itemKey].components![componentKey].result = resolvedValue;
        });
      }
    });
  }

  private evalValidations(evalEngine: ExpressionEvaluator) {
    Object.keys(this.cache.validations).forEach(itemKey => {
      const validation = this.cache.validations[itemKey];

      Object.keys(validation).forEach(validationKey => {
        const resolvedValue = evalEngine.eval(validation[validationKey].expression);
        if (resolvedValue === undefined || typeof resolvedValue !== 'boolean') {
          console.warn('evalValidations: validation expression returned undefined: ' + itemKey + '.' + validationKey);
          return;
        }
        this.cache.validations[itemKey][validationKey].result = resolvedValue;
      });
    });
  }



  /* TODO: resolveExpression(exp?: Expression, temporaryItem?: SurveySingleItem): any {
     return this.evalEngine.eval(
       exp,
       this.renderedSurvey,
       this.context,
       this.responses,
       temporaryItem,
       this.showDebugMsg,
     );
   } */

  /* TODO: private getOnlyRenderedResponses(items: SurveyItemResponse[]): SurveyItemResponse[] {
    const responses: SurveyItemResponse[] = [];
    items.forEach(item => {
      let currentItem: SurveyItemResponse = {
        key: item.key,
        meta: item.meta,
      }
      if (isSurveyGroupItemResponse(item)) {
        (currentItem as SurveyGroupItemResponse).items = this.getOnlyRenderedResponses(item.items);
      } else {
        currentItem.response = item.response;
        if (!this.findRenderedItem(item.key)) {
          return;
        }
      }
      responses.push(currentItem)
    })
    return responses;
  }
 */
  /* TODO: evalConditions(condition?: Expression, temporaryItem?: SurveySingleItem, extraResponses?: SurveyItemResponse[]): boolean {
    const extra = (extraResponses !== undefined) ? [...extraResponses] : [];
    const responsesForRenderedItems: SurveyGroupItemResponse = {
      ...this.responses,
      items: [...this.getOnlyRenderedResponses(this.responses.items), ...extra]
    }

    return this.evalEngine.eval(
      condition,
      this.renderedSurvey,
      this.context,
      responsesForRenderedItems,
      temporaryItem,
      this.showDebugMsg,
    );
  } */

  /* TODO: private reEvaluateDynamicValues() {
    const resolvedDynamicValues = this.surveyDef.dynamicValues?.map(dv => {
      const resolvedVal = this.evalEngine.eval(dv.expression, this.renderedSurvey, this.context, this.responses, undefined, this.showDebugMsg);
      let currentValue = ''
      if (dv.type === 'date') {
        const dateValue = new Date(resolvedVal * 1000);
        currentValue = format(dateValue, dv.dateFormat, { locale: this.getCurrentDateLocale() });
      } else {
        currentValue = resolvedVal;
      }

      return {
        ...dv,
        resolvedValue: currentValue,
      };
    });
    if (resolvedDynamicValues) {
      this.surveyDef.dynamicValues = resolvedDynamicValues;
    }
  } */
}

export const flattenTree = (itemTree: RenderedSurveyItem): RenderedSurveyItem[] => {
  const flatTree = new Array<RenderedSurveyItem>();

  itemTree.items?.forEach(item => {
    if (item.type === SurveyItemType.Group) {
      flatTree.push(...flattenTree(item));
    } else {
      flatTree.push({ ...item });
    }
  });
  return flatTree;
}
