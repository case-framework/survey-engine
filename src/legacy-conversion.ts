import {
  LegacySurvey,
  LegacySurveyItem,
  LegacySurveyGroupItem,
  LegacySurveySingleItem,
  LegacyItemComponent,
  LegacyItemGroupComponent,
  LegacyResponseComponent,
  LegacyLocalizedObject,
  LegacySurveyProps,
  LegacyValidation,
  LegacyConfidentialMode,
  isLegacySurveyGroupItem,
  isLegacyItemGroupComponent
} from './data_types/legacy-types';

import {
  Survey,
  SurveyItem,
  SurveyGroupItem,
  SurveySingleItem,
  ItemComponent,
  ItemGroupComponent,
  ResponseComponent,
  LocalizedContent,
  SurveyProps,
  Validation,
  ConfidentialMode,
  isSurveyGroupItem,
  isItemGroupComponent
} from './data_types';

import { ExpressionArgDType } from './data_types/expression';

/**
 * Converts a legacy survey to the new survey format (decompiled version)
 * The resulting survey will have component-level translations and dynamic values
 * @param legacySurvey - Legacy survey to convert
 * @returns Survey in new format with decompiled structure
 */
export function convertLegacyToNewSurvey(legacySurvey: LegacySurvey): Survey {
  const newSurvey: Survey = {
    schemaVersion: 1,
    versionId: legacySurvey.versionId,
    surveyDefinition: convertLegacySurveyItem(legacySurvey.surveyDefinition) as SurveyGroupItem,
  };

  // Copy optional properties
  if (legacySurvey.id !== undefined) newSurvey.id = legacySurvey.id;
  if (legacySurvey.props) newSurvey.props = convertLegacySurveyProps(legacySurvey.props);
  if (legacySurvey.prefillRules) newSurvey.prefillRules = legacySurvey.prefillRules;
  if (legacySurvey.contextRules) newSurvey.contextRules = legacySurvey.contextRules;
  if (legacySurvey.maxItemsPerPage) newSurvey.maxItemsPerPage = legacySurvey.maxItemsPerPage;
  if (legacySurvey.availableFor) newSurvey.availableFor = legacySurvey.availableFor;
  if (legacySurvey.requireLoginBeforeSubmission !== undefined) {
    newSurvey.requireLoginBeforeSubmission = legacySurvey.requireLoginBeforeSubmission;
  }
  if (legacySurvey.published) newSurvey.published = legacySurvey.published;
  if (legacySurvey.unpublished) newSurvey.unpublished = legacySurvey.unpublished;
  if (legacySurvey.metadata) newSurvey.metadata = legacySurvey.metadata;

  return newSurvey;
}

/**
 * Converts a new survey to the legacy survey format
 * @param survey - New survey to convert
 * @returns Survey in legacy format
 */
export function convertNewToLegacySurvey(survey: Survey): LegacySurvey {
  const legacySurvey: LegacySurvey = {
    versionId: survey.versionId,
    surveyDefinition: convertSurveyItemToLegacy(survey.surveyDefinition) as LegacySurveyGroupItem,
  };

  // Copy optional properties
  if (survey.id !== undefined) legacySurvey.id = survey.id;
  if (survey.props) legacySurvey.props = convertSurveyPropsToLegacy(survey.props);
  if (survey.prefillRules) legacySurvey.prefillRules = survey.prefillRules;
  if (survey.contextRules) legacySurvey.contextRules = survey.contextRules;
  if (survey.maxItemsPerPage) legacySurvey.maxItemsPerPage = survey.maxItemsPerPage;
  if (survey.availableFor) legacySurvey.availableFor = survey.availableFor;
  if (survey.requireLoginBeforeSubmission !== undefined) {
    legacySurvey.requireLoginBeforeSubmission = survey.requireLoginBeforeSubmission;
  }
  if (survey.published) legacySurvey.published = survey.published;
  if (survey.unpublished) legacySurvey.unpublished = survey.unpublished;
  if (survey.metadata) legacySurvey.metadata = survey.metadata;

  return legacySurvey;
}

// Helper functions for converting survey items
function convertLegacySurveyItem(legacyItem: LegacySurveyItem): SurveyItem {
  if (isLegacySurveyGroupItem(legacyItem)) {
    return convertLegacySurveyGroupItem(legacyItem);
  } else {
    return convertLegacySurveySingleItem(legacyItem);
  }
}

function convertSurveyItemToLegacy(item: SurveyItem): LegacySurveyItem {
  if (isSurveyGroupItem(item)) {
    return convertSurveyGroupItemToLegacy(item);
  } else {
    return convertSurveySingleItemToLegacy(item);
  }
}

