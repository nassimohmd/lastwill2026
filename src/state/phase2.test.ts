import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './store';
import type { AppState } from '../engine/types';
import { renderWill } from '../template/render';
import { clauseBlocks } from '../data/clauses';

/** Fast-forwards through skippable questions until `targetId` is reached,
 *  answering the two non-skippable Section 1 questions along the way. */
function skipUntil(state: AppState, targetId: string, maxSteps = 80): AppState {
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

describe('bank accounts flow-repeater', () => {
  it('collects two accounts through the item loop, then continues past the section', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = skipUntil(s, 'bank.gate');

    s = reducer(s, { type: 'ANSWER', qid: 'bank.gate', value: 'yes', optionId: 'yes' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    expect(s.currentQuestionId).toBe('bank.account.bank_name');
    expect(s.repeaterSession).toEqual({ repeaterId: 'bank.accounts' });

    // account 1: SBI savings, to Anita (new person), contingent skipped (defaults to her children)
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.bank_name', value: 'SBI' });
    s = reducer(s, { type: 'SKIP', qid: 'bank.account.branch' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.type', value: 'savings', optionId: 'savings' });
    s = reducer(s, { type: 'SKIP', qid: 'bank.account.last4' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.beneficiary.mode', value: 'one', optionId: 'one' });
    expect(s.currentQuestionId).toBe('bank.account.beneficiary.person');
    s = reducer(s, {
      type: 'ANSWER_PERSON',
      qid: 'bank.account.beneficiary.person',
      personId: 'p-anita',
      newPerson: { id: 'p-anita', name: 'Anita', relation: 'wife' },
    });
    expect(s.people.some((p) => p.id === 'p-anita')).toBe(true);
    expect(s.currentQuestionId).toBe('bank.account.beneficiary.contingent.mode');
    s = reducer(s, { type: 'SKIP', qid: 'bank.account.beneficiary.contingent.mode' });
    expect(s.currentQuestionId).toBe('bank.account.nomination');
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.nomination', value: 'same', optionId: 'same' });

    // item complete -> add-more sentinel; scratch keys cleared, one item stored
    expect(s.currentQuestionId).toBe('bank.accounts.__addmore__');
    expect(s.repeaterItems['bank.accounts']).toHaveLength(1);
    expect(s.answers['bank.account.bank_name']).toBeUndefined();

    // account 2: HDFC current, sell
    s = reducer(s, { type: 'REPEATER_ADD_ANOTHER', repeaterId: 'bank.accounts' });
    expect(s.currentQuestionId).toBe('bank.account.bank_name');
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.bank_name', value: 'HDFC' });
    s = reducer(s, { type: 'SKIP', qid: 'bank.account.branch' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.type', value: 'current', optionId: 'current' });
    s = reducer(s, { type: 'SKIP', qid: 'bank.account.last4' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.beneficiary.mode', value: 'sell', optionId: 'sell' });
    expect(s.currentQuestionId).toBe('bank.account.nomination');
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.nomination', value: 'none', optionId: 'none' });
    expect(s.currentQuestionId).toBe('bank.accounts.__addmore__');
    expect(s.repeaterItems['bank.accounts']).toHaveLength(2);

    s = reducer(s, { type: 'REPEATER_FINISH', repeaterId: 'bank.accounts' });
    expect(s.repeaterSession).toBeNull();
    expect(s.answers['bank.accounts']).toHaveLength(2);
    expect(s.currentQuestionId).toBe('bank.locker.gate');

    const rendered = renderWill(clauseBlocks, s);
    const sbi = rendered.find((b) => b.text.includes('SBI'));
    const hdfc = rendered.find((b) => b.text.includes('HDFC'));
    expect(sbi?.text).toBe(
      'I bequeath the balance in my Savings account with SBI to Anita (Wife) absolutely. If they do not survive me, this bequest shall pass to their children in equal shares.',
    );
    expect(hdfc?.text).toBe(
      'I bequeath the balance in my Current account with HDFC, to be realised and the proceeds added to my residuary estate.',
    );
  });

  it('purges the finished repeater array when the mode is changed afterwards', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = skipUntil(s, 'bank.gate');
    s = reducer(s, { type: 'ANSWER', qid: 'bank.gate', value: 'yes', optionId: 'yes' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'per_account', optionId: 'per_account' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.bank_name', value: 'SBI' });
    s = reducer(s, { type: 'SKIP', qid: 'bank.account.branch' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.type', value: 'savings', optionId: 'savings' });
    s = reducer(s, { type: 'SKIP', qid: 'bank.account.last4' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.beneficiary.mode', value: 'sell', optionId: 'sell' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.account.nomination', value: 'none', optionId: 'none' });
    s = reducer(s, { type: 'REPEATER_FINISH', repeaterId: 'bank.accounts' });
    expect(s.answers['bank.accounts']).toHaveLength(1);

    s = reducer(s, { type: 'GOTO', qid: 'bank.mode' });
    s = reducer(s, { type: 'ANSWER', qid: 'bank.mode', value: 'all', optionId: 'all' });
    expect(s.currentQuestionId).toBe('bank.all.mode');
    expect(s.answers['bank.accounts']).toBeUndefined();
  });
});

describe('full simple-estate run (house, two accounts, executors, residuary)', () => {
  it('produces a will with every mandatory Phase-2 part', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = skipUntil(s, 'bank.gate');
    s = reducer(s, { type: 'ANSWER', qid: 'bank.gate', value: 'no', optionId: 'no' });
    expect(s.currentQuestionId).toBe('invest.gate');
    s = skipUntil(s, 'realestate.gate');

    s = reducer(s, { type: 'ANSWER', qid: 'realestate.gate', value: 'yes', optionId: 'yes' });
    expect(s.repeaterSession).toEqual({ repeaterId: 'realestate.items' });
    s = reducer(s, { type: 'ANSWER', qid: 'realestate.item.type', value: 'house', optionId: 'house' });
    s = reducer(s, { type: 'ANSWER', qid: 'realestate.item.desc', value: '12 cents & house, Sy.No 231/4, Vengara' });
    s = reducer(s, { type: 'ANSWER', qid: 'realestate.item.ownership', value: 'sole', optionId: 'sole' });
    expect(s.currentQuestionId).toBe('realestate.item.action');
    s = reducer(s, { type: 'ANSWER', qid: 'realestate.item.action', value: 'divide', optionId: 'divide' });
    expect(s.currentQuestionId).toBe('realestate.item.ben.people');
    s = reducer(s, {
      type: 'ANSWER_PEOPLE',
      qid: 'realestate.item.ben.people',
      personIds: ['p-anita', 'p-rahul'],
      newPeople: [
        { id: 'p-anita', name: 'Anita', relation: 'wife' },
        { id: 'p-rahul', name: 'Rahul', relation: 'son' },
      ],
    });
    expect(s.currentQuestionId).toBe('realestate.item.ben.shares');
    s = reducer(s, {
      type: 'ANSWER',
      qid: 'realestate.item.ben.shares',
      value: { mode: 'percentage', splits: { 'p-anita': 60, 'p-rahul': 40 } },
    });
    expect(s.currentQuestionId).toBe('realestate.item.ben.contingent.group_mode');
    s = reducer(s, { type: 'ANSWER', qid: 'realestate.item.ben.contingent.group_mode', value: 'others', optionId: 'others' });
    expect(s.currentQuestionId).toBe('realestate.item.rented');
    s = reducer(s, { type: 'ANSWER', qid: 'realestate.item.rented', value: 'no', optionId: 'no' });
    s = reducer(s, { type: 'ANSWER', qid: 'realestate.item.loan', value: 'no', optionId: 'no' });
    expect(s.currentQuestionId).toBe('realestate.items.__addmore__');
    s = reducer(s, { type: 'REPEATER_FINISH', repeaterId: 'realestate.items' });
    expect(s.currentQuestionId).toBe('vehicles.gate');
    s = skipUntil(s, 'residuary.primary');

    s = reducer(s, { type: 'ANSWER', qid: 'residuary.primary', value: 'one_person', optionId: 'one_person' });
    s = reducer(s, { type: 'ANSWER_PERSON', qid: 'residuary.primary.person', personId: 'p-anita' });
    expect(s.currentQuestionId).toBe('residuary.contingent');
    s = reducer(s, { type: 'ANSWER', qid: 'residuary.contingent', value: 'legal_heirs', optionId: 'legal_heirs' });
    expect(s.currentQuestionId).toBe('executors.physical.primary');

    s = reducer(s, { type: 'ANSWER_PERSON', qid: 'executors.physical.primary', personId: 'p-anita' });
    s = reducer(s, {
      type: 'ANSWER_PERSON',
      qid: 'executors.physical.secondary',
      personId: 'p-brother',
      newPerson: { id: 'p-brother', name: 'Suresh', relation: 'brother', address: 'Kozhikode' },
    });
    expect(s.currentQuestionId).toBe('executors.digital.same');
    s = reducer(s, { type: 'ANSWER', qid: 'executors.digital.same', value: 'yes', optionId: 'yes' });
    s = reducer(s, { type: 'ANSWER', qid: 'executors.powers', value: 'standard', optionId: 'standard' });
    s = reducer(s, { type: 'ANSWER', qid: 'executors.compensation', value: 'fixed', optionId: 'fixed' });
    expect(s.currentQuestionId).toBe('executors.compensation_amount');
    s = reducer(s, { type: 'ANSWER', qid: 'executors.compensation_amount', value: 50000 });
    s = reducer(s, { type: 'ANSWER', qid: 'executors.informed', value: 'yes', optionId: 'yes' });
    expect(s.currentQuestionId).toBeNull();

    const rendered = renderWill(clauseBlocks, s);
    const text = rendered.map((b) => b.text).join('\n');

    expect(text).toContain('I appoint Anita (Wife) as the Executor of this Will.');
    expect(text).toContain(
      'If they are unable or unwilling to act, I appoint Suresh (Brother) as Executor in their place.',
    );
    expect(text).toContain('My Executor shall be paid ₹50,000 from my estate for acting as Executor.');
    expect(text).toContain(
      'I direct my Executor to first pay from my estate my funeral expenses, all my just debts, taxes and liabilities, and the costs of administering my estate.',
    );
    expect(text).toContain('my property, namely 12 cents & house, Sy.No 231/4, Vengara');
    expect(text).toContain('Anita (Wife), Rahul (Son)');
    expect(text).toContain('in the following proportions: Anita (Wife) — 60%; Rahul (Son) — 40%');
    expect(text).toContain('their share shall be shared equally by the survivors.');
    expect(text).toContain(
      'All the rest and residue of my estate, whether movable or immovable, present or future, including any property not specifically dealt with in this Will and any bequest that fails, I give and bequeath to Anita (Wife). If none of the above survive me, my residuary estate shall pass to my legal heirs, in accordance with the law applicable to me.',
    );

    // clause numbering has no gaps
    const numbers = rendered.filter((b) => b.kind === 'clause').map((b) => b.number);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });
});

describe('life-interest real estate bequest', () => {
  it('renders the occupant/remainder sentence', () => {
    const s: AppState = {
      ...initialState(),
      people: [
        { id: 'mom', name: 'Kamala', relation: 'mother' },
        { id: 'son', name: 'Anand', relation: 'son' },
      ],
      answers: {
        'personal.full_name': 'Test Person',
        'personal.sound_mind': 'confirm',
        'realestate.items': [
          {
            type: 'house',
            desc: 'Family home at Palakkad',
            ownership: 'sole',
            action: 'life_interest',
            'life.occupant': 'mom',
            'life.remainder': 'son',
            rented: 'no',
            loan: 'no',
          },
        ],
      },
    };
    const rendered = renderWill(clauseBlocks, s);
    const clause = rendered.find((b) => b.text.includes('Palakkad'));
    expect(clause?.text).toBe(
      'I give and bequeath my property, namely Family home at Palakkad. I give Kamala (Mother) the right to reside in and enjoy it for their lifetime, without power of sale, and upon their death it shall pass absolutely to Anand (Son).',
    );
  });
});
