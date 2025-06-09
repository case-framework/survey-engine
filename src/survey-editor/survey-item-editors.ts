import { SurveyItemKey } from "../data_types/item-component-key";
import { SurveyEditor } from "./survey-editor";
import { QuestionItem, SingleChoiceQuestionItem, SurveyItem, SurveyItemType } from "../data_types/survey-item";
import { DisplayComponentEditor } from "./component-editor";
import { DisplayComponent, ItemComponent } from "../data_types";



export abstract class SurveyItemEditor {
  protected readonly _editor: SurveyEditor;
  protected _itemKeyAtOpen: SurveyItemKey;
  protected _type: SurveyItemType;
  protected _currentItem: SurveyItem;

  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType) {
    this._editor = editor;
    this._itemKeyAtOpen = SurveyItemKey.fromFullKey(itemFullKey);
    this._type = type;

    if (!this._editor.survey.surveyItems[itemFullKey]) {
      throw new Error(`Item ${itemFullKey} not found in survey`);
    }

    if (!this._editor.survey.surveyItems[itemFullKey].itemType || this._editor.survey.surveyItems[itemFullKey].itemType !== this._type) {
      throw new Error(`Item ${itemFullKey} is not a ${this._type}`);
    }

    this._currentItem = this._editor.survey.surveyItems[itemFullKey];
  }

  get editor(): SurveyEditor {
    return this._editor;
  }

  deleteComponent(component: ItemComponent): void {
    this._editor.deleteComponent(this._currentItem.key.fullKey, component.key.fullKey);
  }

  abstract convertToType(type: SurveyItemType): void;
}

abstract class QuestionEditor extends SurveyItemEditor {
  protected _currentItem: QuestionItem;

  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(editor, itemFullKey, type);
    this._currentItem = this._editor.survey.surveyItems[itemFullKey] as QuestionItem;
  }

  get title(): DisplayComponentEditor | undefined {
    if (!this._currentItem.header?.title) {
      return new DisplayComponentEditor(this, new DisplayComponent('title', undefined, this._currentItem.key.fullKey))
    }
    return new DisplayComponentEditor(this, this._currentItem.header.title);
  }

}

/**
 * Single choice question and multiple choice question are very similar things, this is the base class for them.
 */
abstract class ScgMcgEditor extends QuestionEditor {
  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(editor, itemFullKey, type);
  }
}

export class SingleChoiceQuestionEditor extends ScgMcgEditor {
  protected _currentItem: SingleChoiceQuestionItem;

  constructor(editor: SurveyEditor, itemFullKey: string) {
    super(editor, itemFullKey, SurveyItemType.SingleChoiceQuestion);
    this._currentItem = this._editor.survey.surveyItems[itemFullKey] as SingleChoiceQuestionItem;
  }

  convertToType(type: SurveyItemType): void {
    switch (type) {
      case SurveyItemType.SingleChoiceQuestion:
        return;
      case SurveyItemType.MultipleChoiceQuestion:
        // TODO: implement
        console.log('convert to multiple choice question');
        return;
      default:
        throw new Error(`Cannot convert ${this._type} to ${type}`);
    }
  }
}
