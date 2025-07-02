import { Survey } from "../survey/survey";
import { SurveyItem, GroupItem, SurveyItemType, SingleChoiceQuestionItem } from "../survey/items";
import { SurveyEditorUndoRedo, type UndoRedoConfig } from "./undo-redo";
import { SurveyItemTranslations } from "../survey/utils";
import { SurveyItemKey } from "../survey/item-component-key";

export class SurveyEditor {
  private _survey: Survey;
  private _undoRedo: SurveyEditorUndoRedo;
  private _hasUncommittedChanges: boolean = false;

  constructor(survey: Survey) {
    this._survey = survey;
    this._undoRedo = new SurveyEditorUndoRedo(survey.toJson());
  }

  get survey(): Survey {
    return this._survey;
  }

  get hasUncommittedChanges(): boolean {
    return this._hasUncommittedChanges;
  }

  // Commit current changes to undo/redo history
  commit(description: string): void {
    this._undoRedo.commit(this._survey.toJson(), description);
    this._hasUncommittedChanges = false;
  }

  commitIfNeeded(): void {
    if (this._hasUncommittedChanges) {
      this.commit('Latest content changes');
    }
  }

  // Undo to previous state
  undo(): boolean {
    if (this._hasUncommittedChanges) {
      // If there are uncommitted changes, revert to last committed state
      this._survey = Survey.fromJson(this._undoRedo.getCurrentState());
      this._hasUncommittedChanges = false;
      return true;
    } else {
      // Normal undo operation
      const previousState = this._undoRedo.undo();
      if (previousState) {
        this._survey = Survey.fromJson(previousState);
        this._hasUncommittedChanges = false;
        return true;
      }
      return false;
    }
  }

