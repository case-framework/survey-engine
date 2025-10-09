import { SurveyResponse } from "./response";
import { ExpressionArg, Expression } from "./expression";

type StudyVariableString = {
  type: 'string';
  value: string;
}

type StudyVariableInt = {
  type: 'int';
  value: number;
}

type StudyVariableFloat = {
  type: 'float';
  value: number;
}


type StudyVariableBoolean = {
  type: 'boolean';
  value: boolean;
}


type StudyVariableDate = {
  type: 'date';
  value: string;
}


type StudyVariable = StudyVariableString | StudyVariableInt | StudyVariableFloat | StudyVariableBoolean | StudyVariableDate;


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
