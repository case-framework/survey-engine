import { SurveyEngineCore } from '../engine/engine';
import { Survey } from '../survey/survey';
import { SurveyItemType, QuestionItem } from '../survey/items';
import { ResponseItem, JsonSurveyItemResponse } from '../survey/responses/item-response';
import { ResponseMeta } from '../survey/responses/response-meta';
import { SurveyEditor } from '../survey-editor';
import { JsonSurvey, CURRENT_SURVEY_SCHEMA } from '../survey/survey-file-schema';
import { ItemComponentType } from '../survey/components';
import { ExpressionType } from '../expressions';
import { ExpectedValueType } from '../survey/utils/types';
import { TemplateDefTypes, TemplateValueFormatDate } from '../expressions/template-value';

describe('SurveyEngineCore response handling', () => {
  function makeSurveyWithQuestions(keys: string[]): Survey {
    const rootKey = 'test-survey';
    const survey = new Survey(rootKey);
    const editor = new SurveyEditor(survey);

    for (const key of keys) {
      editor.initNewItem({ parentKey: rootKey }, SurveyItemType.SingleChoiceQuestion, key);
    }
    return survey;
  }

  function getMetaArray(meta: ResponseMeta | undefined, type: 'responded' | 'displayed'): number[] {
    if (!meta) return [];
    const json = meta.toJson();
    switch (type) {
      case 'responded': return json.responded;
      case 'displayed': return json.displayed;
    }
  }

  describe('Cache initialization', () => {
    function createSurveyWithCacheableItems(): Survey {
      const surveyJson: JsonSurvey = {
        $schema: CURRENT_SURVEY_SCHEMA,
        surveyItems: {
          'test-survey': {
            itemType: SurveyItemType.Group,
            items: [
              'test-survey.question-with-validations',
              'test-survey.display-with-conditions',
              'test-survey.question-with-disabled-conditions',
              'test-survey.item-with-template-values',
              'test-survey.complex-item'
            ]
          },
          'test-survey.question-with-validations': {
            itemType: SurveyItemType.SingleChoiceQuestion,
            responseConfig: {
              key: 'rg',
              type: ItemComponentType.SingleChoice,
              items: [
                {
                  key: 'option1',
                  type: ItemComponentType.ScgMcgOption,
                  styles: {}
                }
              ],
              styles: {}
            },
            validations: {
              'required': {
                type: ExpressionType.ResponseVariable,
                variableRef: 'test-survey.question-with-validations...isDefined'
              },
              'custom-validation': {
                type: ExpressionType.Function,
                functionName: 'gt',
                arguments: [
                  { type: ExpressionType.Const, value: 10 },
                  { type: ExpressionType.Const, value: 5 }
                ]
              }
            }
          },
          'test-survey.display-with-conditions': {
            itemType: SurveyItemType.Display,
            components: [
              {
                key: 'comp1',
                type: ItemComponentType.Text,
                styles: {}
              },
              {
                key: 'comp2',
                type: ItemComponentType.Text,
                styles: {}
              }
            ],
            displayConditions: {
              root: {
                type: ExpressionType.Function,
                functionName: 'eq',
                arguments: [
                  { type: ExpressionType.Const, value: 'show' },
                  { type: ExpressionType.Const, value: 'show' }
                ]
              },
              components: {
                'comp1': {
                  type: ExpressionType.Function,
                  functionName: 'gt',
                  arguments: [
                    { type: ExpressionType.Const, value: 10 },
                    { type: ExpressionType.Const, value: 5 }
                  ]
                },
                'comp2': {
                  type: ExpressionType.Function,
                  functionName: 'lt',
                  arguments: [
                    { type: ExpressionType.Const, value: 13 },
                    { type: ExpressionType.Const, value: 8 }
                  ]
                }
              }
            }
          },
          'test-survey.question-with-disabled-conditions': {
            itemType: SurveyItemType.MultipleChoiceQuestion,
            responseConfig: {
              key: 'mc',
              type: ItemComponentType.MultipleChoice,
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
            disabledConditions: {
              components: {
                'mc.option1': {
                  type: ExpressionType.Function,
                  functionName: 'gt',
                  arguments: [
                    { type: ExpressionType.Const, value: 3 },
                    { type: ExpressionType.Const, value: 5 }
                  ]
                },
                'mc.option2': {
                  type: ExpressionType.Function,
                  functionName: 'or',
                  arguments: [
                    { type: ExpressionType.Const, value: true },
                    { type: ExpressionType.Const, value: false }
                  ]
                }
              }
            }
          },
          'test-survey.item-with-template-values': {
            itemType: SurveyItemType.Display,
            components: [
              {
                key: 'comp1',
                type: ItemComponentType.Text,
                styles: {}
              }
            ],
            templateValues: {
              'dynValue1': {
                type: TemplateDefTypes.Default,
                returnType: ExpectedValueType.String,
                expression: {
                  type: ExpressionType.Const,
                  value: 'test'
                }
              },
              'dynValue2': {
                type: TemplateDefTypes.Default,
                returnType: ExpectedValueType.Boolean,
                expression: {
                  type: ExpressionType.Function,
                  functionName: 'gt',
                  arguments: [
                    { type: ExpressionType.Const, value: 5 },
                    { type: ExpressionType.Const, value: 3 }
                  ]
                }
              },
              'dynValue3': {
                type: TemplateDefTypes.Default,
                returnType: ExpectedValueType.Boolean,
                expression: {
                  type: ExpressionType.Const,
                  value: true
                }
              },
              'dynValue4': {
                type: TemplateDefTypes.Date2String,
                returnType: ExpectedValueType.String,
                dateFormat: 'dd/MM/yyyy',
                expression: {
                  type: ExpressionType.Const,
                  value: new Date('2025-01-01')
                }
              }
            }
          },
          'test-survey.complex-item': {
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
              'validation1': {
                type: ExpressionType.Function,
                functionName: 'not',
                arguments: [
                  { type: ExpressionType.Const, value: false }
                ]
              }
            },
            displayConditions: {
              root: {
                type: ExpressionType.Const,
                value: true
              },
              components: {
                'rg.option1': {
                  type: ExpressionType.Function,
                  functionName: 'and',
                  arguments: [
                    { type: ExpressionType.Const, value: true },
                    { type: ExpressionType.Const, value: true }
                  ]
                }
              }
            },
            disabledConditions: {
              components: {
                'rg.option2': {
                  type: ExpressionType.Const,
                  value: false
                }
              }
            },
            templateValues: {
              'complexValue': {
                type: TemplateDefTypes.Default,
                returnType: ExpectedValueType.Boolean,
                expression: {
                  type: ExpressionType.Function,
                  functionName: 'eq',
                  arguments: [
                    { type: ExpressionType.Const, value: 'test' },
                    { type: ExpressionType.Const, value: 'test' }
                  ]
                }
              }
            }
          }
        },
        translations: {
          en: {}
        }
      };

      return Survey.fromJson(surveyJson);
    }

    it('should initialize cache with empty objects when no cacheable properties exist', () => {
      const survey = makeSurveyWithQuestions(['q1', 'q2']);
      const engine = new SurveyEngineCore(survey);

      // Access cache through engine responses to verify initialization
      const responses = engine.getResponses();
      expect(responses.length).toBe(2);

      // Cache should be initialized but empty for items without special properties
      // This test verifies that the constructor doesn't throw errors during cache initialization
      expect(engine.getResponseItem('test-survey.q1')).toBeDefined();
      expect(engine.getResponseItem('test-survey.q2')).toBeDefined();

      expect(engine.getDisplayConditionValue('test-survey.q1')).toBeUndefined();
      expect(engine.getDisabledConditionValue('test-survey.q1', 'rg.option1')).toBeUndefined();
      expect(engine.getTemplateValue('test-survey.q1', 'dynValue1')).toBeUndefined();
      expect(engine.getValidationValues('test-survey.q1')).toBeUndefined();
    });

    it('should initialize validations cache for question items with validations', () => {
      const survey = createSurveyWithCacheableItems();
      const engine = new SurveyEngineCore(survey);

      // Verify the engine initializes successfully
      expect(engine.getResponses().length).toBeGreaterThan(0);

      // Verify items with validations are processed correctly
      const questionWithValidations = engine.getResponseItem('test-survey.question-with-validations');
      expect(questionWithValidations).toBeDefined();

      const complexItem = engine.getResponseItem('test-survey.complex-item');
      expect(complexItem).toBeDefined();

      const validations = engine.getValidationValues('test-survey.question-with-validations');
      expect(validations).toBeDefined();
      expect(validations).toEqual({
        'required': false,
        'custom-validation': true
      });
    });

    it('should initialize display conditions cache for items with display conditions', () => {
      const survey = createSurveyWithCacheableItems();
      const engine = new SurveyEngineCore(survey);

      // Verify display items with conditions are handled
      const displayWithConditions = survey.surveyItems['test-survey.display-with-conditions'];
      expect(displayWithConditions.displayConditions).toBeDefined();
      expect(displayWithConditions.displayConditions?.root).toBeDefined();
      expect(displayWithConditions.displayConditions?.components).toBeDefined();
      expect(Object.keys(displayWithConditions.displayConditions?.components || {})).toContain('comp1');
      expect(Object.keys(displayWithConditions.displayConditions?.components || {})).toContain('comp2');

      // Verify complex item with display conditions
      const complexItem = survey.surveyItems['test-survey.complex-item'];
      expect(complexItem.displayConditions).toBeDefined();
      expect(complexItem.displayConditions?.root).toBeDefined();
      expect(complexItem.displayConditions?.components).toBeDefined();

      expect(engine.getDisplayConditionValue('test-survey.display-with-conditions')).toBeTruthy();
      expect(engine.getDisplayConditionValue('test-survey.display-with-conditions', 'comp1')).toBeTruthy();
      expect(engine.getDisplayConditionValue('test-survey.display-with-conditions', 'comp2')).toBeFalsy();


    });

    it('should initialize disabled conditions cache for question items with disabled conditions', () => {
      const survey = createSurveyWithCacheableItems();
      const engine = new SurveyEngineCore(survey);

      // Verify question with disabled conditions
      const questionWithDisabled = survey.surveyItems['test-survey.question-with-disabled-conditions'] as QuestionItem;
      expect(questionWithDisabled.disabledConditions).toBeDefined();
      expect(questionWithDisabled.disabledConditions?.components).toBeDefined();
      expect(Object.keys(questionWithDisabled.disabledConditions?.components || {})).toContain('mc.option1');
      expect(Object.keys(questionWithDisabled.disabledConditions?.components || {})).toContain('mc.option2');

      // Verify complex item with disabled conditions
      const complexItem = survey.surveyItems['test-survey.complex-item'] as QuestionItem;
      expect(complexItem.disabledConditions).toBeDefined();
      expect(complexItem.disabledConditions?.components).toBeDefined();
      expect(Object.keys(complexItem.disabledConditions?.components || {})).toContain('rg.option2');

      expect(engine.getDisabledConditionValue('test-survey.question-with-disabled-conditions', 'mc.option1')).toBeFalsy();
      expect(engine.getDisabledConditionValue('test-survey.question-with-disabled-conditions', 'mc.option2')).toBeTruthy();

      expect(engine.getDisabledConditionValue('test-survey.complex-item', 'rg.option2')).toBeFalsy();
    });

    it('should initialize template values cache for items with template values', () => {
      const survey = createSurveyWithCacheableItems();
      const engine = new SurveyEngineCore(survey);

      // Verify item with template values
      const itemWithTemplates = survey.surveyItems['test-survey.item-with-template-values'];
      expect(itemWithTemplates.templateValues).toBeDefined();
      expect(Object.keys(itemWithTemplates.templateValues || {})).toContain('dynValue1');
      expect(Object.keys(itemWithTemplates.templateValues || {})).toContain('dynValue2');
      expect(Object.keys(itemWithTemplates.templateValues || {})).toContain('dynValue3');
      expect(Object.keys(itemWithTemplates.templateValues || {})).toContain('dynValue4');

      // Verify template values have correct return types
      expect(itemWithTemplates.templateValues?.['dynValue1']?.returnType).toBe(ExpectedValueType.String);
      expect(itemWithTemplates.templateValues?.['dynValue2']?.returnType).toBe(ExpectedValueType.Boolean);
      expect(itemWithTemplates.templateValues?.['dynValue3']?.returnType).toBe(ExpectedValueType.Boolean);
      expect(itemWithTemplates.templateValues?.['dynValue4']?.returnType).toBe(ExpectedValueType.String);
      expect((itemWithTemplates.templateValues?.['dynValue4'] as TemplateValueFormatDate).dateFormat).toBe('dd/MM/yyyy');

      // Verify complex item with template values
      const complexItem = survey.surveyItems['test-survey.complex-item'];
      expect(complexItem.templateValues).toBeDefined();
      expect(Object.keys(complexItem.templateValues || {})).toContain('complexValue');
      expect(complexItem.templateValues?.['complexValue']?.returnType).toBe(ExpectedValueType.Boolean);

      expect(engine.getTemplateValue('test-survey.item-with-template-values', 'dynValue1')?.value).toBe('test');
      expect(engine.getTemplateValue('test-survey.item-with-template-values', 'dynValue2')?.value).toBeTruthy();
      expect(engine.getTemplateValue('test-survey.item-with-template-values', 'dynValue3')?.value).toBeTruthy();
      expect(engine.getTemplateValue('test-survey.item-with-template-values', 'dynValue4')?.value).toBe('01/01/2025');

      expect(engine.getTemplateValue('test-survey.complex-item', 'complexValue')).toBeTruthy();
    });


    it('should not initialize cache entries for items without cacheable properties', () => {
      const survey = createSurveyWithCacheableItems();
      const engine = new SurveyEngineCore(survey);

      // The root group item should not have cache entries
      const rootItem = survey.surveyItems['test-survey'];
      expect(rootItem.itemType).toBe(SurveyItemType.Group);
      expect(rootItem.displayConditions).toBeUndefined();
      expect(rootItem.templateValues).toBeUndefined();
      // Group items don't have validations or disabled conditions

      // Engine should still function normally
      expect(engine.survey.rootItem.key.fullKey).toBe('test-survey');
    });

    it('should handle cache initialization with empty validation/condition objects', () => {
      const surveyJson: JsonSurvey = {
        $schema: CURRENT_SURVEY_SCHEMA,
        surveyItems: {
          'test-survey': {
            itemType: SurveyItemType.Group,
            items: ['test-survey.q1']
          },
          'test-survey.q1': {
            itemType: SurveyItemType.SingleChoiceQuestion,
            responseConfig: {
              key: 'rg',
              type: ItemComponentType.SingleChoice,
              items: [
                {
                  key: 'option1',
                  type: ItemComponentType.ScgMcgOption,
                  styles: {}
                }
              ],
              styles: {}
            },
            validations: {}, // Empty validations object
            displayConditions: {}, // Empty display conditions object
            disabledConditions: {}, // Empty disabled conditions object
            templateValues: {} // Empty template values object
          }
        },
        translations: {
          en: {}
        }
      };

      const survey = Survey.fromJson(surveyJson);
      const engine = new SurveyEngineCore(survey);

      // Should not throw errors with empty objects
      expect(engine.getResponses().length).toBe(1);
      const response = engine.getResponseItem('test-survey.q1');
      expect(response).toBeDefined();
      expect(response?.itemType).toBe(SurveyItemType.SingleChoiceQuestion);
    });
  });

  it('initializes responses for all items', () => {
    const survey = makeSurveyWithQuestions(['q1', 'q2']);
    const engine = new SurveyEngineCore(survey);
    const responses = engine.getResponses();
    expect(responses.length).toBe(2);
    expect(responses[0].key.fullKey).toBe('test-survey.q1');
    expect(responses[1].key.fullKey).toBe('test-survey.q2');
  });

  it('setResponse updates the response and meta', () => {
    const survey = makeSurveyWithQuestions(['q1']);
    const engine = new SurveyEngineCore(survey);
    engine.setResponse('test-survey.q1', new ResponseItem('foo'));
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response?.get()).toBe('foo');
    expect(resp?.meta).toBeDefined();
    expect(getMetaArray(resp?.meta, 'responded').length).toBeGreaterThan(0);
  });

  it('prefills are not used if wrong type provided', () => {
    const survey = makeSurveyWithQuestions(['q1', 'q2']);
    const prefills: JsonSurveyItemResponse[] = [
      { key: 'test-survey.q1', itemType: SurveyItemType.MultipleChoiceQuestion, response: { value: 'prefilled' } }
    ];
    const engine = new SurveyEngineCore(survey, undefined, prefills);
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response).toBeUndefined();
    // q2 should not be prefilled
    expect(engine.getResponseItem('test-survey.q2')?.response).toBeUndefined();
  });

  it('prefills are used if provided', () => {
    const survey = makeSurveyWithQuestions(['q1', 'q2']);
    const prefills: JsonSurveyItemResponse[] = [
      { key: 'test-survey.q1', itemType: SurveyItemType.SingleChoiceQuestion, response: { value: 'prefilled' } }
    ];
    const engine = new SurveyEngineCore(survey, undefined, prefills);
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response?.get()).toBe('prefilled');
    // q2 should not be prefilled
    expect(engine.getResponseItem('test-survey.q2')?.response).toBeUndefined();
  });

  it('setResponse overwrites prefill', () => {
    const survey = makeSurveyWithQuestions(['q1']);
    const prefills: JsonSurveyItemResponse[] = [
      { key: 'test-survey.q1', itemType: SurveyItemType.Display, response: { value: 'prefilled' } }
    ];
    const engine = new SurveyEngineCore(survey, undefined, prefills);
    engine.setResponse('test-survey.q1', new ResponseItem('newval'));
    const resp = engine.getResponseItem('test-survey.q1');
    expect(resp?.response?.get()).toBe('newval');
  });

  it('ResponseMeta tracks rendered, displayed, responded', () => {
    const survey = makeSurveyWithQuestions(['q1']);
    const engine = new SurveyEngineCore(survey);
    engine.setResponse('test-survey.q1', new ResponseItem('foo'));
    engine.onQuestionDisplayed('test-survey.q1');
    const resp = engine.getResponseItem('test-survey.q1');
    expect(getMetaArray(resp?.meta, 'responded').length).toBeGreaterThan(0);
    expect(getMetaArray(resp?.meta, 'displayed').length).toBeGreaterThan(0);
  });
});
