import { Survey } from '../survey/survey';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { ItemInitHelper } from '../survey-editor/item-init-helper';
import { GroupItem, DisplayItem, SurveyItemType } from '../survey/items';
import { ContentType } from '../survey/utils/content';

// Helper function to create a test survey with some existing items
const createTestSurvey = (surveyKey: string = 'test-survey'): Survey => {
  const survey = new Survey(surveyKey);

  // Add a sub-group to the root
  const subGroup = new GroupItem(`${surveyKey}.page1`);
  survey.surveyItems[`${surveyKey}.page1`] = subGroup;

  // Add the sub-group to the root group's items
  const rootGroup = survey.surveyItems[surveyKey] as GroupItem;
  rootGroup.items = [`${surveyKey}.page1`];

  return survey;
};

// Helper function to add items with known keys to test uniqueness
const addKnownItems = (survey: Survey, parentKey: string, itemKeys: string[]): void => {
  itemKeys.forEach(key => {
    const fullKey = `${parentKey}.${key}`;
    const item = new DisplayItem(fullKey);
    survey.surveyItems[fullKey] = item;

    // Add to parent's items array
    const parentItem = survey.surveyItems[parentKey] as GroupItem;
    if (!parentItem.items) {
      parentItem.items = [];
    }
    parentItem.items.push(fullKey);
  });
};

