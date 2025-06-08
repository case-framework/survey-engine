import { Expression } from "./expression";

// ----------------------------------------------------------------------
export enum LocalizedContentType {
  CQM = 'CQM',
  md = 'md'
}

export enum AttributionType {
  style = 'style',
  template = 'template'
}

export type Attribution = {
  type: AttributionType;
  // TODO
}

export type LocalizedCQMContent = {
  type: LocalizedContentType.CQM;
  content: string;
  attributions: Array<Attribution>;
}

export type LocalizedMDContent = {
  type: LocalizedContentType.md;
  content: string;
}

export type LocalizedContent = LocalizedCQMContent | LocalizedMDContent;

export type LocalizedContentTranslation = {
  [contentKey: string]: LocalizedContent;
}

// ----------------------------------------------------------------------
export enum DynamicValueTypes {
  Expression = 'expression',
  Date = 'date'
}


export type DynamicValueBase = {
  type: DynamicValueTypes;
  expression?: Expression;
}

export type DynamicValueExpression = DynamicValueBase & {
  type: DynamicValueTypes.Expression;
}

export type DynamicValueDate = DynamicValueBase & {
  type: DynamicValueTypes.Date;
  dateFormat: string;
}

export type DynamicValue = DynamicValueExpression | DynamicValueDate;

// ----------------------------------------------------------------------

export enum ValidationType {
  Soft = 'soft',
  Hard = 'hard'
}

export interface Validation {
  key: string;
  type: ValidationType; // hard or softvalidation
  rule: Expression;
}
