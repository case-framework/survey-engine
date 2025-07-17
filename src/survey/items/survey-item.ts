import { JsonSurveyDisplayItem, JsonSurveyEndItem, JsonSurveyItem, JsonSurveyItemGroup, JsonSurveyPageBreakItem, JsonSurveyQuestionItem } from './survey-item-json';
import { SurveyItemKey } from '../item-component-key';
import { TemplateValueDefinition, templateValuesFromJson, templateValuesToJson } from '../../expressions/template-value';
import { Expression } from '../../expressions';
import { DisabledConditions, disabledConditionsFromJson, disabledConditionsToJson, DisplayConditions, displayConditionsFromJson, displayConditionsToJson } from './utils';
import { DisplayComponent, ItemComponent, TextComponent, ScgMcgChoiceResponseConfig } from '../components';
import { ConfidentialMode, SurveyItemType } from './types';
import { ReferenceUsage, ReferenceUsageType } from '../utils';


// ========================================
// SURVEY ITEM BASE CLASS
// ========================================
export abstract class SurveyItem {
  key!: SurveyItemKey;
  itemType!: SurveyItemType;
  metadata?: {
    [key: string]: string;
  }

  displayConditions?: DisplayConditions;
  templateValues?: {
    [templateValueKey: string]: TemplateValueDefinition;
  }
  disabledConditions?: DisabledConditions;
  validations?: {
    [validationKey: string]: Expression | undefined;
  }
  prefillRules?: Array<Expression | undefined>;

  constructor(itemFullKey: string, itemType: SurveyItemType) {
    this.key = SurveyItemKey.fromFullKey(itemFullKey);
    this.itemType = itemType;
  }

  abstract toJson(): JsonSurveyItem

  abstract onComponentKeyChanged(oldKey: string, newKey: string): void;
  onComponentDeleted?(componentFullKey: string): void;
  onItemKeyChanged(newFullKey: string): void {
    this.key = SurveyItemKey.fromFullKey(newFullKey);
  }

  static fromJson(key: string, json: JsonSurveyItem): SurveyItem {
    return initItemClassBasedOnType(key, json);
  }

  getReferenceUsages(): ReferenceUsage[] {
    const usages: ReferenceUsage[] = [];

    if (this.displayConditions) {
      // root
      for (const ref of this.displayConditions.root?.responseVariableRefs || []) {
        usages.push({
          fullItemKey: this.key.fullKey,
          usageType: ReferenceUsageType.displayConditions,
          valueReference: ref,
        });
      }

      // components
      for (const [componentKey, expression] of Object.entries(this.displayConditions.components || {})) {
        for (const ref of expression?.responseVariableRefs || []) {
          usages.push({
            fullItemKey: this.key.fullKey,
            fullComponentKey: componentKey,
            usageType: ReferenceUsageType.displayConditions,
            valueReference: ref,
          });
        }
      }
    }

    if (this.templateValues) {
      for (const [templateValueKey, templateValue] of Object.entries(this.templateValues)) {
        for (const ref of templateValue.expression?.responseVariableRefs || []) {
          usages.push({
            fullItemKey: this.key.fullKey,
            fullComponentKey: templateValueKey,
            usageType: ReferenceUsageType.templateValues,
            valueReference: ref,
          });
        }
      }
    }

    if (this.disabledConditions) {
      for (const [componentKey, expression] of Object.entries(this.disabledConditions.components || {})) {
        for (const ref of expression?.responseVariableRefs || []) {
          usages.push({
            fullItemKey: this.key.fullKey,
            fullComponentKey: componentKey,
            usageType: ReferenceUsageType.disabledConditions,
            valueReference: ref,
          });
        }
      }
    }

    if (this.validations) {
      for (const [validationKey, expression] of Object.entries(this.validations)) {
        for (const ref of expression?.responseVariableRefs || []) {
          usages.push({
            fullItemKey: this.key.fullKey,
            fullComponentKey: validationKey,
            usageType: ReferenceUsageType.validations,
            valueReference: ref,
          });
        }
      }
    }

    return usages;
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
      return SingleChoiceQuestionItem.fromJson(key, json as JsonSurveyQuestionItem);
    case SurveyItemType.MultipleChoiceQuestion:
      return MultipleChoiceQuestionItem.fromJson(key, json as JsonSurveyQuestionItem);
    // TODO: add other question types
    default:
      throw new Error(`Unsupported item type for initialization: ${json.itemType}`);
  }
}


