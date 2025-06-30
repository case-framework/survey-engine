import { ValueType } from "./types";
import { Expression } from "../../expressions";

export interface SurveyContext {
  participantFlags?: { [key: string]: string };
  locale: string;
  customValues?: { [key: string]: ValueType };
  customExpressions?: { [key: string]: (args?: Array<Expression | undefined>) => ValueType };
}
