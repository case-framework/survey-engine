import { ItemComponentKey, SurveyItemKey } from "../item-component-key";

const SEPARATOR = '...';

export class ValueReference {
  _itemKey: SurveyItemKey;
  _name: string;
  _slotKey?: ItemComponentKey;

  constructor(str: string) {
    const parts = str.split(SEPARATOR);
    if (parts.length < 2) {
      throw new Error('Invalid value reference: ' + str);
    }
    this._itemKey = SurveyItemKey.fromFullKey(parts[0]);
    this._name = parts[1];
    if (parts.length > 2) {
      this._slotKey = ItemComponentKey.fromFullKey(parts[2]);
    }
  }

  get itemKey(): SurveyItemKey {
    return this._itemKey;
  }

  get name(): string {
    return this._name;
  }

  get slotKey(): ItemComponentKey | undefined {
    return this._slotKey;
  }

  toString(): string {
    return `${this._itemKey.fullKey}${SEPARATOR}${this._name}${this._slotKey ? SEPARATOR + this._slotKey.fullKey : ''}`;
  }
}