// ========================================
// GROUP ITEM
// ========================================

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
    group.displayConditions = json.displayConditions ? displayConditionsFromJson(json.displayConditions) : undefined;
    return group;
  }

  toJson(): JsonSurveyItemGroup {
    return {
      itemType: SurveyItemType.Group,
      items: this.items,
      shuffleItems: this.shuffleItems,
      metadata: this.metadata,
      displayConditions: this.displayConditions ? displayConditionsToJson(this.displayConditions) : undefined,
    }
  }

  onComponentDeleted(_componentKey: string): void {
    // can be ignored for group item
  }

  onComponentKeyChanged(_componentKey: string, _newKey: string): void {
    // can be ignored for group item
  }
}



// ========================================
// NON QUESTION ITEMS
// ========================================
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
    item.displayConditions = json.displayConditions ? displayConditionsFromJson(json.displayConditions) : undefined;
    item.templateValues = json.templateValues ? templateValuesFromJson(json.templateValues) : undefined;
    return item;
  }

  toJson(): JsonSurveyDisplayItem {
    return {
      itemType: SurveyItemType.Display,
      components: this.components?.map(component => component.toJson()) ?? [],
      metadata: this.metadata,
      displayConditions: this.displayConditions ? displayConditionsToJson(this.displayConditions) : undefined,
      templateValues: this.templateValues ? templateValuesToJson(this.templateValues) : undefined,
    }
  }

  onComponentKeyChanged(oldKey: string, newKey: string): void {
    if (this.components) {
      for (const component of this.components) {
        if (component.key.fullKey === oldKey) {
          component.onComponentKeyChanged(newKey);
          break;
        }
      }
    }
  }

  onComponentDeleted(componentKey: string): void {
    this.components = this.components?.filter(c => c.key.fullKey !== componentKey);
  }

  onItemKeyChanged(newFullKey: string): void {
    this.key = SurveyItemKey.fromFullKey(newFullKey);
    if (this.components) {
      for (const component of this.components) {
        component.onItemKeyChanged(newFullKey);
      }
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
    item.displayConditions = json.displayConditions ? displayConditionsFromJson(json.displayConditions) : undefined;
    return item;
  }

  toJson(): JsonSurveyPageBreakItem {
    return {
      itemType: SurveyItemType.PageBreak,
      metadata: this.metadata,
      displayConditions: this.displayConditions ? displayConditionsToJson(this.displayConditions) : undefined,
    }
  }

  onComponentKeyChanged(_componentKey: string, _newKey: string): void {
    // can be ignored for page break item
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
    item.displayConditions = json.displayConditions ? displayConditionsFromJson(json.displayConditions) : undefined;
    item.templateValues = json.templateValues ? templateValuesFromJson(json.templateValues) : undefined;
    return item;
  }

  toJson(): JsonSurveyEndItem {
    return {
      itemType: SurveyItemType.SurveyEnd,
      metadata: this.metadata,
      displayConditions: this.displayConditions ? displayConditionsToJson(this.displayConditions) : undefined,
      templateValues: this.templateValues ? templateValuesToJson(this.templateValues) : undefined,
    }
  }

  onComponentKeyChanged(_componentKey: string, _newKey: string): void {
    // can be ignored for survey end item
  }
}


