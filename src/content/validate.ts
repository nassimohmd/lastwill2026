import type { Condition, Question } from '../engine/types';
import { ITEM_END } from '../engine/repeaters';
import { allQuestions, graph, sections, clauseBlocks, repeaterDefs, contentEn } from './load';
import { reducer, initialState } from '../state/store';
import { renderWill, generationBlockers } from '../template/render';

/**
 * Content is owner-edited through Pages CMS, which can produce structurally
 * broken JSON (a typo'd `next` target, a dangling repeater `entryId`) that
 * TypeScript can't catch. This runs at `prebuild` (see package.json) so a
 * bad commit fails the Vercel build — the last good deploy stays live —
 * instead of shipping a broken interview or a crash mid-will-generation.
 */

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function suggest(target: string, candidates: string[]): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(target, c);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best !== null && bestDist <= Math.max(3, Math.floor(target.length / 3)) ? best : null;
}

function suffix(target: string, candidates: string[]): string {
  const hint = suggest(target, candidates);
  return hint ? ` (did you mean "${hint}"?)` : '';
}

export function checkCondition(cond: Condition, where: string, errors: string[]): void {
  if ('eq' in cond) {
    if (!Array.isArray(cond.eq) || cond.eq.length !== 2 || typeof cond.eq[0] !== 'string' || !cond.eq[0]) {
      errors.push(`${where}: malformed "eq" condition`);
    }
  } else if ('in' in cond) {
    if (
      !Array.isArray(cond.in) ||
      cond.in.length !== 2 ||
      typeof cond.in[0] !== 'string' ||
      !cond.in[0] ||
      !Array.isArray(cond.in[1])
    ) {
      errors.push(`${where}: malformed "in" condition`);
    }
  } else if ('exists' in cond) {
    if (typeof cond.exists !== 'string' || !cond.exists) errors.push(`${where}: malformed "exists" condition`);
  } else if ('notEmpty' in cond) {
    if (typeof cond.notEmpty !== 'string' || !cond.notEmpty) errors.push(`${where}: malformed "notEmpty" condition`);
  } else if ('and' in cond) {
    if (!Array.isArray(cond.and) || cond.and.length === 0) errors.push(`${where}: "and" must be a non-empty array`);
    else cond.and.forEach((c, i) => checkCondition(c, `${where}.and[${i}]`, errors));
  } else if ('or' in cond) {
    if (!Array.isArray(cond.or) || cond.or.length === 0) errors.push(`${where}: "or" must be a non-empty array`);
    else cond.or.forEach((c, i) => checkCondition(c, `${where}.or[${i}]`, errors));
  } else if ('not' in cond) {
    checkCondition(cond.not, `${where}.not`, errors);
  } else {
    errors.push(`${where}: unrecognized condition shape ${JSON.stringify(cond)}`);
  }
}

/** Drives the interview via Skip only, exactly like the "skip-everything
 *  smoke test" in src/state/phase3.test.ts, then renders the will — proves
 *  every section is reachable and the whole content set renders end to end. */
function walkSkipEverythingAndRender(errors: string[]): void {
  let s = initialState();
  s = reducer(s, { type: 'START' });
  const visited: string[] = [];
  let steps = 0;
  while (s.currentQuestionId !== null) {
    if (steps++ > 2000) {
      errors.push(`Reachability walk exceeded 2000 steps — possible cycle near "${s.currentQuestionId}"`);
      return;
    }
    const qid = s.currentQuestionId;
    visited.push(qid);
    if (qid === 'personal.full_name') {
      s = reducer(s, { type: 'ANSWER', qid, value: 'Content Validator' });
    } else if (qid === 'personal.sound_mind') {
      s = reducer(s, { type: 'ANSWER', qid, value: 'confirm', optionId: 'confirm' });
    } else {
      s = reducer(s, { type: 'SKIP', qid });
    }
  }

  for (const section of sections) {
    if (section.order.length > 0 && !visited.includes(section.order[0])) {
      errors.push(`Section "${section.id}" is unreachable via the skip-everything path`);
    }
  }

  if (generationBlockers(s).length > 0) {
    errors.push(`Skip-everything path still has generation blockers: ${generationBlockers(s).join(', ')}`);
  }

  try {
    const rendered = renderWill(clauseBlocks, s);
    if (!rendered.some((b) => b.kind === 'title')) errors.push('Rendered will is missing its title block');
    if (!rendered.some((b) => b.id === 'attestation')) errors.push('Rendered will is missing its attestation block');
  } catch (e) {
    errors.push(`renderWill() threw on the skip-everything path: ${(e as Error).message}`);
  }
}

