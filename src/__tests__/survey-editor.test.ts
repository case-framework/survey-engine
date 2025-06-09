import { Survey } from '../data_types/survey';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { DisplayItem, GroupItem, SurveyItemType, SurveyItemTranslations } from '../data_types/survey-item';
import { DisplayComponent } from '../data_types/survey-item-component';

describe('SurveyEditor', () => {
  let survey: Survey;
  let editor: SurveyEditor;

  beforeEach(() => {
    // Create a new survey for each test
    survey = new Survey('testSurvey');
    editor = new SurveyEditor(survey);
  });

  describe('constructor', () => {
    it('should create a survey editor with the provided survey', () => {
      expect(editor.survey).toBe(survey);
      expect(editor.survey.surveyItems).toBeDefined();
      expect(Object.keys(editor.survey.surveyItems)).toContain('testSurvey');
    });
  });

  describe('addItem', () => {
    let testItem: DisplayItem;
    let testTranslations: SurveyItemTranslations;

    beforeEach(() => {
      // Create a test display item
      testItem = new DisplayItem('testSurvey.question1');
      testItem.components = [
        new DisplayComponent('title', undefined, 'testSurvey.question1')
      ];

      // Create test translations
      testTranslations = {
        en: {
          'title': 'What is your name?'
        },
        es: {
          'title': '¿Cuál es tu nombre?'
        }
      };
    });

    describe('adding to root (no target)', () => {
      it('should add item to root group when no target is provided', () => {
        editor.addItem(undefined, testItem, testTranslations);

        // Check that item was added to survey items
        expect(editor.survey.surveyItems['testSurvey.question1']).toBe(testItem);

        // Check that item was added to root group's items array
        const rootGroup = editor.survey.surveyItems['testSurvey'] as GroupItem;
        expect(rootGroup.items).toContain('testSurvey.question1');
        expect(rootGroup.items).toHaveLength(1);
      });

      it('should add multiple items to root in order', () => {
        const item2 = new DisplayItem('testSurvey.question2');
        const item3 = new DisplayItem('testSurvey.question3');

        editor.addItem(undefined, testItem, testTranslations);
        editor.addItem(undefined, item2, testTranslations);
        editor.addItem(undefined, item3, testTranslations);

        const rootGroup = editor.survey.surveyItems['testSurvey'] as GroupItem;
        expect(rootGroup.items).toEqual([
          'testSurvey.question1',
          'testSurvey.question2',
          'testSurvey.question3'
        ]);
      });

      it('should update translations when adding to root', () => {
        editor.addItem(undefined, testItem, testTranslations);

        expect(editor.survey.translations).toBeDefined();
        expect(editor.survey.translations!['en']['testSurvey.question1']).toEqual(testTranslations.en);
        expect(editor.survey.translations!['es']['testSurvey.question1']).toEqual(testTranslations.es);
      });
    });

    describe('adding to specific group (with target)', () => {
      let subGroup: GroupItem;

      beforeEach(() => {
        // Add a subgroup first
        subGroup = new GroupItem('testSurvey.subgroup');
        editor.survey.surveyItems['testSurvey.subgroup'] = subGroup;

        const rootGroup = editor.survey.surveyItems['testSurvey'] as GroupItem;
        rootGroup.items = ['testSurvey.subgroup'];
      });

      it('should add item to specified group', () => {
        const target = { parentKey: 'testSurvey.subgroup' };
        const subgroupItem = new DisplayItem('testSurvey.subgroup.question1');

        editor.addItem(target, subgroupItem, testTranslations);

        expect(editor.survey.surveyItems['testSurvey.subgroup.question1']).toBe(subgroupItem);
        expect(subGroup.items).toContain('testSurvey.subgroup.question1');
      });

      it('should add item at specified index', () => {
        // Add some existing items first
        const existingItem1 = new DisplayItem('testSurvey.subgroup.existing1');
        const existingItem2 = new DisplayItem('testSurvey.subgroup.existing2');

        subGroup.items = ['testSurvey.subgroup.existing1', 'testSurvey.subgroup.existing2'];
        editor.survey.surveyItems['testSurvey.subgroup.existing1'] = existingItem1;
        editor.survey.surveyItems['testSurvey.subgroup.existing2'] = existingItem2;

        // Add new item at index 1 (between existing items)
        const target = { parentKey: 'testSurvey.subgroup', index: 1 };
        const newItem = new DisplayItem('testSurvey.subgroup.newItem');

        editor.addItem(target, newItem, testTranslations);

        expect(subGroup.items).toEqual([
          'testSurvey.subgroup.existing1',
          'testSurvey.subgroup.newItem',
          'testSurvey.subgroup.existing2'
        ]);
      });

      it('should add item at end if index is larger than array length', () => {
        subGroup.items = ['testSurvey.subgroup.existing1'];

        const target = { parentKey: 'testSurvey.subgroup', index: 999 };
        const newItem = new DisplayItem('testSurvey.subgroup.newItem');

        editor.addItem(target, newItem, testTranslations);

        expect(subGroup.items).toEqual([
          'testSurvey.subgroup.existing1',
          'testSurvey.subgroup.newItem'
        ]);
      });

      it('should add item at index 0 (beginning)', () => {
        subGroup.items = ['testSurvey.subgroup.existing1'];

        const target = { parentKey: 'testSurvey.subgroup', index: 0 };
        const newItem = new DisplayItem('testSurvey.subgroup.newItem');

        editor.addItem(target, newItem, testTranslations);

        expect(subGroup.items).toEqual([
          'testSurvey.subgroup.newItem',
          'testSurvey.subgroup.existing1'
        ]);
      });

      it('should throw error if parent key does not exist', () => {
        const target = { parentKey: 'nonexistent.group' };
        const newItem = new DisplayItem('testSurvey.newItem');

        expect(() => {
          editor.addItem(target, newItem, testTranslations);
        }).toThrow("Parent item with key 'nonexistent.group' not found");
      });

      it('should throw error if parent is not a group item', () => {
        // Add a display item as parent (not a group)
        const displayItem = new DisplayItem('testSurvey.displayItem');
        editor.survey.surveyItems['testSurvey.displayItem'] = displayItem;

        const target = { parentKey: 'testSurvey.displayItem' };
        const newItem = new DisplayItem('testSurvey.newItem');

        expect(() => {
          editor.addItem(target, newItem, testTranslations);
        }).toThrow("Parent item 'testSurvey.displayItem' is not a group item");
      });
    });

    describe('translation handling', () => {
      it('should initialize translations object if it does not exist', () => {
        expect(editor.survey.translations).toBeUndefined();

        editor.addItem(undefined, testItem, testTranslations);

        expect(editor.survey.translations).toBeDefined();
        expect(editor.survey.translations!['en']).toBeDefined();
        expect(editor.survey.translations!['es']).toBeDefined();
      });

      it('should merge translations with existing ones', () => {
        // Add existing translations
        editor.survey.translations = {
          en: {},
          es: {},
          fr: {}
        };

        editor.addItem(undefined, testItem, testTranslations);

        expect(editor.survey.translations['en']['testSurvey.question1']).toEqual(testTranslations.en);
        expect(editor.survey.translations['es']['testSurvey.question1']).toEqual(testTranslations.es);
        expect(editor.survey.translations['fr']).toEqual({}); // Should preserve existing empty locale
      });

      it('should handle items with no translations', () => {
        const emptyTranslations: SurveyItemTranslations = {};

        expect(() => {
          editor.addItem(undefined, testItem, emptyTranslations);
        }).not.toThrow();

        expect(editor.survey.translations).toBeDefined();
      });
    });

    describe('error handling', () => {
      it('should throw error if no root group found', () => {
        // Create a survey without a proper root group
        const malformedSurvey = new Survey();
        malformedSurvey.surveyItems = {}; // No root group
        const malformedEditor = new SurveyEditor(malformedSurvey);

        expect(() => {
          malformedEditor.addItem(undefined, testItem, testTranslations);
        }).toThrow('No root group found in survey');
      });
    });

    describe('group items initialization', () => {
      it('should initialize items array if group has no items', () => {
        // Create a group without items array
        const emptyGroup = new GroupItem('testSurvey.emptyGroup');
        emptyGroup.items = undefined;
        editor.survey.surveyItems['testSurvey.emptyGroup'] = emptyGroup;

        const target = { parentKey: 'testSurvey.emptyGroup' };
        const newItem = new DisplayItem('testSurvey.emptyGroup.question1');

        editor.addItem(target, newItem, testTranslations);

        expect(emptyGroup.items).toBeDefined();
        expect(emptyGroup.items).toContain('testSurvey.emptyGroup.question1');
      });
    });
  });

  describe('undo/redo functionality', () => {
    let testItem: DisplayItem;
    let testTranslations: SurveyItemTranslations;

    beforeEach(() => {
      testItem = new DisplayItem('testSurvey.question1');
      testItem.components = [
        new DisplayComponent('title', undefined, 'testSurvey.question1')
      ];

      testTranslations = {
        en: {
          'title': 'What is your name?'
        },
        es: {
          'title': '¿Cuál es tu nombre?'
        }
      };
    });

    describe('initial state', () => {
      it('should have no uncommitted changes initially', () => {
        expect(editor.hasUncommittedChanges).toBe(false);
      });

      it('should not be able to undo initially', () => {
        expect(editor.canUndo()).toBe(false);
      });

      it('should not be able to redo initially', () => {
        expect(editor.canRedo()).toBe(false);
      });

      it('should return null for undo/redo descriptions initially', () => {
        expect(editor.getUndoDescription()).toBe(null);
        expect(editor.getRedoDescription()).toBe(null);
      });
    });

    describe('addItem undo/redo', () => {
      it('should allow undo after adding item', () => {
        const originalItemCount = Object.keys(editor.survey.surveyItems).length;

        editor.addItem(undefined, testItem, testTranslations);

        expect(Object.keys(editor.survey.surveyItems)).toHaveLength(originalItemCount + 1);
        expect(editor.survey.surveyItems['testSurvey.question1']).toBe(testItem);
        expect(editor.hasUncommittedChanges).toBe(false); // addItem commits automatically
        expect(editor.canUndo()).toBe(true);

        // Undo the addition
        const undoResult = editor.undo();
        expect(undoResult).toBe(true);
        expect(Object.keys(editor.survey.surveyItems)).toHaveLength(originalItemCount);
        expect(editor.survey.surveyItems['testSurvey.question1']).toBeUndefined();
        expect(editor.hasUncommittedChanges).toBe(false);
      });

      it('should allow redo after undo of addItem', () => {
        editor.addItem(undefined, testItem, testTranslations);
        editor.undo();

        expect(editor.canRedo()).toBe(true);
        expect(editor.getRedoDescription()).toBe('Added testSurvey.question1');

        const redoResult = editor.redo();
        expect(redoResult).toBe(true);
        expect(editor.survey.surveyItems['testSurvey.question1']).toEqual(testItem);
        expect(editor.hasUncommittedChanges).toBe(false);
      });

      it('should handle multiple addItem undo/redo operations', () => {
        const item2 = new DisplayItem('testSurvey.question2');
        const item3 = new DisplayItem('testSurvey.question3');

        // Add multiple items
        editor.addItem(undefined, testItem, testTranslations);
        editor.addItem(undefined, item2, testTranslations);
        editor.addItem(undefined, item3, testTranslations);

        expect(Object.keys(editor.survey.surveyItems)).toHaveLength(4); // including root

        // Undo twice
        expect(editor.undo()).toBe(true); // Undo item3
        expect(editor.survey.surveyItems['testSurvey.question3']).toBeUndefined();

        expect(editor.undo()).toBe(true); // Undo item2
        expect(editor.survey.surveyItems['testSurvey.question2']).toBeUndefined();
        expect(editor.survey.surveyItems['testSurvey.question1']).toEqual(testItem);

        // Redo once
        expect(editor.redo()).toBe(true); // Redo item2
        // Check that item2 is restored with correct properties
        const restoredItem2 = editor.survey.surveyItems['testSurvey.question2'];
        expect(restoredItem2).toBeDefined();
        expect(restoredItem2.key.fullKey).toBe('testSurvey.question2');
        expect(restoredItem2.itemType).toBe(item2.itemType);
        expect(editor.survey.surveyItems['testSurvey.question3']).toBeUndefined();
      });

      it('should restore translations when undoing/redoing addItem', () => {
        editor.addItem(undefined, testItem, testTranslations);

        expect(editor.survey.translations!['en']['testSurvey.question1']).toEqual(testTranslations.en);

        // Undo should remove translations
        editor.undo();
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toBeUndefined();

        // Redo should restore translations
        editor.redo();
        expect(editor.survey.translations!['en']['testSurvey.question1']).toEqual(testTranslations.en);
      });

      it('should restore parent group items array when undoing addItem', () => {
        const rootGroup = editor.survey.surveyItems['testSurvey'] as GroupItem;
        const originalItems = rootGroup.items ? [...rootGroup.items] : [];

        editor.addItem(undefined, testItem, testTranslations);
        expect(rootGroup.items).toHaveLength(originalItems.length + 1);
        expect(rootGroup.items).toContain('testSurvey.question1');

        // Undo should restore original items array
        editor.undo();
        const restoredRootGroup = editor.survey.surveyItems['testSurvey'] as GroupItem;
        expect(restoredRootGroup.items?.length || 0).toBe(originalItems.length);
        if (restoredRootGroup.items) {
          expect(restoredRootGroup.items).not.toContain('testSurvey.question1');
        }
      });
    });

    describe('removeItem undo/redo', () => {
      beforeEach(() => {
        // Add some items first
        editor.addItem(undefined, testItem, testTranslations);
        const item2 = new DisplayItem('testSurvey.question2');
        editor.addItem(undefined, item2, testTranslations);
      });

      it('should allow undo after removing item', () => {
        const originalItemCount = Object.keys(editor.survey.surveyItems).length;

        expect(editor.survey.surveyItems['testSurvey.question1']).toBe(testItem);

        const removeResult = editor.removeItem('testSurvey.question1');
        expect(removeResult).toBe(true);
        expect(Object.keys(editor.survey.surveyItems)).toHaveLength(originalItemCount - 1);
        expect(editor.survey.surveyItems['testSurvey.question1']).toBeUndefined();
        expect(editor.hasUncommittedChanges).toBe(false); // removeItem commits automatically

        // Undo the removal
        const undoResult = editor.undo();
        expect(undoResult).toBe(true);
        expect(Object.keys(editor.survey.surveyItems)).toHaveLength(originalItemCount);
        expect(editor.survey.surveyItems['testSurvey.question1']).toEqual(testItem);
      });

      it('should allow redo after undo of removeItem', () => {
        editor.removeItem('testSurvey.question1');
        editor.undo();

        expect(editor.canRedo()).toBe(true);
        expect(editor.getRedoDescription()).toBe('Removed testSurvey.question1');

        const redoResult = editor.redo();
        expect(redoResult).toBe(true);
        expect(editor.survey.surveyItems['testSurvey.question1']).toBeUndefined();
      });

      it('should restore translations when undoing removeItem', () => {
        expect(editor.survey.translations!['en']['testSurvey.question1']).toEqual(testTranslations.en);

        editor.removeItem('testSurvey.question1');
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toBeUndefined();

        // Undo should restore translations
        editor.undo();
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(testTranslations.en);
      });

      it('should restore parent group items array when undoing removeItem', () => {
        const rootGroup = editor.survey.surveyItems['testSurvey'] as GroupItem;
        const originalItems = [...(rootGroup.items || [])];

        editor.removeItem('testSurvey.question1');
        expect(rootGroup.items).not.toContain('testSurvey.question1');

        // Undo should restore original items array
        editor.undo();
        const restoredRootGroup = editor.survey.surveyItems['testSurvey'] as GroupItem;
        expect(restoredRootGroup.items).toEqual(originalItems);
        expect(restoredRootGroup.items).toContain('testSurvey.question1');
      });

      it('should return false when trying to remove non-existent item', () => {
        const result = editor.removeItem('nonexistent.item');
        expect(result).toBe(false);
        expect(editor.hasUncommittedChanges).toBe(false);
      });

      it('should throw error when trying to remove root item', () => {
        expect(() => {
          editor.removeItem('testSurvey');
        }).toThrow("Item with key 'testSurvey' is the root item");
      });
    });

    describe('uncommitted changes (updateItemTranslations)', () => {
      beforeEach(() => {
        // Add an item first (this gets committed)
        editor.addItem(undefined, testItem, testTranslations);
      });

      it('should track uncommitted changes when updating translations', () => {
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated: What is your name?' },
          fr: { 'title': 'Comment vous appelez-vous?' }
        };

        editor.updateItemTranslations('testSurvey.question1', newTranslations);

        expect(editor.hasUncommittedChanges).toBe(true);
        expect(editor.canUndo()).toBe(true);
        expect(editor.getUndoDescription()).toBe('Latest content changes');
      });

      it('should revert to last committed state when undoing uncommitted changes', () => {
        const originalTranslations = { ...editor.survey.translations?.['en']?.['testSurvey.question1'] };
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated: What is your name?' }
        };

        editor.updateItemTranslations('testSurvey.question1', newTranslations);
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(newTranslations.en);

        // Undo should revert to last committed state
        const undoResult = editor.undo();
        expect(undoResult).toBe(true);
        expect(editor.hasUncommittedChanges).toBe(false);
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(originalTranslations);
      });

      it('should disable redo when there are uncommitted changes', () => {
        // Create some redo history first
        const item2 = new DisplayItem('testSurvey.question2');
        editor.addItem(undefined, item2, testTranslations);
        editor.undo(); // Now we have redo available

        expect(editor.canRedo()).toBe(true);

        // Make uncommitted changes
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated title' }
        };
        editor.updateItemTranslations('testSurvey.question1', newTranslations);

        expect(editor.canRedo()).toBe(false);
        expect(editor.getRedoDescription()).toBe(null);
        expect(editor.redo()).toBe(false); // Should fail
      });

      it('should handle multiple uncommitted changes', () => {
        const updates1: SurveyItemTranslations = {
          en: { 'title': 'First update' }
        };
        const updates2: SurveyItemTranslations = {
          en: { 'title': 'Second update' }
        };

        editor.updateItemTranslations('testSurvey.question1', updates1);
        editor.updateItemTranslations('testSurvey.question1', updates2);

        expect(editor.hasUncommittedChanges).toBe(true);
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(updates2.en);

        // Undo should revert all uncommitted changes
        editor.undo();
        expect(editor.hasUncommittedChanges).toBe(false);
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(testTranslations.en);
      });

      it('should throw error when updating non-existent item', () => {
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated title' }
        };

        expect(() => {
          editor.updateItemTranslations('nonexistent.item', newTranslations);
        }).toThrow("Item with key 'nonexistent.item' not found");

        expect(editor.hasUncommittedChanges).toBe(false);
      });
    });

    describe('commitIfNeeded method', () => {
      beforeEach(() => {
        // Add an item first so we have something to work with
        editor.addItem(undefined, testItem, testTranslations);
      });

      it('should commit changes when there are uncommitted changes', () => {
        // Make some uncommitted changes
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated: What is your name?' }
        };
        editor.updateItemTranslations('testSurvey.question1', newTranslations);

        expect(editor.hasUncommittedChanges).toBe(true);
        expect(editor.canUndo()).toBe(true);
        expect(editor.getUndoDescription()).toBe('Latest content changes');

        // Call commitIfNeeded
        editor.commitIfNeeded();

        expect(editor.hasUncommittedChanges).toBe(false);
        expect(editor.canUndo()).toBe(true);
        expect(editor.getUndoDescription()).toBe('Latest content changes'); // This should now be a committed change
      });

      it('should do nothing when there are no uncommitted changes', () => {
        expect(editor.hasUncommittedChanges).toBe(false);

        const initialMemoryUsage = editor.getMemoryUsage();

        // Call commitIfNeeded when there are no uncommitted changes
        editor.commitIfNeeded();

        expect(editor.hasUncommittedChanges).toBe(false);

        // Memory usage should be the same (no new commit was made)
        const afterMemoryUsage = editor.getMemoryUsage();
        expect(afterMemoryUsage.entries).toBe(initialMemoryUsage.entries);
      });

      it('should allow normal undo/redo operations after committing', () => {
        // Make uncommitted changes
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated title' }
        };
        editor.updateItemTranslations('testSurvey.question1', newTranslations);

        // Commit via commitIfNeeded
        editor.commitIfNeeded();

        // Should be able to undo the committed changes
        expect(editor.undo()).toBe(true);
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(testTranslations.en);

        // Should be able to redo
        expect(editor.redo()).toBe(true);
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(newTranslations.en);
      });

      it('should preserve the current state when committing', () => {
        // Make multiple uncommitted changes
        const updates1: SurveyItemTranslations = {
          en: { 'title': 'First update' }
        };
        const updates2: SurveyItemTranslations = {
          en: { 'title': 'Second update' },
          fr: { 'title': 'Deuxième mise à jour' }
        };

        editor.updateItemTranslations('testSurvey.question1', updates1);
        editor.updateItemTranslations('testSurvey.question1', updates2);

        const currentTranslationsEn = { ...editor.survey.translations?.['en']?.['testSurvey.question1'] };
        const currentTranslationsFr = { ...editor.survey.translations?.['fr']?.['testSurvey.question1'] };

        // Commit the changes
        editor.commitIfNeeded();

        // State should be preserved
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(currentTranslationsEn);
        expect(editor.survey.translations?.['fr']?.['testSurvey.question1']).toEqual(currentTranslationsFr);
      });

      it('should use default description "Latest content changes" when committing', () => {
        // Make uncommitted changes
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated title' }
        };
        editor.updateItemTranslations('testSurvey.question1', newTranslations);

        // Commit
        editor.commitIfNeeded();

        // Undo to check the description
        editor.undo();
        expect(editor.getRedoDescription()).toBe('Latest content changes');
      });

      it('should be called automatically by addItem', () => {
        // Make uncommitted changes first
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated title' }
        };
        editor.updateItemTranslations('testSurvey.question1', newTranslations);
        expect(editor.hasUncommittedChanges).toBe(true);

        // Add another item - should call commitIfNeeded internally
        const item2 = new DisplayItem('testSurvey.question2');
        editor.addItem(undefined, item2, testTranslations);

        expect(editor.hasUncommittedChanges).toBe(false); // Should be committed
        expect(editor.survey.surveyItems['testSurvey.question2']).toBe(item2);
      });

      it('should be called automatically by removeItem', () => {
        // Add another item to remove
        const item2 = new DisplayItem('testSurvey.question2');
        editor.addItem(undefined, item2, testTranslations);

        // Make uncommitted changes
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated title' }
        };
        editor.updateItemTranslations('testSurvey.question1', newTranslations);
        expect(editor.hasUncommittedChanges).toBe(true);

        // Remove the item - should call commitIfNeeded internally
        const result = editor.removeItem('testSurvey.question2');

        expect(result).toBe(true);
        expect(editor.hasUncommittedChanges).toBe(false); // Should be committed
        expect(editor.survey.surveyItems['testSurvey.question2']).toBeUndefined();
      });

      it('should handle multiple consecutive calls gracefully', () => {
        // Make uncommitted changes
        const newTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated title' }
        };
        editor.updateItemTranslations('testSurvey.question1', newTranslations);
        expect(editor.hasUncommittedChanges).toBe(true);

        const initialMemoryUsage = editor.getMemoryUsage();

        // Call commitIfNeeded multiple times
        editor.commitIfNeeded();
        editor.commitIfNeeded();
        editor.commitIfNeeded();

        expect(editor.hasUncommittedChanges).toBe(false);

        // Should only add one entry to history
        const afterMemoryUsage = editor.getMemoryUsage();
        expect(afterMemoryUsage.entries).toBe(initialMemoryUsage.entries + 1);
      });
    });

    describe('mixed operations and edge cases', () => {
      it('should handle sequence of add, update, remove operations', () => {
        // 1. Add item (committed)
        editor.addItem(undefined, testItem, testTranslations);
        expect(editor.hasUncommittedChanges).toBe(false);

        // 2. Update translations (uncommitted)
        const updatedTranslations: SurveyItemTranslations = {
          en: { 'title': 'Updated question 1' }
        };
        editor.updateItemTranslations('testSurvey.question1', updatedTranslations);
        expect(editor.hasUncommittedChanges).toBe(true);

        // 3. Add another item (should commit previous changes first)
        const item2 = new DisplayItem('testSurvey.question2');
        editor.addItem(undefined, item2, testTranslations);
        expect(editor.hasUncommittedChanges).toBe(false);

        // 4. Remove first item (should be committed)
        editor.removeItem('testSurvey.question1');
        expect(editor.hasUncommittedChanges).toBe(false);

        // Should be able to undo each operation
        expect(editor.undo()).toBe(true); // Undo remove
        expect(editor.survey.surveyItems['testSurvey.question1']).toBeDefined();

        expect(editor.undo()).toBe(true); // Undo add item2
        expect(editor.survey.surveyItems['testSurvey.question2']).toBeUndefined();

        expect(editor.undo()).toBe(true); // Undo translation update
        expect(editor.survey.translations?.['en']?.['testSurvey.question1']).toEqual(testTranslations.en);
      });

      it('should return false when trying to undo with no history', () => {
        expect(editor.undo()).toBe(false);
      });

      it('should return false when trying to redo with no redo history', () => {
        editor.addItem(undefined, testItem, testTranslations);
        expect(editor.redo()).toBe(false); // No redo history available
      });

      it('should provide memory usage statistics', () => {
        const memoryUsage = editor.getMemoryUsage();
        expect(memoryUsage).toHaveProperty('totalMB');
        expect(memoryUsage).toHaveProperty('entries');
        expect(typeof memoryUsage.totalMB).toBe('number');
        expect(typeof memoryUsage.entries).toBe('number');
        expect(memoryUsage.entries).toBeGreaterThan(0); // Should have initial state
      });

      it('should provide undo/redo configuration', () => {
        const config = editor.getUndoRedoConfig();
        expect(config).toHaveProperty('maxTotalMemoryMB');
        expect(config).toHaveProperty('minHistorySize');
        expect(config).toHaveProperty('maxHistorySize');
      });
    });
  });
});