// ========================================
// QUESTION ITEMS
// ========================================
export abstract class QuestionItem extends SurveyItem {
  header?: {
    title?: TextComponent;
    subtitle?: TextComponent;
    helpPopover?: TextComponent;
  }
  body?: {
    topContent?: Array<DisplayComponent>;
    bottomContent?: Array<DisplayComponent>;
  }
  footer?: TextComponent;
  confidentiality?: {
    mode: ConfidentialMode;
    mapToKey?: string;
  }

  abstract responseConfig: ItemComponent;

  _readGenericAttributes(json: JsonSurveyQuestionItem) {
    this.metadata = json.metadata;
    this.displayConditions = json.displayConditions ? displayConditionsFromJson(json.displayConditions) : undefined;
    this.disabledConditions = json.disabledConditions ? disabledConditionsFromJson(json.disabledConditions) : undefined;
    this.templateValues = json.templateValues ? templateValuesFromJson(json.templateValues) : undefined;
    this.validations = json.validations ? Object.fromEntries(Object.entries(json.validations).map(([key, value]) => [key, Expression.fromJson(value)])) : undefined;
    this.prefillRules = json.prefillRules ? json.prefillRules.map(rule => rule ? Expression.fromJson(rule) : undefined) : undefined;

    if (json.header) {
      this.header = {
        title: json.header?.title ? DisplayComponent.fromJson(json.header?.title, undefined, this.key.fullKey) as TextComponent : undefined,
        subtitle: json.header?.subtitle ? DisplayComponent.fromJson(json.header?.subtitle, undefined, this.key.fullKey) as TextComponent : undefined,
        helpPopover: json.header?.helpPopover ? DisplayComponent.fromJson(json.header?.helpPopover, undefined, this.key.fullKey) as TextComponent : undefined,
      }
    }

    if (json.body) {
      this.body = {
        topContent: json.body?.topContent?.map(component => DisplayComponent.fromJson(component, undefined, this.key.fullKey)),
        bottomContent: json.body?.bottomContent?.map(component => DisplayComponent.fromJson(component, undefined, this.key.fullKey)),
      }
    }

    this.footer = json.footer ? TextComponent.fromJson(json.footer, undefined, this.key.fullKey) as TextComponent : undefined;
    this.confidentiality = json.confidentiality;
  }

