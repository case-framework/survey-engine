/*
TODO:
import { convertLegacyToNewSurvey, convertNewToLegacySurvey } from '../legacy-conversion';
import {
  LegacySurvey,
  LegacySurveyGroupItem,
  LegacySurveySingleItem,
  LegacyItemGroupComponent,
  LegacyResponseComponent
} from '../data_types/legacy-types';
import {
  Survey,
  SurveyGroupItem,
  SurveySingleItem,
  ItemGroupComponent,
  ResponseComponent,
  LocalizedContent
} from '../data_types';

describe('Legacy Conversion Tests', () => {

  test('convertLegacyToNewSurvey should convert basic legacy survey structure', () => {
    const legacySurvey: LegacySurvey = {
      versionId: '1.0.0',
      id: 'survey1',
      surveyDefinition: {
        key: 'survey1',
        items: [{
          key: 'survey1.question1',
          components: {
            role: 'root',
            items: [],
            content: [{
              code: 'en',
              parts: [{ str: 'What is your name?', dtype: 'str' }]
            }, {
              code: 'es',
              parts: [{ str: '¿Cuál es tu nombre?', dtype: 'str' }]
            }]
          },
          validations: [{
            key: 'required',
            type: 'hard',
            rule: { name: 'hasResponse' }
          }]
        } as LegacySurveySingleItem]
      } as LegacySurveyGroupItem
    };

    const newSurvey = convertLegacyToNewSurvey(legacySurvey);

    expect(newSurvey.versionId).toBe('1.0.0');
    expect(newSurvey.id).toBe('survey1');
    expect(newSurvey.surveyDefinition.key).toBe('survey1');
    expect(newSurvey.surveyDefinition.items).toHaveLength(1);

    const singleItem = newSurvey.surveyDefinition.items[0] as SurveySingleItem;
    expect(singleItem.key).toBe('survey1.question1');
    expect(singleItem.validations).toHaveLength(1);
    expect(singleItem.validations![0].key).toBe('required');

    // Check that translations were extracted correctly
    expect(singleItem.components?.translations).toBeDefined();
    expect(singleItem.components?.translations!['en']).toBeDefined();
    expect(singleItem.components?.translations!['es']).toBeDefined();
  });

  test('convertNewToLegacySurvey should convert new survey back to legacy format', () => {
    const newSurvey: Survey = {
      schemaVersion: 1,
      versionId: '1.0.0',
      id: 'test-survey',
      surveyDefinition: {
        key: 'root',
        items: [{
          key: 'question1',
          type: 'test',
          components: {
            role: 'root',
            items: [],
            content: [{ type: 'plain', key: 'questionText' }] as LocalizedContent[],
            translations: {
              'en': { 'questionText': 'What is your name?' },
              'es': { 'questionText': '¿Cuál es tu nombre?' }
            }
          },
          validations: [{
            key: 'required',
            type: 'hard',
            rule: { name: 'hasResponse' }
          }]
        } as SurveySingleItem]
      } as SurveyGroupItem
    };

    const legacySurvey = convertNewToLegacySurvey(newSurvey);

    expect(legacySurvey.versionId).toBe('1.0.0');
    expect(legacySurvey.id).toBe('test-survey');
    expect(legacySurvey.surveyDefinition.key).toBe('root');
    expect(legacySurvey.surveyDefinition.items).toHaveLength(1);

    const singleItem = legacySurvey.surveyDefinition.items[0] as LegacySurveySingleItem;
    expect(singleItem.key).toBe('question1');
    expect(singleItem.type).toBe('test');
    expect(singleItem.validations).toHaveLength(1);
    expect(singleItem.validations![0].key).toBe('required');

    // Check that content was converted correctly
    expect(singleItem.components?.content).toBeDefined();
    expect(singleItem.components?.content).toHaveLength(1);
    expect(singleItem.components?.content![0].code).toBe('en');
    expect(singleItem.components?.content![0].parts).toHaveLength(1);
    expect(singleItem.components?.content![0].parts![0].str).toBe('What is your name?');
    expect(singleItem.components?.content![0].parts![0].dtype).toBe('str');
  });

  test('should handle nested component structures during conversion', () => {
    const legacySurvey: LegacySurvey = {
      versionId: '2.0.0',
      surveyDefinition: {
        key: 'survey1',
        items: [{
          key: 'survey1.question1',
          components: {
            role: 'root',
            items: [{
              role: 'responseGroup',
              key: 'rg1',
              items: [{
                role: 'input',
                key: 'textInput',
                dtype: 'string'
              } as LegacyResponseComponent],
              content: [{
                code: 'en',
                parts: [{ str: 'Response Group Label', dtype: 'str' }],
                resolvedText: 'Response Group Label'
              }]
            } as LegacyItemGroupComponent],
            content: [{
              code: 'en',
              parts: [{ str: 'Root Question', dtype: 'str' }],
              resolvedText: 'Root Question'
            }]
          }
        } as LegacySurveySingleItem]
      } as LegacySurveyGroupItem
    };

    const newSurvey = convertLegacyToNewSurvey(legacySurvey);
    const singleItem = newSurvey.surveyDefinition.items[0] as SurveySingleItem;
    const rootComponent = singleItem.components as ItemGroupComponent;

    expect(rootComponent.items).toHaveLength(1);
    expect(rootComponent.translations!['en']).toBeDefined();

    const responseGroup = rootComponent.items[0] as ItemGroupComponent;
    expect(responseGroup.role).toBe('responseGroup');
    expect(responseGroup.key).toBe('rg1');
    expect(responseGroup.items).toHaveLength(1);
    expect(responseGroup.translations!['en']).toBeDefined();

    const inputComponent = responseGroup.items[0] as ResponseComponent;
    expect(inputComponent.role).toBe('input');
    expect(inputComponent.key).toBe('textInput');
    expect(inputComponent.dtype).toBe('string');
  });

  test('should preserve survey props during conversion', () => {
    const legacySurvey: LegacySurvey = {
      versionId: '1.0.0',
      props: {
        name: [{
          code: 'en',
          parts: [{ str: 'Test Survey', dtype: 'str' }],
        }],
        description: [{
          code: 'en',
          parts: [{ str: 'A test survey description', dtype: 'str' }],
        }]
      },
      surveyDefinition: {
        key: 'root',
        items: []
      } as LegacySurveyGroupItem
    };

    const newSurvey = convertLegacyToNewSurvey(legacySurvey);

    expect(newSurvey.props).toBeDefined();
    expect(newSurvey.props!.name).toBeDefined();
    expect(newSurvey.props!.description).toBeDefined();
    expect(newSurvey.props!.name!.key).toBe('Test Survey');
    expect(newSurvey.props!.description!.key).toBe('A test survey description');
  });

  test('should handle survey groups correctly', () => {
    const legacySurvey: LegacySurvey = {
      versionId: '1.0.0',
      surveyDefinition: {
        key: 'root',
        items: [{
          key: 'group1',
          items: [{
            key: 'question1',
            type: 'test'
          } as LegacySurveySingleItem, {
            key: 'question2',
            type: 'test'
          } as LegacySurveySingleItem]
        } as LegacySurveyGroupItem]
      } as LegacySurveyGroupItem
    };

    const newSurvey = convertLegacyToNewSurvey(legacySurvey);
    const group = newSurvey.surveyDefinition.items[0] as SurveyGroupItem;

    expect(group.key).toBe('group1');
    expect(group.items).toHaveLength(2);
    expect((group.items[0] as SurveySingleItem).key).toBe('question1');
    expect((group.items[1] as SurveySingleItem).key).toBe('question2');
  });

  test('conversion should be reversible for basic structures', () => {
    const originalLegacy: LegacySurvey = {
      versionId: '1.0.0',
      id: 'reversible-test',
      surveyDefinition: {
        key: 'root',
        items: [{
          key: 'question1',
          type: 'test',
          components: {
            role: 'root',
            items: [],
            content: [{
              code: 'en',
              parts: [{ str: 'Test Question', dtype: 'str' }],
              resolvedText: 'Test Question'
            }]
          }
        } as LegacySurveySingleItem]
      } as LegacySurveyGroupItem
    };

    // Legacy -> New -> Legacy
    const converted = convertLegacyToNewSurvey(originalLegacy);
    const backToLegacy = convertNewToLegacySurvey(converted);

    expect(backToLegacy.versionId).toBe(originalLegacy.versionId);
    expect(backToLegacy.id).toBe(originalLegacy.id);
    expect(backToLegacy.surveyDefinition.key).toBe(originalLegacy.surveyDefinition.key);
    expect(backToLegacy.surveyDefinition.items).toHaveLength(1);

    const item = backToLegacy.surveyDefinition.items[0] as LegacySurveySingleItem;
    expect(item.key).toBe('question1');
    expect(item.type).toBe('test');
  });

  test('should always set schemaVersion to 1 when converting from legacy', () => {
    const minimalLegacySurvey: LegacySurvey = {
      versionId: '1.0.0',
      surveyDefinition: {
        key: 'root',
        items: []
      } as LegacySurveyGroupItem
    };

    const newSurvey = convertLegacyToNewSurvey(minimalLegacySurvey);

    expect(newSurvey.schemaVersion).toBe(1);
  });

  test('should handle survey props with multiple language translations', () => {
    const legacySurvey: LegacySurvey = {
      versionId: '1.0.0',
      props: {
        name: [{
          code: 'en',
          parts: [{ str: 'English Survey Name', dtype: 'str' }],
          resolvedText: 'English Survey Name'
        }, {
          code: 'es',
          parts: [{ str: 'Nombre de Encuesta en Español', dtype: 'str' }],
          resolvedText: 'Nombre de Encuesta en Español'
        }],
        description: [{
          code: 'en',
          parts: [{ str: 'English Description', dtype: 'str' }],
          resolvedText: 'English Description'
        }, {
          code: 'es',
          parts: [{ str: 'Descripción en Español', dtype: 'str' }],
          resolvedText: 'Descripción en Español'
        }]
      },
      surveyDefinition: {
        key: 'root',
        items: []
      } as LegacySurveyGroupItem
    };

    const newSurvey = convertLegacyToNewSurvey(legacySurvey);

    // Check that props translations were extracted correctly
    expect(newSurvey.props?.translations).toBeDefined();
    expect(newSurvey.props?.translations!['en']).toEqual({
      name: 'English Survey Name',
      description: 'English Description'
    });
    expect(newSurvey.props?.translations!['es']).toEqual({
      name: 'Nombre de Encuesta en Español',
      description: 'Descripción en Español'
    });

    // Check that content keys were set correctly
    expect(newSurvey.props?.name?.key).toBe('English Survey Name');
    expect(newSurvey.props?.description?.key).toBe('English Description');

    // Test conversion back to legacy
    const backToLegacy = convertNewToLegacySurvey(newSurvey);
    expect(backToLegacy.props?.name).toHaveLength(2);
    expect(backToLegacy.props?.description).toHaveLength(2);

    // Verify both languages are preserved
    const nameEn = backToLegacy.props?.name?.find(n => n.code === 'en');
    const nameEs = backToLegacy.props?.name?.find(n => n.code === 'es');
    expect(nameEn?.resolvedText).toBe('English Survey Name');
    expect(nameEs?.resolvedText).toBe('Nombre de Encuesta en Español');
  });
});
 */