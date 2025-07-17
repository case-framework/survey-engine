import { Survey } from "../survey/survey";
import { SurveyItem, GroupItem, SurveyItemType, DisplayItem, QuestionItem } from "../survey/items";
import { SurveyItemTranslations, JsonComponentContent } from "../survey/utils";
import { SurveyItemKey, ItemComponentKey } from "../survey/item-component-key";
import { JsonSurveyItem, JsonSurveyItemGroup } from "../survey/items/survey-item-json";
import { JsonSurveyItemResponse } from "../survey/responses";
import { ItemComponent, GroupComponent } from "../survey/components";

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

// Clipboard data structure for component copy-paste functionality
export interface SurveyComponentClipboardData {
  type: 'survey-component';
  version: string;
  componentData: unknown; // JSON representation of the component
  componentKey: string;
  parentItemKey: string;
  translations: { [locale: string]: { [contentKey: string]: unknown } };
  timestamp: number;
}

export class CopyPaste {
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
   * Update prefill keys and store them (placeholder for future implementation)
   * @param prefills - The prefills to update
   * @param keyMapping - Mapping from old keys to new keys
   */
  private updatePrefills(prefills: { [itemKey: string]: JsonSurveyItemResponse }, keyMapping: { [oldKey: string]: string }): void {
    // Update prefill keys according to the key mapping
    Object.keys(prefills).forEach(oldKey => {
      const newKey = keyMapping[oldKey];
      if (newKey && newKey !== oldKey) {
        const prefill = prefills[oldKey];
        prefill.key = newKey;
        // Note: In a full implementation, these would be stored in the survey engine context
        // For now, we just update the keys for consistency
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
    if (!CopyPaste.isValidClipboardData(clipboardData)) {
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

  // COMPONENT COPY-PASTE FUNCTIONALITY

  /**
   * Copy a component from an item
   * @param itemKey - The full key of the item containing the component
   * @param componentKey - The full key of the component to copy
   * @returns Clipboard data for the component
   */
  copyComponent(itemKey: string, componentKey: string): SurveyComponentClipboardData {
    const item = this.survey.surveyItems[itemKey];
    if (!item) {
      throw new Error(`Item with key '${itemKey}' not found`);
    }

    // Find the component within the item
    const component = this.findComponentInItem(item, componentKey);
    if (!component) {
      throw new Error(`Component with key '${componentKey}' not found in item '${itemKey}'`);
    }

    // Get component translations
    const itemTranslations = this.survey.getItemTranslations(itemKey);
    const componentTranslations: { [locale: string]: { [contentKey: string]: any } } = {};

    if (itemTranslations) {
      itemTranslations.locales.forEach(locale => {
        const localeContent = itemTranslations.getAllForLocale(locale);
        if (localeContent) {
          // Extract translations that match this component key
          const componentLocaleContent: { [contentKey: string]: any } = {};
          Object.keys(localeContent).forEach(contentKey => {
            if (contentKey === componentKey || contentKey.startsWith(componentKey + '.')) {
              componentLocaleContent[contentKey] = localeContent[contentKey];
            }
          });
          if (Object.keys(componentLocaleContent).length > 0) {
            componentTranslations[locale] = componentLocaleContent;
          }
        }
      });
    }

    return {
      type: 'survey-component',
      version: '1.0.0',
      componentData: component.toJson(),
      componentKey: componentKey,
      parentItemKey: itemKey,
      translations: componentTranslations,
      timestamp: Date.now()
    };
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
   * Update component keys in component data
   */
  private updateComponentKeysInData(componentData: any, oldFullKey: string, newFullKey: string, newItemKey: string): any {
    const updatedData = JSON.parse(JSON.stringify(componentData)); // Deep clone

    // Update the main component key
    updatedData.key = newFullKey;

    // If this is a group component with nested items, update their keys
    if (updatedData.items && Array.isArray(updatedData.items)) {
      updatedData.items = updatedData.items.map((childData: any) => {
        if (childData.key && childData.key.startsWith(oldFullKey + '.')) {
          const oldChildKey = ItemComponentKey.fromFullKey(childData.key, this.survey.surveyItems[newItemKey].key.fullKey);
          const newChildKey = new ItemComponentKey(oldChildKey.componentKey, newFullKey, newItemKey);
          return this.updateComponentKeysInData(childData, childData.key, newChildKey.fullKey, newItemKey);
        }
        return childData;
      });
    }

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
   * Recursively create child items for a group item
   */
  private createChildItemsRecursively(newParentKey: string, originalClipboardData: SurveyItemClipboardData): void {
    const groupData = originalClipboardData.items[0].itemData as JsonSurveyItemGroup;

    if (groupData.items && Array.isArray(groupData.items)) {
      groupData.items.forEach((originalChildKey: string) => {
        // Check if the original child item exists in the source survey
        const originalChildItem = this.survey.surveyItems[originalChildKey];
        if (originalChildItem) {
          // Create clipboard data for the child item
          const childClipboardData = this.copyItem(originalChildKey);

          // Generate new key for the child
          const originalChildItemKey = SurveyItemKey.fromFullKey(originalChildKey);
          const newChildKey = new SurveyItemKey(originalChildItemKey.itemKey, newParentKey);

          // Create the child item data with updated keys
          const updatedChildData = this.updateItemKeysInData(childClipboardData.items[0].itemData, originalChildKey, newChildKey.fullKey);

          // Create the child item
          const newChildItem = SurveyItem.fromJson(newChildKey.fullKey, updatedChildData);

          // Add to survey items
          this.survey.surveyItems[newChildKey.fullKey] = newChildItem;

          // Update translations for child
          const childTranslations = this.updateTranslationKeys(childClipboardData.translations, originalChildKey, newChildKey.fullKey);
          const serializedChildTranslations = childTranslations[newChildKey.fullKey];
          if (serializedChildTranslations) {
            const itemTranslations = new SurveyItemTranslations();
            Object.keys(serializedChildTranslations).forEach(locale => {
              itemTranslations.setAllForLocale(locale, serializedChildTranslations[locale]);
            });
            this.survey.translations.setItemTranslations(newChildKey.fullKey, itemTranslations);
          } else {
            this.survey.translations.setItemTranslations(newChildKey.fullKey, new SurveyItemTranslations());
          }

          // Recursively create grandchildren if this is a group
          if (newChildItem.itemType === SurveyItemType.Group && (newChildItem as GroupItem).items) {
            this.createChildItemsRecursively(newChildKey.fullKey, childClipboardData);
          }
        }
      });
    }
  }

  /**
   * Find a component within an item by its full key
   */
  private findComponentInItem(item: SurveyItem, componentKey: string): ItemComponent | null {
    // Search in different item types
    if (item.itemType === SurveyItemType.Display) {
      const displayItem = item as DisplayItem;
      return this.searchComponentsArray(displayItem.components || [], componentKey);
    }

    if (item.itemType === SurveyItemType.SingleChoiceQuestion || item.itemType === SurveyItemType.MultipleChoiceQuestion) {
      const questionItem = item as QuestionItem;

      // Check header components
      if (questionItem.header?.title?.key.fullKey === componentKey) return questionItem.header.title;
      if (questionItem.header?.subtitle?.key.fullKey === componentKey) return questionItem.header.subtitle;
      if (questionItem.header?.helpPopover?.key.fullKey === componentKey) return questionItem.header.helpPopover;

      // Check body components
      const topContentResult = this.searchComponentsArray(questionItem.body?.topContent || [], componentKey);
      if (topContentResult) return topContentResult;

      const bottomContentResult = this.searchComponentsArray(questionItem.body?.bottomContent || [], componentKey);
      if (bottomContentResult) return bottomContentResult;

      // Check footer
      if (questionItem.footer?.key.fullKey === componentKey) return questionItem.footer;

      // Check response config and its children
      if (questionItem.responseConfig.key.fullKey === componentKey) return questionItem.responseConfig;

      return this.searchComponentRecursively(questionItem.responseConfig, componentKey);
    }

    return null;
  }

  /**
   * Search for a component in an array of components
   */
  private searchComponentsArray(components: ItemComponent[], componentKey: string): ItemComponent | null {
    for (const component of components) {
      if (component.key.fullKey === componentKey) {
        return component;
      }

      // Search recursively in nested components
      const nestedResult = this.searchComponentRecursively(component, componentKey);
      if (nestedResult) return nestedResult;
    }
    return null;
  }

  /**
   * Search for a component recursively within a component
   */
  private searchComponentRecursively(component: ItemComponent, componentKey: string): ItemComponent | null {
    if (component instanceof GroupComponent && component.items) {
      return this.searchComponentsArray(component.items, componentKey);
    }
    return null;
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

  /**
   * Validate component clipboard data format
   */
  static isValidComponentClipboardData(data: unknown): data is SurveyComponentClipboardData {
    if (typeof data !== 'object' || data === null || data === undefined) return false;
    const clipboardData = data as SurveyComponentClipboardData;
    return (
      clipboardData.type === 'survey-component' &&
      clipboardData.version === '1.0.0' &&
      clipboardData.componentKey !== undefined &&
      clipboardData.parentItemKey !== undefined
    );
  }
}
