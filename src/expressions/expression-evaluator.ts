import { SurveyItemResponse, ValueReferenceMethod, ValueType } from "../survey";
import { ConstExpression, ContextVariableExpression, Expression, ExpressionType, FunctionExpression, FunctionExpressionNames, ResponseVariableExpression } from "./expression";

export interface ExpressionContext {
  // TODO: implement context
  // context: any;
  responses: {
    [key: string]: SurveyItemResponse;
  }
}

export class ExpressionEvaluator {
  private context?: ExpressionContext;

  constructor(context?: ExpressionContext) {
    this.context = context;
  }

  eval(expression: Expression | undefined): ValueType | undefined {
    if (expression === undefined) {
      return undefined;
    }
    switch (expression.type) {
      case ExpressionType.Const:
        return this.evaluateConst(expression as ConstExpression);
      case ExpressionType.Function:
        return this.evaluateFunction(expression as FunctionExpression);
      case ExpressionType.ResponseVariable:
        return this.evaluateResponseVariable(expression as ResponseVariableExpression);
      case ExpressionType.ContextVariable:
        return this.evaluateContextVariable(expression as ContextVariableExpression);
      default:
        throw new Error(`Unsupported expression type: ${expression.type}`);
    }
  }

  setContext(context: ExpressionContext) {
    this.context = context;
  }

  private evaluateConst(expression: ConstExpression): ValueType | undefined {
    return expression.value;
  }

  private evaluateResponseVariable(expression: ResponseVariableExpression): ValueType | undefined {
    const varRef = expression.responseVariableRef;

    switch (varRef.name) {
      case ValueReferenceMethod.get:
        return this.context?.responses[varRef.itemKey.fullKey]?.response?.get(varRef._slotKey?.fullKey);
      case ValueReferenceMethod.isDefined:
        return this.context?.responses[varRef.itemKey.fullKey]?.response?.get(varRef._slotKey?.fullKey) !== undefined;
      default:
        throw new Error(`Unsupported value reference method: ${varRef.name}`);
    }
  }

  private evaluateFunction(expression: FunctionExpression): ValueType | undefined {
    switch (expression.functionName) {
      case FunctionExpressionNames.and:
        return this.evaluateAnd(expression);
      case FunctionExpressionNames.or:
        return this.evaluateOr(expression);
      case FunctionExpressionNames.not:
        return this.evaluateNot(expression);
      // string methods:
      case FunctionExpressionNames.str_eq:
        return this.evaluateStrEq(expression);
      // numeric methods:
      case FunctionExpressionNames.eq:
        return this.evaluateEq(expression);
      case FunctionExpressionNames.gt:
        return this.evaluateGt(expression);
      case FunctionExpressionNames.gte:
        return this.evaluateGte(expression);
      case FunctionExpressionNames.lt:
        return this.evaluateLt(expression);
      case FunctionExpressionNames.lte:
        return this.evaluateLte(expression);
      case FunctionExpressionNames.in_range:
        return this.evaluateInRange(expression);
      case FunctionExpressionNames.sum:
        return this.evaluateSum(expression);
      case FunctionExpressionNames.min:
        return this.evaluateMin(expression);
      case FunctionExpressionNames.max:
        return this.evaluateMax(expression);
      // list methods:
      case FunctionExpressionNames.list_contains:
        return this.evaluateListContains(expression);

      default:
        throw new Error(`Unsupported function: ${expression.functionName}`);
    }
    // TODO: implement function evaluation
    return undefined;
  }

  private evaluateContextVariable(expression: ContextVariableExpression): ValueType | undefined {
    // TODO: implement context variable evaluation
    console.log('todo: evaluateContextVariable', expression);
    return undefined;
  }

  // ---------------- FUNCTIONS ----------------

  private evaluateAnd(expression: FunctionExpression): boolean {
    return expression.arguments.every(arg => this.eval(arg) === true);
  }

  private evaluateOr(expression: FunctionExpression): boolean {
    return expression.arguments.some(arg => this.eval(arg) === true);
  }

