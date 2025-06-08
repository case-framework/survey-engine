import { SurveyItemKey } from "./item-component-key";
import { JsonSurveyItem } from "./survey-file-schema";
import { DisplayItem, GroupItem, SurveyItem, SurveyItemType } from "./survey-item";
import { DisplayComponent } from "./survey-item-component";

export abstract class SurveyItemEditor extends SurveyItem {
  translations?: {
    [key: string]: {
      [key: string]: string;
    }
  }

  abstract changeItemKey(key: string): void;
  abstract changeParentKey(key: string): void;

  abstract toSurveyItem(): SurveyItem;

  toJson(): JsonSurveyItem {
    return this.toSurveyItem().toJson();
  }
}



const initItemEditorClassBasedOnType = (item: SurveyItem): SurveyItemEditor => {
  switch (item.itemType) {
    case SurveyItemType.Group:
      return GroupItemEditor.fromSurveyItem(item as GroupItem);
    case SurveyItemType.Display:
      return DisplayItemEditor.fromSurveyItem(item as DisplayItem);
    default:
      throw new Error(`Unsupported item type for editor initialization: ${item.itemType}`);
  }
}

export class GroupItemEditor extends GroupItem {
  items?: Array<SurveyItemEditor>;


  changeItemKey(key: string): void {
    this.key = new SurveyItemKey(key, this.key.parentFullKey);
    this.items?.map(item => item.changeParentKey(key));
  }

  changeParentKey(key: string): void {
    this.key = new SurveyItemKey(this.key.itemKey, key);
    this.items?.map(item => item.changeParentKey(key));
  }

  static fromSurveyItem(group: GroupItem): GroupItemEditor {
    // TODO: need translations and dynamic values and validations and display conditions and disabled conditions
    const newEditor = new GroupItemEditor(group.key.itemKey, group.key.parentFullKey);
    Object.assign(newEditor, group);
    newEditor.items = group.items?.map(item => initItemEditorClassBasedOnType(item));
    return newEditor;
  }

  toSurveyItem(): GroupItem {
    const group = new GroupItem(this.key.itemKey, this.key.parentFullKey);
    group.items = this.items?.map(item => item.toSurveyItem());
    group.selectionMethod = this.selectionMethod;
    group.metadata = this.metadata;
    group.follows = this.follows;
    group.priority = this.priority;
    // TODO: remove translations and dynamic values and validations and display conditions and disabled conditions
    return group;
  }
}


export class DisplayItemEditor extends DisplayItem {
  components?: Array<DisplayComponent>;


  changeItemKey(key: string): void {
    this.key = new SurveyItemKey(key, this.key.parentFullKey);
    // TODO: nofify components: this.components?.map(component => component.changeParentKey(key));
  }

  changeParentKey(key: string): void {
    this.key = new SurveyItemKey(this.key.itemKey, key);
    // TODO: nofify components:  this.components?.map(component => component.changeParentKey(key));
  }

  // TODO: add / insert component
  // TODO: change component order
  // TODO: remove component

  static fromSurveyItem(display: DisplayItem): DisplayItemEditor {
    const newEditor = new DisplayItemEditor(display.key.itemKey, display.key.parentFullKey);
    Object.assign(newEditor, display);
    // TODO: init component editors -> newEditor.components = display.components?.map(component => DisplayComponent.fromSurveyItem(component));
    return newEditor;
  }


  toSurveyItem(): DisplayItem {
    const display = new DisplayItem(this.key.itemKey, this.key.parentFullKey);
    // TODO: display.components = this.components?.map(component => component.toSurveyItem());
    return display;
  }
}