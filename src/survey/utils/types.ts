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

export const initValueForType = (returnType: ExpectedValueType): ValueType => {
  switch (returnType) {
    case ExpectedValueType.String:
      return '';
    case ExpectedValueType.Number:
      return 0;
    case ExpectedValueType.Boolean:
      return false;
    case ExpectedValueType.Date:
      return new Date();
    case ExpectedValueType.StringArray:
      return [];
    case ExpectedValueType.NumberArray:
      return [];
    case ExpectedValueType.DateArray:
      return [];
    default:
      throw new Error('Invalid return type: ' + returnType);
  }
}