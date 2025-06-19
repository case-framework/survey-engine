import { ValueReference } from "../survey/utils/value-reference";
import { ValueType } from "../survey/utils/types";


export enum ExpressionType {
  Const = 'const',
  ResponseVariable = 'responseVariable',
  ContextVariable = 'contextVariable',
  Function = 'function',
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
  // TODO: implement context variable expression, access to pflags, external expressions,linking code and study code functionality

  editorConfig?: ExpressionEditorConfig;
}

export interface JsonFunctionExpression {
  type: ExpressionType.Function;
  functionName: string;
  arguments: JsonExpression[];

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

  static fromJson(json: JsonExpression): Expression {
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
  abstract toJson(): JsonExpression;
}

export class ConstExpression extends Expression {
  type!: ExpressionType.Const;
  value?: ValueType;

  constructor(value?: ValueType, editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.Const, editorConfig);
    this.value = value;
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
}

export class ResponseVariableExpression extends Expression {
  type!: ExpressionType.ResponseVariable;
  variableRef: string;

  constructor(variableRef: string, editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.ResponseVariable, editorConfig);
    this.variableRef = variableRef;
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

  toJson(): JsonExpression {
    return {
      type: this.type,
      variableRef: this.variableRef,
      editorConfig: this.editorConfig
    }
  }
}

export class ContextVariableExpression extends Expression {
  type!: ExpressionType.ContextVariable;
  // TODO: implement

  constructor(editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.ContextVariable, editorConfig);
  }

  static fromJson(json: JsonExpression): ContextVariableExpression {
    if (json.type !== ExpressionType.ContextVariable) {
      throw new Error('Invalid expression type: ' + json.type);
    }
    // TODO:
    return new ContextVariableExpression(json.editorConfig);
  }

  get responseVariableRefs(): ValueReference[] {
    return [];
  }

  toJson(): JsonExpression {
    return {
      type: this.type,
      editorConfig: this.editorConfig
      // TODO:
    }
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


  // string functions
  str_eq = 'str_eq',

  // date functions
  date_eq = 'date_eq',
}

export class FunctionExpression extends Expression {
  type!: ExpressionType.Function;
  functionName: FunctionExpressionNames;
  arguments: Expression[];

  constructor(functionName: FunctionExpressionNames, args: Expression[], editorConfig?: ExpressionEditorConfig) {
    super(ExpressionType.Function);
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
    const refs = this.arguments.flatMap(arg => arg.responseVariableRefs);
    const refStrings = refs.map(ref => ref.toString());
    return [...new Set(refStrings)].map(ref => new ValueReference(ref));
  }

  toJson(): JsonExpression {
    return {
      type: this.type,
      functionName: this.functionName,
      arguments: this.arguments.map(arg => arg.toJson()),
      editorConfig: this.editorConfig
    }
  }
}
