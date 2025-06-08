import { Expression, ExpressionArg } from "./expression";
import { ItemComponentKey } from "./item-component-key";
import { JsonItemComponent } from "./survey-file-schema";
import { SurveyItemType } from "./survey-item";
import { DynamicValue, LocalizedContent, LocalizedContentTranslation } from "./utils";

// ----------------------------------------------------------------------



export enum ItemComponentType {
  Display = 'display',
  Group = 'group',
}

/*
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
    const group = new GroupComponent(json.key, parentFullKey, parentItemKey);
    group.items = json.items?.map(item => initComponentClassBasedOnType(item, group.key.fullKey, group.key.parentItemKey.fullKey));
    group.order = json.order;
    group.styles = json.styles;
    return group;
  }

  toJson(): JsonItemComponent {
    return {
      key: this.key.fullKey,
      type: ItemComponentType.Group,
      items: this.items?.map(item => item.toJson()),
      order: this.order,
      styles: this.styles,
    }
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
    const display = new DisplayComponent(json.key, parentFullKey, parentItemKey);
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






// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------


interface ContentStuffWithAttributions {
  todo: string
}
interface GenericItemComponent {
  // toObject(): ItemComponentObject;
}

interface ItemComponentObject extends JsonItemComponent {
  translations?: {
    [locale: string]: {
      [key: string]: ContentStuffWithAttributions;
    }; // TODO: define type
  };
  dynamicValues?: DynamicValue[];
  displayCondition?: Expression;
  disabled?: Expression;
}

class TitleComponent implements GenericItemComponent {
  key: string;
  styles?: {
    classNames?: string;
  }

  constructor(key: string) {
    this.key = key;
  }

  // TODO: constructor
  // TODO: getters


}

class TitleComponentEditor extends TitleComponent {
  translations?: {
    [locale: string]: {
      [key: string]: ContentStuffWithAttributions;
    };
  }

  dynamicValues?: DynamicValue[];
  displayCondition?: Expression;
  disabled?: Expression;

  // TODO: constructor
  // TODO: setters
}

class ResolvedTitleComponent extends TitleComponent {
  currentTranslation?: {
    [key: string]: ContentStuffWithAttributions;
  } // only translations for selected language
  dynamicValues?: {
    [key: string]: string;
  }
  displayCondition?: boolean;
  disabled?: boolean;

  // TODO: constructor
}

export enum ConfidentialMode {
  Add = 'add',
  Replace = 'replace'
}

export class ResponseComponent implements GenericItemComponent {
  key: string;
  styles?: {
    classNames?: string;
  }

  confidentiality?: {
    mode: ConfidentialMode;
    mapToKey?: string;
  }
  //confidentialMode?: ConfidentialMode;

  constructor(key: string) {
    this.key = key;
  }
}
