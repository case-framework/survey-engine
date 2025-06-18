import { ScgMcgChoiceResponseConfig, ScgMcgOption, ScgMcgOptionBase, ScgMcgOptionWithTextInput } from '../survey/components/survey-item-component';
import { ItemComponentType } from '../survey/components/types';
import { ExpectedValueType } from '../survey/utils';
import { ValueReference, ValueReferenceMethod } from '../survey/utils/value-reference';
import { Survey } from '../survey/survey';
import { SingleChoiceQuestionItem, MultipleChoiceQuestionItem, DisplayItem, GroupItem } from '../survey/items';


describe('ScgMcgChoiceResponseConfig - Value References', () => {
  let singleChoiceConfig: ScgMcgChoiceResponseConfig;

  beforeEach(() => {
    singleChoiceConfig = new ScgMcgChoiceResponseConfig('scg', undefined, 'survey.test-item');
  });

  describe('Basic functionality', () => {
    it('should create ScgMcgChoiceResponseConfig with correct type', () => {
      expect(singleChoiceConfig.componentType).toBe(ItemComponentType.SingleChoice);
      expect(singleChoiceConfig.options).toEqual([]);
    });

    it('should initialize with default value references when no options', () => {
      const valueRefs = singleChoiceConfig.valueReferences;
      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
      });
    });
  });

  describe('ScgMcgOption value references', () => {
    it('should return default value references for basic options', () => {
      const option1 = new ScgMcgOption('option1', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);
      const option2 = new ScgMcgOption('option2', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);

      singleChoiceConfig.options = [option1, option2];

      const valueRefs = singleChoiceConfig.valueReferences;
      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
      });
    });

    it('should return empty value references for single basic option', () => {
      const option = new ScgMcgOption('option1', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);

      expect(option.valueReferences).toEqual({});
    });
  });

  describe('ScgMcgOptionWithTextInput value references', () => {
    it('should return correct value references for option with text input', () => {
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);

      const valueRefs = optionWithInput.valueReferences;

      // Expected value references for an option with text input
      const expectedGetRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.get,
        optionWithInput.key
      ).toString();

      const expectedIsDefinedRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.isDefined,
        optionWithInput.key
      ).toString();

      expect(valueRefs).toEqual({
        [expectedGetRef]: ExpectedValueType.String,
        [expectedIsDefinedRef]: ExpectedValueType.Boolean,
      });
    });

    it('should aggregate value references from option with text input in choice config', () => {
      const basicOption = new ScgMcgOption('option1', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);

      singleChoiceConfig.options = [basicOption, optionWithInput];

      const valueRefs = singleChoiceConfig.valueReferences;

      // Should only contain references from the option with text input
      const expectedGetRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.get,
        optionWithInput.key
      ).toString();

      const expectedIsDefinedRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.isDefined,
        optionWithInput.key
      ).toString();

      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
        [expectedGetRef]: ExpectedValueType.String,
        [expectedIsDefinedRef]: ExpectedValueType.Boolean,
      });
    });

    it('should aggregate value references from multiple options with text input', () => {
      const optionWithInput1 = new ScgMcgOptionWithTextInput('optionText1', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);
      const optionWithInput2 = new ScgMcgOptionWithTextInput('optionText2', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);

      singleChoiceConfig.options = [optionWithInput1, optionWithInput2];

      const valueRefs = singleChoiceConfig.valueReferences;

      // Expected references for first option
      const expectedGetRef1 = ValueReference.fromParts(
        optionWithInput1.key.parentItemKey,
        ValueReferenceMethod.get,
        optionWithInput1.key
      ).toString();

      const expectedIsDefinedRef1 = ValueReference.fromParts(
        optionWithInput1.key.parentItemKey,
        ValueReferenceMethod.isDefined,
        optionWithInput1.key
      ).toString();

      // Expected references for second option
      const expectedGetRef2 = ValueReference.fromParts(
        optionWithInput2.key.parentItemKey,
        ValueReferenceMethod.get,
        optionWithInput2.key
      ).toString();

      const expectedIsDefinedRef2 = ValueReference.fromParts(
        optionWithInput2.key.parentItemKey,
        ValueReferenceMethod.isDefined,
        optionWithInput2.key
      ).toString();

      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
        [expectedGetRef1]: ExpectedValueType.String,
        [expectedIsDefinedRef1]: ExpectedValueType.Boolean,
        [expectedGetRef2]: ExpectedValueType.String,
        [expectedIsDefinedRef2]: ExpectedValueType.Boolean,
      });
    });
  });

  describe('Mixed options value references', () => {
    it('should correctly aggregate value references from mixed option types', () => {
      const basicOption1 = new ScgMcgOption('option1', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);
      const basicOption2 = new ScgMcgOption('option2', singleChoiceConfig.key.fullKey, singleChoiceConfig.key.parentItemKey.fullKey);

      singleChoiceConfig.options = [basicOption1, optionWithInput, basicOption2];

      const valueRefs = singleChoiceConfig.valueReferences;

      // Should only contain references from the option with text input
      const expectedGetRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.get,
        optionWithInput.key
      ).toString();

      const expectedIsDefinedRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.isDefined,
        optionWithInput.key
      ).toString();

      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
        [expectedGetRef]: ExpectedValueType.String,
        [expectedIsDefinedRef]: ExpectedValueType.Boolean,
      });
    });
  });

  describe('Value reference format validation', () => {
    it('should generate correctly formatted value reference strings', () => {
      const optionWithInput = new ScgMcgOptionWithTextInput('myOption', singleChoiceConfig.key.fullKey, 'survey.question1');

      const valueRefs = optionWithInput.valueReferences;
      const refKeys = Object.keys(valueRefs);

      expect(refKeys).toHaveLength(2);

      // Check that the references follow the expected format (using ... as separator)
      const getRef = refKeys.find(key => key.includes('...get...'));
      const isDefinedRef = refKeys.find(key => key.includes('...isDefined...'));

      expect(getRef).toBeDefined();
      expect(isDefinedRef).toBeDefined();

      // Verify the format includes the item key and component key
      expect(getRef).toContain('survey.question1');
      expect(getRef).toContain('scg.myOption');
      expect(isDefinedRef).toContain('survey.question1');
      expect(isDefinedRef).toContain('scg.myOption');
    });
  });

  describe('Edge cases', () => {
    it('should handle deeply nested component keys', () => {
      const nestedSingleChoice = new ScgMcgChoiceResponseConfig('scg', 'parent.component', 'survey.page1.question1');
      const optionWithInput = new ScgMcgOptionWithTextInput('option1', nestedSingleChoice.key.fullKey, nestedSingleChoice.key.parentItemKey.fullKey);

      nestedSingleChoice.options = [optionWithInput];

      const valueRefs = nestedSingleChoice.valueReferences;

      expect(Object.keys(valueRefs)).toHaveLength(4);

      // Verify that nested keys are handled correctly
      const refKeys = Object.keys(valueRefs);
      refKeys.forEach(key => {
        const valRef = new ValueReference(key);
        if (valRef.slotKey !== undefined) {
          expect(key).toContain('survey.page1.question1');
          expect(key).toContain('parent.component.scg.option1');
        }
      });
    });

    it('should handle empty options array', () => {
      singleChoiceConfig.options = [];

      const valueRefs = singleChoiceConfig.valueReferences;

      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
      });
    });

    it('should handle undefined options', () => {
      // Reset options to undefined
      singleChoiceConfig.options = undefined as unknown as ScgMcgOptionBase[];

      const valueRefs = singleChoiceConfig.valueReferences;

      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
      });
    });
  });
});

