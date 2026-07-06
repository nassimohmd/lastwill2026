import type { Condition } from './types';

/**
 * The context a condition is evaluated against. Paths resolve against
 * `answers` by default; a "people" prefix reaches the registry, and inside
 * template loops an "item." prefix reaches the current loop item.
 */
export interface EvalContext {
  answers: Record<string, unknown>;
  item?: Record<string, unknown>;
}

/** Resolve a dotted path. Bare keys hit `answers` (which uses flat dotted keys). */
export function resolvePath(path: string, ctx: EvalContext): unknown {
  if (path.startsWith('item.') && ctx.item) {
    return ctx.item[path.slice('item.'.length)];
  }
  if (path.startsWith('answers.')) {
    return ctx.answers[path.slice('answers.'.length)];
  }
  return ctx.answers[path];
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function evaluate(cond: Condition, ctx: EvalContext): boolean {
  if ('eq' in cond) return resolvePath(cond.eq[0], ctx) === cond.eq[1];
  if ('in' in cond) return cond.in[1].includes(resolvePath(cond.in[0], ctx));
  if ('exists' in cond) return resolvePath(cond.exists, ctx) !== undefined;
  if ('notEmpty' in cond) return !isEmpty(resolvePath(cond.notEmpty, ctx));
  if ('and' in cond) return cond.and.every((c) => evaluate(c, ctx));
  if ('or' in cond) return cond.or.some((c) => evaluate(c, ctx));
  if ('not' in cond) return !evaluate(cond.not, ctx);
  throw new Error(`Unknown condition: ${JSON.stringify(cond)}`);
}
