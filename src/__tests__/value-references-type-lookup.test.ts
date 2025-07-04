import { ScgMcgChoiceResponseConfig, ScgMcgOption, ScgMcgOptionBase, ScgMcgOptionWithTextInput } from '../survey/components/survey-item-component';
import { ItemComponentType } from '../survey/components/types';
import { ExpectedValueType } from '../survey/utils';
import { ValueReference, ValueReferenceMethod } from '../survey/utils/value-reference';
import { Survey } from '../survey/survey';
import { SingleChoiceQuestionItem, MultipleChoiceQuestionItem, DisplayItem, GroupItem } from '../survey/items';
import { ResponseVariableExpression } from '../expressions/expression';
import { TemplateDefTypes } from '../expressions/template-value';
import { ReferenceUsageType } from '../survey/utils/value-reference';


describe('ScgMcgChoiceResponseConfig - Value References', () => {
  let singleChoiceConfig: ScgMcgChoiceResponseConfig;

  beforeEach(() => {
    singleChoiceConfig = new ScgMcgChoiceResponseConfig('scg', undefined, 'survey.test-item');
  });

  describe('Basic functionality', () => {
    it('should create ScgMcgChoiceResponseConfig with correct type', () => {
      expect(singleChoiceConfig.componentType).toBe(ItemComponentType.SingleChoice);
      expect(singleChoiceConfig.items).toEqual([]);
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

      singleChoiceConfig.items = [option1, option2];

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

      singleChoiceConfig.items = [basicOption, optionWithInput];

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

      singleChoiceConfig.items = [optionWithInput1, optionWithInput2];

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

      singleChoiceConfig.items = [basicOption1, optionWithInput, basicOption2];

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

      nestedSingleChoice.items = [optionWithInput];

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
      singleChoiceConfig.items = [];

      const valueRefs = singleChoiceConfig.valueReferences;

      expect(valueRefs).toEqual({
        'survey.test-item...get': ExpectedValueType.String,
        'survey.test-item...isDefined': ExpectedValueType.Boolean,
      });
    });

    it('should handle undefined options', () => {
      // Reset options to undefined
      singleChoiceConfig.items = undefined as unknown as ScgMcgOptionBase[];

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

      questionItem.responseConfig.items = [option1, option2];
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

      questionItem.responseConfig.items = [basicOption, optionWithInput];
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
      questionItem1.responseConfig.items = [option1];

      const questionItem2 = new SingleChoiceQuestionItem('test-survey.question2');
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', questionItem2.responseConfig.key.fullKey, questionItem2.key.fullKey);
      questionItem2.responseConfig.items = [optionWithInput];

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

      questionItem.responseConfig.items = [option1, option2];
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
      singleChoice.responseConfig.items = [scOption];

      const multipleChoice = new MultipleChoiceQuestionItem('test-survey.mcq1');
      const mcOptionWithInput = new ScgMcgOptionWithTextInput('optionText', multipleChoice.responseConfig.key.fullKey, multipleChoice.key.fullKey);
      multipleChoice.responseConfig.items = [mcOptionWithInput];

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
      questionItem.responseConfig.items = [optionWithInput];
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
      questionItem.responseConfig.items = [option];

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

      questionItem.responseConfig.items = [basicOption1, optionWithInput1, basicOption2, optionWithInput2];
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
        questionItem.responseConfig.items = [option];
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

describe('Survey - getReferenceUsages', () => {
  let survey: Survey;

  beforeEach(() => {
    survey = new Survey('test-survey');
  });

  describe('Empty and basic survey scenarios', () => {
    it('should return empty array for survey with no items', () => {
      // Create completely empty survey
      const emptySurvey = new Survey('empty');
      emptySurvey.surveyItems = {}; // Remove even the root item

      const usages = emptySurvey.getReferenceUsages();
      expect(usages).toEqual([]);
    });

    it('should return empty array for survey with only root group item', () => {
      const usages = survey.getReferenceUsages();
      expect(usages).toEqual([]);
    });

    it('should return empty array for survey with items that have no references', () => {
      const displayItem = new DisplayItem('test-survey.display1');
      const groupItem = new GroupItem('test-survey.group1');

      survey.surveyItems['test-survey.display1'] = displayItem;
      survey.surveyItems['test-survey.group1'] = groupItem;

      const usages = survey.getReferenceUsages();
      expect(usages).toEqual([]);
    });
  });

  describe('Display conditions', () => {
    it('should return reference usages from display conditions', () => {
      const displayItem = new DisplayItem('test-survey.display1');

      // Add display conditions with response variable references
      displayItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.question1...get'),
        components: {
          'comp1': new ResponseVariableExpression('test-survey.question2...isDefined')
        }
      };

      survey.surveyItems['test-survey.display1'] = displayItem;

      const usages = survey.getReferenceUsages();

      expect(usages).toHaveLength(2);

      // Check root display condition usage
      const rootUsage = usages.find(u => u.fullComponentKey === undefined);
      expect(rootUsage).toBeDefined();
      expect(rootUsage?.fullItemKey).toBe('test-survey.display1');
      expect(rootUsage?.usageType).toBe(ReferenceUsageType.displayConditions);
      expect(rootUsage?.valueReference.toString()).toBe('test-survey.question1...get');

      // Check component display condition usage
      const componentUsage = usages.find(u => u.fullComponentKey === 'comp1');
      expect(componentUsage).toBeDefined();
      expect(componentUsage?.fullItemKey).toBe('test-survey.display1');
      expect(componentUsage?.usageType).toBe(ReferenceUsageType.displayConditions);
      expect(componentUsage?.valueReference.toString()).toBe('test-survey.question2...isDefined');
    });
  });

  describe('Template values', () => {
    it('should return reference usages from template values', () => {
      const displayItem = new DisplayItem('test-survey.display1');

      // Add template values with response variable references
      displayItem.templateValues = {
        'template1': {
          type: TemplateDefTypes.Default,
          returnType: ExpectedValueType.String,
          expression: new ResponseVariableExpression('test-survey.question1...get')
        },
        'template2': {
          type: TemplateDefTypes.Default,
          returnType: ExpectedValueType.Boolean,
          expression: new ResponseVariableExpression('test-survey.question2...isDefined')
        }
      };

      survey.surveyItems['test-survey.display1'] = displayItem;

      const usages = survey.getReferenceUsages();

      expect(usages).toHaveLength(2);

      // Check first template value usage
      const template1Usage = usages.find(u => u.fullComponentKey === 'template1');
      expect(template1Usage).toBeDefined();
      expect(template1Usage?.fullItemKey).toBe('test-survey.display1');
      expect(template1Usage?.usageType).toBe(ReferenceUsageType.templateValues);
      expect(template1Usage?.valueReference.toString()).toBe('test-survey.question1...get');

      // Check second template value usage
      const template2Usage = usages.find(u => u.fullComponentKey === 'template2');
      expect(template2Usage).toBeDefined();
      expect(template2Usage?.fullItemKey).toBe('test-survey.display1');
      expect(template2Usage?.usageType).toBe(ReferenceUsageType.templateValues);
      expect(template2Usage?.valueReference.toString()).toBe('test-survey.question2...isDefined');
    });
  });

  describe('Disabled conditions', () => {
    it('should return reference usages from disabled conditions', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');

      // Add disabled conditions with response variable references
      questionItem.disabledConditions = {
        components: {
          'rg.option1': new ResponseVariableExpression('test-survey.question2...get'),
          'rg.option2': new ResponseVariableExpression('test-survey.question3...isDefined')
        }
      };

      survey.surveyItems['test-survey.question1'] = questionItem;

      const usages = survey.getReferenceUsages();

      expect(usages).toHaveLength(2);

      // Check first disabled condition usage
      const option1Usage = usages.find(u => u.fullComponentKey === 'rg.option1');
      expect(option1Usage).toBeDefined();
      expect(option1Usage?.fullItemKey).toBe('test-survey.question1');
      expect(option1Usage?.usageType).toBe(ReferenceUsageType.disabledConditions);
      expect(option1Usage?.valueReference.toString()).toBe('test-survey.question2...get');

      // Check second disabled condition usage
      const option2Usage = usages.find(u => u.fullComponentKey === 'rg.option2');
      expect(option2Usage).toBeDefined();
      expect(option2Usage?.fullItemKey).toBe('test-survey.question1');
      expect(option2Usage?.usageType).toBe(ReferenceUsageType.disabledConditions);
      expect(option2Usage?.valueReference.toString()).toBe('test-survey.question3...isDefined');
    });
  });

  describe('Validations', () => {
    it('should return reference usages from validations', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');

      // Add validations with response variable references
      questionItem.validations = {
        'validation1': new ResponseVariableExpression('test-survey.question2...get'),
        'validation2': new ResponseVariableExpression('test-survey.question3...isDefined')
      };

      survey.surveyItems['test-survey.question1'] = questionItem;

      const usages = survey.getReferenceUsages();

      expect(usages).toHaveLength(2);

      // Check first validation usage
      const validation1Usage = usages.find(u => u.fullComponentKey === 'validation1');
      expect(validation1Usage).toBeDefined();
      expect(validation1Usage?.fullItemKey).toBe('test-survey.question1');
      expect(validation1Usage?.usageType).toBe(ReferenceUsageType.validations);
      expect(validation1Usage?.valueReference.toString()).toBe('test-survey.question2...get');

      // Check second validation usage
      const validation2Usage = usages.find(u => u.fullComponentKey === 'validation2');
      expect(validation2Usage).toBeDefined();
      expect(validation2Usage?.fullItemKey).toBe('test-survey.question1');
      expect(validation2Usage?.usageType).toBe(ReferenceUsageType.validations);
      expect(validation2Usage?.valueReference.toString()).toBe('test-survey.question3...isDefined');
    });
  });

  describe('Mixed usage types', () => {
    it('should return reference usages from all usage types combined', () => {
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');

      // Add multiple types of references
      questionItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.q1...get')
      };

      questionItem.templateValues = {
        'template1': {
          type: TemplateDefTypes.Default,
          returnType: ExpectedValueType.String,
          expression: new ResponseVariableExpression('test-survey.q2...get')
        }
      };

      questionItem.disabledConditions = {
        components: {
          'rg.option1': new ResponseVariableExpression('test-survey.q3...isDefined')
        }
      };

      questionItem.validations = {
        'validation1': new ResponseVariableExpression('test-survey.q4...get')
      };

      survey.surveyItems['test-survey.question1'] = questionItem;

      const usages = survey.getReferenceUsages();

      expect(usages).toHaveLength(4);

      // Check that all usage types are present
      const usageTypes = usages.map(u => u.usageType);
      expect(usageTypes).toContain(ReferenceUsageType.displayConditions);
      expect(usageTypes).toContain(ReferenceUsageType.templateValues);
      expect(usageTypes).toContain(ReferenceUsageType.disabledConditions);
      expect(usageTypes).toContain(ReferenceUsageType.validations);
    });

    it('should aggregate reference usages from multiple items', () => {
      const displayItem = new DisplayItem('test-survey.display1');
      displayItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.q1...get')
      };

      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      questionItem.validations = {
        'validation1': new ResponseVariableExpression('test-survey.q2...isDefined')
      };

      const groupItem = new GroupItem('test-survey.group1');
      groupItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.q3...get')
      };

      survey.surveyItems['test-survey.display1'] = displayItem;
      survey.surveyItems['test-survey.question1'] = questionItem;
      survey.surveyItems['test-survey.group1'] = groupItem;

      const usages = survey.getReferenceUsages();

      expect(usages).toHaveLength(3);

      // Check that all items contributed their references
      const itemKeys = usages.map(u => u.fullItemKey);
      expect(itemKeys).toContain('test-survey.display1');
      expect(itemKeys).toContain('test-survey.question1');
      expect(itemKeys).toContain('test-survey.group1');
    });
  });

  describe('Filtering by forItemKey', () => {
    beforeEach(() => {
      // Set up survey with multiple items
      const displayItem = new DisplayItem('test-survey.display1');
      displayItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.q1...get')
      };

      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      questionItem.validations = {
        'validation1': new ResponseVariableExpression('test-survey.q2...isDefined')
      };

      const nestedDisplayItem = new DisplayItem('test-survey.group1.display2');
      nestedDisplayItem.templateValues = {
        'template1': {
          type: TemplateDefTypes.Default,
          returnType: ExpectedValueType.String,
          expression: new ResponseVariableExpression('test-survey.q3...get')
        }
      };

      survey.surveyItems['test-survey.display1'] = displayItem;
      survey.surveyItems['test-survey.question1'] = questionItem;
      survey.surveyItems['test-survey.group1.display2'] = nestedDisplayItem;
    });

    it('should return all usages when no forItemKey is provided', () => {
      const usages = survey.getReferenceUsages();
      expect(usages).toHaveLength(3);
    });

    it('should return only usages from specific item when forItemKey matches exactly', () => {
      const usages = survey.getReferenceUsages('test-survey.question1');

      expect(usages).toHaveLength(1);
      expect(usages[0].fullItemKey).toBe('test-survey.question1');
      expect(usages[0].usageType).toBe(ReferenceUsageType.validations);
    });

    it('should return usages from item and its children when forItemKey is a parent', () => {
      const usages = survey.getReferenceUsages('test-survey.group1');

      expect(usages).toHaveLength(1);
      expect(usages[0].fullItemKey).toBe('test-survey.group1.display2');
      expect(usages[0].usageType).toBe(ReferenceUsageType.templateValues);
    });

    it('should return usages from all items under the specified parent key', () => {
      // Add another nested item under group1
      const anotherNestedItem = new DisplayItem('test-survey.group1.display3');
      anotherNestedItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.q4...get')
      };
      survey.surveyItems['test-survey.group1.display3'] = anotherNestedItem;

      const usages = survey.getReferenceUsages('test-survey.group1');

      expect(usages).toHaveLength(2);
      const itemKeys = usages.map(u => u.fullItemKey);
      expect(itemKeys).toContain('test-survey.group1.display2');
      expect(itemKeys).toContain('test-survey.group1.display3');
    });

    it('should return empty array when forItemKey matches no items', () => {
      const usages = survey.getReferenceUsages('test-survey.nonexistent');
      expect(usages).toEqual([]);
    });

    it('should return empty array when forItemKey matches item with no references', () => {
      const emptyItem = new DisplayItem('test-survey.empty');
      survey.surveyItems['test-survey.empty'] = emptyItem;

      const usages = survey.getReferenceUsages('test-survey.empty');
      expect(usages).toEqual([]);
    });
  });
});

