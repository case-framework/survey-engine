import { DynamicValue, LocalizedContent, LocalizedContentTranslation, SurveyGroupItem } from ".";
import { Expression } from "./expression";
import { SurveyContextDef } from "./context";

export interface Survey {
  id?: string;
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
    [key: string]: LocalizedContentTranslation;
  },
  dynamicValues?: DynamicValue[];
}

export interface SurveyProps {
  name?: LocalizedContent[];
  description?: LocalizedContent[];
  typicalDuration?: LocalizedContent[];
}
