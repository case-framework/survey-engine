import { SurveyItemKey } from "../survey/item-component-key";
import { SurveyEditor } from "./survey-editor";
import { MultipleChoiceQuestionItem, QuestionItem, SingleChoiceQuestionItem, SurveyItem, SurveyItemType, GroupItem } from "../survey/items";
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

  changeItemKey(newItemKey: string): void {
    // Validate that newItemKey doesn't contain dots
    if (newItemKey.includes('.')) {
      throw new Error('Item key must not contain a dot (.)');
    }

    // If the new key is the same as current key, do nothing
    if (this._currentItem.key.itemKey === newItemKey) {
      return;
    }

    // Check if a sibling with the same key already exists
    const siblingKeys = this.getSiblingKeys();
    const siblingKeyExists = siblingKeys.some(siblingKey => siblingKey.itemKey === newItemKey);

    if (siblingKeyExists) {
      throw new Error(`A sibling item with key '${newItemKey}' already exists`);
    }

    // Construct the new full key
    const currentParentKey = this._currentItem.key.parentFullKey;
    const newFullKey = currentParentKey ? `${currentParentKey}.${newItemKey}` : newItemKey;

    // Call the editor's key changing method
    this._editor.onItemKeyChanged(this._currentItem.key.fullKey, newFullKey);

    // Update our reference to the current item
    this._currentItem = this._editor.survey.surveyItems[newFullKey];
  }

  changeComponentKey(oldComponentKey: string, newComponentKey: string): void {
    this._editor.onComponentKeyChanged(this._currentItem.key.fullKey, oldComponentKey, newComponentKey);
  }

  updateItemMetadata(metadata?: { [key: string]: string }): void {
    this._editor.commitIfNeeded();
    this._currentItem.metadata = metadata;
    this._editor.commit(`Updated metadata for ${this._currentItem.key.fullKey}`);
  }

  abstract convertToType(type: SurveyItemType): void;
}

