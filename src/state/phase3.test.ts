import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './store';
import type { AppState } from '../engine/types';
import { renderWill, generationBlockers } from '../template/render';
import { clauseBlocks } from '../data/clauses';
import { sections } from '../data/graph';

function answerMandatory(s: AppState, qid: string): AppState | null {
  if (qid === 'personal.full_name') return reducer(s, { type: 'ANSWER', qid, value: 'Skip Everyone' });
  if (qid === 'personal.sound_mind') return reducer(s, { type: 'ANSWER', qid, value: 'confirm', optionId: 'confirm' });
  return null;
}

describe('skip-everything smoke test across all 18 sections', () => {
  it('walks the entire interview via Skip and still renders a valid will', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    const visited: string[] = [];
    let steps = 0;
    while (s.currentQuestionId !== null) {
      if (steps++ > 400) throw new Error(`runaway loop, stuck around ${s.currentQuestionId}`);
      const qid = s.currentQuestionId;
      visited.push(qid);
      const mandatory = answerMandatory(s, qid);
      s = mandatory ?? reducer(s, { type: 'SKIP', qid });
    }

    // every section's gate question was at least reached
    for (const section of sections) {
      expect(visited, `section "${section.id}" never reached`).toContain(section.order[0]);
    }

    expect(generationBlockers(s)).toEqual([]);
    const rendered = renderWill(clauseBlocks, s);
    expect(rendered.some((b) => b.kind === 'title')).toBe(true);
    expect(rendered.some((b) => b.id === 'attestation')).toBe(true);
    // nothing asset-related should render — everything was skipped
    expect(rendered.some((b) => b.id.startsWith('bank.'))).toBe(false);
    expect(rendered.some((b) => b.id === 'residuary')).toBe(false);

    const numbers = rendered.filter((b) => b.kind === 'clause').map((b) => b.number);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });
});

describe('organ donation', () => {
  it('is skipped entirely when the body is donated to science', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = reducer(s, { type: 'ANSWER', qid: 'personal.full_name', value: 'X' });
    while (s.currentQuestionId !== 'funeral.method') s = reducer(s, { type: 'SKIP', qid: s.currentQuestionId! });
    s = reducer(s, { type: 'ANSWER', qid: 'funeral.method', value: 'donate_science', optionId: 'donate_science' });
    expect(s.currentQuestionId).toBe('funeral.body_donation.institution');
    s = reducer(s, { type: 'SKIP', qid: 'funeral.body_donation.institution' });
    s = reducer(s, { type: 'ANSWER', qid: 'funeral.body_donation.fallback', value: 'family', optionId: 'family' });
    expect(s.currentQuestionId).toBe('funeral.memorial');
    s = reducer(s, { type: 'SKIP', qid: 'funeral.memorial' });
    s = reducer(s, { type: 'SKIP', qid: 'funeral.cost' });
    s = reducer(s, { type: 'SKIP', qid: 'funeral.notes' });
    // organ.gate's `when` hides it entirely since donate_science is set
    expect(s.currentQuestionId).toBe('guardianship.gate');
  });

  it('renders the specific-organs clause with the registration note', () => {
    const s: AppState = {
      ...initialState(),
      answers: {
        'personal.full_name': 'X',
        'personal.sound_mind': 'confirm',
        'organ.gate': 'yes_specific',
        'organ.specific': ['kidneys', 'eyes'],
        'organ.registered': 'yes',
        'organ.registered_details': 'NOTTO #12345',
      },
    };
    const rendered = renderWill(clauseBlocks, s);
    const organ = rendered.find((b) => b.id === 'organ');
    expect(organ?.text).toBe(
      'I wish to donate the following upon my death: Kidneys, Eyes / corneas, and I request my family and physicians to give effect to this wish without delay. I am a registered organ donor (NOTTO #12345).',
    );
  });
});

