import { Expression, ExpressionArg } from "./expression";
import { JsonItemComponent } from "./survey-file-schema";
import { DynamicValue, LocalizedContent, LocalizedContentTranslation } from "./utils";

// ----------------------------------------------------------------------

enum ItemComponentType {
  Title = 'title',
  ItemGroup = 'itemGroup',
  Response = 'response'
}



interface ContentStuffWithAttributions {
  todo: string
}
interface GenericItemComponent {
  // toObject(): ItemComponentObject;
}

interface ItemComponentObject extends JsonItemComponent {
  translations?: {
    [locale: string]: {
      [key: string]: ContentStuffWithAttributions;
    }; // TODO: define type
  };
  dynamicValues?: DynamicValue[];
  displayCondition?: Expression;
  disabled?: Expression;
}

class TitleComponent implements GenericItemComponent {
  key: string;
  styles?: {
    classNames?: string;
  }

  constructor(key: string) {
    this.key = key;
  }

  // TODO: constructor
  // TODO: getters


}

class TitleComponentEditor extends TitleComponent {
  translations?: {
    [locale: string]: {
      [key: string]: ContentStuffWithAttributions;
    };
  }

  dynamicValues?: DynamicValue[];
  displayCondition?: Expression;
  disabled?: Expression;

  // TODO: constructor
  // TODO: setters
}

class ResolvedTitleComponent extends TitleComponent {
  currentTranslation?: {
    [key: string]: ContentStuffWithAttributions;
  } // only translations for selected language
  dynamicValues?: {
    [key: string]: string;
  }
  displayCondition?: boolean;
  disabled?: boolean;

  // TODO: constructor
}

export enum ConfidentialMode {
  Add = 'add',
  Replace = 'replace'
}

export class ResponseComponent implements GenericItemComponent {
  key: string;
  styles?: {
    classNames?: string;
  }

  confidentiality?: {
    mode: ConfidentialMode;
    mapToKey?: string;
  }
  //confidentialMode?: ConfidentialMode;

  constructor(key: string) {
    this.key = key;
  }
}
