import { ItemComponentKey } from "../item-component-key";
import { JsonItemComponent } from "./survey-item-component-json";
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

  onParentComponentKeyChanged(newParentFullKey: string): void {
    this.key.setParentComponentFullKey(newParentFullKey);
  }

  onComponentKeyChanged(newComponentKey: string): void {
    this.key = ItemComponentKey.fromFullKey(newComponentKey, this.key.parentItemKey.fullKey);
  }
}

const initDisplayComponentBasedOnType = (json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string): DisplayComponent => {
  const componentKey = ItemComponentKey.fromFullKey(json.key, parentItemKey).componentKey;

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
export abstract class GroupComponent extends ItemComponent {
  items?: Array<ItemComponent>;
  shuffleItems?: boolean;

  constructor(type: ItemComponentType, compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(
      compKey,
      parentFullKey,
      type,
      parentItemKey,
    );
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

  onParentComponentKeyChanged(newParentFullKey: string): void {
    super.onParentComponentKeyChanged(newParentFullKey);
    this.items?.forEach(item => {
      item.onParentComponentKeyChanged(this.key.fullKey);
    });
  }

  onComponentKeyChanged(newComponentKey: string): void {
    super.onComponentKeyChanged(newComponentKey);
    const newFullKey = this.key.fullKey;

    // Update all nested components to have the new parent full key
    this.items?.forEach(item => {
      item.onParentComponentKeyChanged(newFullKey);
    });
  }
}


// ========================================
// DISPLAY COMPONENTS
// ========================================
export class DisplayComponent extends ItemComponent {
  declare componentType: DisplayComponentTypes;

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

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string): DisplayComponent {
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
export class ScgMcgChoiceResponseConfig extends GroupComponent {
  componentType: ItemComponentType.SingleChoice = ItemComponentType.SingleChoice;
  items: Array<ScgMcgOptionBase>;


  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(
      ItemComponentType.SingleChoice,
      compKey,
      parentFullKey,
      parentItemKey,
    );
    this.items = [];
  }

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string): ScgMcgChoiceResponseConfig {
    // Extract component key from full key
    const componentKey = ItemComponentKey.fromFullKey(json.key, parentItemKey).componentKey;
    const singleChoice = new ScgMcgChoiceResponseConfig(componentKey, parentFullKey, parentItemKey);
    singleChoice.items = json.items?.map(item => ScgMcgOptionBase.fromJson(item, singleChoice.key.fullKey, singleChoice.key.parentItemKey.fullKey)) ?? [];
    singleChoice.styles = json.styles;
    singleChoice.shuffleItems = json.properties?.shuffleItems as boolean | undefined;
    return singleChoice;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.SingleChoice,
      items: this.items.map(option => option.toJson()),
      styles: this.styles,
      properties: this.shuffleItems !== undefined ? { shuffleItems: this.shuffleItems } : undefined,
    }
  }

  get valueReferences(): ValueRefTypeLookup {
    const subSlots = this.items?.reduce((acc, option) => {
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
  declare componentType: ScgMcgOptionTypes;

  static fromJson(item: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string): ScgMcgOptionBase {
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

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string): ScgMcgOption {
    const componentKey = ItemComponentKey.fromFullKey(json.key, parentItemKey).componentKey;
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

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string): ScgMcgOptionWithTextInput {
    const componentKey = ItemComponentKey.fromFullKey(json.key, parentItemKey).componentKey;
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



