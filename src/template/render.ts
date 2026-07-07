import type { AppState, Condition, Person, SharesAnswer } from '../engine/types';
import { evaluate } from '../engine/conditions';
import { t, type Locale } from '../i18n';
import { graph } from '../data/graph';
import { RELATIONS } from '../data/relations';

/**
 * The output layer (docs/04-will-template.md): the will is an ordered list
 * of clause blocks. Blocks whose `when` fails vanish; numbered blocks get
 * continuous numbering after filtering. Templates support:
 *   {{frag:name}}         — first matching fragment; empty if none match
 *   {{label:questionId}}  — localized label of a chosen option
 *   {{label:item.field}}  — same, for a field inside an `each` loop item
 *   {{inr:path}}          — rupee formatting (en-IN grouping)
 *   {{item.field}}        — raw value of a field inside an `each` loop item
 *   {{helper:name:prefix}} — calls a registered composer (beneficiary/
 *                            contingent tails — see HELPERS below)
 *   {{age}} {{today.day}} {{today.month}} {{today.year}} {{familyList}}
 *   {{path}}              — raw answer value
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
  /** loop over this answer key (an array); one output block per item */
  each?: string;
  /** the item-scoped answer-key prefix the array's items were stripped of
   *  (needed to resolve {{label:item.x}} back to the original question id) */
  itemKeyPrefix?: string;
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

