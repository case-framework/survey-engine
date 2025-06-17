
export enum ItemComponentType {
  Text = 'text',
  Markdown = 'markdown',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',

  Group = 'group',

  SingleChoice = 'scg',
  MultipleChoice = 'mcg',

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


// Union type for all ScgMcg option types
export type ScgMcgOptionTypes =
  | ItemComponentType.ScgMcgOption
  | ItemComponentType.ScgMcgOptionWithTextInput
  | ItemComponentType.ScgMcgOptionWithNumberInput
  | ItemComponentType.ScgMcgOptionWithDateInput
  | ItemComponentType.ScgMcgOptionWithTimeInput
  | ItemComponentType.ScgMcgOptionWithDropdown
  | ItemComponentType.ScgMcgOptionWithCloze;

