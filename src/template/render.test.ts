import { describe, expect, it } from 'vitest';
import { renderWill, willToText, generationBlockers } from './render';
import { clauseBlocks } from '../data/clauses';
import { initialState, reducer } from '../state/store';
import type { AppState } from '../engine/types';

function stateWith(answers: Record<string, unknown>, people: AppState['people'] = []): AppState {
  return { ...initialState(), answers, people };
}

const base = {
  'personal.full_name': 'Nassim Mohammed',
  'personal.relation_line': 'son_of',
  'personal.relation_name': 'Abdul Kareem',
  'personal.dob': '1980-05-10',
  'personal.address': '12/345, Beach Road, Kozhikode, Kerala',
  'personal.id_type': 'pan',
  'personal.id_value': 'ABCDE1234F',
  'personal.sound_mind': 'confirm',
};

describe('will rendering', () => {
  it('renders the declaration with relation, age and ID fragments', () => {
    const blocks = renderWill(clauseBlocks, stateWith(base));
    const decl = blocks.find((b) => b.id === 'declaration')!;
    expect(decl.text).toContain('I, Nassim Mohammed, son of Abdul Kareem');
    expect(decl.text).toContain('holding PAN No. ABCDE1234F');
    expect(decl.text).toMatch(/aged \d+ years/);
  });

  it('omits the relation fragment when the name was skipped, rather than leaving a dangling comma', () => {
    const blocks = renderWill(
      clauseBlocks,
      stateWith({ ...base, 'personal.relation_name': undefined }),
    );
    const decl = blocks.find((b) => b.id === 'declaration')!;
    expect(decl.text).not.toContain('son of');
    expect(decl.text).not.toMatch(/,\s*,/); // no adjacent-comma blank left behind
    expect(decl.text).toContain('I, Nassim Mohammed,');
  });

  it('omits fragments for unanswered questions', () => {
    const blocks = renderWill(
      clauseBlocks,
      stateWith({ 'personal.full_name': 'A', 'personal.address': 'B' }),
    );
    const decl = blocks.find((b) => b.id === 'declaration')!;
    expect(decl.text).not.toContain('son of');
    expect(decl.text).not.toContain('holding');
    expect(decl.text).not.toContain('aged');
  });

  it('renders burial clause only for burial (or donation fallback burial)', () => {
    const burial = renderWill(
      clauseBlocks,
      stateWith({
        ...base,
        'funeral.method': 'burial',
        'funeral.burial.place': 'mosque',
        'funeral.burial.place_detail': 'Palayam Juma Masjid, Kozhikode',
        'funeral.burial.rites': 'customs',
      }),
    );
    const clause = burial.find((b) => b.id === 'funeral.burial')!;
    expect(clause.text).toBe(
      'I desire and direct that my body be buried at the burial ground (qabristan) of Palayam Juma Masjid, Kozhikode, with the customary rites of my faith.',
    );
    expect(burial.find((b) => b.id === 'funeral.cremation')).toBeUndefined();

    const cremation = renderWill(
      clauseBlocks,
      stateWith({ ...base, 'funeral.method': 'cremation' }),
    );
    expect(cremation.find((b) => b.id === 'funeral.burial')).toBeUndefined();
  });

  it('handles the donate-to-science + fallback chain', () => {
    const blocks = renderWill(
      clauseBlocks,
      stateWith({
        ...base,
        'funeral.method': 'donate_science',
        'funeral.body_donation.institution_name': 'Government Medical College, Kozhikode',
        'funeral.body_donation.fallback': 'cremation',
        'funeral.cremation.place': 'local',
        'funeral.cremation.ashes': 'kept',
      }),
    );
    const donation = blocks.find((b) => b.id === 'funeral.donation')!;
    expect(donation.text).toContain('preferably to Government Medical College, Kozhikode');
    expect(donation.text).toContain('the cremation directions below shall apply');
    const cremation = blocks.find((b) => b.id === 'funeral.cremation')!;
    expect(cremation.text).toContain('cremated at the local crematorium');
    expect(cremation.text).toContain('My ashes shall be kept by my family.');
  });

  it('includes the Muslim compliance clause only for Muslim testators', () => {
    const muslim = renderWill(
      clauseBlocks,
      stateWith({ ...base, 'personal.religion': 'muslim' }),
    );
    expect(muslim.find((b) => b.id === 'muslim')).toBeDefined();
    const hindu = renderWill(
      clauseBlocks,
      stateWith({ ...base, 'personal.religion': 'hindu' }),
    );
    expect(hindu.find((b) => b.id === 'muslim')).toBeUndefined();
  });

  it('builds the family sentence from the registry', () => {
    const blocks = renderWill(
      clauseBlocks,
      stateWith(
        { ...base, 'personal.spouse_name': 'Ayesha', 'personal.children': [{ name: 'Rahul' }] },
        [
          { id: 'spouse', name: 'Ayesha', relation: 'wife' },
          { id: 'child-0', name: 'Rahul', relation: 'son', minor: true },
          { id: 'child-1', name: 'Meera', relation: 'daughter' },
        ],
      ),
    );
    const family = blocks.find((b) => b.id === 'family')!;
    expect(family.text).toBe(
      'My family consists of my wife Ayesha, my son Rahul (a minor) and my daughter Meera.',
    );
  });

  it('numbers clauses continuously with no gaps', () => {
    const blocks = renderWill(clauseBlocks, stateWith(base));
    const numbers = blocks.filter((b) => b.kind === 'clause').map((b) => b.number);
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });

  it('formats the cost limit in Indian grouping', () => {
    const blocks = renderWill(
      clauseBlocks,
      stateWith({ ...base, 'funeral.cost': 'limit', 'funeral.cost_amount': 250000 }),
    );
    const cost = blocks.find((b) => b.id === 'funeral.cost')!;
    expect(cost.text).toBe('My funeral expenses shall not exceed ₹2,50,000.');
  });

  it('serialises to plain text with numbering', () => {
    const text = willToText(renderWill(clauseBlocks, stateWith(base)));
    expect(text).toContain('LAST WILL AND TESTAMENT OF NASSIM MOHAMMED');
    expect(text).toContain('1. I declare that I am of sound mind');
  });

  it('blocks generation for minors and missing sound-mind confirmation', () => {
    expect(generationBlockers(stateWith(base))).toEqual([]);
    expect(
      generationBlockers(stateWith({ ...base, 'personal.underage': true })),
    ).toContain('underage');
    const { 'personal.sound_mind': _omit, ...rest } = base;
    expect(generationBlockers(stateWith(rest))).toContain('sound_mind');
  });
});

