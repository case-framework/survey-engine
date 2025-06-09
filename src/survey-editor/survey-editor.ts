import { Survey } from "../data_types/survey";
import { SurveyItem, SurveyItemTranslations, GroupItem, SurveyItemType } from "../data_types/survey-item";
import { SurveyEditorUndoRedo, type UndoRedoConfig } from "./undo-redo";

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
    if (!this._survey.translations) {
      this._survey.translations = {};
    }

    // Merge translations for each locale
    Object.keys(content).forEach(locale => {
      if (!this._survey.translations![locale]) {
        this._survey.translations![locale] = {};
      }
      // Add the item's translations to the survey - content[locale] is LocalizedContentTranslation
      this._survey.translations![locale][item.key.fullKey] = content[locale];
    });

    // Mark as modified (uncommitted change)
    this.commit(`Added ${item.key.fullKey}`);
  }

  // Remove an item from the survey
  removeItem(itemKey: string): boolean {
    this.commitIfNeeded();

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
    if (this._survey.translations) {
      this._survey.locales.forEach(locale => {
        if (this._survey.translations![locale][itemKey]) {
          delete this._survey.translations![locale][itemKey];
        }
      });
    }

    // TODO: remove references to the item from other items (e.g., expressions)

    this.commit(`Removed ${itemKey}`);
    return true;
  }

  // Move an item to a different position
  moveItem(itemKey: string, newTarget: {
    parentKey: string;
    index?: number;
  }): boolean {
    this.commitIfNeeded();
    // TODO: implement
    return false;

    /* const item = this._survey.surveyItems[itemKey];
    if (!item) {
      return false;
    }

    // Remove from current position
    const currentParentKey = item.key.parentFullKey;
    if (currentParentKey) {
      const currentParent = this._survey.surveyItems[currentParentKey];
      if (currentParent && currentParent.itemType === SurveyItemType.Group) {
        const currentParentGroup = currentParent as GroupItem;
        if (currentParentGroup.items) {
          const currentIndex = currentParentGroup.items.indexOf(itemKey);
          if (currentIndex > -1) {
            currentParentGroup.items.splice(currentIndex, 1);
          }
        }
      }
    }

    // Add to new position
    const newParent = this._survey.surveyItems[newTarget.parentKey];
    if (!newParent || newParent.itemType !== SurveyItemType.Group) {
      return false;
    }

    const newParentGroup = newParent as GroupItem;
    if (!newParentGroup.items) {
      newParentGroup.items = [];
    }

    const insertIndex = newTarget.index !== undefined
      ? Math.min(newTarget.index, newParentGroup.items.length)
      : newParentGroup.items.length;

    newParentGroup.items.splice(insertIndex, 0, itemKey); */

    this.commit(`Moved ${itemKey} to ${newTarget.parentKey}`);
    return true;
  }

  // TODO: Update item

  // TODO: change to update component translations (updating part of the item)
  // Update item translations
  updateItemTranslations(itemKey: string, translations: SurveyItemTranslations): boolean {
    const item = this._survey.surveyItems[itemKey];
    if (!item) {
      throw new Error(`Item with key '${itemKey}' not found`);
    }

    if (!this._survey.translations) {
      this._survey.translations = {};
    }

    Object.keys(translations).forEach(locale => {
      if (!this._survey.translations![locale]) {
        this._survey.translations![locale] = {};
      }
      this._survey.translations![locale][itemKey] = translations[locale];
    });

    this.markAsModified();
    return true;
  }
}
