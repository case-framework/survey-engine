import { Survey } from "../survey/survey";
import { SurveyItem, GroupItem, SurveyItemType } from "../survey/items";
import { SurveyItemTranslations, JsonComponentContent } from "../survey/utils";
import { SurveyItemKey } from "../survey/item-component-key";
import { JsonSurveyItem } from "../survey/items/survey-item-json";


// Serialized translation data format for clipboard
export type SerializedTranslations = {
  [locale: string]: JsonComponentContent;
};

// Clipboard data structure for copy-paste functionality
export interface SurveyItemClipboardData {
  type: 'survey-item';
  version: string;
  items: Array<{
    itemKey: string;
    itemData: JsonSurveyItem;
  }>;
  translations: { [itemKey: string]: SerializedTranslations };
  rootItemKey: string; // The key of the main item being copied
  timestamp: number;
}


export class ItemCopyPaste {
  private survey: Survey;

  constructor(survey: Survey) {
    this.survey = survey;
  }

  // ITEM COPY-PASTE FUNCTIONALITY

  /**
   * Copy a survey item and all its data to clipboard format
   * When copying a group, automatically includes all items in the subtree
   * @param itemKey - The full key of the item to copy
   * @returns Clipboard data that can be serialized to JSON for clipboard
   */
  copyItem(itemKey: string): SurveyItemClipboardData {
    const item = this.survey.surveyItems[itemKey];
    if (!item) {
      throw new Error(`Item with key '${itemKey}' not found`);
    }

    // Collect all items to copy (including subtree for groups)
    const itemsToCopy = this.collectItemsForCopy(itemKey);

    // Create items array with their data
    const items = itemsToCopy.map(key => ({
      itemKey: key,
      itemData: this.survey.surveyItems[key].toJson()
    }));

    // Collect translations for all items
    const translations: { [itemKey: string]: SerializedTranslations } = {};
    itemsToCopy.forEach(key => {
      const itemTranslations = this.survey.getItemTranslations(key);
      if (itemTranslations) {
        // Serialize the translations to plain object format
        const serializedTranslations: SerializedTranslations = {};
        itemTranslations.locales.forEach(locale => {
          const localeContent = itemTranslations.getAllForLocale(locale);
          if (localeContent) {
            serializedTranslations[locale] = localeContent;
          }
        });
        translations[key] = serializedTranslations;
      } else {
        translations[key] = {};
      }
    });

    // Create clipboard data
    const clipboardData: SurveyItemClipboardData = {
      type: 'survey-item',
      version: '1.0.0',
      items: items,
      translations: translations,
      rootItemKey: itemKey,
      timestamp: Date.now()
    };

    return clipboardData;
  }

  /**
   * Collect all items that should be copied, including subtree for groups
   * @param itemKey - The root item key
   * @returns Array of item keys to copy
   */
  private collectItemsForCopy(itemKey: string): string[] {
    const itemsToCopy: string[] = [itemKey];
    const item = this.survey.surveyItems[itemKey];

    // If this is a group item, collect all child items recursively
    if (item.itemType === SurveyItemType.Group) {
      const groupItem = item as GroupItem;
      if (groupItem.items) {
        groupItem.items.forEach(childKey => {
          // Recursively collect child items and their subtrees
          const childItems = this.collectItemsForCopy(childKey);
          itemsToCopy.push(...childItems);
        });
      }
    }

    return itemsToCopy;
  }

  /**
   * Update component parent item keys within item data
   * @param itemData - The item data to update
   * @param keyMapping - Mapping from old keys to new keys
   */
  private updateComponentParentItemKeys(itemData: any, keyMapping: { [oldKey: string]: string }): void {
    // Update component keys that reference parent items
    this.updateComponentKeysRecursively(itemData, keyMapping);
  }

