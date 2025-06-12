import { Expression } from './expression';
import { JsonSurveyDisplayItem, JsonSurveyEndItem, JsonSurveyItem, JsonSurveyItemGroup, JsonSurveyPageBreakItem, JsonSurveyResponseItem } from './survey-file-schema';
import { SurveyItemKey } from './item-component-key';
import { DisplayComponent, ItemComponent, ScgMcgChoiceResponseConfig } from './survey-item-component';
import { DynamicValue, Validation } from './utils';
import { LocalizedContentTranslation } from './localized-content';

export enum ConfidentialMode {
  Add = 'add',
  Replace = 'replace'
}

export interface SurveyItemTranslations {
  [locale: string]: LocalizedContentTranslation
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

  onComponentDeleted?(componentKey: string): void;

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
    case SurveyItemType.SingleChoiceQuestion:
      return SingleChoiceQuestionItem.fromJson(key, json as JsonSurveyResponseItem);
    default:
      throw new Error(`Unsupported item type for initialization: ${json.itemType}`);
  }
}

export class GroupItem extends SurveyItem {
  itemType: SurveyItemType.Group = SurveyItemType.Group;
  items?: Array<string>;
  shuffleItems?: boolean;

  constructor(itemFullKey: string) {
    super(
      itemFullKey,
      SurveyItemType.Group
    );
  }


  static fromJson(key: string, json: JsonSurveyItemGroup): GroupItem {
    const group = new GroupItem(key);
    group.items = json.items;

    group.shuffleItems = json.shuffleItems;
    group.metadata = json.metadata;

    group.displayConditions = json.displayConditions;
    return group;
  }

  toJson(): JsonSurveyItemGroup {
    return {
      itemType: SurveyItemType.Group,
      items: this.items,
      shuffleItems: this.shuffleItems,
      metadata: this.metadata,
      displayConditions: this.displayConditions,
    }
  }

  onComponentDeleted(_componentKey: string): void {
    // can be ignored for group item
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
    item.metadata = json.metadata;
    item.displayConditions = json.displayConditions;
    item._dynamicValues = json.dynamicValues;
    return item;
  }

  toJson(): JsonSurveyDisplayItem {
    return {
      itemType: SurveyItemType.Display,
      components: this.components?.map(component => component.toJson()) ?? [],
      metadata: this.metadata,
      displayConditions: this.displayConditions,
      dynamicValues: this._dynamicValues,
    }
  }

  onComponentDeleted(componentKey: string): void {
    this.components = this.components?.filter(c => c.key.fullKey !== componentKey);
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
    item.displayConditions = json.displayConditions;
    return item;
  }

