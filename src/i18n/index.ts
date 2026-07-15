import enUi from '../locales/en/ui.json';
import mlUi from '../locales/ml/ui.json';
import { contentEn, contentMl } from '../content/load';

export type Locale = 'en' | 'ml';

type Dict = Record<string, string>;

// Question/clause/section/chapter wording is owner-edited content (see
// content/*.json + src/content/load.ts); ui.json (buttons, nav, review
// copy) stays developer-owned chrome.
const en: Dict = { ...contentEn, ...enUi };

// Every key falls back to English per key (docs/01-architecture.md §8), so
// Malayalam can ship incomplete without breaking anything.
const ml: Dict = { ...contentMl, ...mlUi };

const dictionaries: Record<Locale, Dict> = { en, ml };

/**
 * Only *content* localizes — the questions, their options/help, sections,
 * chapters, repeater prompts, and the generated will (clauses + the will's
 * own labels like "Witness"). UI chrome (buttons, navigation, review/
 * checklist copy) deliberately stays English in every language, so the
 * product's controls read the same no matter what the interview language is.
 */
const CONTENT_PREFIXES = ['q.', 'clause.', 'frag.', 'part.', 'ui.will.', 'chap.', 'sec.', 'rep.'];
// ui.yes / ui.no live in the ui namespace for reuse, but they only ever
// appear as answer options inside questions — that makes them content
const CONTENT_KEYS = new Set(['ui.yes', 'ui.no']);

function isContentKey(key: string): boolean {
  return CONTENT_KEYS.has(key) || CONTENT_PREFIXES.some((p) => key.startsWith(p));
}

/** Translate a key with optional {var} interpolation. */
export function t(key: string, locale: Locale = 'en', vars?: Record<string, string>): string {
  const effective = locale !== 'en' && !isContentKey(key) ? 'en' : locale;
  let s = dictionaries[effective][key] ?? dictionaries.en[key];
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