function convertLegacySurveyGroupItem(legacyGroup: LegacySurveyGroupItem): SurveyGroupItem {
  return {
    key: legacyGroup.key,
    items: legacyGroup.items.map(convertLegacySurveyItem),
    metadata: legacyGroup.metadata,
    follows: legacyGroup.follows,
    condition: legacyGroup.condition,
    priority: legacyGroup.priority,
    selectionMethod: legacyGroup.selectionMethod,
  };
}

function convertSurveyGroupItemToLegacy(group: SurveyGroupItem): LegacySurveyGroupItem {
  return {
    key: group.key,
    items: group.items.map(convertSurveyItemToLegacy),
    metadata: group.metadata,
    follows: group.follows,
    condition: group.condition,
    priority: group.priority,
    selectionMethod: group.selectionMethod,
  };
}

function convertLegacySurveySingleItem(legacyItem: LegacySurveySingleItem): SurveySingleItem {
  const newItem: SurveySingleItem = {
    key: legacyItem.key,
    metadata: legacyItem.metadata,
    follows: legacyItem.follows,
    condition: legacyItem.condition,
    priority: legacyItem.priority,
    type: legacyItem.type,
    mapToKey: legacyItem.mapToKey,
  };

  if (legacyItem.components) {
    newItem.components = convertLegacyItemGroupComponent(legacyItem.components);
  }

  if (legacyItem.validations) {
    newItem.validations = legacyItem.validations.map(convertLegacyValidation);
  }

  if (legacyItem.confidentialMode) {
    newItem.confidentialMode = legacyItem.confidentialMode as ConfidentialMode;
  }

  return newItem;
}

function convertSurveySingleItemToLegacy(item: SurveySingleItem): LegacySurveySingleItem {
  const legacyItem: LegacySurveySingleItem = {
    key: item.key,
    metadata: item.metadata,
    follows: item.follows,
    condition: item.condition,
    priority: item.priority,
    type: item.type,
    mapToKey: item.mapToKey,
  };

  if (item.components) {
    legacyItem.components = convertItemGroupComponentToLegacy(item.components);
  }

  if (item.validations) {
    legacyItem.validations = item.validations.map(convertValidationToLegacy);
  }

  if (item.confidentialMode) {
    legacyItem.confidentialMode = item.confidentialMode as LegacyConfidentialMode;
  }

  return legacyItem;
}

// Helper functions for converting components
function convertLegacyItemComponent(legacyComponent: LegacyItemComponent): ItemComponent {
  if (isLegacyItemGroupComponent(legacyComponent)) {
    return convertLegacyItemGroupComponent(legacyComponent);
  } else {
    return convertLegacyResponseComponent(legacyComponent as LegacyResponseComponent);
  }
}

function convertItemComponentToLegacy(component: ItemComponent): LegacyItemComponent {
  if (isItemGroupComponent(component)) {
    return convertItemGroupComponentToLegacy(component);
  } else {
    return convertResponseComponentToLegacy(component as ResponseComponent);
  }
}

function convertLegacyItemGroupComponent(legacyComponent: LegacyItemGroupComponent): ItemGroupComponent {
  const newComponent: ItemGroupComponent = {
    role: legacyComponent.role,
    key: legacyComponent.key,
    displayCondition: legacyComponent.displayCondition,
    disabled: legacyComponent.disabled,
    style: legacyComponent.style,
    properties: legacyComponent.properties,
    items: legacyComponent.items.map(convertLegacyItemComponent),
    order: legacyComponent.order,
  };

  // Convert legacy localized content to new format
  if (legacyComponent.content) {
    newComponent.content = legacyComponent.content.map(convertLegacyLocalizedObjectToContent);
    // Extract translations from legacy localized objects
    const translations = extractTranslationsFromLegacyObjects(legacyComponent.content);
    if (Object.keys(translations).length > 0) {
      newComponent.translations = translations;
    }
  }

  if (legacyComponent.description) {
    // Add description as content if not already present
    const descriptionContent = legacyComponent.description.map(convertLegacyLocalizedObjectToContent);
    if (!newComponent.content) {
      newComponent.content = [];
    }
    newComponent.content.push(...descriptionContent);

    // Extract translations from description
    const descTranslations = extractTranslationsFromLegacyObjects(legacyComponent.description);
    if (Object.keys(descTranslations).length > 0) {
      if (!newComponent.translations) {
        newComponent.translations = {};
      }
      // Merge description translations
      Object.keys(descTranslations).forEach(locale => {
        if (!newComponent.translations![locale]) {
          newComponent.translations![locale] = {};
        }
        Object.assign(newComponent.translations![locale], descTranslations[locale]);
      });
    }
  }

  return newComponent;
}