describe('reducer answer invalidation', () => {
  it('purges stale branch answers when an earlier answer changes', () => {
    let s = initialState();
    const answer = (qid: string, value: unknown, optionId?: string) => {
      s = reducer(s, { type: 'ANSWER', qid, value, optionId });
    };
    s = reducer(s, { type: 'START' });
    answer('personal.full_name', 'Test Person');
    answer('personal.relation_line', 'none', 'none');
    answer('personal.dob', '1980-01-01');
    answer('personal.address', 'Somewhere');
    answer('personal.id_type', 'none', 'none');
    answer('personal.religion', 'hindu', 'hindu');
    answer('personal.marital_status', 'unmarried', 'unmarried');
    answer('personal.children_gate', 'no', 'no');
    answer('personal.prior_will', 'no', 'no');
    answer('personal.sound_mind', 'confirm', 'confirm');
    answer('personal.occupation', 'Teacher');
    expect(s.currentQuestionId).toBe('funeral.method');

    // go down the burial branch…
    answer('funeral.method', 'burial', 'burial');
    answer('funeral.burial.place', 'public', 'public');
    answer('funeral.burial.rites', 'simple', 'simple');
    expect(s.currentQuestionId).toBe('funeral.memorial');

    // …then change to cremation: burial answers must be purged
    s = reducer(s, { type: 'GOTO', qid: 'funeral.method' });
    answer('funeral.method', 'cremation', 'cremation');
    expect(s.currentQuestionId).toBe('funeral.cremation.place');
    expect(s.answers['funeral.burial.place']).toBeUndefined();
    expect(s.answers['funeral.burial.rites']).toBeUndefined();

    const rendered = renderWill(clauseBlocks, s);
    expect(rendered.find((b) => b.id === 'funeral.burial')).toBeUndefined();
  });

  it('records skips and derives age', () => {
    let s = initialState();
    s = reducer(s, { type: 'START' });
    s = reducer(s, { type: 'ANSWER', qid: 'personal.full_name', value: 'X' });
    s = reducer(s, { type: 'SKIP', qid: 'personal.relation_line' });
    expect(s.skipped).toContain('personal.relation_line');
    expect(s.currentQuestionId).toBe('personal.dob');
    s = reducer(s, { type: 'ANSWER', qid: 'personal.dob', value: '2015-01-01' });
    expect(s.answers['personal.underage']).toBe(true);
    expect(s.currentQuestionId).toBe('personal.age_warning');
  });
});
