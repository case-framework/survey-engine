import { Expression } from "../../data_types/expression";
import { ItemComponentKey } from "../item-component-key";
import { JsonItemComponent } from "../survey-file-schema";
import { ExpectedValueType } from "../utils";
import { ValueReference, ValueReferenceMethod } from "../utils/value-reference";
import { DisplayComponentTypes, ItemComponentType, ResponseConfigComponentTypes, ScgMcgOptionTypes } from "./types";


// ========================================
// ITEM COMPONENT BASE CLASS
// ========================================
export abstract class ItemComponent {
  key!: ItemComponentKey;
  componentType!: ItemComponentType;

  styles?: {
    classNames?: string | {
      [key: string]: string;
    }
  }


  constructor(
    compKey: string,
    parentFullKey: string | undefined = undefined,
    componentType: ItemComponentType,
    parentItemKey: string | undefined = undefined,
  ) {
    this.key = new ItemComponentKey(
      compKey,
      parentFullKey,
      parentItemKey ?? '',
    );
    this.componentType = componentType;
  }

  abstract toJson(): JsonItemComponent

  onSubComponentDeleted?(componentKey: string): void;
  onItemKeyChanged(newFullKey: string): void {
    this.key.setParentItemKey(newFullKey);
  }
}

const initComponentClassBasedOnType = (json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ItemComponent => {
  switch (json.type) {
    case ItemComponentType.Group:
      return GroupComponent.fromJson(json as JsonItemComponent, parentFullKey, parentItemKey);
    case ItemComponentType.Text:
    case ItemComponentType.Markdown:
    case ItemComponentType.Info:
    case ItemComponentType.Warning:
    case ItemComponentType.Error:
      return initDisplayComponentBasedOnType(json, parentFullKey, parentItemKey);
    default:
      throw new Error(`Unsupported item type for initialization: ${json.type}`);
  }
}

const initDisplayComponentBasedOnType = (json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): DisplayComponent => {
  const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;

  switch (json.type) {
    case ItemComponentType.Text: {
      const textComp = new TextComponent(componentKey, parentFullKey, parentItemKey);
      textComp.styles = json.styles;
      return textComp;
    }
    case ItemComponentType.Markdown: {
      const markdownComp = new MarkdownComponent(componentKey, parentFullKey, parentItemKey);
      markdownComp.styles = json.styles;
      return markdownComp;
    }
    case ItemComponentType.Info: {
      const infoComp = new InfoComponent(componentKey, parentFullKey, parentItemKey);
      infoComp.styles = json.styles;
      return infoComp;
    }
    case ItemComponentType.Warning: {
      const warningComp = new WarningComponent(componentKey, parentFullKey, parentItemKey);
      warningComp.styles = json.styles;
      return warningComp;
    }
    case ItemComponentType.Error: {
      const errorComp = new ErrorComponent(componentKey, parentFullKey, parentItemKey);
      errorComp.styles = json.styles;
      return errorComp;
    }
    default:
      throw new Error(`Unsupported display component type for initialization: ${json.type}`);
  }
}


/**
 * Group component
 */
export class GroupComponent extends ItemComponent {
  componentType: ItemComponentType.Group = ItemComponentType.Group;
  items?: Array<ItemComponent>;
  order?: Expression;


  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(
      compKey,
      parentFullKey,
      ItemComponentType.Group,
      parentItemKey,
    );
  }


  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): GroupComponent {
    const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;
    const group = new GroupComponent(componentKey, parentFullKey, parentItemKey);
    group.items = json.items?.map(item => initComponentClassBasedOnType(item, group.key.fullKey, group.key.parentItemKey.fullKey));
    group.styles = json.styles;
    return group;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.Group,
      items: this.items?.map(item => item.toJson()),
      styles: this.styles,
    }
  }

  onSubComponentDeleted(componentKey: string): void {
    this.items = this.items?.filter(item => item.key.fullKey !== componentKey);
    this.items?.forEach(item => {
      if (componentKey.startsWith(item.key.fullKey)) {
        item.onSubComponentDeleted?.(componentKey);
      }
    });
  }

  onItemKeyChanged(newFullKey: string): void {
    super.onItemKeyChanged(newFullKey);
    this.items?.forEach(item => {
      item.onItemKeyChanged(newFullKey);
    });
  }
}


// ========================================
// DISPLAY COMPONENTS
// ========================================
export class DisplayComponent extends ItemComponent {
  componentType!: DisplayComponentTypes;

  constructor(
    type: DisplayComponentTypes,
    compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(
      compKey,
      parentFullKey,
      type,
      parentItemKey,
    );
  }

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): DisplayComponent {
    return initDisplayComponentBasedOnType(json, parentFullKey, parentItemKey);
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: this.componentType,
      styles: this.styles,
    }
  }
}

export class TextComponent extends DisplayComponent {
  componentType: ItemComponentType.Text = ItemComponentType.Text;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(ItemComponentType.Text, compKey, parentFullKey, parentItemKey);
  }
}

export class MarkdownComponent extends DisplayComponent {
  componentType: ItemComponentType.Markdown = ItemComponentType.Markdown;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(ItemComponentType.Markdown, compKey, parentFullKey, parentItemKey);
  }
}

export class InfoComponent extends DisplayComponent {
  componentType: ItemComponentType.Info = ItemComponentType.Info;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(ItemComponentType.Info, compKey, parentFullKey, parentItemKey);
  }
}

export class WarningComponent extends DisplayComponent {
  componentType: ItemComponentType.Warning = ItemComponentType.Warning;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(ItemComponentType.Warning, compKey, parentFullKey, parentItemKey);
  }
}

