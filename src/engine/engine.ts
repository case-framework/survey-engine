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
} from "../survey";
import { JsonSurveyItemResponse, ResponseItem, ResponseMeta, SurveyItemResponse, TimestampType } from "../survey/responses";


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
      itemsWithValidations: string[];
    };
    displayConditions: {
      itemsWithDisplayConditions: string[];
      values: {
        [itemKey: string]: {
          root?: boolean;
          components?: {
            [componentKey: string]: boolean;
          }
        };
      }
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
    // console.log('core engine')
    //this.evalEngine = new ExpressionEval();
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
    // TODO: init cache for dynamic values: which translations by language and item key have dynamic values
    // TODO: init cache for validations: which items have validations at all
    // TODO: init cache for translations resolved for current langague - to produce resolved template values
    // TODO: init cache for disable conditions: list which items have disable conditions at all
    // TODO: init cache for display conditions: list which items have display conditions at all

    // TODO: eval display conditions for all items

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
    // TODO: this.reRenderGroup(this.renderedSurvey.key);
  }


  setResponse(targetKey: string, response?: ResponseItem) {
    const target = this.getResponseItem(targetKey);
    if (!target) {
      throw new Error('setResponse: target not found for key: ' + targetKey);
    }

    target.response = response;
    this.setTimestampFor('responded', targetKey);

    // Re-render whole tree
    // TODO: this.reRenderGroup(this.renderedSurvey.key);
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

  // INIT METHODS
  private initCache() {
    const itemsWithValidations: string[] = [];
    Object.keys(this.surveyDef.surveyItems).forEach(itemKey => {
      const item = this.surveyDef.surveyItems[itemKey];
      if (item instanceof QuestionItem && item.validations && Object.keys(item.validations).length > 0) {
        itemsWithValidations.push(itemKey);
      }
    });

    const itemsWithDisplayConditions: string[] = [];
    Object.keys(this.surveyDef.surveyItems).forEach(itemKey => {
      const item = this.surveyDef.surveyItems[itemKey];
      if (item.displayConditions !== undefined && (item.displayConditions.root || item.displayConditions.components)) {
        itemsWithDisplayConditions.push(itemKey);
      }
    });

    this.cache = {
      validations: {
        itemsWithValidations: itemsWithValidations,
      },
      displayConditions: {
        itemsWithDisplayConditions: itemsWithDisplayConditions,
        values: {},
      },
    };
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
    if (fullComponentKey) {
      const displayConditionResult = this.cache.displayConditions.values[fullItemKey]?.components?.[fullComponentKey];
      return displayConditionResult !== undefined ? displayConditionResult : true;
    }
    const displayConditionResult = this.cache.displayConditions.values[fullItemKey]?.root;
    return displayConditionResult !== undefined ? displayConditionResult : true;
  }

  private sequentialRender(groupDef: GroupItem, parent: RenderedSurveyItem): RenderedSurveyItem {
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

    return this.sequentialRender(groupDef, parent);
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