describe('Survey - findInvalidReferenceUsages', () => {
  let survey: Survey;

  beforeEach(() => {
    survey = new Survey('test-survey');
  });

  describe('Invalid reference detection', () => {
    it('should return empty array when no invalid references exist', () => {
      // Create a question that generates valid value references
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      const option = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.items = [option];
      survey.surveyItems['test-survey.question1'] = questionItem;

      // Create an item that references the valid value reference
      const displayItem = new DisplayItem('test-survey.display1');
      displayItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.question1...get')
      };
      survey.surveyItems['test-survey.display1'] = displayItem;

      const invalidUsages = survey.findInvalidReferenceUsages();
      expect(invalidUsages).toEqual([]);
    });

    it('should return invalid usages when expressions reference non-existing response value references', () => {
      // Create a question that generates valid value references
      const questionItem = new SingleChoiceQuestionItem('test-survey.question1');
      const option = new ScgMcgOption('option1', questionItem.responseConfig.key.fullKey, questionItem.key.fullKey);
      questionItem.responseConfig.items = [option];
      survey.surveyItems['test-survey.question1'] = questionItem;

      // Create items that reference both valid and invalid value references
      const displayItem = new DisplayItem('test-survey.display1');
      displayItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.question1...get') // Valid reference
      };
      displayItem.templateValues = {
        'template1': {
          type: TemplateDefTypes.Default,
          returnType: ExpectedValueType.String,
          expression: new ResponseVariableExpression('test-survey.nonexistent...get') // Invalid reference
        }
      };
      survey.surveyItems['test-survey.display1'] = displayItem;

      const questionItem2 = new SingleChoiceQuestionItem('test-survey.question2');
      questionItem2.validations = {
        'validation1': new ResponseVariableExpression('test-survey.question1...isDefined'), // Valid reference
        'validation2': new ResponseVariableExpression('test-survey.another-nonexistent...isDefined') // Invalid reference
      };
      survey.surveyItems['test-survey.question2'] = questionItem2;

      const invalidUsages = survey.findInvalidReferenceUsages();

      expect(invalidUsages).toHaveLength(2);

      // Check first invalid usage (from display item template values)
      const templateInvalidUsage = invalidUsages.find(u =>
        u.fullItemKey === 'test-survey.display1' &&
        u.fullComponentKey === 'template1' &&
        u.usageType === ReferenceUsageType.templateValues
      );
      expect(templateInvalidUsage).toBeDefined();
      expect(templateInvalidUsage?.valueReference.toString()).toBe('test-survey.nonexistent...get');

      // Check second invalid usage (from question validation)
      const validationInvalidUsage = invalidUsages.find(u =>
        u.fullItemKey === 'test-survey.question2' &&
        u.fullComponentKey === 'validation2' &&
        u.usageType === ReferenceUsageType.validations
      );
      expect(validationInvalidUsage).toBeDefined();
      expect(validationInvalidUsage?.valueReference.toString()).toBe('test-survey.another-nonexistent...isDefined');
    });

    it('should handle mixed scenarios with valid and invalid references across multiple usage types', () => {
      // Create questions that generate valid value references
      const questionItem1 = new SingleChoiceQuestionItem('test-survey.question1');
      const option1 = new ScgMcgOption('option1', questionItem1.responseConfig.key.fullKey, questionItem1.key.fullKey);
      questionItem1.responseConfig.items = [option1];
      survey.surveyItems['test-survey.question1'] = questionItem1;

      const questionItem2 = new SingleChoiceQuestionItem('test-survey.question2');
      const optionWithInput = new ScgMcgOptionWithTextInput('optionText', questionItem2.responseConfig.key.fullKey, questionItem2.key.fullKey);
      questionItem2.responseConfig.items = [optionWithInput];
      survey.surveyItems['test-survey.question2'] = questionItem2;

      // Create an item with multiple types of references (valid and invalid)
      const complexItem = new SingleChoiceQuestionItem('test-survey.complex');

      // Valid references
      complexItem.displayConditions = {
        root: new ResponseVariableExpression('test-survey.question1...get') // Valid
      };

      // Mix of valid and invalid references
      complexItem.templateValues = {
        'validTemplate': {
          type: TemplateDefTypes.Default,
          returnType: ExpectedValueType.String,
          expression: new ResponseVariableExpression('test-survey.question2...isDefined') // Valid
        },
        'invalidTemplate': {
          type: TemplateDefTypes.Default,
          returnType: ExpectedValueType.String,
          expression: new ResponseVariableExpression('test-survey.missing-question...get') // Invalid
        }
      };

      complexItem.disabledConditions = {
        components: {
          'rg.option1': new ResponseVariableExpression('test-survey.question1...isDefined'), // Valid
          'rg.option2': new ResponseVariableExpression('test-survey.ghost-question...get') // Invalid
        }
      };

      complexItem.validations = {
        'validValidation': new ResponseVariableExpression('test-survey.question2...get...scg.optionText'), // Valid reference to option with text input
        'invalidValidation': new ResponseVariableExpression('test-survey.void-question...isDefined') // Invalid
      };

      survey.surveyItems['test-survey.complex'] = complexItem;

      const invalidUsages = survey.findInvalidReferenceUsages();

      expect(invalidUsages).toHaveLength(3);

      // Should only contain the invalid references
      const invalidRefs = invalidUsages.map(u => u.valueReference.toString());
      expect(invalidRefs).toContain('test-survey.missing-question...get');
      expect(invalidRefs).toContain('test-survey.ghost-question...get');
      expect(invalidRefs).toContain('test-survey.void-question...isDefined');

      // Should not contain valid references
      expect(invalidRefs).not.toContain('test-survey.question1...get');
      expect(invalidRefs).not.toContain('test-survey.question1...isDefined');
      expect(invalidRefs).not.toContain('test-survey.question2...isDefined');
      expect(invalidRefs).not.toContain('test-survey.question2...get...scg.optionText');

      // Verify each invalid usage has the correct metadata
      const templateInvalid = invalidUsages.find(u => u.fullComponentKey === 'invalidTemplate');
      expect(templateInvalid?.usageType).toBe(ReferenceUsageType.templateValues);
      expect(templateInvalid?.fullItemKey).toBe('test-survey.complex');

      const disabledInvalid = invalidUsages.find(u => u.fullComponentKey === 'rg.option2');
      expect(disabledInvalid?.usageType).toBe(ReferenceUsageType.disabledConditions);
      expect(disabledInvalid?.fullItemKey).toBe('test-survey.complex');

      const validationInvalid = invalidUsages.find(u => u.fullComponentKey === 'invalidValidation');
      expect(validationInvalid?.usageType).toBe(ReferenceUsageType.validations);
      expect(validationInvalid?.fullItemKey).toBe('test-survey.complex');
    });

    it('should return empty array when survey has no items with expressions', () => {
      // Create a survey with only display items that have no expressions
      const displayItem = new DisplayItem('test-survey.display1');
      survey.surveyItems['test-survey.display1'] = displayItem;

      const invalidUsages = survey.findInvalidReferenceUsages();
      expect(invalidUsages).toEqual([]);
    });
  });
});
