import { CURRENT_SURVEY_SCHEMA, DisplayItem, GroupItem, ItemComponentType, JsonSurvey, JsonSurveyCardProps, Survey, SurveyItemType, SingleChoiceQuestionItem, DynamicValueTypes, ValidationType, JsonSurveyItemGroup, JsonSurveyDisplayItem, JsonSurveyResponseItem, JsonSurveyEndItem } from "../data_types";
import { LocalizedContentType } from "../data_types/localized-content";

const surveyCardProps: JsonSurveyCardProps = {
  name: {
    type: LocalizedContentType.CQM,
    content: 'Survey Name',
    attributions: []
  },
  description: {
    type: LocalizedContentType.md,
    content: 'Survey Description',
  },
  typicalDuration: {
    type: LocalizedContentType.CQM,
    content: 'Survey Instructions',
    attributions: []
  }
}

const surveyJson: JsonSurvey = {
  $schema: CURRENT_SURVEY_SCHEMA,
  surveyItems: {
    survey: {
      itemType: SurveyItemType.Group,
      items: [
        'survey.group1',
        'survey.pageBreak1',
        'survey.surveyEnd1'
      ]
    },
    'survey.group1': {
      itemType: SurveyItemType.Group,
      items: [
        'survey.group1.display1'
      ]
    },
    'survey.group1.display1': {
      itemType: SurveyItemType.Display,
      components: [
        {
          key: 'comp1',
          type: ItemComponentType.Display,
          styles: {}
        }
      ]
    },
    'survey.pageBreak1': {
      itemType: SurveyItemType.PageBreak,
    },
    'survey.surveyEnd1': {
      itemType: SurveyItemType.SurveyEnd,
    },
  },
  translations: {
    en: {
      surveyCardProps: surveyCardProps,
      'survey.group1.display1': {
        'comp1': {
          type: LocalizedContentType.CQM,
          content: 'Question 1',
          attributions: []
        }
      }
    }
  }
}

const surveyJsonWithConditionsAndValidations: JsonSurvey = {
  $schema: CURRENT_SURVEY_SCHEMA,
  surveyItems: {
    survey: {
      itemType: SurveyItemType.Group,
      items: [
        'survey.group1',
        'survey.question1',
        'survey.surveyEnd1'
      ]
    },
    'survey.group1': {
      itemType: SurveyItemType.Group,
      items: [
        'survey.group1.display1'
      ],
      displayConditions: {
        root: {
          name: 'eq',
          data: [
            { str: 'test' },
            { str: 'value' }
          ]
        }
      }
    },
    'survey.group1.display1': {
      itemType: SurveyItemType.Display,
      components: [
        {
          key: 'comp1',
          type: ItemComponentType.Display,
          styles: {}
        }
      ],
      displayConditions: {
        components: {
          'comp1': {
            name: 'gt',
            data: [
              { num: 10 },
              { num: 5 }
            ]
          }
        }
      },
      dynamicValues: {
        'dynVal1': {
          type: DynamicValueTypes.Expression,
          expression: {
            name: 'getAttribute',
            data: [
              { dtype: 'exp', exp: { name: 'getContext' } },
              { str: 'userId' }
            ]
          }
        }
      }
    },
    'survey.question1': {
      itemType: SurveyItemType.SingleChoiceQuestion,
      responseConfig: {
        key: 'rg',
        type: ItemComponentType.SingleChoice,
        items: [
          {
            key: 'option1',
            type: ItemComponentType.ScgMcgOption,
            styles: {}
          },
          {
            key: 'option2',
            type: ItemComponentType.ScgMcgOption,
            styles: {}
          }
        ],
        styles: {}
      },
      validations: {
        'val1': {
          key: 'val1',
          type: ValidationType.Hard,
          rule: {
            name: 'isDefined',
            data: [
              { dtype: 'exp', exp: { name: 'getResponseItem', data: [{ str: 'survey.question1' }, { str: 'rg' }] } }
            ]
          }
        },
        'val2': {
          key: 'val2',
          type: ValidationType.Soft,
          rule: {
            name: 'not',
            data: [
              { dtype: 'exp', exp: { name: 'eq', data: [{ str: 'option1' }, { str: 'option2' }] } }
            ]
          }
        }
      },
      displayConditions: {
        root: {
          name: 'and',
          data: [
            { dtype: 'exp', exp: { name: 'eq', data: [{ str: 'show' }, { str: 'show' }] } },
            { dtype: 'exp', exp: { name: 'gt', data: [{ num: 15 }, { num: 10 }] } }
          ]
        },
        components: {
          'rg.option1': {
            name: 'lt',
            data: [
              { num: 5 },
              { num: 10 }
            ]
          }
        }
      },
      disabledConditions: {
        components: {
          'rg.option2': {
            name: 'or',
            data: [
              { dtype: 'exp', exp: { name: 'eq', data: [{ str: 'disabled' }, { str: 'disabled' }] } },
              { dtype: 'exp', exp: { name: 'gte', data: [{ num: 20 }, { num: 15 }] } }
            ]
          }
        }
      }
    },
    'survey.surveyEnd1': {
      itemType: SurveyItemType.SurveyEnd,
    },
  },
  translations: {
    en: {
      surveyCardProps: surveyCardProps,
      'survey.group1.display1': {
        'comp1': {
          type: LocalizedContentType.CQM,
          content: 'Display Component',
          attributions: []
        }
      },
      'survey.question1': {
        'title': {
          type: LocalizedContentType.CQM,
          content: 'Single Choice Question',
          attributions: []
        },
        'rg.option1': {
          type: LocalizedContentType.CQM,
          content: 'Option 1',
          attributions: []
        },
        'rg.option2': {
          type: LocalizedContentType.CQM,
          content: 'Option 2',
          attributions: []
        }
      }
    }
  }
}

