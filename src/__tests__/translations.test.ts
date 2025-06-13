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