  toJson(): JsonSurveyQuestionItem {
    const json: JsonSurveyQuestionItem = {
      itemType: this.itemType,
      responseConfig: this.responseConfig.toJson(),
      metadata: this.metadata,
      displayConditions: this.displayConditions ? displayConditionsToJson(this.displayConditions) : undefined,
      disabledConditions: this.disabledConditions ? disabledConditionsToJson(this.disabledConditions) : undefined,
      templateValues: this.templateValues ? templateValuesToJson(this.templateValues) : undefined,
      validations: this.validations ? Object.fromEntries(Object.entries(this.validations).map(([key, value]) => [key, value?.toJson()])) : undefined,
      prefillRules: this.prefillRules ? this.prefillRules.map(rule => rule?.toJson()) : undefined,
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

  onComponentKeyChanged(oldKey: string, newKey: string): void {
    if (this.disabledConditions?.components?.[oldKey]) {
      this.disabledConditions.components[newKey] = this.disabledConditions.components[oldKey];
      delete this.disabledConditions.components[oldKey];
    }

    if (this.displayConditions?.components?.[oldKey]) {
      this.displayConditions.components[newKey] = this.displayConditions.components[oldKey];
      delete this.displayConditions.components[oldKey];
    }

    if (this.header?.title?.key.fullKey === oldKey) {
      this.header.title.onComponentKeyChanged(newKey);
      return;
    }
    if (this.header?.subtitle?.key.fullKey === oldKey) {
      this.header.subtitle.onComponentKeyChanged(newKey);
      return;
    }
    if (this.header?.helpPopover?.key.fullKey === oldKey) {
      this.header.helpPopover.onComponentKeyChanged(newKey);
      return;
    }

    for (const component of this.body?.topContent || []) {
      if (component.key.fullKey === oldKey) {
        component.onComponentKeyChanged(newKey);
        break;
      }
    }
    for (const component of this.body?.bottomContent || []) {
      if (component.key.fullKey === oldKey) {
        component.onComponentKeyChanged(newKey);
        break;
      }
    }

    if (this.footer?.key.fullKey === oldKey) {
      this.footer.onComponentKeyChanged(newKey);
      return;
    }

    if (this.responseConfig.key.fullKey === oldKey) {
      this.responseConfig.onComponentKeyChanged(newKey);
      return;
    }
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

    if (this.disabledConditions?.components?.[componentKey]) {
      delete this.disabledConditions.components[componentKey];
    }
  }

  onItemKeyChanged(newFullKey: string): void {
    super.onItemKeyChanged(newFullKey);
    this.responseConfig.onItemKeyChanged(newFullKey);
    if (this.header?.title) {
      this.header.title.onItemKeyChanged(newFullKey);
    }
    if (this.header?.subtitle) {
      this.header.subtitle.onItemKeyChanged(newFullKey);
    }
    if (this.header?.helpPopover) {
      this.header.helpPopover.onItemKeyChanged(newFullKey);
    }
    if (this.body?.topContent) {
      for (const component of this.body.topContent) {
        component.onItemKeyChanged(newFullKey);
      }
    }
    if (this.body?.bottomContent) {
      for (const component of this.body.bottomContent) {
        component.onItemKeyChanged(newFullKey);
      }
    }
    if (this.footer) {
      this.footer.onItemKeyChanged(newFullKey);
    }
  }
}

abstract class ScgMcgQuestionItem extends QuestionItem {
  responseConfig!: ScgMcgChoiceResponseConfig;

  constructor(itemFullKey: string, itemType: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(itemFullKey, itemType);
    this.responseConfig = new ScgMcgChoiceResponseConfig(itemType === SurveyItemType.SingleChoiceQuestion ? 'scg' : 'mcg', undefined, this.key.fullKey);
  }

  onComponentKeyChanged(oldKey: string, newKey: string): void {
    super.onComponentKeyChanged(oldKey, newKey);

    if (oldKey.startsWith(this.responseConfig.key.fullKey)) {
      for (const comp of this.responseConfig.items || []) {
        if (comp.key.fullKey === oldKey) {
          comp.onComponentKeyChanged(newKey);
          break;
        }
      }
    }
  }
}

export class SingleChoiceQuestionItem extends ScgMcgQuestionItem {
  itemType: SurveyItemType.SingleChoiceQuestion = SurveyItemType.SingleChoiceQuestion;
  responseConfig!: ScgMcgChoiceResponseConfig;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.SingleChoiceQuestion);
  }

  static fromJson(key: string, json: JsonSurveyQuestionItem): SingleChoiceQuestionItem {
    const item = new SingleChoiceQuestionItem(key);
    item.responseConfig = ScgMcgChoiceResponseConfig.fromJson(json.responseConfig, undefined, item.key.fullKey);
    item._readGenericAttributes(json);
    return item;
  }
}

export class MultipleChoiceQuestionItem extends ScgMcgQuestionItem {
  itemType: SurveyItemType.MultipleChoiceQuestion = SurveyItemType.MultipleChoiceQuestion;
  responseConfig!: ScgMcgChoiceResponseConfig;

  constructor(itemFullKey: string) {
    super(itemFullKey, SurveyItemType.MultipleChoiceQuestion);
  }

  static fromJson(key: string, json: JsonSurveyQuestionItem): MultipleChoiceQuestionItem {
    const item = new MultipleChoiceQuestionItem(key);
    item.responseConfig = ScgMcgChoiceResponseConfig.fromJson(json.responseConfig, undefined, item.key.fullKey);
    item._readGenericAttributes(json);
    return item;
  }
}
