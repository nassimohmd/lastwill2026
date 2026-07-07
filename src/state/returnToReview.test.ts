import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './store';
import type { AppState } from '../engine/types';

function skipUntil(state: AppState, targetId: string | null, maxSteps = 400): AppState {
  let s = state;
  let steps = 0;
  while (s.currentQuestionId !== targetId) {
    if (steps++ > maxSteps) throw new Error(`did not reach ${targetId}, stuck at ${s.currentQuestionId}`);
    const qid = s.currentQuestionId;
    if (qid === null) throw new Error(`interview ended before reaching ${targetId}`);
    if (qid === 'personal.full_name') {
      s = reducer(s, { type: 'ANSWER', qid, value: 'Test Person' });
    } else if (qid === 'personal.sound_mind') {
      s = reducer(s, { type: 'ANSWER', qid, value: 'confirm', optionId: 'confirm' });
    } else {
      s = reducer(s, { type: 'SKIP', qid });
    }
  }
  return s;
}

describe('RETURN_TO_REVIEW', () => {
  it('jumps straight back to Review without replaying every downstream question', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = skipUntil(s, null); // finish once
    expect(s.currentQuestionId).toBeNull();

    // jump from "review" into an early section to edit it
    s = reducer(s, { type: 'GOTO', qid: 'funeral.method' });
    expect(s.currentQuestionId).toBe('funeral.method');
    s = reducer(s, { type: 'ANSWER', qid: 'funeral.method', value: 'cremation', optionId: 'cremation' });
    expect(s.currentQuestionId).toBe('funeral.cremation.place');

    // the fix under test: return to review in one step, not by clicking
    // through organ/guardianship/debts/bank/... all over again
    s = reducer(s, { type: 'RETURN_TO_REVIEW' });
    expect(s.currentQuestionId).toBeNull();
    expect(s.history.length).toBeGreaterThan(0); // still "finished", not "fresh"
  });

  it('purges answers left stale by the edit, same as normal forward navigation would', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = skipUntil(s, 'funeral.method');
    s = reducer(s, { type: 'ANSWER', qid: 'funeral.method', value: 'burial', optionId: 'burial' });
    s = reducer(s, { type: 'ANSWER', qid: 'funeral.burial.place', value: 'public', optionId: 'public' });
    s = skipUntil(s, null);
    expect(s.answers['funeral.burial.place']).toBe('public');

    s = reducer(s, { type: 'GOTO', qid: 'funeral.method' });
    s = reducer(s, { type: 'ANSWER', qid: 'funeral.method', value: 'cremation', optionId: 'cremation' });
    s = reducer(s, { type: 'RETURN_TO_REVIEW' });

    expect(s.currentQuestionId).toBeNull();
    expect(s.answers['funeral.burial.place']).toBeUndefined(); // stale burial answer purged
    expect(s.answers['funeral.method']).toBe('cremation');
  });

  it('clears a mid-item repeater session so a later re-entry starts fresh', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = skipUntil(s, 'bank.gate');
    s = reducer(s, { type: 'ANSWER', qid: 'bank.gate', value: 'yes', optionId: 'yes' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.bank_name', value: 'SBI' });
    expect(s.repeaterSession).toEqual({ repeaterId: 'bank.accounts' });

    s = reducer(s, { type: 'RETURN_TO_REVIEW' });
    expect(s.currentQuestionId).toBeNull();
    expect(s.repeaterSession).toBeNull();
    expect(s.repeaterItems).toEqual({});
    // the abandoned item's loose field is harmless — not referenced by any
    // `each` array, so it never renders, but confirm it isn't silently lost
    // in a way that corrupts a later attempt
    expect(s.answers['bank.account.bank_name']).toBe('SBI');

    // re-entering the same repeater starts a clean session, not a stale one
    s = reducer(s, { type: 'GOTO', qid: 'bank.mode' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    expect(s.repeaterSession).toEqual({ repeaterId: 'bank.accounts' });
    expect(s.repeaterItems['bank.accounts']).toEqual([]);
  });
});
