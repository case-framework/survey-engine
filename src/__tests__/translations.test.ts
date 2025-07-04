import { SurveyItemTranslations, SurveyTranslations, JsonSurveyCardContent } from '../survey/utils/translations';
import { Content, ContentType } from '../survey/utils/content';

// Mock content for testing
const mockContent: Content = {
  type: ContentType.md,
  content: 'Test content'
};

const mockCQMContent: Content = {
  type: ContentType.CQM,
  content: 'CQM test content',
  attributions: []
};

const mockSurveyCardContent: JsonSurveyCardContent = {
  name: mockContent,
  description: mockContent,
  typicalDuration: mockContent
};

const enLocale = 'en';
const deLocale = 'de';

describe('SurveyItemTranslations', () => {
  let itemTranslations: SurveyItemTranslations;

  beforeEach(() => {
    itemTranslations = new SurveyItemTranslations();
  });

  describe('constructor', () => {
    test('should initialize with empty translations', () => {
      expect(itemTranslations.locales).toEqual([]);
    });
  });

  describe('setContent', () => {
    test('should set content for a new locale and contentKey', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);

      expect(itemTranslations.locales).toContain('en');
      expect(itemTranslations.getContent(enLocale, 'title')).toEqual(mockContent);
    });

    test('should update existing content', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent(enLocale, 'title', mockCQMContent);

      expect(itemTranslations.getContent(enLocale, 'title')).toEqual(mockCQMContent);
    });

    test('should add content to existing locale', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent(enLocale, 'description', mockCQMContent);

      expect(itemTranslations.getContent(enLocale, 'title')).toEqual(mockContent);
      expect(itemTranslations.getContent(enLocale, 'description')).toEqual(mockCQMContent);
    });

    test('should not create locale when content is undefined', () => {
      itemTranslations.setContent(enLocale, 'title', undefined);

      expect(itemTranslations.locales).toEqual([]);
    });

    test('should delete content when setting to undefined', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent(enLocale, 'title', undefined);

      expect(itemTranslations.getContent(enLocale, 'title')).toBeUndefined();
      expect(itemTranslations.locales).toContain(enLocale); // locale should still exist
    });
  });

  describe('setContentForLocale', () => {
    test('should set complete content for a locale', () => {
      const localeContent = {
        title: mockContent,
        description: mockCQMContent
      };

      itemTranslations.setAllForLocale(enLocale, localeContent);

      expect(itemTranslations.getAllForLocale(enLocale)).toEqual(localeContent);
      expect(itemTranslations.getContent(enLocale, 'title')).toEqual(mockContent);
      expect(itemTranslations.getContent(enLocale, 'description')).toEqual(mockCQMContent);
    });

    test('should replace existing locale content', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);

      const newLocaleContent = {
        description: mockCQMContent
      };

      itemTranslations.setAllForLocale(enLocale, newLocaleContent);

      expect(itemTranslations.getAllForLocale(enLocale)).toEqual(newLocaleContent);
      expect(itemTranslations.getContent(enLocale, 'title')).toBeUndefined();
      expect(itemTranslations.getContent(enLocale, 'description')).toEqual(mockCQMContent);
    });

    test('should not create locale when content is undefined', () => {
      itemTranslations.setAllForLocale(enLocale, undefined);

      expect(itemTranslations.locales).toEqual([]);
    });

    test('should set empty object when content is undefined for existing locale', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setAllForLocale(enLocale, undefined);

      expect(itemTranslations.getAllForLocale(enLocale)).toEqual({});
    });
  });

  describe('getters', () => {
    test('should return all locales', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent(deLocale, 'title', mockContent);
      itemTranslations.setContent('fr', 'description', mockContent);

      expect(itemTranslations.locales).toContain(enLocale);
      expect(itemTranslations.locales).toContain('de');
      expect(itemTranslations.locales).toContain('fr');
      expect(itemTranslations.locales).toHaveLength(3);
    });

    test('should return undefined for non-existent locale content', () => {
      expect(itemTranslations.getAllForLocale('nonexistent')).toBeUndefined();
    });

    test('should return undefined for non-existent content key', () => {
      itemTranslations.setContent(enLocale, 'title', mockContent);
      expect(itemTranslations.getContent(enLocale, 'nonexistent')).toBeUndefined();
    });

    test('should not allow empty strings as locale keys', () => {
      expect(() => {
        itemTranslations.setContent('', 'title', mockContent);
      }).toThrow('Locale cannot be empty');

      expect(() => {
        itemTranslations.setAllForLocale('', { title: mockContent });
      }).toThrow('Locale cannot be empty');
    });
  });
});

