import { describe, expect, it } from 'vitest';
import { evaluate } from './conditions';

const ctx = {
  answers: {
    'funeral.method': 'burial',
    'personal.religion': 'muslim',
    'personal.underage': false,
    'bank.accounts': [{ bank: 'SBI' }],
    'funeral.notes': '   ',
    'personal.children': [],
  },
};

describe('condition DSL', () => {
  it('eq', () => {
    expect(evaluate({ eq: ['funeral.method', 'burial'] }, ctx)).toBe(true);
    expect(evaluate({ eq: ['funeral.method', 'cremation'] }, ctx)).toBe(false);
    expect(evaluate({ eq: ['personal.underage', false] }, ctx)).toBe(true);
    expect(evaluate({ eq: ['missing.key', 'x'] }, ctx)).toBe(false);
  });

  it('in', () => {
    expect(evaluate({ in: ['funeral.method', ['burial', 'cremation']] }, ctx)).toBe(true);
    expect(evaluate({ in: ['funeral.method', ['cremation']] }, ctx)).toBe(false);
  });

  it('exists', () => {
    expect(evaluate({ exists: 'funeral.method' }, ctx)).toBe(true);
    expect(evaluate({ exists: 'missing.key' }, ctx)).toBe(false);
    // exists is presence, not truthiness
    expect(evaluate({ exists: 'personal.underage' }, ctx)).toBe(true);
  });

  it('notEmpty treats blank strings and empty arrays as empty', () => {
    expect(evaluate({ notEmpty: 'bank.accounts' }, ctx)).toBe(true);
    expect(evaluate({ notEmpty: 'funeral.notes' }, ctx)).toBe(false);
    expect(evaluate({ notEmpty: 'personal.children' }, ctx)).toBe(false);
    expect(evaluate({ notEmpty: 'missing.key' }, ctx)).toBe(false);
  });

  it('and / or / not compose', () => {
    expect(
      evaluate(
        {
          and: [
            { eq: ['funeral.method', 'burial'] },
            { not: { eq: ['personal.religion', 'hindu'] } },
          ],
        },
        ctx,
      ),
    ).toBe(true);
    expect(
      evaluate(
        { or: [{ eq: ['funeral.method', 'x'] }, { eq: ['personal.religion', 'muslim'] }] },
        ctx,
      ),
    ).toBe(true);
    expect(evaluate({ or: [] }, ctx)).toBe(false);
    expect(evaluate({ and: [] }, ctx)).toBe(true);
  });

  it('answers. prefix and item. prefix resolve', () => {
    expect(evaluate({ eq: ['answers.funeral.method', 'burial'] }, ctx)).toBe(true);
    expect(
      evaluate({ eq: ['item.type', 'house'] }, { ...ctx, item: { type: 'house' } }),
    ).toBe(true);
  });
});
