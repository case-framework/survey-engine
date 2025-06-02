import { Expression } from "./expression";

// ----------------------------------------------------------------------
export type LocalizedContentType = 'simple' | 'CQM' | 'md';

export type LocalizedContent = {
  type: LocalizedContentType;
  key: string;
  resolvedText?: string;
}

export type LocalizedContentTranslation = {
  [key: string]: string;
}

// ----------------------------------------------------------------------
export type DynamicValueTypes = 'expression' | 'date';

export type DynamicValueBase = {
  key: string;
  type: DynamicValueTypes;
  expression?: Expression;
  resolvedValue?: string;
}

export type DynamicValueExpression = DynamicValueBase & {
  type: 'expression';
}

export type DynamicValueDate = DynamicValueBase & {
  type: 'date';
  dateFormat: string;
}

export type DynamicValue = DynamicValueExpression | DynamicValueDate;