describe('ItemInitHelper', () => {
  let survey: Survey;
  let editor: SurveyEditor;
  let initAndAdd: ItemInitHelper;

  beforeEach(() => {
    survey = createTestSurvey();
    editor = new SurveyEditor(survey);
    initAndAdd = new ItemInitHelper(editor);
  });

  describe('generateUniqueKey', () => {
    it('should generate a 3-character key by default', () => {
      const key = (initAndAdd as any).generateUniqueKey('test-survey.page1');

      expect(typeof key).toBe('string');
      expect(key).toHaveLength(3);
      expect(key).toMatch(/^[a-zA-Z0-9]{3}$/);
    });

    it('should generate a key of specified length', () => {
      const key5 = (initAndAdd as any).generateUniqueKey('test-survey.page1', 5);
      const key1 = (initAndAdd as any).generateUniqueKey('test-survey.page1', 1);
      const key10 = (initAndAdd as any).generateUniqueKey('test-survey.page1', 10);

      expect(key5).toHaveLength(5);
      expect(key1).toHaveLength(1);
      expect(key10).toHaveLength(10);

      expect(key5).toMatch(/^[a-zA-Z0-9]{5}$/);
      expect(key1).toMatch(/^[a-zA-Z0-9]{1}$/);
      expect(key10).toMatch(/^[a-zA-Z0-9]{10}$/);
    });

    it('should generate unique keys when siblings exist', () => {
      // Add some existing items with known keys
      addKnownItems(survey, 'test-survey.page1', ['abc', 'def', 'xyz']);

      const generatedKeys = new Set<string>();

      // Generate multiple keys and ensure they're all unique and different from existing ones
      for (let i = 0; i < 10; i++) {
        const key = (initAndAdd as any).generateUniqueKey('test-survey.page1');

        expect(key).not.toBe('abc');
        expect(key).not.toBe('def');
        expect(key).not.toBe('xyz');
        expect(generatedKeys.has(key)).toBe(false);

        generatedKeys.add(key);
      }

      expect(generatedKeys.size).toBe(10);
    });

    it('should handle empty parent (no existing siblings)', () => {
      const key = (initAndAdd as any).generateUniqueKey('test-survey.page1');

      expect(typeof key).toBe('string');
      expect(key).toHaveLength(3);
      expect(key).toMatch(/^[a-zA-Z0-9]{3}$/);
    });

    it('should generate different keys for different parents', () => {
      // Add another sub-group
      const subGroup2 = new GroupItem('test-survey.page2');
      survey.surveyItems['test-survey.page2'] = subGroup2;
      const rootGroup = survey.surveyItems['test-survey'] as GroupItem;
      rootGroup.items?.push('test-survey.page2');

      // Add the same key to both parents
      addKnownItems(survey, 'test-survey.page1', ['abc']);
      addKnownItems(survey, 'test-survey.page2', ['abc']);

      // Generate keys for both parents - they should be able to avoid 'abc' independently
      const key1 = (initAndAdd as any).generateUniqueKey('test-survey.page1');
      const key2 = (initAndAdd as any).generateUniqueKey('test-survey.page2');

      expect(key1).not.toBe('abc');
      expect(key2).not.toBe('abc');
      expect(typeof key1).toBe('string');
      expect(typeof key2).toBe('string');
    });

    it('should work with nested parent keys', () => {
      // Create a deeply nested structure
      const nestedGroup = new GroupItem('test-survey.page1.section1');
      survey.surveyItems['test-survey.page1.section1'] = nestedGroup;

      const key = (initAndAdd as any).generateUniqueKey('test-survey.page1.section1');

      expect(typeof key).toBe('string');
      expect(key).toHaveLength(3);
      expect(key).toMatch(/^[a-zA-Z0-9]{3}$/);
    });

    it('should handle case where many keys are already taken', () => {
      // Fill up many single character combinations to test the algorithm under pressure
      const existingKeys: string[] = [];
      for (let i = 0; i < 100; i++) {
        existingKeys.push(`k${i.toString().padStart(2, '0')}`);
      }

      addKnownItems(survey, 'test-survey.page1', existingKeys);

      const key = (initAndAdd as any).generateUniqueKey('test-survey.page1');

      expect(typeof key).toBe('string');
      expect(key).toHaveLength(3);
      expect(existingKeys).not.toContain(key);
    });

    it('should throw error if unable to generate unique key after max attempts', () => {
      // Mock Math.random to always return the same value, causing key generation to fail
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.5);

      // Calculate what key will be generated when random always returns 0.5
      // chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' (62 chars)
      // Math.floor(0.5 * 62) = 31, which is 'F' (0-indexed)
      const predictableKey = 'FFF';
      addKnownItems(survey, 'test-survey.page1', [predictableKey]);

      expect(() => {
        (initAndAdd as any).generateUniqueKey('test-survey.page1');
      }).toThrow('Failed to generate unique key after 1000 attempts');

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should generate multiple unique keys in sequence', () => {
      const generatedKeys = new Set<string>();

      // Generate 20 keys and ensure they're all unique
      for (let i = 0; i < 20; i++) {
        const key = (initAndAdd as any).generateUniqueKey('test-survey.page1');
        expect(generatedKeys.has(key)).toBe(false);
        generatedKeys.add(key);

        // Add the generated key to the survey so the next generation avoids it
        const fullKey = `test-survey.page1.${key}`;
        const item = new DisplayItem(fullKey);
        survey.surveyItems[fullKey] = item;

        // Add to parent's items array
        const parentItem = survey.surveyItems['test-survey.page1'] as GroupItem;
        if (!parentItem.items) {
          parentItem.items = [];
        }
        parentItem.items.push(fullKey);
      }

      expect(generatedKeys.size).toBe(20);
    });
  });

  describe('initAndAddGroup', () => {
    it('should create and add a group with default shuffleItems (false)', () => {
      const parentKey = 'test-survey.page1';

      const groupKey = initAndAdd.group({
        parentFullKey: parentKey
      });

      // Verify the group was created
      expect(groupKey).toBeDefined();
      expect(groupKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the group exists in the survey
      const createdGroup = survey.surveyItems[groupKey] as GroupItem;
      expect(createdGroup).toBeDefined();
      expect(createdGroup.itemType).toBe(SurveyItemType.Group);
      expect(createdGroup.shuffleItems).toBe(false);

      // Verify the group was added to the parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(groupKey);
    });

    it('should create and add a group with shuffleItems set to true', () => {
      const parentKey = 'test-survey.page1';

      const groupKey = initAndAdd.group({
        parentFullKey: parentKey
      }, true);

      // Verify the group was created with shuffleItems = true
      const createdGroup = survey.surveyItems[groupKey] as GroupItem;
      expect(createdGroup).toBeDefined();
      expect(createdGroup.itemType).toBe(SurveyItemType.Group);
      expect(createdGroup.shuffleItems).toBe(true);

      // Verify the group was added to the parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(groupKey);
    });

    it('should create and add a group with shuffleItems explicitly set to false', () => {
      const parentKey = 'test-survey.page1';

      const groupKey = initAndAdd.group({
        parentFullKey: parentKey
      }, false);

      // Verify the group was created with shuffleItems = false
      const createdGroup = survey.surveyItems[groupKey] as GroupItem;
      expect(createdGroup).toBeDefined();
      expect(createdGroup.itemType).toBe(SurveyItemType.Group);
      expect(createdGroup.shuffleItems).toBe(false);
    });

    it('should add group at specified position', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      const item2 = new DisplayItem(`${parentKey}.item2`);
      survey.surveyItems[`${parentKey}.item1`] = item1;
      survey.surveyItems[`${parentKey}.item2`] = item2;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`, `${parentKey}.item2`];

      // Add group at position 1 (between item1 and item2)
      const groupKey = initAndAdd.group({
        parentFullKey: parentKey,
        position: 1
      });

      // Verify the group was inserted at the correct position
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        groupKey,
        `${parentKey}.item2`
      ]);
    });

    it('should add group at the end when no position is specified', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      survey.surveyItems[`${parentKey}.item1`] = item1;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`];

      // Add group without specifying position
      const groupKey = initAndAdd.group({
        parentFullKey: parentKey
      });

      // Verify the group was added at the end
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        groupKey
      ]);
    });

    it('should generate unique keys for multiple groups', () => {
      const parentKey = 'test-survey.page1';

      // Create multiple groups
      const group1Key = initAndAdd.group({
        parentFullKey: parentKey
      });
      const group2Key = initAndAdd.group({
        parentFullKey: parentKey
      });
      const group3Key = initAndAdd.group({
        parentFullKey: parentKey
      });

      // Verify all keys are unique
      expect(group1Key).not.toBe(group2Key);
      expect(group1Key).not.toBe(group3Key);
      expect(group2Key).not.toBe(group3Key);

      // Verify all groups exist
      expect(survey.surveyItems[group1Key]).toBeDefined();
      expect(survey.surveyItems[group2Key]).toBeDefined();
      expect(survey.surveyItems[group3Key]).toBeDefined();

      // Verify all are added to parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(group1Key);
      expect(parentGroup.items).toContain(group2Key);
      expect(parentGroup.items).toContain(group3Key);
    });

    it('should work with root group as parent', () => {
      const rootKey = 'test-survey';

      const groupKey = initAndAdd.group({
        parentFullKey: rootKey
      }, true);

      // Verify the group was created and added to root
      const createdGroup = survey.surveyItems[groupKey] as GroupItem;
      expect(createdGroup).toBeDefined();
      expect(createdGroup.shuffleItems).toBe(true);

      const rootGroup = survey.surveyItems[rootKey] as GroupItem;
      expect(rootGroup.items).toContain(groupKey);
    });

    it('should throw error for non-existent parent', () => {
      expect(() => {
        initAndAdd.group({
          parentFullKey: 'non-existent-parent'
        });
      }).toThrow();
    });

    it('should return the full key of the created group', () => {
      const parentKey = 'test-survey.page1';

      const groupKey = initAndAdd.group({
        parentFullKey: parentKey
      });

      // Verify the returned key is a valid full key format
      expect(groupKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the key corresponds to an actual item
      expect(survey.surveyItems[groupKey]).toBeDefined();
    });
  });

  describe('surveyEnd', () => {
    it('should create and add a survey end item with translations', () => {
      const parentKey = 'test-survey.page1';

      // Set up locales in the survey first
      survey.translations.setSurveyCardContent('en', {
        name: { type: ContentType.md, content: 'Test Survey' },
        description: { type: ContentType.md, content: 'Test Description' },
        typicalDuration: { type: ContentType.md, content: '5 minutes' }
      });

      const surveyEndKey = initAndAdd.surveyEnd({
        parentFullKey: parentKey
      });

      // Verify the survey end was created
      expect(surveyEndKey).toBeDefined();
      expect(surveyEndKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the survey end exists in the survey
      const createdSurveyEnd = survey.surveyItems[surveyEndKey];
      expect(createdSurveyEnd).toBeDefined();
      expect(createdSurveyEnd.itemType).toBe(SurveyItemType.SurveyEnd);

      // Verify the survey end was added to the parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(surveyEndKey);

      // Verify translations were created
      const itemTranslations = survey.getItemTranslations(surveyEndKey);
      expect(itemTranslations?.getContent('en', 'title')).toBeDefined();
    });

    it('should add survey end at specified position', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      const item2 = new DisplayItem(`${parentKey}.item2`);
      survey.surveyItems[`${parentKey}.item1`] = item1;
      survey.surveyItems[`${parentKey}.item2`] = item2;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`, `${parentKey}.item2`];

      // Add survey end at position 1 (between item1 and item2)
      const surveyEndKey = initAndAdd.surveyEnd({
        parentFullKey: parentKey,
        position: 1
      });

      // Verify the survey end was inserted at the correct position
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        surveyEndKey,
        `${parentKey}.item2`
      ]);
    });

    it('should add survey end at the end when no position is specified', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      survey.surveyItems[`${parentKey}.item1`] = item1;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`];

      // Add survey end without specifying position
      const surveyEndKey = initAndAdd.surveyEnd({
        parentFullKey: parentKey
      });

      // Verify the survey end was added at the end
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        surveyEndKey
      ]);
    });

    it('should generate unique keys for multiple survey ends', () => {
      const parentKey = 'test-survey.page1';

      // Create multiple survey ends
      const surveyEnd1Key = initAndAdd.surveyEnd({
        parentFullKey: parentKey
      });
      const surveyEnd2Key = initAndAdd.surveyEnd({
        parentFullKey: parentKey
      });

      // Verify all keys are unique
      expect(surveyEnd1Key).not.toBe(surveyEnd2Key);

      // Verify all survey ends exist
      expect(survey.surveyItems[surveyEnd1Key]).toBeDefined();
      expect(survey.surveyItems[surveyEnd2Key]).toBeDefined();

      // Verify all are added to parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(surveyEnd1Key);
      expect(parentGroup.items).toContain(surveyEnd2Key);
    });

    it('should work with root group as parent', () => {
      const rootKey = 'test-survey';

      const surveyEndKey = initAndAdd.surveyEnd({
        parentFullKey: rootKey
      });

      // Verify the survey end was created and added to root
      const createdSurveyEnd = survey.surveyItems[surveyEndKey];
      expect(createdSurveyEnd).toBeDefined();
      expect(createdSurveyEnd.itemType).toBe(SurveyItemType.SurveyEnd);

      const rootGroup = survey.surveyItems[rootKey] as GroupItem;
      expect(rootGroup.items).toContain(surveyEndKey);
    });

    it('should throw error for non-existent parent', () => {
      expect(() => {
        initAndAdd.surveyEnd({
          parentFullKey: 'non-existent-parent'
        });
      }).toThrow();
    });

    it('should return the full key of the created survey end', () => {
      const parentKey = 'test-survey.page1';

      const surveyEndKey = initAndAdd.surveyEnd({
        parentFullKey: parentKey
      });

      // Verify the returned key is a valid full key format
      expect(surveyEndKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the key corresponds to an actual item
      expect(survey.surveyItems[surveyEndKey]).toBeDefined();
    });
  });

  describe('displayItem', () => {
    it('should create and add a display item', () => {
      const parentKey = 'test-survey.page1';

      const displayItemKey = initAndAdd.displayItem({
        parentFullKey: parentKey
      });

      // Verify the display item was created
      expect(displayItemKey).toBeDefined();
      expect(displayItemKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the display item exists in the survey
      const createdDisplayItem = survey.surveyItems[displayItemKey];
      expect(createdDisplayItem).toBeDefined();
      expect(createdDisplayItem.itemType).toBe(SurveyItemType.Display);

      // Verify the display item was added to the parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(displayItemKey);
    });

    it('should add display item at specified position', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      const item2 = new DisplayItem(`${parentKey}.item2`);
      survey.surveyItems[`${parentKey}.item1`] = item1;
      survey.surveyItems[`${parentKey}.item2`] = item2;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`, `${parentKey}.item2`];

      // Add display item at position 1 (between item1 and item2)
      const displayItemKey = initAndAdd.displayItem({
        parentFullKey: parentKey,
        position: 1
      });

      // Verify the display item was inserted at the correct position
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        displayItemKey,
        `${parentKey}.item2`
      ]);
    });

    it('should work with root group as parent', () => {
      const rootKey = 'test-survey';

      const displayItemKey = initAndAdd.displayItem({
        parentFullKey: rootKey
      });

      // Verify the display item was created and added to root
      const createdDisplayItem = survey.surveyItems[displayItemKey];
      expect(createdDisplayItem).toBeDefined();
      expect(createdDisplayItem.itemType).toBe(SurveyItemType.Display);

      const rootGroup = survey.surveyItems[rootKey] as GroupItem;
      expect(rootGroup.items).toContain(displayItemKey);
    });

    it('should throw error for non-existent parent', () => {
      expect(() => {
        initAndAdd.displayItem({
          parentFullKey: 'non-existent-parent'
        });
      }).toThrow();
    });
  });

  describe('singleChoiceQuestion', () => {
    it('should create and add a single choice question', () => {
      const parentKey = 'test-survey.page1';

      const singleChoiceKey = initAndAdd.singleChoiceQuestion({
        parentFullKey: parentKey
      });

      // Verify the single choice question was created
      expect(singleChoiceKey).toBeDefined();
      expect(singleChoiceKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the single choice question exists in the survey
      const createdSingleChoice = survey.surveyItems[singleChoiceKey];
      expect(createdSingleChoice).toBeDefined();
      expect(createdSingleChoice.itemType).toBe(SurveyItemType.SingleChoiceQuestion);

      // Verify the single choice question was added to the parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(singleChoiceKey);
    });

    it('should add single choice question at specified position', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      const item2 = new DisplayItem(`${parentKey}.item2`);
      survey.surveyItems[`${parentKey}.item1`] = item1;
      survey.surveyItems[`${parentKey}.item2`] = item2;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`, `${parentKey}.item2`];

      // Add single choice question at position 1 (between item1 and item2)
      const singleChoiceKey = initAndAdd.singleChoiceQuestion({
        parentFullKey: parentKey,
        position: 1
      });

      // Verify the single choice question was inserted at the correct position
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        singleChoiceKey,
        `${parentKey}.item2`
      ]);
    });

    it('should work with root group as parent', () => {
      const rootKey = 'test-survey';

      const singleChoiceKey = initAndAdd.singleChoiceQuestion({
        parentFullKey: rootKey
      });

      // Verify the single choice question was created and added to root
      const createdSingleChoice = survey.surveyItems[singleChoiceKey];
      expect(createdSingleChoice).toBeDefined();
      expect(createdSingleChoice.itemType).toBe(SurveyItemType.SingleChoiceQuestion);

      const rootGroup = survey.surveyItems[rootKey] as GroupItem;
      expect(rootGroup.items).toContain(singleChoiceKey);
    });

    it('should throw error for non-existent parent', () => {
      expect(() => {
        initAndAdd.singleChoiceQuestion({
          parentFullKey: 'non-existent-parent'
        });
      }).toThrow();
    });
  });

  describe('multipleChoiceQuestion', () => {
    it('should create and add a multiple choice question', () => {
      const parentKey = 'test-survey.page1';

      const multipleChoiceKey = initAndAdd.multipleChoiceQuestion({
        parentFullKey: parentKey
      });

      // Verify the multiple choice question was created
      expect(multipleChoiceKey).toBeDefined();
      expect(multipleChoiceKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the multiple choice question exists in the survey
      const createdMultipleChoice = survey.surveyItems[multipleChoiceKey];
      expect(createdMultipleChoice).toBeDefined();
      expect(createdMultipleChoice.itemType).toBe(SurveyItemType.MultipleChoiceQuestion);

      // Verify the multiple choice question was added to the parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(multipleChoiceKey);
    });

    it('should add multiple choice question at specified position', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      const item2 = new DisplayItem(`${parentKey}.item2`);
      survey.surveyItems[`${parentKey}.item1`] = item1;
      survey.surveyItems[`${parentKey}.item2`] = item2;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`, `${parentKey}.item2`];

      // Add multiple choice question at position 1 (between item1 and item2)
      const multipleChoiceKey = initAndAdd.multipleChoiceQuestion({
        parentFullKey: parentKey,
        position: 1
      });

      // Verify the multiple choice question was inserted at the correct position
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        multipleChoiceKey,
        `${parentKey}.item2`
      ]);
    });

    it('should work with root group as parent', () => {
      const rootKey = 'test-survey';

      const multipleChoiceKey = initAndAdd.multipleChoiceQuestion({
        parentFullKey: rootKey
      });

      // Verify the multiple choice question was created and added to root
      const createdMultipleChoice = survey.surveyItems[multipleChoiceKey];
      expect(createdMultipleChoice).toBeDefined();
      expect(createdMultipleChoice.itemType).toBe(SurveyItemType.MultipleChoiceQuestion);

      const rootGroup = survey.surveyItems[rootKey] as GroupItem;
      expect(rootGroup.items).toContain(multipleChoiceKey);
    });

    it('should throw error for non-existent parent', () => {
      expect(() => {
        initAndAdd.multipleChoiceQuestion({
          parentFullKey: 'non-existent-parent'
        });
      }).toThrow();
    });
  });

  describe('pageBreak', () => {
    it('should create and add a page break item', () => {
      const parentKey = 'test-survey.page1';

      const pageBreakKey = initAndAdd.pageBreak({
        parentFullKey: parentKey
      });

      // Verify the page break was created
      expect(pageBreakKey).toBeDefined();
      expect(pageBreakKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the page break exists in the survey
      const createdPageBreak = survey.surveyItems[pageBreakKey];
      expect(createdPageBreak).toBeDefined();
      expect(createdPageBreak.itemType).toBe(SurveyItemType.PageBreak);

      // Verify the page break was added to the parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(pageBreakKey);
    });

    it('should add page break at specified position', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      const item2 = new DisplayItem(`${parentKey}.item2`);
      survey.surveyItems[`${parentKey}.item1`] = item1;
      survey.surveyItems[`${parentKey}.item2`] = item2;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`, `${parentKey}.item2`];

      // Add page break at position 1 (between item1 and item2)
      const pageBreakKey = initAndAdd.pageBreak({
        parentFullKey: parentKey,
        position: 1
      });

      // Verify the page break was inserted at the correct position
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        pageBreakKey,
        `${parentKey}.item2`
      ]);
    });

    it('should add page break at the end when no position is specified', () => {
      const parentKey = 'test-survey.page1';

      // First add some items to the parent group
      const item1 = new DisplayItem(`${parentKey}.item1`);
      survey.surveyItems[`${parentKey}.item1`] = item1;

      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      parentGroup.items = [`${parentKey}.item1`];

      // Add page break without specifying position
      const pageBreakKey = initAndAdd.pageBreak({
        parentFullKey: parentKey
      });

      // Verify the page break was added at the end
      expect(parentGroup.items).toEqual([
        `${parentKey}.item1`,
        pageBreakKey
      ]);
    });

    it('should generate unique keys for multiple page breaks', () => {
      const parentKey = 'test-survey.page1';

      // Create multiple page breaks
      const pageBreak1Key = initAndAdd.pageBreak({
        parentFullKey: parentKey
      });
      const pageBreak2Key = initAndAdd.pageBreak({
        parentFullKey: parentKey
      });

      // Verify all keys are unique
      expect(pageBreak1Key).not.toBe(pageBreak2Key);

      // Verify all page breaks exist
      expect(survey.surveyItems[pageBreak1Key]).toBeDefined();
      expect(survey.surveyItems[pageBreak2Key]).toBeDefined();

      // Verify all are added to parent
      const parentGroup = survey.surveyItems[parentKey] as GroupItem;
      expect(parentGroup.items).toContain(pageBreak1Key);
      expect(parentGroup.items).toContain(pageBreak2Key);
    });

    it('should work with root group as parent', () => {
      const rootKey = 'test-survey';

      const pageBreakKey = initAndAdd.pageBreak({
        parentFullKey: rootKey
      });

      // Verify the page break was created and added to root
      const createdPageBreak = survey.surveyItems[pageBreakKey];
      expect(createdPageBreak).toBeDefined();
      expect(createdPageBreak.itemType).toBe(SurveyItemType.PageBreak);

      const rootGroup = survey.surveyItems[rootKey] as GroupItem;
      expect(rootGroup.items).toContain(pageBreakKey);
    });

    it('should throw error for non-existent parent', () => {
      expect(() => {
        initAndAdd.pageBreak({
          parentFullKey: 'non-existent-parent'
        });
      }).toThrow();
    });

    it('should return the full key of the created page break', () => {
      const parentKey = 'test-survey.page1';

      const pageBreakKey = initAndAdd.pageBreak({
        parentFullKey: parentKey
      });

      // Verify the returned key is a valid full key format
      expect(pageBreakKey).toMatch(/^test-survey\.page1\.[a-zA-Z0-9]{3}$/);

      // Verify the key corresponds to an actual item
      expect(survey.surveyItems[pageBreakKey]).toBeDefined();
    });
  });
});