describe('Data Parsing', () => {
  describe('Read Survey from JSON', () => {
    test('should throw error if schema is not supported', () => {
      const surveyJson = {
        $schema: CURRENT_SURVEY_SCHEMA + '1',
        surveyItems: {
          survey: {
            itemType: SurveyItemType.Group,
            items: []
          }
        }
      }
      expect(() => Survey.fromJson(surveyJson)).toThrow('Unsupported survey schema');
    });

    test('should throw error if survey definition is not present', () => {
      const surveyJson = {
        $schema: CURRENT_SURVEY_SCHEMA,
      }
      expect(() => Survey.fromJson(surveyJson)).toThrow('surveyItems is required');
    });


    test('should parse survey definition', () => {
      const survey = Survey.fromJson(surveyJson);
      expect(survey.surveyItems).toBeDefined();
      const rootItem = survey.surveyItems['survey'] as GroupItem;
      expect(rootItem).toBeDefined();
      expect(rootItem.itemType).toBe(SurveyItemType.Group);
      expect(rootItem.items).toBeDefined();
      expect(rootItem.items?.length).toBeGreaterThan(0);
      expect(rootItem.items?.[0]).toBe('survey.group1');

      // Group1 item
      const group1Key = rootItem.items?.[0] as string;
      const group1Item = survey.surveyItems[group1Key] as GroupItem;
      expect(group1Item).toBeDefined();
      expect(group1Item.key.itemKey).toBe('group1');
      expect(group1Item.key.fullKey).toBe(group1Key);
      expect(group1Item.itemType).toBe(SurveyItemType.Group);
      expect(group1Item.items).toBeDefined();
      expect(group1Item.items?.length).toBeGreaterThan(0);
      expect(group1Item.items?.[0]).toBe('survey.group1.display1');

      // Display item
      const display1Key = group1Item.items?.[0] as string;
      const displayItem = survey.surveyItems[display1Key] as DisplayItem;
      expect(displayItem).toBeDefined();
      expect(displayItem.key.fullKey).toBe('survey.group1.display1');
      expect(displayItem.itemType).toBe(SurveyItemType.Display);
      expect(displayItem.components).toBeDefined();
      expect(displayItem.components?.length).toBeGreaterThan(0);
      expect(displayItem.components?.[0]?.key.fullKey).toBe('comp1');
      expect(displayItem.components?.[0]?.key.parentItemKey.fullKey).toBe('survey.group1.display1');
      expect(displayItem.components?.[0]?.componentType).toBe(ItemComponentType.Display);
    });

    test('should parse displayConditions, validations, and disabled conditions correctly', () => {
      const survey = Survey.fromJson(surveyJsonWithConditionsAndValidations);
      expect(survey.surveyItems).toBeDefined();

      // Test Group with root display condition
      const group1Item = survey.surveyItems['survey.group1'] as GroupItem;
      expect(group1Item).toBeDefined();
      expect(group1Item.displayConditions).toBeDefined();
      expect(group1Item.displayConditions?.root).toBeDefined();
      expect(group1Item.displayConditions?.root?.name).toBe('eq');
      expect(group1Item.displayConditions?.root?.data).toHaveLength(2);
      expect(group1Item.displayConditions?.root?.data?.[0]).toEqual({ str: 'test' });
      expect(group1Item.displayConditions?.root?.data?.[1]).toEqual({ str: 'value' });

      // Test Display item with component display conditions and dynamic values
      const displayItem = survey.surveyItems['survey.group1.display1'] as DisplayItem;
      expect(displayItem).toBeDefined();
      expect(displayItem.displayConditions).toBeDefined();
      expect(displayItem.displayConditions?.components).toBeDefined();
      expect(displayItem.displayConditions?.components?.['comp1']).toBeDefined();
      expect(displayItem.displayConditions?.components?.['comp1']?.name).toBe('gt');
      expect(displayItem.displayConditions?.components?.['comp1']?.data).toHaveLength(2);
      expect(displayItem.displayConditions?.components?.['comp1']?.data?.[0]).toEqual({ num: 10 });
      expect(displayItem.displayConditions?.components?.['comp1']?.data?.[1]).toEqual({ num: 5 });

      // Test dynamic values
      expect(displayItem.dynamicValues).toBeDefined();
      expect(displayItem.dynamicValues?.['dynVal1']).toBeDefined();
      expect(displayItem.dynamicValues?.['dynVal1']?.type).toBe(DynamicValueTypes.Expression);
      expect(displayItem.dynamicValues?.['dynVal1']?.expression).toBeDefined();
      expect(displayItem.dynamicValues?.['dynVal1']?.expression?.name).toBe('getAttribute');

      // Test Single Choice Question with validations, display conditions, and disabled conditions
      const questionItem = survey.surveyItems['survey.question1'] as SingleChoiceQuestionItem;
      expect(questionItem).toBeDefined();
      expect(questionItem.itemType).toBe(SurveyItemType.SingleChoiceQuestion);

      // Test validations
      expect(questionItem.validations).toBeDefined();
      expect(Object.keys(questionItem.validations || {})).toHaveLength(2);

      expect(questionItem.validations?.['val1']).toBeDefined();
      expect(questionItem.validations?.['val1']?.key).toBe('val1');
      expect(questionItem.validations?.['val1']?.type).toBe(ValidationType.Hard);
      expect(questionItem.validations?.['val1']?.rule).toBeDefined();
      expect(questionItem.validations?.['val1']?.rule?.name).toBe('isDefined');

      expect(questionItem.validations?.['val2']).toBeDefined();
      expect(questionItem.validations?.['val2']?.key).toBe('val2');
      expect(questionItem.validations?.['val2']?.type).toBe(ValidationType.Soft);
      expect(questionItem.validations?.['val2']?.rule?.name).toBe('not');

      // Test display conditions on question
      expect(questionItem.displayConditions).toBeDefined();
      expect(questionItem.displayConditions?.root).toBeDefined();
      expect(questionItem.displayConditions?.root?.name).toBe('and');
      expect(questionItem.displayConditions?.root?.data).toHaveLength(2);

      expect(questionItem.displayConditions?.components).toBeDefined();
      expect(questionItem.displayConditions?.components?.['rg.option1']).toBeDefined();
      expect(questionItem.displayConditions?.components?.['rg.option1']?.name).toBe('lt');

      // Test disabled conditions on question
      expect(questionItem.disabledConditions).toBeDefined();
      expect(questionItem.disabledConditions?.components).toBeDefined();
      expect(questionItem.disabledConditions?.components?.['rg.option2']).toBeDefined();
      expect(questionItem.disabledConditions?.components?.['rg.option2']?.name).toBe('or');
      expect(questionItem.disabledConditions?.components?.['rg.option2']?.data).toHaveLength(2);

      // Verify response config was parsed correctly
      expect(questionItem.responseConfig).toBeDefined();
      expect(questionItem.responseConfig.componentType).toBe(ItemComponentType.SingleChoice);
      expect(questionItem.responseConfig.options).toHaveLength(2);
      expect(questionItem.responseConfig.options[0].key.componentKey).toBe('option1');
      expect(questionItem.responseConfig.options[1].key.componentKey).toBe('option2');
    });

    test('should maintain data integrity in round-trip parsing (JSON -> Survey -> JSON)', () => {
      // Parse the survey from JSON
      const survey = Survey.fromJson(surveyJsonWithConditionsAndValidations);

      // Convert back to JSON
      const exportedJson = survey.toJson();

      // Verify schema is preserved
      expect(exportedJson.$schema).toBe(surveyJsonWithConditionsAndValidations.$schema);

      // Verify all survey items are present
      expect(Object.keys(exportedJson.surveyItems)).toEqual(Object.keys(surveyJsonWithConditionsAndValidations.surveyItems));

      // Test root survey group
      const originalRoot = surveyJsonWithConditionsAndValidations.surveyItems.survey as JsonSurveyItemGroup;
      const exportedRoot = exportedJson.surveyItems.survey as JsonSurveyItemGroup;
      expect(exportedRoot.itemType).toBe(originalRoot.itemType);
      expect(exportedRoot.items).toEqual(originalRoot.items);

      // Test group with display conditions
      const originalGroup = surveyJsonWithConditionsAndValidations.surveyItems['survey.group1'] as JsonSurveyItemGroup;
      const exportedGroup = exportedJson.surveyItems['survey.group1'] as JsonSurveyItemGroup;
      expect(exportedGroup.itemType).toBe(originalGroup.itemType);
      expect(exportedGroup.items).toEqual(originalGroup.items);
      expect(exportedGroup.displayConditions).toEqual(originalGroup.displayConditions);

      // Test display item with display conditions and dynamic values
      const originalDisplay = surveyJsonWithConditionsAndValidations.surveyItems['survey.group1.display1'] as JsonSurveyDisplayItem;
      const exportedDisplay = exportedJson.surveyItems['survey.group1.display1'] as JsonSurveyDisplayItem;
      expect(exportedDisplay.itemType).toBe(originalDisplay.itemType);
      expect(exportedDisplay.components).toEqual(originalDisplay.components);
      expect(exportedDisplay.displayConditions).toEqual(originalDisplay.displayConditions);
      expect(exportedDisplay.dynamicValues).toEqual(originalDisplay.dynamicValues);

      // Test single choice question with validations, display conditions, and disabled conditions
      const originalQuestion = surveyJsonWithConditionsAndValidations.surveyItems['survey.question1'] as JsonSurveyResponseItem;
      const exportedQuestion = exportedJson.surveyItems['survey.question1'] as JsonSurveyResponseItem;
      expect(exportedQuestion.itemType).toBe(originalQuestion.itemType);

      // Test validations are preserved
      expect(exportedQuestion.validations).toEqual(originalQuestion.validations);

      // Test display conditions are preserved
      expect(exportedQuestion.displayConditions).toEqual(originalQuestion.displayConditions);

      // Test disabled conditions are preserved
      expect(exportedQuestion.disabledConditions).toEqual(originalQuestion.disabledConditions);

      // Test response config structure (allowing for key transformation during parsing)
      expect(exportedQuestion.responseConfig.type).toBe(originalQuestion.responseConfig.type);
      expect(exportedQuestion.responseConfig.key).toBe(originalQuestion.responseConfig.key);
      expect(exportedQuestion.responseConfig.items).toHaveLength(originalQuestion.responseConfig.items!.length);

      // Verify options are preserved (keys might be transformed to full keys)
      const exportedOptions = exportedQuestion.responseConfig.items!;
      const originalOptions = originalQuestion.responseConfig.items!;
      expect(exportedOptions).toHaveLength(2);
      expect(exportedOptions[0].type).toBe(originalOptions[0].type);
      expect(exportedOptions[1].type).toBe(originalOptions[1].type);

      // Check that keys contain the original option keys (they become full keys after parsing)
      expect(exportedOptions[0].key).toContain('option1');
      expect(exportedOptions[1].key).toContain('option2');

      // Test survey end item
      const originalEnd = surveyJsonWithConditionsAndValidations.surveyItems['survey.surveyEnd1'] as JsonSurveyEndItem;
      const exportedEnd = exportedJson.surveyItems['survey.surveyEnd1'] as JsonSurveyEndItem;
      expect(exportedEnd.itemType).toBe(originalEnd.itemType);

      // Verify translations are preserved
      expect(exportedJson.translations).toEqual(surveyJsonWithConditionsAndValidations.translations);

      // Verify that we can parse the exported JSON again (double round-trip)
      const secondParsedSurvey = Survey.fromJson(exportedJson);
      expect(secondParsedSurvey.surveyItems).toBeDefined();
      expect(Object.keys(secondParsedSurvey.surveyItems)).toEqual(Object.keys(survey.surveyItems));

      // Verify the complex properties are still intact after double round-trip
      const secondQuestionItem = secondParsedSurvey.surveyItems['survey.question1'] as SingleChoiceQuestionItem;
      expect(secondQuestionItem.validations).toBeDefined();
      expect(Object.keys(secondQuestionItem.validations || {})).toHaveLength(2);
      expect(secondQuestionItem.displayConditions).toBeDefined();
      expect(secondQuestionItem.disabledConditions).toBeDefined();
    });
  });
});
