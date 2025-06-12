import { Expression } from "../../data_types/expression";
import { ItemComponentKey } from "../../data_types/item-component-key";
import { JsonItemComponent } from "../survey-file-schema";


// ----------------------------------------------------------------------



export enum ItemComponentType {
  Display = 'display',
  Group = 'group',

  SingleChoice = 'scg',
  MultipleChoice = 'mcg',

  ScgMcgOption = 'scgMcgOption',
  ScgMcgOptionWithTextInput = 'scgMcgOptionWithTextInput',
  ScgMcgOptionWithNumberInput = 'scgMcgOptionWithNumberInput',
  ScgMcgOptionWithDateInput = 'scgMcgOptionWithDateInput',
  ScgMcgOptionWithTimeInput = 'scgMcgOptionWithTimeInput',
  ScgMcgOptionWithDropdown = 'scgMcgOptionWithDropdown',
  ScgMcgOptionWithCloze = 'scgMcgOptionWithCloze',

}

// Union type for all ScgMcg option types
export type ScgMcgOptionTypes =
  | ItemComponentType.ScgMcgOption
  | ItemComponentType.ScgMcgOptionWithTextInput
  | ItemComponentType.ScgMcgOptionWithNumberInput
  | ItemComponentType.ScgMcgOptionWithDateInput
  | ItemComponentType.ScgMcgOptionWithTimeInput
  | ItemComponentType.ScgMcgOptionWithDropdown
  | ItemComponentType.ScgMcgOptionWithCloze;

/*
TODO: remove this when not needed anymore:
key: string; // unique identifier
  type: string; // type of the component
  styles?: {
    classNames?: string | {
      [key: string]: string;
    }
  }
  properties?: {
    [key: string]: string | number | ExpressionArg;
  }
  items?: Array<JsonItemComponent>;*/


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

/**
 * Display component
 */
export class DisplayComponent extends ItemComponent {
  componentType: ItemComponentType.Display = ItemComponentType.Display;

  constructor(compKey: string, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined) {
    super(
      compKey,
      parentFullKey,
      ItemComponentType.Display,
      parentItemKey,
    );
  }

  static fromJson(json: JsonItemComponent, parentFullKey: string | undefined = undefined, parentItemKey: string | undefined = undefined): DisplayComponent {
    const componentKey = ItemComponentKey.fromFullKey(json.key).componentKey;
    const display = new DisplayComponent(componentKey, parentFullKey, parentItemKey);
    display.styles = json.styles;
    return display;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.Display,
      styles: this.styles,
    }
  }
}


export class ScgMcgChoiceResponseConfig extends ItemComponent {
  componentType: ItemComponentType.SingleChoice = ItemComponentType.SingleChoice;
  options: Array<ScgMcgOptionBase>;
  order?: Expression;


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
    // TODO: parse single choice response config properties
    return singleChoice;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.SingleChoice,
      items: this.options.map(option => option.toJson()),
      styles: this.styles,
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



// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------




