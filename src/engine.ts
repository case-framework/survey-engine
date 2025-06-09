import {
  SurveyContext,
  TimestampType,
  SurveyItemResponse,
  SurveyItem,
  SurveySingleItemResponse,
  Survey,
  ResponseMeta,
  SurveyItemType,
  QuestionItem,
  GroupItem,
  SurveyItemKey,
} from "./data_types";

// import { ExpressionEval } from "./expression-eval";
import { Locale } from 'date-fns';
import { enUS } from 'date-fns/locale';
export type ScreenSize = "small" | "large";

const initMeta: ResponseMeta = {
  rendered: [],
  displayed: [],
  responded: [],
  position: -1,
  localeCode: '',
}

interface RenderedSurveyItem {
  key: SurveyItemKey;
  type: SurveyItemType;
  items?: Array<RenderedSurveyItem>
}

export class SurveyEngineCore {
  private surveyDef: Survey;
  private renderedSurveyTree: RenderedSurveyItem;
  private context: SurveyContext;

  private responses: {
    [itemKey: string]: SurveyItemResponse;
  };
  private prefills?: {
    [itemKey: string]: SurveySingleItemResponse;
  };
  private _openedAt: number;
  private selectedLocale: string;
  private availableLocales: string[];
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
    prefills?: SurveySingleItemResponse[],
    showDebugMsg?: boolean,
    selectedLocale?: string,
    dateLocales?: Array<{ code: string, locale: Locale }>,
  ) {
    // console.log('core engine')
    //this.evalEngine = new ExpressionEval();
    this._openedAt = Date.now();


    this.surveyDef = survey;
    this.availableLocales = this.surveyDef.translations ? Object.keys(this.surveyDef.translations) : [];

    this.context = context ? context : {};
    this.prefills = prefills ? prefills.reduce((acc, p) => {
      acc[p.key] = p;
      return acc;
    }, {} as { [itemKey: string]: SurveySingleItemResponse }) : undefined;

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

  /*
  TODO:
  setResponse(targetKey: string, response?: ResponseItem) {
    const target = this.findResponseItem(targetKey);
    if (!target) {
      console.error('setResponse: cannot find target object for key: ' + targetKey);
      return;
    }
    if (isSurveyGroupItemResponse(target)) {
      console.error('setResponse: object is a response group - not defined: ' + targetKey);
      return;
    }
    target.response = response;
    this.setTimestampFor('responded', targetKey);

    // Re-render whole tree
    // TODO: this.reRenderGroup(this.renderedSurvey.key);
  } */

  get openedAt(): number {
    return this._openedAt;
  }

  /* getRenderedSurvey(): SurveyGroupItem {
    // TODO: return this.renderedSurvey;
    return {
      ...this.renderedSurvey,
      items: this.renderedSurvey.items.slice()
    }
  };; */

  /* getSurveyPages(size?: ScreenSize): SurveySingleItem[][] {
    const renderedSurvey = flattenSurveyItemTree(this.getRenderedSurvey());
    const pages = new Array<SurveySingleItem[]>();

    if (!size) {
      size = 'large';
    }

    let currentPage: SurveySingleItem[] = [];

    renderedSurvey.forEach(item => {
      if (item.type === 'pageBreak') {
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
  } */

  /*  TODO: questionDisplayed(itemKey: string, localeCode?: string) {
      this.setTimestampFor('displayed', itemKey, localeCode);
    } */

  /*
  TODO:
  getSurveyEndItem(): SurveySingleItem | undefined {
    const renderedSurvey = flattenSurveyItemTree(this.getRenderedSurvey());
    return renderedSurvey.find(item => item.type === 'surveyEnd');
  } */

  getResponses(): SurveySingleItemResponse[] {
    return [];
    // TODO:
    /* const itemsInOrder = flattenSurveyItemTree(this.renderedSurvey);
    const responses: SurveySingleItemResponse[] = [];
    itemsInOrder.forEach((item, index) => {
      if (item.type === 'pageBreak' || item.type === 'surveyEnd') {
        return;
      }
      const obj = this.findResponseItem(item.key);
      if (!obj) {
        return;
      }
      if (!obj.meta) {
        obj.meta = { ...initMeta };
      }
      if (item.confidentialMode) {
        obj.meta = { ...initMeta }; // reset meta
        (obj as SurveySingleItemResponse).confidentialMode = item.confidentialMode;
        (obj as SurveySingleItemResponse).mapToKey = item.mapToKey
      }
      obj.meta.position = index;
      responses.push({ ...obj });
    })
    return responses; */
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

    Object.keys(items).forEach((itemKey) => {
      const item = items[itemKey];
      if (
        item.itemType === SurveyItemType.Group ||
        item.itemType === SurveyItemType.PageBreak ||
        item.itemType === SurveyItemType.SurveyEnd
      ) {
        return;
      } else {
        respGroup[itemKey] = {
          key: itemKey,
          meta: {
            rendered: [],
            displayed: [],
            responded: [],
            position: -1,
            localeCode: '',
          },
          response: this.prefills?.[itemKey]?.response,
        };
      }
    });

    return respGroup;
  }

  private shouldRenderItem(fullItemKey: string): boolean {
    const displayConditionResult = this.cache.displayConditions.values[fullItemKey]?.root;
    return displayConditionResult !== undefined ? displayConditionResult : true;
  }

  private sequentialRender(groupDef: GroupItem, parent: RenderedSurveyItem): RenderedSurveyItem {
    const newItems: RenderedSurveyItem[] = [];

    for (const fullItemKey of groupDef.items || []) {
      const shouldRender = this.shouldRenderItem(fullItemKey);
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

      const renderedItem = {
        key: itemDef.key,
        type: itemDef.itemType,
      }
      newItems.push(renderedItem);
    }

    return {
      key: groupDef.key,
      type: SurveyItemType.Group,
      items: newItems
    };
  }

  private randomizedItemRender(groupDef: GroupItem, parent: RenderedSurveyItem): RenderedSurveyItem {
    const newItems: RenderedSurveyItem[] = parent.items?.filter(rItem =>
      this.shouldRenderItem(rItem.key.fullKey)
    ) || [];

    const itemKeys = groupDef.items || [];
    const shuffledIndices = Array.from({ length: itemKeys.length }, (_, i) => i);

    // Fisher-Yates shuffle algorithm
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }

    for (const index of shuffledIndices) {
      const fullItemKey = itemKeys[index];
      const alreadyRenderedItem = parent.items?.find(rItem => rItem.key.fullKey === fullItemKey);
      if (alreadyRenderedItem) {
        continue;
      }

      const shouldRender = this.shouldRenderItem(fullItemKey);
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

      const renderedItem = {
        key: itemDef.key,
        type: itemDef.itemType,
      }
      newItems.push(renderedItem);
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

  /* TODO: private getNextItem(groupDef: SurveyGroupItem, parent: SurveyGroupItem, lastKey: string, onlyDirectFollower: boolean): SurveyItem | undefined {
    // get unrendered question groups only
    const availableItems = groupDef.items.filter(ai => {
      return !parent.items.some(item => item.key === ai.key) && this.evalConditions(ai.condition);
    });

    if ((!lastKey || lastKey.length <= 0) && onlyDirectFollower) {
      console.warn('getNextItem: missing input argument for lastKey');
      return;
    }
    const followUpItems = availableItems.filter(item => item.follows && item.follows.includes(lastKey));

    if (followUpItems.length > 0) {
      return SelectionMethod.pickAnItem(followUpItems, groupDef.selectionMethod);
    } else if (onlyDirectFollower) {
      return;
    }

    const groupPool = availableItems.filter(item => !item.follows || item.follows.length < 1);
    if (groupPool.length < 1) {
      return;
    }

    return SelectionMethod.pickAnItem(groupPool, groupDef.selectionMethod);
  } */

  /* TODO: private addRenderedItem(item: SurveyItem, parent: SurveyGroupItem, atPosition?: number): number {
    let renderedItem: SurveyItem = {
      ...item
    };

    if (isSurveyGroupItem(item)) {
      (renderedItem as SurveyGroupItem).items = [];
    } else {
      renderedItem = this.renderSingleSurveyItem(item);
    }

    if (atPosition === undefined || atPosition < 0) {
      parent.items.push(renderedItem);
      this.setTimestampFor('rendered', renderedItem.key);
      return parent.items.length - 1;
    }
    parent.items.splice(atPosition, 0, renderedItem);
    this.setTimestampFor('rendered', renderedItem.key);
    return atPosition;
  } */

  private setTimestampFor(type: TimestampType, itemID: string, localeCode?: string) {
    const obj = this.getResponseItem(itemID);
    if (!obj) {
      return;
    }
    if (!obj.meta) {
      obj.meta = { ...initMeta };
    }
    if (localeCode) {
      obj.meta.localeCode = localeCode;
    }

    const timestampLimit = 100;

    switch (type) {
      case 'rendered':
        obj.meta.rendered.push(Date.now());
        if (obj.meta.rendered.length > timestampLimit) {
          obj.meta.rendered.splice(0, 1);
        }
        break;
      case 'displayed':
        obj.meta.displayed.push(Date.now());
        if (obj.meta.displayed.length > timestampLimit) {
          obj.meta.displayed.splice(0, 1);
        }
        break;
      case 'responded':
        obj.meta.responded.push(Date.now());
        if (obj.meta.responded.length > timestampLimit) {
          obj.meta.responded.splice(0, 1);
        }
        break;
    }
  }

  /* TODO: findSurveyDefItem(itemID: string): SurveyItem | undefined {
    const ids = itemID.split('.');
    let obj: SurveyItem | undefined;
    let compID = '';
    ids.forEach(id => {
      if (compID === '') {
        compID = id;
      } else {
        compID += '.' + id;
      }
      if (!obj) {
        if (compID === this.surveyDef.surveyDefinition.key) {
          obj = this.surveyDef.surveyDefinition;
        }
        return;
      }
      if (!isSurveyGroupItem(obj)) {
        return;
      }
      const ind = obj.items.findIndex(item => item.key === compID);
      if (ind < 0) {
        if (this.showDebugMsg) {
          console.warn('findSurveyDefItem: cannot find object for : ' + compID);
        }
        obj = undefined;
        return;
      }
      obj = obj.items[ind];

    });
    return obj;
  } */

  /* TODO: findRenderedItem(itemID: string): SurveyItem | undefined {
     const ids = itemID.split('.');
     let obj: SurveyItem | undefined;
     let compID = '';
     ids.forEach(id => {
       if (compID === '') {
         compID = id;
       } else {
         compID += '.' + id;
       }
       if (!obj) {
         if (compID === this.renderedSurvey.key) {
           obj = this.renderedSurvey;
         }
         return;
       }
       if (!isSurveyGroupItem(obj)) {
         return;
       }
       const ind = obj.items.findIndex(item => item.key === compID);
       if (ind < 0) {
         if (this.showDebugMsg) {
           console.warn('findRenderedItem: cannot find object for : ' + compID);
         }
         obj = undefined;
         return;
       }
       obj = obj.items[ind];

     });
     return obj;
   } */

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
