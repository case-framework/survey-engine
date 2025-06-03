# Survey Compilation and Decompilation

This document demonstrates how to use the survey compilation and decompilation methods that move translations and dynamic values between component-level and global survey level.

## Overview

## Methods

- `compileSurvey(survey)` - Moves translations and dynamic values from components to global level
- `decompileSurvey(survey)` - Moves translations and dynamic values from global level back to components

## Usage Examples

### Basic Compilation (Standalone Functions)

```typescript
import { compileSurvey, decompileSurvey, Survey } from 'survey-engine';

const originalSurvey: Survey = {
  versionId: '1.0.0',
  surveyDefinition: {
    key: 'mysurvey',
    items: [{
      key: 'mysurvey.question1',
      components: {
        role: 'root',
        items: [],
        content: [{ type: 'plain', key: 'questionText' }],
        translations: {
          'en': { 'questionText': 'What is your name?' },
          'es': { 'questionText': '¿Cuál es tu nombre?' },
          'fr': { 'questionText': 'Quel est votre nom?' }
        },
        dynamicValues: [{
          key: 'currentDate',
          type: 'date',
          expression: { name: 'timestampWithOffset' }
          dateFormat: 'YYYY-MM-DD'
        }]
      }
    }]
  }
};

// Compile the survey
const compiled = compileSurvey(originalSurvey);

console.log('Global translations:', compiled.translations);
// Output:
// {
//   "en": {
//     "mysurvey.question1": {
//       "questionText": "What is your name?"
//     }
//   },
//   "es": {
//     "mysurvey.question1": {
//       "questionText": "¿Cuál es tu nombre?"
//     }
//   },
//   "fr": {
//     "mysurvey.question1": {
//       "questionText": "Quel est votre nom?"
//     }
//   }
// }

console.log('Global dynamic values:', compiled.dynamicValues);
// Output: [{ "key": "mysurvey.question1-currentDate", "type": "date", "expression": { name: "timestampWithOffset" }, "dateFormat": "YYYY-MM-DD" }]
```

### Decompilation

```typescript
// Starting with a compiled survey
const compiledSurvey: Survey = {
  versionId: '1.0.0',
  translations: {
    'en': {
      'mysurvey.question1': {
        'greeting': 'Hello World'
      }
    },
    'de': {
      'mysurvey.question1': {
        'greeting': 'Hallo Welt'
      }
    }
  },
  dynamicValues: [{
    key: 'mysurvey.question1-userGreeting',
    type: 'expression',
    expression: { name: 'getAttribute', data: [{ str: 'greeting' }] }
  }],
  surveyDefinition: {
    key: 'mysurvey',
    items: [{
      key: 'mysurvey.question1',
      components: {
        role: 'root',
        items: [],
        content: [{ type: 'plain', key: 'greeting' }]
      }
    }]
  }
};

// Decompile back to component level
const decompiled = decompileSurvey(compiledSurvey);

// Now translations and dynamic values are back on the component
const component = decompiled.surveyDefinition.items[0].components;
console.log('Component translations:', component?.translations);
// Output: { "en": { "greeting": "Hello World" }, "de": { "greeting": "Hallo Welt" } }

console.log('Component dynamic values:', component?.dynamicValues);
// Output: [{ "key": "userGreeting", "type": "expression", "expression": {...} }]
```

### Round-trip Processing

```typescript
// Original survey with component-level data
const original = createSurveyWithComponentData();

// Compile for processing/storage
const compiled = compileSurvey(original);

// Process global translations (e.g., send to translation service)
const processedTranslations = await processTranslations(compiled.translations);
compiled.translations = processedTranslations;

// Decompile back to original structure
const restored = decompileSurvey(compiled);

// The survey now has the original structure but with processed translations
```

## Translation Structure

### Component Level (Before Compilation)

```typescript
{
  role: 'root',
  content: [{ type: 'plain', key: 'questionText' }],
  translations: {
    'en': { 'questionText': 'Hello' },
    'es': { 'questionText': 'Hola' }
  }
}
```

### Global Level (After Compilation) - Locale First

```json
{
  "translations": {
    "en": {
      "survey1.question1": {
        "questionText": "Hello"
      }
    },
    "es": {
      "survey1.question1": {
        "questionText": "Hola"
      }
    }
  }
}
```

## Dynamic Values Structure

Dynamic values use dashes to separate the item key from the component path and original key:

```typescript
// Before compilation (component level):
{
  key: 'question1',
  components: {
    dynamicValues: [{ key: 'currentTime', type: 'date', dateFormat: 'HH:mm' }]
  }
}

// After compilation (global level):
{
  dynamicValues: [{ key: 'survey1.question1-currentTime', type: 'date', dateFormat: 'HH:mm' }]
}
```

For nested components:

```typescript
// Before compilation (nested component):
{
  role: 'input',
  key: 'input',
  dynamicValues: [{ key: 'maxLength', type: 'expression', expression: {...} }]
}

// After compilation (global level):
{
  dynamicValues: [{ key: 'survey1.question1-rg.input-maxLength', type: 'expression', expression: {...} }]
}
```

## Advanced: Nested Component Structures

The system handles complex nested structures where components can contain other components:

```typescript
{
  role: 'root',
  content: [{ type: 'plain', key: 'rootText' }],
  translations: { 'en': { 'rootText': 'Question Root' } },
  items: [{
    role: 'responseGroup',
    key: 'rg',
    content: [{ type: 'plain', key: 'groupLabel' }],
    translations: { 'en': { 'groupLabel': 'Response Group' } },
    items: [{
      role: 'input',
      key: 'input',
      content: [{ type: 'plain', key: 'inputLabel' }],
      translations: { 'en': { 'inputLabel': 'Enter response' } }
    }]
  }]
}
```

This compiles to:

```json
{
  "translations": {
    "en": {
      "survey1.question1": {
        "rootText": "Question Root",
        "rg.groupLabel": "Response Group",
        "rg.input.inputLabel": "Enter response"
      }
    }
  }
}
```

## Notes

- The methods perform deep cloning, so the original survey object is not modified
- Compilation and decompilation are reversible operations
- Global translations and dynamic values are cleared during decompilation
- The methods handle nested survey item structures recursively
- **Root component skipping**: The "root" component is not included in translation paths since it's always the starting point
