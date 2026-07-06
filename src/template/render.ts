import type { AppState, Condition } from '../engine/types';
import { evaluate } from '../engine/conditions';
import { t, type Locale } from '../i18n';
import { graph } from '../data/graph';

/**
 * The output layer (docs/04-will-template.md): the will is an ordered list
 * of clause blocks. Blocks whose `when` fails vanish; numbered blocks get
 * continuous numbering after filtering. Templates support:
 *   {{frag:name}}        — first matching fragment (last one without `when`
 *                          acts as the default); empty if none match
 *   {{label:questionId}} — localized label of the chosen option
 *   {{inr:path}}         — rupee formatting (en-IN grouping)
 *   {{age}} {{today.day}} {{today.month}} {{today.year}} {{familyList}}
 *   {{path}}             — raw answer value
 */

export interface Fragment {
  when?: Condition;
  /** i18n key of the fragment template */
  text: string;
}

export type BlockKind = 'title' | 'heading' | 'clause' | 'plain';

export interface ClauseBlock {
  id: string;
  kind: BlockKind;
  when?: Condition;
  /** i18n key of the block template */
  text: string;
  fragments?: Record<string, Fragment[]>;
}

export interface RenderedBlock {
  id: string;
  kind: BlockKind;
  /** clause number for kind === 'clause' */
  number?: number;
  text: string;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function computeAge(dob: unknown): number | null {
  if (typeof dob !== 'string' || !dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function familyList(state: AppState, locale: Locale): string {
  void locale; // the ml inflection table will hang off this later
  const parts: string[] = [];
  for (const p of state.people) {
    if (['wife', 'husband', 'spouse'].includes(p.relation)) {
      parts.push(`my ${p.relation} ${p.name}`);
    }
  }
  for (const p of state.people) {
    if (p.relation === 'son' || p.relation === 'daughter') {
      parts.push(`my ${p.relation} ${p.name}${p.minor ? ' (a minor)' : ''}`);
    }
  }
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

function resolveVar(expr: string, state: AppState, locale: Locale): string {
  const answers = state.answers;
  if (expr === 'age') {
    const age = computeAge(answers['personal.dob']);
    return age === null ? '____' : String(age);
  }
  if (expr === 'today.day') return ordinal(new Date().getDate());
  if (expr === 'today.month') return new Date().toLocaleString(locale === 'ml' ? 'ml-IN' : 'en-IN', { month: 'long' });
  if (expr === 'today.year') return String(new Date().getFullYear());
  if (expr === 'familyList') return familyList(state, locale);
  if (expr.startsWith('label:')) {
    const qid = expr.slice('label:'.length);
    const q = graph.questions.get(qid);
    const chosen = answers[qid];
    const opt = q?.options?.find((o) => o.id === chosen);
    return opt ? t(opt.label, locale) : '';
  }
  if (expr.startsWith('inr:')) {
    const v = answers[expr.slice('inr:'.length)];
    const n = typeof v === 'number' ? v : Number(v);
    if (!isFinite(n)) return '';
    return '₹' + new Intl.NumberFormat('en-IN').format(n);
  }
  const v = answers[expr];
  return v === undefined || v === null ? '' : String(v);
}

function substitute(
  template: string,
  block: ClauseBlock,
  state: AppState,
  locale: Locale,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_m, raw: string) => {
    const expr = raw.trim();
    if (expr.startsWith('frag:')) {
      const name = expr.slice('frag:'.length);
      const frags = block.fragments?.[name] ?? [];
      for (const f of frags) {
        if (!f.when || evaluate(f.when, { answers: state.answers })) {
          return substitute(t(f.text, locale), block, state, locale);
        }
      }
      return '';
    }
    return resolveVar(expr, state, locale);
  });
}

export function renderWill(
  blocks: ClauseBlock[],
  state: AppState,
  locale: Locale = 'en',
): RenderedBlock[] {
  const out: RenderedBlock[] = [];
  let n = 0;
  for (const block of blocks) {
    if (block.when && !evaluate(block.when, { answers: state.answers })) continue;
    const text = substitute(t(block.text, locale), block, state, locale).trim();
    if (!text) continue;
    if (block.kind === 'clause') {
      n += 1;
      out.push({ id: block.id, kind: block.kind, number: n, text });
    } else {
      out.push({ id: block.id, kind: block.kind, text });
    }
  }
  return out;
}

/** Plain-text serialisation of the rendered will, for copy-to-clipboard. */
export function willToText(blocks: RenderedBlock[]): string {
  return blocks
    .map((b) => {
      if (b.kind === 'title' || b.kind === 'heading') return b.text.toUpperCase();
      if (b.kind === 'clause') return `${b.number}. ${b.text}`;
      return b.text;
    })
    .join('\n\n');
}

/** Hard validity checks — generation is blocked while any of these fail. */
export function generationBlockers(state: AppState): ('underage' | 'sound_mind')[] {
  const blockers: ('underage' | 'sound_mind')[] = [];
  if (state.answers['personal.underage'] === true) blockers.push('underage');
  if (state.answers['personal.sound_mind'] !== 'confirm') blockers.push('sound_mind');
  return blockers;
}
