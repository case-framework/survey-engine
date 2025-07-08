import { ExpectedValueType } from "../survey";
import { Expression, JsonExpression } from "./expression";


export enum TemplateDefTypes {
  Default = 'default',
  Date2String = 'date2string'
}

export type TemplateValueBase = {
  type: TemplateDefTypes;
  returnType: ExpectedValueType;
  expression?: Expression;
}


export type TemplateValueFormatDate = TemplateValueBase & {
  type: TemplateDefTypes.Date2String;
  returnType: ExpectedValueType.String;
  dateFormat: string;
}

export type TemplateValueDefinition = TemplateValueBase | TemplateValueFormatDate;



export const templateValueToJson = (templateValue: TemplateValueDefinition): JsonTemplateValue => {
  const json: JsonTemplateValue = {
    type: templateValue.type,
    returnType: templateValue.returnType,
    expression: templateValue.expression?.toJson(),
  }
  if (templateValue.type === TemplateDefTypes.Date2String) {
    json.dateFormat = (templateValue as TemplateValueFormatDate).dateFormat;
  }
  return json;
}

export const templateValueFromJson = (json: JsonTemplateValue): TemplateValueDefinition => {
  return {
    type: json.type,
    expression: json.expression ? Expression.fromJson(json.expression) : undefined,
    returnType: json.returnType,
    dateFormat: json.dateFormat
  }
}

export const templateValuesToJson = (templateValues: { [templateValueKey: string]: TemplateValueDefinition }): { [templateValueKey: string]: JsonTemplateValue } => {
  return Object.fromEntries(Object.entries(templateValues).map(([key, value]) => [key, templateValueToJson(value)]));
}

export const templateValuesFromJson = (json: { [templateValueKey: string]: JsonTemplateValue }): { [templateValueKey: string]: TemplateValueDefinition } => {
  return Object.fromEntries(Object.entries(json).map(([key, value]) => [key, templateValueFromJson(value)]));
}

export interface JsonTemplateValue {
  type: TemplateDefTypes;
  expression?: JsonExpression;
  returnType: ExpectedValueType;
  dateFormat?: string;
}

