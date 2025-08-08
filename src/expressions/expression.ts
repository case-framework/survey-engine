import { ValueReference } from "../survey/utils/value-reference";
import { ExpectedValueType, ValueType } from "../survey/utils/types";
import { SurveyItemKey } from "../survey/item-component-key";


export enum ExpressionType {
  Const = 'const',
  ResponseVariable = 'responseVariable',
  ContextVariable = 'contextVariable',
  Function = 'function',
}

export enum ContextVariableType {
  Locale = 'locale',
  ParticipantFlag = 'participantFlag',
  CustomValue = 'customValue',
  CustomExpression = 'customExpression'
}

export interface ExpressionEditorConfig {
  usedTemplate?: string;
}

export interface JsonConstExpression {
  type: ExpressionType.Const;
  value?: ValueType;

  editorConfig?: ExpressionEditorConfig;
}

export interface JsonResponseVariableExpression {
  type: ExpressionType.ResponseVariable;
  variableRef: string;

  editorConfig?: ExpressionEditorConfig;
}

export interface JsonContextVariableExpression {
  type: ExpressionType.ContextVariable;

  contextType: ContextVariableType;
  key?: JsonExpression;
  arguments?: Array<JsonExpression | undefined>;
  asType?: ExpectedValueType;

  editorConfig?: ExpressionEditorConfig;
}

export interface JsonFunctionExpression {
  type: ExpressionType.Function;
  functionName: string;
  arguments: Array<JsonExpression | undefined>;

  editorConfig?: ExpressionEditorConfig;
}

export type JsonExpression = JsonConstExpression | JsonResponseVariableExpression | JsonContextVariableExpression | JsonFunctionExpression;



/**
 * Base class for all expressions.
 */
export abstract class Expression {
  type: ExpressionType;
  editorConfig?: ExpressionEditorConfig;

  constructor(type: ExpressionType, editorConfig?: ExpressionEditorConfig) {
    this.type = type;
    this.editorConfig = editorConfig;
  }

  static fromJson(json: JsonExpression | undefined): Expression | undefined {
    if (!json) {
      return undefined;
    }

    switch (json.type) {
      case ExpressionType.Const:
        return ConstExpression.fromJson(json);
      case ExpressionType.ResponseVariable:
        return ResponseVariableExpression.fromJson(json);
      case ExpressionType.ContextVariable:
        return ContextVariableExpression.fromJson(json);
      case ExpressionType.Function:
        return FunctionExpression.fromJson(json);
    }
  }

  /**
   * Returns all unique response variable references in the expression.
   * @returns A list of ValueReference objects.
   */
  abstract get responseVariableRefs(): ValueReference[]
  abstract toJson(): JsonExpression | undefined;

  clone(): Expression {
    return Expression.fromJson(this.toJson()) ?? (() => {
      throw new Error('Failed to clone expression');
    })();
  }

  /**
   * Updates references to the item key in the expression.
   * @param oldItemKey The old item key to replace
   * @param newItemKey The new item key to replace with
   * @returns True if any references were updated, false otherwise
   */
  abstract updateItemKeyReferences(oldItemKey: string, newItemKey: string): boolean;
}

export class ConstExpression extends Expression {
  declare type: ExpressionType.Const;
  value?: ValueType;

  constructor(value?: ValueType, editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.Const, editorConfig);
    this.value = value;
    this.type = ExpressionType.Const;
  }

  static fromJson(json: JsonExpression): ConstExpression {
    if (json.type !== ExpressionType.Const) {
      throw new Error('Invalid expression type: ' + json.type);
    }

    return new ConstExpression(json.value, json.editorConfig);
  }

  get responseVariableRefs(): ValueReference[] {
    return [];
  }

  toJson(): JsonExpression {
    return {
      type: this.type,
      value: this.value,
      editorConfig: this.editorConfig
    }
  }

  updateItemKeyReferences(_oldItemKey: string, _newItemKey: string): boolean {
    // Const expressions don't have item references
    return false;
  }
}

export class ResponseVariableExpression extends Expression {
  declare type: ExpressionType.ResponseVariable;
  variableRef: string;

  constructor(variableRef: string, editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.ResponseVariable, editorConfig);
    this.variableRef = variableRef;
    this.type = ExpressionType.ResponseVariable;
  }

  static fromJson(json: JsonExpression): ResponseVariableExpression {
    if (json.type !== ExpressionType.ResponseVariable) {
      throw new Error('Invalid expression type: ' + json.type);
    }

    return new ResponseVariableExpression(json.variableRef, json.editorConfig);
  }

  get responseVariableRefs(): ValueReference[] {
    return [new ValueReference(this.variableRef)];
  }

  get responseVariableRef(): ValueReference {
    return new ValueReference(this.variableRef);
  }

  toJson(): JsonExpression {
    return {
      type: this.type,
      variableRef: this.variableRef,
      editorConfig: this.editorConfig
    }
  }

  updateItemKeyReferences(oldItemKey: string, newItemKey: string): boolean {
    const valueRef = new ValueReference(this.variableRef);
    if (valueRef.itemKey.fullKey === oldItemKey) {
      valueRef.itemKey = SurveyItemKey.fromFullKey(newItemKey);
      this.variableRef = valueRef.toString();
      return true;
    }
    return false;
  }
}

