import type { AppState } from '../engine/types';
import { t, type Locale } from '../i18n';
import { graph } from '../data/graph';

/**
 * One-line, human-readable gist of each section's answers for the Review
 * screen ("Cremation — ashes immersed", "2 added", "Anita (primary)").
 * Built entirely from existing option labels and registry names, so it is
 * localized for free; returns null when a section has nothing to say.
 */

function optionLabel(qid: string, state: AppState, locale: Locale): string | null {
  const q = graph.questions.get(qid);
  const v = state.answers[qid];
  const opt = q?.options?.find((o) => o.id === v);
  return opt ? t(opt.label, locale) : null;
}

function personName(state: AppState, id: unknown): string | null {
  if (typeof id !== 'string') return null;
  return state.people.find((p) => p.id === id)?.name ?? null;
}

function countOf(state: AppState, key: string, locale: Locale): string | null {
  const v = state.answers[key];
  if (!Array.isArray(v) || v.length === 0) return null;
  return t('ui.summary.count', locale, { n: String(v.length) });
}

function truncate(v: unknown, max = 42): string | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const s = v.trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/** Mirrors SF-BENEFICIARY: person name for a single beneficiary, otherwise
 *  the chosen mode's own label ("More than one person", "Sell it…"). */
function beneficiarySummary(state: AppState, prefix: string, locale: Locale): string | null {
  const mode = state.answers[`${prefix}.mode`];
  if (mode === 'one') return personName(state, state.answers[`${prefix}.person`]);
  return optionLabel(`${prefix}.mode`, state, locale);
}

const SUMMARIZERS: Record<string, (state: AppState, locale: Locale) => (string | null)[]> = {
  personal: (s, l) => {
    const parts: (string | null)[] = [truncate(s.answers['personal.full_name'], 30)];
    const spouse = s.people.find((p) => p.id === 'spouse');
    if (spouse) parts.push(spouse.name);
    const children = s.answers['personal.children'];
    if (Array.isArray(children) && children.length > 0) {
      parts.push(t('ui.summary.children', l, { n: String(children.length) }));
    }
    return parts;
  },
  funeral: (s, l) => [
    optionLabel('funeral.method', s, l),
    s.answers['funeral.method'] === 'burial' ? optionLabel('funeral.burial.place', s, l) : null,
    s.answers['funeral.method'] === 'cremation' ? optionLabel('funeral.cremation.ashes', s, l) : null,
  ],
  organ: (s, l) => [optionLabel('organ.gate', s, l)],
  guardianship: (s, l) => [
    personName(s, s.answers['guardianship.primary']) ?? optionLabel('guardianship.gate', s, l),
  ],
  debts: (s, l) => [countOf(s, 'debts.items', l)],
  bank: (s, l) =>
    s.answers['bank.mode'] === 'all'
      ? [beneficiarySummary(s, 'bank.all', l)]
      : [countOf(s, 'bank.accounts', l)],
  invest: (s, l) => [countOf(s, 'invest.items', l)],
  receivables: (s, l) => [countOf(s, 'receivables.items', l)],
  realestate: (s, l) => [countOf(s, 'realestate.items', l)],
  vehicles: (s, l) => [countOf(s, 'vehicles.items', l)],
  collect: (s, l) => [beneficiarySummary(s, 'collect.beneficiary', l)],
  jewellery: (s, l) => [beneficiarySummary(s, 'jewellery.beneficiary', l)],
  ip: (s, l) => [truncate(s.answers['ip.desc']), beneficiarySummary(s, 'ip.beneficiary', l)],
  diaries: (s, l) => [optionLabel('diaries.action', s, l)],
  gadgets: (s, l) => [optionLabel('gadgets.gate', s, l)],
  digital: (s, l) => [optionLabel('digital.social', s, l) ?? optionLabel('digital.gate', s, l)],
  residuary: (s, l) => {
    const mode = s.answers['residuary.primary'];
    if (mode === 'one_person') return [personName(s, s.answers['residuary.primary.person'])];
    if (mode === 'charity') return [truncate(s.answers['residuary.primary.charity'])];
    return [optionLabel('residuary.primary', s, l)];
  },
  executors: (s, l) => {
    void l;
    return [
      personName(s, s.answers['executors.physical.primary']),
      personName(s, s.answers['executors.physical.secondary']),
    ];
  },
};

export function sectionSummary(sectionId: string, state: AppState, locale: Locale): string | null {
  const fn = SUMMARIZERS[sectionId];
  if (!fn) return null;
  const parts = fn(state, locale).filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(' · ') : null;
}
