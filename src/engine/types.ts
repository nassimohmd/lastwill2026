// Core data types for the interview engine.
// Questions are pure data — no branching logic lives in components.

export type Condition =
  | { eq: [string, unknown] }
  | { in: [string, unknown[]] }
  | { exists: string }
  | { notEmpty: string }
  | { and: Condition[] }
  | { or: Condition[] }
  | { not: Condition };

export type QuestionType =
  | 'single'
  | 'multi'
  | 'text'
  | 'longtext'
  | 'number'
  | 'date'
  | 'info'
  | 'repeater';

export interface Option {
  id: string;
  /** i18n key for the option label */
  label: string;
  /** question id to go to when this option is chosen */
  next?: string;
}

export interface NextRule {
  when: Condition;
  goto: string;
}

/** Field of a form-style repeater (simple per-item fields, no nested flow). */
export interface RepeaterField {
  id: string;
  type: 'text' | 'single';
  label: string;
  options?: Option[];
  optional?: boolean;
}

export interface Question {
  id: string;
  section: string;
  type: QuestionType;
  /** i18n key for the question text */
  text: string;
  /** i18n key for a one-line explainer shown under the question */
  help?: string;
  /** default true; false only for the handful of mandatory confirmations */
  skippable?: boolean;
  /** marks a gate question — skipping it skips the rest of its section */
  gate?: boolean;
  options?: Option[];
  /** free-input placeholder, i18n key */
  placeholder?: string;
  /** the input may be left blank and still submitted */
  optional?: boolean;
  /** visibility condition — question is silently bypassed when false */
  when?: Condition;
  /** conditional nexts, evaluated in order after option.next */
  nextRules?: NextRule[];
  /** default next question id */
  next?: string;
  /** repeater-only: fields collected per item */
  fields?: RepeaterField[];
  /** repeater-only: i18n key for the "add another?" prompt */
  addMore?: string;
  /** repeater-only: i18n key for the item label, {n} substituted */
  itemLabel?: string;
}

export interface Section {
  id: string;
  /** i18n key for the section title */
  title: string;
  chapter: string;
  /** ordered question ids (the fallback order when no explicit next) */
  order: string[];
}

export interface Chapter {
  id: string;
  /** i18n key */
  title: string;
}

/** A person in the People Registry. */
export interface Person {
  id: string;
  name: string;
  relation: string;
  minor?: boolean;
  address?: string;
}

export type SectionStatus = 'not_started' | 'in_progress' | 'done' | 'skipped';

export interface AppState {
  meta: {
    schemaVersion: number;
    locale: 'en' | 'ml';
    createdAt: string;
    updatedAt: string;
  };
  people: Person[];
  answers: Record<string, unknown>;
  skipped: string[];
  /** id of the question currently on screen; null = interview finished */
  currentQuestionId: string | null;
  /** stack of visited question ids, for Back */
  history: string[];
  sectionStatus: Record<string, SectionStatus>;
}
