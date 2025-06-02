import { compileSurvey, decompileSurvey, isSurveyCompiled } from '../survey-compilation';
import { Survey, DynamicValue, SurveySingleItem, SurveyGroupItem, ItemGroupComponent, LocalizedContent } from '../data_types';

describe('Survey Compilation Tests', () => {
  test('compileSurvey should move component translations and dynamic values to global level', () => {
    const mockSurvey: Survey = {
      versionId: '1.0.0',
      surveyDefinition: {
        key: 'survey1',
        items: [{
          key: 'survey1.item1',
          components: {
            role: 'root',
            items: [],
            content: [{ type: 'simple', key: 'root' }] as LocalizedContent[],
            translations: {
              'en': { 'root': 'Hello' },
              'de': { 'root': 'Hallo' }
            },
            dynamicValues: [{
              key: 'testValue',
              type: 'expression',
              expression: { name: 'getAttribute', data: [{ str: 'test' }] }
            }] as DynamicValue[]
          }
        } as SurveySingleItem]
      }
    };

    const compiled = compileSurvey(mockSurvey);

    expect(isSurveyCompiled(mockSurvey)).toBe(false);
    expect(isSurveyCompiled(compiled)).toBe(true);

    // Check that global translations were created with locale-first structure and nested keys
    expect(compiled.translations).toBeDefined();
    expect(compiled.translations!['en']).toBeDefined();
    expect(compiled.translations!['de']).toBeDefined();
    expect(compiled.translations!['en']['survey1.item1']).toBeDefined();
    expect(compiled.translations!['en']['survey1.item1']['root']).toBe('Hello');
    expect(compiled.translations!['de']['survey1.item1']).toBeDefined();
    expect(compiled.translations!['de']['survey1.item1']['root']).toBe('Hallo');

    // Check that global dynamic values were created with prefixed keys
    expect(compiled.dynamicValues).toBeDefined();
    expect(compiled.dynamicValues!.length).toBe(1);
    expect(compiled.dynamicValues![0].key).toBe('survey1.item1-testValue');

    // Check that component-level translations and dynamic values were removed
    const singleItem = compiled.surveyDefinition.items[0] as SurveySingleItem;
    expect(singleItem.components?.translations).toBeUndefined();
    expect(singleItem.components?.dynamicValues).toBeUndefined();
  });

  test('decompileSurvey should restore component translations and dynamic values from global level', () => {
    const compiledSurvey: Survey = {
      versionId: '1.0.0',
      translations: {
        'en': {
          'survey1.item1': { 'root': 'Hello' }
        },
        'de': {
          'survey1.item1': { 'root': 'Hallo' }
        }
      },
      dynamicValues: [{
        key: 'survey1.item1-testValue',
        type: 'expression',
        expression: { name: 'getAttribute', data: [{ str: 'test' }] }
      }],
      surveyDefinition: {
        key: 'survey1',
        items: [{
          key: 'survey1.item1',
          components: {
            role: 'root',
            items: [],
            content: [{ type: 'simple', key: 'root' }] as LocalizedContent[]
          }
        } as SurveySingleItem]
      }
    };

    const decompiled = decompileSurvey(compiledSurvey);

    // Check that component translations were restored with nested key structure
    const singleItem = decompiled.surveyDefinition.items[0] as SurveySingleItem;
    expect(singleItem.components?.translations).toEqual({
      'en': { 'root': 'Hello' },
      'de': { 'root': 'Hallo' }
    });

    // Check that component dynamic values were restored with original keys
    expect(singleItem.components?.dynamicValues).toBeDefined();
    expect(singleItem.components?.dynamicValues!.length).toBe(1);
    expect(singleItem.components?.dynamicValues![0].key).toBe('testValue');

    // Check that global translations and dynamic values were cleared
    expect(decompiled.translations).toEqual({});
    expect(decompiled.dynamicValues).toEqual([]);
  });

  test('compilation and decompilation should be reversible', () => {
    const originalSurvey: Survey = {
      versionId: '1.0.0',
      surveyDefinition: {
        key: 'survey1',
        items: [{
          key: 'survey1.item1',
          components: {
            role: 'root',
            items: [],
            content: [{ type: 'simple', key: 'greeting' }] as LocalizedContent[],
            translations: {
              'en': { 'greeting': 'Original Text' },
              'fr': { 'greeting': 'Texte Original' }
            },
            dynamicValues: [{
              key: 'originalValue',
              type: 'date',
              dateFormat: 'YYYY-MM-DD'
            }] as DynamicValue[]
          }
        } as SurveySingleItem]
      }
    };

    // Compile then decompile
    const compiled = compileSurvey(originalSurvey);
    const restored = decompileSurvey(compiled);

    // Check that the restored survey matches the original structure
    const originalItem = originalSurvey.surveyDefinition.items[0] as SurveySingleItem;
    const restoredItem = restored.surveyDefinition.items[0] as SurveySingleItem;

    expect(restoredItem.components?.translations).toEqual(
      originalItem.components?.translations
    );
    expect(restoredItem.components?.dynamicValues).toEqual(
      originalItem.components?.dynamicValues
    );
  });

  test('should handle nested survey groups and nested component structures', () => {
    const nestedSurvey: Survey = {
      versionId: '1.0.0',
      surveyDefinition: {
        key: 'survey1',
        items: [{
          key: 'survey1.group1',
          items: [{
            key: 'survey1.group1.item1',
            components: {
              role: 'root',
              key: 'root',
              items: [{
                role: 'responseGroup',
                key: 'rg',
                items: [{
                  role: 'input',
                  key: 'input',
                  content: [{ type: 'simple', key: 'inputLabel' }] as LocalizedContent[],
                  translations: {
                    'en': { 'inputLabel': 'Enter your response' },
                    'es': { 'inputLabel': 'Ingresa tu respuesta' },
                    'fr': { 'inputLabel': 'Entrez votre réponse' }
                  },
                  dynamicValues: [{
                    key: 'maxLength',
                    type: 'expression',
                    expression: { name: 'getAttribute', data: [{ str: 'maxInputLength' }] }
                  }, {
                    key: 'placeholder',
                    type: 'expression',
                    expression: { name: 'getAttribute', data: [{ str: 'placeholderText' }] }
                  }] as DynamicValue[]
                }],
              } as ItemGroupComponent],
              content: [{ type: 'simple', key: 'rootText' }] as LocalizedContent[],
              translations: {
                'en': { 'rootText': 'Question Root' },
                'de': { 'rootText': 'Frage Wurzel' }
              },
              dynamicValues: [{
                key: 'questionId',
                type: 'expression',
                expression: { name: 'getAttribute', data: [{ str: 'currentQuestionId' }] }
              }] as DynamicValue[]
            }
          } as SurveySingleItem]
        } as SurveyGroupItem]
      }
    };

    // Test compilation
    const compiled = compileSurvey(nestedSurvey);

    // Check that nested translations were compiled with locale-first structure and proper key nesting
    expect(compiled.translations).toBeDefined();

    // English translations
    expect(compiled.translations!['en']).toBeDefined();
    expect(compiled.translations!['en']['survey1.group1.item1']['rootText']).toBe('Question Root');
    expect(compiled.translations!['en']['survey1.group1.item1']['rg.input.inputLabel']).toBe('Enter your response');

    // German translations
    expect(compiled.translations!['de']).toBeDefined();
    expect(compiled.translations!['de']['survey1.group1.item1']['rootText']).toBe('Frage Wurzel');

    // Spanish translations (only for input)
    expect(compiled.translations!['es']).toBeDefined();
    expect(compiled.translations!['es']['survey1.group1.item1']['rg.input.inputLabel']).toBe('Ingresa tu respuesta');

    // French translations (only for input)
    expect(compiled.translations!['fr']).toBeDefined();
    expect(compiled.translations!['fr']['survey1.group1.item1']['rg.input.inputLabel']).toBe('Entrez votre réponse');

    // Check that dynamic values were compiled with proper prefixes
    expect(compiled.dynamicValues).toBeDefined();
    expect(compiled.dynamicValues!.length).toBe(3);

    const dvKeys = compiled.dynamicValues!.map(dv => dv.key);
    expect(dvKeys).toContain('survey1.group1.item1-questionId');
    expect(dvKeys).toContain('survey1.group1.item1-rg.input-maxLength');
    expect(dvKeys).toContain('survey1.group1.item1-rg.input-placeholder');

    // Check that component-level data was removed
    const groupItem = compiled.surveyDefinition.items[0] as SurveyGroupItem;
    const singleItem = groupItem.items[0] as SurveySingleItem;
    expect(singleItem.components?.translations).toBeUndefined();
    expect(singleItem.components?.dynamicValues).toBeUndefined();

    // Check nested components also had their data removed
    const rgComponent = singleItem.components?.items?.[0] as ItemGroupComponent;
    expect(rgComponent?.translations).toBeUndefined();
    const inputComponent = rgComponent?.items?.[0];
    expect(inputComponent?.translations).toBeUndefined();
    expect(inputComponent?.dynamicValues).toBeUndefined();
    const titleComponent = rgComponent?.items?.[1];
    expect(titleComponent?.translations).toBeUndefined();

    // Test decompilation
    const decompiled = decompileSurvey(compiled);

    // Check that nested structure was restored
    const decompiledGroup = decompiled.surveyDefinition.items[0] as SurveyGroupItem;
    const decompiledItem = decompiledGroup.items[0] as SurveySingleItem;

    // Root component translations and dynamic values should be restored
    expect(decompiledItem.components?.translations).toEqual({
      'en': { 'rootText': 'Question Root' },
      'de': { 'rootText': 'Frage Wurzel' }
    });
    expect(decompiledItem.components?.dynamicValues).toBeDefined();
    expect(decompiledItem.components?.dynamicValues![0].key).toBe('questionId');

    // Nested component translations should be restored
    const decompiledRg = decompiledItem.components?.items?.[0] as ItemGroupComponent;

    const decompiledInput = decompiledRg?.items?.[0];
    expect(decompiledInput?.translations).toEqual({
      'en': { 'inputLabel': 'Enter your response' },
      'es': { 'inputLabel': 'Ingresa tu respuesta' },
      'fr': { 'inputLabel': 'Entrez votre réponse' }
    });
    expect(decompiledInput?.dynamicValues).toBeDefined();
    expect(decompiledInput?.dynamicValues!.length).toBe(2);
    expect(decompiledInput?.dynamicValues!.map(dv => dv.key)).toEqual(['maxLength', 'placeholder']);

    // Global data should be cleared
    expect(decompiled.translations).toEqual({});
    expect(decompiled.dynamicValues).toEqual([]);
  });

  describe('isSurveyCompiled function', () => {
    test('should return false for survey with no global data', () => {
      const survey: Survey = {
        versionId: '1.0.0',
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[],
              translations: {
                'en': { 'root': 'Hello' },
                'de': { 'root': 'Hallo' }
              }
            }
          } as SurveySingleItem]
        }
      };

      expect(isSurveyCompiled(survey)).toBe(false);
    });

    test('should return false for survey with global data but components still have local data', () => {
      const survey: Survey = {
        versionId: '1.0.0',
        translations: {
          'en': { 'survey1.item1': { 'root': 'Hello' } }
        },
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[],
              translations: {
                'en': { 'root': 'Hello' }
              }
            }
          } as SurveySingleItem]
        }
      };

      expect(isSurveyCompiled(survey)).toBe(false);
    });

    test('should return true for properly compiled survey', () => {
      const survey: Survey = {
        versionId: '1.0.0',
        translations: {
          'en': { 'survey1.item1': { 'root': 'Hello' } },
          'de': { 'survey1.item1': { 'root': 'Hallo' } }
        },
        dynamicValues: [{
          key: 'survey1.item1-testValue',
          type: 'expression',
          expression: { name: 'getAttribute', data: [{ str: 'test' }] }
        }],
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[]
            }
          } as SurveySingleItem]
        }
      };

      expect(isSurveyCompiled(survey)).toBe(true);
    });

    test('should return true for survey with only global translations', () => {
      const survey: Survey = {
        versionId: '1.0.0',
        translations: {
          'en': { 'survey1.item1': { 'root': 'Hello' } }
        },
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[]
            }
          } as SurveySingleItem]
        }
      };

      expect(isSurveyCompiled(survey)).toBe(true);
    });

    test('should return true for survey with only global dynamic values', () => {
      const survey: Survey = {
        versionId: '1.0.0',
        dynamicValues: [{
          key: 'survey1.item1-testValue',
          type: 'expression',
          expression: { name: 'getAttribute', data: [{ str: 'test' }] }
        }],
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[]
            }
          } as SurveySingleItem]
        }
      };

      expect(isSurveyCompiled(survey)).toBe(true);
    });

    test('should handle nested components correctly', () => {
      const uncompiledSurvey: Survey = {
        versionId: '1.0.0',
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [{
                role: 'responseGroup',
                key: 'rg',
                items: [{
                  role: 'input',
                  key: 'input',
                  translations: {
                    'en': { 'label': 'Enter text' }
                  }
                }]
              } as ItemGroupComponent]
            }
          } as SurveySingleItem]
        }
      };

      const compiledSurvey: Survey = {
        versionId: '1.0.0',
        translations: {
          'en': { 'survey1.item1': { 'rg.input.label': 'Enter text' } }
        },
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [{
                role: 'responseGroup',
                key: 'rg',
                items: [{
                  role: 'input',
                  key: 'input'
                }]
              } as ItemGroupComponent]
            }
          } as SurveySingleItem]
        }
      };

      expect(isSurveyCompiled(uncompiledSurvey)).toBe(false);
      expect(isSurveyCompiled(compiledSurvey)).toBe(true);
    });

    test('should handle survey groups correctly in compilation check', () => {
      const surveyGroupWithComponentData: Survey = {
        versionId: '1.0.0',
        translations: {
          'en': { 'survey1.group1.item1': { 'root': 'Hello' } }
        },
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.group1',
            items: [{
              key: 'survey1.group1.item1',
              components: {
                role: 'root',
                items: [],
                translations: {
                  'en': { 'root': 'Hello' }
                }
              }
            } as SurveySingleItem, {
              key: 'survey1.group1.item2',
              components: {
                role: 'root',
                items: []
              }
            } as SurveySingleItem]
          } as SurveyGroupItem]
        }
      };

      // Should be false because one component still has local translations
      expect(isSurveyCompiled(surveyGroupWithComponentData)).toBe(false);
    });
  });

  describe('avoiding redundant operations', () => {
    test('compileSurvey should return the same survey if already compiled', () => {
      const alreadyCompiledSurvey: Survey = {
        versionId: '1.0.0',
        translations: {
          'en': { 'survey1.item1': { 'root': 'Hello' } }
        },
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[]
            }
          } as SurveySingleItem]
        }
      };

      const result = compileSurvey(alreadyCompiledSurvey);

      // Should return the exact same object reference (no cloning performed)
      expect(result).toBe(alreadyCompiledSurvey);
    });

    test('decompileSurvey should return the same survey if already decompiled', () => {
      const alreadyDecompiledSurvey: Survey = {
        versionId: '1.0.0',
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[],
              translations: {
                'en': { 'root': 'Hello' }
              }
            }
          } as SurveySingleItem]
        }
      };

      const result = decompileSurvey(alreadyDecompiledSurvey);

      // Should return the exact same object reference (no cloning performed)
      expect(result).toBe(alreadyDecompiledSurvey);
    });

    test('compilation check should work with empty global arrays/objects', () => {
      const surveyWithEmptyGlobals: Survey = {
        versionId: '1.0.0',
        translations: {},
        dynamicValues: [],
        surveyDefinition: {
          key: 'survey1',
          items: [{
            key: 'survey1.item1',
            components: {
              role: 'root',
              items: [],
              content: [{ type: 'simple', key: 'root' }] as LocalizedContent[],
              translations: {
                'en': { 'root': 'Hello' }
              }
            }
          } as SurveySingleItem]
        }
      };

      expect(isSurveyCompiled(surveyWithEmptyGlobals)).toBe(false);
    });
  });
});
