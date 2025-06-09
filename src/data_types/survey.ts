import { SurveyContextDef } from "./context";
import { Expression } from "./expression";
import { CURRENT_SURVEY_SCHEMA, JsonSurvey, SurveyTranslations } from "./survey-file-schema";
import { GroupItem, SurveyItem } from "./survey-item";



abstract class SurveyBase {
  prefillRules?: Expression[];
  contextRules?: SurveyContextDef;
  maxItemsPerPage?: { large: number, small: number };
  availableFor?: string;
  requireLoginBeforeSubmission?: boolean;

  metadata?: {
    [key: string]: string
  }
}


export class Survey extends SurveyBase {
  surveyItems: {
    [itemKey: string]: SurveyItem;
  } = {};

  translations?: SurveyTranslations;


  constructor(key: string = 'survey') {
    super();
    this.surveyItems = {
      [key]: new GroupItem(key),
    };
  }

  static fromJson(json: object): Survey {
    const survey = new Survey();
    const rawSurvey = json as JsonSurvey;
    if (!rawSurvey.surveyItems || Object.keys(rawSurvey.surveyItems).length === 0) {
      throw new Error('surveyItems is required');
    }
    if (rawSurvey.$schema !== CURRENT_SURVEY_SCHEMA) {
      throw new Error(`Unsupported survey schema: ${rawSurvey.$schema}`);
    }

    survey.surveyItems = {}
    Object.keys(rawSurvey.surveyItems).forEach(itemFullKey => {
      survey.surveyItems[itemFullKey] = SurveyItem.fromJson(itemFullKey, rawSurvey.surveyItems[itemFullKey]);
    });

    // Parse other fields
    if (rawSurvey.translations) {
      survey.translations = rawSurvey.translations;
    }
    if (rawSurvey.prefillRules) {
      survey.prefillRules = rawSurvey.prefillRules;
    }
    if (rawSurvey.contextRules) {
      survey.contextRules = rawSurvey.contextRules;
    }
    if (rawSurvey.maxItemsPerPage) {
      survey.maxItemsPerPage = rawSurvey.maxItemsPerPage;
    }
    if (rawSurvey.availableFor) {
      survey.availableFor = rawSurvey.availableFor;
    }
    if (rawSurvey.requireLoginBeforeSubmission !== undefined) {
      survey.requireLoginBeforeSubmission = rawSurvey.requireLoginBeforeSubmission;
    }
    if (rawSurvey.metadata) {
      survey.metadata = rawSurvey.metadata;
    }

    return survey;
  }

  toJson(): JsonSurvey {
    const json: JsonSurvey = {
      $schema: CURRENT_SURVEY_SCHEMA,
      surveyItems: Object.fromEntries(Object.entries(this.surveyItems).map(([itemFullKey, item]) => [itemFullKey, item.toJson()])),
    };

    // Export other fields
    if (this.translations) {
      json.translations = this.translations as SurveyTranslations;
    }
    if (this.prefillRules) {
      json.prefillRules = this.prefillRules;
    }
    if (this.contextRules) {
      json.contextRules = this.contextRules;
    }
    if (this.maxItemsPerPage) {
      json.maxItemsPerPage = this.maxItemsPerPage;
    }
    if (this.availableFor) {
      json.availableFor = this.availableFor;
    }
    if (this.requireLoginBeforeSubmission !== undefined) {
      json.requireLoginBeforeSubmission = this.requireLoginBeforeSubmission;
    }
    if (this.metadata) {
      json.metadata = this.metadata;
    }

    return json;
  }

  get locales(): string[] {
    return Object.keys(this.translations || {});
  }
}