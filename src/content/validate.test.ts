import { describe, expect, it } from 'vitest';
import { validateContent, checkQuestionReferences, checkCondition } from './validate';
import type { Question, Condition } from '../engine/types';

describe('content validator', () => {
  it('passes on the real content set', () => {
    expect(validateContent()).toEqual([]);
  });
});

describe('checkQuestionReferences', () => {
  const q = (over: Partial<Question>): Question => ({
    id: 'x',
    section: 'x',
    type: 'single',
    text: 'q.x',
    ...over,
  });

  it('flags a dangling `next` and suggests the closest real id', () => {
    const questions = [q({ id: 'bank.gate', next: 'bank.modee' }), q({ id: 'bank.mode' })];
    const errors = checkQuestionReferences(questions, new Set(['bank.gate', 'bank.mode']));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('unknown question "bank.modee"');
    expect(errors[0]).toContain('did you mean "bank.mode"?');
  });

  it('flags a dangling option `next`', () => {
    const questions = [
      q({ id: 'q1', options: [{ id: 'yes', label: 'q.x.opt.yes', next: 'q2x' }] }),
    ];
    const errors = checkQuestionReferences(questions, new Set(['q1']));
    expect(errors[0]).toContain('option "yes"');
    expect(errors[0]).toContain('unknown question "q2x"');
  });

  it('flags a duplicate question id', () => {
    const questions = [q({ id: 'dup' }), q({ id: 'dup' })];
    const errors = checkQuestionReferences(questions, new Set(['dup']));
    expect(errors).toContain('Duplicate question id "dup"');
  });

  it('accepts ITEM_END as a valid next target', () => {
    const questions = [q({ id: 'q1', next: '__ITEM_END__' })];
    expect(checkQuestionReferences(questions, new Set(['q1']))).toEqual([]);
  });
});

describe('checkCondition', () => {
  it('flags an eq condition missing its value', () => {
    const errors: string[] = [];
    checkCondition({ eq: ['personal.relation_line'] } as unknown as Condition, 'test', errors);
    expect(errors).toEqual(['test: malformed "eq" condition']);
  });

  it('flags an empty and/or array', () => {
    const errors: string[] = [];
    checkCondition({ and: [] }, 'test', errors);
    expect(errors).toEqual(['test: "and" must be a non-empty array']);
  });

  it('recurses into nested and/or/not', () => {
    const errors: string[] = [];
    checkCondition({ not: { or: [{ eq: ['a', 1] }, { exists: '' }] } }, 'test', errors);
    expect(errors).toEqual(['test.not.or[1]: malformed "exists" condition']);
  });

  it('accepts a well-formed condition tree', () => {
    const errors: string[] = [];
    checkCondition(
      { and: [{ eq: ['a', 'b'] }, { or: [{ notEmpty: 'c' }, { not: { exists: 'd' } }] }] },
      'test',
      errors,
    );
    expect(errors).toEqual([]);
  });
});