describe('guardianship', () => {
  it('routes to the dependents repeater after the minors block when gate is "both"', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = reducer(s, { type: 'ANSWER', qid: 'personal.full_name', value: 'X' });
    while (s.currentQuestionId !== 'guardianship.gate') s = reducer(s, { type: 'SKIP', qid: s.currentQuestionId! });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.gate', value: 'both', optionId: 'both' });
    expect(s.currentQuestionId).toBe('guardianship.primary');
    s = reducer(s, {
      type: 'ANSWER_PERSON',
      qid: 'guardianship.primary',
      personId: 'p-aunt',
      newPerson: { id: 'p-aunt', name: 'Latha', relation: 'sister' },
    });
    s = reducer(s, { type: 'ANSWER_PERSON', qid: 'guardianship.alternate', personId: 'p-aunt' });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.property_guardian', value: 'same', optionId: 'same' });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.until_age', value: '21', optionId: '21' });
    s = reducer(s, { type: 'SKIP', qid: 'guardianship.upbringing' });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.provision', value: 'general_estate', optionId: 'general_estate' });
    // "both" -> should now enter the dependents repeater instead of jumping to debts
    expect(s.currentQuestionId).toBe('guardianship.dependents.item.person');
    expect(s.repeaterSession).toEqual({ repeaterId: 'guardianship.dependents' });
  });

  it('routes straight to debts when gate is "minors" only', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = reducer(s, { type: 'ANSWER', qid: 'personal.full_name', value: 'X' });
    while (s.currentQuestionId !== 'guardianship.gate') s = reducer(s, { type: 'SKIP', qid: s.currentQuestionId! });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.gate', value: 'minors', optionId: 'minors' });
    s = reducer(s, { type: 'SKIP', qid: 'guardianship.primary' });
    s = reducer(s, { type: 'SKIP', qid: 'guardianship.alternate' });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.property_guardian', value: 'same', optionId: 'same' });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.until_age', value: '18', optionId: '18' });
    s = reducer(s, { type: 'SKIP', qid: 'guardianship.upbringing' });
    s = reducer(s, { type: 'ANSWER', qid: 'guardianship.provision', value: 'no', optionId: 'no' });
    expect(s.currentQuestionId).toBe('debts.gate');
  });
});

describe('investments — insurance is recorded but not re-bequeathed', () => {
  it('skips the beneficiary chain for an insurance-type item', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = reducer(s, { type: 'ANSWER', qid: 'personal.full_name', value: 'X' });
    while (s.currentQuestionId !== 'invest.gate') s = reducer(s, { type: 'SKIP', qid: s.currentQuestionId! });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.gate', value: 'yes', optionId: 'yes' });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.item.type', value: 'insurance', optionId: 'insurance' });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.item.desc', value: 'LIC policy 12345' });
    // beneficiary.mode's `when` is false for insurance — should skip straight to nomination
    expect(s.currentQuestionId).toBe('invest.item.nomination');
    s = reducer(s, { type: 'ANSWER', qid: 'invest.item.nomination', value: 'same', optionId: 'same' });
    expect(s.currentQuestionId).toBe('invest.items.__addmore__');

    s = reducer(s, { type: 'REPEATER_FINISH', repeaterId: 'invest.items' });
    const rendered = renderWill(clauseBlocks, s);
    const clause = rendered.find((b) => b.id === 'invest.item');
    expect(clause?.text).toBe(
      'I bequeath my interest in LIC policy 12345 (Life insurance policy) — the proceeds of this policy are payable to its nominee under insurance law; I direct my Executor to notify the insurer and assist with the claim.',
    );
  });

  it('routes crypto items to the access-instructions question', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = reducer(s, { type: 'ANSWER', qid: 'personal.full_name', value: 'X' });
    while (s.currentQuestionId !== 'invest.gate') s = reducer(s, { type: 'SKIP', qid: s.currentQuestionId! });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.gate', value: 'yes', optionId: 'yes' });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.item.type', value: 'crypto', optionId: 'crypto' });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.item.desc', value: 'BTC wallet' });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.item.beneficiary.mode', value: 'residuary', optionId: 'residuary' });
    s = reducer(s, { type: 'ANSWER', qid: 'invest.item.nomination', value: 'none', optionId: 'none' });
    expect(s.currentQuestionId).toBe('invest.item.crypto_access');
  });
});

