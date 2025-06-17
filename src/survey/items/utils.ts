import { Expression, JsonExpression } from "../../expressions";

export interface DisplayConditions {
  root?: Expression;
  components?: {
    [componentKey: string]: Expression;
  }
}

export interface JsonDisplayConditions {
  root?: JsonExpression;
  components?: {
    [componentKey: string]: JsonExpression;
  }
}

export interface JsonDisabledConditions {
  components?: {
    [componentKey: string]: JsonExpression;
  }
}

export interface DisabledConditions {
  components?: {
    [componentKey: string]: Expression;
  }
}

export const displayConditionsFromJson = (json: JsonDisplayConditions): DisplayConditions => {
  return {
    root: json.root ? Expression.fromJson(json.root) : undefined,
    components: json.components ? Object.fromEntries(Object.entries(json.components).map(([key, value]) => [key, Expression.fromJson(value)])) : undefined
  }
}

export const displayConditionsToJson = (displayConditions: DisplayConditions): JsonDisplayConditions => {
  return {
    root: displayConditions.root ? displayConditions.root.toJson() : undefined,
    components: displayConditions.components ? Object.fromEntries(Object.entries(displayConditions.components).map(([key, value]) => [key, value.toJson()])) : undefined
  }
}

export const disabledConditionsFromJson = (json: JsonDisabledConditions): DisabledConditions => {
  return {
    components: json.components ? Object.fromEntries(Object.entries(json.components).map(([key, value]) => [key, Expression.fromJson(value)])) : undefined
  }
}

export const disabledConditionsToJson = (disabledConditions: DisabledConditions): JsonDisabledConditions => {
  return {
    components: disabledConditions.components ? Object.fromEntries(Object.entries(disabledConditions.components).map(([key, value]) => [key, value.toJson()])) : undefined
  }
}
