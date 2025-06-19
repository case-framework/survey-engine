import {
  AndExpressionEditor,
  ConstStringArrayEditor,
  ConstStringEditor,
  ExpressionEditor,
  ListContainsExpressionEditor,
  OrExpressionEditor,
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

export const list_contains = (list: ExpressionEditor, item: ExpressionEditor): ExpressionEditor => {
  return new ListContainsExpressionEditor(list, item);
}
