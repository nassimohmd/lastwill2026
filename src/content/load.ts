import type { Question, Section, Chapter, Option, RepeaterField, Condition, NextRule, QuestionType } from '../engine/types';
import type { ClauseBlock, Fragment, BlockKind } from '../template/render';
import type { FlowRepeaterDef } from '../engine/repeaters';
import type { Locale } from '../i18n';
import { Graph } from '../engine/resolver';

import chaptersJson from '../../content/chapters.json';
import repeatersJson from '../../content/repeaters.json';
import relationsJson from '../../content/relations.json';
import clausesJson from '../../content/clauses.json';
import helpersJson from '../../content/helpers.json';
import s01 from '../../content/sections/01-personal.json';
import s02 from '../../content/sections/02-funeral.json';
import s03 from '../../content/sections/03-organ.json';
import s04 from '../../content/sections/04-guardianship.json';
import s05 from '../../content/sections/05-debts.json';
import s06 from '../../content/sections/06-bank.json';
import s07 from '../../content/sections/07-invest.json';
import s08 from '../../content/sections/08-receivables.json';
import s09 from '../../content/sections/09-realestate.json';
import s10 from '../../content/sections/10-vehicles.json';
import s11 from '../../content/sections/11-collect.json';
import s12 from '../../content/sections/12-jewellery.json';
import s13 from '../../content/sections/13-ip.json';
import s14 from '../../content/sections/14-diaries.json';
import s15 from '../../content/sections/15-gadgets.json';
import s16 from '../../content/sections/16-digital.json';
import s17 from '../../content/sections/17-residuary.json';
import s18 from '../../content/sections/18-executors.json';

/**
 * Turns content/*.json (wording inlined as {en, ml?} per question/option/
 * fragment) into the exact runtime shapes the rest of the app already
 * consumes (Question/Section/Chapter/ClauseBlock/FlowRepeaterDef, all keyed
 * by i18n-dictionary-key strings). Many questions historically shared one
 * generic i18n key (e.g. every beneficiary picker used `q.sf.beneficiary.
 * person`); since content stores wording per-question instead, a unique key
 * is derived per question/option/field/clause/fragment here so each becomes
 * independently editable without key collisions.
 */

type Bi = { en: string; ml?: string };

// Condition-shaped values (`when`, `nextRules`, `summarize`) are stored in
// the content JSON as *JSON strings*, not objects — Pages CMS's `code` form
// field can only hold a string (its editor throws on anything else, and
// undeclared object keys are stripped on save, so real objects can't
// round-trip through the CMS at all). The loader parses them here; plain
// objects are still accepted for hand-edited files.
type JsonStr<T> = string | T;

interface CQOption {
  id: string;
  label: Bi;
  next?: string;
}
interface CQField {
  id: string;
  type: 'text' | 'single';
  label: Bi;
  optional?: boolean;
  options?: CQOption[];
}
interface CQuestion {
  id: string;
  section: string;
  type: QuestionType;
  text: Bi;
  help?: Bi;
  skippable?: false;
  gate?: true;
  options?: CQOption[];
  optional?: true;
  when?: JsonStr<Condition>;
  nextRules?: JsonStr<NextRule[]>;
  next?: string;
  fields?: CQField[];
  addMore?: Bi;
  askAddress?: true;
  minPeople?: number;
  peopleSource?: string;
}
interface CSection {
  id: string;
  title: Bi;
  chapter: string;
  questions: CQuestion[];
}
interface CChapter {
  id: string;
  title: Bi;
}
type CSummarizeField = string | { key: string; truncateAt: number };
interface CSummarizeSpec {
  fields?: CSummarizeField[];
  separator?: string;
  fallbackText?: Bi;
}
interface CRepeaterDef {
  id: string;
  keyPrefix: string;
  entryId: string;
  afterId: string;
  addMoreLabel: Bi;
  summarize: JsonStr<CSummarizeSpec>;
}
interface CRelation {
  id: string;
  label: Bi;
}
// Fragments are stored flat with a `group` key (not as a group-keyed map)
// so Pages CMS can render each fragment as a real form entry — its `object`
// field can't model a map with arbitrary keys. Within a group, file order
// is evaluation order: the first fragment whose `when` matches wins.
interface CFragment {
  group: string;
  when?: JsonStr<Condition>;
  text: Bi;
}
interface CClauseBlock {
  id: string;
  kind: BlockKind;
  when?: JsonStr<Condition>;
  text: Bi;
  fragments?: CFragment[];
  each?: string;
  itemKeyPrefix?: string;
}

