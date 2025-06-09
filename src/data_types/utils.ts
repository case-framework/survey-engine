import { Expression } from "./expression";

// ----------------------------------------------------------------------


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
