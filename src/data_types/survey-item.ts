import { Expression } from './expression';
import { JsonSurveyItem, JsonSurveyItemGroup } from './survey-file-schema';
import { SurveyItemKey } from './survey-item-key';


export enum SurveyItemType {
  Group = 'group',
  Display = 'display',
  PageBreak = 'pageBreak',
  SurveyEnd = 'surveyEnd'
}


abstract class SurveyItem {
  key!: SurveyItemKey;
  itemType!: SurveyItemType;
  metadata?: {
    [key: string]: string;
  }

  condition?: Expression;

  follows?: Array<SurveyItemKey>;
  priority?: number; // can be used to sort items in the list

  constructor(fullItemKey: string, itemType: SurveyItemType) {
    this.key = new SurveyItemKey(fullItemKey);
    this.itemType = itemType;
  }

  abstract toJson(): JsonSurveyItem

}

const initItemClassBasedOnType = (json: JsonSurveyItem): SurveyItem => {
  switch (json.itemType) {
    case SurveyItemType.Group:
      return GroupItem.fromJson(json as JsonSurveyItemGroup);
    default:
      throw new Error(`Unsupported item type for initialization: ${json.itemType}`);
  }
}

export class GroupItem extends SurveyItem {
  items?: Array<SurveyItem>;
  selectionMethod?: Expression; // what method to use to pick next item if ambigous - default uniform random

  constructor(fullItemKey: string) {
    super(
      fullItemKey,
      SurveyItemType.Group
    );
  }


  static fromJson(json: JsonSurveyItemGroup): GroupItem {
    const group = new GroupItem(json.key);
    Object.assign(group, json);
    group.key = new SurveyItemKey(json.key);
    group.items = json.items?.map(item => initItemClassBasedOnType(item));
    return group;
  }

  toJson(): JsonSurveyItemGroup {
    return {
      key: this.key.fullKey,
      itemType: SurveyItemType.Group,
      items: this.items?.map(item => item.toJson()),
    }
  }
}


/**
 * SurveyItemEditor classes are used to edit survey items.
 */
abstract class SurveyItemEditor extends SurveyItem {
  translations?: {
    [key: string]: {
      [key: string]: string;
    }
  }

  replaceKey(key: string) {
    this.key = new SurveyItemKey(key);
  }

  abstract toSurveyItem(): SurveyItem;
}



const initItemEditorClassBasedOnType = (item: SurveyItem): SurveyItemEditor => {
  switch (item.itemType) {
    case SurveyItemType.Group:
      return GroupItemEditor.fromSurveyItem(item as GroupItem);
    default:
      throw new Error(`Unsupported item type for editor initialization: ${item.itemType}`);
  }
}

export class GroupItemEditor extends GroupItem {
  items?: Array<SurveyItemEditor>;

  static fromSurveyItem(group: GroupItem): GroupItemEditor {
    // TODO: need translations and dynamic values and validations and display conditions and disabled conditions
    const newEditor = new GroupItemEditor('');
    Object.assign(newEditor, group);
    newEditor.items = group.items?.map(item => initItemEditorClassBasedOnType(item));
    return newEditor;
  }

  replaceKey(key: string) {
    this.key = new SurveyItemKey(key);
    this.items?.map(item => item.replaceKey(item.key.fullKey));
  }

  toSurveyItem(): GroupItem {
    const group = new GroupItem(this.key.fullKey);
    Object.assign(group, this);
    group.items = this.items?.map(item => item.toSurveyItem());
    // TODO: remove translations and dynamic values and validations and display conditions and disabled conditions
    return group;
  }

  toJson(): JsonSurveyItemGroup {
    return this.toSurveyItem().toJson();
  }
}


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