export class GenericSurveyItemEditor extends SurveyItemEditor {
  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType) {
    super(editor, itemFullKey, type);
  }

  convertToType(type: SurveyItemType): void {
    throw new Error(`use type specific editor to convert to ${type}`);
  }
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
  declare protected _currentItem: SingleChoiceQuestionItem | MultipleChoiceQuestionItem;

  constructor(editor: SurveyEditor, itemFullKey: string, type: SurveyItemType.SingleChoiceQuestion | SurveyItemType.MultipleChoiceQuestion) {
    super(editor, itemFullKey, type);
  }

  get optionEditors(): Array<ScgMcgOptionBaseEditor> {
    return this._currentItem.responseConfig.items.map(option => ScgMcgOptionBaseEditor.fromOption(this, option));
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
      this._currentItem.responseConfig.items.splice(index, 0, option);
    } else {
      this._currentItem.responseConfig.items.push(option);
    }
  }

  optionKeyAvailable(optionKey: string): boolean {
    return !this._currentItem.responseConfig.items.some(option => option.key.componentKey === optionKey);
  }

  swapOptions(activeIndex: number, overIndex: number): void {
    const newOrder = [...this._currentItem.responseConfig.items];
    newOrder.splice(activeIndex, 1);
    newOrder.splice(overIndex, 0, this._currentItem.responseConfig.items[activeIndex]);
    this._currentItem.responseConfig.items = newOrder;
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

export class GroupItemEditor extends SurveyItemEditor {
  protected _currentItem: GroupItem;

  constructor(editor: SurveyEditor, itemFullKey: string) {
    super(editor, itemFullKey, SurveyItemType.Group);
    this._currentItem = this._editor.survey.surveyItems[itemFullKey] as GroupItem;
    if (!this._currentItem) {
      throw new Error(`Can't find group item ${itemFullKey}`);
    }
  }

  /**
   * Get the ordered list of child item keys in this group
   * @returns Array of child item keys in their current order
   */
  get childItemKeys(): string[] {
    return this._currentItem.items || [];
  }

  /**
   * Get the child items as SurveyItem objects in their current order
   * @returns Array of child SurveyItem objects
   */
  get childItems(): SurveyItem[] {
    const childKeys = this.childItemKeys;
    return childKeys
      .map(key => this._editor.survey.surveyItems[key])
      .filter(item => item !== undefined); // Filter out any missing items
  }

  /**
   * Update the ordering of items within this group
   * @param newOrder Array of item keys in the desired order
   * @throws Error if any key in newOrder is not a child of this group
   */
  updateItemOrdering(newOrder: string[]): void {
    this._editor.commitIfNeeded();

    const currentKeys = new Set(this.childItemKeys);

    // Validate that all items in newOrder are current children
    if (newOrder.length !== currentKeys.size || !newOrder.every(key => currentKeys.has(key))) {
      throw new Error('New order must contain exactly the same items as current children');
    }

    // Update the items array with the new order
    this._currentItem.items = [...newOrder];

    this._editor.commit(`Reordered items in group ${this._currentItem.key.fullKey}`);
  }

  /**
   * Swap two items by their positions in the group
   * @param fromIndex The index of the first item to swap
   * @param toIndex The index of the second item to swap
   * @throws Error if indices are out of bounds
   */
  swapItemsByIndex(fromIndex: number, toIndex: number): void {
    this._editor.commitIfNeeded();

    const items = this.childItemKeys;

    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      throw new Error(`Index out of bounds. Valid range is 0-${items.length - 1}`);
    }

    if (fromIndex === toIndex) {
      return; // No operation needed
    }

    // Swap the items
    const newOrder = [...items];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];

    this._currentItem.items = newOrder;

    this._editor.commit(`Swapped items at positions ${fromIndex} and ${toIndex} in group ${this._currentItem.key.fullKey}`);
  }

  /**
   * Swap two items by their keys
   * @param itemKey1 The key of the first item to swap
   * @param itemKey2 The key of the second item to swap
   * @throws Error if either key is not found in this group
   */
  swapItemsByKey(itemKey1: string, itemKey2: string): void {
    const items = this.childItemKeys;
    const index1 = items.indexOf(itemKey1);
    const index2 = items.indexOf(itemKey2);

    if (index1 === -1) {
      throw new Error(`Item '${itemKey1}' not found in group '${this._currentItem.key.fullKey}'`);
    }

    if (index2 === -1) {
      throw new Error(`Item '${itemKey2}' not found in group '${this._currentItem.key.fullKey}'`);
    }

    this.swapItemsByIndex(index1, index2);
  }

  /**
   * Move an item from one position to another within the group
   * @param fromIndex The current index of the item to move
   * @param toIndex The target index where the item should be moved
   * @throws Error if indices are out of bounds
   */
  moveItem(fromIndex: number, toIndex: number): void {
    this._editor.commitIfNeeded();

    const items = this.childItemKeys;

    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      throw new Error(`Index out of bounds. Valid range is 0-${items.length - 1}`);
    }

    if (fromIndex === toIndex) {
      return; // No operation needed
    }

    // Create new order by moving the item
    const newOrder = [...items];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);

    this._currentItem.items = newOrder;

    this._editor.commit(`Moved item from position ${fromIndex} to ${toIndex} in group ${this._currentItem.key.fullKey}`);
  }

  /**
   * Move an item by key to a specific position
   * @param itemKey The key of the item to move
   * @param toIndex The target index where the item should be moved
   * @throws Error if the item key is not found or index is out of bounds
   */
  moveItemByKey(itemKey: string, toIndex: number): void {
    const items = this.childItemKeys;
    const fromIndex = items.indexOf(itemKey);

    if (fromIndex === -1) {
      throw new Error(`Item '${itemKey}' not found in group '${this._currentItem.key.fullKey}'`);
    }

    this.moveItem(fromIndex, toIndex);
  }

  /**
   * Add an existing item to this group at a specific position
   * @param itemKey The key of the item to add
   * @param index Optional index where to insert the item (defaults to end)
   * @throws Error if the item doesn't exist or is already in this group
   */
  addChildItem(item: SurveyItem, translations: SurveyItemTranslations, index?: number): void {
    this._editor.addItem({
      parentKey: this._currentItem.key.fullKey,
      index
    }, item, translations)
  }

  /**
   * Remove an item from this group (doesn't delete the item from the survey)
   * @param itemKey The key of the item to remove from this group
   * @returns true if the item was removed, false if it wasn't in the group
   */
  removeChildItem(itemKey: string): boolean {
    return this._editor.removeItem(itemKey);
  }

  /**
   * Get the index of an item within this group
   * @param itemKey The key of the item to find
   * @returns The index of the item, or -1 if not found
   */
  getItemIndex(itemKey: string): number {
    return this.childItemKeys.indexOf(itemKey);
  }

  /**
   * Check if an item is a direct child of this group
   * @param itemKey The key of the item to check
   * @returns true if the item is a direct child of this group
   */
  hasChildItem(itemKey: string): boolean {
    return this.childItemKeys.includes(itemKey);
  }

  /**
   * Set whether items in this group should be shuffled
   * @param shouldShuffle Whether to shuffle items in this group
   */
  setShuffleItems(shouldShuffle: boolean): void {
    this._editor.commitIfNeeded();
    this._currentItem.shuffleItems = shouldShuffle;
    this._editor.commit(`Set shuffleItems to ${shouldShuffle} for group ${this._currentItem.key.fullKey}`);
  }

  /**
   * Get whether items in this group are set to be shuffled
   * @returns true if items should be shuffled
   */
  getShuffleItems(): boolean {
    return this._currentItem.shuffleItems || false;
  }

  convertToType(type: SurveyItemType): void {
    switch (type) {
      case SurveyItemType.Group:
        return; // Already a group
      default:
        throw new Error(`Cannot convert group item to ${type}`);
    }
  }
}
