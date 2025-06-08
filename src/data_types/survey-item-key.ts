
export class SurveyItemKey {
  private _fullKey: string;
  private _keyParts: Array<string>;
  private _itemKey: string;

  private _parentFullKey?: string;
  private _parentItemKey?: string;


  constructor(key: string) {
    this._fullKey = key;
    this._keyParts = key.split('.');
    this._itemKey = this._keyParts[this._keyParts.length - 1];
    this._parentFullKey = this._keyParts.slice(0, -1).join('.');
    this._parentItemKey = this._keyParts.slice(0, -1).join('.');
  }

  get isRoot(): boolean {
    return this._parentFullKey === undefined;
  }

  get fullKey(): string {
    return this._fullKey;
  }

  get keyParts(): Array<string> {
    return this._keyParts;
  }

  get itemKey(): string {
    return this._itemKey;
  }

  get parentFullKey(): string | undefined {
    return this._parentFullKey;
  }

  get parentItemKey(): string | undefined {
    return this._parentItemKey;
  }
}