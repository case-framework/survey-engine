import { JsonSurvey } from "./survey-file-schema";
import { GroupItem } from "./survey-item";
import { GroupItemEditor } from "./survey-item";

type SurveySchema = Omit<
  JsonSurvey,
  'surveyDefinition'
  | '$schema'
> & {
  surveyDefinition: GroupItem;
};



export class Survey implements SurveySchema {
  surveyDefinition!: GroupItem;

  constructor() { }

  static fromJson(json: object): Survey {
    let survey = new Survey();
    const rawSurvey = JsonSurvey.fromJson(json);
    Object.assign(survey, rawSurvey);
    survey.surveyDefinition = rawSurvey.surveyDefinition ? GroupItem.fromJson(rawSurvey.surveyDefinition) : new GroupItem('');
    return survey;
  }

  toJson(): JsonSurvey {
    const json = new JsonSurvey();
    Object.assign(json, this);
    json.surveyDefinition = this.surveyDefinition.toJson();
    return json;
  }
}


type SurveyEditorSchema = Omit<
  SurveySchema,
  'surveyDefinition'
> & {
  surveyDefinition: GroupItemEditor;
};

export class SurveyEditor implements SurveyEditorSchema {
  surveyDefinition!: GroupItemEditor;

  constructor() { }

  static fromSurvey(survey: Survey): SurveyEditor {
    const surveyEditor = new SurveyEditor();
    Object.assign(surveyEditor, survey);
    surveyEditor.surveyDefinition = new GroupItemEditor(survey.surveyDefinition.key.fullKey);

    // TODO: parse survey definition include translations and dynamic values and validations and display conditions and disabled conditions

    return surveyEditor;
  }
}
