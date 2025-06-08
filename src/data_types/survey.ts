import { SurveyContextDef } from "./context";
import { Expression } from "./expression";
import { CURRENT_SURVEY_SCHEMA, JsonSurvey } from "./survey-file-schema";
import { GroupItem } from "./survey-item";
import { GroupItemEditor } from "./survey-item";


abstract class SurveyBase {

  prefillRules?: Expression[];
  contextRules?: SurveyContextDef;
  maxItemsPerPage?: { large: number, small: number };
  availableFor?: string;
  requireLoginBeforeSubmission?: boolean;

  metadata?: {
    [key: string]: string
  }
}


export class Survey extends SurveyBase {
  surveyDefinition: GroupItem;


  constructor(key: string = 'survey') {
    super();
    this.surveyDefinition = new GroupItem(key);
  }

  static fromJson(json: object): Survey {
    let survey = new Survey();
    const rawSurvey = json as JsonSurvey;
    if (!rawSurvey.surveyDefinition) {
      throw new Error('surveyDefinition is required');
    }
    if (rawSurvey.$schema !== CURRENT_SURVEY_SCHEMA) {
      throw new Error(`Unsupported survey schema: ${rawSurvey.$schema}`);
    }

    survey.surveyDefinition = GroupItem.fromJson(rawSurvey.surveyDefinition);

    // TODO: parse other fields
    return survey;
  }

  toJson(): JsonSurvey {
    const json: JsonSurvey = {
      $schema: CURRENT_SURVEY_SCHEMA,
    };
    json.surveyDefinition = this.surveyDefinition.toJson();

    // TODO: export other fields
    return json;
  }
}


export class SurveyEditor extends SurveyBase {
  surveyDefinition!: GroupItemEditor;

  constructor(key: string = 'survey') {
    super();
    this.surveyDefinition = new GroupItemEditor(key);
  }

  static fromSurvey(survey: Survey): SurveyEditor {
    const surveyEditor = new SurveyEditor();
    Object.assign(surveyEditor, survey);
    surveyEditor.surveyDefinition = GroupItemEditor.fromSurveyItem(survey.surveyDefinition);

    // TODO: parse survey definition include translations and dynamic values and validations and display conditions and disabled conditions

    return surveyEditor;
  }

  getSurvey(): Survey {
    const survey = new Survey(this.surveyDefinition.key.fullKey);
    survey.surveyDefinition = this.surveyDefinition.toSurveyItem();
    // TODO: export other fields
    return survey;
  }
}
