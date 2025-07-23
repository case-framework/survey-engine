import { SurveyEditor } from "./survey-editor";
import { DisplayItem, GroupItem, MultipleChoiceQuestionItem, PageBreakItem, SingleChoiceQuestionItem, SurveyEndItem } from "../survey/items";
import { ContentType, SurveyItemTranslations } from "../survey/utils";

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

  surveyEnd(target: Target): string {
    // Generate a unique key for the new survey end
    const uniqueKey = this.generateUniqueKey(target.parentFullKey);

    // Create the new SurveyEndItem
    const newSurveyEnd = new SurveyEndItem(`${target.parentFullKey}.${uniqueKey}`);

    // Create translations for the survey end (empty by default)
    const translations = new SurveyItemTranslations();
    for (const locale of this._editor.survey.locales) {
      translations.setContent(locale, 'title', {
        content: '',
        type: ContentType.CQM
      });
    }

    // Add the survey end to the survey via the editor
    this._editor.addItem({
      parentKey: target.parentFullKey,
      index: target.position
    }, newSurveyEnd, translations);

    return newSurveyEnd.key.fullKey;
  }

  pageBreak(target: Target): string {
    // Generate a unique key for the new page break
    const uniqueKey = this.generateUniqueKey(target.parentFullKey);

    // Create the new PageBreakItem
    const newPageBreak = new PageBreakItem(`${target.parentFullKey}.${uniqueKey}`);

    // Add the page break to the survey via the editor
    this._editor.addItem({
      parentKey: target.parentFullKey,
      index: target.position
    }, newPageBreak);

    return newPageBreak.key.fullKey;
  }

  // Display items
  displayItem(target: Target) {
    // Generate a unique key for the new display item
    const uniqueKey = this.generateUniqueKey(target.parentFullKey);

    // Create the new DisplayItem
    const newDisplayItem = new DisplayItem(`${target.parentFullKey}.${uniqueKey}`);

    // Add the display item to the survey via the editor
    this._editor.addItem({
      parentKey: target.parentFullKey,
      index: target.position
    }, newDisplayItem);

    return newDisplayItem.key.fullKey;
  }

  // Response items
  singleChoiceQuestion(target: Target) {
    // Generate a unique key for the new single choice question
    const uniqueKey = this.generateUniqueKey(target.parentFullKey);

    // Create the new SingleChoiceQuestionItem
    const newSingleChoiceQuestion = new SingleChoiceQuestionItem(`${target.parentFullKey}.${uniqueKey}`);

    // Add the single choice question to the survey via the editor
    this._editor.addItem({
      parentKey: target.parentFullKey,
      index: target.position
    }, newSingleChoiceQuestion);

    return newSingleChoiceQuestion.key.fullKey;
  }

  multipleChoiceQuestion(target: Target) {
    // Generate a unique key for the new multiple choice question
    const uniqueKey = this.generateUniqueKey(target.parentFullKey);

    // Create the new MultipleChoiceQuestionItem
    const newMultipleChoiceQuestion = new MultipleChoiceQuestionItem(`${target.parentFullKey}.${uniqueKey}`);

    // Add the multiple choice question to the survey via the editor
    this._editor.addItem({
      parentKey: target.parentFullKey,
      index: target.position
    }, newMultipleChoiceQuestion);

    return newMultipleChoiceQuestion.key.fullKey;
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
