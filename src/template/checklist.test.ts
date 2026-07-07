import { describe, expect, it } from 'vitest';
import { getChecklist, getWarnings } from './checklist';
import { initialState } from '../state/store';
import type { AppState } from '../engine/types';

function stateWith(answers: Record<string, unknown>): AppState {
  return { ...initialState(), answers };
}

describe('getWarnings', () => {
  it('warns when residuary is unanswered, with a jump target', () => {
    const w = getWarnings(stateWith({}));
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ id: 'no-residuary', severity: 'strong', jumpTo: 'residuary.primary' });
  });

  it('does not warn once residuary is set', () => {
    const w = getWarnings(stateWith({ 'residuary.primary': 'spouse' }));
    expect(w.find((x) => x.id === 'no-residuary')).toBeUndefined();
  });

  it('adds an informational note for Muslim testators', () => {
    const w = getWarnings(stateWith({ 'residuary.primary': 'spouse', 'personal.religion': 'muslim' }));
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ id: 'muslim-third', severity: 'info' });
  });
});

describe('getChecklist', () => {
  it('flags bank accounts with a mismatched or missing nomination', () => {
    const items = getChecklist(
      stateWith({
        'bank.accounts': [
          { bank_name: 'SBI', nomination: 'same' },
          { bank_name: 'HDFC', nomination: 'different' },
          { bank_name: 'Canara', nomination: 'none' },
        ],
      }),
    );
    expect(items.map((i) => i.id)).toEqual(['bank-nom-HDFC', 'bank-nom-Canara']);
  });

  it('does not flag insurance nominations but does flag other investment types', () => {
    const items = getChecklist(
      stateWith({
        'invest.items': [
          { desc: 'LIC policy', type: 'insurance', nomination: 'none' },
          { desc: 'PPF account', type: 'retirement', nomination: 'different' },
        ],
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('invest-nom-PPF account');
  });

  it('flags an unset crypto access note', () => {
    const items = getChecklist(
      stateWith({ 'invest.items': [{ desc: 'BTC wallet', type: 'crypto', crypto_access: 'not_set' }] }),
    );
    expect(items.some((i) => i.id === 'invest-crypto-BTC wallet')).toBe(true);
  });

  it('flags digital access and legacy-tool setup only when the digital section was engaged', () => {
    const engaged = getChecklist(stateWith({ 'digital.gate': 'yes', 'digital.access': 'not_set', 'digital.social': 'delete_all' }));
    expect(engaged.map((i) => i.id)).toEqual(expect.arrayContaining(['digital-access', 'digital-legacy-tools']));

    const skipped = getChecklist(stateWith({ 'digital.gate': 'no' }));
    expect(skipped).toHaveLength(0);
  });

  it('reminds to tell the executor when they have not been informed', () => {
    expect(getChecklist(stateWith({ 'executors.informed': 'no' })).map((i) => i.id)).toContain('tell-executor');
    expect(getChecklist(stateWith({ 'executors.informed': 'yes' })).map((i) => i.id)).not.toContain('tell-executor');
  });

  it('reminds about organ pledge registration and body donation arrangements', () => {
    expect(
      getChecklist(stateWith({ 'organ.gate': 'yes_specific', 'organ.registered': 'no' })).map((i) => i.id),
    ).toContain('organ-register');
    expect(getChecklist(stateWith({ 'funeral.method': 'donate_science' })).map((i) => i.id)).toContain('body-donation');
  });

  it('is empty for a minimal, fully-skipped draft', () => {
    expect(getChecklist(stateWith({}))).toEqual([]);
  });
});
