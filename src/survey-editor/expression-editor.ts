

// TODO: constant expression editor
// TODO: context variable expression editor
// TODO: function expression editor

import { Expression, FunctionExpression, ExpressionEditorConfig, FunctionExpressionNames, ConstExpression, ResponseVariableExpression } from "../expressions/expression";
import { ExpectedValueType, ValueReference } from "../survey";


// ================================
// EXPRESSION EDITOR CLASSES
// ================================
export abstract class ExpressionEditor {
  returnType!: ExpectedValueType;
  protected _editorConfig?: ExpressionEditorConfig;

  abstract getExpression(): Expression | undefined

  get editorConfig(): ExpressionEditorConfig | undefined {
    return this._editorConfig;
  }

  withEditorConfig(editorConfig: ExpressionEditorConfig): ExpressionEditor {
    this._editorConfig = editorConfig;
    return this;
  }
}

// ================================
// CONST EDITORS
// ================================
export class ConstStringArrayEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.StringArray;

  private _values: string[];

  constructor(values: string[], editorConfig?: ExpressionEditorConfig) {
    super();
    this._values = values;
    this._editorConfig = editorConfig;
  }

  get values(): string[] {
    return this._values;
  }

  set values(values: string[]) {
    this._values = values;
  }

  getExpression(): Expression | undefined {
    return new ConstExpression(this._values, this._editorConfig);
  }
}

export class ConstStringEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.String;

  private _value: string;

  constructor(value: string, editorConfig?: ExpressionEditorConfig) {
    super();
    this._value = value;
    this._editorConfig = editorConfig;
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }

  getExpression(): Expression | undefined {
    return new ConstExpression(this._value, this._editorConfig);
  }
}

export class ConstNumberEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.Number;

  private _value: number;

  constructor(value: number, editorConfig?: ExpressionEditorConfig) {
    super();
    this._value = value;
    this._editorConfig = editorConfig;
  }

  get value(): number {
    return this._value;
  }

  set value(value: number) {
    this._value = value;
  }

  getExpression(): Expression | undefined {
    return new ConstExpression(this._value, this._editorConfig);
  }
}

export class ConstBooleanEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.Boolean;

  private _value: boolean;

  constructor(value: boolean, editorConfig?: ExpressionEditorConfig) {
    super();
    this._value = value;
    this._editorConfig = editorConfig;
  }

  get value(): boolean {
    return this._value;
  }

  set value(value: boolean) {
    this._value = value;
  }

  getExpression(): Expression | undefined {
    return new ConstExpression(this._value, this._editorConfig);
  }
}

export class ConstDateEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.Date;

  private _value: Date;

  constructor(value: Date, editorConfig?: ExpressionEditorConfig) {
    super();
    this._value = value;
    this._editorConfig = editorConfig;
  }

  get value(): Date {
    return this._value;
  }

  set value(value: Date) {
    this._value = value;
  }

  getExpression(): Expression | undefined {
    return new ConstExpression(this._value, this._editorConfig);
  }
}

export class ConstNumberArrayEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.NumberArray;

  private _values: number[];

  constructor(values: number[], editorConfig?: ExpressionEditorConfig) {
    super();
    this._values = values;
    this._editorConfig = editorConfig;
  }

  get values(): number[] {
    return this._values;
  }

  set values(values: number[]) {
    this._values = values;
  }

  getExpression(): Expression | undefined {
    return new ConstExpression(this._values, this._editorConfig);
  }
}

export class ConstDateArrayEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.DateArray;

  private _values: Date[];

  constructor(values: Date[], editorConfig?: ExpressionEditorConfig) {
    super();
    this._values = values;
    this._editorConfig = editorConfig;
  }

  get values(): Date[] {
    return this._values;
  }

  set values(values: Date[]) {
    this._values = values;
  }

  getExpression(): Expression | undefined {
    return new ConstExpression(this._values, this._editorConfig);
  }
}

// ================================
// RESPONSE VARIABLE EXPRESSION EDITOR CLASSES
// ================================

export class ResponseVariableEditor extends ExpressionEditor {
  private _variableName: string;
  private _variableRef: ValueReference;

  constructor(variableName: string, variableType: ExpectedValueType, editorConfig?: ExpressionEditorConfig) {
    super();
    this._variableName = variableName;
    this._variableRef = new ValueReference(variableName);
    this._editorConfig = editorConfig;
    this.returnType = variableType;
  }

  get variableName(): string {
    return this._variableName;
  }

  get variableRef(): ValueReference {
    return this._variableRef;
  }

  getExpression(): Expression | undefined {
    return new ResponseVariableExpression(this._variableName, this._editorConfig);
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

  getExpression(): Expression | undefined {
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


// ================================
// LIST EXPRESSION EDITOR CLASSES
// ================================

export class ListContainsExpressionEditor extends ExpressionEditor {
  readonly returnType = ExpectedValueType.Boolean;
  private _list: ExpressionEditor | undefined;
  private _item: ExpressionEditor | undefined;

  constructor(list: ExpressionEditor, item: ExpressionEditor, editorConfig?: ExpressionEditorConfig) {
    super();
    if (list.returnType !== ExpectedValueType.StringArray) {
      throw new Error('List contains expression editor must have a string array list');
    }
    if (item.returnType !== ExpectedValueType.String) {
      throw new Error('List contains expression editor must have a string item');
    }
    this._list = list;
    this._item = item;
    this._editorConfig = editorConfig;
  }

  get list(): ExpressionEditor | undefined {
    return this._list;
  }

  get item(): ExpressionEditor | undefined {
    return this._item;
  }

  set list(list: ExpressionEditor | undefined) {
    this._list = list;
  }

  set item(item: ExpressionEditor | undefined) {
    this._item = item;
  }

  getExpression(): Expression {
    return new FunctionExpression(
      FunctionExpressionNames.list_contains,
      [this._list?.getExpression(), this._item?.getExpression()],
      this._editorConfig
    );
  }
}
