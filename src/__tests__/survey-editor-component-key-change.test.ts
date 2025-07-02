import { Survey } from '../survey/survey';
import { SurveyEditor } from '../survey-editor/survey-editor';
import { DisplayItem, GroupItem, SingleChoiceQuestionItem, SurveyItemType } from '../survey/items';
import { SurveyItemTranslations } from '../survey/utils';
import { Content, ContentType } from '../survey/utils/content';
import { ScgMcgOption, TextComponent } from '../survey/components';
import { SingleChoiceQuestionEditor, SurveyItemEditor } from '../survey-editor/survey-item-editors';
import { ConstExpression } from '../expressions';
import { DisplayComponentEditor, ScgMcgOptionEditor } from '../survey-editor/component-editor';

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

// Helper function to create test translations
const createTestTranslations = (): SurveyItemTranslations => {
  const translations = new SurveyItemTranslations();
  const testContent: Content = {
    type: ContentType.md,
    content: 'Test content'
  };
  translations.setContent('en', 'title', testContent);
  return translations;
};

// Test implementation of SurveyItemEditor for testing purposes
class TestSurveyItemEditor extends SurveyItemEditor {
  convertToType(type: SurveyItemType): void {
    // Implementation not needed for this test
  }
}

describe('Survey Editor Component Key Change Tests', () => {
  let survey: Survey;
  let editor: SurveyEditor;

  beforeEach(() => {
    survey = createTestSurvey();
    editor = new SurveyEditor(survey);
  });

  describe('Survey Editor Level - onComponentKeyChanged', () => {

    describe('Simple component in display item', () => {
      test('should change key of text component in display item', () => {
        // Add a display item with text component
        const displayItem = new DisplayItem('test-survey.page1.display1');
        const textComponent = new TextComponent('title', undefined, displayItem.key.fullKey);
        displayItem.components = [textComponent];

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

        // Verify initial component key
        expect(textComponent.key.fullKey).toBe('title');
        expect(textComponent.key.componentKey).toBe('title');

        // Change component key through survey editor
        editor.onComponentKeyChanged('test-survey.page1.display1', 'title', 'main-title');

        // Verify component key is updated
        expect(textComponent.key.fullKey).toBe('main-title');
        expect(textComponent.key.componentKey).toBe('main-title');
        expect(displayItem.components![0]).toBe(textComponent);
      });

      test('should update translations when changing component key', () => {
        // Add a display item with text component
        const displayItem = new DisplayItem('test-survey.page1.display1');
        const textComponent = new TextComponent('title', undefined, displayItem.key.fullKey);
        displayItem.components = [textComponent];

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

        // Add specific translation for the component
        testTranslations.setContent('en', 'title', { type: ContentType.md, content: 'Original Title' });
        editor.updateItemTranslations('test-survey.page1.display1', testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.display1', 'title', 'main-title');

        // Verify translations are updated
        const updatedTranslations = editor.survey.getItemTranslations('test-survey.page1.display1');
        expect(updatedTranslations).toBeDefined();
        expect(updatedTranslations!.getContent('en', 'main-title')).toEqual({ type: ContentType.md, content: 'Original Title' });
        expect(updatedTranslations!.getContent('en', 'title')).toBeUndefined();
      });

      test('should commit changes when changing component key', () => {
        // Add a display item with text component
        const displayItem = new DisplayItem('test-survey.page1.display1');
        const textComponent = new TextComponent('title', undefined, displayItem.key.fullKey);
        displayItem.components = [textComponent];

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.display1', 'title', 'main-title');

        // Verify changes are committed
        expect(editor.hasUncommittedChanges).toBe(false);
        expect(editor.canUndo()).toBe(true);
        expect(editor.getUndoDescription()).toBe('Renamed component title to main-title in test-survey.page1.display1');
      });

      test('should throw error when item does not exist', () => {
        expect(() => {
          editor.onComponentKeyChanged('non-existent-item', 'title', 'new-title');
        }).toThrow("Item with key 'non-existent-item' not found");
      });
    });

    describe('Component within question item', () => {
      test('should change key of title component in question header', () => {
        // Add a single choice question with title
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const titleComponent = new TextComponent('title', undefined, questionItem.key.fullKey);
        questionItem.header = { title: titleComponent };

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Verify initial component key
        expect(titleComponent.key.fullKey).toBe('title');

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'title', 'question-title');

        // Verify component key is updated
        expect(titleComponent.key.fullKey).toBe('question-title');
        expect(questionItem.header?.title).toBe(titleComponent);
      });

      test('should change key of subtitle component in question header', () => {
        // Add a single choice question with subtitle
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const subtitleComponent = new TextComponent('subtitle', undefined, questionItem.key.fullKey);
        questionItem.header = { subtitle: subtitleComponent };

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'subtitle', 'question-subtitle');

        // Verify component key is updated
        expect(subtitleComponent.key.fullKey).toBe('question-subtitle');
        expect(questionItem.header?.subtitle).toBe(subtitleComponent);
      });

      test('should change key of help popover component in question header', () => {
        // Add a single choice question with help popover
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const helpComponent = new TextComponent('help', undefined, questionItem.key.fullKey);
        questionItem.header = { helpPopover: helpComponent };

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'help', 'help-popover');

        // Verify component key is updated
        expect(helpComponent.key.fullKey).toBe('help-popover');
        expect(questionItem.header?.helpPopover).toBe(helpComponent);
      });

      test('should change key of component in question body top content', () => {
        // Add a single choice question with body content
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const bodyComponent = new TextComponent('intro', undefined, questionItem.key.fullKey);
        questionItem.body = { topContent: [bodyComponent] };

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'intro', 'introduction');

        // Verify component key is updated
        expect(bodyComponent.key.fullKey).toBe('introduction');
        expect(questionItem.body?.topContent![0]).toBe(bodyComponent);
      });

      test('should change key of component in question body bottom content', () => {
        // Add a single choice question with body content
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const bodyComponent = new TextComponent('note', undefined, questionItem.key.fullKey);
        questionItem.body = { bottomContent: [bodyComponent] };

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'note', 'bottom-note');

        // Verify component key is updated
        expect(bodyComponent.key.fullKey).toBe('bottom-note');
        expect(questionItem.body?.bottomContent![0]).toBe(bodyComponent);
      });

      test('should change key of footer component in question', () => {
        // Add a single choice question with footer
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const footerComponent = new TextComponent('footer', undefined, questionItem.key.fullKey);
        questionItem.footer = footerComponent;

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'footer', 'question-footer');

        // Verify component key is updated
        expect(footerComponent.key.fullKey).toBe('question-footer');
        expect(questionItem.footer).toBe(footerComponent);
      });

      test('should update display and disabled conditions when changing component key', () => {
        // Add a single choice question with conditions
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const titleComponent = new TextComponent('title', undefined, questionItem.key.fullKey);
        questionItem.header = { title: titleComponent };

        // Add display and disabled conditions for the component using proper Expression objects
        questionItem.displayConditions = {
          components: {
            'title': new ConstExpression(true)
          }
        };
        questionItem.disabledConditions = {
          components: {
            'title': new ConstExpression(false)
          }
        };

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Change component key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'title', 'question-title');

        // Verify conditions are updated
        expect(questionItem.displayConditions?.components?.['question-title']).toBeDefined();
        expect(questionItem.displayConditions?.components?.['title']).toBeUndefined();
        expect(questionItem.disabledConditions?.components?.['question-title']).toBeDefined();
        expect(questionItem.disabledConditions?.components?.['title']).toBeUndefined();
      });
    });

    describe('Single choice response config and options', () => {
      test('should change key of single choice response config component', () => {
        // Add a single choice question
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Get initial response config key
        const initialResponseConfigKey = questionItem.responseConfig.key.fullKey;
        expect(initialResponseConfigKey).toBe('scg');

        // Change response config key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'scg', 'choice-config');

        // Verify response config key is updated
        expect(questionItem.responseConfig.key.fullKey).toBe('choice-config');
        expect(questionItem.responseConfig.key.componentKey).toBe('choice-config');
      });

      test('should change key of single choice option', () => {
        // Add a single choice question with options
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
        const option2 = new ScgMcgOption('option2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
        questionItem.responseConfig.items = [option1, option2];

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Verify initial option key
        expect(option1.key.fullKey).toBe('scg.option1');
        expect(option1.key.componentKey).toBe('option1');

        // Change option key - note: we change the full key in the system, but the component updates its internal componentKey
        editor.onComponentKeyChanged('test-survey.page1.question1', 'scg.option1', 'scg.choice-a');

        // Verify option key is updated
        expect(option1.key.fullKey).toBe('scg.choice-a');
        expect(option1.key.componentKey).toBe('choice-a');
        expect(questionItem.responseConfig.items[0]).toBe(option1);
      });

      test('should update parent component key for options when response config key changes', () => {
        // Add a single choice question with options
        const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
        const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
        const option2 = new ScgMcgOption('option2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
        questionItem.responseConfig.items = [option1, option2];

        const testTranslations = createTestTranslations();
        editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

        // Verify initial option parent keys
        expect(option1.key.parentFullKey).toBe('scg');
        expect(option2.key.parentFullKey).toBe('scg');

        // Change response config key
        editor.onComponentKeyChanged('test-survey.page1.question1', 'scg', 'choice-config');

        // Verify option parent keys are updated
        expect(option1.key.parentFullKey).toBe('choice-config');
        expect(option2.key.parentFullKey).toBe('choice-config');
        expect(option1.key.fullKey).toBe('choice-config.option1');
        expect(option2.key.fullKey).toBe('choice-config.option2');
      });
    });
  });

  describe('Item Editor Level - changeComponentKey', () => {

    test('should change component key through item editor', () => {
      // Add a display item with text component
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const textComponent = new TextComponent('title', undefined, displayItem.key.fullKey);
      displayItem.components = [textComponent];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Create item editor
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);

      // Change component key through item editor
      itemEditor.changeComponentKey('title', 'main-title');

      // Verify component key is updated
      expect(textComponent.key.fullKey).toBe('main-title');
      expect(textComponent.key.componentKey).toBe('main-title');
    });

    test('should change component key in single choice question through question editor', () => {
      // Add a single choice question with title
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const titleComponent = new TextComponent('title', undefined, questionItem.key.fullKey);
      questionItem.header = { title: titleComponent };

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

      // Create question editor
      const questionEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');

      // Change component key through question editor
      questionEditor.changeComponentKey('title', 'question-title');

      // Verify component key is updated
      expect(titleComponent.key.fullKey).toBe('question-title');
      expect(titleComponent.key.componentKey).toBe('question-title');
    });

    test('should change option key through question editor', () => {
      // Add a single choice question with options
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.items = [option1];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

      // Create question editor
      const questionEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');

      // Change option key through question editor
      questionEditor.changeComponentKey('scg.option1', 'scg.choice-a');

      // Verify option key is updated
      expect(option1.key.fullKey).toBe('scg.choice-a');
      expect(option1.key.componentKey).toBe('choice-a');
    });
  });

  describe('Component Editor Level - changeKey', () => {

    test('should change key through DisplayComponentEditor with local key', () => {
      // Add a display item with text component
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const textComponent = new TextComponent('title', undefined, displayItem.key.fullKey);
      displayItem.components = [textComponent];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Create item editor and component editor
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);
      const componentEditor = new DisplayComponentEditor(itemEditor, textComponent);

      // Change key through component editor using local key (default behavior)
      componentEditor.changeKey('main-title');

      // Verify component key is updated
      expect(textComponent.key.fullKey).toBe('main-title');
      expect(textComponent.key.componentKey).toBe('main-title');
    });

    test('should change key through DisplayComponentEditor with full key', () => {
      // Add a display item with text component
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const textComponent = new TextComponent('title', undefined, displayItem.key.fullKey);
      displayItem.components = [textComponent];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Create item editor and component editor
      const itemEditor = new TestSurveyItemEditor(editor, 'test-survey.page1.display1', SurveyItemType.Display);
      const componentEditor = new DisplayComponentEditor(itemEditor, textComponent);

      // Change key through component editor using full key
      componentEditor.changeKey('page-title', true); // isFullKey = true

      // Verify component key is updated
      expect(textComponent.key.fullKey).toBe('page-title');
      expect(textComponent.key.componentKey).toBe('page-title');
    });

    test('should change option key through ScgMcgOptionEditor with local key', () => {
      // Add a single choice question with options
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.items = [option1];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

      // Create question editor and option editor
      const questionEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const optionEditor = new ScgMcgOptionEditor(questionEditor, option1);

      // Change key through option editor using local key (just the component part)
      optionEditor.changeKey('choice-a'); // This should be expanded to 'scg.choice-a'

      // Verify option key is updated
      expect(option1.key.fullKey).toBe('scg.choice-a');
      expect(option1.key.componentKey).toBe('choice-a');
    });

    test('should change option key through ScgMcgOptionEditor with full key', () => {
      // Add a single choice question with options
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.items = [option1];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

      // Create question editor and option editor
      const questionEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const optionEditor = new ScgMcgOptionEditor(questionEditor, option1);

      // Change key through option editor using full key
      optionEditor.changeKey('scg.choice-b', true); // isFullKey = true

      // Verify option key is updated
      expect(option1.key.fullKey).toBe('scg.choice-b');
      expect(option1.key.componentKey).toBe('choice-b');
    });

    test('should change component key and update through entire editor hierarchy', () => {
      // Add a single choice question with title
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');
      const titleComponent = new TextComponent('title', undefined, questionItem.key.fullKey);
      questionItem.header = { title: titleComponent };

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

      // Create editors
      const questionEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const titleEditor = questionEditor.title;

      // Change key through component editor
      titleEditor.changeKey('question-title');

      // Verify component key is updated at all levels
      expect(titleComponent.key.fullKey).toBe('question-title');
      expect(titleComponent.key.componentKey).toBe('question-title');
      expect(questionItem.header?.title).toBe(titleComponent);

      // Verify changes are committed in survey editor
      expect(editor.hasUncommittedChanges).toBe(false);
      expect(editor.canUndo()).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {

    test('should handle component key change when component does not exist', () => {
      // Add a display item without components
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Try to change non-existent component key - should not throw error
      expect(() => {
        editor.onComponentKeyChanged('test-survey.page1.display1', 'non-existent', 'new-key');
      }).not.toThrow();
    });

    test('should handle changing component key to the same key', () => {
      // Add a display item with text component
      const displayItem = new DisplayItem('test-survey.page1.display1');
      const textComponent = new TextComponent('title', undefined, displayItem.key.fullKey);
      displayItem.components = [textComponent];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, displayItem, testTranslations);

      // Change component key to the same key
      editor.onComponentKeyChanged('test-survey.page1.display1', 'title', 'title');

      // Verify component key remains the same
      expect(textComponent.key.fullKey).toBe('title');
      expect(textComponent.key.componentKey).toBe('title');
    });

    test('should handle complex nested component key changes', () => {
      // Add a single choice question with multiple components
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.question1');

      // Add title, subtitle, and footer
      const titleComponent = new TextComponent('title', undefined, questionItem.key.fullKey);
      const subtitleComponent = new TextComponent('subtitle', undefined, questionItem.key.fullKey);
      const footerComponent = new TextComponent('footer', undefined, questionItem.key.fullKey);

      questionItem.header = {
        title: titleComponent,
        subtitle: subtitleComponent
      };
      questionItem.footer = footerComponent;

      // Add options
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const option2 = new ScgMcgOption('option2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.items = [option1, option2];

      const testTranslations = createTestTranslations();
      editor.addItem({ parentKey: 'test-survey.page1' }, questionItem, testTranslations);

      // Change multiple component keys using different methods
      editor.onComponentKeyChanged('test-survey.page1.question1', 'title', 'main-title');
      editor.onComponentKeyChanged('test-survey.page1.question1', 'subtitle', 'sub-title');
      editor.onComponentKeyChanged('test-survey.page1.question1', 'footer', 'question-footer');

      // For options, test both local and full key approaches via component editors
      const questionEditor = new SingleChoiceQuestionEditor(editor, 'test-survey.page1.question1');
      const option1Editor = new ScgMcgOptionEditor(questionEditor, option1);
      const option2Editor = new ScgMcgOptionEditor(questionEditor, option2);

      // Option 1: use local key (default behavior)
      option1Editor.changeKey('choice-a');
      // Option 2: use full key
      option2Editor.changeKey('scg.choice-b', true);

      // Verify all components are updated
      expect(titleComponent.key.fullKey).toBe('main-title');
      expect(subtitleComponent.key.fullKey).toBe('sub-title');
      expect(footerComponent.key.fullKey).toBe('question-footer');
      expect(option1.key.fullKey).toBe('scg.choice-a');
      expect(option2.key.fullKey).toBe('scg.choice-b');
    });
  });
});
