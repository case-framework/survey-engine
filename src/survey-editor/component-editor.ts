import { DisplayComponent, ItemComponent, ItemComponentType, ScgMcgOption, ScgMcgOptionBase } from "../data_types";
import { Content } from "../survey/utils/content";
import { Locale } from "../survey/utils";
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

  updateContent(locale: Locale, content?: Content, contentKey?: string): void {
    this._itemEditor.updateComponentTranslations({ componentFullKey: this._component.key.fullKey, contentKey }, locale, content)
  }

  // TODO: add, update, delete display condition
}


export class DisplayComponentEditor extends ComponentEditor {
  constructor(itemEditor: SurveyItemEditor, component: DisplayComponent) {
    super(itemEditor, component);
  }
}


export abstract class ScgMcgOptionBaseEditor extends ComponentEditor {
  constructor(itemEditor: SurveyItemEditor, component: ScgMcgOptionBase) {
    super(itemEditor, component);
  }

  static fromOption(itemEditor: SurveyItemEditor, option: ScgMcgOptionBase): ScgMcgOptionBaseEditor {
    switch (option.componentType) {
      case ItemComponentType.ScgMcgOption:
        return new ScgMcgOptionEditor(itemEditor, option as ScgMcgOption);
      default:
        throw new Error(`Unsupported option type: ${option.componentType}`);
    }
  }
  // TODO: update option key
  // TODO: add validation
  // TODO: add dynamic value
  // TODO: add disabled condition
}

export class ScgMcgOptionEditor extends ScgMcgOptionBaseEditor {
  constructor(itemEditor: SurveyItemEditor, component: ScgMcgOption) {
    super(itemEditor, component);
  }


  // TODO: update option type specific properties

}
