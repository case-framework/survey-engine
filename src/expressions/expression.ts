import { ValueReference } from "../survey/utils/value-reference";

export type ExpressionDataTypes = string | number | boolean | Date | string[] | number[] | Date[];

export enum ExpressionType {
  Const = 'const',
  ResponseVariable = 'responseVariable',
  ContextVariable = 'contextVariable',
  Function = 'function',
}

export interface JsonConstExpression {
  type: ExpressionType.Const;
  value?: ExpressionDataTypes;
}

export interface JsonResponseVariableExpression {
  type: ExpressionType.ResponseVariable;
  variableRef: string;
}

export interface JsonContextVariableExpression {
  type: ExpressionType.ContextVariable;
  // TODO: implement context variable expression, access to pflags, external expressions,linking code and study code functionality
}

export interface JsonFunctionExpression {
  type: ExpressionType.Function;
  functionName: string;
  arguments: JsonExpression[];

  editorConfig?: {
    usedTemplate?: string;
  }
}

export type JsonExpression = JsonConstExpression | JsonResponseVariableExpression | JsonContextVariableExpression | JsonFunctionExpression;



/**
 * Base class for all expressions.
 */
export abstract class Expression {
  type: ExpressionType;

  constructor(type: ExpressionType) {
    this.type = type;
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
  value?: ExpressionDataTypes;

  constructor(value?: ExpressionDataTypes) {
    super(ExpressionType.Const);
    this.value = value;
  }

  static fromJson(json: JsonExpression): ConstExpression {
    if (json.type !== ExpressionType.Const) {
      throw new Error('Invalid expression type: ' + json.type);
    }

    return new ConstExpression(json.value);
  }

  get responseVariableRefs(): ValueReference[] {
    return [];
  }

  toJson(): JsonExpression {
    return {
      type: this.type,
      value: this.value
    }
  }
}

export class ResponseVariableExpression extends Expression {
  type!: ExpressionType.ResponseVariable;
  variableRef: string;

  constructor(variableRef: string) {
    super(ExpressionType.ResponseVariable);
    this.variableRef = variableRef;
  }

  static fromJson(json: JsonExpression): ResponseVariableExpression {
    if (json.type !== ExpressionType.ResponseVariable) {
      throw new Error('Invalid expression type: ' + json.type);
    }

    return new ResponseVariableExpression(json.variableRef);
  }

  get responseVariableRefs(): ValueReference[] {
    return [new ValueReference(this.variableRef)];
  }

  toJson(): JsonExpression {
    return {
      type: this.type,
      variableRef: this.variableRef
    }
  }
}

export class ContextVariableExpression extends Expression {
  type!: ExpressionType.ContextVariable;
  // TODO: implement

  constructor() {
    super(ExpressionType.ContextVariable);
  }

  static fromJson(json: JsonExpression): ContextVariableExpression {
    if (json.type !== ExpressionType.ContextVariable) {
      throw new Error('Invalid expression type: ' + json.type);
    }
    // TODO:
    return new ContextVariableExpression();
  }

  get responseVariableRefs(): ValueReference[] {
    return [];
  }

  toJson(): JsonExpression {
    return {
      type: this.type
      // TODO:
    }
  }
}

export class FunctionExpression extends Expression {
  type!: ExpressionType.Function;
  functionName: string;
  arguments: Expression[];
  editorConfig?: {
    usedTemplate?: string;
  }

  constructor(functionName: string, args: Expression[]) {
    super(ExpressionType.Function);
    this.functionName = functionName;
    this.arguments = args;
  }

  static fromJson(json: JsonExpression): FunctionExpression {
    if (json.type !== ExpressionType.Function) {
      throw new Error('Invalid expression type: ' + json.type);
    }
    const expr = new FunctionExpression(json.functionName, json.arguments.map(arg => Expression.fromJson(arg)));
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