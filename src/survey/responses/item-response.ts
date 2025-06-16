import { SurveyItemKey } from "../item-component-key";
import { ConfidentialMode, SurveyItemType } from "../items/survey-item";
import { JsonResponseMeta, ResponseMeta } from "./response-meta";


export type ResponseDataTypes = string | number | boolean | Date | string[] | number[] | Date[];


export interface JsonSurveyItemResponse {
  key: string;
  itemType: SurveyItemType;
  meta?: JsonResponseMeta;
  response?: JsonResponseItem;
  confidentialMode?: ConfidentialMode;
  mapToKey?: string;
}

export interface JsonResponseItem {
  value?: ResponseDataTypes;
  slotValues?: {
    [key: string]: ResponseDataTypes;
  };
}


/**
 * SurveyItemResponse to store the response of a survey item.
 */
export class SurveyItemResponse {
  key: SurveyItemKey;
  itemType: SurveyItemType;
  meta?: ResponseMeta;
  response?: ResponseItem;
  confidentiality?: {
    mode: ConfidentialMode;
    mapToKey?: string;
  };

  constructor(itemDef: {
    key: SurveyItemKey;
    itemType: SurveyItemType;
  }, response?: ResponseItem) {
    this.key = itemDef.key;
    this.itemType = itemDef.itemType;
    this.response = response;
  }



  toJson(): JsonSurveyItemResponse {
    return {
      key: this.key.fullKey,
      itemType: this.itemType,
      meta: this.meta?.toJson(),
      response: this.response?.toJson(),
      confidentialMode: this.confidentiality?.mode,
      mapToKey: this.confidentiality?.mapToKey,
    };
  }

  static fromJson(json: JsonSurveyItemResponse): SurveyItemResponse {
    const itemDef: {
      key: SurveyItemKey;
      itemType: SurveyItemType;
    } = {
      key: SurveyItemKey.fromFullKey(json.key),
      itemType: json.itemType,
    };

    const response = json.response ? ResponseItem.fromJson(json.response) : undefined;

    const newResponse = new SurveyItemResponse(itemDef, response);
    newResponse.meta = json.meta ? ResponseMeta.fromJson(json.meta) : undefined;
    newResponse.confidentiality = json.confidentialMode ? {
      mode: json.confidentialMode,
      mapToKey: json.mapToKey,
    } : undefined;

    return newResponse;
  }
}

export class ResponseItem {
  private _value?: ResponseDataTypes;
  private _slotValues?: {
    [key: string]: ResponseDataTypes;
  };

  constructor(value?: ResponseDataTypes, slotValues?: {
    [key: string]: ResponseDataTypes;
  }) {
    this._value = value;
    this._slotValues = slotValues;
  }
  get(slotKey?: string): ResponseDataTypes | undefined {
    if (slotKey) {
      return this._slotValues?.[slotKey];
    }
    return this._value;
  }

  setValue(value: ResponseDataTypes) {
    this._value = value;
  }

  setSlotValue(slotKey: string, value: ResponseDataTypes) {
    if (this._slotValues === undefined) {
      this._slotValues = {};
    }
    this._slotValues[slotKey] = value;
  }

  toJson(): JsonResponseItem | undefined {
    return {
      value: this._value,
      slotValues: this._slotValues,
    };
  }

  clone(): ResponseItem {
    return new ResponseItem(this._value, this._slotValues);
  }

  static fromJson(json: JsonResponseItem): ResponseItem {
    return new ResponseItem(json.value, json.slotValues);
  }
}
