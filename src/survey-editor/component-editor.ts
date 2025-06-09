import { DisplayComponent, ItemComponent, ScgMcgOption } from "../data_types";
import { SurveyItemEditor } from "./survey-item-editors";


abstract class ComponentEditor {
  protected _itemEditor: SurveyItemEditor;
  protected _component: ItemComponent;

  constructor(itemEditor: SurveyItemEditor, component: ItemComponent) {
    this._itemEditor = itemEditor;
    this._component = component;
  }

  delete(): void {
    this._itemEditor.deleteComponent(this._component);
  }

}


export class DisplayComponentEditor extends ComponentEditor {
  constructor(itemEditor: SurveyItemEditor, component: DisplayComponent) {
    super(itemEditor, component);
  }
}

export class ScgMcgOptionEditor extends ComponentEditor {
  constructor(itemEditor: SurveyItemEditor, component: ScgMcgOption) {
    super(itemEditor, component);
  }
}