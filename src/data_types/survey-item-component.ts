import { Expression, ExpressionArg } from "./expression";
import { DynamicValue, LocalizedContent, LocalizedContentTranslation } from "./utils";

// ----------------------------------------------------------------------
export type ItemComponent = ItemComponentBase | ItemGroupComponent | ResponseComponent;

interface ItemComponentBase {
  role: string; // purpose of the component
  key?: string; // unique identifier
  displayCondition?: Expression | boolean;
  disabled?: Expression | boolean;
  style?: Array<{ key: string, value: string }>;
  properties?: ComponentProperties;

  content?: Array<LocalizedContent>;
  translations?: {
    [key: string]: LocalizedContentTranslation;
  };
  dynamicValues?: DynamicValue[];
}

export interface ResponseComponent extends ItemComponentBase {
  key: string;
  dtype?: string;
}

export interface ItemGroupComponent extends ItemComponentBase {
  items: Array<ItemComponent>;
  order?: Expression;
}

export const isItemGroupComponent = (item: ItemComponent): item is ItemGroupComponent => {
  const items = (item as ItemGroupComponent).items;
  return items !== undefined && items.length > 0;
}

export interface ComponentProperties {
  min?: ExpressionArg | number;
  max?: ExpressionArg | number;
  stepSize?: ExpressionArg | number;
  dateInputMode?: ExpressionArg | string;
  pattern?: string;
}

