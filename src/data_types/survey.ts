import { DynamicValue, LocalizedContent, LocalizedContentTranslation, SurveyGroupItem } from ".";
import { Expression } from "./expression";
import { SurveyContextDef } from "./context";

export interface Survey {
  id?: string;
  schemaVersion: number;
  props?: SurveyProps;
  prefillRules?: Expression[];
  contextRules?: SurveyContextDef;
  maxItemsPerPage?: { large: number, small: number };
  availableFor?: string;
  requireLoginBeforeSubmission?: boolean;
  //
  surveyDefinition: SurveyGroupItem;
  published?: number;
  unpublished?: number;
  versionId: string;
  metadata?: {
    [key: string]: string
  }
  translations?: {
    [key: string]: {
      [key: string]: LocalizedContentTranslation;
    };
  },
  dynamicValues?: DynamicValue[];
}

export interface SurveyProps {
  name?: LocalizedContent;
  description?: LocalizedContent;
  typicalDuration?: LocalizedContent;
  translations?: {
    [key: string]: {
      name?: string;
      description?: string;
      typicalDuration?: string;
    };
  }
}
