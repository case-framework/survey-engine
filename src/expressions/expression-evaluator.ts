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

  eval(expression: Expression): ValueType | undefined {
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
      /* case FunctionExpressionNames.and:
        return this.evaluateAnd(expression);
      case FunctionExpressionNames.or:
        return this.evaluateOr(expression);
      case FunctionExpressionNames.not:
        return this.evaluateNot(expression); */
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
    console.log('evaluateContextVariable', expression);
    return undefined;
  }

  // ---------------- FUNCTIONS ----------------

  private evaluateListContains(expression: FunctionExpression): ValueType | undefined {
    if (expression.arguments.length !== 2) {
      throw new Error(`List contains function expects 2 arguments, got ${expression.arguments.length}`);
    }
    const resolvedList = this.eval(expression.arguments[0]!);
    const resolvedItem = this.eval(expression.arguments[1]!);
    console.log('resolvedList', resolvedList);
    console.log('resolvedItem', resolvedItem);

    if (resolvedList === undefined || resolvedItem === undefined) {
      return false;
    }

    const list = resolvedList as string[];
    const item = resolvedItem as string;

    return list.includes(item) ? true : false;
  }
}
