import { Expression } from "../expressions";
import { DisplayComponent, ItemComponent, ItemComponentType, ScgMcgOption, ScgMcgOptionBase } from "../survey/components";
import { Content } from "../survey/utils/content";
import { QuestionEditor, SurveyItemEditor } from "./survey-item-editors";


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

  updateContent(locale: string, content?: Content, contentKey?: string): void {
    this._itemEditor.updateComponentTranslations({ componentFullKey: this._component.key.fullKey, contentKey }, locale, content)
  }

  setDisplayCondition(condition: Expression | undefined): void {
    this._itemEditor.setDisplayCondition(condition, this._component.key.fullKey);
  }

  getDisplayCondition(): Expression | undefined {
    return this._itemEditor.getDisplayCondition(this._component.key.fullKey);
  }
}


export class DisplayComponentEditor extends ComponentEditor {
  constructor(itemEditor: SurveyItemEditor, component: DisplayComponent) {
    super(itemEditor, component);
  }
}

// ================================
// Response related components
// ================================

export abstract class ResponseComponentEditor extends ComponentEditor {
  constructor(itemEditor: SurveyItemEditor, component: ItemComponent) {
    super(itemEditor, component);
  }
}


export abstract class ScgMcgOptionBaseEditor extends ResponseComponentEditor {
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


  setDisableCondition(condition: Expression | undefined): void {
    (this._itemEditor as QuestionEditor).setDisableCondition(condition, this._component.key.fullKey);
  }
  getDisableCondition(): Expression | undefined {
    return (this._itemEditor as QuestionEditor).getDisableCondition(this._component.key.fullKey);
  }

  // convienience methods to quickly set validations or template values related to the option
  // TODO: add validation
  // TODO: add template value

}

export class ScgMcgOptionEditor extends ScgMcgOptionBaseEditor {
  constructor(itemEditor: SurveyItemEditor, component: ScgMcgOption) {
    super(itemEditor, component);
  }


  // TODO: update option type specific properties

}
