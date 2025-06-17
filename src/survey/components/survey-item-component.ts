import { Expression } from "../../data_types/expression";
import { ItemComponentKey } from "../item-component-key";
import { JsonItemComponent } from "../survey-file-schema";
import { DisplayComponentTypes, ItemComponentType } from "./types";


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
}

const initComponentClassBasedOnType = (json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ItemComponent => {
  switch (json.type) {
    case ItemComponentType.Group:
      return GroupComponent.fromJson(json as JsonItemComponent, parentFullKey, parentItemKey);
    default:
      throw new Error(`Unsupported item type for initialization: ${json.type}`);
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
    const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;
    const display = new DisplayComponent(json.type as DisplayComponentTypes, componentKey, parentFullKey, parentItemKey);
    display.styles = json.styles;
    return display;
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
// SCG/MCG COMPONENTS
// ========================================
export class ScgMcgChoiceResponseConfig extends ItemComponent {
  componentType: ItemComponentType.SingleChoice = ItemComponentType.SingleChoice;
  options: Array<ScgMcgOptionBase>;
  shuffleItems?: boolean;


  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(
      compKey,
      parentFullKey,
      ItemComponentType.SingleChoice,
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
}

export abstract class ScgMcgOptionBase extends ItemComponent {
  static fromJson(item: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ScgMcgOptionBase {
    switch (item.type) {
      case ItemComponentType.ScgMcgOption:
        return ScgMcgOption.fromJson(item, parentFullKey, parentItemKey);
      default:
        throw new Error(`Unsupported item type for initialization: ${item.type}`);
    }
  }
}

export class ScgMcgOption extends ScgMcgOptionBase {
  componentType: ItemComponentType.ScgMcgOption = ItemComponentType.ScgMcgOption;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(compKey, parentFullKey, ItemComponentType.ScgMcgOption, parentItemKey);
  }

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): ScgMcgOption {
    const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;
    const option = new ScgMcgOption(componentKey, parentFullKey, parentItemKey);
    return option;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.ScgMcgOption,
    }
  }
}




