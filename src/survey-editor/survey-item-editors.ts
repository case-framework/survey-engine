import { SurveyItemKey } from "../data_types/item-component-key";
import { SurveyEditor } from "./survey-editor";
import { MultipleChoiceQuestionItem, QuestionItem, SingleChoiceQuestionItem, SurveyItem, SurveyItemType } from "../survey/items/survey-item";
import { DisplayComponentEditor, ScgMcgOptionBaseEditor } from "./component-editor";
import { DisplayComponent, ItemComponent, ItemComponentType, ScgMcgOption, ScgMcgOptionBase, ScgMcgOptionTypes } from "../data_types";
import { Content } from "../survey/utils/content";
import { Locale, SurveyItemTranslations } from "../survey/utils";



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

  updateComponentTranslations(target: {
    componentFullKey: string,
    contentKey?: string
  }, locale: Locale, translation?: Content): void {
    const currentTranslations = this.editor.survey.getItemTranslations(this._currentItem.key.fullKey) ?? new SurveyItemTranslations();
    const translationKey = `${target.componentFullKey}${target.contentKey ? '.' + target.contentKey : ''}`;

    currentTranslations.setContent(locale, translationKey, translation);

    this.editor.updateItemTranslations(this._currentItem.key.fullKey, currentTranslations);
  }

  abstract convertToType(type: SurveyItemType): void;
}

abstract class QuestionEditor extends SurveyItemEditor {
  protected _currentItem: QuestionItem;

  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(editor, itemFullKey, type);
    this._currentItem = this._editor.survey.surveyItems[itemFullKey] as QuestionItem;
  }

  get title(): DisplayComponentEditor {
    if (!this._currentItem.header?.title) {
      return new DisplayComponentEditor(this, new DisplayComponent('title', undefined, this._currentItem.key.fullKey))
    }
    return new DisplayComponentEditor(this, this._currentItem.header.title);
  }

  get subtitle(): DisplayComponentEditor {
    if (!this._currentItem.header?.subtitle) {
      return new DisplayComponentEditor(this, new DisplayComponent('subtitle', undefined, this._currentItem.key.fullKey))
    }
    return new DisplayComponentEditor(this, this._currentItem.header.subtitle);
  }

}

/**
 * Single choice question and multiple choice question are very similar things, this is the base class for them.
 */
abstract class ScgMcgEditor extends QuestionEditor {
  protected _currentItem!: SingleChoiceQuestionItem | MultipleChoiceQuestionItem;

  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(editor, itemFullKey, type);
  }

  get optionEditors(): Array<ScgMcgOptionBaseEditor> {
    return this._currentItem.responseConfig.options.map(option => ScgMcgOptionBaseEditor.fromOption(this, option));
  }

  addNewOption(optionKey: string, optionType: ScgMcgOptionTypes, index?: number): void {
    if (!this.optionKeyAvailable(optionKey)) {
      throw new Error(`Option key ${optionKey} already exists`);
    }

    let option: ScgMcgOptionBase;
    switch (optionType) {
      case ItemComponentType.ScgMcgOption:
        option = new ScgMcgOption(optionKey, this._currentItem.responseConfig.key.fullKey, this._currentItem.key.parentFullKey);
        break;
      default:
        throw new Error(`Unsupported option type: ${optionType}`);
    }
    this.addExistingOption(option, index);
  }

  addExistingOption(option: ScgMcgOptionBase, index?: number): void {
    if (index !== undefined && index >= 0) {
      this._currentItem.responseConfig.options.splice(index, 0, option);
    } else {
      this._currentItem.responseConfig.options.push(option);
    }
  }

  optionKeyAvailable(optionKey: string): boolean {
    return !this._currentItem.responseConfig.options.some(option => option.key.componentKey === optionKey);
  }

  onReorderOptions(activeIndex: number, overIndex: number): void {
    const newOrder = [...this._currentItem.responseConfig.options];
    newOrder.splice(activeIndex, 1);
    newOrder.splice(overIndex, 0, this._currentItem.responseConfig.options[activeIndex]);
    this._currentItem.responseConfig.options = newOrder;
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
