import { SurveySingleItem, SurveyContext, Survey, ItemGroupComponent } from '../data_types';
import { SurveyEngineCore } from '../engine';

// ---------- Create a test survey definition ----------------
const testItem: SurveySingleItem = {
  key: '0.1',
  validations: [],
  components: {
    role: 'root',
    items: [
      {
        key: 'comp1',
        role: 'text',
        content: [
          {
            key: 'text1',
            type: 'simple'
          },
          {
            key: 'text2',
            type: 'CQM'
          }
        ],
      },
      {
        key: 'comp2',
        role: 'text',
        disabled: {
          name: 'eq',
          data: [
            { str: 'test' },
            {
              dtype: 'exp', exp: {
                name: 'getAttribute',
                data: [
                  { dtype: 'exp', exp: { name: 'getContext' } },
                  { str: 'mode' }
                ]
              }
            }
          ]
        },
        displayCondition: {
          name: 'eq',
          data: [
            { str: 'test' },
            {
              dtype: 'exp', exp: {
                name: 'getAttribute',
                data: [
                  { dtype: 'exp', exp: { name: 'getContext' } },
                  { str: 'mode' }
                ]
              }
            }
          ]
        }
      },
      {
        key: 'comp3',
        role: 'text',
        disabled: {
          name: 'eq',
          data: [
            { str: 'test2' },
            {
              dtype: 'exp', exp: {
                name: 'getAttribute',
                data: [
                  { dtype: 'exp', exp: { name: 'getContext' } },
                  { str: 'mode' }
                ]
              }
            }
          ]
        },
        displayCondition: {
          name: 'eq',
          data: [
            { str: 'test2' },
            {
              dtype: 'exp', exp: {
                name: 'getAttribute',
                data: [
                  { dtype: 'exp', exp: { name: 'getContext' } },
                  { str: 'mode' }
                ]
              }
            }
          ]
        }
      },
      {
        key: 'comp4',
        role: 'numberInput',
        properties: {
          min: {
            dtype: 'num',
            num: -5,
          },
          max: {
            dtype: 'exp', exp: {
              name: 'getAttribute',
              returnType: 'float',
              data: [
                { dtype: 'exp', exp: { name: 'getContext' } },
                { str: 'mode' }
              ]
            }
          }

        }
      }
    ]
  }
}

const testItem2: SurveySingleItem = {
  key: '0.2',
  validations: [],
  components: {
    role: 'root',
    items: [
      {
        role: 'group',
        items: [
          {
            key: 'item1',
            role: 'text',
            content: [
              {
                key: '1',
                type: 'simple'
              },
              {
                key: '2',
                type: 'CQM'
              }
            ]
          },
        ],
      },
    ]
  }
}

const testSurvey: Survey = {
  schemaVersion: 1,
  versionId: 'wfdojsdfpo',
  surveyDefinition: {
    key: '0',
    items: [
      testItem,
      testItem2,
    ]
  },
  dynamicValues: [
    {
      type: 'expression',
      key: '0.1-comp1-exp1',
      expression: {
        name: 'getAttribute',
        data: [
          { dtype: 'exp', exp: { name: 'getContext' } },
          { str: 'mode' }
        ]
      }
    },
    {
      type: 'date',
      key: '0.2-group.item1-exp1',
      dateFormat: 'MM/dd/yyyy',
      expression: {
        name: 'timestampWithOffset',
        data: [
          { dtype: 'num', num: 0 },
        ]
      }
    }
  ],
  translations: {
    en: {
      '0.1': {
        'comp1.text1': 'Hello World',
        'comp1.text2': 'Mode is: {{ exp1 }}'
      },
      '0.2': {
        'group.item1.1': 'Group Item Text',
        'group.item1.2': 'Timestamp: {{ exp1 }}'
      }
    }
  },
}

