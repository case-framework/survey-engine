import { CURRENT_SURVEY_SCHEMA, DisplayItem, GroupItem, ItemComponentType, JsonSurvey, JsonSurveyCardProps, LocalizedContentType, Survey, SurveyEditor, SurveyItemType } from "../data_types";

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
  surveyDefinition: {
    key: 'survey',
    itemType: SurveyItemType.Group,
    items: [
      {
        key: 'group1',
        itemType: SurveyItemType.Group,
        items: [
          {
            key: 'display1',
            itemType: SurveyItemType.Display,
            components: [
              {
                key: 'comp1',
                type: ItemComponentType.Display,
                styles: {}
              }
            ]
          }
        ]
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
    test('should throw error if schema is not supported', () => {
      const surveyJson = {
        $schema: CURRENT_SURVEY_SCHEMA + '1',
        surveyDefinition: {
          key: 'survey',
          itemType: SurveyItemType.Group,
        }
      }
      expect(() => Survey.fromJson(surveyJson)).toThrow('Unsupported survey schema');
    });

    test('should throw error if survey definition is not present', () => {
      const surveyJson = {
        $schema: CURRENT_SURVEY_SCHEMA,
      }
      expect(() => Survey.fromJson(surveyJson)).toThrow('surveyDefinition is required');
    });


    test('should parse survey definition', () => {
      const survey = Survey.fromJson(surveyJson);
      expect(survey.surveyDefinition).toBeDefined();
      expect(survey.surveyDefinition?.key.fullKey).toBe(surveyJson.surveyDefinition?.key);
      expect(survey.surveyDefinition?.itemType).toBe(SurveyItemType.Group);
      expect(survey.surveyDefinition?.items).toBeDefined();
      expect(survey.surveyDefinition?.items?.length).toBeGreaterThan(0);

      // Group item
      const groupItem = survey.surveyDefinition?.items?.[0] as GroupItem;
      expect(groupItem).toBeDefined();
      expect(groupItem.key.itemKey).toBe('group1');
      expect(groupItem.key.fullKey).toBe('survey.group1');
      expect(groupItem.itemType).toBe(SurveyItemType.Group);

      // Display item
      const displayItem = groupItem.items?.[0] as DisplayItem;
      expect(displayItem).toBeDefined();
      expect(displayItem.key.fullKey).toBe('survey.group1.display1');
      expect(displayItem.itemType).toBe(SurveyItemType.Display);
      expect(displayItem.components).toBeDefined();
      expect(displayItem.components?.length).toBeGreaterThan(0);
      expect(displayItem.components?.[0]?.key.fullKey).toBe('comp1');
      expect(displayItem.components?.[0]?.key.parentItemKey.fullKey).toBe('survey.group1.display1');
      expect(displayItem.components?.[0]?.componentType).toBe(ItemComponentType.Display);
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


  describe('Export Survey to JSON', () => {
    const surveyEditor = SurveyEditor.fromSurvey(Survey.fromJson(surveyJson));

    test('should export survey definition', () => {
      const json = surveyEditor.getSurvey().toJson();
      expect(json).toBeDefined();
      expect(json.surveyDefinition).toBeDefined();
      expect(json.surveyDefinition?.key).toBe(surveyJson.surveyDefinition?.key);
      expect(json.surveyDefinition?.itemType).toBe(SurveyItemType.Group);
      expect(json.surveyDefinition?.items).toBeDefined();
      expect(json.surveyDefinition?.items?.length).toBeGreaterThan(0);
      expect(json.surveyDefinition?.items?.[0]?.key).toBe('group1');
      expect(json.surveyDefinition?.items?.[0]?.itemType).toBe(SurveyItemType.Group);
    });

  });




});