function convertItemGroupComponentToLegacy(component: ItemGroupComponent): LegacyItemGroupComponent {
  const legacyComponent: LegacyItemGroupComponent = {
    role: component.role,
    key: component.key,
    displayCondition: component.displayCondition,
    disabled: component.disabled,
    style: component.style,
    properties: component.properties,
    items: component.items.map(convertItemComponentToLegacy),
    order: component.order,
  };

  // Convert new format content and translations to legacy format
  if (component.content && component.translations) {
    legacyComponent.content = component.content.map(content =>
      convertContentAndTranslationsToLegacyObject(content, component.translations!)
    );
  } else if (component.content) {
    // Content without translations - create simple legacy objects
    legacyComponent.content = component.content.map(content => ({
      code: 'en', // Default language
      parts: [{ str: content.key, dtype: 'str' as ExpressionArgDType }] // Use ExpressionArg format
    }));
  }

  return legacyComponent;
}

function convertLegacyResponseComponent(legacyComponent: LegacyResponseComponent): ResponseComponent {
  const newComponent: ResponseComponent = {
    role: legacyComponent.role,
    key: legacyComponent.key!,
    displayCondition: legacyComponent.displayCondition,
    disabled: legacyComponent.disabled,
    style: legacyComponent.style,
    properties: legacyComponent.properties,
    dtype: legacyComponent.dtype,
  };

  // Convert legacy localized content to new format
  if (legacyComponent.content) {
    newComponent.content = legacyComponent.content.map(convertLegacyLocalizedObjectToContent);
    // Extract translations from legacy localized objects
    const translations = extractTranslationsFromLegacyObjects(legacyComponent.content);
    if (Object.keys(translations).length > 0) {
      newComponent.translations = translations;
    }
  }

  return newComponent;
}

function convertResponseComponentToLegacy(component: ResponseComponent): LegacyResponseComponent {
  const legacyComponent: LegacyResponseComponent = {
    role: component.role,
    key: component.key,
    displayCondition: component.displayCondition,
    disabled: component.disabled,
    style: component.style,
    properties: component.properties,
    dtype: component.dtype,
  };

  // Convert new format content and translations to legacy format
  if (component.content && component.translations) {
    legacyComponent.content = component.content.map(content =>
      convertContentAndTranslationsToLegacyObject(content, component.translations!)
    );
  } else if (component.content) {
    // Content without translations - create simple legacy objects
    legacyComponent.content = component.content.map(content => ({
      code: 'en', // Default language
      parts: [{ str: content.key, dtype: 'str' as ExpressionArgDType }] // Use ExpressionArg format
    }));
  }

  return legacyComponent;
}

// Helper functions for converting localized content
function convertLegacyLocalizedObjectToContent(legacyObj: LegacyLocalizedObject): LocalizedContent {
  // For now, we'll use the resolved text or first part as the key
  let key = '';
  if (legacyObj.resolvedText) {
    key = legacyObj.resolvedText;
  } else if (legacyObj.parts && legacyObj.parts.length > 0) {
    const firstPart = legacyObj.parts[0];
    if (typeof firstPart === 'string') {
      key = firstPart;
    } else if (typeof firstPart === 'object' && firstPart.str) {
      key = firstPart.str;
    } else {
      key = String(firstPart);
    }
  } else {
    key = legacyObj.code;
  }

  return {
    type: 'simple', // Default type
    key: key
  };
}

function extractTranslationsFromLegacyObjects(legacyObjects: LegacyLocalizedObject[]): { [locale: string]: { [key: string]: string } } {
  const translations: { [locale: string]: { [key: string]: string } } = {};

  legacyObjects.forEach(obj => {
    if (!translations[obj.code]) {
      translations[obj.code] = {};
    }

    // Use resolved text if available, otherwise join parts
    let text = '';
    if (obj.resolvedText) {
      text = obj.resolvedText;
    } else if (obj.parts) {
      text = obj.parts.map(part => String(part)).join('');
    }

    // Use the first part or resolved text as the key
    let key = '';
    if (obj.parts && obj.parts.length > 0) {
      key = String(obj.parts[0]);
    } else if (obj.resolvedText) {
      key = obj.resolvedText;
    } else {
      key = obj.code;
    }

    translations[obj.code][key] = text;
  });

  return translations;
}

function convertContentAndTranslationsToLegacyObject(
  content: LocalizedContent,
  translations: { [locale: string]: { [key: string]: string } }
): LegacyLocalizedObject {
  // Find the first locale that has a translation for this content key
  const locales = Object.keys(translations);
  const firstLocale = locales.find(locale =>
    translations[locale] && translations[locale][content.key]
  ) || (locales.length > 0 ? locales[0] : 'en');

  const translatedText = translations[firstLocale] && translations[firstLocale][content.key]
    ? translations[firstLocale][content.key]
    : content.key;

  return {
    code: firstLocale,
    parts: [{ str: translatedText, dtype: 'str' as ExpressionArgDType }],
    resolvedText: translatedText
  };
}

