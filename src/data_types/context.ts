import { SurveyResponse } from "./response";
import { ExpressionArg, Expression } from "./expression";

export type StudyVariableString = {
  type: 'string';
  value: string;
}

export type StudyVariableInt = {
  type: 'int';
  value: number;
}

export type StudyVariableFloat = {
  type: 'float';
  value: number;
}


export type StudyVariableBoolean = {
  type: 'boolean';
  value: boolean;
}


export type StudyVariableDate = {
  type: 'date';
  value: Date;
}


export type StudyVariable = StudyVariableString | StudyVariableInt | StudyVariableFloat | StudyVariableBoolean | StudyVariableDate;


export interface SurveyContext {
  previousResponses?: Array<SurveyResponse>;
  profile?: any; // TODO: define
  mode?: string;
  isLoggedIn?: boolean;
  participantFlags?: { [key: string]: string };
  studyVariables?: { [key: string]: StudyVariable };
  // TODO: have geolocation and other attributes
}

export interface SurveyContextDef {
  mode?: ExpressionArg;
  previousResponses?: Expression[];
}