/** Checks id uniqueness plus every next/option-next/nextRules.goto/when shape
 *  against a given set of "known question or ITEM_END" ids. Pulled out of
 *  validateContent() so it can be exercised directly with synthetic data in
 *  tests, instead of mutating the real content/*.json files on disk. */
export function checkQuestionReferences(questions: Question[], idSet: Set<string>): string[] {
  const errors: string[] = [];
  const ids = questions.map((q) => q.id);
  const validTarget = (id: string) => id === ITEM_END || idSet.has(id);

  const seenIds = new Set<string>();
  for (const id of ids) {
    if (seenIds.has(id)) errors.push(`Duplicate question id "${id}"`);
    seenIds.add(id);
  }

  for (const q of questions) {
    if (q.next && !validTarget(q.next)) {
      errors.push(`Question "${q.id}": next -> unknown question "${q.next}"${suffix(q.next, ids)}`);
    }
    for (const opt of q.options ?? []) {
      if (opt.next && !validTarget(opt.next)) {
        errors.push(`Question "${q.id}" option "${opt.id}": next -> unknown question "${opt.next}"${suffix(opt.next, ids)}`);
      }
    }
    for (const rule of q.nextRules ?? []) {
      if (!validTarget(rule.goto)) {
        errors.push(`Question "${q.id}" nextRules: goto -> unknown question "${rule.goto}"${suffix(rule.goto, ids)}`);
      }
      checkCondition(rule.when, `Question "${q.id}" nextRules.when`, errors);
    }
    if (q.when) checkCondition(q.when, `Question "${q.id}".when`, errors);
  }

  return errors;
}

export function validateContent(): string[] {
  const errors: string[] = [];
  const ids = allQuestions.map((q) => q.id);
  const idSet = new Set(graph.questions.keys());
  const validTarget = (id: string) => id === ITEM_END || idSet.has(id);

  errors.push(...checkQuestionReferences(allQuestions, idSet));

  for (const d of repeaterDefs) {
    if (!idSet.has(d.entryId)) {
      errors.push(`Repeater "${d.id}": entryId -> unknown question "${d.entryId}"${suffix(d.entryId, ids)}`);
    }
    if (!validTarget(d.afterId)) {
      errors.push(`Repeater "${d.id}": afterId -> unknown question "${d.afterId}"${suffix(d.afterId, ids)}`);
    }
  }

  for (const b of clauseBlocks) {
    if (b.when) checkCondition(b.when, `Clause "${b.id}".when`, errors);
    for (const [group, frags] of Object.entries(b.fragments ?? {})) {
      frags.forEach((f, i) => {
        if (f.when) checkCondition(f.when, `Clause "${b.id}" fragment "${group}[${i}]".when`, errors);
      });
    }
  }

  // Clause fragments are allowed to render as nothing (e.g. a "no extra
  // detail" fallback branch in a fragment group) — only question/option/
  // clause/section/chapter text is required to be non-empty.
  const isClauseFragmentKey = (key: string) => /^clause\..+\.frag\./.test(key);
  for (const [key, value] of Object.entries(contentEn)) {
    if (isClauseFragmentKey(key)) continue;
    if (value.trim() === '') errors.push(`Content key "${key}" has empty English text`);
  }

  walkSkipEverythingAndRender(errors);

  return errors;
}
