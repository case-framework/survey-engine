
export enum ItemComponentType {
  Text = 'text',
  Markdown = 'markdown',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',

  Group = 'group',

  // RESPONSE CONFIG COMPONENTS
  SingleChoice = 'scg',
  MultipleChoice = 'mcg',


  // RESPONSE SUB COMPONENTS
  ScgMcgOption = 'scgMcgOption',
  ScgMcgOptionWithTextInput = 'scgMcgOptionWithTextInput',
  ScgMcgOptionWithNumberInput = 'scgMcgOptionWithNumberInput',
  ScgMcgOptionWithDateInput = 'scgMcgOptionWithDateInput',
  ScgMcgOptionWithTimeInput = 'scgMcgOptionWithTimeInput',
  ScgMcgOptionWithDropdown = 'scgMcgOptionWithDropdown',
  ScgMcgOptionWithCloze = 'scgMcgOptionWithCloze',

}

export type DisplayComponentTypes =
  | ItemComponentType.Text
  | ItemComponentType.Markdown
  | ItemComponentType.Info
  | ItemComponentType.Warning
  | ItemComponentType.Error

export type ResponseConfigComponentTypes =
  | ItemComponentType.SingleChoice
  | ItemComponentType.MultipleChoice;
// TODO: Add more response config components

// Union type for all ScgMcg option types
export type ScgMcgOptionTypes =
  | ItemComponentType.ScgMcgOption
  | ItemComponentType.ScgMcgOptionWithTextInput
  | ItemComponentType.ScgMcgOptionWithNumberInput
  | ItemComponentType.ScgMcgOptionWithDateInput
  | ItemComponentType.ScgMcgOptionWithTimeInput
  | ItemComponentType.ScgMcgOptionWithDropdown
  | ItemComponentType.ScgMcgOptionWithCloze;