  // Redo to next state
  redo(): boolean {
    if (this._hasUncommittedChanges) {
      // Cannot redo when there are uncommitted changes
      return false;
    }

    const nextState = this._undoRedo.redo();
    if (nextState) {
      this._survey = Survey.fromJson(nextState);
      this._hasUncommittedChanges = false;
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this._hasUncommittedChanges || this._undoRedo.canUndo();
  }

  canRedo(): boolean {
    return !this._hasUncommittedChanges && this._undoRedo.canRedo();
  }

  getUndoDescription(): string | null {
    if (this._hasUncommittedChanges) {
      return 'Latest content changes';
    }
    return this._undoRedo.getUndoDescription();
  }

  getRedoDescription(): string | null {
    if (this._hasUncommittedChanges) {
      return null;
    }
    return this._undoRedo.getRedoDescription();
  }

  // Get memory usage statistics
  getMemoryUsage(): { totalMB: number; entries: number } {
    return this._undoRedo.getMemoryUsage();
  }

  // Get undo/redo configuration
  getUndoRedoConfig(): UndoRedoConfig {
    return this._undoRedo.getConfig();
  }

  private markAsModified(): void {
    this._hasUncommittedChanges = true;
  }

  private updateItemKeyReferencesInSurvey(oldFullKey: string, newFullKey: string): void {
    // Update references in all survey items
    for (const item of Object.values(this._survey.surveyItems)) {
      // Update display conditions
      if (item.displayConditions?.root) {
        item.displayConditions.root.updateItemKeyReferences(oldFullKey, newFullKey);
      }
      if (item.displayConditions?.components) {
        for (const expression of Object.values(item.displayConditions.components)) {
          expression?.updateItemKeyReferences(oldFullKey, newFullKey);
        }
      }

      // Update template values
      if (item.templateValues) {
        for (const templateValue of Object.values(item.templateValues)) {
          templateValue.expression?.updateItemKeyReferences(oldFullKey, newFullKey);
        }
      }

      // Update disabled conditions
      if (item.disabledConditions?.components) {
        for (const expression of Object.values(item.disabledConditions.components)) {
          expression?.updateItemKeyReferences(oldFullKey, newFullKey);
        }
      }

      // Update validations
      if (item.validations) {
        for (const expression of Object.values(item.validations)) {
          expression?.updateItemKeyReferences(oldFullKey, newFullKey);
        }
      }
    }
  }

  initNewItem(target: {
    parentKey: string;
    index?: number;
  },
    itemType: SurveyItemType,
    itemKey: string,
  ) {


    let newItem: SurveyItem;
    const newItemKey = new SurveyItemKey(itemKey, target.parentKey);
    // check if the item key is already in the survey
    if (this._survey.surveyItems[newItemKey.fullKey]) {
      throw new Error(`Item with key '${itemKey}' already exists`);
    }

    switch (itemType) {
      case SurveyItemType.Group:
        newItem = new GroupItem(newItemKey.fullKey);
        break;
      case SurveyItemType.SingleChoiceQuestion:
        newItem = new SingleChoiceQuestionItem(newItemKey.fullKey);
        break;
      // TODO: add init for other item types

      default:
        throw new Error(`Unsupported item type: ${itemType}`);
    }

    this.commitIfNeeded();
    this.addItem(target, newItem, new SurveyItemTranslations())


    this.commit(`Added new item`);
  }

  addItem(target: {
    parentKey: string;
    index?: number;
  } | undefined,
    item: SurveyItem,
    content: SurveyItemTranslations
  ) {
    this.commitIfNeeded();

    // Find the parent group item
    let parentGroup: GroupItem;

    if (!target) {
      // If no target provided, add to root
      // A root item has no parent (parentFullKey is undefined or empty) and is a single segment
      const rootKey = Object.keys(this._survey.surveyItems).find(key => {
        const surveyItem = this._survey.surveyItems[key];
        const isRootItem = surveyItem.key.keyParts.length === 1;
        return isRootItem && surveyItem.itemType === SurveyItemType.Group;
      });

      if (!rootKey) {
        throw new Error('No root group found in survey');
      }

      parentGroup = this._survey.surveyItems[rootKey] as GroupItem;
    } else {
      // Find the target parent group
      const targetItem = this._survey.surveyItems[target.parentKey];

      if (!targetItem) {
        throw new Error(`Parent item with key '${target.parentKey}' not found`);
      }

      if (targetItem.itemType !== SurveyItemType.Group) {
        throw new Error(`Parent item '${target.parentKey}' is not a group item`);
      }

      parentGroup = targetItem as GroupItem;
    }

    // Initialize items array if it doesn't exist
    if (!parentGroup.items) {
      parentGroup.items = [];
    }

    // Determine insertion index
    let insertIndex: number;
    if (target?.index !== undefined) {
      // Insert at specified index, or at end if index is larger than array length
      insertIndex = Math.min(target.index, parentGroup.items.length);
    } else {
      // Insert at the end
      insertIndex = parentGroup.items.length;
    }

    // Add the item to the survey items collection
    this._survey.surveyItems[item.key.fullKey] = item;

    // Add the item key to the parent group's items array
    parentGroup.items.splice(insertIndex, 0, item.key.fullKey);

    // Update translations in the survey
    this._survey.translations.setItemTranslations(item.key.fullKey, content);

    // Mark as modified (uncommitted change)
    this.commit(`Added ${item.key.fullKey}`);
  }

  // Remove an item from the survey
  removeItem(itemKey: string, ignoreCommit: boolean = false): boolean {
    if (!ignoreCommit) {
      this.commitIfNeeded();
    }

    const item = this._survey.surveyItems[itemKey];
    if (!item) {
      return false;
    }

    // Find parent group and remove from its items array
    const parentKey = item.key.parentFullKey;
    if (parentKey) {
      const parentItem = this._survey.surveyItems[parentKey];
      if (parentItem && parentItem.itemType === SurveyItemType.Group) {
        const parentGroup = parentItem as GroupItem;
        if (parentGroup.items) {
          const index = parentGroup.items.indexOf(itemKey);
          if (index > -1) {
            parentGroup.items.splice(index, 1);
          }
        }
      }
    } else {
      throw new Error(`Item with key '${itemKey}' is the root item`);
    }

    // Remove from survey items
    delete this._survey.surveyItems[itemKey];

    // Remove translations
    this._survey.translations?.onItemDeleted(itemKey);

    if (item.itemType === SurveyItemType.Group) {
      for (const childKey of (item as GroupItem).items || []) {
        this.removeItem(childKey, true);
      }
    }

    if (!ignoreCommit) {
      this.commit(`Removed ${itemKey}`);
    }
    return true;
  }

  // Move an item to a different position
  moveItem(itemKey: string, newTarget: {
    parentKey: string;
    index?: number;
  }): boolean {
    this.commitIfNeeded();

    // Check if item exists
    const item = this._survey.surveyItems[itemKey];
    if (!item) {
      throw new Error(`Item with key '${itemKey}' not found`);
    }

    // Check if new target exists and is a group
    const targetItem = this._survey.surveyItems[newTarget.parentKey];
    if (!targetItem) {
      throw new Error(`Target parent with key '${newTarget.parentKey}' not found`);
    }

    if (targetItem.itemType !== SurveyItemType.Group) {
      throw new Error(`Target parent '${newTarget.parentKey}' is not a group item`);
    }

    // Check if new target is not a child of the current item (prevent circular reference)
    if (this.isDescendantOf(newTarget.parentKey, itemKey)) {
      throw new Error(`Cannot move item '${itemKey}' to its descendant '${newTarget.parentKey}'`);
    }

    // If the item is already in the target parent
    const currentParentKey = item.key.parentFullKey;
    if (currentParentKey === newTarget.parentKey) {
      throw new Error(`Item '${itemKey}' is already in the target parent '${newTarget.parentKey}'`);
    }

    // Remove item from current parent's items array
    if (currentParentKey) {
      const currentParentItem = this._survey.surveyItems[currentParentKey];
      if (currentParentItem && currentParentItem.itemType === SurveyItemType.Group) {
        const currentParentGroup = currentParentItem as GroupItem;
        if (currentParentGroup.items) {
          const index = currentParentGroup.items.indexOf(itemKey);
          if (index > -1) {
            currentParentGroup.items.splice(index, 1);
          }
        }
      }
    }

    // Create new key with new parent
    const itemKeyObject = SurveyItemKey.fromFullKey(itemKey);
    const newItemKey = new SurveyItemKey(itemKeyObject.itemKey, newTarget.parentKey);

    // Use onItemKeyChanged to rename the item and its subtree (this updates all references)
    this.onItemKeyChanged(itemKey, newItemKey.fullKey, true);

    // Add item to new parent's items array
    const targetGroup = targetItem as GroupItem;
    if (!targetGroup.items) {
      targetGroup.items = [];
    }

    const insertIndex = newTarget.index !== undefined ?
      Math.min(newTarget.index, targetGroup.items.length) :
      targetGroup.items.length;

    targetGroup.items.splice(insertIndex, 0, newItemKey.fullKey);

    this.commit(`Moved ${itemKey} to ${newTarget.parentKey}`);
    return true;
  }

  // Helper method to check if targetKey is a descendant of ancestorKey
  private isDescendantOf(targetKey: string, ancestorKey: string): boolean {
    if (targetKey === ancestorKey || targetKey.startsWith(ancestorKey + '.')) {
      return true;
    }
    return false;
  }

  onItemKeyChanged(oldFullKey: string, newFullKey: string, skipCommit: boolean = false): void {
    if (!skipCommit) {
      this.commitIfNeeded();
    }

    // if new key already exists, throw an error
    if (this._survey.surveyItems[newFullKey]) {
      throw new Error(`Item with key '${newFullKey}' already exists. Cannot rename ${oldFullKey} to ${newFullKey}`);
    }

    const item = this._survey.surveyItems[oldFullKey];
    if (!item) {
      throw new Error(`Item with key '${oldFullKey}' not found`);
    }

    // update parent's items array
    const parentKey = item.key.parentFullKey;
    if (parentKey) {
      // Try to find parent in the current survey items (it might have been renamed already)
      let parentItem = this._survey.surveyItems[parentKey] as GroupItem;

      // If parent is not found at the original key, it might have been renamed
      // Check if this is a recursive call by looking for a renamed parent
      if (!parentItem) {
        for (const [_key, surveyItem] of Object.entries(this._survey.surveyItems)) {
          if (surveyItem.itemType === SurveyItemType.Group) {
            const groupItem = surveyItem as GroupItem;
            if (groupItem.items?.includes(oldFullKey)) {
              parentItem = groupItem;
              break;
            }
          }
        }
      }

      if (parentItem?.items) {
        const index = parentItem.items.indexOf(oldFullKey);
        if (index > -1) {
          parentItem.items[index] = newFullKey;
        }
      }
    }

    // Update the item's key
    item.onItemKeyChanged(newFullKey);

    // Move the item in the surveyItems dictionary
    this._survey.surveyItems[newFullKey] = item;
    delete this._survey.surveyItems[oldFullKey];

    this._survey.translations.onItemKeyChanged(oldFullKey, newFullKey);
    if (item.itemType === SurveyItemType.Group) {
      for (const childKey of (item as GroupItem).items || []) {
        const oldChildKey = SurveyItemKey.fromFullKey(childKey);
        const newChildKey = new SurveyItemKey(oldChildKey.itemKey, newFullKey);

        this.onItemKeyChanged(childKey, newChildKey.fullKey, true);
      }
    }

    // Update references to the item in other items (e.g., expressions)
    this.updateItemKeyReferencesInSurvey(oldFullKey, newFullKey);


    if (!skipCommit) {
      this.commit(`Renamed ${oldFullKey} to ${newFullKey}`);
    } else {
      this.markAsModified();
    }
  }

  onComponentKeyChanged(itemKey: string, oldKey: string, newKey: string): void {
    this.commitIfNeeded();
    // TODO: update references to the component in other items (e.g., expressions)
    // TODO: recursively, if the component is a group, update all its component references in other items
    this._survey.translations.onComponentKeyChanged(itemKey, oldKey, newKey);

    this.commit(`Renamed component ${oldKey} to ${newKey} in ${itemKey}`);
  }

  // TODO: add also to update component translations (updating part of the item)
  // Update item translations
  updateItemTranslations(itemKey: string, updatedContent?: SurveyItemTranslations): boolean {
    const item = this._survey.surveyItems[itemKey];
    if (!item) {
      throw new Error(`Item with key '${itemKey}' not found`);
    }

    this._survey.translations.setItemTranslations(itemKey, updatedContent);

    this.markAsModified();
    return true;
  }

  deleteComponent(itemKey: string, componentKey: string): void {
    this.commitIfNeeded();

    const item = this._survey.surveyItems[itemKey];
    if (!item) {
      throw new Error(`Item with key '${itemKey}' not found`);
    }

    item.onComponentDeleted?.(componentKey);

    // remove translations:
    this._survey.translations?.onComponentDeleted(itemKey, componentKey);

    this.commit(`Deleted component ${componentKey} from ${itemKey}`);
  }
}
