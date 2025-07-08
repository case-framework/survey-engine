import { Expression } from "./expression";
import { ExpressionArg } from "./expression";

// ----------------------------------------------------------------------
export type LegacyItemComponent = LegacyItemComponentBase | LegacyItemGroupComponent | LegacyResponseComponent;

interface LegacyItemComponentBase {
  role: string; // purpose of the component
  key?: string; // unique identifier
  content?: Array<LegacyLocalizedObject>; // array with item that are a sub-type of LocalizedObject
  displayCondition?: Expression | boolean;
  disabled?: Expression | boolean;
  style?: Array<{ key: string, value: string }>;
  description?: Array<LegacyLocalizedObject>; // optional explanation to the content
  properties?: LegacyComponentProperties;
}

export interface LegacyResponseComponent extends LegacyItemComponentBase {
  key: string;
  dtype?: string;
}

export interface LegacyItemGroupComponent extends LegacyItemComponentBase {
  items: Array<LegacyItemComponent>;
  order?: Expression;
}

export const isLegacyItemGroupComponent = (item: LegacyItemComponent): item is LegacyItemGroupComponent => {
  const items = (item as LegacyItemGroupComponent).items;
  return items !== undefined && items.length > 0;
}

export interface LegacyComponentProperties {
  min?: ExpressionArg | number;
  max?: ExpressionArg | number;
  stepSize?: ExpressionArg | number;
  dateInputMode?: ExpressionArg | string;
  pattern?: string;
}

// ----------------------------------------------------------------------
export type LegacyLocalizedObject = LegacyLocalizedString;

export interface LegacyLocalizedObjectBase {
  code: string;
}

export interface LegacyLocalizedString extends LegacyLocalizedObjectBase {
  parts: Array<ExpressionArg>
  resolvedText?: string;
}


export interface LegacySurvey {
  id?: string;
  props?: LegacySurveyProps;
  prefillRules?: Expression[];
  //contextRules?: SurveyContextDef;
  maxItemsPerPage?: { large: number, small: number };
  availableFor?: string;
  requireLoginBeforeSubmission?: boolean;
  //
  surveyDefinition: LegacySurveyGroupItem;
  published?: number;
  unpublished?: number;
  versionId: string;
  metadata?: {
    [key: string]: string
  }
}


export interface LegacySurveyProps {
  name?: LegacyLocalizedObject[];
  description?: LegacyLocalizedObject[];
  typicalDuration?: LegacyLocalizedObject[];
}

interface LegacySurveyItemBase {
  key: string;
  metadata?: {
    [key: string]: string
  }
  follows?: Array<string>;
  condition?: Expression;
  priority?: number; // can be used to sort items in the list
}

export type LegacySurveyItem = LegacySurveyGroupItem | LegacySurveySingleItem;

// ----------------------------------------------------------------------
export interface LegacySurveyGroupItem extends LegacySurveyItemBase {
  items: Array<LegacySurveyItem>;
  selectionMethod?: Expression; // what method to use to pick next item if ambigous - default uniform random
}

export const isLegacySurveyGroupItem = (item: LegacySurveyItem): item is LegacySurveyGroupItem => {
  const items = (item as LegacySurveyGroupItem).items;
  return items !== undefined && items.length > 0;
}

// ----------------------------------------------------------------------
// Single Survey Items:
export type LegacySurveyItemTypes =
  'pageBreak' | 'test' | 'surveyEnd'
  ;

export interface LegacySurveySingleItem extends LegacySurveyItemBase {
  type?: LegacySurveyItemTypes;
  components?: LegacyItemGroupComponent; // any sub-type of ItemComponent
  validations?: Array<LegacyValidation>;
  confidentialMode?: LegacyConfidentialMode;
  mapToKey?: string; // if the response should be mapped to another key in confidential mode
}

export interface LegacyValidation {
  key: string;
  type: 'soft' | 'hard'; // hard or softvalidation
  rule: Expression | boolean;
}

export type LegacyConfidentialMode = 'add' | 'replace';
