import { ItemComponentKey, SurveyItemKey } from "../item-component-key";

const SEPARATOR = '...';

export enum ValueReferenceMethod {
  get = 'get',
  isDefined = 'isDefined',
}



export class ValueReference {
  _itemKey: SurveyItemKey;
  _name: ValueReferenceMethod;
  _slotKey?: ItemComponentKey;

  constructor(str: string) {
    const parts = str.split(SEPARATOR);
    if (parts.length < 2) {
      throw new Error('Invalid value reference: ' + str);
    }
    this._itemKey = SurveyItemKey.fromFullKey(parts[0]);
    if (!Object.values(ValueReferenceMethod).includes(parts[1] as ValueReferenceMethod)) {
      throw new Error(`Invalid value reference method: ${parts[1]}`);
    }
    this._name = parts[1] as ValueReferenceMethod;
    if (parts.length > 2) {
      this._slotKey = ItemComponentKey.fromFullKey(parts[2]);
    }
  }

  get itemKey(): SurveyItemKey {
    return this._itemKey;
  }

  get name(): ValueReferenceMethod {
    return this._name;
  }

  get slotKey(): ItemComponentKey | undefined {
    return this._slotKey;
  }

  toString(): string {
    return `${this._itemKey.fullKey}${SEPARATOR}${this._name}${this._slotKey ? SEPARATOR + this._slotKey.fullKey : ''}`;
  }

  static fromParts(itemKey: SurveyItemKey, name: ValueReferenceMethod, slotKey?: ItemComponentKey): ValueReference {
    return new ValueReference(`${itemKey.fullKey}${SEPARATOR}${name}${slotKey ? SEPARATOR + slotKey.fullKey : ''}`);
  }
}


export enum ReferenceUsageType {
  displayConditions = 'displayConditions',
  templateValues = 'templateValues',
  validations = 'validations',
  disabledConditions = 'disabledConditions',
}

export interface ReferenceUsage {
  fullItemKey: string;
  fullComponentKey?: string;
  usageType?: ReferenceUsageType;
  valueReference: ValueReference;
}
