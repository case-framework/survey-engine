import { Survey, SurveyItem, isSurveyGroupItem, ItemGroupComponent, DynamicValue } from './data_types';

/**
 * Checks if a survey is already compiled
 * A compiled survey has global translations/dynamic values and components without local translations/dynamic values
 */
export function isSurveyCompiled(survey: Survey): boolean {
  // Check if survey has global translations or dynamic values
  const hasGlobalData = (survey.translations && Object.keys(survey.translations).length > 0) ||
    (survey.dynamicValues && survey.dynamicValues.length > 0);

  if (!hasGlobalData) {
    return false;
  }

  // Check if components have been stripped of their translations/dynamic values
  return !hasComponentLevelData(survey.surveyDefinition);
}

/**
 * Compiles a survey by moving translations and dynamic values from components to global level
 * Uses locale-first structure with nested keys for translations
 */
export function compileSurvey(survey: Survey): Survey {
  // Check if survey is already compiled
  if (isSurveyCompiled(survey)) {
    return survey; // Return as-is if already compiled
  }

  const compiledSurvey = JSON.parse(JSON.stringify(survey)) as Survey; // Deep clone

  // Initialize global translations and dynamic values if not present
  if (!compiledSurvey.translations) {
    compiledSurvey.translations = {};
  }
  if (!compiledSurvey.dynamicValues) {
    compiledSurvey.dynamicValues = [];
  }

  // Process the survey definition tree
  compileItem(compiledSurvey.surveyDefinition, compiledSurvey.translations, compiledSurvey.dynamicValues);

  return compiledSurvey;
}

/**
 * Decompiles a survey by moving translations and dynamic values from global level back to components
 */
export function decompileSurvey(survey: Survey): Survey {
  // Check if survey is already decompiled
  if (!isSurveyCompiled(survey)) {
    return survey; // Return as-is if already decompiled
  }

  const decompiledSurvey = JSON.parse(JSON.stringify(survey)) as Survey; // Deep clone

  // Process the survey definition tree to restore component-level translations and dynamic values
  decompileItem(decompiledSurvey.surveyDefinition, survey.translations || {}, survey.dynamicValues || []);

  // Clear global translations and dynamic values after moving them to components
  decompiledSurvey.translations = {};
  decompiledSurvey.dynamicValues = [];

  return decompiledSurvey;
}

// Internal helper functions

/**
 * Recursively checks if any component in the survey has local translations or dynamic values
 */
function hasComponentLevelData(item: SurveyItem): boolean {
  // Handle single survey items with components
  if (!isSurveyGroupItem(item) && item.components) {
    if (hasComponentLevelDataRecursive(item.components)) {
      return true;
    }
  }

  // Recursively check group items
  if (isSurveyGroupItem(item)) {
    return item.items.some(childItem => hasComponentLevelData(childItem));
  }

  return false;
}

/**
 * Recursively checks if a component or its children have local translations or dynamic values
 */
function hasComponentLevelDataRecursive(component: ItemGroupComponent): boolean {
  // Check if this component has local data
  const hasLocalTranslations = component.translations && Object.keys(component.translations).length > 0;
  const hasLocalDynamicValues = component.dynamicValues && component.dynamicValues.length > 0;

  if (hasLocalTranslations || hasLocalDynamicValues) {
    return true;
  }

  // Check child components
  if (component.items) {
    return component.items.some(childComponent =>
      hasComponentLevelDataRecursive(childComponent as ItemGroupComponent)
    );
  }

  return false;
}

function compileItem(
  item: SurveyItem,
  globalTranslations: { [key: string]: any },
  globalDynamicValues: DynamicValue[]
): void {
  // Handle single survey items with components
  if (!isSurveyGroupItem(item) && item.components) {
    // Start compilation from the root component, but don't include "root" in the path
    compileComponentRecursive(item.components, item.key, globalTranslations, globalDynamicValues, []);
  }

  // Recursively process group items
  if (isSurveyGroupItem(item)) {
    item.items.forEach(childItem => {
      compileItem(childItem, globalTranslations, globalDynamicValues);
    });
  }
}

function compileComponentRecursive(
  component: ItemGroupComponent,
  itemKey: string,
  globalTranslations: { [key: string]: any },
  globalDynamicValues: DynamicValue[],
  componentPath: string[]
): void {
  // Skip root component in the path since it's always the starting point
  const isRootComponent = component.role === 'root' || (component.key === 'root' && componentPath.length === 0);
  const currentPath = isRootComponent ? componentPath : [...componentPath, component.key || component.role];

  // Move component translations to global with locale-first structure
  if (component.translations) {
    // Build the component path for this translation
    const componentPathString = currentPath.length === 0 ? '' : currentPath.join('.');

    // Organize by locale first, then by item key, then by component path + translation key
    Object.keys(component.translations).forEach(locale => {
      if (!globalTranslations[locale]) {
        globalTranslations[locale] = {};
      }

      if (!globalTranslations[locale][itemKey]) {
        globalTranslations[locale][itemKey] = {};
      }

      const localeTranslations = component.translations![locale];

      // Handle nested key structure within locale
      if (typeof localeTranslations === 'object' && localeTranslations !== null) {
        // Translations have nested keys: { en: { root: "Root", title: "Title" } }
        Object.keys(localeTranslations).forEach(translationKey => {
          const fullKey = componentPathString ? `${componentPathString}.${translationKey}` : translationKey;
          globalTranslations[locale][itemKey][fullKey] = localeTranslations[translationKey];
        });
      } else {
        // Simple string translation (backwards compatibility)
        const fullKey = componentPathString || 'content';
        globalTranslations[locale][itemKey][fullKey] = localeTranslations;
      }
    });

    delete component.translations;
  }

  // Move component dynamic values to global, adding item key prefix
  if (component.dynamicValues) {
    component.dynamicValues.forEach(dv => {
      const globalDv = { ...dv };
      // Use format: itemKey-componentPath-originalKey
      const componentPathString = currentPath.length === 0 ? '' : currentPath.join('.');
      if (componentPathString) {
        globalDv.key = `${itemKey}-${componentPathString}-${dv.key}`;
      } else {
        globalDv.key = `${itemKey}-${dv.key}`;
      }
      globalDynamicValues.push(globalDv);
    });
    delete component.dynamicValues;
  }

  // Recursively process child components
  if (component.items) {
    component.items.forEach(childComponent => {
      compileComponentRecursive(childComponent as ItemGroupComponent, itemKey, globalTranslations, globalDynamicValues, currentPath);
    });
  }
}