function familyList(state: AppState): string {
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

function personDisplay(id: unknown, people: Person[], locale: Locale): string {
  if (typeof id !== 'string') return '';
  const p = people.find((x) => x.id === id);
  if (!p) return '';
  const rel = RELATIONS.find((r) => r.id === p.relation);
  return rel ? `${p.name} (${t(rel.label, locale)})` : p.name;
}

/** A `get` reads a field relative to one beneficiary-chain invocation,
 *  whichever backing store (top-level answers, or one `each` loop item)
 *  it happens to live in — see buildGetter() below. */
type Get = (field: string) => unknown;

function beneficiaryTailOne(get: Get, people: Person[], locale: Locale): string {
  const person = personDisplay(get('person'), people, locale);
  const contMode = get('contingent.mode');
  let contingent: string;
  if (contMode === 'someone_else') {
    contingent = t('frag.tail.contingent.person', locale, {
      person: personDisplay(get('contingent.person'), people, locale),
    });
  } else if (contMode === 'residuary') {
    contingent = t('frag.tail.contingent.residuary', locale);
  } else {
    contingent = t('frag.tail.contingent.children', locale);
  }
  return t('frag.tail.one', locale, { person, contingent });
}

function beneficiaryTailSeveral(get: Get, people: Person[], locale: Locale): string {
  const ids = (get('people') as string[] | undefined) ?? [];
  const names = ids.map((id) => personDisplay(id, people, locale)).filter(Boolean).join(', ');
  const sharesAns = get('shares') as SharesAnswer | undefined;
  let divide: string;
  if (sharesAns?.mode === 'percentage') {
    const list = ids
      .map((id) => `${personDisplay(id, people, locale)} — ${sharesAns.splits?.[id] ?? 0}%`)
      .join('; ');
    divide = t('frag.tail.several.percentage', locale, { list });
  } else if (sharesAns?.mode === 'describe') {
    divide = t('frag.tail.several.describe', locale, { text: sharesAns.text ?? '' });
  } else {
    divide = t('frag.tail.several.equal', locale);
  }
  const contGroup = get('contingent.group_mode');
  let contingent: string;
  if (contGroup === 'others') contingent = t('frag.tail.contingent.group.others', locale);
  else if (contGroup === 'residuary') contingent = t('frag.tail.contingent.group.residuary', locale);
  else contingent = t('frag.tail.contingent.group.children', locale);
  return t('frag.tail.several', locale, { names, divide, contingent });
}

function lifeInterestTail(get: Get, people: Person[], locale: Locale): string {
  const occupant = personDisplay(get('occupant'), people, locale);
  const remainder = personDisplay(get('remainder'), people, locale);
  return t('frag.tail.life', locale, { occupant, remainder });
}

/** Names + how it's split, without a contingent clause (used by the
 *  residuary "several people" fragment — RS2 covers the contingent itself). */
function namesWithShares(get: Get, people: Person[], locale: Locale): string {
  const ids = (get('people') as string[] | undefined) ?? [];
  const names = ids.map((id) => personDisplay(id, people, locale)).filter(Boolean).join(', ');
  const sharesAns = get('shares') as SharesAnswer | undefined;
  let divide: string;
  if (sharesAns?.mode === 'percentage') {
    const list = ids
      .map((id) => `${personDisplay(id, people, locale)} — ${sharesAns.splits?.[id] ?? 0}%`)
      .join('; ');
    divide = t('frag.tail.several.percentage', locale, { list });
  } else if (sharesAns?.mode === 'describe') {
    divide = t('frag.tail.several.describe', locale, { text: sharesAns.text ?? '' });
  } else {
    divide = t('frag.tail.several.equal', locale);
  }
  return t('frag.names_with_shares', locale, { names, divide });
}

const HELPERS: Record<string, (get: Get, people: Person[], locale: Locale) => string> = {
  beneficiaryTailOne,
  beneficiaryTailSeveral,
  lifeInterestTail,
  namesWithShares,
};

function buildGetter(prefix: string, state: AppState, item?: Record<string, unknown>): Get {
  const key = (field: string) => (prefix ? `${prefix}.${field}` : field);
  if (item) return (field: string) => item[key(field)];
  return (field: string) => state.answers[key(field)];
}

function resolveVar(
  expr: string,
  state: AppState,
  locale: Locale,
  item?: Record<string, unknown>,
  itemKeyPrefix?: string,
): string {
  const answers = state.answers;
  if (expr === 'age') {
    const age = computeAge(answers['personal.dob']);
    return age === null ? '____' : String(age);
  }
  if (expr === 'today.day') return ordinal(new Date().getDate());
  if (expr === 'today.month') return new Date().toLocaleString(locale === 'ml' ? 'ml-IN' : 'en-IN', { month: 'long' });
  if (expr === 'today.year') return String(new Date().getFullYear());
  if (expr === 'familyList') return familyList(state);

  if (expr.startsWith('helper:')) {
    const [, name, prefix] = expr.split(':');
    const fn = name ? HELPERS[name] : undefined;
    if (!fn) return '';
    return fn(buildGetter(prefix ?? '', state, item), state.people, locale);
  }

  if (expr.startsWith('labelList:')) {
    const qid = expr.slice('labelList:'.length);
    const q = graph.questions.get(qid);
    const raw = answers[qid];
    const ids = Array.isArray(raw) ? raw : [];
    return ids
      .map((id) => {
        const opt = q?.options?.find((o) => o.id === id);
        return opt ? t(opt.label, locale) : '';
      })
      .filter(Boolean)
      .join(', ');
  }

  if (expr.startsWith('person:')) {
    const path = expr.slice('person:'.length);
    const id = path.startsWith('item.') && item ? item[path.slice('item.'.length)] : answers[path];
    return personDisplay(id, state.people, locale);
  }

  if (expr.startsWith('label:')) {
    const path = expr.slice('label:'.length);
    let qid: string;
    let raw: unknown;
    if (path.startsWith('item.') && item && itemKeyPrefix) {
      const suffix = path.slice('item.'.length);
      qid = `${itemKeyPrefix}.${suffix}`;
      raw = item[suffix];
    } else {
      qid = path;
      raw = answers[path];
    }
    const q = graph.questions.get(qid);
    const opt = q?.options?.find((o) => o.id === raw);
    return opt ? t(opt.label, locale) : '';
  }

  if (expr.startsWith('inr:')) {
    const path = expr.slice('inr:'.length);
    const v = path.startsWith('item.') && item ? item[path.slice('item.'.length)] : answers[path];
    const n = typeof v === 'number' ? v : Number(v);
    if (!isFinite(n)) return '';
    return '₹' + new Intl.NumberFormat('en-IN').format(n);
  }

  if (expr.startsWith('item.') && item) {
    const v = item[expr.slice('item.'.length)];
    return v === undefined || v === null ? '' : String(v);
  }

  const v = answers[expr];
  return v === undefined || v === null ? '' : String(v);
}

function substitute(
  template: string,
  block: ClauseBlock,
  state: AppState,
  locale: Locale,
  item?: Record<string, unknown>,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_m, raw: string) => {
    const expr = raw.trim();
    if (expr.startsWith('frag:')) {
      const name = expr.slice('frag:'.length);
      const frags = block.fragments?.[name] ?? [];
      for (const f of frags) {
        if (!f.when || evaluate(f.when, { answers: state.answers, item })) {
          return substitute(t(f.text, locale), block, state, locale, item);
        }
      }
      return '';
    }
    return resolveVar(expr, state, locale, item, block.itemKeyPrefix);
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
    if (block.each) {
      const items = (state.answers[block.each] as Record<string, unknown>[] | undefined) ?? [];
      for (const item of items) {
        if (block.when && !evaluate(block.when, { answers: state.answers, item })) continue;
        const text = substitute(t(block.text, locale), block, state, locale, item).trim();
        if (!text) continue;
        n += 1;
        out.push({ id: block.id, kind: block.kind, number: n, text });
      }
      continue;
    }

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
