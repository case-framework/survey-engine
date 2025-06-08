import { Expression } from './expression';
import { JsonSurveyItem, JsonSurveyItemGroup } from './survey-file-schema';
import { SurveyItemKey } from './item-component-key';


export enum SurveyItemType {
  Group = 'group',
  Display = 'display',
  PageBreak = 'pageBreak',
  SurveyEnd = 'surveyEnd'
}


export abstract class SurveyItem {
  key!: SurveyItemKey;
  itemType!: SurveyItemType;
  metadata?: {
    [key: string]: string;
  }

  follows?: Array<string>;
  priority?: number; // can be used to sort items in the list

  constructor(itemKey: string, parentFullKey: string | undefined = undefined, itemType: SurveyItemType) {
    this.key = new SurveyItemKey(itemKey, parentFullKey);
    this.itemType = itemType;
  }

  abstract toJson(): JsonSurveyItem

}

const initItemClassBasedOnType = (json: JsonSurveyItem, parentFullKey: string | undefined = undefined): SurveyItem => {
  switch (json.itemType) {
    case SurveyItemType.Group:
      return GroupItem.fromJson(json as JsonSurveyItemGroup, parentFullKey);
    default:
      throw new Error(`Unsupported item type for initialization: ${json.itemType}`);
  }
}

export class GroupItem extends SurveyItem {
  itemType: SurveyItemType.Group = SurveyItemType.Group;
  items?: Array<SurveyItem>;
  selectionMethod?: Expression; // what method to use to pick next item if ambigous - default uniform random

  constructor(itemKey: string, parentFullKey: string | undefined = undefined) {
    super(
      itemKey,
      parentFullKey,
      SurveyItemType.Group
    );
  }


  static fromJson(json: JsonSurveyItemGroup, parentFullKey: string | undefined = undefined): GroupItem {
    const group = new GroupItem(json.key, parentFullKey);
    group.items = json.items?.map(item => initItemClassBasedOnType(item, group.key.fullKey));

    group.selectionMethod = json.selectionMethod;
    group.metadata = json.metadata;

    group.follows = json.follows;
    group.priority = json.priority;

    return group;
  }

  toJson(): JsonSurveyItemGroup {
    return {
      key: this.key.itemKey,
      itemType: SurveyItemType.Group,
      items: this.items?.map(item => item.toJson()),
    }
  }
}

/*
export class DisplayItem extends SurveyItem {
  itemType: SurveyItemType.Display = SurveyItemType.Display;
  components?: Array<ItemComponent>;

  constructor(fullItemKey: string) {
    super(fullItemKey, SurveyItemType.Display);
  }

  static fromJson(json: JsonSurveyItemDisplay): DisplayItem {
    const display = new DisplayItem(json.key);

    display.key = new SurveyItemKey(json.key);
    display.components = json.components?.map(component => ItemComponent.fromJson(component));
    return display;
  }

  toJson(): JsonSurveyItemDisplay {
  }
}*/


/**
 * SurveyItemEditor classes are used to edit survey items.
 */

/*
interface SurveyItemBase {
  key: string;
  metadata?: {
    [key: string]: string
  }

  follows?: Array<string>;
  condition?: Expression;
  priority?: number; // can be used to sort items in the list
}

export type SurveyItem = SurveyGroupItem | SurveySingleItem;

// ----------------------------------------------------------------------
export interface SurveyGroupItem extends SurveyItemBase {
  items: Array<SurveyItem>;
  selectionMethod?: Expression; // what method to use to pick next item if ambigous - default uniform random
}

export const isSurveyGroupItem = (item: SurveyItem): item is SurveyGroupItem => {
  const items = (item as SurveyGroupItem).items;
  return items !== undefined && items.length > 0;
}

// ----------------------------------------------------------------------
// Single Survey Items:
export type SurveyItemTypes =
  'pageBreak' | 'test' | 'surveyEnd'
  ;

export interface SurveySingleItem extends SurveyItemBase {
  type?: SurveyItemTypes;
  components?: ItemGroupComponent; // any sub-type of ItemComponent
  validations?: Array<Validation>;
  confidentialMode?: ConfidentialMode;
  mapToKey?: string; // if the response should be mapped to another key in confidential mode
}



export type ConfidentialMode = 'add' | 'replace';
*/
