import { ScgMcgChoiceResponseConfig, ScgMcgOption, ScgMcgOptionBase, ScgMcgOptionWithTextInput } from '../survey/components/survey-item-component';
import { ItemComponentType } from '../survey/components/types';
import { ExpectedValueType } from '../survey/utils';
import { ValueReference, ValueReferenceMethod } from '../survey/utils/value-reference';

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