  /**
   * Recursively update component keys in item data
   * @param data - The data object to update
   * @param keyMapping - Mapping from old keys to new keys
   */
  private updateComponentKeysRecursively(data: any, keyMapping: { [oldKey: string]: string }): void {
    if (!data || typeof data !== 'object') return;

    // Update key field if it exists and has a mapping
    if (data.key && typeof data.key === 'string' && keyMapping[data.key]) {
      data.key = keyMapping[data.key];
    }

    // Recursively update nested objects and arrays
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        data[key].forEach((item: any) => this.updateComponentKeysRecursively(item, keyMapping));
      } else if (data[key] && typeof data[key] === 'object') {
        this.updateComponentKeysRecursively(data[key], keyMapping);
      }
    });
  }

  /**
   * Add an item to its parent group
   * @param target - Target location information
   * @param item - The item to add
   */
  private addItemToParentGroup(target: { parentKey: string; index?: number }, item: SurveyItem): void {
    // Find the parent group item
    const parentGroup = this.survey.surveyItems[target.parentKey] as GroupItem;

    if (!parentGroup) {
      throw new Error(`Parent item with key '${target.parentKey}' not found`);
    }

    if (parentGroup.itemType !== SurveyItemType.Group) {
      throw new Error(`Parent item '${target.parentKey}' is not a group item`);
    }

    // Initialize items array if it doesn't exist
    if (!parentGroup.items) {
      parentGroup.items = [];
    }

    // Determine insertion index
    let insertIndex: number;
    if (target.index !== undefined) {
      // Insert at specified index, or at end if index is larger than array length
      insertIndex = Math.min(target.index, parentGroup.items.length);
    } else {
      // Insert at the end
      insertIndex = parentGroup.items.length;
    }

    // Add the item key to the parent group's items array
    parentGroup.items.splice(insertIndex, 0, item.key.fullKey);
  }

  /**
   * Paste a survey item from clipboard data to a target location
   * Handles multiple items and subtrees from the clipboard data
   * @param clipboardData - The clipboard data containing the item(s) to paste
   * @param target - Target location where to paste the item
   * @returns The full key of the pasted root item
   */
  pasteItem(clipboardData: SurveyItemClipboardData, target: {
    parentKey: string;
    index?: number;
  }): string {
    // Validate clipboard data
    if (!ItemCopyPaste.isValidClipboardData(clipboardData)) {
      throw new Error('Invalid clipboard data format');
    }

    // Generate a new unique key for the root item
    const originalRootKey = SurveyItemKey.fromFullKey(clipboardData.rootItemKey);
    const newRootKey = this.generateUniqueItemKey(originalRootKey.itemKey, target.parentKey);
    const newRootFullKey = target.parentKey ? `${target.parentKey}.${newRootKey}` : newRootKey;

    // Create key mapping for all items in the subtree
    const keyMapping: { [oldKey: string]: string } = {};
    clipboardData.items.forEach(({ itemKey }) => {
      if (itemKey === clipboardData.rootItemKey) {
        keyMapping[itemKey] = newRootFullKey;
      } else if (itemKey.startsWith(clipboardData.rootItemKey + '.')) {
        // Update child keys to use the new root
        const relativePath = itemKey.substring(clipboardData.rootItemKey.length + 1);
        keyMapping[itemKey] = `${newRootFullKey}.${relativePath}`;
      } else {
        // This shouldn't happen if data is consistent, but handle gracefully
        keyMapping[itemKey] = itemKey;
      }
    });

    // Create all items with updated keys
    const createdItems: { [newKey: string]: SurveyItem } = {};
    clipboardData.items.forEach(({ itemKey, itemData }) => {
      const newKey = keyMapping[itemKey];
      if (newKey) {
        // Update item data with new keys
        const updatedItemData = this.updateItemKeysInData(itemData, itemKey, newKey);

        // Update component parent item keys within the item
        this.updateComponentParentItemKeys(updatedItemData, keyMapping);

        // Create the new item from JSON
        const newItem = SurveyItem.fromJson(newKey, updatedItemData);
        createdItems[newKey] = newItem;

        // Add to survey items collection
        this.survey.surveyItems[newKey] = newItem;
      }
    });

    // Update translations with new keys
    const updatedTranslations = this.updateTranslationKeys(clipboardData.translations, clipboardData.rootItemKey, newRootFullKey);
    Object.keys(updatedTranslations).forEach(itemKey => {
      // Convert serialized translations back to SurveyItemTranslations instance
      const itemTranslations = new SurveyItemTranslations();
      const serializedData = updatedTranslations[itemKey];
      Object.keys(serializedData).forEach(locale => {
        itemTranslations.setAllForLocale(locale, serializedData[locale]);
      });
      this.survey.translations.setItemTranslations(itemKey, itemTranslations);
    });

    // TODO: update prefill rules where needed to use the new keys

    // Add the root item to the parent group
    const rootItem = createdItems[newRootFullKey];
    if (rootItem) {
      this.addItemToParentGroup(target, rootItem);
    }

    return newRootFullKey;
  }

  // PRIVATE HELPER METHODS
  /**
   * Generate a unique item key within the target parent
   */
  private generateUniqueItemKey(baseKey: string, parentKey?: string): string {
    const targetParentKey = parentKey || '';
    let counter = 0;
    let candidateKey = baseKey;

    // Try the original key first
    let candidateFullKey = targetParentKey ? `${targetParentKey}.${candidateKey}` : candidateKey;

    while (this.survey.surveyItems[candidateFullKey]) {
      counter++;
      candidateKey = `${baseKey}_copy${counter > 1 ? `_${counter}` : ''}`;
      candidateFullKey = targetParentKey ? `${targetParentKey}.${candidateKey}` : candidateKey;
    }

    return candidateKey;
  }

  /**
   * Update all item keys in the JSON data recursively
   */
  private updateItemKeysInData(itemData: JsonSurveyItem, oldFullKey: string, newFullKey: string): JsonSurveyItem {
    const updatedData = JSON.parse(JSON.stringify(itemData)); // Deep clone

    // If this is a group item, update all child item keys
    if (updatedData.itemType === SurveyItemType.Group && updatedData.items) {
      updatedData.items = updatedData.items.map((childKey: string) => {
        const oldChildKey = SurveyItemKey.fromFullKey(childKey);
        const newChildKey = new SurveyItemKey(oldChildKey.itemKey, newFullKey);
        return newChildKey.fullKey;
      });
    }

    // Update expressions that reference the old keys
    this.updateExpressionsInItemData(updatedData, oldFullKey, newFullKey);

    return updatedData;
  }

  /**
   * Update expressions in item data that reference the old keys
   */
  private updateExpressionsInItemData(itemData: JsonSurveyItem, oldFullKey: string, newFullKey: string): void {
    // Create a simple key mapping for this item
    const keyMapping: { [oldKey: string]: string } = { [oldFullKey]: newFullKey };

    // Update display conditions
    if (itemData.displayConditions?.root) {
      this.updateExpressionReferences(itemData.displayConditions.root, keyMapping);
    }
    if (itemData.displayConditions?.components) {
      Object.values(itemData.displayConditions.components).forEach(expr => {
        if (expr) this.updateExpressionReferences(expr, keyMapping);
      });
    }

    // Update template values
    if (itemData.templateValues) {
      Object.values(itemData.templateValues).forEach(templateValue => {
        if (templateValue.expression) {
          this.updateExpressionReferences(templateValue.expression, keyMapping);
        }
      });
    }

    // Update disabled conditions
    if (itemData.disabledConditions?.components) {
      Object.values(itemData.disabledConditions.components).forEach(expr => {
        if (expr) this.updateExpressionReferences(expr, keyMapping);
      });
    }

    // Update validations
    if (itemData.validations) {
      Object.values(itemData.validations).forEach(expr => {
        if (expr) this.updateExpressionReferences(expr, keyMapping);
      });
    }
  }

  /**
   * Update references in a single expression (recursive)
   */
  private updateExpressionReferences(expression: any, keyMapping: { [oldKey: string]: string }): void {
    if (!expression || typeof expression !== 'object') {
      return;
    }

    // Handle expression arguments
    if (Array.isArray(expression.data)) {
      expression.data.forEach((arg: any) => {
        if (arg && typeof arg === 'object') {
          if (arg.str && typeof arg.str === 'string' && keyMapping[arg.str]) {
            arg.str = keyMapping[arg.str];
          }
          // Recursively update nested expressions
          this.updateExpressionReferences(arg, keyMapping);
        }
      });
    }

    // Recursively process nested objects
    Object.keys(expression).forEach(key => {
      if (expression[key] && typeof expression[key] === 'object') {
        this.updateExpressionReferences(expression[key], keyMapping);
      }
    });
  }

  /**
* Update translation keys for the pasted item
*/
  private updateTranslationKeys(translations: { [itemKey: string]: SerializedTranslations }, oldFullKey: string, newFullKey: string): { [itemKey: string]: SerializedTranslations } {
    const newTranslations: { [itemKey: string]: SerializedTranslations } = {};

    // Update keys for all items in the translation data
    Object.keys(translations).forEach(itemKey => {
      const itemTranslations = translations[itemKey];

      // Determine the new key for this item (update the key mapping)
      let newItemKey = itemKey;
      if (itemKey === oldFullKey) {
        newItemKey = newFullKey;
      } else if (itemKey.startsWith(oldFullKey + '.')) {
        newItemKey = itemKey.replace(oldFullKey, newFullKey);
      }

      // Copy the serialized translations as-is (content is preserved, only keys change)
      newTranslations[newItemKey] = itemTranslations;
    });

    return newTranslations;
  }


  /**
 * Validate clipboard data format
 */
  static isValidClipboardData(data: unknown): data is SurveyItemClipboardData {
    if (typeof data !== 'object' || data === null || data === undefined) return false;
    const clipboardData = data as SurveyItemClipboardData;
    return (
      clipboardData.type === 'survey-item' &&
      clipboardData.version === '1.0.0' &&
      clipboardData.rootItemKey !== undefined
    );
  }
}