  private evaluateNot(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 1 || expression.arguments[0] === undefined) {
      throw new Error(`Not function expects 1 argument, got ${expression.arguments.length}`);
    }
    const resolvedValue = this.eval(expression.arguments[0]);
    if (resolvedValue === undefined || typeof resolvedValue !== 'boolean') {
      return false;
    }
    return !resolvedValue;
  }

  private evaluateListContains(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 2) {
      throw new Error(`List contains function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedList = this.eval(expression.arguments[0]);
    const resolvedItem = this.eval(expression.arguments[1]);

    if (resolvedList === undefined || resolvedItem === undefined) {
      return false;
    }

    const list = resolvedList as string[];
    const item = resolvedItem as string;

    return list.includes(item) ? true : false;
  }

  private evaluateStrEq(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 2) {
      throw new Error(`String equals function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedA = this.eval(expression.arguments[0]);
    const resolvedB = this.eval(expression.arguments[1]);

    if (resolvedA === undefined || resolvedB === undefined) {
      return false;
    }

    return resolvedA === resolvedB;
  }

  private evaluateEq(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 2) {
      throw new Error(`Equals function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedA = this.eval(expression.arguments[0]);
    const resolvedB = this.eval(expression.arguments[1]);

    if (resolvedA === undefined || resolvedB === undefined) {
      return false;
    }

    return resolvedA === resolvedB;
  }

  private evaluateGt(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 2) {
      throw new Error(`Greater than function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedA = this.eval(expression.arguments[0]);
    const resolvedB = this.eval(expression.arguments[1]);

    if (resolvedA === undefined || resolvedB === undefined) {
      return false;
    }

    return resolvedA > resolvedB;
  }

  private evaluateGte(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 2) {
      throw new Error(`Greater than or equal to function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedA = this.eval(expression.arguments[0]);
    const resolvedB = this.eval(expression.arguments[1]);

    if (resolvedA === undefined || resolvedB === undefined) {
      return false;
    }

    return resolvedA >= resolvedB;
  }

  private evaluateLt(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 2) {
      throw new Error(`Less than function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedA = this.eval(expression.arguments[0]);
    const resolvedB = this.eval(expression.arguments[1]);

    if (resolvedA === undefined || resolvedB === undefined) {
      return false;
    }

    return resolvedA < resolvedB;
  }

  private evaluateLte(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 2) {
      throw new Error(`Less than or equal to function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedA = this.eval(expression.arguments[0]);
    const resolvedB = this.eval(expression.arguments[1]);

    if (resolvedA === undefined || resolvedB === undefined) {
      return false;
    }

    return resolvedA <= resolvedB;
  }

  private evaluateInRange(expression: FunctionExpression): boolean {
    if (expression.arguments.length !== 4) {
      throw new Error(`In range function expects 4 arguments, got ${expression.arguments.length}`);
    }
    const resolvedValue = this.eval(expression.arguments[0]);
    const resolvedMin = this.eval(expression.arguments[1]);
    const resolvedMax = this.eval(expression.arguments[2]);
    const resolvedInclusive = this.eval(expression.arguments[3]) === true

    if (resolvedValue === undefined || resolvedMin === undefined || resolvedMax === undefined) {
      return false;
    }

    return resolvedInclusive ? resolvedValue >= resolvedMin && resolvedValue <= resolvedMax : resolvedValue > resolvedMin && resolvedValue < resolvedMax;
  }

  private evaluateSum(expression: FunctionExpression): number {
    if (expression.arguments.length < 1) {
      throw new Error(`Sum function expects at least 1 argument, got ${expression.arguments.length}`);
    }
    return expression.arguments.reduce((sum, arg) => {
      if (arg === undefined) {
        return sum;
      }
      const resolvedValue = this.eval(arg);
      if (resolvedValue === undefined) {
        return sum;
      }
      if (typeof resolvedValue === 'number') {
        return sum + resolvedValue;
      }
      throw new Error(`Sum function expects all arguments to be numbers, got ${typeof resolvedValue}`);
    }, 0);
  }

  private evaluateMin(expression: FunctionExpression): number {
    if (expression.arguments.length < 1) {
      throw new Error(`Min function expects at least 1 argument, got ${expression.arguments.length}`);
    }
    return expression.arguments.reduce((min, arg) => {
      if (arg === undefined) {
        return min;
      }
      const resolvedValue = this.eval(arg);
      if (resolvedValue === undefined) {
        return min;
      }
      if (typeof resolvedValue === 'number') {
        return Math.min(min, resolvedValue);
      }
      throw new Error(`Min function expects all arguments to be numbers, got ${typeof resolvedValue}`);
    }, Infinity);
  }

  private evaluateMax(expression: FunctionExpression): number {
    if (expression.arguments.length < 1) {
      throw new Error(`Max function expects at least 1 argument, got ${expression.arguments.length}`);
    }
    return expression.arguments.reduce((max, arg) => {
      if (arg === undefined) {
        return max;
      }
      const resolvedValue = this.eval(arg);
      if (resolvedValue === undefined) {
        return max;
      }
      if (typeof resolvedValue === 'number') {
        return Math.max(max, resolvedValue);
      }
      throw new Error(`Max function expects all arguments to be numbers, got ${typeof resolvedValue}`);
    }, -Infinity);
  }

}