export const contentEn: Record<string, string> = {};
export const contentMl: Record<string, string> = {};

function reg(key: string, bi: Bi): string {
  if (Object.prototype.hasOwnProperty.call(contentEn, key)) {
    throw new Error(`content/load.ts: duplicate derived key "${key}"`);
  }
  contentEn[key] = bi.en;
  // A CMS form leaves an untouched Malayalam field as "" rather than
  // omitting the key — treat that the same as "not translated yet" so it
  // falls back to English instead of rendering blank. Exception: a few
  // fragments are intentionally empty in both languages (an "add nothing"
  // fallback branch), so still register ml there for key-parity.
  if (bi.ml !== undefined && (bi.ml.trim() !== '' || bi.en.trim() === '')) contentMl[key] = bi.ml;
  return key;
}

// A CMS form can write back empty arrays/strings for fields the editor
// left untouched (e.g. `"options": []`) instead of omitting the key —
// treat those the same as "not set" rather than as present-but-empty.
function present<T>(v: T[] | undefined): v is T[] {
  return Array.isArray(v) && v.length > 0;
}
function textPresent(v: Bi | undefined): v is Bi {
  return v !== undefined && v.en.trim() !== '';
}
function strPresent(v: string | undefined): v is string {
  return v !== undefined && v.trim() !== '';
}

/** Parse a JSON-string-encoded value (see the JsonStr note above). Empty/
 *  blank strings mean "not set". A parse failure throws with the location,
 *  which the prebuild validator surfaces as a readable build error. */
function parseJsonField<T>(raw: JsonStr<T> | undefined, where: string): T | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string') return raw;
  if (raw.trim() === '') return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`${where}: invalid JSON in condition/rules field — ${(e as Error).message}`);
  }
}

// The "tail" sentence templates (beneficiary/contingent/life-interest
// composers) are referenced by literal key from the HELPERS registry in
// src/template/render.ts, not through any Question/ClauseBlock field —
// register them under their existing keys so those t(key, ...) calls keep
// resolving unchanged.
interface CHelperFragment {
  key: string;
  text: Bi;
}
for (const h of helpersJson as CHelperFragment[]) {
  reg(h.key, h.text);
}

function loadOption(qid: string, scope: string, o: CQOption): Option {
  return {
    id: o.id,
    label: reg(`q.${qid}.${scope}.${o.id}`, o.label),
    ...(strPresent(o.next) ? { next: o.next } : {}),
  };
}

function loadField(qid: string, f: CQField): RepeaterField {
  return {
    id: f.id,
    type: f.type,
    label: reg(`q.${qid}.f.${f.id}`, f.label),
    ...(f.optional ? { optional: true } : {}),
    ...(present(f.options) ? { options: f.options.map((o) => loadOption(qid, `f.${f.id}.opt`, o)) } : {}),
  };
}

function loadQuestion(cq: CQuestion): Question {
  const qid = cq.id;
  const when = parseJsonField(cq.when, `Question "${qid}" when`);
  const nextRules = parseJsonField(cq.nextRules, `Question "${qid}" nextRules`);
  return {
    id: qid,
    section: cq.section,
    type: cq.type,
    text: reg(`q.${qid}`, cq.text),
    ...(textPresent(cq.help) ? { help: reg(`q.${qid}.help`, cq.help) } : {}),
    ...(cq.skippable === false ? { skippable: false } : {}),
    ...(cq.gate ? { gate: true } : {}),
    ...(present(cq.options) ? { options: cq.options.map((o) => loadOption(qid, 'opt', o)) } : {}),
    ...(cq.optional ? { optional: true } : {}),
    ...(when ? { when } : {}),
    ...(present(nextRules) ? { nextRules } : {}),
    ...(strPresent(cq.next) ? { next: cq.next } : {}),
    ...(present(cq.fields) ? { fields: cq.fields.map((f) => loadField(qid, f)) } : {}),
    ...(textPresent(cq.addMore) ? { addMore: reg(`q.${qid}.addmore`, cq.addMore) } : {}),
    ...(cq.askAddress ? { askAddress: true } : {}),
    // A CMS-saved empty number field can coerce to 0/null — treat those as unset.
    ...(typeof cq.minPeople === 'number' && cq.minPeople > 0 ? { minPeople: cq.minPeople } : {}),
    ...(strPresent(cq.peopleSource) ? { peopleSource: cq.peopleSource } : {}),
  };
}

