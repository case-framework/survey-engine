import { Expression, JsonExpression } from "./expression";

export enum ValidationType {
  Soft = 'soft',
  Hard = 'hard'
}

export interface Validation {
  key: string;
  type: ValidationType; // hard or softvalidation
  rule: Expression;
}

export interface JsonValidation {
  key: string;
  type: ValidationType; // hard or softvalidation
  rule: JsonExpression;
}

export const validationToJson = (validation: Validation): JsonValidation => {
  return {
    key: validation.key,
    type: validation.type,
    rule: validation.rule.toJson()
  }
}

export const validationFromJson = (json: JsonValidation): Validation => {
  return {
    key: json.key,
    type: json.type,
    rule: Expression.fromJson(json.rule)
  }
}

export const validationsToJson = (validations: { [validationKey: string]: Validation }): { [validationKey: string]: JsonValidation } => {
  return Object.fromEntries(Object.entries(validations).map(([key, value]) => [key, validationToJson(value)]));
}

export const validationsFromJson = (json: { [validationKey: string]: JsonValidation }): { [validationKey: string]: Validation } => {
  return Object.fromEntries(Object.entries(json).map(([key, value]) => [key, validationFromJson(value)]));
}