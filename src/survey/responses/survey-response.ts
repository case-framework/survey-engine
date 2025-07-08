import { JsonSurveyItemResponse, SurveyItemResponse } from "./item-response";

/**
 * SurveyResponse to store the responses of a survey.
 */
export class SurveyResponse {
  key: string;
  participantId?: string;
  submittedAt?: number;
  openedAt?: number;
  versionId: string;
  responses: {
    [key: string]: SurveyItemResponse;
  };
  context?: {
    [key: string]: string;
  };

  constructor(key: string, versionId: string) {
    this.key = key;
    this.participantId = '';
    this.submittedAt = 0;
    this.versionId = versionId;
    this.responses = {};
  }

  toJson(): JsonSurveyResponse {
    return {
      key: this.key,
      participantId: this.participantId,
      submittedAt: this.submittedAt,
      openedAt: this.openedAt,
      versionId: this.versionId,
      responses: Object.values(this.responses).map(r => r.toJson()),
      context: this.context,
    };
  }
}

/**
 * JsonSurveyResponse is the JSON representation of a survey response.
 */
export interface JsonSurveyResponse {
  key: string;
  participantId?: string;
  submittedAt?: number;
  openedAt?: number;
  versionId: string;
  responses: JsonSurveyItemResponse[];
  context?: {
    [key: string]: string;
  }; // key value pairs of data
}
