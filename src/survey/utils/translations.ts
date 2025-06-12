import { structuredCloneMethod } from "../../utils";
import { Content } from "./content";


export const validateLocale = (locale: string): void => {
  if (locale.trim() === '') {
    throw new Error('Locale cannot be empty');
  }
}

export class SurveyItemTranslations {
  private _translations?: {
    [locale: string]: JsonComponentContent;
  };

  constructor() {
    this._translations = {};
  }

  setContent(locale: string, contentKey: string, content?: Content): void {
    validateLocale(locale);
    if (!this._translations?.[locale]) {
      if (!content) {
        // No need to do anything if content is undefined
        return
      }
      this._translations![locale] = {};
    }
    if (!content) {
      delete this._translations![locale][contentKey];
    } else {
      this._translations![locale][contentKey] = content;
    }
  }

  setContentForLocale(locale: string, content?: JsonComponentContent): void {
    validateLocale(locale);
    if (!this._translations?.[locale]) {
      if (!content) {
        // No need to do anything if content is undefined
        return
      }
      this._translations![locale] = {};
    }
    this._translations![locale] = content || {};
  }

  get locales(): string[] {
    return Object.keys(this._translations || {});
  }

  getLocaleContent(locale: string): JsonComponentContent | undefined {
    return this._translations?.[locale];
  }

  getContent(locale: string, contentKey: string): Content | undefined {
    return this._translations?.[locale]?.[contentKey];
  }
}

export interface SurveyCardTranslations {
  [locale: string]: JsonSurveyCardContent;
}


export class SurveyTranslations {
  private _translations: JsonSurveyTranslations;

  constructor(translations?: JsonSurveyTranslations) {
    this._translations = translations || {};
  }


  toJson(): JsonSurveyTranslations | undefined {
    if (this.locales.length === 0) {
      return undefined;
    }
    return this._translations;
  }

  get locales(): string[] {
    return Object.keys(this._translations);
  }

  removeLocale(locale: string): void {
    validateLocale(locale);
    delete this._translations[locale];
  }

  renameLocale(oldLocale: string, newLocale: string): void {
    validateLocale(oldLocale);
    validateLocale(newLocale);
    if (this._translations[oldLocale]) {
      this._translations[newLocale] = this._translations[oldLocale];
      delete this._translations[oldLocale];
    }
  }

  cloneLocaleAs(locale: string, newLocale: string): void {
    validateLocale(locale);
    validateLocale(newLocale);
    if (this._translations[locale]) {
      this._translations[newLocale] = structuredCloneMethod(this._translations[locale]);
    }
  }

  get surveyCardContent(): SurveyCardTranslations | undefined {
    const translations: SurveyCardTranslations = {};
    for (const locale of this.locales) {
      const contentForLocale = this._translations?.[locale]?.surveyCardContent;
      if (contentForLocale) {
        translations[locale] = contentForLocale as JsonSurveyCardContent;
      }
    }
    return translations;
  }

  setSurveyCardContent(locale: string, content?: JsonSurveyCardContent): void {
    validateLocale(locale);
    if (!this._translations[locale]) {
      if (!content) {
        // No need to do anything if content is undefined
        return
      }
      this._translations[locale] = {};
    }
    this._translations[locale].surveyCardContent = content;
  }

  getItemTranslations(fullItemKey: string): SurveyItemTranslations | undefined {
    const itemTranslations: SurveyItemTranslations = new SurveyItemTranslations();
    for (const locale of this.locales) {
      const contentForLocale = this._translations?.[locale]?.[fullItemKey];
      itemTranslations.setContentForLocale(locale, contentForLocale as JsonComponentContent);
    }
    return itemTranslations;
  }

  setItemTranslations(fullItemKey: string, itemContent?: SurveyItemTranslations): void {
    itemContent?.locales.forEach(locale => validateLocale(locale));
    if (!itemContent) {
      for (const locale of this.locales) {
        if (this._translations[locale]?.[fullItemKey]) {
          delete this._translations[locale][fullItemKey];
        }
      }
    } else {
      const localesInUpdate = itemContent.locales;
      // Add new locales to the translations
      for (const locale of localesInUpdate) {
        if (!this.locales.includes(locale)) {
          this._translations[locale] = {};
        }
      }
      for (const locale of this.locales) {
        if (localesInUpdate.includes(locale)) {
          if (!this._translations[locale]) {
            this._translations[locale] = {};
          }
          this._translations[locale][fullItemKey] = itemContent.getLocaleContent(locale) ?? {};
        } else {
          delete this._translations[locale][fullItemKey];
        }
      }
    }
  }

  /**
   * Remove all translations for a component
   * @param fullItemKey - The full key of the item
   * @param componentKey - The key of the component
   */
  onComponentDeleted(fullItemKey: string, componentKey: string): void {
    for (const locale of this.locales) {
      const itemTranslations = this._translations?.[locale]?.[fullItemKey];
      if (itemTranslations) {
        for (const key of Object.keys(itemTranslations)) {
          if (key.startsWith(componentKey + '.') || key === componentKey) {
            delete itemTranslations[key as keyof typeof itemTranslations];
          }
        }
      }
    }
  }

  /**
   * Remove all translations for an item
   * @param fullItemKey - The full key of the item
   */
  onItemDeleted(fullItemKey: string): void {
    for (const locale of this.locales) {
      if (this._translations?.[locale]?.[fullItemKey]) {
        delete this._translations![locale][fullItemKey];
      }
    }
  }
}


/**
 * Json Schemas for translations
 */
export type JsonComponentContent = {
  [contentKey: string]: Content;
}


export interface JsonSurveyCardContent {
  name?: Content;
  description?: Content;
  typicalDuration?: Content;
}


export interface JsonSurveyTranslations {
  [locale: string]: {
    [itemKey: string]: JsonSurveyCardContent | JsonComponentContent;
  } & {
    surveyCardContent?: JsonSurveyCardContent;
  }
}
