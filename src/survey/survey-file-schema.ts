import { JsonSurveyItem } from "./items";
import { JsonSurveyTranslations } from "./utils/translations";

export const CURRENT_SURVEY_SCHEMA = 'https://github.com/case-framework/survey-engine/schemas/survey-schema.json';
// TODO: generate schema from survey-engine.ts

export interface SurveyVersion {
  id?: string;
  surveyKey: string;
  published?: number;
  unpublished?: number;
  versionId?: string;
  survey: JsonSurvey;
}

type ItemKey = string;

export type JsonSurvey = {
  $schema: string;
  maxItemsPerPage?: { large: number, small: number };
  availableFor?: string;
  requireLoginBeforeSubmission?: boolean;

  surveyItems: {
    [itemKey: ItemKey]: JsonSurveyItem;
  }

  metadata?: {
    [key: string]: string
  }

  translations?: JsonSurveyTranslations;
}
