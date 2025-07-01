import { Survey } from '../survey/survey';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { DisplayItem, GroupItem, SingleChoiceQuestionItem } from '../survey/items';
import { SurveyItemTranslations } from '../survey/utils';
import { Content, ContentType } from '../survey/utils/content';
import { TextComponent, ScgMcgOption } from '../survey/components';
import { Expression, ConstExpression, ResponseVariableExpression, FunctionExpression, FunctionExpressionNames } from '../expressions';
import { TemplateValueDefinition, TemplateDefTypes } from '../expressions/template-value';
import { ExpectedValueType } from '../survey/utils/types';

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

// Helper function to create test expressions with references
const createExpressionWithReference = (itemKey: string): Expression => {
  return new FunctionExpression(
    FunctionExpressionNames.eq,
    [
      new ResponseVariableExpression(`${itemKey}...get`),
      new ConstExpression('option1')
    ]
  );
};

// Helper function to create template value with reference
const createTemplateValueWithReference = (itemKey: string): TemplateValueDefinition => {
  return {
    type: TemplateDefTypes.Default,
    returnType: ExpectedValueType.String,
    expression: new ResponseVariableExpression(`${itemKey}...get`)
  };
};

describe('SurveyEditor onItemKeyChanged', () => {
  let survey: Survey;
  let editor: SurveyEditor;

  beforeEach(() => {
    survey = createTestSurveyWithNestedItems();
    editor = new SurveyEditor(survey);
  });

  describe('Simple item key change', () => {
    test('should change key of simple item', () => {
      // Add a simple display item
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Verify item exists with original key
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBe(displayItem);

      // Change the key
      editor.onItemKeyChanged('test-survey.page1.display1', 'test-survey.page1.display1-renamed');

      // Verify item exists with new key
      expect(editor.survey.surveyItems['test-survey.page1.display1-renamed']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display1-renamed']).toBe(displayItem);
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeUndefined();

      // Verify item's internal key is updated
      expect(displayItem.key.fullKey).toBe('test-survey.page1.display1-renamed');

      // Verify parent's items array is updated
      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).toContain('test-survey.page1.display1-renamed');
      expect(parentGroup.items).not.toContain('test-survey.page1.display1');
    });

    test('should update component parent item key when item key changes', () => {
      // Add a display item with components
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Add a component to the display item
      const textComponent = new TextComponent('title', undefined, 'test-survey.page1.display1');
      displayItem.components = [textComponent];

      // Verify component's parent full key
      expect(textComponent.key.parentItemKey.fullKey).toBe('test-survey.page1.display1');

      // Change the item key
      editor.onItemKeyChanged('test-survey.page1.display1', 'test-survey.page1.display1-renamed');

      // Verify component's parent full key is updated
      expect(textComponent.key.parentItemKey.fullKey).toBe('test-survey.page1.display1-renamed');
      expect(textComponent.key.fullKey).toBe('title');
    });
  });

  describe('Group with nested items key change', () => {
    test('should change key of group with nested items and update all nested component parent keys', () => {
      // Add a group with nested items
      const groupItem = new GroupItem('test-survey.page1.group1');
      const groupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, groupTranslations);

      // Add a single choice question inside the group
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.group1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, questionItem, questionTranslations);

      // Add components to the question
      const titleComponent = new TextComponent('title', undefined, 'test-survey.page1.group1.question1');
      questionItem.header = { title: titleComponent };

      // Add some options for testing
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const option2 = new ScgMcgOption('option2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.options = [option1, option2];

      // Verify initial component keys
      expect(titleComponent.key.parentItemKey.fullKey).toBe('test-survey.page1.group1.question1');
      expect(questionItem.responseConfig.options).toHaveLength(2);
      expect(option1.key.parentItemKey.fullKey).toBe('test-survey.page1.group1.question1');
      expect(option2.key.parentItemKey.fullKey).toBe('test-survey.page1.group1.question1');

      // Change the group key
      editor.onItemKeyChanged('test-survey.page1.group1', 'test-survey.page1.group1-renamed');

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

    test('should update parent keys for nested items at multiple levels', () => {
      // Create a nested structure: root -> page1 -> group1 -> subgroup -> question
      const groupItem = new GroupItem('test-survey.page1.group1');
      const groupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, groupTranslations);

      const subGroupItem = new GroupItem('test-survey.page1.group1.subgroup');
      const subGroupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, subGroupItem, subGroupTranslations);

      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.group1.subgroup.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1.subgroup' }, questionItem, questionTranslations);

      // Verify initial parent keys
      expect(subGroupItem.key.parentFullKey).toBe('test-survey.page1.group1');
      expect(questionItem.key.parentFullKey).toBe('test-survey.page1.group1.subgroup');

      // Change the top-level group key
      editor.onItemKeyChanged('test-survey.page1.group1', 'test-survey.page1.group1-renamed');

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
  });

  describe('Template values, display, disabled and validation references', () => {
    test('should update templateValues references to the changed item', () => {
      // Add a question item
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, questionTranslations);

      // Add template values with reference to the item
      questionItem.templateValues = {
        'template1': createTemplateValueWithReference('test-survey.page1.question1')
      };

      // Verify initial template value reference
      const initialTemplateValue = questionItem.templateValues['template1'];
      expect(initialTemplateValue.expression?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1...get');

      // Change the item key
      editor.onItemKeyChanged('test-survey.page1.question1', 'test-survey.page1.question1-renamed');

      // Verify template value reference is updated
      const updatedTemplateValue = questionItem.templateValues['template1'];
      expect(updatedTemplateValue.expression?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1-renamed...get');
    });

    test('should update display conditions references to the changed item', () => {
      // Add a question item
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, questionTranslations);

      // Add display conditions with reference to the item
      questionItem.displayConditions = {
        root: createExpressionWithReference('test-survey.page1.question1'),
        components: {
          'title': createExpressionWithReference('test-survey.page1.question1')
        }
      };

      // Verify initial display condition references
      expect(questionItem.displayConditions.root?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1...get');
      expect(questionItem.displayConditions.components?.['title']?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1...get');

      // Change the item key
      editor.onItemKeyChanged('test-survey.page1.question1', 'test-survey.page1.question1-renamed');

      // Verify display condition references are updated
      expect(questionItem.displayConditions.root?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1-renamed...get');
      expect(questionItem.displayConditions.components?.['title']?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1-renamed...get');
    });

    test('should update disabled conditions references to the changed item', () => {
      // Add a question item
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, questionTranslations);

      // Add disabled conditions with reference to the item
      questionItem.disabledConditions = {
        components: {
          'title': createExpressionWithReference('test-survey.page1.question1')
        }
      };

      // Verify initial disabled condition references
      expect(questionItem.disabledConditions.components?.['title']?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1...get');

      // Change the item key
      editor.onItemKeyChanged('test-survey.page1.question1', 'test-survey.page1.question1-renamed');

      // Verify disabled condition references are updated
      expect(questionItem.disabledConditions.components?.['title']?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1-renamed...get');
    });

    test('should update validation references to the changed item', () => {
      // Add a question item
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, questionTranslations);

      // Add validations with reference to the item
      questionItem.validations = {
        'validation1': createExpressionWithReference('test-survey.page1.question1')
      };

      // Verify initial validation references
      expect(questionItem.validations['validation1']?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1...get');

      // Change the item key
      editor.onItemKeyChanged('test-survey.page1.question1', 'test-survey.page1.question1-renamed');

      // Verify validation references are updated
      expect(questionItem.validations['validation1']?.responseVariableRefs[0].toString()).toBe('test-survey.page1.question1-renamed...get');
    });
  });

  describe('Parent item list updates', () => {
    test('should update parent item list when changing item key', () => {
      // Add a display item
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Verify item is in parent's items array
      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      expect(parentGroup.items).toContain('test-survey.page1.display1');

      // Change the item key
      editor.onItemKeyChanged('test-survey.page1.display1', 'test-survey.page1.display1-renamed');

      // Verify parent's items array is updated
      expect(parentGroup.items).toContain('test-survey.page1.display1-renamed');
      expect(parentGroup.items).not.toContain('test-survey.page1.display1');
    });

    test('should update parent item list when changing nested group key', () => {
      // Add a group
      const groupItem = new GroupItem('test-survey.page1.group1');
      const groupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, groupTranslations);

      // Add a question inside the group
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.group1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, questionItem, questionTranslations);

      // Verify initial structure
      const parentGroup = editor.survey.surveyItems['test-survey.page1'] as GroupItem;
      const group = editor.survey.surveyItems['test-survey.page1.group1'] as GroupItem;
      expect(parentGroup.items).toContain('test-survey.page1.group1');
      expect(group.items).toContain('test-survey.page1.group1.question1');

      // Change the group key
      editor.onItemKeyChanged('test-survey.page1.group1', 'test-survey.page1.group1-renamed');

      // Verify parent's items array is updated
      expect(parentGroup.items).toContain('test-survey.page1.group1-renamed');
      expect(parentGroup.items).not.toContain('test-survey.page1.group1');

      // Verify group's items array is updated
      const renamedGroup = editor.survey.surveyItems['test-survey.page1.group1-renamed'] as GroupItem;
      expect(renamedGroup.items).toContain('test-survey.page1.group1-renamed.question1');
    });
  });

  describe('Commit history', () => {
    test('should have only one commit in history after changing a nested item', () => {
      // Add a group
      const groupItem = new GroupItem('test-survey.page1.group1');
      const groupTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, groupItem, groupTranslations);

      // Add a question inside the group
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.group1.question1');
      const questionTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1.group1' }, questionItem, questionTranslations);

      // Get initial commit count
      const initialMemoryUsage = editor.getMemoryUsage();
      const initialEntries = initialMemoryUsage.entries;

      // Change the group key (this should trigger recursive changes for nested items)
      editor.onItemKeyChanged('test-survey.page1.group1', 'test-survey.page1.group1-renamed');

      // Verify only one new commit was added
      const finalMemoryUsage = editor.getMemoryUsage();
      expect(finalMemoryUsage.entries).toBe(initialEntries + 1);

      // Verify the commit description
      expect(editor.getUndoDescription()).toBe('Renamed test-survey.page1.group1 to test-survey.page1.group1-renamed');
    });

    test('should handle skipCommit parameter correctly', () => {
      // Add a display item
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Get initial commit count
      const initialMemoryUsage = editor.getMemoryUsage();
      const initialEntries = initialMemoryUsage.entries;

      // Change the item key with skipCommit = true
      editor.onItemKeyChanged('test-survey.page1.display1', 'test-survey.page1.display1-renamed', true);

      // Verify no new commit was added
      const finalMemoryUsage = editor.getMemoryUsage();
      expect(finalMemoryUsage.entries).toBe(initialEntries);

      // Verify there are uncommitted changes
      expect(editor.hasUncommittedChanges).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should not change if item key already exists', () => {
      // Add two display items
      const displayItem1 = new DisplayItem('test-survey.page1.display1');
      const displayItem2 = new DisplayItem('test-survey.page1.display2');
      const testTranslations = createTestTranslations();

      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem1, testTranslations);
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem2, testTranslations);

      // Verify both items exist
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display2']).toBeDefined();

      // Try to rename display1 to display2 (which already exists)
      expect(() => {
        editor.onItemKeyChanged('test-survey.page1.display1', 'test-survey.page1.display2');
      }).toThrow("Item with key 'test-survey.page1.display2' already exists. Cannot rename test-survey.page1.display1 to test-survey.page1.display2");

      // Verify items remain unchanged
      expect(editor.survey.surveyItems['test-survey.page1.display1']).toBeDefined();
      expect(editor.survey.surveyItems['test-survey.page1.display2']).toBeDefined();
      expect(displayItem1.key.fullKey).toBe('test-survey.page1.display1');
    });

    test('should throw error when trying to change non-existent item', () => {
      expect(() => {
        editor.onItemKeyChanged('non-existent-item', 'new-key');
      }).toThrow("Item with key 'non-existent-item' not found");
    });
  });

  describe('Translations updates', () => {
    test('should update translations when item key changes', () => {
      // Add a display item with translations
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Verify translations exist for original key
      expect(editor.survey.getItemTranslations('test-survey.page1.display1')).toBeDefined();

      // Change the item key
      editor.onItemKeyChanged('test-survey.page1.display1', 'test-survey.page1.display1-renamed');

      // Verify translations exist for new key
      expect(editor.survey.getItemTranslations('test-survey.page1.display1-renamed')).toBeDefined();

      // Verify translations don't exist for old key
      expect(() => {
        editor.survey.getItemTranslations('test-survey.page1.display1');
      }).toThrow('Item test-survey.page1.display1 not found');
    });
  });
});