describe('Item Component Rendering with Translations and Dynamic Values', () => {
  test('testing item component disabled', () => {
    const context: SurveyContext = {
      mode: 'test'
    };
    const surveyE = new SurveyEngineCore(
      testSurvey,
      context
    );

    const renderedSurvey = surveyE.getRenderedSurvey();
    const testComponent = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp2');
    if (!testComponent) {
      throw Error('comp2 is undefined')
    }
    const testComponent2 = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp3');
    if (!testComponent2) {
      throw Error('comp3 is undefined')
    }

    expect(testComponent.disabled).toBeTruthy();
    expect(testComponent2.disabled).toBeFalsy();
  });

  test('testing item component displayCondition', () => {
    const context: SurveyContext = {
      mode: 'test'
    };
    const surveyE = new SurveyEngineCore(
      testSurvey,
      context
    );

    const renderedSurvey = surveyE.getRenderedSurvey();
    const testComponent = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp2');
    if (!testComponent) {
      throw Error('comp2 is undefined')
    }
    const testComponent2 = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp3');
    if (!testComponent2) {
      throw Error('comp3 is undefined')
    }

    expect(testComponent.displayCondition).toBeTruthy();
    expect(testComponent2.displayCondition).toBeFalsy();
  });

  test('testing item component properties', () => {
    const context: SurveyContext = {
      mode: '4.5'
    };
    const surveyE = new SurveyEngineCore(
      testSurvey,
      context
    );

    const renderedSurvey = surveyE.getRenderedSurvey();
    const testComponent = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp4');
    if (!testComponent || !testComponent.properties) {
      throw Error('comp4 or its properties are undefined')
    }

    expect(testComponent.properties.min).toEqual(-5);
    expect(testComponent.properties.max).toEqual(4.5);
  });

  test('testing item component content with translations', () => {
    const context: SurveyContext = {
      mode: 'test'
    };
    const surveyE = new SurveyEngineCore(
      testSurvey,
      context,
      [],
      false,
      'en'
    );

    const renderedSurvey = surveyE.getRenderedSurvey();
    const testComponent = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp1');
    if (!testComponent || !testComponent.content) {
      throw Error('comp1 or its content is undefined')
    }
    console.log(JSON.stringify(testComponent, undefined, 2))

    // Test simple translation
    expect(testComponent.content[0]?.resolvedText).toEqual('Hello World');

    // Test translation with dynamic value placeholder
    expect(testComponent.content[1]?.resolvedText).toEqual('Mode is: test');
  });

  test('testing dynamic value resolution in expressions', () => {
    const context: SurveyContext = {
      mode: 'test'
    };
    const surveyE = new SurveyEngineCore(
      testSurvey,
      context
    );

    // Test that dynamic value expressions are correctly resolved by checking the rendered content
    const renderedSurvey = surveyE.getRenderedSurvey();
    const testComponent = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp1');

    if (!testComponent?.content) {
      throw Error('comp1 or its content is undefined')
    }

    // The dynamic value should be resolved in the content with the CQM template
    expect(testComponent.content[1]?.resolvedText).toEqual('Mode is: test');
  });

  test('testing item component with group and nested translations', () => {
    const context: SurveyContext = {
      mode: 'test'
    };
    const surveyE = new SurveyEngineCore(
      testSurvey,
      context
    );

    const renderedSurvey = surveyE.getRenderedSurvey();
    const groupComponent = (renderedSurvey.items.find(item => item.key === '0.2') as SurveySingleItem).components?.items.find(comp => comp.role === 'group');

    if (!groupComponent) {
      throw Error('group component is undefined')
    }

    const items = (groupComponent as ItemGroupComponent).items;
    if (!items || items.length < 1) {
      throw Error('group items not found')
    }

    const textItem = items.find(item => item.key === 'item1');
    if (!textItem || !textItem.content) {
      throw Error('text item or its content not found')
    }

    // Test simple translation in nested component
    expect(textItem.content[0]?.resolvedText).toEqual('Group Item Text');

    // Test translation with timestamp expression - this should have a resolved timestamp value
    expect(textItem.content[1]?.resolvedText).toMatch(/^Timestamp: \d{2}\/\d{2}\/\d{4}$/);
  });

  test('testing translation resolution with different contexts', () => {
    const context1: SurveyContext = {
      mode: 'development'
    };
    const context2: SurveyContext = {
      mode: 'production'
    };

    const surveyE1 = new SurveyEngineCore(testSurvey, context1);
    const surveyE2 = new SurveyEngineCore(testSurvey, context2);

    const renderedSurvey1 = surveyE1.getRenderedSurvey();
    const renderedSurvey2 = surveyE2.getRenderedSurvey();

    const testComponent1 = (renderedSurvey1.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp1');
    const testComponent2 = (renderedSurvey2.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp1');

    if (!testComponent1?.content || !testComponent2?.content) {
      throw Error('components or content are undefined')
    }

    // Both should have the same base translation but different dynamic values
    expect(testComponent1.content[0]?.resolvedText).toEqual('Hello World');
    expect(testComponent2.content[0]?.resolvedText).toEqual('Hello World');

    // But dynamic expressions should resolve differently based on context
    expect(testComponent1.content[1]?.resolvedText).toEqual('Mode is: development');
    expect(testComponent2.content[1]?.resolvedText).toEqual('Mode is: production');
  });

  test('testing missing translation fallback', () => {
    // Test with a survey that has missing translations
    const incompleteTestSurvey: Survey = {
      ...testSurvey,
      translations: {
        en: {
          '0.1': {
            'comp1.text1': 'Only first translation exists',
            // missing 'comp1.text2'
          }
        }
      }
    };

    const context: SurveyContext = {
      mode: 'test'
    };
    const surveyE = new SurveyEngineCore(incompleteTestSurvey, context);
    const renderedSurvey = surveyE.getRenderedSurvey();
    const testComponent = (renderedSurvey.items.find(item => item.key === '0.1') as SurveySingleItem).components?.items.find(comp => comp.key === 'comp1');

    if (!testComponent?.content) {
      throw Error('component or content is undefined')
    }

    expect(testComponent.content[0]?.resolvedText).toEqual('Only first translation exists');
    // Should fallback gracefully when translation is missing
    expect(testComponent.content[1]?.resolvedText).toBeDefined();
  });
});
