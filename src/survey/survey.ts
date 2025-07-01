import { Expression } from "../data_types/expression";
import { CURRENT_SURVEY_SCHEMA, JsonSurvey, } from "./survey-file-schema";
import { SurveyItemTranslations, SurveyTranslations } from "./utils/translations";
import { GroupItem, QuestionItem, SurveyItem } from "./items";
import { ExpectedValueType } from "./utils/types";
import { ResponseConfigComponent, ValueRefTypeLookup } from "./components";
import { ReferenceUsage } from "./utils/value-reference";


abstract class SurveyBase {
  prefillRules?: Expression[];
  maxItemsPerPage?: { large: number, small: number };
  availableFor?: string;
  requireLoginBeforeSubmission?: boolean;

  metadata?: {
    [key: string]: string
  }
}


export class Survey extends SurveyBase {
  surveyItems: {
    [itemKey: string]: SurveyItem;
  } = {};

  private _translations?: SurveyTranslations;

  constructor(key: string = 'survey') {
    super();
    this.surveyItems = {
      [key]: new GroupItem(key),
    };
    this._translations = new SurveyTranslations();
  }

  static fromJson(json: object): Survey {
    const survey = new Survey();
    const rawSurvey = json as JsonSurvey;
    if (!rawSurvey.surveyItems || Object.keys(rawSurvey.surveyItems).length === 0) {
      throw new Error('surveyItems is required');
    }
    if (rawSurvey.$schema !== CURRENT_SURVEY_SCHEMA) {
      throw new Error(`Unsupported survey schema: ${rawSurvey.$schema}`);
    }

    survey.surveyItems = {}
    Object.keys(rawSurvey.surveyItems).forEach(itemFullKey => {
      survey.surveyItems[itemFullKey] = SurveyItem.fromJson(itemFullKey, rawSurvey.surveyItems[itemFullKey]);
    });

    // Parse other fields
    survey._translations = new SurveyTranslations(rawSurvey.translations);

    if (rawSurvey.prefillRules) {
      survey.prefillRules = rawSurvey.prefillRules;
    }
    if (rawSurvey.maxItemsPerPage) {
      survey.maxItemsPerPage = rawSurvey.maxItemsPerPage;
    }
    if (rawSurvey.availableFor) {
      survey.availableFor = rawSurvey.availableFor;
    }
    if (rawSurvey.requireLoginBeforeSubmission !== undefined) {
      survey.requireLoginBeforeSubmission = rawSurvey.requireLoginBeforeSubmission;
    }
    if (rawSurvey.metadata) {
      survey.metadata = rawSurvey.metadata;
    }

    return survey;
  }

  toJson(): JsonSurvey {
    const json: JsonSurvey = {
      $schema: CURRENT_SURVEY_SCHEMA,
      surveyItems: Object.fromEntries(Object.entries(this.surveyItems).map(([itemFullKey, item]) => [itemFullKey, item.toJson()])),
    };

    // Export other fields
    json.translations = this._translations?.toJson();

    if (this.prefillRules) {
      json.prefillRules = this.prefillRules;
    }
    if (this.maxItemsPerPage) {
      json.maxItemsPerPage = this.maxItemsPerPage;
    }
    if (this.availableFor) {
      json.availableFor = this.availableFor;
    }
    if (this.requireLoginBeforeSubmission !== undefined) {
      json.requireLoginBeforeSubmission = this.requireLoginBeforeSubmission;
    }
    if (this.metadata) {
      json.metadata = this.metadata;
    }

    return json;
  }

  get locales(): string[] {
    return this._translations?.locales || [];
  }

  get surveyKey(): string {
    let key: string | undefined;
    for (const item of Object.values(this.surveyItems)) {
      if (item.key.isRoot) {
        key = item.key.fullKey;
        break;
      }
    }
    if (!key) {
      throw new Error('Survey key not found');
    }
    return key;
  }

  get rootItem(): GroupItem {
    return this.surveyItems[this.surveyKey] as GroupItem;
  }

  get translations(): SurveyTranslations {
    if (!this._translations) {
      this._translations = new SurveyTranslations();
    }
    return this._translations;
  }

  getItemTranslations(fullItemKey: string): SurveyItemTranslations | undefined {
    const item = this.surveyItems[fullItemKey];
    if (!item) {
      throw new Error(`Item ${fullItemKey} not found`);
    }

    return this._translations?.getItemTranslations(fullItemKey);
  }

  getResponseValueReferences(byType?: ExpectedValueType): ValueRefTypeLookup {
    let valueRefs: ValueRefTypeLookup = {};
    for (const item of Object.values(this.surveyItems)) {
      if (item instanceof QuestionItem) {
        const responseConfig = item.responseConfig as ResponseConfigComponent;
        if (responseConfig) {
          const responseValueRefs = responseConfig.valueReferences;
          if (byType) {
            Object.keys(responseValueRefs).forEach(key => {
              if (responseValueRefs[key] === byType) {
                valueRefs[key] = responseValueRefs[key];
              }
            });
          } else {
            valueRefs = { ...valueRefs, ...responseValueRefs };
          }
        }
      }
    }
    return valueRefs;
  }

  /**
   * Get all reference usages for the survey
   * @param forItemKey - optional item key to filter usages for a specific item and its children (if not provided, all usages are returned)
   * @returns all reference usages for the survey (or for a specific item and its children)
   */
  getReferenceUsages(forItemKey?: string): ReferenceUsage[] {
    const usages: ReferenceUsage[] = [];
    for (const item of Object.values(this.surveyItems)) {
      if (forItemKey && item.key.fullKey !== forItemKey && !item.key.fullKey.startsWith(forItemKey + '.')) {
        continue;
      }
      usages.push(...item.getReferenceUsages());
    }
    return usages;
  }

  findInvalidReferenceUsages(): ReferenceUsage[] {
    const usages = this.getReferenceUsages();
    const valueRefs = this.getResponseValueReferences();

    const invalidUsages: ReferenceUsage[] = [];
    for (const usage of usages) {
      if (!valueRefs[usage.valueReference.toString()]) {
        invalidUsages.push(usage);
      }
    }
    return invalidUsages;
  }
}