export class ErrorComponent extends DisplayComponent {
  componentType: ItemComponentType.Error = ItemComponentType.Error;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(ItemComponentType.Error, compKey, parentFullKey, parentItemKey);
  }
}

// ========================================
// RESPONSE CONFIG COMPONENTS
// ========================================

export type ValueRefTypeLookup = {
  [valueRefString: string]: ExpectedValueType;
}

export abstract class ResponseConfigComponent extends ItemComponent {
  constructor(
    type: ResponseConfigComponentTypes,
    compKey: string,
    parentFullKey: string | undefined = undefined,
    parentItemKey: string | undefined = undefined,
  ) {
    super(compKey, parentFullKey, type, parentItemKey);
  }

  abstract toJson(): JsonItemComponent;

  abstract get valueReferences(): ValueRefTypeLookup;
}


// ========================================
// SCG/MCG COMPONENTS
// ========================================
export class ScgMcgChoiceResponseConfig extends ResponseConfigComponent {
  componentType: ItemComponentType.SingleChoice = ItemComponentType.SingleChoice;
  options: Array<ScgMcgOptionBase>;
  shuffleItems?: boolean;


  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(
      ItemComponentType.SingleChoice,
      compKey,
      parentFullKey,
      parentItemKey,
    );
    this.options = [];
  }

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ScgMcgChoiceResponseConfig {
    // Extract component key from full key
    const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;
    const singleChoice = new ScgMcgChoiceResponseConfig(componentKey, parentFullKey, parentItemKey);
    singleChoice.options = json.items?.map(item => ScgMcgOptionBase.fromJson(item, singleChoice.key.fullKey, singleChoice.key.parentItemKey.fullKey)) ?? [];
    singleChoice.styles = json.styles;
    singleChoice.shuffleItems = json.properties?.shuffleItems as boolean | undefined;
    return singleChoice;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.SingleChoice,
      items: this.options.map(option => option.toJson()),
      styles: this.styles,
      properties: this.shuffleItems !== undefined ? { shuffleItems: this.shuffleItems } : undefined,
    }
  }

  onSubComponentDeleted(componentKey: string): void {
    this.options = this.options?.filter(option => option.key.fullKey !== componentKey);
    this.options?.forEach(option => {
      if (componentKey.startsWith(option.key.fullKey)) {
        option.onSubComponentDeleted?.(componentKey);
      }
    });
  }

  onItemKeyChanged(newFullKey: string): void {
    super.onItemKeyChanged(newFullKey);
    this.options?.forEach(option => {
      option.onItemKeyChanged(newFullKey);
    });
  }

  get valueReferences(): ValueRefTypeLookup {
    const subSlots = this.options?.reduce((acc, option) => {
      const optionValueRefs = option.valueReferences;
      Object.keys(optionValueRefs).forEach(key => {
        acc[key] = optionValueRefs[key];
      });
      return acc;
    }, {} as ValueRefTypeLookup) ?? {};

    return {
      ...subSlots,
      [ValueReference.fromParts(this.key.parentItemKey, ValueReferenceMethod.get).toString()]: ExpectedValueType.String,
      [ValueReference.fromParts(this.key.parentItemKey, ValueReferenceMethod.isDefined).toString()]: ExpectedValueType.Boolean,
    }
  }
}

export abstract class ScgMcgOptionBase extends ItemComponent {
  componentType!: ScgMcgOptionTypes;

  static fromJson(item: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ScgMcgOptionBase {
    switch (item.type) {
      case ItemComponentType.ScgMcgOption:
        return ScgMcgOption.fromJson(item, parentFullKey, parentItemKey);
      case ItemComponentType.ScgMcgOptionWithTextInput:
        return ScgMcgOptionWithTextInput.fromJson(item, parentFullKey, parentItemKey);

      default:
        throw new Error(`Unsupported item type for initialization: ${item.type}`);
    }
  }

  abstract get valueReferences(): ValueRefTypeLookup;
}

export class ScgMcgOption extends ScgMcgOptionBase {
  componentType: ItemComponentType.ScgMcgOption = ItemComponentType.ScgMcgOption;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(compKey, parentFullKey, ItemComponentType.ScgMcgOption, parentItemKey);
  }

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ScgMcgOption {
    const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;
    const option = new ScgMcgOption(componentKey, parentFullKey, parentItemKey);
    option.styles = json.styles;
    return option;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.ScgMcgOption,
      styles: this.styles,
    }
  }

  get valueReferences(): ValueRefTypeLookup {
    // has no external value references
    return {};
  }
}

export class ScgMcgOptionWithTextInput extends ScgMcgOptionBase {
  componentType: ItemComponentType.ScgMcgOptionWithTextInput = ItemComponentType.ScgMcgOptionWithTextInput;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(compKey, parentFullKey, ItemComponentType.ScgMcgOptionWithTextInput, parentItemKey);
  }

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ScgMcgOptionWithTextInput {
    const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;
    const option = new ScgMcgOptionWithTextInput(componentKey, parentFullKey, parentItemKey);
    option.styles = json.styles;
    return option;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.ScgMcgOptionWithTextInput,
      styles: this.styles,
    }
  }

  get valueReferences(): ValueRefTypeLookup {
    return {
      [ValueReference.fromParts(this.key.parentItemKey, ValueReferenceMethod.get, this.key).toString()]: ExpectedValueType.String,
      [ValueReference.fromParts(this.key.parentItemKey, ValueReferenceMethod.isDefined, this.key).toString()]: ExpectedValueType.Boolean,
    };
  }
}



