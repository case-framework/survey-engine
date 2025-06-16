export type TimestampType = 'displayed' | 'responded';

export interface JsonResponseMeta {
  position: number; // position in the list
  localeCode?: string;
  // timestamps:
  displayed: Array<number>;
  responded: Array<number>;
}

const TIMESTAMP_LIMIT = 100;

export class ResponseMeta {
  private _position: number;
  private _displayed: Array<number>;
  private _responded: Array<number>;

  constructor() {
    this._position = -1;
    this._displayed = [];
    this._responded = [];
  }

  toJson(): JsonResponseMeta {
    return {
      position: this._position,
      displayed: this._displayed,
      responded: this._responded,
    };
  }

  static fromJson(json: JsonResponseMeta): ResponseMeta {
    const meta = new ResponseMeta();
    meta._position = json.position;
    meta._displayed = json.displayed;
    meta._responded = json.responded;
    return meta;
  }

  setPosition(position: number) {
    this._position = position;
  }

  addTimestamp(type: TimestampType, timestamp: number) {
    switch (type) {
      case 'displayed':
        this._displayed.push(timestamp);
        if (this._displayed.length > TIMESTAMP_LIMIT) {
          this._displayed.splice(0, 1);
        }
        break;
      case 'responded':
        this._responded.push(timestamp);
        if (this._responded.length > TIMESTAMP_LIMIT) {
          this._responded.splice(0, 1);
        }
        break;
    }
  }
}