describe('multi-select answers', () => {
  it('stores an array and renders via labelList', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = reducer(s, { type: 'ANSWER', qid: 'personal.full_name', value: 'X' });
    while (s.currentQuestionId !== 'organ.gate') s = reducer(s, { type: 'SKIP', qid: s.currentQuestionId! });
    s = reducer(s, { type: 'ANSWER', qid: 'organ.gate', value: 'yes_specific', optionId: 'yes_specific' });
    expect(s.currentQuestionId).toBe('organ.specific');
    s = reducer(s, { type: 'ANSWER', qid: 'organ.specific', value: ['heart', 'lungs'] });
    expect(s.answers['organ.specific']).toEqual(['heart', 'lungs']);
    expect(s.currentQuestionId).toBe('organ.registered');
  });
});

describe('receivables and vehicles bequests', () => {
  it('renders collect-and-give-to-person and forgive clauses', () => {
    const s: AppState = {
      ...initialState(),
      people: [{ id: 'p1', name: 'Ravi', relation: 'friend' }],
      answers: {
        'personal.full_name': 'X',
        'personal.sound_mind': 'confirm',
        'receivables.items': [
          { who: 'Ravi', amount: 20000, proof: 'informal', action: 'collect_person', person: 'p1', 'contingent.mode': 'residuary' },
          { who: 'Uncle Tom', amount: 5000, proof: 'written', action: 'forgive' },
        ],
      },
    };
    const rendered = renderWill(clauseBlocks, s);
    const collect = rendered.find((b) => b.text.includes('Ravi'));
    const forgive = rendered.find((b) => b.text.includes('Uncle Tom'));
    expect(collect?.text).toBe(
      'The sum of ₹20,000 due to me from Ravi shall be recovered and paid to Ravi (Friend) absolutely. If they do not survive me, this bequest shall fall into my residuary estate.',
    );
    expect(forgive?.text).toBe(
      'I forgive and release the debt of ₹5,000 owed to me by Uncle Tom, and direct that no claim be made in respect of it.',
    );
  });

  it('renders a vehicle bequest to a person with a loan note', () => {
    const s: AppState = {
      ...initialState(),
      people: [{ id: 'p1', name: 'Deepak', relation: 'brother' }],
      answers: {
        'personal.full_name': 'X',
        'personal.sound_mind': 'confirm',
        'vehicles.items': [
          { type: 'car', desc: 'Maruti Swift KL-11-AB-1234', reg: 'KL-11-AB-1234', action: 'person', person: 'p1', loan: 'yes' },
        ],
      },
    };
    const rendered = renderWill(clauseBlocks, s);
    const clause = rendered.find((b) => b.id === 'vehicles.item');
    expect(clause?.text).toBe(
      'I bequeath my Maruti Swift KL-11-AB-1234 to Deepak (Brother) absolutely. If they do not survive me, this bequest shall pass to their children in equal shares. This bequest passes subject to any loan secured on it being settled by my Executor.',
    );
  });
});

describe('digital life', () => {
  it('renders the access clause and its footer only when the digital section was engaged', () => {
    const engaged: AppState = {
      ...initialState(),
      answers: {
        'personal.full_name': 'X',
        'personal.sound_mind': 'confirm',
        'digital.gate': 'yes',
        'digital.access': 'password_manager',
      },
    };
    const rendered = renderWill(clauseBlocks, engaged);
    expect(rendered.some((b) => b.id === 'digital.access')).toBe(true);
    expect(rendered.some((b) => b.id === 'digital.access.footer')).toBe(true);
    expect(rendered.some((b) => b.id === 'part.digital')).toBe(true);

    const skipped: AppState = {
      ...initialState(),
      answers: { 'personal.full_name': 'X', 'personal.sound_mind': 'confirm', 'digital.gate': 'no' },
    };
    const renderedSkipped = renderWill(clauseBlocks, skipped);
    expect(renderedSkipped.some((b) => b.id === 'part.digital')).toBe(false);
    expect(renderedSkipped.some((b) => b.id.startsWith('digital.'))).toBe(false);
  });
});
