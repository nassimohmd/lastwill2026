import { describe, expect, it } from 'vitest';
import { graph } from '../data/graph';
import type { AppState } from './types';
import { initialState } from '../state/store';
import { ITEM_END } from './repeaters';

function stateWith(answers: Record<string, unknown>): AppState {
  return { ...initialState(), answers };
}

describe('next-question resolution', () => {
  it('follows option-level next', () => {
    const s = stateWith({});
    expect(
      graph.resolveNext('funeral.method', s, { chosenOptionId: 'burial' }),
    ).toBe('funeral.burial.place');
    expect(
      graph.resolveNext('funeral.method', s, { chosenOptionId: 'cremation' }),
    ).toBe('funeral.cremation.place');
    expect(
      graph.resolveNext('funeral.method', s, { chosenOptionId: 'donate_science' }),
    ).toBe('funeral.body_donation.institution');
  });

  it('falls back to question default next when the option has none', () => {
    const s = stateWith({});
    expect(
      graph.resolveNext('funeral.method', s, { chosenOptionId: 'family_decides' }),
    ).toBe('funeral.memorial');
  });

  it('skip ignores option edges and uses the default', () => {
    const s = stateWith({});
    expect(graph.resolveNext('funeral.burial.place', s, { skip: true })).toBe(
      'funeral.burial.rites',
    );
  });

  it('skipping a gate question skips its whole section', () => {
    const s = stateWith({});
    // funeral's next section is organ — gate-skip jumps straight to its start
    expect(graph.resolveNext('funeral.method', s, { skip: true })).toBe('organ.gate');
  });

  it('falls through to declared section order, crossing sections', () => {
    const s = stateWith({});
    // last personal question → first funeral question
    expect(graph.resolveNext('personal.occupation', s, {})).toBe('funeral.method');
    // address has no explicit next → next in declared order
    expect(graph.resolveNext('personal.address', s, {})).toBe('personal.id_type');
  });

  it('bypasses questions whose when-condition is false', () => {
    // age warning only shows for minors
    const adult = stateWith({ 'personal.underage': false });
    expect(graph.resolveNext('personal.dob', adult, {})).toBe('personal.address');
    const minor = stateWith({ 'personal.underage': true });
    expect(graph.resolveNext('personal.dob', minor, {})).toBe('personal.age_warning');
  });

  it('bypasses spouse-name when it already came from the relation line', () => {
    const viaRelation = stateWith({ 'personal.relation_line': 'wife_of' });
    expect(
      graph.resolveNext('personal.marital_status', viaRelation, { chosenOptionId: 'married' }),
    ).toBe('personal.children_gate');
    const notViaRelation = stateWith({ 'personal.relation_line': 'son_of' });
    expect(
      graph.resolveNext('personal.marital_status', notViaRelation, { chosenOptionId: 'married' }),
    ).toBe('personal.spouse_name');
  });

  it('body-donation fallback re-enters the burial branch', () => {
    const s = stateWith({});
    expect(
      graph.resolveNext('funeral.body_donation.fallback', s, { chosenOptionId: 'burial' }),
    ).toBe('funeral.burial.place');
  });

  it('every declared edge points at a real question (or the repeater-end sentinel)', () => {
    for (const q of graph.questions.values()) {
      const targets = [
        q.next,
        ...(q.options?.map((o) => o.next) ?? []),
        ...(q.nextRules?.map((r) => r.goto) ?? []),
      ].filter((x): x is string => Boolean(x));
      for (const target of targets) {
        if (target === ITEM_END) continue;
        expect(graph.questions.has(target), `${q.id} → ${target}`).toBe(true);
      }
    }
  });
});
