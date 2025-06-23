import { ExpectedValueType } from "../survey";
import {
  AndExpressionEditor,
  ConstStringArrayEditor,
  ConstStringEditor,
  ExpressionEditor,
  StrListContainsExpressionEditor,
  OrExpressionEditor,
  ResponseVariableEditor,
  ConstNumberArrayEditor,
  ConstNumberEditor,
  ConstBooleanEditor,
  ConstDateEditor,
  ConstDateArrayEditor,
  StrEqExpressionEditor,
  EqExpressionEditor,
  GtExpressionEditor,
  GteExpressionEditor,
  LteExpressionEditor,
  LtExpressionEditor,
} from "./expression-editor";

// ================================
// CONST EXPRESSIONS
// ================================
export const const_string_array = (...values: string[]): ExpressionEditor => {
  return new ConstStringArrayEditor(values);
}

export const const_string = (value: string): ExpressionEditor => {
  return new ConstStringEditor(value);
}

export const const_number_array = (...values: number[]): ExpressionEditor => {
  return new ConstNumberArrayEditor(values);
}

export const const_number = (value: number): ExpressionEditor => {
  return new ConstNumberEditor(value);
}

export const const_boolean = (value: boolean): ExpressionEditor => {
  return new ConstBooleanEditor(value);
}

export const const_date = (value: Date): ExpressionEditor => {
  return new ConstDateEditor(value);
}

export const const_date_array = (...values: Date[]): ExpressionEditor => {
  return new ConstDateArrayEditor(values);
}


// ================================
// RESPONSE VARIABLE EXPRESSIONS
// ================================
export const response_string = (valueRef: string): ExpressionEditor => {
  return new ResponseVariableEditor(valueRef, ExpectedValueType.String);
}

export const response_string_array = (valueRef: string): ExpressionEditor => {
  return new ResponseVariableEditor(valueRef, ExpectedValueType.StringArray);
}

export const response_number = (valueRef: string): ExpressionEditor => {
  return new ResponseVariableEditor(valueRef, ExpectedValueType.Number);
}

export const response_boolean = (valueRef: string): ExpressionEditor => {
  return new ResponseVariableEditor(valueRef, ExpectedValueType.Boolean);
}

export const response_date = (valueRef: string): ExpressionEditor => {
  return new ResponseVariableEditor(valueRef, ExpectedValueType.Date);
}

export const response_number_array = (valueRef: string): ExpressionEditor => {
  return new ResponseVariableEditor(valueRef, ExpectedValueType.NumberArray);
}

export const response_date_array = (valueRef: string): ExpressionEditor => {
  return new ResponseVariableEditor(valueRef, ExpectedValueType.DateArray);
}

// ================================
// LOGIC EXPRESSIONS
// ================================
export const and = (...args: ExpressionEditor[]): ExpressionEditor => {
  return new AndExpressionEditor(args);
}

export const or = (...args: ExpressionEditor[]): ExpressionEditor => {
  return new OrExpressionEditor(args);
}


// ================================
// LIST EXPRESSIONS
// ================================

export const str_list_contains = (list: ExpressionEditor, item: ExpressionEditor): ExpressionEditor => {
  return new StrListContainsExpressionEditor(list, item);
}

// ================================
// STRING EXPRESSIONS
// ================================

export const str_eq = (a: ExpressionEditor, b: ExpressionEditor): ExpressionEditor => {
  return new StrEqExpressionEditor(a, b);
}

// ================================
// NUMBER EXPRESSIONS
// ================================

export const eq = (a: ExpressionEditor, b: ExpressionEditor): ExpressionEditor => {
  return new EqExpressionEditor(a, b);
}

export const gt = (a: ExpressionEditor, b: ExpressionEditor): ExpressionEditor => {
  return new GtExpressionEditor(a, b);
}

export const gte = (a: ExpressionEditor, b: ExpressionEditor): ExpressionEditor => {
  return new GteExpressionEditor(a, b);
}

export const lt = (a: ExpressionEditor, b: ExpressionEditor): ExpressionEditor => {
  return new LtExpressionEditor(a, b);
}

export const lte = (a: ExpressionEditor, b: ExpressionEditor): ExpressionEditor => {
  return new LteExpressionEditor(a, b);
}
