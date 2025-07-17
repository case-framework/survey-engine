import { Survey } from "../survey/survey";
import { SurveyItem, GroupItem, SurveyItemType, DisplayItem, QuestionItem } from "../survey/items";
import { SurveyItemTranslations, JsonComponentContent } from "../survey/utils";
import { SurveyItemKey, ItemComponentKey } from "../survey/item-component-key";
import { JsonSurveyItem } from "../survey/items/survey-item-json";
import { JsonSurveyItemResponse } from "../survey/responses";
import { ItemComponent, DisplayComponent, TextComponent, GroupComponent, ItemComponentType, ScgMcgChoiceResponseConfig, ScgMcgOptionBase } from "../survey/components";

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
  prefills: { [itemKey: string]: JsonSurveyItemResponse };
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

    // Collect prefills for all items (if any exist)
    const prefills: { [itemKey: string]: JsonSurveyItemResponse } = {};
    // Note: Prefills would typically come from the survey engine context
    // For now, we'll create empty prefills structure that can be populated if needed
    itemsToCopy.forEach(key => {
      const surveyItem = this.survey.surveyItems[key];
      if (surveyItem.itemType !== SurveyItemType.Group &&
        surveyItem.itemType !== SurveyItemType.Display &&
        surveyItem.itemType !== SurveyItemType.PageBreak &&
        surveyItem.itemType !== SurveyItemType.SurveyEnd) {
        // Create empty prefill structure for response items
        prefills[key] = {
          key: key,
          itemType: surveyItem.itemType,
          response: undefined
        };
      }
    });

    // Create clipboard data
    const clipboardData: SurveyItemClipboardData = {
      type: 'survey-item',
      version: '1.0.0',
      items: items,
      translations: translations,
      prefills: prefills,
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
    if (!this.isValidClipboardData(clipboardData)) {
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

    // Update and set prefills
    this.updatePrefills(clipboardData.prefills, keyMapping);

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

  /**
   * Paste a component into an item
   * @param clipboardData - The clipboard data containing the component to paste
   * @param targetItemKey - The item to paste the component into
   * @param targetLocation - Where to insert the component (optional)
   * @returns The full key of the pasted component
   */
  pasteComponent(
    clipboardData: SurveyComponentClipboardData,
    targetItemKey: string,
    targetLocation?: {
      parentComponentKey?: string;
      section?: 'header' | 'body' | 'footer' | 'responseConfig' | 'components';
      subSection?: 'title' | 'subtitle' | 'helpPopover' | 'topContent' | 'bottomContent';
      index?: number;
    }
  ): string {
    // Validate clipboard data
    if (!this.isValidComponentClipboardData(clipboardData)) {
      throw new Error('Invalid component clipboard data format');
    }

    const targetItem = this.survey.surveyItems[targetItemKey];
    if (!targetItem) {
      throw new Error(`Target item with key '${targetItemKey}' not found`);
    }

    // Generate unique component key
    const originalComponentKey = ItemComponentKey.fromFullKey(clipboardData.componentKey, clipboardData.parentItemKey);
    const newComponentKey = this.generateUniqueComponentKey(originalComponentKey.componentKey, targetItemKey, targetLocation?.parentComponentKey);
    const newFullComponentKey = targetLocation?.parentComponentKey ?
      `${targetLocation.parentComponentKey}.${newComponentKey}` :
      newComponentKey;

    // Update component data with new keys
    const updatedComponentData = this.updateComponentKeysInData(
      clipboardData.componentData,
      clipboardData.componentKey,
      newFullComponentKey,
      targetItemKey
    );

    // Create the component from JSON
    const newComponent = this.createComponentFromJson(updatedComponentData, targetLocation?.parentComponentKey, targetItemKey);

    // Insert component into the target item
    this.insertComponentIntoItem(targetItem, newComponent, targetLocation);

    // Update translations
    this.updateComponentTranslations(targetItemKey, clipboardData.translations, clipboardData.componentKey, newFullComponentKey);

    return newFullComponentKey;
  }

  /**
   * Paste a component into an item with intelligent placement based on target component
   * @param clipboardData - The clipboard data containing the component to paste
   * @param targetItemKey - The item to paste the component into
   * @param targetComponentKey - The component key to paste into (if undefined, uses default behavior)
   * @returns The full key of the pasted component
   */
  pasteComponentSmart(
    clipboardData: SurveyComponentClipboardData,
    targetItemKey: string,
    targetComponentKey?: string
  ): string {
    // If no target component specified, use default behavior
    if (!targetComponentKey) {
      return this.pasteComponent(clipboardData, targetItemKey);
    }

    // Validate clipboard data
    if (!this.isValidComponentClipboardData(clipboardData)) {
      throw new Error('Invalid component clipboard data format');
    }

    const targetItem = this.survey.surveyItems[targetItemKey];
    if (!targetItem) {
      throw new Error(`Target item with key '${targetItemKey}' not found`);
    }

    // Find the target component to determine paste behavior
    const targetComponent = this.findComponentInItem(targetItem, targetComponentKey);
    const pasteInfo = this.determinePasteLocation(targetItem, targetComponentKey, targetComponent);

    // Generate unique component key
    const originalComponentKey = ItemComponentKey.fromFullKey(clipboardData.componentKey, clipboardData.parentItemKey);
    const newComponentKey = this.generateUniqueComponentKey(originalComponentKey.componentKey, targetItemKey, pasteInfo.parentComponentKey);
    const newFullComponentKey = pasteInfo.parentComponentKey ?
      `${pasteInfo.parentComponentKey}.${newComponentKey}` :
      newComponentKey;

    // Update component data with new keys
    const updatedComponentData = this.updateComponentKeysInData(
      clipboardData.componentData,
      clipboardData.componentKey,
      newFullComponentKey,
      targetItemKey
    );

    // Create the component from JSON
    const newComponent = this.createComponentFromJson(updatedComponentData, pasteInfo.parentComponentKey, targetItemKey);

    // Insert component based on determined location
    if (pasteInfo.shouldReplace && targetComponent) {
      this.replaceComponent(targetItem, targetComponent, newComponent, pasteInfo);
    } else {
      this.insertComponentIntoItem(targetItem, newComponent, pasteInfo.location);
    }

    // Update translations
    this.updateComponentTranslations(targetItemKey, clipboardData.translations, clipboardData.componentKey, newFullComponentKey);

    return newFullComponentKey;
  }

  // PRIVATE HELPER METHODS

  /**
   * Validate clipboard data format
   */
  private isValidClipboardData(data: any): data is SurveyItemClipboardData {
    return (
      data &&
      typeof data === 'object' &&
      data.type === 'survey-item' &&
      data.version &&
      data.items &&
      Array.isArray(data.items) &&
      data.items.length > 0 &&
      data.items.every((item: any) =>
        item &&
        typeof item === 'object' &&
        item.itemKey &&
        typeof item.itemKey === 'string' &&
        item.itemData &&
        typeof item.itemData === 'object'
      ) &&
      data.translations &&
      typeof data.translations === 'object' &&
      data.prefills &&
      typeof data.prefills === 'object' &&
      data.rootItemKey &&
      typeof data.rootItemKey === 'string' &&
      typeof data.timestamp === 'number'
    );
  }

  /**
   * Validate component clipboard data format
   */
  private isValidComponentClipboardData(data: any): data is SurveyComponentClipboardData {
    return (
      data &&
      typeof data === 'object' &&
      data.type === 'survey-component' &&
      data.version &&
      data.componentData &&
      data.componentKey &&
      data.parentItemKey &&
      data.translations &&
      typeof data.timestamp === 'number'
    );
  }

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
   * Generate a unique component key within the target item
   */
  private generateUniqueComponentKey(baseKey: string, targetItemKey: string, parentComponentKey?: string): string {
    let counter = 1;
    let candidateKey = `${baseKey}_copy`;

    // Keep incrementing until we find a unique key
    while (this.componentKeyExists(targetItemKey, candidateKey, parentComponentKey)) {
      counter++;
      candidateKey = `${baseKey}_copy_${counter}`;
    }

    return candidateKey;
  }

  /**
   * Check if a component key already exists in the target item
   */
  private componentKeyExists(itemKey: string, componentKey: string, parentComponentKey?: string): boolean {
    const fullComponentKey = parentComponentKey ? `${parentComponentKey}.${componentKey}` : componentKey;
    const item = this.survey.surveyItems[itemKey];
    if (!item) return false;

    return this.findComponentInItem(item, fullComponentKey) !== null;
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
   * Add an item to the survey at the specified target location
   */
  private addItemToSurvey(target: {
    parentKey: string;
    index?: number;
  }, item: SurveyItem, content: SurveyItemTranslations): void {
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

    // Add the item to the survey items collection
    this.survey.surveyItems[item.key.fullKey] = item;

    // Add the item key to the parent group's items array
    parentGroup.items.splice(insertIndex, 0, item.key.fullKey);

    // Update translations in the survey
    this.survey.translations.setItemTranslations(item.key.fullKey, content);
  }

  /**
   * Recursively create child items for a group item
   */
  private createChildItemsRecursively(originalParentKey: string, newParentKey: string, originalClipboardData: SurveyItemClipboardData): void {
    const groupData = originalClipboardData.items[0].itemData as any;

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
            this.createChildItemsRecursively(originalChildKey, newChildKey.fullKey, childClipboardData);
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
   * Create a component from JSON data
   */
  private createComponentFromJson(componentData: any, parentComponentKey: string | undefined, itemKey: string): ItemComponent {
    // Determine component type and use appropriate factory method
    const componentType = componentData.type;

    // For response config components, use specialized factories
    if (componentType === ItemComponentType.SingleChoice || componentType === ItemComponentType.MultipleChoice) {
      return ScgMcgChoiceResponseConfig.fromJson(componentData, parentComponentKey, itemKey);
    }

    // For ScgMcg option components
    if (componentType === ItemComponentType.ScgMcgOption ||
      componentType === ItemComponentType.ScgMcgOptionWithTextInput ||
      componentType === ItemComponentType.ScgMcgOptionWithNumberInput ||
      componentType === ItemComponentType.ScgMcgOptionWithDateInput ||
      componentType === ItemComponentType.ScgMcgOptionWithTimeInput ||
      componentType === ItemComponentType.ScgMcgOptionWithDropdown ||
      componentType === ItemComponentType.ScgMcgOptionWithCloze) {
      return ScgMcgOptionBase.fromJson(componentData, parentComponentKey, itemKey);
    }

    // Default to DisplayComponent for display components
    return DisplayComponent.fromJson(componentData, parentComponentKey, itemKey);
  }

  /**
   * Insert a component into an item at the specified location
   */
  private insertComponentIntoItem(
    item: SurveyItem,
    component: ItemComponent,
    location?: {
      parentComponentKey?: string;
      section?: 'header' | 'body' | 'footer' | 'responseConfig' | 'components';
      subSection?: 'title' | 'subtitle' | 'helpPopover' | 'topContent' | 'bottomContent';
      index?: number;
    }
  ): void {
    if (item.itemType === SurveyItemType.Display) {
      const displayItem = item as DisplayItem;
      if (!displayItem.components) displayItem.components = [];

      const insertIndex = location?.index !== undefined ?
        Math.min(location.index, displayItem.components.length) :
        displayItem.components.length;

      displayItem.components.splice(insertIndex, 0, component as DisplayComponent);
    } else if (item.itemType === SurveyItemType.SingleChoiceQuestion || item.itemType === SurveyItemType.MultipleChoiceQuestion) {
      const questionItem = item as QuestionItem;

      // Handle insertion into response config (group components like SingleChoice options)
      if (location?.parentComponentKey) {
        const parentComponent = this.findComponentInItem(item, location.parentComponentKey);
        if (parentComponent && parentComponent instanceof GroupComponent) {
          if (!parentComponent.items) parentComponent.items = [];
          const insertIndex = location.index !== undefined ?
            Math.min(location.index, parentComponent.items.length) :
            parentComponent.items.length;
          parentComponent.items.splice(insertIndex, 0, component);
          return;
        }
      }

      if (location?.section === 'header') {
        if (!questionItem.header) questionItem.header = {};
        if (location.subSection === 'title') questionItem.header.title = component as TextComponent;
        else if (location.subSection === 'subtitle') questionItem.header.subtitle = component as TextComponent;
        else if (location.subSection === 'helpPopover') questionItem.header.helpPopover = component as TextComponent;
      } else if (location?.section === 'body') {
        if (!questionItem.body) questionItem.body = {};
        if (location.subSection === 'topContent') {
          if (!questionItem.body.topContent) questionItem.body.topContent = [];
          const insertIndex = location.index !== undefined ?
            Math.min(location.index, questionItem.body.topContent.length) :
            questionItem.body.topContent.length;
          questionItem.body.topContent.splice(insertIndex, 0, component as DisplayComponent);
        } else if (location.subSection === 'bottomContent') {
          if (!questionItem.body.bottomContent) questionItem.body.bottomContent = [];
          const insertIndex = location.index !== undefined ?
            Math.min(location.index, questionItem.body.bottomContent.length) :
            questionItem.body.bottomContent.length;
          questionItem.body.bottomContent.splice(insertIndex, 0, component as DisplayComponent);
        }
      } else if (location?.section === 'footer') {
        questionItem.footer = component as TextComponent;
      } else {
        // Default to body top content for question items
        if (!questionItem.body) questionItem.body = {};
        if (!questionItem.body.topContent) questionItem.body.topContent = [];
        questionItem.body.topContent.push(component as DisplayComponent);
      }
    }
  }

  /**
   * Update component translations for the pasted component
   */
  private updateComponentTranslations(
    targetItemKey: string,
    componentTranslations: { [locale: string]: { [contentKey: string]: any } },
    oldComponentKey: string,
    newComponentKey: string
  ): void {
    Object.keys(componentTranslations).forEach(locale => {
      const localeTranslations = componentTranslations[locale];
      Object.keys(localeTranslations).forEach(contentKey => {
        // Update content key if it references the old component key
        let newContentKey = contentKey;
        if (contentKey === oldComponentKey) {
          newContentKey = newComponentKey;
        } else if (contentKey.startsWith(oldComponentKey + '.')) {
          newContentKey = contentKey.replace(oldComponentKey, newComponentKey);
        }

        // Set the translation in the target item
        const itemTranslations = this.survey.getItemTranslations(targetItemKey) || new SurveyItemTranslations();
        itemTranslations.setContent(locale, newContentKey, localeTranslations[contentKey]);
        this.survey.translations.setItemTranslations(targetItemKey, itemTranslations);
      });
    });
  }

  /**
   * Determine where and how to paste a component based on the target
   */
  private determinePasteLocation(item: SurveyItem, targetComponentKey: string, targetComponent: ItemComponent | null): {
    shouldReplace: boolean;
    parentComponentKey?: string;
    location?: {
      parentComponentKey?: string;
      section?: 'header' | 'body' | 'footer' | 'responseConfig' | 'components';
      subSection?: 'title' | 'subtitle' | 'helpPopover' | 'topContent' | 'bottomContent';
      index?: number;
    };
  } {
    // If target component doesn't exist, determine insertion location based on key structure
    if (!targetComponent) {
      return this.determinePasteLocationFromKey(item, targetComponentKey);
    }

    // Determine behavior based on component type and location
    if (item.itemType === SurveyItemType.SingleChoiceQuestion || item.itemType === SurveyItemType.MultipleChoiceQuestion) {
      const questionItem = item as QuestionItem;

      // Check if target is a single-slot component (replace behavior)
      if (questionItem.header?.title?.key.fullKey === targetComponentKey) {
        return {
          shouldReplace: true,
          location: { section: 'header', subSection: 'title' }
        };
      }
      if (questionItem.header?.subtitle?.key.fullKey === targetComponentKey) {
        return {
          shouldReplace: true,
          location: { section: 'header', subSection: 'subtitle' }
        };
      }
      if (questionItem.header?.helpPopover?.key.fullKey === targetComponentKey) {
        return {
          shouldReplace: true,
          location: { section: 'header', subSection: 'helpPopover' }
        };
      }
      if (questionItem.footer?.key.fullKey === targetComponentKey) {
        return {
          shouldReplace: true,
          location: { section: 'footer' }
        };
      }

      // Check if target is in a group component (add behavior)
      // Check response config (SingleChoice/MultipleChoice with items)
      if (questionItem.responseConfig.key.fullKey === targetComponentKey) {
        return {
          shouldReplace: false,
          parentComponentKey: targetComponentKey,
          location: { parentComponentKey: targetComponentKey }
        };
      }

      // Check if target is in topContent or bottomContent arrays
      const topContentMatch = questionItem.body?.topContent?.find(comp => comp.key.fullKey === targetComponentKey);
      if (topContentMatch) {
        return {
          shouldReplace: false,
          location: { section: 'body', subSection: 'topContent' }
        };
      }

      const bottomContentMatch = questionItem.body?.bottomContent?.find(comp => comp.key.fullKey === targetComponentKey);
      if (bottomContentMatch) {
        return {
          shouldReplace: false,
          location: { section: 'body', subSection: 'bottomContent' }
        };
      }
    }

    if (item.itemType === SurveyItemType.Display) {
      const displayItem = item as DisplayItem;

      // For display items, components array allows adding
      const componentMatch = displayItem.components?.find(comp => comp.key.fullKey === targetComponentKey);
      if (componentMatch) {
        return {
          shouldReplace: false,
          location: { section: 'components' }
        };
      }
    }

    // Default to adding behavior if we can't determine the specific context
    return {
      shouldReplace: false,
      location: undefined
    };
  }

  /**
   * Determine paste location when target component doesn't exist based on key structure
   */
  private determinePasteLocationFromKey(item: SurveyItem, targetComponentKey: string): {
    shouldReplace: boolean;
    parentComponentKey?: string;
    location?: {
      parentComponentKey?: string;
      section?: 'header' | 'body' | 'footer' | 'responseConfig' | 'components';
      subSection?: 'title' | 'subtitle' | 'helpPopover' | 'topContent' | 'bottomContent';
      index?: number;
    };
  } {
    if (item.itemType === SurveyItemType.SingleChoiceQuestion || item.itemType === SurveyItemType.MultipleChoiceQuestion) {
      // Analyze key structure to determine intended location
      if (targetComponentKey === 'title') {
        return { shouldReplace: true, location: { section: 'header', subSection: 'title' } };
      }
      if (targetComponentKey === 'subtitle') {
        return { shouldReplace: true, location: { section: 'header', subSection: 'subtitle' } };
      }
      if (targetComponentKey === 'helpPopover') {
        return { shouldReplace: true, location: { section: 'header', subSection: 'helpPopover' } };
      }
      if (targetComponentKey === 'footer') {
        return { shouldReplace: true, location: { section: 'footer' } };
      }
      if (targetComponentKey === 'rg' || targetComponentKey.startsWith('rg.')) {
        return { shouldReplace: false, parentComponentKey: 'rg', location: { parentComponentKey: 'rg' } };
      }

      // Default to body top content for question items
      return { shouldReplace: false, location: { section: 'body', subSection: 'topContent' } };
    }

    if (item.itemType === SurveyItemType.Display) {
      // Default to components array for display items
      return { shouldReplace: false, location: { section: 'components' } };
    }

    // Default behavior
    return { shouldReplace: false, location: undefined };
  }

  /**
   * Replace an existing component with a new one
   */
  private replaceComponent(
    item: SurveyItem,
    oldComponent: ItemComponent,
    newComponent: ItemComponent,
    pasteInfo: { location?: any }
  ): void {
    if (item.itemType === SurveyItemType.SingleChoiceQuestion || item.itemType === SurveyItemType.MultipleChoiceQuestion) {
      const questionItem = item as QuestionItem;

      if (pasteInfo.location?.section === 'header') {
        if (!questionItem.header) questionItem.header = {};
        if (pasteInfo.location.subSection === 'title') {
          questionItem.header.title = newComponent as TextComponent;
        } else if (pasteInfo.location.subSection === 'subtitle') {
          questionItem.header.subtitle = newComponent as TextComponent;
        } else if (pasteInfo.location.subSection === 'helpPopover') {
          questionItem.header.helpPopover = newComponent as TextComponent;
        }
      } else if (pasteInfo.location?.section === 'footer') {
        questionItem.footer = newComponent as TextComponent;
      }
    }
  }
}