function decompileItem(
  item: SurveyItem,
  globalTranslations: { [key: string]: any },
  globalDynamicValues: DynamicValue[]
): void {
  // Handle single survey items with components
  if (!isSurveyGroupItem(item) && item.components) {
    decompileComponentRecursive(item.components, item.key, globalTranslations, globalDynamicValues, []);
  }

  // Recursively process group items
  if (isSurveyGroupItem(item)) {
    item.items.forEach(childItem => {
      decompileItem(childItem, globalTranslations, globalDynamicValues);
    });
  }
}

function decompileComponentRecursive(
  component: ItemGroupComponent,
  itemKey: string,
  globalTranslations: { [key: string]: any },
  globalDynamicValues: DynamicValue[],
  componentPath: string[]
): void {
  // Skip root component in the path since it's always the starting point
  const isRootComponent = component.role === 'root' || (component.key === 'root' && componentPath.length === 0);
  const currentPath = isRootComponent ? componentPath : [...componentPath, component.key || component.role];

  // Restore component translations from global (locale-first structure with nested item keys)
  const componentPathString = currentPath.length === 0 ? '' : currentPath.join('.');

  // Look for translations for this component across all locales
  const componentTranslations: any = {};
  Object.keys(globalTranslations).forEach(locale => {
    if (globalTranslations[locale] && globalTranslations[locale][itemKey]) {
      const itemTranslations = globalTranslations[locale][itemKey];

      // Find all translation keys that match our component path
      const localeTranslations: any = {};
      const searchPrefix = componentPathString ? `${componentPathString}.` : '';

      Object.keys(itemTranslations).forEach(fullKey => {
        if (componentPathString === '') {
          // Root component - include all keys that don't have dots (direct children)
          if (!fullKey.includes('.')) {
            localeTranslations[fullKey] = itemTranslations[fullKey];
          }
        } else if (fullKey.startsWith(searchPrefix)) {
          // Extract the translation key (part after the component path)
          const translationKey = fullKey.substring(searchPrefix.length);
          // Only include if this is a direct child (no further dots)
          if (!translationKey.includes('.')) {
            localeTranslations[translationKey] = itemTranslations[fullKey];
          }
        } else if (fullKey === componentPathString) {
          // Handle backwards compatibility for simple string translations
          componentTranslations[locale] = itemTranslations[fullKey];
          return;
        }
      });

      if (Object.keys(localeTranslations).length > 0) {
        componentTranslations[locale] = localeTranslations;
      }
    }
  });

  if (Object.keys(componentTranslations).length > 0) {
    component.translations = componentTranslations;
  }

  // Restore component dynamic values from global
  const componentPrefix = `${itemKey}-`;
  const componentDynamicValues = globalDynamicValues.filter(dv => {
    if (!dv.key.startsWith(componentPrefix)) {
      return false;
    }

    // Get the remaining part after removing the item prefix
    const remainingKey = dv.key.substring(componentPrefix.length);

    // For root components, look for keys that don't have a component path (no first dash)
    if (currentPath.length === 0) {
      return !remainingKey.includes('-');
    }

    // For nested components, check if the key matches this component's path
    const expectedPrefix = `${currentPath.join('.')}-`;
    return remainingKey.startsWith(expectedPrefix);
  });

  if (componentDynamicValues.length > 0) {
    component.dynamicValues = componentDynamicValues.map(dv => {
      const componentDv = { ...dv };
      // Remove the item prefix
      let remainingKey = dv.key.substring(componentPrefix.length);

      // For nested components, also remove the component path prefix
      if (currentPath.length > 0) {
        const componentPathPrefix = `${currentPath.join('.')}-`;
        if (remainingKey.startsWith(componentPathPrefix)) {
          remainingKey = remainingKey.substring(componentPathPrefix.length);
        }
      }

      componentDv.key = remainingKey;
      return componentDv;
    });
  }

  // Recursively process child components
  if (component.items) {
    component.items.forEach(childComponent => {
      decompileComponentRecursive(childComponent as ItemGroupComponent, itemKey, globalTranslations, globalDynamicValues, currentPath);
    });
  }
}