describe('SurveyTranslations', () => {
  let surveyTranslations: SurveyTranslations;

  beforeEach(() => {
    surveyTranslations = new SurveyTranslations();
  });

  describe('constructor', () => {
    test('should initialize with empty translations', () => {
      expect(surveyTranslations.locales).toEqual([]);
    });

    test('should initialize with provided translations', () => {
      const initialTranslations = {
        en: {
          surveyCardContent: mockSurveyCardContent,
          'item1': { title: mockContent }
        }
      };

      const translations = new SurveyTranslations(initialTranslations);

      expect(translations.locales).toContain(enLocale);
      expect(translations.surveyCardContent).toEqual({ en: mockSurveyCardContent });
    });
  });

  describe('toJson', () => {
    test('should return undefined when no translations exist', () => {
      expect(surveyTranslations.toJson()).toBeUndefined();
    });

    test('should return translations object when translations exist', () => {
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const result = surveyTranslations.toJson();

      expect(result).toBeDefined();
      expect(result!.en.surveyCardContent).toEqual(mockSurveyCardContent);
    });
  });

  describe('locale management', () => {
    test('should remove locale', () => {
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);
      surveyTranslations.setSurveyCardContent(deLocale, mockSurveyCardContent);

      expect(surveyTranslations.locales).toContain(enLocale);
      expect(surveyTranslations.locales).toContain(deLocale);

      surveyTranslations.removeLocale(enLocale);

      expect(surveyTranslations.locales).not.toContain(enLocale);
      expect(surveyTranslations.locales).toContain(deLocale);
    });

    test('should rename locale', () => {
      const newLocale = 'en-US';
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      surveyTranslations.renameLocale(enLocale, newLocale);

      expect(surveyTranslations.locales).not.toContain(enLocale);
      expect(surveyTranslations.locales).toContain(newLocale);
      expect(surveyTranslations.surveyCardContent![newLocale]).toEqual(mockSurveyCardContent);
    });

    test('should not rename non-existent locale', () => {
      const newLocale = 'new';
      surveyTranslations.renameLocale('nonexistent', newLocale);

      expect(surveyTranslations.locales).not.toContain(newLocale);
    });

    test('should clone locale', () => {
      const newLocale = 'en-US';
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      surveyTranslations.cloneLocaleAs(enLocale, newLocale);

      expect(surveyTranslations.locales).toContain(enLocale);
      expect(surveyTranslations.locales).toContain(newLocale);
      expect(surveyTranslations.surveyCardContent![newLocale]).toEqual(mockSurveyCardContent);
    });

    test('should not clone non-existent locale', () => {
      const newLocale = 'new';
      surveyTranslations.cloneLocaleAs('nonexistent', newLocale);

      expect(surveyTranslations.locales).not.toContain(newLocale);
    });
  });

  describe('survey card content', () => {
    test('should set survey card content', () => {
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      expect(surveyTranslations.surveyCardContent).toEqual({ [enLocale]: mockSurveyCardContent });
    });

    test('should not create locale when content is undefined', () => {
      surveyTranslations.setSurveyCardContent(enLocale, undefined);

      expect(surveyTranslations.locales).toEqual([]);
    });

    test('should update existing survey card content', () => {
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const newContent: JsonSurveyCardContent = {
        name: mockCQMContent
      };

      surveyTranslations.setSurveyCardContent(enLocale, newContent);

      expect(surveyTranslations.surveyCardContent![enLocale]).toEqual(newContent);
    });

    test('should return undefined when no survey card content exists', () => {
      expect(surveyTranslations.surveyCardContent).toEqual({});
    });
  });

  describe('item translations', () => {
    test('should get item translations', () => {
      // First need to create locales in the survey
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);
      surveyTranslations.setSurveyCardContent(deLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent(deLocale, 'title', mockCQMContent);

      surveyTranslations.setItemTranslations('item1', itemTranslations);

      const retrieved = surveyTranslations.getItemTranslations('item1');

      expect(retrieved!.getContent(enLocale, 'title')).toEqual(mockContent);
      expect(retrieved!.getContent(deLocale, 'title')).toEqual(mockCQMContent);
    });

    test('should set item translations', () => {
      // First need to create the locale in the survey
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'title', mockContent);

      surveyTranslations.setItemTranslations('item1', itemTranslations);

      expect(surveyTranslations.locales).toContain('en');

      const result = surveyTranslations.toJson();
      expect(result!.en.item1).toEqual({ title: mockContent });
    });

    test('should remove item translations when set to undefined', () => {
      // First need to create the locale in the survey
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'title', mockContent);

      surveyTranslations.setItemTranslations('item1', itemTranslations);
      surveyTranslations.setItemTranslations('item1', undefined);

      const result = surveyTranslations.toJson();
      expect(result!.en.item1).toBeUndefined();
    });

    test('should handle multiple locales in item translations', () => {
      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent(deLocale, 'title', mockCQMContent);

      // Ensure survey has both locales
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);
      surveyTranslations.setSurveyCardContent(deLocale, mockSurveyCardContent);

      surveyTranslations.setItemTranslations('item1', itemTranslations);

      const result = surveyTranslations.toJson();
      expect(result!.en.item1).toEqual({ title: mockContent });
      expect(result!.de.item1).toEqual({ title: mockCQMContent });
    });

    test('should create new locales when item translations are added with non-existing locales', () => {
      // Initially no locales exist
      expect(surveyTranslations.locales).toEqual([]);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent('fr', 'title', mockCQMContent);
      itemTranslations.setContent('es', 'description', mockContent);

      surveyTranslations.setItemTranslations('item1', itemTranslations);

      // Check that new locales were created
      expect(surveyTranslations.locales).toContain('en');
      expect(surveyTranslations.locales).toContain('fr');
      expect(surveyTranslations.locales).toContain('es');
      expect(surveyTranslations.locales).toHaveLength(3);

      // Verify translations are accessible
      const result = surveyTranslations.toJson();
      expect(result!.en.item1).toEqual({ title: mockContent });
      expect(result!.fr.item1).toEqual({ title: mockCQMContent });
      expect(result!.es.item1).toEqual({ description: mockContent });
    });
  });

  describe('deletion methods', () => {
    beforeEach(() => {
      // First create the locale in the survey
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'comp1.title', mockContent);
      itemTranslations.setContent(enLocale, 'comp1.description', mockCQMContent);
      itemTranslations.setContent(enLocale, 'comp2.title', mockContent);
      itemTranslations.setContent(enLocale, 'other', mockContent);

      surveyTranslations.setItemTranslations('item1', itemTranslations);
    });

    test('should delete component translations', () => {
      surveyTranslations.onComponentDeleted('item1', 'comp1');

      const retrieved = surveyTranslations.getItemTranslations('item1');

      expect(retrieved!.getContent(enLocale, 'comp1.title')).toBeUndefined();
      expect(retrieved!.getContent(enLocale, 'comp1.description')).toBeUndefined();
      expect(retrieved!.getContent(enLocale, 'comp2.title')).toEqual(mockContent);
      expect(retrieved!.getContent(enLocale, 'other')).toEqual(mockContent);
    });

    test('should delete exact component key', () => {
      // Create a new survey translations and locale for this specific test
      const testSurvey = new SurveyTranslations();
      testSurvey.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'comp1', mockContent);
      itemTranslations.setContent(enLocale, 'comp1.sub', mockCQMContent);

      testSurvey.setItemTranslations('item1', itemTranslations);
      testSurvey.onComponentDeleted('item1', 'comp1');

      const retrieved = testSurvey.getItemTranslations('item1');

      expect(retrieved!.getContent(enLocale, 'comp1')).toBeUndefined();
      expect(retrieved!.getContent(enLocale, 'comp1.sub')).toBeUndefined();
    });

    test('should delete entire item translations', () => {
      surveyTranslations.onItemDeleted('item1');

      const result = surveyTranslations.toJson();
      expect(result!.en.item1).toBeUndefined();
    });

    test('should delete all child item translations when group is deleted', () => {
      // Create a new survey for this test with more complex structure
      const testSurvey = new SurveyTranslations();
      testSurvey.setSurveyCardContent(enLocale, mockSurveyCardContent);
      testSurvey.setSurveyCardContent(deLocale, mockSurveyCardContent);

      // Set up translations for a group and its nested items
      const groupTranslations = new SurveyItemTranslations();
      groupTranslations.setContent(enLocale, 'title', mockContent);
      groupTranslations.setContent(deLocale, 'title', mockCQMContent);

      const childItem1Translations = new SurveyItemTranslations();
      childItem1Translations.setContent(enLocale, 'comp1.title', mockContent);
      childItem1Translations.setContent(deLocale, 'comp1.title', mockCQMContent);

      const childItem2Translations = new SurveyItemTranslations();
      childItem2Translations.setContent(enLocale, 'comp2.description', mockContent);
      childItem2Translations.setContent(deLocale, 'comp2.description', mockCQMContent);

      const nestedGroupTranslations = new SurveyItemTranslations();
      nestedGroupTranslations.setContent(enLocale, 'nested.title', mockContent);

      const nestedChildTranslations = new SurveyItemTranslations();
      nestedChildTranslations.setContent(enLocale, 'deep.comp.text', mockContent);

      // Set up unrelated item that should not be affected
      const unrelatedTranslations = new SurveyItemTranslations();
      unrelatedTranslations.setContent(enLocale, 'unrelated.title', mockContent);
      unrelatedTranslations.setContent(deLocale, 'unrelated.title', mockCQMContent);

      // Add all translations to the survey
      testSurvey.setItemTranslations('survey.group1', groupTranslations);
      testSurvey.setItemTranslations('survey.group1.item1', childItem1Translations);
      testSurvey.setItemTranslations('survey.group1.item2', childItem2Translations);
      testSurvey.setItemTranslations('survey.group1.nestedGroup', nestedGroupTranslations);
      testSurvey.setItemTranslations('survey.group1.nestedGroup.deepItem', nestedChildTranslations);
      testSurvey.setItemTranslations('survey.group1unrelatedItem', unrelatedTranslations);

      // Verify all translations exist before deletion
      const beforeDeletion = testSurvey.toJson();
      expect(beforeDeletion!.en['survey.group1']).toBeDefined();
      expect(beforeDeletion!.en['survey.group1.item1']).toBeDefined();
      expect(beforeDeletion!.en['survey.group1.item2']).toBeDefined();
      expect(beforeDeletion!.en['survey.group1.nestedGroup']).toBeDefined();
      expect(beforeDeletion!.en['survey.group1.nestedGroup.deepItem']).toBeDefined();
      expect(beforeDeletion!.en['survey.group1unrelatedItem']).toBeDefined();

      // Delete the group
      testSurvey.onItemDeleted('survey.group1');

      // Verify all group and child item translations are removed
      const afterDeletion = testSurvey.toJson();
      expect(afterDeletion!.en['survey.group1']).toBeUndefined();
      expect(afterDeletion!.en['survey.group1.item1']).toBeUndefined();
      expect(afterDeletion!.en['survey.group1.item2']).toBeUndefined();
      expect(afterDeletion!.en['survey.group1.nestedGroup']).toBeUndefined();
      expect(afterDeletion!.en['survey.group1.nestedGroup.deepItem']).toBeUndefined();

      // Verify all locales are cleaned up
      expect(afterDeletion!.de['survey.group1']).toBeUndefined();
      expect(afterDeletion!.de['survey.group1.item1']).toBeUndefined();
      expect(afterDeletion!.de['survey.group1.item2']).toBeUndefined();

      // Verify unrelated item translations remain intact
      expect(afterDeletion!.en['survey.group1unrelatedItem']).toBeDefined();
      expect(afterDeletion!.de['survey.group1unrelatedItem']).toBeDefined();
      expect(afterDeletion!.en['survey.group1unrelatedItem']).toEqual({ 'unrelated.title': mockContent });
      expect(afterDeletion!.de['survey.group1unrelatedItem']).toEqual({ 'unrelated.title': mockCQMContent });
    });

    test('should handle deletion of non-existent item', () => {
      surveyTranslations.onItemDeleted('nonexistent');

      // Should not throw and should not affect existing data
      const retrieved = surveyTranslations.getItemTranslations('item1');
      expect(retrieved!.getContent(enLocale, 'comp1.title')).toEqual(mockContent);
    });

    test('should handle deletion of non-existent component', () => {
      surveyTranslations.onComponentDeleted('item1', 'nonexistent');

      // Should not throw and should not affect existing data
      const retrieved = surveyTranslations.getItemTranslations('item1');
      expect(retrieved!.getContent(enLocale, 'comp1.title')).toEqual(mockContent);
    });
  });

  describe('item key changes', () => {
    beforeEach(() => {
      // Create a test setup with multiple locales and items
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);
      surveyTranslations.setSurveyCardContent(deLocale, mockSurveyCardContent);

      // Set up translations for multiple items
      const itemTranslations1 = new SurveyItemTranslations();
      itemTranslations1.setContent(enLocale, 'title', mockContent);
      itemTranslations1.setContent(enLocale, 'description', mockCQMContent);
      itemTranslations1.setContent(deLocale, 'title', mockCQMContent);
      itemTranslations1.setContent(deLocale, 'description', mockContent);

      const itemTranslations2 = new SurveyItemTranslations();
      itemTranslations2.setContent(enLocale, 'label', mockContent);
      itemTranslations2.setContent(deLocale, 'label', mockCQMContent);

      surveyTranslations.setItemTranslations('oldItemKey', itemTranslations1);
      surveyTranslations.setItemTranslations('otherItem', itemTranslations2);
    });

    test('should rename item key and preserve translations', () => {
      // Get original translations before rename
      const originalTranslations = surveyTranslations.getItemTranslations('oldItemKey');
      const originalEnContent = originalTranslations!.getAllForLocale(enLocale);
      const originalDeContent = originalTranslations!.getAllForLocale(deLocale);

      // Perform the rename
      surveyTranslations.onItemKeyChanged('oldItemKey', 'newItemKey');

      // Verify old key is removed
      const result = surveyTranslations.toJson();
      expect(result!.en['oldItemKey']).toBeUndefined();
      expect(result!.de['oldItemKey']).toBeUndefined();

      // Verify new key has the same translations
      expect(result!.en['newItemKey']).toBeDefined();
      expect(result!.de['newItemKey']).toBeDefined();
      expect(result!.en['newItemKey']).toEqual(originalEnContent);
      expect(result!.de['newItemKey']).toEqual(originalDeContent);

      // Verify content matches exactly
      const newTranslations = surveyTranslations.getItemTranslations('newItemKey');
      expect(newTranslations!.getContent(enLocale, 'title')).toEqual(mockContent);
      expect(newTranslations!.getContent(enLocale, 'description')).toEqual(mockCQMContent);
      expect(newTranslations!.getContent(deLocale, 'title')).toEqual(mockCQMContent);
      expect(newTranslations!.getContent(deLocale, 'description')).toEqual(mockContent);
    });

    test('should not affect other item translations when renaming', () => {
      // Get original translations for other item
      const otherItemOriginal = surveyTranslations.getItemTranslations('otherItem');
      const otherItemEnContent = otherItemOriginal!.getAllForLocale(enLocale);
      const otherItemDeContent = otherItemOriginal!.getAllForLocale(deLocale);

      // Perform the rename
      surveyTranslations.onItemKeyChanged('oldItemKey', 'newItemKey');

      // Verify other item is unchanged
      const result = surveyTranslations.toJson();
      expect(result!.en['otherItem']).toEqual(otherItemEnContent);
      expect(result!.de['otherItem']).toEqual(otherItemDeContent);

      const otherItemAfter = surveyTranslations.getItemTranslations('otherItem');
      expect(otherItemAfter!.getContent(enLocale, 'label')).toEqual(mockContent);
      expect(otherItemAfter!.getContent(deLocale, 'label')).toEqual(mockCQMContent);
    });

    test('should handle renaming non-existent item key gracefully', () => {
      // Get state before attempted rename
      const beforeRename = surveyTranslations.toJson();

      // Attempt to rename non-existent key
      surveyTranslations.onItemKeyChanged('nonExistentKey', 'someNewKey');

      // Verify no changes occurred
      const afterRename = surveyTranslations.toJson();
      expect(afterRename).toEqual(beforeRename);

      // Verify the new key was not created
      expect(afterRename!.en['someNewKey']).toBeUndefined();
      expect(afterRename!.de['someNewKey']).toBeUndefined();

      // Verify existing translations are still intact
      expect(afterRename!.en['oldItemKey']).toBeDefined();
      expect(afterRename!.en['otherItem']).toBeDefined();
    });

    test('should handle renaming to existing key by overwriting', () => {
      // Perform rename where new key already exists
      surveyTranslations.onItemKeyChanged('oldItemKey', 'otherItem');

      const result = surveyTranslations.toJson();

      // Verify old key is removed
      expect(result!.en['oldItemKey']).toBeUndefined();
      expect(result!.de['oldItemKey']).toBeUndefined();

      // Verify the existing key is overwritten with old key's content
      expect(result!.en['otherItem']).toBeDefined();
      expect(result!.de['otherItem']).toBeDefined();

      // The content should now be from the original 'oldItemKey'
      const finalTranslations = surveyTranslations.getItemTranslations('otherItem');
      expect(finalTranslations!.getContent(enLocale, 'title')).toEqual(mockContent);
      expect(finalTranslations!.getContent(enLocale, 'description')).toEqual(mockCQMContent);
      expect(finalTranslations!.getContent(deLocale, 'title')).toEqual(mockCQMContent);
      expect(finalTranslations!.getContent(deLocale, 'description')).toEqual(mockContent);

      // The original 'otherItem' content (label) should be gone
      expect(finalTranslations!.getContent(enLocale, 'label')).toBeUndefined();
    });

    test('should work with single locale', () => {
      // Create a survey with only one locale
      const singleLocaleSurvey = new SurveyTranslations();
      singleLocaleSurvey.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'title', mockContent);
      itemTranslations.setContent(enLocale, 'description', mockCQMContent);

      singleLocaleSurvey.setItemTranslations('originalKey', itemTranslations);

      // Perform rename
      singleLocaleSurvey.onItemKeyChanged('originalKey', 'renamedKey');

      const result = singleLocaleSurvey.toJson();

      // Verify old key is removed and new key has correct content
      expect(result!.en['originalKey']).toBeUndefined();
      expect(result!.en['renamedKey']).toBeDefined();
      expect(result!.en['renamedKey']).toEqual({
        title: mockContent,
        description: mockCQMContent
      });
    });

    test('should handle complex nested keys', () => {
      // Set up translations with complex nested structure
      const complexTranslations = new SurveyItemTranslations();
      complexTranslations.setContent(enLocale, 'comp1.title', mockContent);
      complexTranslations.setContent(enLocale, 'comp1.description', mockCQMContent);
      complexTranslations.setContent(enLocale, 'comp2.nested.label', mockContent);
      complexTranslations.setContent(deLocale, 'comp1.title', mockCQMContent);

      surveyTranslations.setItemTranslations('survey.page1.group.item', complexTranslations);

      // Rename the complex key
      surveyTranslations.onItemKeyChanged('survey.page1.group.item', 'survey.page2.newGroup.renamedItem');

      const result = surveyTranslations.toJson();

      // Verify old key is completely removed
      expect(result!.en['survey.page1.group.item']).toBeUndefined();
      expect(result!.de['survey.page1.group.item']).toBeUndefined();

      // Verify new key has all the complex nested content
      expect(result!.en['survey.page2.newGroup.renamedItem']).toBeDefined();
      expect(result!.de['survey.page2.newGroup.renamedItem']).toBeDefined();

      const renamedTranslations = surveyTranslations.getItemTranslations('survey.page2.newGroup.renamedItem');
      expect(renamedTranslations!.getContent(enLocale, 'comp1.title')).toEqual(mockContent);
      expect(renamedTranslations!.getContent(enLocale, 'comp1.description')).toEqual(mockCQMContent);
      expect(renamedTranslations!.getContent(enLocale, 'comp2.nested.label')).toEqual(mockContent);
      expect(renamedTranslations!.getContent(deLocale, 'comp1.title')).toEqual(mockCQMContent);
    });
  });

  describe('component key changes', () => {
    beforeEach(() => {
      // Create a test setup with multiple locales and component translations
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);
      surveyTranslations.setSurveyCardContent(deLocale, mockSurveyCardContent);

      // Set up translations for an item with multiple components
      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'oldComponentKey', mockContent);
      itemTranslations.setContent(enLocale, 'anotherComponent', mockCQMContent);
      itemTranslations.setContent(enLocale, 'thirdComponent.title', mockContent);
      itemTranslations.setContent(deLocale, 'oldComponentKey', mockCQMContent);
      itemTranslations.setContent(deLocale, 'anotherComponent', mockContent);
      itemTranslations.setContent(deLocale, 'thirdComponent.title', mockCQMContent);

      // Set up another item to ensure it's not affected
      const otherItemTranslations = new SurveyItemTranslations();
      otherItemTranslations.setContent(enLocale, 'oldComponentKey', mockContent);
      otherItemTranslations.setContent(deLocale, 'oldComponentKey', mockCQMContent);

      surveyTranslations.setItemTranslations('testItem', itemTranslations);
      surveyTranslations.setItemTranslations('otherItem', otherItemTranslations);
    });

    test('should rename component key and preserve translations', () => {
      // Get original content before rename
      const originalTranslations = surveyTranslations.getItemTranslations('testItem');
      const originalEnContent = originalTranslations!.getContent(enLocale, 'oldComponentKey');
      const originalDeContent = originalTranslations!.getContent(deLocale, 'oldComponentKey');

      // Perform the component rename
      surveyTranslations.onComponentKeyChanged('testItem', 'oldComponentKey', 'newComponentKey');

      // Verify old component key is removed
      const updatedTranslations = surveyTranslations.getItemTranslations('testItem');
      expect(updatedTranslations!.getContent(enLocale, 'oldComponentKey')).toBeUndefined();
      expect(updatedTranslations!.getContent(deLocale, 'oldComponentKey')).toBeUndefined();

      // Verify new component key has the same content
      expect(updatedTranslations!.getContent(enLocale, 'newComponentKey')).toEqual(originalEnContent);
      expect(updatedTranslations!.getContent(deLocale, 'newComponentKey')).toEqual(originalDeContent);

      // Verify the content matches exactly
      expect(updatedTranslations!.getContent(enLocale, 'newComponentKey')).toEqual(mockContent);
      expect(updatedTranslations!.getContent(deLocale, 'newComponentKey')).toEqual(mockCQMContent);
    });

    test('should not affect other components in the same item', () => {
      // Get original content for other components
      const originalTranslations = surveyTranslations.getItemTranslations('testItem');
      const anotherCompEnContent = originalTranslations!.getContent(enLocale, 'anotherComponent');
      const anotherCompDeContent = originalTranslations!.getContent(deLocale, 'anotherComponent');
      const thirdCompEnContent = originalTranslations!.getContent(enLocale, 'thirdComponent.title');
      const thirdCompDeContent = originalTranslations!.getContent(deLocale, 'thirdComponent.title');

      // Perform the rename
      surveyTranslations.onComponentKeyChanged('testItem', 'oldComponentKey', 'newComponentKey');

      // Verify other components are unchanged
      const updatedTranslations = surveyTranslations.getItemTranslations('testItem');
      expect(updatedTranslations!.getContent(enLocale, 'anotherComponent')).toEqual(anotherCompEnContent);
      expect(updatedTranslations!.getContent(deLocale, 'anotherComponent')).toEqual(anotherCompDeContent);
      expect(updatedTranslations!.getContent(enLocale, 'thirdComponent.title')).toEqual(thirdCompEnContent);
      expect(updatedTranslations!.getContent(deLocale, 'thirdComponent.title')).toEqual(thirdCompDeContent);
    });

    test('should not affect other items', () => {
      // Get original content for other item
      const otherItemOriginal = surveyTranslations.getItemTranslations('otherItem');
      const otherItemEnContent = otherItemOriginal!.getContent(enLocale, 'oldComponentKey');
      const otherItemDeContent = otherItemOriginal!.getContent(deLocale, 'oldComponentKey');

      // Perform the rename on the first item
      surveyTranslations.onComponentKeyChanged('testItem', 'oldComponentKey', 'newComponentKey');

      // Verify other item's component is unchanged
      const otherItemAfter = surveyTranslations.getItemTranslations('otherItem');
      expect(otherItemAfter!.getContent(enLocale, 'oldComponentKey')).toEqual(otherItemEnContent);
      expect(otherItemAfter!.getContent(deLocale, 'oldComponentKey')).toEqual(otherItemDeContent);

      // Verify the new key wasn't created in the other item
      expect(otherItemAfter!.getContent(enLocale, 'newComponentKey')).toBeUndefined();
      expect(otherItemAfter!.getContent(deLocale, 'newComponentKey')).toBeUndefined();
    });

    test('should handle renaming non-existent component key gracefully', () => {
      // Get state before attempted rename
      const beforeRename = surveyTranslations.toJson();

      // Attempt to rename non-existent component key
      surveyTranslations.onComponentKeyChanged('testItem', 'nonExistentComponent', 'someNewComponent');

      // Verify no changes occurred
      const afterRename = surveyTranslations.toJson();
      expect(afterRename).toEqual(beforeRename);

      // Verify the new key was not created
      const updatedTranslations = surveyTranslations.getItemTranslations('testItem');
      expect(updatedTranslations!.getContent(enLocale, 'someNewComponent')).toBeUndefined();
      expect(updatedTranslations!.getContent(deLocale, 'someNewComponent')).toBeUndefined();
    });

    test('should handle renaming component in non-existent item gracefully', () => {
      // Get state before attempted rename
      const beforeRename = surveyTranslations.toJson();

      // Attempt to rename component in non-existent item
      surveyTranslations.onComponentKeyChanged('nonExistentItem', 'oldComponentKey', 'newComponentKey');

      // Verify no changes occurred
      const afterRename = surveyTranslations.toJson();
      expect(afterRename).toEqual(beforeRename);
    });

    test('should handle renaming to existing component key by overwriting', () => {
      // Perform rename where new key already exists
      surveyTranslations.onComponentKeyChanged('testItem', 'oldComponentKey', 'anotherComponent');

      const updatedTranslations = surveyTranslations.getItemTranslations('testItem');

      // Verify old key is removed
      expect(updatedTranslations!.getContent(enLocale, 'oldComponentKey')).toBeUndefined();
      expect(updatedTranslations!.getContent(deLocale, 'oldComponentKey')).toBeUndefined();

      // Verify the existing key is overwritten with old key's content
      expect(updatedTranslations!.getContent(enLocale, 'anotherComponent')).toEqual(mockContent);
      expect(updatedTranslations!.getContent(deLocale, 'anotherComponent')).toEqual(mockCQMContent);
    });

    test('should work with single locale', () => {
      // Create a survey with only one locale
      const singleLocaleSurvey = new SurveyTranslations();
      singleLocaleSurvey.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'originalCompKey', mockContent);
      itemTranslations.setContent(enLocale, 'otherComp', mockCQMContent);

      singleLocaleSurvey.setItemTranslations('testItem', itemTranslations);

      // Perform rename
      singleLocaleSurvey.onComponentKeyChanged('testItem', 'originalCompKey', 'renamedCompKey');

      const result = singleLocaleSurvey.getItemTranslations('testItem');

      // Verify old key is removed and new key has correct content
      expect(result!.getContent(enLocale, 'originalCompKey')).toBeUndefined();
      expect(result!.getContent(enLocale, 'renamedCompKey')).toEqual(mockContent);
      expect(result!.getContent(enLocale, 'otherComp')).toEqual(mockCQMContent);
    });

    test('should handle complex nested component keys', () => {
      // Set up translations with complex nested component structure
      const complexTranslations = new SurveyItemTranslations();
      complexTranslations.setContent(enLocale, 'comp.nested.title', mockContent);
      complexTranslations.setContent(enLocale, 'comp.nested.description', mockCQMContent);
      complexTranslations.setContent(enLocale, 'otherComp.title', mockContent);
      complexTranslations.setContent(deLocale, 'comp.nested.title', mockCQMContent);

      surveyTranslations.setItemTranslations('complexItem', complexTranslations);

      // Rename the nested component key
      surveyTranslations.onComponentKeyChanged('complexItem', 'comp.nested.title', 'comp.renamed.title');

      const renamedTranslations = surveyTranslations.getItemTranslations('complexItem');

      // Verify old key is removed
      expect(renamedTranslations!.getContent(enLocale, 'comp.nested.title')).toBeUndefined();
      expect(renamedTranslations!.getContent(deLocale, 'comp.nested.title')).toBeUndefined();

      // Verify new key has the correct content
      expect(renamedTranslations!.getContent(enLocale, 'comp.renamed.title')).toEqual(mockContent);
      expect(renamedTranslations!.getContent(deLocale, 'comp.renamed.title')).toEqual(mockCQMContent);

      // Verify other components are unchanged
      expect(renamedTranslations!.getContent(enLocale, 'comp.nested.description')).toEqual(mockCQMContent);
      expect(renamedTranslations!.getContent(enLocale, 'otherComp.title')).toEqual(mockContent);
    });

    test('should handle multiple sequential renames', () => {
      // Perform multiple renames in sequence
      surveyTranslations.onComponentKeyChanged('testItem', 'oldComponentKey', 'intermediateKey');
      surveyTranslations.onComponentKeyChanged('testItem', 'intermediateKey', 'finalKey');

      const finalTranslations = surveyTranslations.getItemTranslations('testItem');

      // Verify all intermediate keys are removed
      expect(finalTranslations!.getContent(enLocale, 'oldComponentKey')).toBeUndefined();
      expect(finalTranslations!.getContent(enLocale, 'intermediateKey')).toBeUndefined();
      expect(finalTranslations!.getContent(deLocale, 'oldComponentKey')).toBeUndefined();
      expect(finalTranslations!.getContent(deLocale, 'intermediateKey')).toBeUndefined();

      // Verify final key has the original content
      expect(finalTranslations!.getContent(enLocale, 'finalKey')).toEqual(mockContent);
      expect(finalTranslations!.getContent(deLocale, 'finalKey')).toEqual(mockCQMContent);

      // Verify other components are still intact
      expect(finalTranslations!.getContent(enLocale, 'anotherComponent')).toEqual(mockCQMContent);
      expect(finalTranslations!.getContent(enLocale, 'thirdComponent.title')).toEqual(mockContent);
    });
  });

  describe('edge cases', () => {
    test('should not allow empty strings as locale keys for survey card content', () => {
      expect(() => {
        surveyTranslations.setSurveyCardContent('', mockSurveyCardContent);
      }).toThrow('Locale cannot be empty');

      expect(() => {
        surveyTranslations.removeLocale('');
      }).toThrow('Locale cannot be empty');

      expect(() => {
        surveyTranslations.renameLocale('', 'new');
      }).toThrow('Locale cannot be empty');

      expect(() => {
        surveyTranslations.renameLocale(enLocale, '');
      }).toThrow('Locale cannot be empty');

      expect(() => {
        surveyTranslations.cloneLocaleAs('', 'new');
      }).toThrow('Locale cannot be empty');

      expect(() => {
        surveyTranslations.cloneLocaleAs(enLocale, '');
      }).toThrow('Locale cannot be empty');
    });

    test('should not allow empty strings as locale keys for item translations', () => {
      const itemTranslations = new SurveyItemTranslations();

      expect(() => {
        itemTranslations.setContent('', 'title', mockContent);
      }).toThrow('Locale cannot be empty');

      // The item translations should be empty since no valid locale was set
      expect(itemTranslations.locales).toEqual([]);
    });

    test('should not allow whitespace-only strings as locale keys', () => {
      expect(() => {
        surveyTranslations.setSurveyCardContent('    ', mockSurveyCardContent);
      }).toThrow('Locale cannot be empty');

      const itemTranslations = new SurveyItemTranslations();
      expect(() => {
        itemTranslations.setContent(' \t\n ', 'title', mockContent);
      }).toThrow('Locale cannot be empty');
    });

    test('should handle multiple operations on same locale', () => {
      surveyTranslations.setSurveyCardContent(enLocale, mockSurveyCardContent);

      const itemTranslations = new SurveyItemTranslations();
      itemTranslations.setContent(enLocale, 'title', mockContent);

      surveyTranslations.setItemTranslations('item1', itemTranslations);

      const result = surveyTranslations.toJson();
      expect(result!.en.surveyCardContent).toEqual(mockSurveyCardContent);
      expect(result!.en.item1).toEqual({ title: mockContent });
    });
  });
});