describe('Survey - getResponseValueReferences', () => {
  let survey: Survey;

  beforeEach(() => {
    survey = new Survey('test-survey');
  });

  describe('Empty and non-question items', () => {
    it('should return empty object for survey with no items', () => {
      // Create completely empty survey
      const emptySurvey = new Survey('empty');
      emptySurvey.surveyItems = {}; // Remove even the root item

      const valueRefs = emptySurvey.getResponseValueReferences();
      expect(valueRefs).toEqual({});
    });

    it('should return empty object for survey with only root group item', () => {
      const valueRefs = survey.getResponseValueReferences();
      expect(valueRefs).toEqual({});
    });

    it('should return empty object for survey with only display items', () => {
      const displayItem = new DisplayItem('test-survey.display1');
      survey.surveyItems['test-survey.display1'] = displayItem;

      const valueRefs = survey.getResponseValueReferences();
      expect(valueRefs).toEqual({});
    });

    it('should return empty object for survey with only group items', () => {
      const groupItem = new GroupItem('test-survey.group1');
      survey.surveyItems['test-survey.group1'] = groupItem;

      const valueRefs = survey.getResponseValueReferences();
      expect(valueRefs).toEqual({});
    });
  });

  describe('Single choice questions', () => {
    it('should return value references for single choice with basic options', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const option2 = new ScgMcgOption('option2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);

      questionItem.responseConfig.options = [option1, option2];
      survey.surveyItems['test-survey.question1'] = questionItem;

      const valueRefs = survey.getResponseValueReferences();

      // Single choice should have its own references (get and isDefined for the main response)
      const expectedGetRef = ValueReference.fromParts(
        questionItem.key,
        ValueReferenceMethod.get
      ).toString();

      const expectedIsDefinedRef = ValueReference.fromParts(
        questionItem.key,
        ValueReferenceMethod.isDefined
      ).toString();

      expect(valueRefs).toEqual({
        [expectedGetRef]: ExpectedValueType.String,
        [expectedIsDefinedRef]: ExpectedValueType.Boolean,
      });
    });

    it('should return value references for single choice with text input options', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      const basicOption = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);

      questionItem.responseConfig.options = [basicOption, optionWithInput];
      survey.surveyItems['test-survey.question1'] = questionItem;

      const valueRefs = survey.getResponseValueReferences();

      // Should include main response references and option with text input references
      const expectedMainGetRef = ValueReference.fromParts(
        questionItem.key,
        ValueReferenceMethod.get
      ).toString();

      const expectedMainIsDefinedRef = ValueReference.fromParts(
        questionItem.key,
        ValueReferenceMethod.isDefined
      ).toString();

      const expectedOptionGetRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.get,
        optionWithInput.key
      ).toString();

      const expectedOptionIsDefinedRef = ValueReference.fromParts(
        optionWithInput.key.parentItemKey,
        ValueReferenceMethod.isDefined,
        optionWithInput.key
      ).toString();

      expect(valueRefs).toEqual({
        [expectedMainGetRef]: ExpectedValueType.String,
        [expectedMainIsDefinedRef]: ExpectedValueType.Boolean,
        [expectedOptionGetRef]: ExpectedValueType.String,
        [expectedOptionIsDefinedRef]: ExpectedValueType.Boolean,
      });
    });

    it('should return value references for multiple single choice questions', () => {
      const questionItem1 = new SingleChoiceQuestionItem('test-survey.question1');
      const option1 = new ScgMcgOption('option1', questionItem1.responseConfig.key.fullKey, questionItem1.key.fullKey);
      questionItem1.responseConfig.options = [option1];

      const questionItem2 = new SingleChoiceQuestionItem('test-survey.question2');
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', questionItem2.responseConfig.key.fullKey, questionItem2.key.fullKey);
      questionItem2.responseConfig.options = [optionWithInput];

      survey.surveyItems['test-survey.question1'] = questionItem1;
      survey.surveyItems['test-survey.question2'] = questionItem2;

      const valueRefs = survey.getResponseValueReferences();

      expect(Object.keys(valueRefs)).toHaveLength(6); // 2 refs per question1, 4 refs for question2

      // Verify all questions contribute their references
      const refKeys = Object.keys(valueRefs);
      expect(refKeys.some(key => key.includes('test-survey.question1'))).toBe(true);
      expect(refKeys.some(key => key.includes('test-survey.question2'))).toBe(true);
    });
  });

  describe('Multiple choice questions', () => {
    it('should return value references for multiple choice with basic options', () => {
      const questionItem = new MultipleChoiceQuestionItem('test-survey.mcq1');
      const option1 = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const option2 = new ScgMcgOption('option2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);

      questionItem.responseConfig.options = [option1, option2];
      survey.surveyItems['test-survey.mcq1'] = questionItem;

      const valueRefs = survey.getResponseValueReferences();

      // Multiple choice should have its own references
      expect(Object.keys(valueRefs)).toHaveLength(2);

      const refKeys = Object.keys(valueRefs);
      expect(refKeys.some(key => key.includes('test-survey.mcq1'))).toBe(true);
      expect(refKeys.some(key => key.includes('get'))).toBe(true);
      expect(refKeys.some(key => key.includes('isDefined'))).toBe(true);
    });
  });

  describe('Mixed question types', () => {
    it('should aggregate value references from mixed question types', () => {
      const singleChoice = new SingleChoiceQuestionItem('test-survey.scq1');
      const scOption = new ScgMcgOption('option1', singleChoice.responseConfig.key.fullKey, singleChoice.key.fullKey);
      singleChoice.responseConfig.options = [scOption];

      const multipleChoice = new MultipleChoiceQuestionItem('test-survey.mcq1');
      const mcOptionWithInput = new ScgMcgOptionWithTextInput('optionText', multipleChoice.responseConfig.key.fullKey, multipleChoice.key.fullKey);
      multipleChoice.responseConfig.options = [mcOptionWithInput];

      const displayItem = new DisplayItem('test-survey.display1'); // Should be ignored

      survey.surveyItems['test-survey.scq1'] = singleChoice;
      survey.surveyItems['test-survey.mcq1'] = multipleChoice;
      survey.surveyItems['test-survey.display1'] = displayItem;

      const valueRefs = survey.getResponseValueReferences();

      // Should have references from both question types but not display item
      expect(Object.keys(valueRefs).length).toBe(6);

      const refKeys = Object.keys(valueRefs);
      expect(refKeys.some(key => key.includes('test-survey.scq1'))).toBe(true);
      expect(refKeys.some(key => key.includes('test-survey.mcq1'))).toBe(true);
      expect(refKeys.some(key => key.includes('test-survey.display1'))).toBe(false);
    });
  });

  describe('Filtering by ExpectedValueType', () => {
    beforeEach(() => {
      // Set up survey with mixed value reference types
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.options = [optionWithInput];
      survey.surveyItems['test-survey.question1'] = questionItem;
    });

    it('should return only String type value references when filtered by String', () => {
      const valueRefs = survey.getResponseValueReferences(ExpectedValueType.String);

      // All returned references should be String type
      Object.values(valueRefs).forEach(type => {
        expect(type).toBe(ExpectedValueType.String);
      });

      // Should have at least some String references
      expect(Object.keys(valueRefs).length).toBe(2);
    });

    it('should return only Boolean type value references when filtered by Boolean', () => {
      const valueRefs = survey.getResponseValueReferences(ExpectedValueType.Boolean);

      // All returned references should be Boolean type
      Object.values(valueRefs).forEach(type => {
        expect(type).toBe(ExpectedValueType.Boolean);
      });

      // Should have at least some Boolean references
      expect(Object.keys(valueRefs).length).toBe(2);
    });

    it('should return empty object when filtered by type with no matches', () => {
      const valueRefs = survey.getResponseValueReferences(ExpectedValueType.Number);
      expect(valueRefs).toEqual({});
    });

    it('should return all value references when no type filter is provided', () => {
      const allValueRefs = survey.getResponseValueReferences();
      const stringRefs = survey.getResponseValueReferences(ExpectedValueType.String);
      const booleanRefs = survey.getResponseValueReferences(ExpectedValueType.Boolean);

      // All refs should equal the sum of filtered refs
      expect(Object.keys(allValueRefs).length).toBe(
        Object.keys(stringRefs).length + Object.keys(booleanRefs).length
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle question items with undefined response config', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      // Artificially remove response config to test edge case
      (questionItem as unknown as { responseConfig: undefined }).responseConfig = undefined;

      survey.surveyItems['test-survey.question1'] = questionItem;

      const valueRefs = survey.getResponseValueReferences();
      expect(valueRefs).toEqual({});
    });

    it('should handle question items with null response config', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      // Artificially set response config to null to test edge case
      (questionItem as unknown as { responseConfig: null }).responseConfig = null;

      survey.surveyItems['test-survey.question1'] = questionItem;

      const valueRefs = survey.getResponseValueReferences();
      expect(valueRefs).toEqual({});
    });

    it('should handle deeply nested question items', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.page1.section1.question1');
      const option = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.options = [option];

      survey.surveyItems['test-survey.page1.section1.question1'] = questionItem;

      const valueRefs = survey.getResponseValueReferences();

      expect(Object.keys(valueRefs).length).toBeGreaterThan(0);
      const refKeys = Object.keys(valueRefs);
      expect(refKeys.some(key => key.includes('test-survey.page1.section1.question1'))).toBe(true);
    });

    it('should maintain reference integrity with complex option structures', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      const basicOption1 = new ScgMcgOption('basic1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const optionWithInput1 = new ScgMcgOptionWithTextInput('text1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const basicOption2 = new ScgMcgOption('basic2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      const optionWithInput2 = new ScgMcgOptionWithTextInput('text2', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);

      questionItem.responseConfig.options = [basicOption1, optionWithInput1, basicOption2, optionWithInput2];
      survey.surveyItems['test-survey.question1'] = questionItem;

      const valueRefs = survey.getResponseValueReferences();

      // Should have main question references + 2 sets of option with text input references
      expect(Object.keys(valueRefs).length).toBe(6); // 2 main + 2*2 option text inputs

      const stringRefs = survey.getResponseValueReferences(ExpectedValueType.String);
      const booleanRefs = survey.getResponseValueReferences(ExpectedValueType.Boolean);

      expect(Object.keys(stringRefs).length).toBe(3); // 1 main + 2 option text inputs
      expect(Object.keys(booleanRefs).length).toBe(3); // 1 main + 2 option text inputs
    });

    it('should handle survey with very large number of questions', () => {
      // Create many questions to test performance and correctness
      for (let i = 1; i <= 100; i++) {
        const questionItem = new SingleChoiceQuestionItem(`test-survey.question${i}`);
        const option = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
        questionItem.responseConfig.options = [option];
        survey.surveyItems[`test-survey.question${i}`] = questionItem;
      }

      const valueRefs = survey.getResponseValueReferences();

      // Should have 2 references per question (get and isDefined)
      expect(Object.keys(valueRefs).length).toBe(200);

      // Test filtering still works with many items
      const stringRefs = survey.getResponseValueReferences(ExpectedValueType.String);
      const booleanRefs = survey.getResponseValueReferences(ExpectedValueType.Boolean);

      expect(Object.keys(stringRefs).length).toBe(100);
      expect(Object.keys(booleanRefs).length).toBe(100);
    });
  });
});
