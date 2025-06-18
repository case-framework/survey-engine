export type ValueType = string | number | boolean | Date | string[] | number[] | Date[];

export enum ExpectedValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Date = 'date',
  StringArray = 'string[]',
  NumberArray = 'number[]',
  DateArray = 'date[]',
}