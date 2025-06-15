import { SurveyItemKey } from "../survey/item-component-key";
import { ConfidentialMode, SurveyItemType } from "../survey/items/survey-item";
import { ItemComponentType } from "../survey/components/survey-item-component";

export type TimestampType = 'rendered' | 'displayed' | 'responded';


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


export interface JsonSurveyItemResponse {
  key: string;
  itemType: SurveyItemType;
  meta?: ResponseMeta;
  response?: JsonResponseItem;
  confidentialMode?: ConfidentialMode;
  mapToKey?: string;
}

export interface JsonResponseItem {
  key: string;
  value?: string;
  dtype?: string;
  items?: JsonResponseItem[];
}

export interface ResponseMeta {
  position: number; // position in the list
  localeCode?: string;
  // timestamps:
  rendered: Array<number>;
  displayed: Array<number>;
  responded: Array<number>;
}



/**
 *
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
      meta: this.meta,
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

    let response: ResponseItem;
    switch (json.itemType) {
      case SurveyItemType.SingleChoiceQuestion:
        response = SingleChoiceResponseItem.fromJson(json);
        break;
      default:
        throw new Error(`Unknown response item type: ${json.itemType}`);
    }

    const newResponse = new SurveyItemResponse(itemDef, response);
    newResponse.meta = json.meta;
    newResponse.confidentiality = json.confidentialMode ? {
      mode: json.confidentialMode,
      mapToKey: json.mapToKey,
    } : undefined;

    return newResponse;
  }
}

export abstract class ResponseItem {
  abstract toJson(): JsonResponseItem | undefined;

}

export class SingleChoiceResponseItem extends ResponseItem {
  selectedOption?: ScgMcgOptionSlotResponse;

  toJson(): JsonResponseItem | undefined {
    if (!this.selectedOption) {
      return undefined
    }
    return this.selectedOption.toJson();
  }

  static fromJson(json: JsonResponseItem): SingleChoiceResponseItem {
    const newResponse = new SingleChoiceResponseItem();
    newResponse.selectedOption = SlotResponse.fromJson(json);
    return newResponse;
  }
}



type GenericSlotResponseValue = string | number | boolean | SlotResponse | SlotResponse[];

abstract class SlotResponse {
  key: string;
  type: ItemComponentType;
  value?: GenericSlotResponseValue;

  constructor(key: string, type: ItemComponentType, value?: GenericSlotResponseValue) {
    this.key = key;
    this.type = type;
    this.value = value;
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      dtype: this.type,
      value: this.value?.toString(),
    };
  }

  static fromJson(json: JsonResponseItem): SlotResponse {
    switch (json.dtype) {
      case ItemComponentType.ScgMcgOption:
        return ScgMcgOptionSlotResponse.fromJson(json);
      default:
        throw new Error(`Unknown slot response type: ${json.dtype}`);
    }
  }
}


abstract class ScgMcgOptionSlotResponseBase extends SlotResponse {

  abstract toJson(): JsonResponseItem;

}

export class ScgMcgOptionSlotResponse extends ScgMcgOptionSlotResponseBase {
  type: ItemComponentType = ItemComponentType.ScgMcgOption;

  constructor(key: string) {
    super(key, ItemComponentType.ScgMcgOption);
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      value: this.value as string,
    };
  }

  static fromJson(json: JsonResponseItem): ScgMcgOptionSlotResponse {
    return new ScgMcgOptionSlotResponse(json.key);
  }
}


export class ScgMcgOptionWithTextInputSlotResponse extends ScgMcgOptionSlotResponseBase {
  type: ItemComponentType = ItemComponentType.ScgMcgOptionWithTextInput;
  value?: string;

  constructor(key: string, value?: string) {
    super(key, ItemComponentType.ScgMcgOptionWithTextInput, value);
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      dtype: 'text',
      value: this.value,
    };
  }
}

export class ScgMcgOptionWithNumberInputSlotResponse extends ScgMcgOptionSlotResponseBase {
  type: ItemComponentType = ItemComponentType.ScgMcgOptionWithNumberInput;
  value?: number;

  constructor(key: string, value?: number) {
    super(key, ItemComponentType.ScgMcgOptionWithNumberInput, value);
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      dtype: 'number',
      value: this.value?.toString(),
    };
  }
}

export class ScgMcgOptionWithDateInputSlotResponse extends ScgMcgOptionSlotResponseBase {
  type: ItemComponentType = ItemComponentType.ScgMcgOptionWithDateInput;
  value?: number;

  constructor(key: string, value?: number) {
    super(key, ItemComponentType.ScgMcgOptionWithDateInput, value);
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      dtype: 'date',
      value: this.value?.toString(),
    };
  }
}

export class ScgMcgOptionWithTimeInputSlotResponse extends ScgMcgOptionSlotResponseBase {
  type: ItemComponentType = ItemComponentType.ScgMcgOptionWithTimeInput;
  value?: number;

  constructor(key: string, value?: number) {
    super(key, ItemComponentType.ScgMcgOptionWithTimeInput, value);
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      dtype: 'time',
      value: this.value?.toString(),
    };
  }
}

export class ScgMcgOptionWithDropdownSlotResponse extends ScgMcgOptionSlotResponseBase {
  type: ItemComponentType = ItemComponentType.ScgMcgOptionWithDropdown;
  value?: string;

  constructor(key: string, value?: string) {
    super(key, ItemComponentType.ScgMcgOptionWithDropdown, value);
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      dtype: 'dropdown',
      value: this.value,
    };
  }
}

export class ScgMcgOptionWithClozeSlotResponse extends ScgMcgOptionSlotResponseBase {
  type: ItemComponentType = ItemComponentType.ScgMcgOptionWithCloze;
  // TODO: use cloze response type
  value?: SlotResponse[];

  constructor(key: string, value?: SlotResponse[]) {
    super(key, ItemComponentType.ScgMcgOptionWithCloze, value);
  }

  toJson(): JsonResponseItem {
    return {
      key: this.key,
      dtype: 'cloze',
      items: this.value?.map(v => v.toJson()),
    };
  }
}
