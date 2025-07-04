import { Survey } from '../survey/survey';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { DisplayItem, GroupItem, SingleChoiceQuestionItem, SurveyItemType } from '../survey/items';
import { SurveyItemTranslations } from '../survey/utils';
import { Content, ContentType } from '../survey/utils/content';
import { DisplayComponent, ItemComponentType, ScgMcgOption, TextComponent } from '../survey/components';
import { Expression, ConstExpression, ResponseVariableExpression, FunctionExpression, FunctionExpressionNames } from '../expressions';
import { SingleChoiceQuestionEditor, SurveyItemEditor } from '../survey-editor/survey-item-editors';

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

// Helper function to create test expressions
const createTestExpression = (): Expression => {
  return new ConstExpression(true);
};

const createComplexTestExpression = (): Expression => {
  return new FunctionExpression(
    FunctionExpressionNames.eq,
    [
      new ResponseVariableExpression('test-survey.page1.question1...get'),
      new ConstExpression('option1')
    ]
  );
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
      const localeContent = retrievedTranslations!.getAllForLocale(enLocale);
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

    test('should remove group with all nested items and translations as single operation', () => {
      const testGroup = new GroupItem('test-survey.page1.subgroup1');
      const testItem1 = new DisplayItem('test-survey.page1.subgroup1.display1');
      const testItem2 = new DisplayItem('test-survey.page1.subgroup1.display2');
      const nestedGroup = new GroupItem('test-survey.page1.subgroup1.nestedgroup');
      const nestedItem = new DisplayItem('test-survey.page1.subgroup1.nestedgroup.display1');
      const testTranslations = createTestTranslations();

      // Build nested structure
      editor.addItem({ parentKey: 'test-survey.page1' }, testGroup, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.subgroup1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.subgroup1' }, testItem2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.subgroup1' }, nestedGroup, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.subgroup1.nestedgroup' }, nestedItem, testTranslations);

      // Verify all items exist
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.display2']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.nestedgroup']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.nestedgroup.display1']).toBeDefined();

      // Verify translations exist for all items
      expect(editor.survey.getItemTranslations('test-survey.page1.subgroup1')).toBeDefined();
      expect(editor.survey.getItemTranslations('test-survey.page1.subgroup1.display1')).toBeDefined();
      expect(editor.survey.getItemTranslations('test-survey.page1.subgroup1.display2')).toBeDefined();
      expect(editor.survey.getItemTranslations('test-survey.page1.subgroup1.nestedgroup')).toBeDefined();
      expect(editor.survey.getItemTranslations('test-survey.page1.subgroup1.nestedgroup.display1')).toBeDefined();

      const initialUndoCount = editor.canUndo() ? 1 : 0; // Check how many operations we can undo
      let undoCount = 0;
      while (editor.canUndo()) {
        undoCount++;
        editor.undo();
      }
      // Redo all to get back to initial state
      for (let i = 0; i < undoCount; i++) {
        editor.redo();
      }

      // Remove the group with all nested items
      const removeSuccess = editor.removeItem('test-survey.page1.subgroup1');

      expect(removeSuccess).toBe(true);

      // Verify all nested items and the group are removed from survey items
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.display1']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.display2']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.nestedgroup']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.nestedgroup.display1']).toBeUndefined();

      // Verify the group is removed from parent's items array
      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).not.toContain('test-survey.page1.subgroup1');

      // Verify all translations are removed
      expect(() => editor.survey.getItemTranslations('test-survey.page1.subgroup1')).toThrow();
      expect(() => editor.survey.getItemTranslations('test-survey.page1.subgroup1.display1')).toThrow();
      expect(() => editor.survey.getItemTranslations('test-survey.page1.subgroup1.display2')).toThrow();
      expect(() => editor.survey.getItemTranslations('test-survey.page1.subgroup1.nestedgroup')).toThrow();
      expect(() => editor.survey.getItemTranslations('test-survey.page1.subgroup1.nestedgroup.display1')).toThrow();

      // Verify this created only ONE undo operation
      expect(editor.canUndo()).toBe(true);
      expect(editor.getUndoDescription()).toBe('Removed test-survey.page1.subgroup1');

      // Undo should restore all items
      editor.undo();

      expect(editor.survey.surveyItems['test-survey.page1.subgroup1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.display2']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.nestedgroup']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.subgroup1.nestedgroup.display1']).toBeDefined();
    });
  });

  describe('Moving Items', () => {
    test('should throw error when moving non-existent item', () => {
      expect(() => {
        editor.moveItem('non-existent-item', {
          parentKey: 'test-survey.page1'
        });
      }).toThrow("Item with key 'non-existent-item' not found");
    });

    test('should throw error when target parent does not exist', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      expect(() => {
        editor.moveItem('test-survey.page1.display1', {
          parentKey: 'non-existent-parent'
        });
      }).toThrow("Target parent with key 'non-existent-parent' not found");
    });

    test('should throw error when target parent is not a group', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const testItem2 = new DisplayItem('test-survey.page1.display2');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);

      expect(() => {
        editor.moveItem('test-survey.page1.display1', {
          parentKey: 'test-survey.page1.display2' // display item, not group
        });
      }).toThrow("Target parent 'test-survey.page1.display2' is not a group item");
    });

    test('should throw error when trying to move item to its descendant', () => {
      const groupItem = new GroupItem('test-survey.page1.group1');
      const subGroupItem = new GroupItem('test-survey.page1.group1.subgroup');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, subGroupItem, testTranslations);

      expect(() => {
        editor.moveItem('test-survey.page1.group1', {
          parentKey: 'test-survey.page1.group1.subgroup'
        });
      }).toThrow("Cannot move item 'test-survey.page1.group1' to its descendant 'test-survey.page1.group1.subgroup'");
    });

    test('should prevent moving item to itself', () => {
      const groupItem = new GroupItem('test-survey.page1.group1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, testTranslations);

      expect(() => {
        editor.moveItem('test-survey.page1.group1', {
          parentKey: 'test-survey.page1.group1'
        });
      }).toThrow("Cannot move item 'test-survey.page1.group1' to its descendant 'test-survey.page1.group1'");
    });

    test('should move item between different parents and update keys', () => {
      const group1 = new GroupItem('test-survey.page1.group1');
      const group2 = new GroupItem('test-survey.page1.group2');
      const displayItem = new DisplayItem('test-survey.page1.group1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, group1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, group2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, displayItem, testTranslations);

      // Verify initial state
      expect(editor.survey.surveyItems['test-survey.page1.group1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.group2.display1']).toBeUndefined();
      expect((group1 as GroupItem).items).toContain('test-survey.page1.group1.display1');
      expect((group2 as GroupItem).items || []).not.toContain('test-survey.page1.group2.display1');

      const moveSuccess = editor.moveItem('test-survey.page1.group1.display1', {
        parentKey: 'test-survey.page1.group2',
        index: 0
      });

      expect(moveSuccess).toBe(true);

      // Verify item was moved and key updated
      expect(editor.survey.surveyItems['test-survey.page1.group1.display1']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.group2.display1']).toBeDefined();

      const movedItem = editor.survey.surveyItems['test-survey.page1.group2.display1'];
      expect(movedItem.key.fullKey).toBe('test-survey.page1.group2.display1');
      expect(movedItem.key.parentFullKey).toBe('test-survey.page1.group2');

      // Verify parent items arrays are updated
      expect((group1 as GroupItem).items).not.toContain('test-survey.page1.group1.display1');
      expect((group2 as GroupItem).items).toContain('test-survey.page1.group2.display1');
    });

    test('should move item with nested children and update all keys correctly', () => {
      const group1 = new GroupItem('test-survey.page1.group1');
      const group2 = new GroupItem('test-survey.page1.group2');
      const subGroup = new GroupItem('test-survey.page1.group1.subgroup');
      const nestedItem = new DisplayItem('test-survey.page1.group1.subgroup.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, group1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, group2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, subGroup, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.group1.subgroup' }, nestedItem, testTranslations);

      const moveSuccess = editor.moveItem('test-survey.page1.group1.subgroup', {
        parentKey: 'test-survey.page1.group2'
      });

      expect(moveSuccess).toBe(true);

      // Verify subgroup was moved
      expect(editor.survey.surveyItems['test-survey.page1.group1.subgroup']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.group2.subgroup']).toBeDefined();

      // Verify nested item key was updated
      expect(editor.survey.surveyItems['test-survey.page1.group1.subgroup.display1']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.group2.subgroup.display1']).toBeDefined();

      const movedNestedItem = editor.survey.surveyItems['test-survey.page1.group2.subgroup.display1'];
      expect(movedNestedItem.key.fullKey).toBe('test-survey.page1.group2.subgroup.display1');
      expect(movedNestedItem.key.parentFullKey).toBe('test-survey.page1.group2.subgroup');
    });

    test('should throw error when moving item to same parent', () => {
      const display1 = new DisplayItem('test-survey.page1.display1');
      const display2 = new DisplayItem('test-survey.page1.display2');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, display1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, display2, testTranslations);

      expect(() => {
        editor.moveItem('test-survey.page1.display1', {
          parentKey: 'test-survey.page1',
          index: 1
        });
      }).toThrow("Item 'test-survey.page1.display1' is already in the target parent 'test-survey.page1'");
    });

    test('should move item to end when no index specified', () => {
      const display1 = new DisplayItem('test-survey.page1.display1');
      const display2 = new DisplayItem('test-survey.page1.display2');
      const group1 = new GroupItem('test-survey.page1.group1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, display1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, display2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, group1, testTranslations);

      const moveSuccess = editor.moveItem('test-survey.page1.display1', {
        parentKey: 'test-survey.page1.group1'
      });

      expect(moveSuccess).toBe(true);

      const group1Items = (group1 as GroupItem).items;
      expect(group1Items).toBeDefined();
      expect(group1Items![group1Items!.length - 1]).toBe('test-survey.page1.group1.display1');
    });

    test('should commit changes when moving item', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const group1 = new GroupItem('test-survey.page1.group1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, group1, testTranslations);

      // Make an uncommitted change
      const updatedTranslations = createTestTranslations();
      editor.updateItemTranslations('test-survey.page1.display1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);

      editor.moveItem('test-survey.page1.display1', {
        parentKey: 'test-survey.page1.group1',
        index: 0
      });

      // Should have committed the changes
      expect(editor.hasUncommittedChanges).toBe(false);
      expect(editor.getUndoDescription()).toBe('Moved test-survey.page1.display1 to test-survey.page1.group1');
    });

    test('should handle moving to parent with no existing items', () => {
      const testItem = new DisplayItem('test-survey.page1.display1');
      const emptyGroup = new GroupItem('test-survey.page1.emptygroup');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, emptyGroup, testTranslations);

      // Ensure the empty group has no items
      expect((emptyGroup as GroupItem).items).toBeUndefined();

      const moveSuccess = editor.moveItem('test-survey.page1.display1', {
        parentKey: 'test-survey.page1.emptygroup'
      });

      expect(moveSuccess).toBe(true);
      expect((emptyGroup as GroupItem).items).toEqual(['test-survey.page1.emptygroup.display1']);
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
      const enContent = retrievedTranslations!.getAllForLocale(enLocale);
      const frContent = retrievedTranslations!.getAllForLocale('fr');

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
        new DisplayComponent(ItemComponentType.Text, 'title', undefined, 'test-survey.page1.display1'),
        new DisplayComponent(ItemComponentType.Text, 'description', undefined, 'test-survey.page1.display1')
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
        new TextComponent('title', undefined, 'test-survey.page1.display1')
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

  describe('Display Conditions', () => {
    test('should set and get root display condition', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const testCondition = createTestExpression();

      // Set root display condition
      itemEditor.setDisplayCondition(testCondition);

      // Get root display condition
      const retrievedCondition = itemEditor.getDisplayCondition();

      expect(retrievedCondition).toBeDefined();
      expect(retrievedCondition).toBeInstanceOf(ConstExpression);
      expect((retrievedCondition as ConstExpression).value).toBe(true);
      expect(retrievedCondition).not.toBe(testCondition); // Should be a clone
    });

    test('should set and get component display condition', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const testCondition = createComplexTestExpression();
      const componentKey = 'test-component';

      // Set component display condition
      itemEditor.setDisplayCondition(testCondition, componentKey);

      // Get component display condition
      const retrievedCondition = itemEditor.getDisplayCondition(componentKey);

      expect(retrievedCondition).toBeDefined();
      expect(retrievedCondition).toBeInstanceOf(FunctionExpression);
      expect((retrievedCondition as FunctionExpression).functionName).toBe(FunctionExpressionNames.eq);
      expect(retrievedCondition).not.toBe(testCondition); // Should be a clone
    });

    test('should remove root display condition by passing undefined', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const testCondition = createTestExpression();

      // Set root display condition
      itemEditor.setDisplayCondition(testCondition);
      expect(itemEditor.getDisplayCondition()).toBeDefined();

      // Remove root display condition
      itemEditor.setDisplayCondition(undefined);
      expect(itemEditor.getDisplayCondition()).toBeUndefined();
    });

    test('should remove component display condition by passing undefined', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const testCondition = createTestExpression();
      const componentKey = 'test-component';

      // Set component display condition
      itemEditor.setDisplayCondition(testCondition, componentKey);
      expect(itemEditor.getDisplayCondition(componentKey)).toBeDefined();

      // Remove component display condition
      itemEditor.setDisplayCondition(undefined, componentKey);
      expect(itemEditor.getDisplayCondition(componentKey)).toBeUndefined();
    });

    test('should return undefined for non-existent display conditions', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');

      // Get non-existent root display condition
      expect(itemEditor.getDisplayCondition()).toBeUndefined();

      // Get non-existent component display condition
      expect(itemEditor.getDisplayCondition('non-existent-component')).toBeUndefined();
    });

    test('should commit changes when setting display conditions', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const testCondition = createTestExpression();

      // Make an uncommitted change first
      const updatedTranslations = createTestTranslations();
      editor.updateItemTranslations('test-survey.page1.question1', updatedTranslations);

      expect(editor.hasUncommittedChanges).toBe(true);

      // Set display condition should commit changes
      itemEditor.setDisplayCondition(testCondition);

      expect(editor.hasUncommittedChanges).toBe(false);
      expect(editor.canUndo()).toBe(true);
      expect(editor.getUndoDescription()).toBe('Set display condition for test-survey.page1.question1');
    });

    test('should handle multiple display conditions on same item', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const rootCondition = createTestExpression();
      const componentCondition = createComplexTestExpression();

      // Set both root and component display conditions
      itemEditor.setDisplayCondition(rootCondition);
      itemEditor.setDisplayCondition(componentCondition, 'test-component');

      // Verify both conditions exist
      const retrievedRootCondition = itemEditor.getDisplayCondition();
      const retrievedComponentCondition = itemEditor.getDisplayCondition('test-component');

      expect(retrievedRootCondition).toBeDefined();
      expect(retrievedComponentCondition).toBeDefined();
      expect(retrievedRootCondition).toBeInstanceOf(ConstExpression);
      expect(retrievedComponentCondition).toBeInstanceOf(FunctionExpression);
    });

    test('should handle display conditions with complex expression structures', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');

      // Create nested function expression
      const nestedCondition = new FunctionExpression(
        FunctionExpressionNames.and,
        [
          new FunctionExpression(
            FunctionExpressionNames.eq,
            [new ResponseVariableExpression('test-survey.page1.question1...get'), new ConstExpression('option1')]
          ),
          new FunctionExpression(
            FunctionExpressionNames.gt,
            [new ConstExpression(2), new ConstExpression(5)]
          )
        ]
      );

      // Set complex display condition
      itemEditor.setDisplayCondition(nestedCondition);

      // Retrieve and verify
      const retrievedCondition = itemEditor.getDisplayCondition();
      expect(retrievedCondition).toBeDefined();
      expect(retrievedCondition).toBeInstanceOf(FunctionExpression);
      expect((retrievedCondition as FunctionExpression).functionName).toBe(FunctionExpressionNames.and);
      expect((retrievedCondition as FunctionExpression).arguments).toHaveLength(2);
    });

    test('should support undo/redo for display condition changes', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const testCondition = createTestExpression();

      // Set display condition
      itemEditor.setDisplayCondition(testCondition);
      expect(itemEditor.getDisplayCondition()).toBeDefined();

      // Undo - need to create new editor to see the undone state
      editor.undo();
      const itemEditorAfterUndo = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      expect(itemEditorAfterUndo.getDisplayCondition()).toBeUndefined();

      // Redo - need to create new editor to see the redone state
      editor.redo();
      const itemEditorAfterRedo = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      expect(itemEditorAfterRedo.getDisplayCondition()).toBeDefined();
      expect(itemEditorAfterRedo.getDisplayCondition()).toBeInstanceOf(ConstExpression);
    });

    test('should throw error when trying to set display condition on non-existent item', () => {
      expect(() => {
        new SingleChoiceQuestionEditor(editor, 'non-existent-item');
      }).toThrow('Item non-existent-item not found in survey');
    });
  });

  describe('getSiblingKeys', () => {
    test('should return empty array when item has no siblings', () => {
      const testItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const siblingKeys = itemEditor.getSiblingKeys();

      expect(siblingKeys).toEqual([]);
    });

    test('should return sibling keys when item has siblings', () => {
      const testItem1 = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testItem2 = new SingleChoiceQuestionItem('test-survey.page1.question2');
      const testItem3 = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem3, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const siblingKeys = itemEditor.getSiblingKeys();

      expect(siblingKeys).toHaveLength(2);
      expect(siblingKeys.map(key => key.fullKey)).toContain('test-survey.page1.question2');
      expect(siblingKeys.map(key => key.fullKey)).toContain('test-survey.page1.display1');
      expect(siblingKeys.map(key => key.fullKey)).not.toContain('test-survey.page1.question1');
    });

    test('should not include items from different parent groups as siblings', () => {
      // Add items to page1
      const testItem1 = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testItem2 = new SingleChoiceQuestionItem('test-survey.page1.question2');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);

      // Add a new group and items to it
      const subGroup2 = new GroupItem('test-survey.page2');
      editor.addItem({ parentKey: 'test-survey' }, subGroup2, testTranslations);

      const testItem3 = new SingleChoiceQuestionItem('test-survey.page2.question1');
      editor.addItem({ parentKey: 'test-survey.page2' }, testItem3, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const siblingKeys = itemEditor.getSiblingKeys();

      expect(siblingKeys).toHaveLength(1);
      expect(siblingKeys.map(key => key.fullKey)).toContain('test-survey.page1.question2');
      expect(siblingKeys.map(key => key.fullKey)).not.toContain('test-survey.page2.question1');
    });

    test('should work correctly with nested survey structure', () => {
      // Create a nested structure: survey > page1 > subgroup > questions
      const subGroup = new GroupItem('test-survey.page1.subgroup');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, subGroup, testTranslations);

      const testItem1 = new SingleChoiceQuestionItem('test-survey.page1.subgroup.question1');
      const testItem2 = new SingleChoiceQuestionItem('test-survey.page1.subgroup.question2');
      const testItem3 = new DisplayItem('test-survey.page1.subgroup.display1');

      editor.addItem({ parentKey: 'test-survey.page1.subgroup' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.subgroup' }, testItem2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1.subgroup' }, testItem3, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.subgroup.question1');
      const siblingKeys = itemEditor.getSiblingKeys();

      expect(siblingKeys).toHaveLength(2);
      expect(siblingKeys.map(key => key.fullKey)).toContain('test-survey.page1.subgroup.question2');
      expect(siblingKeys.map(key => key.fullKey)).toContain('test-survey.page1.subgroup.display1');
      expect(siblingKeys.map(key => key.fullKey)).not.toContain('test-survey.page1.subgroup.question1');
    });

    test('should work with root level items by testing through a child item', () => {
      // Add another root level group
      const rootGroup2 = new GroupItem('test-survey2');
      const testTranslations = createTestTranslations();

      editor.addItem(undefined, rootGroup2, testTranslations);

      // Add a page to the new root group
      const subGroup = new GroupItem('test-survey2.page1');
      editor.addItem({ parentKey: 'test-survey2' }, subGroup, testTranslations);

      // Add a question to each root group's subpage
      const testItem1 = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testItem2 = new SingleChoiceQuestionItem('test-survey2.page1.question1');

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey2.page1' }, testItem2, testTranslations);

      // Test that items in different root groups are not siblings
      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const siblingKeys = itemEditor.getSiblingKeys();

      // Should have no siblings since it's the only item in test-survey.page1
      expect(siblingKeys).toHaveLength(0);
      expect(siblingKeys.map(key => key.fullKey)).not.toContain('test-survey2.page1.question1');
    });

    test('should return keys with correct properties', () => {
      const testItem1 = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testItem2 = new SingleChoiceQuestionItem('test-survey.page1.question2');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, testItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, testItem2, testTranslations);

      const itemEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const siblingKeys = itemEditor.getSiblingKeys();

      expect(siblingKeys).toHaveLength(1);
      const siblingKey = siblingKeys[0];

      expect(siblingKey.fullKey).toBe('test-survey.page1.question2');
      expect(siblingKey.itemKey).toBe('question2');
      expect(siblingKey.parentFullKey).toBe('test-survey.page1');
      expect(siblingKey.isRoot).toBe(false);
    });
  });
});


