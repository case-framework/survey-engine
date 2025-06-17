import { JsonExpression } from "../../expressions";
import { JsonItemComponent } from "../survey-file-schema";
import { JsonDynamicValue } from "../../expressions/dynamic-value";
import { ConfidentialMode, SurveyItemType } from "./types";


export interface JsonSurveyItemBase {
  itemType: string;
  metadata?: {
    [key: string]: string;
  }

  dynamicValues?: {
    [dynamicValueKey: string]: JsonDynamicValue;
  };
  validations?: {
    [validationKey: string]: JsonExpression;
  };
  displayConditions?: {
    root?: JsonExpression;
    components?: {
      [componentKey: string]: JsonExpression;
    }
  }
  disabledConditions?: {
    components?: {
      [componentKey: string]: JsonExpression;
    }
  }
}


export interface JsonSurveyItemGroup extends JsonSurveyItemBase {
  itemType: SurveyItemType.Group;
  items?: Array<string>;
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

export interface JsonSurveyQuestionItem extends JsonSurveyItemBase {
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

export type JsonSurveyItem = JsonSurveyItemGroup | JsonSurveyDisplayItem | JsonSurveyPageBreakItem | JsonSurveyEndItem | JsonSurveyQuestionItem;
