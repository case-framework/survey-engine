import { JsonSurvey, JsonSurveyCardProps, LocalizedContentType, Survey, SurveyEditor, SurveyItemType } from "../data_types";

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
  $schema: 'https://github.com/case-framework/survey-engine/schemas/survey-schema.json',
  surveyDefinition: {
    key: 'survey',
    itemType: SurveyItemType.Group,
    items: [
      {
        key: 'group1',
        itemType: SurveyItemType.Group,
      }
    ]
  },
  translations: {
    en: {
      surveyCardProps: surveyCardProps
    }
  }
}

describe('Data Parsing', () => {
  describe('Read Survey from JSON', () => {
    test('should parse survey attributes', () => {
      const survey = JsonSurvey.fromJson(surveyJson);
      expect(survey.$schema).toBe('https://github.com/case-framework/survey-engine/schemas/survey-schema.json');
    });


    test('should parse survey definition', () => {
      const survey = Survey.fromJson(surveyJson);
      expect(survey.surveyDefinition).toBeDefined();
      expect(survey.surveyDefinition?.key.fullKey).toBe(surveyJson.surveyDefinition?.key);
      expect(survey.surveyDefinition?.itemType).toBe(SurveyItemType.Group);
    });
  });

  describe('Read Survey for editing', () => {
    test('should parse survey definition', () => {
      const surveyEditor = SurveyEditor.fromSurvey(Survey.fromJson(surveyJson));



      expect(surveyEditor.surveyDefinition).toBeDefined();
      expect(surveyEditor.surveyDefinition?.key.fullKey).toBe(surveyJson.surveyDefinition?.key);
      expect(surveyEditor.surveyDefinition?.itemType).toBe(SurveyItemType.Group);
    });
  });





});
