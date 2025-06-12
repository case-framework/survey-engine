import { SurveyContextDef } from "../data_types/context";
import { Expression } from "../data_types/expression";
import { SurveyItemType, ConfidentialMode } from "./items/survey-item";
import { DynamicValue, Validation } from "../data_types/utils";
import { JsonSurveyTranslations } from "./utils/translations";

export const CURRENT_SURVEY_SCHEMA = 'https://github.com/case-framework/survey-engine/schemas/survey-schema.json';


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
  prefillRules?: Expression[];
  contextRules?: SurveyContextDef;
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


// TODO: move to survey-item.ts
export interface JsonSurveyItemBase {
  itemType: string;
  metadata?: {
    [key: string]: string;
  }

  dynamicValues?: {
    [dynamicValueKey: string]: DynamicValue;
  };
  validations?: {
    [validationKey: string]: Validation;
  };
  displayConditions?: {
    root?: Expression;
    components?: {
      [componentKey: string]: Expression;
    }
  }
  disabledConditions?: {
    components?: {
      [componentKey: string]: Expression;
    }
  }
}


export interface JsonSurveyItemGroup extends JsonSurveyItemBase {
  itemType: SurveyItemType.Group;
  items?: Array<ItemKey>;
  shuffleItems?: boolean;
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


// TODO: move to survey-item-component.ts
export interface JsonItemComponent {
  key: string; // unique identifier
  type: string; // type of the component
  styles?: {
    classNames?: string | {
      [key: string]: string;
    }
  }
  properties?: {
    [key: string]: string | number | boolean | {
      type: 'dynamicValue',
      dynamicValueKey: string;
    }
  }
  items?: Array<JsonItemComponent>;
}