  toJson(): JsonSurveyPageBreakItem {
    return {
      itemType: SurveyItemType.PageBreak,
      metadata: this.metadata,
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
    item.displayConditions = json.displayConditions;
    item._dynamicValues = json.dynamicValues;
    return item;
  }

  toJson(): JsonSurveyEndItem {
    return {
      itemType: SurveyItemType.SurveyEnd,
      metadata: this.metadata,
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

  _readGenericAttributes(json: JsonSurveyResponseItem) {
    this.metadata = json.metadata;
    this.displayConditions = json.displayConditions;
    this._disabledConditions = json.disabledConditions;
    this._dynamicValues = json.dynamicValues;
    this._validations = json.validations;

    if (json.header) {
      this.header = {
        title: json.header?.title ? DisplayComponent.fromJson(json.header?.title, undefined, this.key.parentFullKey) : undefined,
        subtitle: json.header?.subtitle ? DisplayComponent.fromJson(json.header?.subtitle, undefined, this.key.parentFullKey) : undefined,
        helpPopover: json.header?.helpPopover ? DisplayComponent.fromJson(json.header?.helpPopover, undefined, this.key.parentFullKey) : undefined,
      }
    }

    if (json.body) {
      this.body = {
        topContent: json.body?.topContent?.map(component => DisplayComponent.fromJson(component, undefined, this.key.parentFullKey)),
        bottomContent: json.body?.bottomContent?.map(component => DisplayComponent.fromJson(component, undefined, this.key.parentFullKey)),
      }
    }

    this.footer = json.footer ? DisplayComponent.fromJson(json.footer, undefined, this.key.parentFullKey) : undefined;
    this.confidentiality = json.confidentiality;
  }

  toJson(): JsonSurveyResponseItem {
    const json: JsonSurveyResponseItem = {
      itemType: this.itemType,
      responseConfig: this.responseConfig.toJson(),
      metadata: this.metadata,
      displayConditions: this.displayConditions,
      disabledConditions: this._disabledConditions,
      dynamicValues: this._dynamicValues,
      validations: this._validations,
    }

    if (this.header) {
      json.header = {
        title: this.header?.title?.toJson(),
        subtitle: this.header?.subtitle?.toJson(),
        helpPopover: this.header?.helpPopover?.toJson(),
      }
    }

    if (this.body) {
      json.body = {
        topContent: this.body?.topContent?.map(component => component.toJson()),
        bottomContent: this.body?.bottomContent?.map(component => component.toJson()),
      }
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

  get disabledConditions(): {
    components?: {
      [componentKey: string]: Expression;
    }
  } | undefined {
    return this._disabledConditions;
  }

  set disabledConditions(disabledConditions: {
    components?: {
      [componentKey: string]: Expression;
    }
  } | undefined) {
    this._disabledConditions = disabledConditions;
  }

  onComponentDeleted(componentKey: string): void {
    if (this.header?.title?.key.fullKey === componentKey) {
      this.header.title = undefined;
    }
    if (this.header?.subtitle?.key.fullKey === componentKey) {
      this.header.subtitle = undefined;
    }
    if (this.header?.helpPopover?.key.fullKey === componentKey) {
      this.header.helpPopover = undefined;
    }
    if (this.body?.topContent?.some(c => c.key.fullKey === componentKey)) {
      this.body.topContent = this.body.topContent?.filter(c => c.key.fullKey !== componentKey);
    }
    if (this.body?.bottomContent?.some(c => c.key.fullKey === componentKey)) {
      this.body.bottomContent = this.body.bottomContent?.filter(c => c.key.fullKey !== componentKey);
    }
    if (this.footer?.key.fullKey === componentKey) {
      this.footer = undefined;
    }

    if (componentKey.startsWith(this.responseConfig.key.fullKey)) {
      this.responseConfig.onSubComponentDeleted?.(componentKey);
    }

    if (this.displayConditions?.components?.[componentKey]) {
      delete this.displayConditions.components[componentKey];
    }

    if (this._disabledConditions?.components?.[componentKey]) {
      delete this._disabledConditions.components[componentKey];
    }
  }
}

abstract class ScgMcgQuestionItem extends QuestionItem {
  responseConfig!: ScgMcgChoiceResponseConfig;

  constructor(itemFullKey: string, itemType: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(itemFullKey, itemType);
    this.responseConfig = new ScgMcgChoiceResponseConfig(itemType === SurveyItemType.SingleChoiceQuestion ? 'scg' : 'mcg', undefined, this.key.fullKey);
  }

  static fromJson(key: string, json: JsonSurveyResponseItem): SingleChoiceQuestionItem {
    const item = new SingleChoiceQuestionItem(key);

    item.responseConfig = ScgMcgChoiceResponseConfig.fromJson(json.responseConfig, undefined, item.key.parentFullKey);

    item._readGenericAttributes(json);
    return item;
  }
}

export class SingleChoiceQuestionItem extends ScgMcgQuestionItem {
  itemType: SurveyItemType.SingleChoiceQuestion = SurveyItemType.SingleChoiceQuestion;
  responseConfig!: ScgMcgChoiceResponseConfig;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.SingleChoiceQuestion);
  }


}


export class MultipleChoiceQuestionItem extends ScgMcgQuestionItem {
  itemType: SurveyItemType.MultipleChoiceQuestion = SurveyItemType.MultipleChoiceQuestion;
  responseConfig!: ScgMcgChoiceResponseConfig;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.MultipleChoiceQuestion);
  }
}