// Helper function to create a test survey with nested structure
const createTestSurveyWithNestedItems = (surveyKey: string = 'test-survey'): Survey => {
  const survey = new Survey(surveyKey);

  // Add a sub-group to the root
  const subGroup = new GroupItem(`${surveyKey}.page1`);
  survey.surveyItems[`${surveyKey}.page1`] = subGroup;

  // Add the sub-group to the root group's items
  const rootGroup = survey.surveyItems[surveyKey] as GroupItem;
  rootGroup.items = [`${surveyKey}.page1`];

  return survey;
};



// Mock SurveyItemEditor class for testing (since it's abstract)
class TestSurveyItemEditor extends SurveyItemEditor {
  convertToType(type: SurveyItemType): void {
    // Mock implementation
  }
}

describe('SurveyItemEditor', () => {
  let survey: Survey;
  let editor: SurveyEditor;

  beforeEach(() => {
    survey = createTestSurveyWithNestedItems();
    editor = new SurveyEditor(survey);
  });

  describe('changeItemKey method', () => {
    test('should successfully change item key', () => {
      // Add a display item
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Create item editor
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);

      // Verify item exists with original key
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display1-renamed']).toBeUndefined();

      // Change the key
      itemEditor.changeItemKey('display1-renamed');

      // Verify item exists with new key
      expect(editor.survey.surveyItems['test-survey.page1.display1-renamed']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeUndefined();

      // Verify item's internal key is updated
      expect(displayItem.key.fullKey).toBe('test-survey.page1.display1-renamed');
      expect(displayItem.key.itemKey).toBe('display1-renamed');

      // Verify parent's items array is updated
      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).toContain('test-survey.page1.display1-renamed');
      expect(parentGroup.items).not.toContain('test-survey.page1.display1');
    });

    test('should throw error if sibling key already exists', () => {
      // Add two display items
      const displayItem1 = new DisplayItem('test-survey.page1.display1');
      const displayItem2 = new DisplayItem('test-survey.page1.display2');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem2, testTranslations);

      // Create item editor for first item
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);

      // Try to change key to the same as the sibling
      expect(() => {
        itemEditor.changeItemKey('display2');
      }).toThrow(`A sibling item with key 'display2' already exists`);

      // Verify original items still exist unchanged
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display2']).toBeDefined();
    });

    test('should throw error if new item key contains dots', () => {
      // Add a display item
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Create item editor
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);

      // Try to change key to one containing dots
      expect(() => {
        itemEditor.changeItemKey('display1.invalid');
      }).toThrow('Item key must not contain a dot (.)');

      // Verify original item still exists unchanged
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(displayItem.key.fullKey).toBe('test-survey.page1.display1');
    });

    test('should change key in nested items when changing a group key', () => {
      // Add a group with nested items
      const groupItem = new GroupItem('test-survey.page1.group1');
      const groupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, groupTranslations);

      // Add a single choice question inside the group
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.group1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, questionItem, questionTranslations);

      // Add components to the question for more comprehensive testing
      const titleComponent = new TextComponent('title', undefined, 'test-survey.page1.group1.question1');
      questionItem.header = { title: titleComponent };

      // Add some options for testing
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const option2 = new ScgMcgOption('option2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.items = [option1, option2];

      // Create group item editor
      const groupEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.group1', SurveyItemType.Group);

      // Verify initial state
      expect(editor.survey.surveyItems['test-survey.page1.group1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.group1.question1']).toBeDefined();
      expect(titleComponent.key.parentItemKey.fullKey).toBe('test-survey.page1.group1.question1');
      expect(option1.key.parentItemKey.fullKey).toBe('test-survey.page1.group1.question1');
      expect(option2.key.parentItemKey.fullKey).toBe('test-survey.page1.group1.question1');

      // Change the group key
      groupEditor.changeItemKey('group1-renamed');

      // Verify group key is updated
      expect(editor.survey.surveyItems['test-survey.page1.group1-renamed']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.group1']).toBeUndefined();

      // Verify nested question key is updated
      expect(editor.survey.surveyItems['test-survey.page1.group1-renamed.question1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.group1.question1']).toBeUndefined();

      // Verify nested item's parent key is updated
      const renamedQuestionItem = editor.survey.surveyItems['test-survey.page1.group1-renamed.question1'];
      expect(renamedQuestionItem.key.parentFullKey).toBe('test-survey.page1.group1-renamed');

      // Verify all component parent keys are updated
      expect(titleComponent.key.parentItemKey.fullKey).toBe('test-survey.page1.group1-renamed.question1');
      expect(option1.key.parentItemKey.fullKey).toBe('test-survey.page1.group1-renamed.question1');
      expect(option2.key.parentItemKey.fullKey).toBe('test-survey.page1.group1-renamed.question1');

      // Verify parent's items array is updated
      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).toContain('test-survey.page1.group1-renamed');
      expect(parentGroup.items).not.toContain('test-survey.page1.group1');

      // Verify group's items array is updated
      const renamedGroup = editor.survey.surveyItems['test-survey.page1.group1-renamed'] as GroupItem;
      expect(renamedGroup.items).toContain('test-survey.page1.group1-renamed.question1');
    });

    test('should change key in deeply nested items when changing a parent group key', () => {
      // Create a deeply nested structure: root -> page1 -> group1 -> subgroup -> question
      const groupItem = new GroupItem('test-survey.page1.group1');
      const groupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, groupTranslations);

      const subGroupItem = new GroupItem('test-survey.page1.group1.subgroup');
      const subGroupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, subGroupItem, subGroupTranslations);

      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.group1.subgroup.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1.subgroup' }, questionItem, questionTranslations);

      // Create group item editor for the top-level group
      const groupEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.group1', SurveyItemType.Group);

      // Verify initial parent keys
      expect(subGroupItem.key.parentFullKey).toBe('test-survey.page1.group1');
      expect(questionItem.key.parentFullKey).toBe('test-survey.page1.group1.subgroup');

      // Change the top-level group key
      groupEditor.changeItemKey('group1-renamed');

      // Verify all nested items have updated parent keys
      const renamedSubGroup = editor.survey.surveyItems['test-survey.page1.group1-renamed.subgroup'];
      const renamedQuestion = editor.survey.surveyItems['test-survey.page1.group1-renamed.subgroup.question1'];

      expect(renamedSubGroup).toBeDefined();
      expect(renamedQuestion).toBeDefined();

      // Check parent keys are correctly updated
      expect(renamedSubGroup.key.parentFullKey).toBe('test-survey.page1.group1-renamed');
      expect(renamedQuestion.key.parentFullKey).toBe('test-survey.page1.group1-renamed.subgroup');

      // Verify old keys are removed
      expect(editor.survey.surveyItems['test-survey.page1.group1.subgroup']).toBeUndefined();
      expect(editor.survey.surveyItems['test-survey.page1.group1.subgroup.question1']).toBeUndefined();
    });

    test('should update internal item reference after key change', () => {
      // Add a single choice question
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, questionTranslations);

      // Create question editor
      const questionEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');

      // Verify initial internal reference
      expect(questionEditor['_currentItem']).toBe(questionItem);
      expect(questionEditor['_currentItem'].key.fullKey).toBe('test-survey.page1.question1');

      // Change the key
      questionEditor.changeItemKey('question1-renamed');

      // Verify internal reference is updated
      expect(questionEditor['_currentItem']).toBe(editor.survey.surveyItems['test-survey.page1.question1-renamed']);
      expect(questionEditor['_currentItem'].key.fullKey).toBe('test-survey.page1.question1-renamed');
      expect(questionEditor['_currentItem']).toBe(questionItem); // Should be the same object, just updated
    });

    test('should handle root item key change', () => {
      // Add a new root item to test (since we can't change the survey root itself)
      const newRootSurvey = new Survey('new-survey');
      const newEditor = new SurveyEditor(newRootSurvey);

      // Add a page to the root
      const pageItem = new GroupItem('new-survey.page1');
      const pageTranslations = createTestTranslations();
      newEditor.addItem({ parentKey: 'new-survey' }, pageItem, pageTranslations);

      // Create item editor for the page (which is directly under root)
      const pageEditor = new TestSurveyItemEditor(newEditor, 'new-survey.page1', SurveyItemType.Group);

      // Change the page key
      pageEditor.changeItemKey('page1-renamed');

      // Verify page key is updated
      expect(newEditor.survey.surveyItems['new-survey.page1-renamed']).toBeDefined();
      expect(newEditor.survey.surveyItems['new-survey.page1']).toBeUndefined();

      // Verify parent's items array is updated
      const rootGroup = newEditor.survey.surveyItems['new-survey'] as GroupItem;
      expect(rootGroup.items).toContain('new-survey.page1-renamed');
      expect(rootGroup.items).not.toContain('new-survey.page1');
    });

    test('should allow changing to the same key (no-op)', () => {
      // Add a display item
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Create item editor
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);

      // Change to the same key should work (no-op)
      expect(() => {
        itemEditor.changeItemKey('display1');
      }).not.toThrow();

      // Verify item still exists with same key
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(displayItem.key.fullKey).toBe('test-survey.page1.display1');
    });
  });

  describe('getSiblingKeys method', () => {
    test('should return sibling keys correctly', () => {
      // Add multiple items to the same parent
      const displayItem1 = new DisplayItem('test-survey.page1.display1');
      const displayItem2 = new DisplayItem('test-survey.page1.display2');
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem2, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

      // Create item editor for first item
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);

      // Get sibling keys
      const siblingKeys = itemEditor.getSiblingKeys();

      // Should have 2 siblings (display2 and question1)
      expect(siblingKeys).toHaveLength(2);
      expect(siblingKeys.map(key => key.itemKey)).toContain('display2');
      expect(siblingKeys.map(key => key.itemKey)).toContain('question1');
      expect(siblingKeys.map(key => key.itemKey)).not.toContain('display1'); // Should not include self
    });

    test('should return empty array when no siblings exist', () => {
      // Add only one item to the parent
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Create item editor
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);

      // Get sibling keys
      const siblingKeys = itemEditor.getSiblingKeys();

      // Should have no siblings
      expect(siblingKeys).toHaveLength(0);
    });
  });
});
