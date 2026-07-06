import enQuestions from '../locales/en/questions.json';
import enUi from '../locales/en/ui.json';
import enClauses from '../locales/en/clauses.json';

export type Locale = 'en' | 'ml';

type Dict = Record<string, string>;

const en: Dict = { ...enQuestions, ...enUi, ...enClauses };

// Malayalam ships later; every key falls back to English per key
// (docs/01-architecture.md §8). Drop ml/*.json files in and register here.
const ml: Dict = {};

const dictionaries: Record<Locale, Dict> = { en, ml };

/** Translate a key with optional {var} interpolation. */
export function t(key: string, locale: Locale = 'en', vars?: Record<string, string>): string {
  let s = dictionaries[locale][key] ?? dictionaries.en[key];
  if (s === undefined) {
    if (import.meta.env?.DEV) console.warn(`Missing i18n key: ${key}`);
    return key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

export function hasLocale(locale: Locale): boolean {
  return Object.keys(dictionaries[locale]).length > 0;
}
