import { SurveyContextDef } from "./context";
import { Expression, ExpressionArg } from "./expression";
import { SurveyItemType } from "./survey-item";
import { ConfidentialMode } from "./survey-item-component";
import { DynamicValue, LocalizedContent, LocalizedContentTranslation, Validation } from "./utils";

export const CURRENT_SURVEY_SCHEMA = 'https://github.com/case-framework/survey-engine/schemas/survey-schema.json';

export interface SurveyVersion {
  id?: string;
  surveyKey: string;
  published?: number;
  unpublished?: number;
  versionId?: string;
  survey: JsonSurvey;
}

export type JsonSurvey = {
  $schema: string;
  prefillRules?: Expression[];
  contextRules?: SurveyContextDef;
  maxItemsPerPage?: { large: number, small: number };
  availableFor?: string;
  requireLoginBeforeSubmission?: boolean;

  surveyDefinition?: JsonSurveyItemGroup;

  metadata?: {
    [key: string]: string
  }

  translations?: {
    [locale: string]: {
      surveyCardProps: JsonSurveyCardProps;
      [key: string]: JsonSurveyCardProps | LocalizedContentTranslation;
    }
  };
  dynamicValues?: {
    [itemKey: string]: {
      [dynamicValueKey: string]: DynamicValue;
    }
  };
  validations?: {
    [itemKey: string]: {
      [validationKey: string]: Validation;
    };
  };
  displayConditions?: {
    [itemKey: string]: {
      root?: Expression;
      components?: {
        [componentKey: string]: Expression;
      }
    }
  }
  disabledConditions?: {
    [itemKey: string]: {
      components?: {
        [componentKey: string]: Expression;
      }
    }
  }
}

export interface JsonSurveyCardProps {
  name?: LocalizedContent;
  description?: LocalizedContent;
  typicalDuration?: LocalizedContent;
}

export interface JsonSurveyItemBase {
  key: string;
  itemType: string;
  metadata?: {
    [key: string]: string;
  }
  follows?: Array<string>;
  priority?: number; // can be used to sort items in the list
}

export interface JsonSurveyItemGroup extends JsonSurveyItemBase {
  itemType: SurveyItemType.Group;
  items?: Array<JsonSurveyItem>;
  selectionMethod?: Expression;
}

export interface JsonSurveyDisplayItem extends JsonSurveyItemBase {
  itemType: SurveyItemType.Display;
  components: Array<JsonItemComponent>;
}

export interface JsonSurveyPageBreakItem extends JsonSurveyItemBase {
  itemType: SurveyItemType.PageBreak;
}

export interface JsonSurveyEndItem extends JsonSurveyItemBase {
  itemType: SurveyItemType.SurveyEnd;
}

export interface JsonSurveyResponseItem extends JsonSurveyItemBase {
  header?: {
    title?: JsonItemComponent;
    subtitle?: JsonItemComponent;
    helpPopover?: JsonItemComponent;
  }
  body?: {
    topContent?: Array<JsonItemComponent>;
    bottomContent?: Array<JsonItemComponent>;
  }
  footer?: JsonItemComponent;
  confidentiality?: {
    mode: ConfidentialMode;
    mapToKey?: string;
  }

  responseConfig: JsonItemComponent;
}

export type JsonSurveyItem = JsonSurveyItemGroup | JsonSurveyDisplayItem | JsonSurveyPageBreakItem | JsonSurveyEndItem | JsonSurveyResponseItem;


export interface JsonItemComponent {
  key: string; // unique identifier
  type: string; // type of the component
  styles?: {
    classNames?: string | {
      [key: string]: string;
    }
  }
  properties?: {
    [key: string]: string | number | boolean | ExpressionArg;
  }
  items?: Array<JsonItemComponent>;
  order?: Expression;
}