export class ContextVariableExpression extends Expression {
  declare type: ExpressionType.ContextVariable;

  contextType: ContextVariableType;
  key?: Expression;
  arguments?: Array<Expression | undefined>;
  asType?: ExpectedValueType;

  constructor(contextType: ContextVariableType, key?: Expression, args?: Array<Expression | undefined>, asType?: ExpectedValueType, editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.ContextVariable, editorConfig);
    this.type = ExpressionType.ContextVariable;
    this.contextType = contextType;
    this.key = key;
    this.arguments = args;
    this.asType = asType;
  }

  static fromJson(json: JsonExpression): ContextVariableExpression {
    if (json.type !== ExpressionType.ContextVariable) {
      throw new Error('Invalid expression type: ' + json.type);
    }

    return new ContextVariableExpression(json.contextType, Expression.fromJson(json.key), json.arguments?.map(arg => Expression.fromJson(arg)), json.asType, json.editorConfig);
  }

  get responseVariableRefs(): ValueReference[] {
    return this.arguments?.flatMap(arg => arg?.responseVariableRefs).filter(ref => ref !== undefined) ?? [];
  }

  toJson(): JsonExpression {
    return {
      type: this.type,
      contextType: this.contextType,
      key: this.key?.toJson(),
      arguments: this.arguments?.map(arg => arg?.toJson()),
      asType: this.asType,
      editorConfig: this.editorConfig
    }
  }

  updateItemKeyReferences(oldItemKey: string, newItemKey: string): boolean {
    let updated = false;
    if (this.key) {
      updated = this.key.updateItemKeyReferences(oldItemKey, newItemKey) || updated;
    }
    if (this.arguments) {
      for (const arg of this.arguments) {
        if (arg) {
          updated = arg.updateItemKeyReferences(oldItemKey, newItemKey) || updated;
        }
      }
    }
    return updated;
  }
}


export enum FunctionExpressionNames {
  and = 'and',
  or = 'or',
  not = 'not',

  list_contains = 'list_contains',

  // numeric functions
  eq = 'eq',
  gt = 'gt',
  gte = 'gte',
  lt = 'lt',
  lte = 'lte',
  in_range = 'in_range',

  sum = 'sum',
  min = 'min',
  max = 'max',




  // string functions
  str_eq = 'str_eq',

  // date functions
  date_eq = 'date_eq',
}

export class FunctionExpression extends Expression {
  declare type: ExpressionType.Function;
  functionName: FunctionExpressionNames;
  arguments: Array<Expression | undefined>;

  constructor(functionName: FunctionExpressionNames, args: Array<Expression | undefined>, editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.Function);
    this.type = ExpressionType.Function;
    this.functionName = functionName;
    this.arguments = args;
    this.editorConfig = editorConfig;
  }

  static fromJson(json: JsonExpression): FunctionExpression {
    if (json.type !== ExpressionType.Function) {
      throw new Error('Invalid expression type: ' + json.type);
    }

    const functionName = json.functionName as FunctionExpressionNames;
    if (!Object.values(FunctionExpressionNames).includes(functionName)) {
      throw new Error('Invalid function name: ' + functionName);
    }

    const expr = new FunctionExpression(functionName, json.arguments.map(arg => Expression.fromJson(arg)));
    expr.editorConfig = json.editorConfig;
    return expr;
  }

  get responseVariableRefs(): ValueReference[] {
    const refs = this.arguments.flatMap(arg => arg?.responseVariableRefs).filter(ref => ref !== undefined);
    const refStrings = refs.map(ref => ref.toString());
    return [...new Set(refStrings)].map(ref => new ValueReference(ref));
  }

  toJson(): JsonExpression | undefined {
    return {
      type: this.type,
      functionName: this.functionName,
      arguments: this.arguments.map(arg => arg?.toJson()),
      editorConfig: this.editorConfig
    }
  }

  updateItemKeyReferences(oldItemKey: string, newItemKey: string): boolean {
    let updated = false;
    for (const arg of this.arguments) {
      if (arg) {
        updated = arg.updateItemKeyReferences(oldItemKey, newItemKey) || updated;
      }
    }
    return updated;
  }
}
