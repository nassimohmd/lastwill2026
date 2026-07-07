import enQuestions from '../locales/en/questions.json';
import enUi from '../locales/en/ui.json';
import enClauses from '../locales/en/clauses.json';
import mlQuestions from '../locales/ml/questions.json';
import mlUi from '../locales/ml/ui.json';
import mlClauses from '../locales/ml/clauses.json';

export type Locale = 'en' | 'ml';

type Dict = Record<string, string>;

const en: Dict = { ...enQuestions, ...enUi, ...enClauses };

// Every key falls back to English per key (docs/01-architecture.md §8), so
// Malayalam can ship incomplete without breaking anything.
const ml: Dict = { ...mlQuestions, ...mlUi, ...mlClauses };

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
