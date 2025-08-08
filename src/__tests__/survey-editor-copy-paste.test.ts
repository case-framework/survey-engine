import { ItemCopyPaste, SurveyItemClipboardData } from '../survey-editor/item-copy-paste';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { Survey } from '../survey/survey';
import { GroupItem, SingleChoiceQuestionItem, MultipleChoiceQuestionItem, DisplayItem, SurveyItemType } from '../survey/items';
import { SurveyItemTranslations } from '../survey/utils';
import { TextComponent } from '../survey/components';
import { JsonSurveyItemGroup, JsonSurveyDisplayItem } from '../survey/items/survey-item-json';
import { ContentType } from '../survey/utils/content';


describe('CopyPaste Functionality', () => {
  let copyPaste: ItemCopyPaste;
  let editor: SurveyEditor; // Keep for non-copy-paste operations
  let survey: Survey;

  beforeEach(() => {
    // Create a test survey with some items
    survey = new Survey('test-survey');

    // Add a group
    const group1 = new GroupItem('test-survey.group1');
    survey.surveyItems['test-survey.group1'] = group1;
    (survey.surveyItems['test-survey'] as GroupItem).items = ['test-survey.group1'];

    // Add a single choice question
    const question1 = new SingleChoiceQuestionItem('test-survey.group1.Q1');
    survey.surveyItems['test-survey.group1.Q1'] = question1;
    group1.items = ['test-survey.group1.Q1'];

    // Add a display item
    const display1 = new DisplayItem('test-survey.group1.display1');
    display1.components = [
      new TextComponent('text1', undefined, 'test-survey.group1.display1')
    ];
    survey.surveyItems['test-survey.group1.display1'] = display1;
    group1.items.push('test-survey.group1.display1');

    copyPaste = new ItemCopyPaste(survey);
    editor = new SurveyEditor(survey); // Keep for non-copy-paste operations
  });

  describe('copyItem', () => {
    test('should copy a single choice question item', () => {
      const clipboardData = copyPaste.copyItem('test-survey.group1.Q1');

      expect(clipboardData.type).toBe('survey-item');
      expect(clipboardData.version).toBe('1.0.0');
      expect(clipboardData.rootItemKey).toBe('test-survey.group1.Q1');
      expect(clipboardData.items).toHaveLength(1);
      expect(clipboardData.items[0].itemKey).toBe('test-survey.group1.Q1');
      expect(clipboardData.items[0].itemData.itemType).toBe(SurveyItemType.SingleChoiceQuestion);
      expect(clipboardData.translations['test-survey.group1.Q1']).toBeDefined();
      expect(typeof clipboardData.translations['test-survey.group1.Q1']).toBe('object');
      expect(clipboardData.timestamp).toBeGreaterThan(0);
    });

    test('should copy a group item with children and include entire subtree', () => {
      const clipboardData = copyPaste.copyItem('test-survey.group1');

      expect(clipboardData.type).toBe('survey-item');
      expect(clipboardData.rootItemKey).toBe('test-survey.group1');
      expect(clipboardData.items).toHaveLength(3); // group + 2 children

      // Check root item
      const rootItem = clipboardData.items.find(item => item.itemKey === 'test-survey.group1');
      expect(rootItem).toBeDefined();
      expect(rootItem!.itemData.itemType).toBe(SurveyItemType.Group);
      expect((rootItem!.itemData as JsonSurveyItemGroup).items).toEqual([
        'test-survey.group1.Q1',
        'test-survey.group1.display1'
      ]);

      // Check child items are included
      const childKeys = clipboardData.items.map(item => item.itemKey).sort();
      expect(childKeys).toEqual([
        'test-survey.group1',
        'test-survey.group1.Q1',
        'test-survey.group1.display1'
      ]);

      // Check translations for all items
      expect(clipboardData.translations['test-survey.group1']).toBeDefined();
      expect(typeof clipboardData.translations['test-survey.group1']).toBe('object');
      expect(clipboardData.translations['test-survey.group1.Q1']).toBeDefined();
      expect(typeof clipboardData.translations['test-survey.group1.Q1']).toBe('object');
      expect(clipboardData.translations['test-survey.group1.display1']).toBeDefined();
      expect(typeof clipboardData.translations['test-survey.group1.display1']).toBe('object');
    });

    test('should copy a display item', () => {
      const clipboardData = copyPaste.copyItem('test-survey.group1.display1');

      expect(clipboardData.type).toBe('survey-item');
      expect(clipboardData.rootItemKey).toBe('test-survey.group1.display1');
      expect(clipboardData.items).toHaveLength(1);
      expect(clipboardData.items[0].itemKey).toBe('test-survey.group1.display1');
      expect(clipboardData.items[0].itemData.itemType).toBe(SurveyItemType.Display);
      expect((clipboardData.items[0].itemData as JsonSurveyDisplayItem).components).toBeDefined();
    });

    test('should throw error for non-existent item', () => {
      expect(() => {
        copyPaste.copyItem('non-existent-item');
      }).toThrow("Item with key 'non-existent-item' not found");
    });

    test('should include translations in clipboard data', () => {
      const translations = new SurveyItemTranslations();
      translations.setContent('en', 'title', { type: ContentType.CQM, content: 'Test Title', attributions: [] });
      editor.updateItemTranslations('test-survey.group1.display1', translations);

      const clipboardData = copyPaste.copyItem('test-survey.group1.display1');

      expect(Object.keys(clipboardData.translations['test-survey.group1.display1'])).toContain('en');
      expect(clipboardData.translations['test-survey.group1.display1']['en']['title']).toEqual({
        type: ContentType.CQM,
        content: 'Test Title',
        attributions: []
      });
    });
  });

  describe('pasteItem', () => {
    let clipboardData: SurveyItemClipboardData;

    beforeEach(() => {
      clipboardData = copyPaste.copyItem('test-survey.group1.Q1');
    });

    test('should paste item to specified location', () => {
      const newItemKey = copyPaste.pasteItem(clipboardData, {
        parentKey: 'test-survey.group1',
        index: 0
      });

      expect(newItemKey).toBe('test-survey.group1.Q1_copy');
      expect(survey.surveyItems[newItemKey]).toBeDefined();
      expect(survey.surveyItems[newItemKey].itemType).toBe(SurveyItemType.SingleChoiceQuestion);

      // Check that item was added to parent's items array
      const parentGroup = survey.surveyItems['test-survey.group1'] as GroupItem;
      expect(parentGroup.items?.[0]).toBe('test-survey.group1.Q1_copy');
    });

    test('should generate unique keys for multiple pastes', () => {
      const firstCopy = copyPaste.pasteItem(clipboardData, {
        parentKey: 'test-survey.group1'
      });
      const secondCopy = copyPaste.pasteItem(clipboardData, {
        parentKey: 'test-survey.group1'
      });
      const thirdCopy = copyPaste.pasteItem(clipboardData, {
        parentKey: 'test-survey.group1'
      });

      expect(firstCopy).toBe('test-survey.group1.Q1_copy');
      expect(secondCopy).toBe('test-survey.group1.Q1_copy_2');
      expect(thirdCopy).toBe('test-survey.group1.Q1_copy_3');

      expect(survey.surveyItems[firstCopy]).toBeDefined();
      expect(survey.surveyItems[secondCopy]).toBeDefined();
      expect(survey.surveyItems[thirdCopy]).toBeDefined();
    });

    test('should paste item at specified index', () => {
      const newItemKey = copyPaste.pasteItem(clipboardData, {
        parentKey: 'test-survey.group1',
        index: 0
      });

      const parentGroup = survey.surveyItems['test-survey.group1'] as GroupItem;
      expect(parentGroup.items?.[0]).toBe(newItemKey);
    });

    test('should recursively paste group with children', () => {
      const groupClipboard = copyPaste.copyItem('test-survey.group1');

      const newGroupKey = copyPaste.pasteItem(groupClipboard, {
        parentKey: 'test-survey'
      });

      expect(newGroupKey).toBe('test-survey.group1_copy');
      const newGroup = survey.surveyItems[newGroupKey] as GroupItem;
      expect(newGroup.items).toEqual([
        'test-survey.group1_copy.Q1',
        'test-survey.group1_copy.display1'
      ]);

      // Check that child items were created
      expect(survey.surveyItems['test-survey.group1_copy.Q1']).toBeDefined();
      expect(survey.surveyItems['test-survey.group1_copy.display1']).toBeDefined();
    });

    test('should preserve translations when pasting', () => {
      const translations = new SurveyItemTranslations();
      translations.setContent('en', 'title', { type: ContentType.CQM, content: 'Test Title', attributions: [] });
      translations.setContent('de', 'title', { type: ContentType.CQM, content: 'Test Titel', attributions: [] });
      editor.updateItemTranslations('test-survey.group1.display1', translations);

      const displayClipboard = copyPaste.copyItem('test-survey.group1.display1');
      const newItemKey = copyPaste.pasteItem(displayClipboard, {
        parentKey: 'test-survey.group1'
      });

      const newTranslations = survey.getItemTranslations(newItemKey);
      expect(newTranslations?.locales).toContain('en');
      expect(newTranslations?.locales).toContain('de');
      expect(newTranslations?.getContent('en', 'title')).toEqual({
        type: ContentType.CQM,
        content: 'Test Title',
        attributions: []
      });
      expect(newTranslations?.getContent('de', 'title')).toEqual({
        type: ContentType.CQM,
        content: 'Test Titel',
        attributions: []
      });
    });

    test('should validate clipboard data format', () => {
      const invalidClipboard = {
        type: 'invalid-type',
        version: '1.0.0',
        itemKey: 'test',
        itemData: {},
        translations: new SurveyItemTranslations(),
        timestamp: Date.now()
      };

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        copyPaste.pasteItem(invalidClipboard as any, { parentKey: 'test-survey.group1' });
      }).toThrow('Invalid clipboard data format');
    });

    test('should validate required clipboard data fields', () => {
      const incompleteClipboard = {
        type: 'survey-item',
        version: '1.0.0',
        itemKey: 'test'
        // Missing itemData, translations, timestamp
      };

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        copyPaste.pasteItem(incompleteClipboard as any, { parentKey: 'test-survey.group1' });
      }).toThrow('Invalid clipboard data format');
    });


    test('should handle undo/redo integration correctly', () => {
      // Test that paste operation is properly tracked in undo/redo history
      const initialHistoryLength = editor.undoRedo.getHistory().length + (editor.hasUncommittedChanges ? 1 : 0);

      // Commit the changes to create a history entry
      const newItemKey = editor.pasteItem(clipboardData, {
        parentKey: 'test-survey.group1'
      });

      // Should have added an operation to history
      expect(editor.undoRedo.getHistory().length).toBe(initialHistoryLength + 1);
      expect(editor.hasUncommittedChanges).toBe(false);

      // Verify the item was pasted
      expect(editor.survey.surveyItems[newItemKey]).toBeDefined();
      const parentGroup = editor.survey.surveyItems['test-survey.group1'] as GroupItem;
      expect(parentGroup.items).toContain(newItemKey);

      // Test undo
      const undoSuccess = editor.undo();
      expect(undoSuccess).toBe(true);
      expect(editor.survey.surveyItems[newItemKey]).toBeUndefined();
      expect((editor.survey.surveyItems['test-survey.group1'] as GroupItem).items).not.toContain(newItemKey);

      // Test redo
      const redoSuccess = editor.redo();
      expect(redoSuccess).toBe(true);
      expect(editor.survey.surveyItems[newItemKey]).toBeDefined();
      expect((editor.survey.surveyItems['test-survey.group1'] as GroupItem).items).toContain(newItemKey);
    });

    test('should handle case where original item no longer exists', () => {
      // Remove the original item first
      editor.removeItem('test-survey.group1.Q1');

      const clipboardData = copyPaste.copyItem('test-survey.group1.display1'); // Copy a different item

      // Should still be able to paste from clipboard even if original is gone
      expect(() => {
        const newItemKey = copyPaste.pasteItem(clipboardData, {
          parentKey: 'test-survey.group1'
        });
        expect(newItemKey).toBe('test-survey.group1.display1_copy');
      }).not.toThrow();
    });

    test('should handle empty target parent gracefully', () => {
      const clipboardData = copyPaste.copyItem('test-survey.group1.Q1');
      const newItemKey = copyPaste.pasteItem(clipboardData, {
        parentKey: 'test-survey.group1'
      });

      expect(newItemKey).toBe('test-survey.group1.Q1_copy');
    });

    test('should handle JSON serialization correctly', () => {
      const originalClipboard = copyPaste.copyItem('test-survey.group1.display1');

      // Simulate serialization/deserialization (e.g., through system clipboard)
      const serialized = JSON.stringify(originalClipboard);
      const deserialized = JSON.parse(serialized);

      // Should be able to paste from deserialized data
      const newItemKey = copyPaste.pasteItem(deserialized, {
        parentKey: 'test-survey.group1'
      });

      expect(survey.surveyItems[newItemKey]).toBeDefined();
      expect(survey.surveyItems[newItemKey].itemType).toBe(SurveyItemType.Display);
    });
  });

  // Add comprehensive translation copy-paste tests
  describe('Translation Copy-Paste Tests', () => {
    let surveyWithTranslations: Survey;
    let editorWithTranslations: SurveyEditor;
    let copyPasteWithTranslations: ItemCopyPaste;

    beforeEach(() => {
      // Create a survey with complex structure for testing translations
      surveyWithTranslations = new Survey('translation-test');
      editorWithTranslations = new SurveyEditor(surveyWithTranslations);
      copyPasteWithTranslations = new ItemCopyPaste(surveyWithTranslations);

      // Create a group with multiple items
      const mainGroup = new GroupItem('translation-test.main-group');
      surveyWithTranslations.surveyItems['translation-test.main-group'] = mainGroup;
      (surveyWithTranslations.surveyItems['translation-test'] as GroupItem).items = ['translation-test.main-group'];

      // Create Q1
      const q1 = new SingleChoiceQuestionItem('translation-test.main-group.Q1');
      surveyWithTranslations.surveyItems['translation-test.main-group.Q1'] = q1;

      // Create Q2
      const q2 = new MultipleChoiceQuestionItem('translation-test.main-group.Q2');
      surveyWithTranslations.surveyItems['translation-test.main-group.Q2'] = q2;

      // Create info display item
      const info = new DisplayItem('translation-test.main-group.info');
      info.components = [
        new TextComponent('comp1', undefined, 'translation-test.main-group.info'),
        new TextComponent('comp2', undefined, 'translation-test.main-group.info')
      ];
      surveyWithTranslations.surveyItems['translation-test.main-group.info'] = info;

      // Create nested group
      const nestedGroup = new GroupItem('translation-test.main-group.nested-group');
      surveyWithTranslations.surveyItems['translation-test.main-group.nested-group'] = nestedGroup;

      // Create Q3 in nested group
      const q3 = new SingleChoiceQuestionItem('translation-test.main-group.nested-group.Q3');
      surveyWithTranslations.surveyItems['translation-test.main-group.nested-group.Q3'] = q3;

      // Set up item hierarchy
      mainGroup.items = [
        'translation-test.main-group.Q1',
        'translation-test.main-group.Q2',
        'translation-test.main-group.info',
        'translation-test.main-group.nested-group'
      ];
      nestedGroup.items = ['translation-test.main-group.nested-group.Q3'];

      // Add comprehensive translations for all items

      // Main group translations
      const mainGroupTranslations = new SurveyItemTranslations();
      mainGroupTranslations.setContent('en', 'title', {
        type: ContentType.CQM,
        content: 'Main Survey Group',
        attributions: []
      });
      mainGroupTranslations.setContent('es', 'title', {
        type: ContentType.CQM,
        content: 'Grupo Principal de Encuesta',
        attributions: []
      });
      mainGroupTranslations.setContent('fr', 'title', {
        type: ContentType.CQM,
        content: 'Groupe Principal d\'Enquête',
        attributions: []
      });
      editorWithTranslations.updateItemTranslations('translation-test.main-group', mainGroupTranslations);

      // Q1 translations (with component translations)
      const q1Translations = new SurveyItemTranslations();
      q1Translations.setContent('en', 'title', {
        type: ContentType.CQM,
        content: 'What is your favorite color?',
        attributions: []
      });
      q1Translations.setContent('en', 'rg.1', {
        type: ContentType.CQM,
        content: 'Red',
        attributions: []
      });
      q1Translations.setContent('en', 'rg.2', {
        type: ContentType.CQM,
        content: 'Blue',
        attributions: []
      });
      q1Translations.setContent('en', 'helpPopover', {
        type: ContentType.CQM,
        content: 'Choose your preferred color from the list',
        attributions: []
      });

      q1Translations.setContent('es', 'title', {
        type: ContentType.CQM,
        content: '¿Cuál es tu color favorito?',
        attributions: []
      });
      q1Translations.setContent('es', 'rg.1', {
        type: ContentType.CQM,
        content: 'Rojo',
        attributions: []
      });
      q1Translations.setContent('es', 'rg.2', {
        type: ContentType.CQM,
        content: 'Azul',
        attributions: []
      });
      q1Translations.setContent('es', 'helpPopover', {
        type: ContentType.CQM,
        content: 'Elige tu color preferido de la lista',
        attributions: []
      });

      q1Translations.setContent('fr', 'title', {
        type: ContentType.CQM,
        content: 'Quelle est votre couleur préférée?',
        attributions: []
      });
      q1Translations.setContent('fr', 'rg.1', {
        type: ContentType.CQM,
        content: 'Rouge',
        attributions: []
      });
      q1Translations.setContent('fr', 'rg.2', {
        type: ContentType.CQM,
        content: 'Bleu',
        attributions: []
      });
      q1Translations.setContent('fr', 'helpPopover', {
        type: ContentType.CQM,
        content: 'Choisissez votre couleur préférée dans la liste',
        attributions: []
      });
      editorWithTranslations.updateItemTranslations('translation-test.main-group.Q1', q1Translations);

      // Q2 translations
      const q2Translations = new SurveyItemTranslations();
      q2Translations.setContent('en', 'title', {
        type: ContentType.CQM,
        content: 'Which activities do you enjoy?',
        attributions: []
      });
      q2Translations.setContent('en', 'subtitle', {
        type: ContentType.CQM,
        content: 'Select all that apply',
        attributions: []
      });
      q2Translations.setContent('en', 'rg.1', {
        type: ContentType.CQM,
        content: 'Reading',
        attributions: []
      });
      q2Translations.setContent('en', 'rg.2', {
        type: ContentType.CQM,
        content: 'Swimming',
        attributions: []
      });
      q2Translations.setContent('en', 'rg.3', {
        type: ContentType.CQM,
        content: 'Hiking',
        attributions: []
      });

      q2Translations.setContent('es', 'title', {
        type: ContentType.CQM,
        content: '¿Qué actividades disfrutas?',
        attributions: []
      });
      q2Translations.setContent('es', 'subtitle', {
        type: ContentType.CQM,
        content: 'Selecciona todas las que apliquen',
        attributions: []
      });
      q2Translations.setContent('es', 'rg.1', {
        type: ContentType.CQM,
        content: 'Lectura',
        attributions: []
      });
      q2Translations.setContent('es', 'rg.2', {
        type: ContentType.CQM,
        content: 'Natación',
        attributions: []
      });
      q2Translations.setContent('es', 'rg.3', {
        type: ContentType.CQM,
        content: 'Senderismo',
        attributions: []
      });
      editorWithTranslations.updateItemTranslations('translation-test.main-group.Q2', q2Translations);

      // Display item translations
      const infoTranslations = new SurveyItemTranslations();
      infoTranslations.setContent('en', 'comp1', {
        type: ContentType.CQM,
        content: 'Thank you for participating in our survey!',
        attributions: []
      });
      infoTranslations.setContent('en', 'comp2', {
        type: ContentType.md,
        content: 'Your responses help us **improve** our services.'
      });

      infoTranslations.setContent('es', 'comp1', {
        type: ContentType.CQM,
        content: '¡Gracias por participar en nuestra encuesta!',
        attributions: []
      });
      infoTranslations.setContent('es', 'comp2', {
        type: ContentType.md,
        content: 'Tus respuestas nos ayudan a **mejorar** nuestros servicios.'
      });
      editorWithTranslations.updateItemTranslations('translation-test.main-group.info', infoTranslations);

      // Nested group translations
      const nestedGroupTranslations = new SurveyItemTranslations();
      nestedGroupTranslations.setContent('en', 'title', {
        type: ContentType.CQM,
        content: 'Additional Questions',
        attributions: []
      });
      nestedGroupTranslations.setContent('es', 'title', {
        type: ContentType.CQM,
        content: 'Preguntas Adicionales',
        attributions: []
      });
      editorWithTranslations.updateItemTranslations('translation-test.main-group.nested-group', nestedGroupTranslations);

      // Q3 translations (nested item)
      const q3Translations = new SurveyItemTranslations();
      q3Translations.setContent('en', 'title', {
        type: ContentType.CQM,
        content: 'How satisfied are you overall?',
        attributions: []
      });
      q3Translations.setContent('en', 'rg.1', {
        type: ContentType.CQM,
        content: 'Very Satisfied',
        attributions: []
      });
      q3Translations.setContent('en', 'rg.2', {
        type: ContentType.CQM,
        content: 'Satisfied',
        attributions: []
      });
      q3Translations.setContent('en', 'rg.3', {
        type: ContentType.CQM,
        content: 'Neutral',
        attributions: []
      });
      q3Translations.setContent('en', 'rg.4', {
        type: ContentType.CQM,
        content: 'Dissatisfied',
        attributions: []
      });

      q3Translations.setContent('es', 'title', {
        type: ContentType.CQM,
        content: '¿Qué tan satisfecho estás en general?',
        attributions: []
      });
      q3Translations.setContent('es', 'rg.1', {
        type: ContentType.CQM,
        content: 'Muy Satisfecho',
        attributions: []
      });
      q3Translations.setContent('es', 'rg.2', {
        type: ContentType.CQM,
        content: 'Satisfecho',
        attributions: []
      });
      q3Translations.setContent('es', 'rg.3', {
        type: ContentType.CQM,
        content: 'Neutral',
        attributions: []
      });
      q3Translations.setContent('es', 'rg.4', {
        type: ContentType.CQM,
        content: 'Insatisfecho',
        attributions: []
      });
      editorWithTranslations.updateItemTranslations('translation-test.main-group.nested-group.Q3', q3Translations);
    });

    test('should copy single item with all its translations', () => {
      const clipboardData = copyPasteWithTranslations.copyItem('translation-test.main-group.Q1');

      expect(clipboardData.items).toHaveLength(1);
      expect(clipboardData.rootItemKey).toBe('translation-test.main-group.Q1');

      // Check translations are copied
      const itemTranslations = clipboardData.translations['translation-test.main-group.Q1'];
      expect(itemTranslations).toBeDefined();
      expect(Object.keys(itemTranslations)).toContain('en');
      expect(Object.keys(itemTranslations)).toContain('es');
      expect(Object.keys(itemTranslations)).toContain('fr');

      // Verify specific translation content
      expect(itemTranslations['en']['title']).toEqual({
        type: ContentType.CQM,
        content: 'What is your favorite color?',
        attributions: []
      });
      expect(itemTranslations['es']['title']).toEqual({
        type: ContentType.CQM,
        content: '¿Cuál es tu color favorito?',
        attributions: []
      });
      expect(itemTranslations['fr']['title']).toEqual({
        type: ContentType.CQM,
        content: 'Quelle est votre couleur préférée?',
        attributions: []
      });

      // Verify component translations
      expect(itemTranslations['en']['rg.1']).toEqual({
        type: ContentType.CQM,
        content: 'Red',
        attributions: []
      });
      expect(itemTranslations['es']['rg.1']).toEqual({
        type: ContentType.CQM,
        content: 'Rojo',
        attributions: []
      });
      expect(itemTranslations['fr']['rg.1']).toEqual({
        type: ContentType.CQM,
        content: 'Rouge',
        attributions: []
      });
    });

    test('should copy group with entire subtree and all translations', () => {
      const clipboardData = copyPasteWithTranslations.copyItem('translation-test.main-group');

      // Should include main group + 4 items (Q1, Q2, info, nested-group) + 1 nested item (Q3) = 6 total
      expect(clipboardData.items).toHaveLength(6);
      expect(clipboardData.rootItemKey).toBe('translation-test.main-group');

      // Check all expected items are included
      const itemKeys = clipboardData.items.map(item => item.itemKey).sort();
      expect(itemKeys).toEqual([
        'translation-test.main-group',
        'translation-test.main-group.Q1',
        'translation-test.main-group.Q2',
        'translation-test.main-group.info',
        'translation-test.main-group.nested-group',
        'translation-test.main-group.nested-group.Q3'
      ]);

      // Verify translations exist for all items
      expect(Object.keys(clipboardData.translations)).toEqual(itemKeys);

      // Spot check some specific translations
      const mainGroupTranslations = clipboardData.translations['translation-test.main-group'];
      expect(mainGroupTranslations['en']['title']).toEqual({
        type: ContentType.CQM,
        content: 'Main Survey Group',
        attributions: []
      });
      expect(mainGroupTranslations['es']['title']).toEqual({
        type: ContentType.CQM,
        content: 'Grupo Principal de Encuesta',
        attributions: []
      });

      const q3Translations = clipboardData.translations['translation-test.main-group.nested-group.Q3'];
      expect(q3Translations['en']['title']).toEqual({
        type: ContentType.CQM,
        content: 'How satisfied are you overall?',
        attributions: []
      });
      expect(q3Translations['es']['rg.1']).toEqual({
        type: ContentType.CQM,
        content: 'Muy Satisfecho',
        attributions: []
      });
    });

    test('should paste single item with properly updated translation keys', () => {
      const clipboardData = copyPasteWithTranslations.copyItem('translation-test.main-group.Q1');

      // Create target location
      const newSection = new GroupItem('translation-test.new-section');
      surveyWithTranslations.surveyItems['translation-test.new-section'] = newSection;
      (surveyWithTranslations.surveyItems['translation-test'] as GroupItem).items!.push('translation-test.new-section');

      const newItemKey = copyPasteWithTranslations.pasteItem(clipboardData, {
        parentKey: 'translation-test.new-section'
      });

      expect(newItemKey).toBe('translation-test.new-section.Q1');

      // Verify the item was created
      expect(surveyWithTranslations.surveyItems[newItemKey]).toBeDefined();

      // Verify translations were properly updated with new keys
      const pastedTranslations = surveyWithTranslations.getItemTranslations(newItemKey);
      expect(pastedTranslations).toBeDefined();
      expect(pastedTranslations!.locales).toContain('en');
      expect(pastedTranslations!.locales).toContain('es');
      expect(pastedTranslations!.locales).toContain('fr');

      // Verify translation content is preserved
      expect(pastedTranslations!.getContent('en', 'title')).toEqual({
        type: ContentType.CQM,
        content: 'What is your favorite color?',
        attributions: []
      });
      expect(pastedTranslations!.getContent('es', 'rg.2')).toEqual({
        type: ContentType.CQM,
        content: 'Azul',
        attributions: []
      });
      expect(pastedTranslations!.getContent('fr', 'helpPopover')).toEqual({
        type: ContentType.CQM,
        content: 'Choisissez votre couleur préférée dans la liste',
        attributions: []
      });

      // Verify original translations are still intact
      const originalTranslations = surveyWithTranslations.getItemTranslations('translation-test.main-group.Q1');
      expect(originalTranslations!.getContent('en', 'title')).toEqual({
        type: ContentType.CQM,
        content: 'What is your favorite color?',
        attributions: []
      });
    });

    test('should paste group subtree with properly updated translation keys for all items', () => {
      const clipboardData = copyPasteWithTranslations.copyItem('translation-test.main-group');

      // Create target location
      const copiedSection = new GroupItem('translation-test.copied-section');
      surveyWithTranslations.surveyItems['translation-test.copied-section'] = copiedSection;
      (surveyWithTranslations.surveyItems['translation-test'] as GroupItem).items!.push('translation-test.copied-section');

      const newRootKey = copyPasteWithTranslations.pasteItem(clipboardData, {
        parentKey: 'translation-test.copied-section'
      });

      expect(newRootKey).toBe('translation-test.copied-section.main-group');

      // Verify all items were created with correct keys
      const expectedNewKeys = [
        'translation-test.copied-section.main-group',
        'translation-test.copied-section.main-group.Q1',
        'translation-test.copied-section.main-group.Q2',
        'translation-test.copied-section.main-group.info',
        'translation-test.copied-section.main-group.nested-group',
        'translation-test.copied-section.main-group.nested-group.Q3'
      ];

      expectedNewKeys.forEach(key => {
        expect(surveyWithTranslations.surveyItems[key]).toBeDefined();
      });

      // Verify translations were properly updated for all items
      expectedNewKeys.forEach(key => {
        const translations = surveyWithTranslations.getItemTranslations(key);
        expect(translations).toBeDefined();
        expect(translations!.locales.length).toBeGreaterThan(0);
      });

      // Spot check specific translations
      const copiedQ1Translations = surveyWithTranslations.getItemTranslations('translation-test.copied-section.main-group.Q1');
      expect(copiedQ1Translations!.getContent('en', 'title')).toEqual({
        type: ContentType.CQM,
        content: 'What is your favorite color?',
        attributions: []
      });
      expect(copiedQ1Translations!.getContent('es', 'rg.1')).toEqual({
        type: ContentType.CQM,
        content: 'Rojo',
        attributions: []
      });

      const copiedQ3Translations = surveyWithTranslations.getItemTranslations('translation-test.copied-section.main-group.nested-group.Q3');
      expect(copiedQ3Translations!.getContent('en', 'rg.3')).toEqual({
        type: ContentType.CQM,
        content: 'Neutral',
        attributions: []
      });
      expect(copiedQ3Translations!.getContent('es', 'rg.4')).toEqual({
        type: ContentType.CQM,
        content: 'Insatisfecho',
        attributions: []
      });

      // Verify original translations are still intact
      const originalQ1Translations = surveyWithTranslations.getItemTranslations('translation-test.main-group.Q1');
      expect(originalQ1Translations!.getContent('fr', 'title')).toEqual({
        type: ContentType.CQM,
        content: 'Quelle est votre couleur préférée?',
        attributions: []
      });
    });

    test('should handle multiple pastes with unique keys and preserved translations', () => {
      const clipboardData = copyPasteWithTranslations.copyItem('translation-test.main-group.Q2');

      // Create target location
      const multipleCopies = new GroupItem('translation-test.multiple-copies');
      surveyWithTranslations.surveyItems['translation-test.multiple-copies'] = multipleCopies;
      (surveyWithTranslations.surveyItems['translation-test'] as GroupItem).items!.push('translation-test.multiple-copies');

      // Paste the same item multiple times
      const firstCopy = copyPasteWithTranslations.pasteItem(clipboardData, {
        parentKey: 'translation-test.multiple-copies'
      });
      const secondCopy = copyPasteWithTranslations.pasteItem(clipboardData, {
        parentKey: 'translation-test.multiple-copies'
      });
      const thirdCopy = copyPasteWithTranslations.pasteItem(clipboardData, {
        parentKey: 'translation-test.multiple-copies'
      });

      expect(firstCopy).toBe('translation-test.multiple-copies.Q2');
      expect(secondCopy).toBe('translation-test.multiple-copies.Q2_copy');
      expect(thirdCopy).toBe('translation-test.multiple-copies.Q2_copy_2');

      // Verify all copies have proper translations
      [firstCopy, secondCopy, thirdCopy].forEach(key => {
        const translations = surveyWithTranslations.getItemTranslations(key);
        expect(translations).toBeDefined();
        expect(translations!.locales).toContain('en');
        expect(translations!.locales).toContain('es');

        expect(translations!.getContent('en', 'title')).toEqual({
          type: ContentType.CQM,
          content: 'Which activities do you enjoy?',
          attributions: []
        });
        expect(translations!.getContent('es', 'subtitle')).toEqual({
          type: ContentType.CQM,
          content: 'Selecciona todas las que apliquen',
          attributions: []
        });
        expect(translations!.getContent('en', 'rg.3')).toEqual({
          type: ContentType.CQM,
          content: 'Hiking',
          attributions: []
        });
      });
    });

    test('should preserve different content types in translations', () => {
      const clipboardData = copyPasteWithTranslations.copyItem('translation-test.main-group.info');

      // Create target location
      const infoCopy = new GroupItem('translation-test.info-copy');
      surveyWithTranslations.surveyItems['translation-test.info-copy'] = infoCopy;
      (surveyWithTranslations.surveyItems['translation-test'] as GroupItem).items!.push('translation-test.info-copy');

      const newItemKey = copyPasteWithTranslations.pasteItem(clipboardData, {
        parentKey: 'translation-test.info-copy'
      });

      const pastedTranslations = surveyWithTranslations.getItemTranslations(newItemKey);
      expect(pastedTranslations).toBeDefined();

      // Verify CQM content type is preserved
      expect(pastedTranslations!.getContent('en', 'comp1')).toEqual({
        type: ContentType.CQM,
        content: 'Thank you for participating in our survey!',
        attributions: []
      });
      expect(pastedTranslations!.getContent('es', 'comp1')).toEqual({
        type: ContentType.CQM,
        content: '¡Gracias por participar en nuestra encuesta!',
        attributions: []
      });

      // Verify Markdown content type is preserved
      expect(pastedTranslations!.getContent('en', 'comp2')).toEqual({
        type: ContentType.md,
        content: 'Your responses help us **improve** our services.'
      });
      expect(pastedTranslations!.getContent('es', 'comp2')).toEqual({
        type: ContentType.md,
        content: 'Tus respuestas nos ayudan a **mejorar** nuestros servicios.'
      });
    });

    test('should handle JSON serialization/deserialization of translations correctly', () => {
      const clipboardData = copyPasteWithTranslations.copyItem('translation-test.main-group.Q1');

      // Serialize to JSON and back (simulating clipboard operations)
      const jsonString = JSON.stringify(clipboardData);
      const deserializedData = JSON.parse(jsonString) as SurveyItemClipboardData;

      // Create target location
      const jsonTest = new GroupItem('translation-test.json-test');
      surveyWithTranslations.surveyItems['translation-test.json-test'] = jsonTest;
      (surveyWithTranslations.surveyItems['translation-test'] as GroupItem).items!.push('translation-test.json-test');

      const newItemKey = copyPasteWithTranslations.pasteItem(deserializedData, {
        parentKey: 'translation-test.json-test'
      });

      // Verify translations work after JSON round-trip
      const pastedTranslations = surveyWithTranslations.getItemTranslations(newItemKey);
      expect(pastedTranslations).toBeDefined();

      expect(pastedTranslations!.getContent('en', 'title')).toEqual({
        type: ContentType.CQM,
        content: 'What is your favorite color?',
        attributions: []
      });
      expect(pastedTranslations!.getContent('fr', 'rg.2')).toEqual({
        type: ContentType.CQM,
        content: 'Bleu',
        attributions: []
      });
    });
  });
});

