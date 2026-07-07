import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './store';
import type { AppState } from '../engine/types';
import { sectionSummary } from '../template/summaries';

function skipUntil(state: AppState, targetId: string, maxSteps = 400): AppState {
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

/** Collect one quick SBI account through the bank repeater. */
function addSbiAccount(s: AppState): AppState {
  s = reducer(s, { type: 'ANSWER', qid: 'bank.account.bank_name', value: 'SBI' });
  s = reducer(s, { type: 'SKIP', qid: 'bank.account.branch' });
  s = reducer(s, { type: 'ANSWER', qid: 'bank.account.type', value: 'savings', optionId: 'savings' });
  s = reducer(s, { type: 'SKIP', qid: 'bank.account.last4' });
  s = reducer(s, { type: 'ANSWER', qid: 'bank.account.beneficiary.mode', value: 'sell', optionId: 'sell' });
  s = reducer(s, { type: 'ANSWER', qid: 'bank.account.nomination', value: 'none', optionId: 'none' });
  return s;
}

describe('re-entering a finished repeater', () => {
  function finishedBankState(): AppState {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = skipUntil(s, 'bank.gate');
    s = reducer(s, { type: 'ANSWER', qid: 'bank.gate', value: 'yes', optionId: 'yes' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    s = addSbiAccount(s);
    s = reducer(s, { type: 'REPEATER_FINISH', repeaterId: 'bank.accounts' });
    expect(s.answers['bank.accounts']).toHaveLength(1);
    return s;
  }

  it('reopens existing items on the add-more screen instead of wiping them', () => {
    let s = finishedBankState();
    s = reducer(s, { type: 'GOTO', qid: 'bank.mode' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    expect(s.currentQuestionId).toBe('bank.accounts.__addmore__');
    expect(s.repeaterItems['bank.accounts']).toHaveLength(1);
    expect(s.repeaterItems['bank.accounts'][0].bank_name).toBe('SBI');
  });

  it('supports removing an item and finishing with the rest', () => {
    let s = finishedBankState();
    s = reducer(s, { type: 'GOTO', qid: 'bank.mode' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    // add a second account, then remove the first
    s = reducer(s, { type: 'REPEATER_ADD_ANOTHER', repeaterId: 'bank.accounts' });
    s = addSbiAccount(s);
    expect(s.repeaterItems['bank.accounts']).toHaveLength(2);
    s = reducer(s, { type: 'REPEATER_REMOVE_ITEM', repeaterId: 'bank.accounts', index: 0 });
    expect(s.repeaterItems['bank.accounts']).toHaveLength(1);
    s = reducer(s, { type: 'REPEATER_FINISH', repeaterId: 'bank.accounts' });
    expect(s.answers['bank.accounts']).toHaveLength(1);
    expect(s.currentQuestionId).toBe('bank.locker.gate');
  });

  it('RETURN_TO_REVIEW commits reopened items back to answers instead of losing them', () => {
    let s = finishedBankState();
    s = reducer(s, { type: 'GOTO', qid: 'bank.mode' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    // items now live in repeaterItems, not answers — jumping to Review from
    // here used to drop them entirely
    expect(s.answers['bank.accounts']).toBeUndefined();
    s = reducer(s, { type: 'RETURN_TO_REVIEW' });
    expect(s.currentQuestionId).toBeNull();
    expect(s.answers['bank.accounts']).toHaveLength(1);
    expect(s.repeaterItems).toEqual({});
  });

  it('answering an item question after finish (Back navigation) does not crash without a session', () => {
    let s = finishedBankState();
    expect(s.repeaterSession).toBeNull();
    s = reducer(s, { type: 'GOTO', qid: 'bank.account.nomination' });
    // re-answering resolves to ITEM_END with no live session — must not throw
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.nomination', value: 'same', optionId: 'same' });
    expect(s.currentQuestionId).toBe('bank.accounts.__addmore__');
  });
});

describe('section summaries', () => {
  it('summarises names, counts, and option labels per section', () => {
    const s: AppState = {
      ...initialState(),
      people: [
        { id: 'spouse', name: 'Ayesha', relation: 'wife' },
        { id: 'p1', name: 'Ravi', relation: 'friend' },
      ],
      answers: {
        'personal.full_name': 'Nassim Mohammed',
        'personal.children': [{ name: 'Rahul' }, { name: 'Meera' }],
        'funeral.method': 'cremation',
        'funeral.cremation.ashes': 'kept',
        'bank.mode': 'per_account',
        'bank.accounts': [{ bank_name: 'SBI' }, { bank_name: 'HDFC' }],
        'jewellery.beneficiary.mode': 'one',
        'jewellery.beneficiary.person': 'p1',
        'residuary.primary': 'spouse_children',
        'executors.physical.primary': 'p1',
      },
    };
    expect(sectionSummary('personal', s, 'en')).toBe('Nassim Mohammed · Ayesha · 2 children');
    expect(sectionSummary('funeral', s, 'en')).toBe('Cremation · Kept by family');
    expect(sectionSummary('bank', s, 'en')).toBe('2 added');
    expect(sectionSummary('jewellery', s, 'en')).toBe('Ravi');
    expect(sectionSummary('residuary', s, 'en')).toBe('My spouse and children, equally');
    expect(sectionSummary('executors', s, 'en')).toBe('Ravi');
    expect(sectionSummary('vehicles', s, 'en')).toBeNull();
  });

  it('localises summaries through the same label keys', () => {
    const s: AppState = {
      ...initialState(),
      answers: { 'funeral.method': 'cremation' },
    };
    expect(sectionSummary('funeral', s, 'ml')).toBe('ദഹിപ്പിക്കൽ');
  });
});
