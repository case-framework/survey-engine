import { SurveyItemKey } from "./item-component-key";
import { JsonSurveyItemGroup } from "./survey-file-schema";
import { GroupItem, SurveyItem, SurveyItemType } from "./survey-item";

export abstract class SurveyItemEditor extends SurveyItem {
  translations?: {
    [key: string]: {
      [key: string]: string;
    }
  }

  abstract changeItemKey(key: string): void;
  abstract changeParentKey(key: string): void;

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
    const newEditor = new GroupItemEditor(group.key.itemKey, group.key.parentFullKey);
    Object.assign(newEditor, group);
    newEditor.items = group.items?.map(item => initItemEditorClassBasedOnType(item));
    return newEditor;
  }

  changeItemKey(key: string): void {
    this.key = new SurveyItemKey(key, this.key.parentFullKey);
    this.items?.map(item => item.changeParentKey(key));
  }

  changeParentKey(key: string): void {
    this.key = new SurveyItemKey(this.key.itemKey, key);
    this.items?.map(item => item.changeParentKey(key));
  }

  toSurveyItem(): GroupItem {
    console.log('toSurveyItem', this.key.fullKey);
    const group = new GroupItem(this.key.itemKey, this.key.parentFullKey);
    group.items = this.items?.map(item => item.toSurveyItem());
    group.selectionMethod = this.selectionMethod;
    group.metadata = this.metadata;
    group.follows = this.follows;
    group.priority = this.priority;
    console.log('group', group.key.fullKey);
    // TODO: remove translations and dynamic values and validations and display conditions and disabled conditions
    return group;
  }

  toJson(): JsonSurveyItemGroup {
    return this.toSurveyItem().toJson();
  }
}

