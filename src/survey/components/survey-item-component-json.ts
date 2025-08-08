export interface JsonItemComponent {
  key: string; // unique identifier
  type: string; // type of the component
  styles?: {
    classNames?: string | {
      [key: string]: string;
    }
  }
  properties?: {
    [key: string]: string | number | boolean | {
      type: 'templateValue',
      templateValueKey: string;
    }
  }
  items?: Array<JsonItemComponent>;
}
