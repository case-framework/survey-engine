import { Survey } from '../survey/survey';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { DisplayItem, GroupItem, SingleChoiceQuestionItem, SurveyItemType } from '../survey/items/survey-item';
import { SurveyItemTranslations } from '../survey/utils';
import { Content, ContentType } from '../survey/utils/content';
import { DisplayComponent } from '../survey/components/survey-item-component';

// Helper function to create a test survey
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

const enLocale = 'en';
const deLocale = 'de';

// Helper function to create test translations
const createTestTranslations = (): SurveyItemTranslations => {
  const translations = new SurveyItemTranslations();
  const testContent: Content = {
    type: ContentType.md,
    content: 'Test content'
  };
  translations.setContent(enLocale, 'title', testContent);
  translations.setContent(deLocale, 'title', { type: ContentType.md, content: 'Test Inhalt' });
  return translations;
};


describe('SurveyEditor', () => {
  let survey: Survey;
  let editor: SurveyEditor;

  beforeEach(() => {
    survey = createTestSurvey();
    editor = new SurveyEditor(survey);
  });

  describe('Constructor and Basic Properties', () => {
    test('should initialize with a survey', () => {
      expect(editor.survey).toBe(survey);
      expect(editor.hasUncommittedChanges).toBe(false);
    });

    test('should provide access to survey items', () => {
      expect(editor.survey.surveyItems).toBeDefined();
      expect(Object.keys(editor.survey.surveyItems)).toContain('test-survey');
      expect(Object.keys(editor.survey.surveyItems)).toContain('test-survey.page1');
    });

    test('should initialize undo/redo functionality', () => {
      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(false);
    });
  });

  describe('Commit and Uncommitted Changes', () => {
    test('should track uncommitted changes after modifications', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // addItem automatically commits, so hasUncommittedChanges should be false
      expect(editor.hasUncommittedChanges).toBe(false);
    });

    test('should commit changes with description', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      expect(editor.canUndo()).toBe(true);
      expect(editor.getUndoDescription()).toBe('Added test-survey.page1.item1');
    });

    test('should track uncommitted changes when updating item translations', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // Now update translations (this should mark as modified without committing)
      const updatedTranslations = createTestTranslations();
      updatedTranslations.setContent('es', 'title', { type: ContentType.md, content: 'Contenido de prueba' });

      editor.updateItemTranslations('test-survey.page1.item1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);
    });

    test('should commit if needed when starting new operations', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // Update translations to create uncommitted changes
      const updatedTranslations = createTestTranslations();
      editor.updateItemTranslations('test-survey.page1.item1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);

      // Adding a new item should commit the previous changes
      const testItem2 = new DisplayItem('test-survey.page1.item2');
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);

      expect(editor.hasUncommittedChanges).toBe(false);
    });
  });

  describe('Undo/Redo Functionality', () => {
    test('should support undo after adding items', () => {
      const initialItemCount = Object.keys(editor.survey.surveyItems).length;

      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      expect(Object.keys(editor.survey.surveyItems)).toHaveLength(initialItemCount + 1);
      expect(editor.canUndo()).toBe(true);

      const undoSuccess = editor.undo();
      expect(undoSuccess).toBe(true);
      expect(Object.keys(editor.survey.surveyItems)).toHaveLength(initialItemCount);
      expect(editor.survey.surveyItems['test-survey.page1.item1']).toBeUndefined();
    });

    test('should support redo after undo', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      editor.undo();
      expect(editor.canRedo()).toBe(true);

      const redoSuccess = editor.redo();
      expect(redoSuccess).toBe(true);
      expect(editor.survey.surveyItems['test-survey.page1.item1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.item1'].itemType).toBe(SurveyItemType.Display);
    });

    test('should handle undo with uncommitted changes', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // Make an uncommitted change
      const updatedTranslations = createTestTranslations();
      editor.updateItemTranslations('test-survey.page1.item1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);

      // Undo should revert to last committed state
      const undoSuccess = editor.undo();
      expect(undoSuccess).toBe(true);
      expect(editor.hasUncommittedChanges).toBe(false);
    });

    test('should not allow redo with uncommitted changes', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);
      editor.undo();

      // Redo first to restore the item
      editor.redo();

      // Make an uncommitted change
      const updatedTranslations = createTestTranslations();
      editor.updateItemTranslations('test-survey.page1.item1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);
      expect(editor.canRedo()).toBe(false);

      const redoSuccess = editor.redo();
      expect(redoSuccess).toBe(false);
    });

    test('should provide undo/redo descriptions', () => {
      const testItem = new DisplayItem('test-survey.page1.item1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      expect(editor.getUndoDescription()).toBe('Added test-survey.page1.item1');
      expect(editor.getRedoDescription()).toBeNull();

      editor.undo();
      expect(editor.getUndoDescription()).toBeNull();
      expect(editor.getRedoDescription()).toBe('Added test-survey.page1.item1');
    });
  });

  describe('Adding Items', () => {
    test('should add item to specified parent group', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBe(testItem);

      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).toContain('test-survey.page1.display1');
    });

    test('should add item at specified index', () => {
      const testItem1 = new DisplayItem('test-survey.page1.display1');
      const testItem2 = new DisplayItem('test-survey.page1.display2');
      const testItem3 = new DisplayItem('test-survey.page1.display3');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem3, testTranslations);

      // Insert at index 1 (between item1 and item3)
      editor.addItem({ parentKey: 'test-survey.page1', index: 1 }, testItem2, testTranslations);

      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).toEqual([
        'test-survey.page1.display1',
        'test-survey.page1.display2',
        'test-survey.page1.display3'
      ]);
    });

    test('should add item to root when no target specified', () => {
      // Create a survey with only root group
      const rootOnlySurvey = new Survey('root-survey');
      const rootEditor = new SurveyEditor(rootOnlySurvey);

      const testItem = new DisplayItem('root-survey.display1');
      const testTranslations = createTestTranslations();

      rootEditor.addItem(undefined, testItem, testTranslations);

      expect(rootEditor.survey.surveyItems['root-survey.display1']).toBeDefined();

      const rootGroup = rootEditor.survey.surveyItems['root-survey'] as GroupItem;
      expect(rootGroup.items).toContain('root-survey.display1');
    });

    test('should set item translations when adding', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const retrievedTranslations = editor.survey.getItemTranslations('test-survey.page1.display1');
      expect(retrievedTranslations).toBeDefined();

      // Check if translations were actually set
      const localeContent = retrievedTranslations!.getLocaleContent(enLocale);
      expect(localeContent).toBeDefined();
      expect(localeContent!['title']).toEqual({
        type: ContentType.md,
        content: 'Test content'
      });
    });

    test('should handle adding different types of survey items', () => {
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const groupItem = new GroupItem('test-survey.page1.group1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, testTranslations);

      expect(editor.survey.surveyItems['test-survey.page1.display1'].itemType).toBe(SurveyItemType.Display);
      expect(editor.survey.surveyItems['test-survey.page1.question1'].itemType).toBe(SurveyItemType.SingleChoiceQuestion);
      expect(editor.survey.surveyItems['test-survey.page1.group1'].itemType).toBe(SurveyItemType.Group);
    });

    test('should throw error when parent group not found', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      expect(() => {
        editor.addItem({ parentKey: 'non-existent-parent' }, testItem, testTranslations);
      }).toThrow("Parent item with key 'non-existent-parent' not found");
    });

    test('should throw error when parent is not a group item', () => {
      // First add a display item
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Try to add an item to the display item (which is not a group)
      const testItem = new DisplayItem('test-survey.page1.display1.invalid');

      expect(() => {
        editor.addItem({ parentKey: 'test-survey.page1.display1' }, testItem, testTranslations);
      }).toThrow("Parent item 'test-survey.page1.display1' is not a group item");
    });

    test('should throw error when no root group found', () => {
      // Create a survey with no root group (edge case)
      const emptySurvey = new Survey();
      emptySurvey.surveyItems = {}; // Remove the default root group
      const emptyEditor = new SurveyEditor(emptySurvey);

      const testItem = new DisplayItem('display1');
      const testTranslations = createTestTranslations();

      expect(() => {
        emptyEditor.addItem(undefined, testItem, testTranslations);
      }).toThrow('No root group found in survey');
    });
  });

  describe('Removing Items', () => {
    test('should remove item and update parent group', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();

      const removeSuccess = editor.removeItem('test-survey.page1.display1');

      expect(removeSuccess).toBe(true);
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeUndefined();

      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).not.toContain('test-survey.page1.display1');
    });

    test('should remove item translations when removing item', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // Verify translations exist
      expect(editor.survey.getItemTranslations('test-survey.page1.display1')).toBeDefined();

      editor.removeItem('test-survey.page1.display1');

      // After removal, getting translations for non-existent item should throw error
      expect(() => {
        editor.survey.getItemTranslations('test-survey.page1.display1');
      }).toThrow('Item test-survey.page1.display1 not found');
    });

    test('should return false when trying to remove non-existent item', () => {
      const removeSuccess = editor.removeItem('non-existent-item');
      expect(removeSuccess).toBe(false);
    });

    test('should throw error when trying to remove root item', () => {
      expect(() => {
        editor.removeItem('test-survey');
      }).toThrow("Item with key 'test-survey' is the root item");
    });

    test('should handle removing items from different positions', () => {
      const testItem1 = new DisplayItem('test-survey.page1.display1');
      const testItem2 = new DisplayItem('test-survey.page1.display2');
      const testItem3 = new DisplayItem('test-survey.page1.display3');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem3, testTranslations);

      // Remove middle item
      editor.removeItem('test-survey.page1.display2');

      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).toEqual([
        'test-survey.page1.display1',
        'test-survey.page1.display3'
      ]);
    });
  });

  describe('Moving Items', () => {
    test('should return false for moveItem (not implemented)', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const moveSuccess = editor.moveItem('test-survey.page1.display1', {
        parentKey: 'test-survey.page1',
        index: 0
      });

      expect(moveSuccess).toBe(false);
    });

    test('should commit changes when attempting to move', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // Make an uncommitted change
      const updatedTranslations = createTestTranslations();
      editor.updateItemTranslations('test-survey.page1.display1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);

      editor.moveItem('test-survey.page1.display1', {
        parentKey: 'test-survey.page1',
        index: 0
      });

      // Should have committed the changes
      expect(editor.hasUncommittedChanges).toBe(false);
    });
  });

  describe('Updating Item Translations', () => {
    test('should update item translations and mark as modified', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const updatedTranslations = new SurveyItemTranslations();
      updatedTranslations.setContent(enLocale, 'title', { type: ContentType.md, content: 'Updated content' });
      updatedTranslations.setContent('fr', 'title', { type: ContentType.md, content: 'Contenu mis à jour' });

      const updateSuccess = editor.updateItemTranslations('test-survey.page1.display1', updatedTranslations);

      expect(updateSuccess).toBe(true);
      expect(editor.hasUncommittedChanges).toBe(true);

      const retrievedTranslations = editor.survey.getItemTranslations('test-survey.page1.display1');

      // Check if translations were updated correctly
      const enContent = retrievedTranslations!.getLocaleContent(enLocale);
      const frContent = retrievedTranslations!.getLocaleContent('fr');

      expect(enContent).toBeDefined();
      expect(enContent!['title']).toEqual({
        type: ContentType.md,
        content: 'Updated content'
      });

      expect(frContent).toBeDefined();
      expect(frContent!['title']).toEqual({
        type: ContentType.md,
        content: 'Contenu mis à jour'
      });
    });

    test('should throw error when updating translations for non-existent item', () => {
      const updatedTranslations = createTestTranslations();

      expect(() => {
        editor.updateItemTranslations('non-existent-item', updatedTranslations);
      }).toThrow("Item with key 'non-existent-item' not found");
    });

    test('should handle updating with undefined translations', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const updateSuccess = editor.updateItemTranslations('test-survey.page1.display1', undefined);

      expect(updateSuccess).toBe(true);
      expect(editor.hasUncommittedChanges).toBe(true);
    });
  });

  describe('Deleting Components', () => {
    test('should delete component and update item', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      testItem.components = [
        new DisplayComponent('title', undefined, 'test-survey.page1.display1'),
        new DisplayComponent('description', undefined, 'test-survey.page1.display1')
      ];
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      expect(testItem.components).toHaveLength(2);

      editor.deleteComponent('test-survey.page1.display1', 'title');

      expect(testItem.components).toHaveLength(1);
      expect(testItem.components![0].key.componentKey).toBe('description');
    });

    test('should throw error when deleting component from non-existent item', () => {
      expect(() => {
        editor.deleteComponent('non-existent-item', 'component');
      }).toThrow("Item with key 'non-existent-item' not found");
    });

    test('should commit changes and remove translations when deleting component', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      testItem.components = [
        new DisplayComponent('title', undefined, 'test-survey.page1.display1')
      ];
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // Make uncommitted changes first
      const updatedTranslations = createTestTranslations();
      editor.updateItemTranslations('test-survey.page1.display1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);

      editor.deleteComponent('test-survey.page1.display1', 'title');

      // Should have committed the previous changes and this operation
      expect(editor.hasUncommittedChanges).toBe(false);
      expect(editor.canUndo()).toBe(true);
      expect(editor.getUndoDescription()).toBe('Deleted component title from test-survey.page1.display1');
    });
  });

  describe('Memory Usage and Configuration', () => {
    test('should provide memory usage statistics', () => {
      const memoryUsage = editor.getMemoryUsage();

      expect(memoryUsage).toHaveProperty('totalMB');
      expect(memoryUsage).toHaveProperty('entries');
      expect(typeof memoryUsage.totalMB).toBe('number');
      expect(typeof memoryUsage.entries).toBe('number');
      expect(memoryUsage.entries).toBeGreaterThan(0);
    });

    test('should provide undo/redo configuration', () => {
      const config = editor.getUndoRedoConfig();

      expect(config).toHaveProperty('maxTotalMemoryMB');
      expect(config).toHaveProperty('minHistorySize');
      expect(config).toHaveProperty('maxHistorySize');
      expect(typeof config.maxTotalMemoryMB).toBe('number');
      expect(typeof config.minHistorySize).toBe('number');
      expect(typeof config.maxHistorySize).toBe('number');
    });

    test('should track memory usage increase with operations', () => {
      const initialUsage = editor.getMemoryUsage();

      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const newUsage = editor.getMemoryUsage();
      expect(newUsage.entries).toBeGreaterThan(initialUsage.entries);
      expect(newUsage.totalMB).toBeGreaterThanOrEqual(initialUsage.totalMB);
    });
  });

  describe('Complex Operations and Integration', () => {
    test('should handle multiple operations with undo/redo', () => {
      const testItem1 = new DisplayItem('test-survey.page1.display1');
      const testItem2 = new DisplayItem('test-survey.page1.display2');
      const testTranslations = createTestTranslations();

      // Add first item
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      expect(editor.getUndoDescription()).toBe('Added test-survey.page1.display1');

      // Add second item
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);
      expect(editor.getUndoDescription()).toBe('Added test-survey.page1.display2');

      // Undo last operation
      editor.undo();
      expect(editor.survey.surveyItems['test-survey.page1.display2']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();

      // Undo first operation
      editor.undo();
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeUndefined();

      // Redo both operations
      editor.redo();
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();

      editor.redo();
      expect(editor.survey.surveyItems['test-survey.page1.display2']).toBeDefined();
    });

    test('should handle mixed operations (add, remove, update)', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      // Add item
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      // Update translations
      const updatedTranslations = createTestTranslations();
      updatedTranslations.setContent('es', 'title', { type: ContentType.md, content: 'Contenido' });
      editor.updateItemTranslations('test-survey.page1.display1', updatedTranslations);

      // Remove item (this should commit the translation update first)
      const removeSuccess = editor.removeItem('test-survey.page1.display1');

      expect(removeSuccess).toBe(true);
      expect(editor.hasUncommittedChanges).toBe(false);
      expect(editor.canUndo()).toBe(true);
      expect(editor.getUndoDescription()).toBe('Removed test-survey.page1.display1');
    });

    test('should maintain survey integrity across operations', () => {
      const testItem1 = new DisplayItem('test-survey.page1.display1');
      const testItem2 = new GroupItem('test-survey.page1.subgroup1');
      const testItem3 = new DisplayItem('test-survey.page1.subgroup1.display1');
      const testTranslations = createTestTranslations();

      // Build a nested structure
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.subgroup1' }, testItem3, testTranslations);

      // Verify structure
      const page1Group = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(page1Group.items).toContain('test-survey.page1.display1');
      expect(page1Group.items).toContain('test-survey.page1.subgroup1');

      const subGroup = editor.survey.surveyItems['test-survey.page1.subgroup1'] as GroupItem;
      expect(subGroup.items).toContain('test-survey.page1.subgroup1.display1');

      // Undo operations and verify cleanup
      editor.undo(); // Remove nested display item
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.display1']).toBeUndefined();

      editor.undo(); // Remove subgroup
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1']).toBeUndefined();

      const page1GroupAfterUndo = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(page1GroupAfterUndo.items).not.toContain('test-survey.page1.subgroup1');
      expect(page1GroupAfterUndo.items).toContain('test-survey.page1.display1');
    });

    test('should handle edge case with empty parent group items array', () => {
      // Create a group with no items array
      const emptyGroup = new GroupItem('test-survey.empty-group');
      editor.survey.surveyItems['test-survey.empty-group'] = emptyGroup;

      const rootGroup = editor.survey.surveyItems['test-survey'] as GroupItem;
      if (!rootGroup.items) rootGroup.items = [];
      rootGroup.items.push('test-survey.empty-group');

      const testItem = new DisplayItem('test-survey.empty-group.display1');
      const testTranslations = createTestTranslations();

      // Should initialize items array and add item
      editor.addItem({ parentKey: 'test-survey.empty-group' }, testItem, testTranslations);

      expect(emptyGroup.items).toBeDefined();
      expect(emptyGroup.items).toContain('test-survey.empty-group.display1');
    });
  });
});
