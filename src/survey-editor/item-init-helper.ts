import { SurveyEditor } from "./survey-editor";
import { GroupItem, SurveyItemType } from "../survey/items";
import { SurveyItemTranslations } from "../survey/utils";

interface Target {
  parentFullKey: string;
  position?: number;
}

export class ItemInitHelper {
  constructor(private _editor: SurveyEditor) {

  }

  // Structure items
  group(target: Target, shuffleItems: boolean = false): string {
    // Generate a unique key for the new group
    const uniqueKey = this.generateUniqueKey(target.parentFullKey);

    // Create the new GroupItem
    const newGroup = new GroupItem(`${target.parentFullKey}.${uniqueKey}`);
    newGroup.shuffleItems = shuffleItems;


    // Add the group to the survey via the editor
    this._editor.addItem({
      parentKey: target.parentFullKey,
      index: target.position
    }, newGroup);

    return newGroup.key.fullKey;
  }

  surveyEnd(target: Target) {

  }

  pageBreak(target: Target) {
  }

  // Display items
  displayItem(target: Target) {
  }

  // Response items
  singleChoiceQuestion(target: Target) {

  }

  multipleChoiceQuestion(target: Target) {

  }


  /**
  * Generates a unique item key of specified length within the specified parent.
  * Keeps generating until it finds a key that doesn't already exist among siblings.
  * @param parentFullKey The full key of the parent item
  * @param keyLength The length of the key to generate (default: 3)
  * @returns A unique string of the specified length
  */
  private generateUniqueKey(parentFullKey: string, keyLength: number = 3): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Get existing sibling item keys within the parent
    const existingSiblingKeys = new Set<string>();

    for (const itemFullKey of Object.keys(this._editor.survey.surveyItems)) {
      const item = this._editor.survey.surveyItems[itemFullKey];

      // Check if this item has the same parent
      if (item.key.parentFullKey === parentFullKey) {
        existingSiblingKeys.add(item.key.itemKey);
      }
    }

    // Generate keys until we find a unique one
    let attempts = 0;
    const maxAttempts = 1000; // Safety limit to prevent infinite loops

    while (attempts < maxAttempts) {
      let key = '';
      for (let i = 0; i < keyLength; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      if (!existingSiblingKeys.has(key)) {
        return key;
      }

      attempts++;
    }

    throw new Error(`Failed to generate unique key after ${maxAttempts} attempts`);
  }
}
