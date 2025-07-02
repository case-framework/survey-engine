import { SurveyItemKey } from "../survey/item-component-key";
import { SurveyEditor } from "./survey-editor";
import { MultipleChoiceQuestionItem, QuestionItem, SingleChoiceQuestionItem, SurveyItem, SurveyItemType } from "../survey/items";
import { DisplayComponentEditor, ScgMcgOptionBaseEditor } from "./component-editor";
import { DisplayComponent, ItemComponent, ItemComponentType, ScgMcgOption, ScgMcgOptionBase, ScgMcgOptionTypes } from "../survey";
import { Content } from "../survey/utils/content";
import { SurveyItemTranslations } from "../survey/utils";
import { Expression, TemplateValueDefinition } from "../expressions";



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
  }, locale: string, translation?: Content): void {
    const currentTranslations = this.editor.survey.getItemTranslations(this._currentItem.key.fullKey) ?? new SurveyItemTranslations();
    const translationKey = `${target.componentFullKey}${target.contentKey ? '.' + target.contentKey : ''}`;

    currentTranslations.setContent(locale, translationKey, translation);

    this.editor.updateItemTranslations(this._currentItem.key.fullKey, currentTranslations);
  }

  setDisplayCondition(condition: Expression | undefined, componentFullKey?: string): void {
    this.editor.commitIfNeeded();
    if (!condition) {
      // remove condition
      if (componentFullKey) {
        delete this._currentItem.displayConditions?.components?.[componentFullKey];
      } else {
        delete this._currentItem.displayConditions?.root;
      }
    } else {
      // add condition
      if (!this._currentItem.displayConditions) {
        this._currentItem.displayConditions = {};
      }
      if (componentFullKey) {
        if (!this._currentItem.displayConditions?.components) {
          this._currentItem.displayConditions.components = {};
        }
        this._currentItem.displayConditions.components[componentFullKey] = condition;
      } else {
        if (!this._currentItem.displayConditions) {
          this._currentItem.displayConditions = {};
        }
        this._currentItem.displayConditions.root = condition;
      }
    }
    this._editor.commit(`Set display condition for ${this._currentItem.key.fullKey}`);
  }

  getDisplayCondition(componentFullKey?: string): Expression | undefined {
    if (componentFullKey) {
      return this._currentItem.displayConditions?.components?.[componentFullKey]?.clone();
    } else {
      return this._currentItem.displayConditions?.root?.clone();
    }
  }


  setTemplateValue(templateValueKey: string, expression: TemplateValueDefinition | undefined): void {
    this._editor.commitIfNeeded();
    if (!expression) {
      delete this._currentItem.templateValues?.[templateValueKey];
    } else {
      if (!this._currentItem.templateValues) {
        this._currentItem.templateValues = {};
      }
      this._currentItem.templateValues[templateValueKey] = expression;
    }
    this._editor.commit(`Set template value for ${this._currentItem.key.fullKey}`);
  }

  getTemplateValue(templateValueKey: string): Expression | undefined {
    return this._currentItem.templateValues?.[templateValueKey]?.expression?.clone();
  }

  getSiblingKeys(): SurveyItemKey[] {
    const parentKey = this._currentItem.key.parentFullKey;
    const currentFullKey = this._currentItem.key.fullKey;

    // Find all items with the same parent key (excluding current item)
    const siblingKeys: SurveyItemKey[] = [];

    for (const itemFullKey of Object.keys(this._editor.survey.surveyItems)) {
      const item = this._editor.survey.surveyItems[itemFullKey];

      // Check if this item has the same parent and is not the current item
      if (item.key.parentFullKey === parentKey && item.key.fullKey !== currentFullKey) {
        siblingKeys.push(item.key);
      }
    }

    return siblingKeys;
  }

  abstract convertToType(type: SurveyItemType): void;
}

export abstract class QuestionEditor extends SurveyItemEditor {
  protected _currentItem: QuestionItem;

  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(editor, itemFullKey, type);
    this._currentItem = this._editor.survey.surveyItems[itemFullKey] as QuestionItem;
  }

  get title(): DisplayComponentEditor {
    if (!this._currentItem.header?.title) {
      return new DisplayComponentEditor(this, new DisplayComponent(ItemComponentType.Text, 'title', undefined, this._currentItem.key.fullKey))
    }
    return new DisplayComponentEditor(this, this._currentItem.header.title);
  }

  get subtitle(): DisplayComponentEditor {
    if (!this._currentItem.header?.subtitle) {
      return new DisplayComponentEditor(this, new DisplayComponent(ItemComponentType.Text, 'subtitle', undefined, this._currentItem.key.fullKey))
    }
    return new DisplayComponentEditor(this, this._currentItem.header.subtitle);
  }

  setDisableCondition(condition: Expression | undefined, componentFullKey: string): void {
    this._editor.commitIfNeeded();
    if (!condition) {
      delete this._currentItem.disabledConditions?.components?.[componentFullKey];
    } else {
      if (!this._currentItem.disabledConditions) {
        this._currentItem.disabledConditions = {};
      }
      if (!this._currentItem.disabledConditions?.components) {
        this._currentItem.disabledConditions.components = {};
      }
      this._currentItem.disabledConditions.components[componentFullKey] = condition;
    }
    this._editor.commit(`Set disable condition for ${this._currentItem.key.fullKey} ${componentFullKey}`);
  }

  setValidation(validationKey: string, expression: Expression | undefined): void {
    this._editor.commitIfNeeded();
    if (!expression) {
      delete this._currentItem.validations?.[validationKey];
    } else {
      if (!this._currentItem.validations) {
        this._currentItem.validations = {};
      }
      this._currentItem.validations[validationKey] = expression;
    }
    this._editor.commit(`Set validation for ${this._currentItem.key.fullKey} ${validationKey}`);
  }

  getValidation(validationKey: string): Expression | undefined {
    return this._currentItem.validations?.[validationKey]?.clone();
  }

  getDisableCondition(componentFullKey: string): Expression | undefined {
    return this._currentItem.disabledConditions?.components?.[componentFullKey]?.clone();
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
        option = new ScgMcgOption(optionKey, this._currentItem.responseConfig.key.fullKey, this._currentItem.key.fullKey);
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

  swapOptions(activeIndex: number, overIndex: number): void {
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
