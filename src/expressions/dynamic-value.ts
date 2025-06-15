import { Expression, JsonExpression } from "./expression";


export enum DynamicValueTypes {
  String = 'string',
  Number = 'number',
  Date = 'date'
}


export type DynamicValueBase = {
  type: DynamicValueTypes;
  expression?: Expression;
}


export type DynamicValueDate = DynamicValueBase & {
  type: DynamicValueTypes.Date;
  dateFormat: string;
}

export type DynamicValue = DynamicValueBase | DynamicValueDate;



export const dynamicValueToJson = (dynamicValue: DynamicValue): JsonDynamicValue => {
  return {
    type: dynamicValue.type,
    expression: dynamicValue.expression?.toJson()
  }
}

export const dynamicValueFromJson = (json: JsonDynamicValue): DynamicValue => {
  return {
    type: json.type,
    expression: json.expression ? Expression.fromJson(json.expression) : undefined,
    dateFormat: json.dateFormat
  }
}

export const dynamicValuesToJson = (dynamicValues: { [dynamicValueKey: string]: DynamicValue }): { [dynamicValueKey: string]: JsonDynamicValue } => {
  return Object.fromEntries(Object.entries(dynamicValues).map(([key, value]) => [key, dynamicValueToJson(value)]));
}

export const dynamicValuesFromJson = (json: { [dynamicValueKey: string]: JsonDynamicValue }): { [dynamicValueKey: string]: DynamicValue } => {
  return Object.fromEntries(Object.entries(json).map(([key, value]) => [key, dynamicValueFromJson(value)]));
}

export interface JsonDynamicValue {
  type: DynamicValueTypes;
  expression?: JsonExpression;
  dateFormat?: string;
}