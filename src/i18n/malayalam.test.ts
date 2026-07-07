import { describe, expect, it } from 'vitest';
import { t, hasLocale } from './index';
import { renderWill } from '../template/render';
import { clauseBlocks } from '../data/clauses';
import { initialState } from '../state/store';
import type { AppState } from '../engine/types';

import enUi from '../locales/en/ui.json';
import enQuestions from '../locales/en/questions.json';
import enClauses from '../locales/en/clauses.json';
import mlUi from '../locales/ml/ui.json';
import mlQuestions from '../locales/ml/questions.json';
import mlClauses from '../locales/ml/clauses.json';

const pairs: [string, Record<string, string>, Record<string, string>][] = [
  ['ui.json', enUi, mlUi],
  ['questions.json', enQuestions, mlQuestions],
  ['clauses.json', enClauses, mlClauses],
];

function stateWith(answers: Record<string, unknown>): AppState {
  return { ...initialState(), answers };
}

describe('Malayalam locale', () => {
  it('is registered and non-empty', () => {
    expect(hasLocale('ml')).toBe(true);
  });

  it('every English key across all three files exists in Malayalam, with matching placeholders', () => {
    const tokenPattern = /\{\{[^}]+\}\}|\{[a-zA-Z]+\}/g;
    for (const [file, en, ml] of pairs) {
      for (const key of Object.keys(en)) {
        expect(ml[key], `${file}: "${key}" missing from ml`).toBeDefined();
        const enTokens = [...en[key].matchAll(tokenPattern)].map((m) => m[0]).sort();
        const mlTokens = [...ml[key].matchAll(tokenPattern)].map((m) => m[0]).sort();
        expect(mlTokens, `${file}: "${key}" placeholder mismatch`).toEqual(enTokens);
      }
    }
  });

  it('falls back to English for a key that only exists in English', () => {
    expect(t('ui.appName', 'ml')).toBe(t('ui.appName', 'en')); // brand name, untranslated by design
    expect(t('a.totally.made.up.key.that.does.not.exist', 'ml')).toBe(
      'a.totally.made.up.key.that.does.not.exist',
    );
  });

  it("renders the date as a plain number in Malayalam, not an English ordinal", () => {
    const s = stateWith({ 'personal.full_name': 'Test Person', 'personal.sound_mind': 'confirm' });
    const en = renderWill(clauseBlocks, s, 'en').find((b) => b.id === 'declaration')!;
    const ml = renderWill(clauseBlocks, s, 'ml').find((b) => b.id === 'declaration')!;
    expect(en.text).toMatch(/\d+(st|nd|rd|th) day of/); // English ordinal suffix
    expect(ml.text).not.toMatch(/\d+(st|nd|rd|th)/); // no English ordinal leaking into Malayalam
  });

  it('renders a Malayalam clause with correct substitution and no literal template tokens left over', () => {
    const s: AppState = {
      ...initialState(),
      people: [{ id: 'p1', name: 'Anita', relation: 'wife' }],
      answers: {
        'personal.full_name': 'Test Person',
        'personal.sound_mind': 'confirm',
        'executors.physical.primary': 'p1',
      },
    };
    const rendered = renderWill(clauseBlocks, s, 'ml');
    const executorClause = rendered.find((b) => b.id === 'executor.physical')!;
    expect(executorClause.text).toContain('Anita');
    expect(executorClause.text).not.toMatch(/\{\{|\}\}/); // no unresolved placeholders
  });
});
