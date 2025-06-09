import { Expression } from './expression';
import { JsonSurveyDisplayItem, JsonSurveyEndItem, JsonSurveyItem, JsonSurveyItemGroup, JsonSurveyPageBreakItem, JsonSurveyResponseItem } from './survey-file-schema';
import { SurveyItemKey } from './item-component-key';
import { DisplayComponent, ItemComponent, SingleChoiceResponseConfigComponent } from './survey-item-component';
import { DynamicValue, Validation } from './utils';

export enum ConfidentialMode {
  Add = 'add',
  Replace = 'replace'
}

export interface SurveyItemTranslations {
  [locale: string]: {
    [key: string]: string;
  }
}

export enum SurveyItemType {
  Group = 'group',
  Display = 'display',
  PageBreak = 'pageBreak',
  SurveyEnd = 'surveyEnd',

  SingleChoiceQuestion = 'singleChoiceQuestion',
  MultipleChoiceQuestion = 'multipleChoiceQuestion',
}


export abstract class SurveyItem {
  key!: SurveyItemKey;
  itemType!: SurveyItemType;
  metadata?: {
    [key: string]: string;
  }

  follows?: Array<string>;
  priority?: number; // can be used to sort items in the list
  displayConditions?: {
    root?: Expression;
    components?: {
      [componentKey: string]: Expression;
    }
  }
  protected _dynamicValues?: {
    [dynamicValueKey: string]: DynamicValue;
  }
  protected _disabledConditions?: {
    components?: {
      [componentKey: string]: Expression;
    }
  }
  protected _validations?: {
    [validationKey: string]: Validation;
  }

  constructor(itemFullKey: string, itemType: SurveyItemType) {
    this.key = SurveyItemKey.fromFullKey(itemFullKey);
    this.itemType = itemType;
  }

  abstract toJson(): JsonSurveyItem

  static fromJson(key: string, json: JsonSurveyItem): SurveyItem {
    return initItemClassBasedOnType(key, json);
  }

  get dynamicValues(): {
    [dynamicValueKey: string]: DynamicValue;
  } | undefined {
    return this._dynamicValues;
  }
}

const initItemClassBasedOnType = (key: string, json: JsonSurveyItem): SurveyItem => {
  switch (json.itemType) {
    case SurveyItemType.Group:
      return GroupItem.fromJson(key, json as JsonSurveyItemGroup);
    case SurveyItemType.Display:
      return DisplayItem.fromJson(key, json as JsonSurveyDisplayItem);
    case SurveyItemType.PageBreak:
      return PageBreakItem.fromJson(key, json as JsonSurveyPageBreakItem);
    case SurveyItemType.SurveyEnd:
      return SurveyEndItem.fromJson(key, json as JsonSurveyEndItem);
    default:
      throw new Error(`Unsupported item type for initialization: ${json.itemType}`);
  }
}

export class GroupItem extends SurveyItem {
  itemType: SurveyItemType.Group = SurveyItemType.Group;
  items?: Array<string>;
  selectionMethod?: Expression; // what method to use to pick next item if ambigous - default uniform random

  constructor(itemFullKey: string) {
    super(
      itemFullKey,
      SurveyItemType.Group
    );
  }


  static fromJson(key: string, json: JsonSurveyItemGroup): GroupItem {
    const group = new GroupItem(key);
    group.items = json.items;

    group.selectionMethod = json.selectionMethod;
    group.metadata = json.metadata;

    group.follows = json.follows;
    group.priority = json.priority;
    group.displayConditions = json.displayConditions;
    return group;
  }

  toJson(): JsonSurveyItemGroup {
    return {
      itemType: SurveyItemType.Group,
      items: this.items,
      selectionMethod: this.selectionMethod,
      metadata: this.metadata,
      follows: this.follows,
      priority: this.priority,
      displayConditions: this.displayConditions,
    }
  }
}

export class DisplayItem extends SurveyItem {
  itemType: SurveyItemType.Display = SurveyItemType.Display;
  components?: Array<DisplayComponent>;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.Display);
  }

  static fromJson(key: string, json: JsonSurveyDisplayItem): DisplayItem {
    const item = new DisplayItem(key);
    item.components = json.components?.map(component => DisplayComponent.fromJson(component, undefined, item.key.fullKey));
    item.follows = json.follows;
    item.metadata = json.metadata;
    item.priority = json.priority;
    item.displayConditions = json.displayConditions;
    item._dynamicValues = json.dynamicValues;
    return item;
  }

  toJson(): JsonSurveyDisplayItem {
    return {
      itemType: SurveyItemType.Display,
      components: this.components?.map(component => component.toJson()) ?? [],
      follows: this.follows,
      metadata: this.metadata,
      priority: this.priority,
      displayConditions: this.displayConditions,
      dynamicValues: this._dynamicValues,
    }
  }
}