// Helper functions for converting props and validations
function convertLegacySurveyProps(legacyProps: LegacySurveyProps): SurveyProps {
  const newProps: SurveyProps = {};

  if (legacyProps.name) {
    newProps.name = convertLegacyLocalizedObjectToContent(legacyProps.name[0]);
  }

  if (legacyProps.description) {
    newProps.description = convertLegacyLocalizedObjectToContent(legacyProps.description[0]);
  }

  if (legacyProps.typicalDuration) {
    newProps.typicalDuration = convertLegacyLocalizedObjectToContent(legacyProps.typicalDuration[0]);
  }

  // Extract translations from legacy props
  const translations: { [key: string]: { name?: string; description?: string; typicalDuration?: string; } } = {};

  if (legacyProps.name) {
    legacyProps.name.forEach(obj => {
      if (!translations[obj.code]) {
        translations[obj.code] = {};
      }
      translations[obj.code].name = obj.resolvedText || (obj.parts ? obj.parts.map(part =>
        typeof part === 'string' ? part : part.str || ''
      ).join('') : '');
    });
  }

  if (legacyProps.description) {
    legacyProps.description.forEach(obj => {
      if (!translations[obj.code]) {
        translations[obj.code] = {};
      }
      translations[obj.code].description = obj.resolvedText || (obj.parts ? obj.parts.map(part =>
        typeof part === 'string' ? part : part.str || ''
      ).join('') : '');
    });
  }

  if (legacyProps.typicalDuration) {
    legacyProps.typicalDuration.forEach(obj => {
      if (!translations[obj.code]) {
        translations[obj.code] = {};
      }
      translations[obj.code].typicalDuration = obj.resolvedText || (obj.parts ? obj.parts.map(part =>
        typeof part === 'string' ? part : part.str || ''
      ).join('') : '');
    });
  }

  if (Object.keys(translations).length > 0) {
    newProps.translations = translations;
  }

  return newProps;
}

function convertSurveyPropsToLegacy(props: SurveyProps): LegacySurveyProps {
  const legacyProps: LegacySurveyProps = {};

  // Convert props with translations if available
  if (props.name) {
    if (props.translations) {
      // Use translations if available
      legacyProps.name = Object.keys(props.translations).map(locale => ({
        code: locale,
        parts: [{ str: props.translations![locale].name || props.name!.key, dtype: 'str' as ExpressionArgDType }],
        resolvedText: props.translations![locale].name || props.name!.key
      }));
    } else {
      // Fallback to content key
      legacyProps.name = [{
        code: 'en', // Default language
        parts: [{ str: props.name.key, dtype: 'str' as ExpressionArgDType }],
        resolvedText: props.name.key
      }];
    }
  }

  if (props.description) {
    if (props.translations) {
      // Use translations if available
      legacyProps.description = Object.keys(props.translations).map(locale => ({
        code: locale,
        parts: [{ str: props.translations![locale].description || props.description!.key, dtype: 'str' as ExpressionArgDType }],
        resolvedText: props.translations![locale].description || props.description!.key
      }));
    } else {
      // Fallback to content key
      legacyProps.description = [{
        code: 'en', // Default language
        parts: [{ str: props.description.key, dtype: 'str' as ExpressionArgDType }],
        resolvedText: props.description.key
      }];
    }
  }

  if (props.typicalDuration) {
    if (props.translations) {
      // Use translations if available
      legacyProps.typicalDuration = Object.keys(props.translations).map(locale => ({
        code: locale,
        parts: [{ str: props.translations![locale].typicalDuration || props.typicalDuration!.key, dtype: 'str' as ExpressionArgDType }],
        resolvedText: props.translations![locale].typicalDuration || props.typicalDuration!.key
      }));
    } else {
      // Fallback to content key
      legacyProps.typicalDuration = [{
        code: 'en', // Default language
        parts: [{ str: props.typicalDuration.key, dtype: 'str' as ExpressionArgDType }],
        resolvedText: props.typicalDuration.key
      }];
    }
  }

  return legacyProps;
}

function convertLegacyValidation(legacyValidation: LegacyValidation): Validation {
  return {
    key: legacyValidation.key,
    type: legacyValidation.type,
    rule: legacyValidation.rule,
  };
}

function convertValidationToLegacy(validation: Validation): LegacyValidation {
  return {
    key: validation.key,
    type: validation.type,
    rule: validation.rule,
  };
}
