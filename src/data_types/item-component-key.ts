abstract class Key {
  protected _key: string;
  protected _fullKey: string;
  protected _keyParts: Array<string>;

  protected _parentFullKey?: string;
  protected _parentKey?: string;

  constructor(key: string, parentFullKey?: string) {
    if (parentFullKey !== undefined && parentFullKey !== '') {
      if (parentFullKey.startsWith('.')) {
        throw new Error('Parent key must not start with a dot (.)');
      }
      if (parentFullKey.endsWith('.')) {
        throw new Error('Parent key must not end with a dot (.)');
      }
    }
    this._key = key;
    this._fullKey = `${parentFullKey ? parentFullKey + '.' : ''}${key}`;
    this._keyParts = this._fullKey.split('.');
    this._parentFullKey = parentFullKey;
    this._parentKey = parentFullKey ? parentFullKey.split('.').pop() : undefined;
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

  get parentFullKey(): string | undefined {
    return this._parentFullKey;
  }

  get parentKey(): string | undefined {
    return this._parentKey;
  }
}


/**
 * SurveyItemKey stores the key of the item and the full key of the parent item.
 * The full key can be used to identify the item in the survey.
 * The item key can be used to identify the item within the parent item.
 */

export class SurveyItemKey extends Key {
  constructor(itemKey: string, parentFullKey?: string) {
    if (itemKey.includes('.')) {
      throw new Error('Item key must not contain a dot (.)');
    }
    super(itemKey, parentFullKey);
  }

  static fromFullKey(fullKey: string): SurveyItemKey {
    const keyParts = fullKey.split('.');
    const itemKey = keyParts[keyParts.length - 1];
    const parentFullKey = keyParts.slice(0, -1).join('.');
    return new SurveyItemKey(itemKey, parentFullKey);
  }

  get itemKey(): string {
    return this._key;
  }
}


/**
 * ItemComponentKey stores the key of the component and the full key of the parent component and key of the survey item this component belongs to.
 * The full key can be used to identify the component in the survey item.
 * The component key can be used to identify the component within the parent component.
 * The parent item key can be used to identify the survey item this component belongs to.
 */
export class ItemComponentKey extends Key {
  private _parentItemKey: SurveyItemKey;

  constructor(
    componentKey: string,
    parentComponentFullKey: string | undefined,
    parentItemFullKey: string,
  ) {
    if (componentKey.includes('.')) {
      throw new Error('Component key must not contain a dot (.)');
    }
    super(componentKey, parentComponentFullKey);
    this._parentItemKey = SurveyItemKey.fromFullKey(parentItemFullKey);
  }

  get componentKey(): string {
    return this._key;
  }

  get parentItemKey(): SurveyItemKey {
    return this._parentItemKey;
  }

  static fromFullKey(fullKey: string): ItemComponentKey {
    const keyParts = fullKey.split('.');
    const componentKey = keyParts[keyParts.length - 1];
    const parentComponentFullKey = keyParts.slice(0, -1).join('.');
    const parentItemFullKey = keyParts.slice(0, -2).join('.');
    return new ItemComponentKey(componentKey, parentComponentFullKey, parentItemFullKey);
  }
}