export class PageBreakItem extends SurveyItem {
  itemType: SurveyItemType.PageBreak = SurveyItemType.PageBreak;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.PageBreak);
  }

  static fromJson(key: string, json: JsonSurveyPageBreakItem): PageBreakItem {
    const item = new PageBreakItem(key);
    item.metadata = json.metadata;
    item.priority = json.priority;
    item.follows = json.follows;
    item.displayConditions = json.displayConditions;
    return item;
  }

  toJson(): JsonSurveyPageBreakItem {
    return {
      itemType: SurveyItemType.PageBreak,
      metadata: this.metadata,
      priority: this.priority,
      follows: this.follows,
      displayConditions: this.displayConditions,
    }
  }
}

export class SurveyEndItem extends SurveyItem {
  itemType: SurveyItemType.SurveyEnd = SurveyItemType.SurveyEnd;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.SurveyEnd);
  }

  static fromJson(key: string, json: JsonSurveyEndItem): SurveyEndItem {
    const item = new SurveyEndItem(key);
    item.metadata = json.metadata;
    item.priority = json.priority;
    item.follows = json.follows;
    item.displayConditions = json.displayConditions;
    item._dynamicValues = json.dynamicValues;
    return item;
  }

  toJson(): JsonSurveyEndItem {
    return {
      itemType: SurveyItemType.SurveyEnd,
      metadata: this.metadata,
      priority: this.priority,
      follows: this.follows,
      displayConditions: this.displayConditions,
      dynamicValues: this._dynamicValues,
    }
  }
}

export abstract class QuestionItem extends SurveyItem {
  header?: {
    title?: DisplayComponent;
    subtitle?: DisplayComponent;
    helpPopover?: DisplayComponent;
  }
  body?: {
    topContent?: Array<DisplayComponent>;
    bottomContent?: Array<DisplayComponent>;
  }
  footer?: DisplayComponent;
  confidentiality?: {
    mode: ConfidentialMode;
    mapToKey?: string;
  }

  abstract responseConfig: ItemComponent;

  protected readGenericAttributes(json: JsonSurveyResponseItem) {
    this.metadata = json.metadata;
    this.priority = json.priority;
    this.follows = json.follows;
    this.displayConditions = json.displayConditions;
    this._dynamicValues = json.dynamicValues;

    this.header = {
      title: json.header?.title ? DisplayComponent.fromJson(json.header?.title, undefined, this.key.parentFullKey) : undefined,
      subtitle: json.header?.subtitle ? DisplayComponent.fromJson(json.header?.subtitle, undefined, this.key.parentFullKey) : undefined,
      helpPopover: json.header?.helpPopover ? DisplayComponent.fromJson(json.header?.helpPopover, undefined, this.key.parentFullKey) : undefined,
    }

    this.body = {
      topContent: json.body?.topContent?.map(component => DisplayComponent.fromJson(component, undefined, this.key.parentFullKey)),
      bottomContent: json.body?.bottomContent?.map(component => DisplayComponent.fromJson(component, undefined, this.key.parentFullKey)),
    }

    this.footer = json.footer ? DisplayComponent.fromJson(json.footer, undefined, this.key.parentFullKey) : undefined;
    this.confidentiality = json.confidentiality;
  }

  toJson(): JsonSurveyResponseItem {
    const json: JsonSurveyResponseItem = {
      itemType: this.itemType,
      responseConfig: this.responseConfig.toJson(),
      metadata: this.metadata,
      priority: this.priority,
      follows: this.follows,
      displayConditions: this.displayConditions,
      dynamicValues: this._dynamicValues,
    }

    json.header = {
      title: this.header?.title?.toJson(),
      subtitle: this.header?.subtitle?.toJson(),
      helpPopover: this.header?.helpPopover?.toJson(),
    }

    json.body = {
      topContent: this.body?.topContent?.map(component => component.toJson()),
      bottomContent: this.body?.bottomContent?.map(component => component.toJson()),
    }

    json.footer = this.footer?.toJson();
    json.confidentiality = this.confidentiality;

    return json;
  }

  get validations(): {
    [validationKey: string]: Validation;
  } | undefined {
    return this._validations;
  }
}

export class SingleChoiceQuestionItem extends QuestionItem {
  itemType: SurveyItemType.SingleChoiceQuestion = SurveyItemType.SingleChoiceQuestion;
  responseConfig!: SingleChoiceResponseConfigComponent;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.SingleChoiceQuestion);
  }

  static fromJson(key: string, json: JsonSurveyResponseItem): SingleChoiceQuestionItem {
    const item = new SingleChoiceQuestionItem(key);

    item.responseConfig = SingleChoiceResponseConfigComponent.fromJson(json.responseConfig, undefined, item.key.parentFullKey);

    item.readGenericAttributes(json);
    return item;
  }
}

