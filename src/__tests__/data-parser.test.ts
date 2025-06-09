import { CURRENT_SURVEY_SCHEMA, DisplayItem, GroupItem, ItemComponentType, JsonSurvey, JsonSurveyCardProps, LocalizedContentType, Survey, SurveyItemType } from "../data_types";

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
  });
});
