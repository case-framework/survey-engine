

// TODO: constant expression editor
// TODO: response variable expression editor
// TODO: context variable expression editor
// TODO: function expression editor

import { Expression, FunctionExpression, ExpressionEditorConfig, FunctionExpressionNames } from "../expressions/expression";
import { ExpectedValueType } from "../survey";


// ================================
// EXPRESSION EDITOR CLASSES
// ================================
export abstract class ExpressionEditor {
  readonly returnType!: ExpectedValueType;
  protected _editorConfig?: ExpressionEditorConfig;

  abstract getExpression(): Expression

  get editorConfig(): ExpressionEditorConfig | undefined {
    return this._editorConfig;
  }

  set editorConfig(editorConfig: ExpressionEditorConfig | undefined) {
    this._editorConfig = editorConfig;
  }
}

// ================================
// GROUP EXPRESSION EDITOR CLASSES
// ================================
abstract class GroupExpressionEditor extends ExpressionEditor {
  private _args: ExpressionEditor[];

  constructor(
    args: ExpressionEditor[],
    editorConfig?: ExpressionEditorConfig
  ) {
    super();
    this._args = args;
    this._editorConfig = editorConfig;
  }

  get args(): ExpressionEditor[] {
    return this._args;
  }

  addArg(arg: ExpressionEditor, position?: number) {
    if (position === undefined) {
      this._args.push(arg);
    } else {
      this._args.splice(position, 0, arg);
    }
  }

  removeArg(position: number) {
    this._args.splice(position, 1);
  }

  replaceArg(position: number, arg: ExpressionEditor) {
    this._args[position] = arg;
  }

  swapArgs(activeIndex: number, overIndex: number) {
    const newOrder = [...this._args];
    newOrder.splice(activeIndex, 1);
    newOrder.splice(overIndex, 0, this._args[activeIndex]);
    this._args = newOrder;
  }
}

export class AndExpressionEditor extends GroupExpressionEditor {
  readonly returnType = ExpectedValueType.Boolean;

  constructor(args: ExpressionEditor[], editorConfig?: ExpressionEditorConfig) {
    if (args.some(arg => arg.returnType !== ExpectedValueType.Boolean)) {
      throw new Error('And expression editor must have boolean arguments');
    }
    super(args, editorConfig);
  }

  getExpression(): Expression {
    return new FunctionExpression(
      FunctionExpressionNames.and,
      this.args.map(arg => arg.getExpression()),
      this._editorConfig
    )
  }
}

export class OrExpressionEditor extends GroupExpressionEditor {
  readonly returnType = ExpectedValueType.Boolean;

  constructor(args: ExpressionEditor[], editorConfig?: ExpressionEditorConfig) {
    if (args.some(arg => arg.returnType !== ExpectedValueType.Boolean)) {
      throw new Error('Or expression editor must have boolean arguments');
    }
    super(args, editorConfig);
  }

  getExpression(): Expression {
    return new FunctionExpression(
      FunctionExpressionNames.or,
      this.args.map(arg => arg.getExpression()),
      this._editorConfig
    )
  }
}