const sectionFiles: CSection[] = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s16, s17, s18] as CSection[];

export const chapters: Chapter[] = (chaptersJson as CChapter[]).map((c) => ({
  id: c.id,
  title: reg(`chap.${c.id}`, c.title),
}));

export const sections: Section[] = sectionFiles.map((s) => ({
  id: s.id,
  title: reg(`sec.${s.id}`, s.title),
  chapter: s.chapter,
  order: s.questions.map((q) => q.id),
}));

// Exported (not just used to build `graph`) so the validator can check for
// duplicate ids and dangling `next`/`nextRules` references — `Graph`'s
// internal Map silently collapses duplicate ids, so that check has to run
// against this flat list, not `graph.questions`.
export const allQuestions: Question[] = sectionFiles.flatMap((s) => s.questions.map(loadQuestion));

export const graph = new Graph(allQuestions, sections);

function localT(key: string, locale: Locale): string {
  return (locale === 'ml' ? contentMl[key] : undefined) ?? contentEn[key] ?? key;
}

function buildSummarize(id: string, spec: CSummarizeSpec): (item: Record<string, unknown>, locale: Locale) => string {
  if (textPresent(spec.fallbackText)) {
    const key = reg(`rep.${id}.fallback`, spec.fallbackText);
    return (_item, locale) => localT(key, locale);
  }
  const fields = present(spec.fields) ? spec.fields : [];
  const separator = spec.separator ?? ' — ';
  return (item) =>
    fields
      .map((f) => {
        if (typeof f === 'string') return String(item[f] ?? '');
        const v = String(item[f.key] ?? '');
        return v.length > f.truncateAt ? v.slice(0, f.truncateAt - 3) + '…' : v;
      })
      .filter(Boolean)
      .join(separator);
}

export const repeaterDefs: FlowRepeaterDef[] = (repeatersJson as CRepeaterDef[]).map((d) => ({
  id: d.id,
  keyPrefix: d.keyPrefix,
  entryId: d.entryId,
  afterId: d.afterId,
  addMoreLabel: reg(`rep.${d.id}.addMore`, d.addMoreLabel),
  summarize: buildSummarize(d.id, parseJsonField(d.summarize, `Repeater "${d.id}" summarize`) ?? {}),
}));

export const RELATIONS: { id: string; label: string }[] = (relationsJson as CRelation[]).map((r) => ({
  id: r.id,
  label: reg(`q.relation.${r.id}`, r.label),
}));

export function relationLabel(relation: string): string {
  return RELATIONS.find((r) => r.id === relation)?.label ?? 'q.relation.other';
}

/** Regroup the flat fragment list back into the group-keyed map render.ts
 *  consumes, preserving file order within each group (evaluation order). */
function loadFragments(blockId: string, flat: CFragment[]): Record<string, Fragment[]> {
  const grouped: Record<string, Fragment[]> = {};
  for (const f of flat) {
    const group = f.group;
    grouped[group] ??= [];
    const index = grouped[group].length;
    const when = parseJsonField(f.when, `Clause "${blockId}" fragment "${group}[${index}]" when`);
    grouped[group].push({
      ...(when ? { when } : {}),
      text: reg(`clause.${blockId}.frag.${group}.${index}`, f.text),
    });
  }
  return grouped;
}

function loadClauseBlock(b: CClauseBlock): ClauseBlock {
  const when = parseJsonField(b.when, `Clause "${b.id}" when`);
  return {
    id: b.id,
    kind: b.kind,
    ...(when ? { when } : {}),
    text: reg(`clause.${b.id}`, b.text),
    ...(present(b.fragments) ? { fragments: loadFragments(b.id, b.fragments) } : {}),
    ...(strPresent(b.each) ? { each: b.each } : {}),
    ...(strPresent(b.itemKeyPrefix) ? { itemKeyPrefix: b.itemKeyPrefix } : {}),
  };
}

export const clauseBlocks: ClauseBlock[] = (clausesJson as CClauseBlock[]).map(loadClauseBlock);
