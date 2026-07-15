/**
 * One-off migration: reads the current TS question/clause data + locale
 * dictionaries and emits the equivalent content/*.json files with wording
 * inlined ({en, ml} objects instead of i18n-key indirection). Run once via
 * `npx tsx scripts/migrate-content.ts`, verify with the fidelity diff
 * harness, then this script (and the src/data/*.ts files it reads) can be
 * deleted — content/*.json + src/content/load.ts become the source of truth.
 *
 * Derived-key strategy: many questions historically shared a single i18n
 * key (e.g. every "who should receive this?" beneficiary picker used the
 * generic `q.sf.beneficiary.person" key). Since content JSON stores text
 * per-question instead, the loader (src/content/load.ts) re-derives a
 * unique key per question at load time (`q.<questionId>`, `q.<questionId>.
 * opt.<optionId>`, etc.) — this script does not need to worry about key
 * collisions, it just inlines whatever text each key currently resolves to.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Question, Section, Chapter, Option, RepeaterField } from '../src/engine/types';
import type { ClauseBlock, Fragment } from '../src/template/render';
import type { FlowRepeaterDef } from '../src/engine/repeaters';

import { personalQuestions } from '../src/data/personal';
import { funeralQuestions } from '../src/data/funeral';
import { organQuestions } from '../src/data/organ';
import { guardianshipQuestions } from '../src/data/guardianship';
import { debtsQuestions } from '../src/data/debts';
import { bankQuestions } from '../src/data/bank';
import { investmentsQuestions } from '../src/data/investments';
import { receivablesQuestions } from '../src/data/receivables';
import { realEstateQuestions } from '../src/data/realestate';
import { vehiclesQuestions } from '../src/data/vehicles';
import { collectiblesQuestions } from '../src/data/collectibles';
import { jewelleryQuestions } from '../src/data/jewellery';
import { ipQuestions } from '../src/data/ip';
import { diariesQuestions } from '../src/data/diaries';
import { gadgetsQuestions } from '../src/data/gadgets';
import { digitalQuestions } from '../src/data/digital';
import { residuaryQuestions } from '../src/data/residuary';
import { executorQuestions } from '../src/data/executors';
import { repeaterDefs } from '../src/data/repeaters';
import { RELATIONS } from '../src/data/relations';
import { clauseBlocks } from '../src/data/clauses';

import enQuestions from '../src/locales/en/questions.json';
import mlQuestions from '../src/locales/ml/questions.json';
import enClauses from '../src/locales/en/clauses.json';
import mlClauses from '../src/locales/ml/clauses.json';
import enUi from '../src/locales/en/ui.json';
import mlUi from '../src/locales/ml/ui.json';

const ROOT = path.resolve(import.meta.dirname, '..');
const enDict: Record<string, string> = { ...enQuestions, ...enClauses, ...enUi };
const mlDict: Record<string, string> = { ...mlQuestions, ...mlClauses, ...mlUi };

type Bi = { en: string; ml?: string };

const missing: string[] = [];
function bi(key: string | undefined): Bi | undefined {
  if (key === undefined) return undefined;
  const en = enDict[key];
  const ml = mlDict[key];
  if (en === undefined) {
    missing.push(key);
    return { en: `[[MISSING:${key}]]` };
  }
  return ml !== undefined ? { en, ml } : { en };
}

function migrateOption(o: Option) {
  return { id: o.id, label: bi(o.label)!, ...(o.next ? { next: o.next } : {}) };
}

function migrateField(f: RepeaterField) {
  return {
    id: f.id,
    type: f.type,
    label: bi(f.label)!,
    ...(f.optional ? { optional: true } : {}),
    ...(f.options ? { options: f.options.map(migrateOption) } : {}),
  };
}

function migrateQuestion(q: Question) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, section, type, text, help, skippable, gate, options, optional, when, nextRules, next, fields, addMore, askAddress, minPeople, peopleSource } = q;
  return {
    id,
    section,
    type,
    text: bi(text)!,
    ...(help ? { help: bi(help) } : {}),
    ...(skippable === false ? { skippable: false } : {}),
    ...(gate ? { gate: true } : {}),
    ...(options ? { options: options.map(migrateOption) } : {}),
    ...(optional ? { optional: true } : {}),
    ...(when ? { when } : {}),
    ...(nextRules ? { nextRules } : {}),
    ...(next ? { next } : {}),
    ...(fields ? { fields: fields.map(migrateField) } : {}),
    ...(addMore ? { addMore: bi(addMore) } : {}),
    ...(askAddress ? { askAddress: true } : {}),
    ...(minPeople !== undefined ? { minPeople } : {}),
    ...(peopleSource ? { peopleSource } : {}),
  };
}

function migrateFragment(f: Fragment) {
  return { ...(f.when ? { when: f.when } : {}), text: bi(f.text)! };
}

function migrateClauseBlock(b: ClauseBlock) {
  return {
    id: b.id,
    kind: b.kind,
    ...(b.when ? { when: b.when } : {}),
    text: bi(b.text)!,
    ...(b.fragments
      ? { fragments: Object.fromEntries(Object.entries(b.fragments).map(([k, v]) => [k, v.map(migrateFragment)])) }
      : {}),
    ...(b.each ? { each: b.each } : {}),
    ...(b.itemKeyPrefix ? { itemKeyPrefix: b.itemKeyPrefix } : {}),
  };
}

// Every summarize() in src/data/repeaters.ts (read by hand — there's no way
// to introspect a closure) is one of: join 1-2 fields with a separator,
// optionally truncating one of them, or a fixed fallback string ignoring
// the item entirely. Hand-encoded as a declarative spec the loader can
// reinterpret (src/content/load.ts's buildSummarize) — this *is* the
// migration for this one non-serializable piece, not a sample/probe.
type SummarizeField = string | { key: string; truncateAt: number };
interface SummarizeSpec {
  fields?: SummarizeField[];
  separator?: string;
  fallbackText?: Bi;
}

const SUMMARIZE_SPECS: Record<string, SummarizeSpec> = {
  'bank.accounts': { fields: ['bank_name', 'type'] },
  'realestate.items': { fields: [{ key: 'desc', truncateAt: 60 }] },
  'guardianship.dependents': { fallbackText: { en: 'A dependent', ml: 'ഒരു ആശ്രിതൻ' } },
  'debts.items': { fields: ['lender', 'kind'] },
  'invest.items': { fields: [{ key: 'desc', truncateAt: 40 }, 'type'] },
  'receivables.items': { fields: ['who'] },
  'vehicles.items': { fields: ['type', 'desc'] },
  'gadgets.items': { fields: ['desc'] },
};

function migrateRepeaterDef(d: FlowRepeaterDef) {
  const spec = SUMMARIZE_SPECS[d.id];
  if (!spec) throw new Error(`No SUMMARIZE_SPECS entry for repeater "${d.id}" — add one by hand`);
  return {
    id: d.id,
    keyPrefix: d.keyPrefix,
    entryId: d.entryId,
    afterId: d.afterId,
    addMoreLabel: bi(d.addMoreLabel)!,
    summarize: spec,
  };
}

const sectionsMeta: { id: string; title: string; chapter: string }[] = [
  { id: 'personal', title: 'ui.section.personal', chapter: 'you' },
  { id: 'funeral', title: 'ui.section.funeral', chapter: 'wishes' },
  { id: 'organ', title: 'ui.section.organ', chapter: 'wishes' },
  { id: 'guardianship', title: 'ui.section.guardianship', chapter: 'dependents' },
  { id: 'debts', title: 'ui.section.debts', chapter: 'money' },
  { id: 'bank', title: 'ui.section.bank', chapter: 'money' },
  { id: 'invest', title: 'ui.section.invest', chapter: 'money' },
  { id: 'receivables', title: 'ui.section.receivables', chapter: 'money' },
  { id: 'realestate', title: 'ui.section.realestate', chapter: 'money' },
  { id: 'vehicles', title: 'ui.section.vehicles', chapter: 'money' },
  { id: 'collect', title: 'ui.section.collect', chapter: 'belongings' },
  { id: 'jewellery', title: 'ui.section.jewellery', chapter: 'belongings' },
  { id: 'ip', title: 'ui.section.ip', chapter: 'belongings' },
  { id: 'diaries', title: 'ui.section.diaries', chapter: 'belongings' },
  { id: 'gadgets', title: 'ui.section.gadgets', chapter: 'belongings' },
  { id: 'digital', title: 'ui.section.digital', chapter: 'digital' },
  { id: 'residuary', title: 'ui.section.residuary', chapter: 'residuary' },
  { id: 'executors', title: 'ui.section.executors', chapter: 'incharge' },
];

const questionsBySection: Record<string, Question[]> = {
  personal: personalQuestions,
  funeral: funeralQuestions,
  organ: organQuestions,
  guardianship: guardianshipQuestions,
  debts: debtsQuestions,
  bank: bankQuestions,
  invest: investmentsQuestions,
  receivables: receivablesQuestions,
  realestate: realEstateQuestions,
  vehicles: vehiclesQuestions,
  collect: collectiblesQuestions,
  jewellery: jewelleryQuestions,
  ip: ipQuestions,
  diaries: diariesQuestions,
  gadgets: gadgetsQuestions,
  digital: digitalQuestions,
  residuary: residuaryQuestions,
  executors: executorQuestions,
};

const chapters: Chapter[] = [
  { id: 'you', title: 'ui.chapter.you' },
  { id: 'wishes', title: 'ui.chapter.wishes' },
  { id: 'dependents', title: 'ui.chapter.dependents' },
  { id: 'money', title: 'ui.chapter.money' },
  { id: 'belongings', title: 'ui.chapter.belongings' },
  { id: 'digital', title: 'ui.chapter.digital' },
  { id: 'residuary', title: 'ui.chapter.residuary' },
  { id: 'incharge', title: 'ui.chapter.incharge' },
];

mkdirSync(path.join(ROOT, 'content/sections'), { recursive: true });

writeFileSync(
  path.join(ROOT, 'content/chapters.json'),
  JSON.stringify(chapters.map((c) => ({ id: c.id, title: bi(c.title) })), null, 2) + '\n',
);

sectionsMeta.forEach((s, i) => {
  const nn = String(i + 1).padStart(2, '0');
  const questions = questionsBySection[s.id].map(migrateQuestion);
  writeFileSync(
    path.join(ROOT, `content/sections/${nn}-${s.id}.json`),
    JSON.stringify({ id: s.id, title: bi(s.title), chapter: s.chapter, questions }, null, 2) + '\n',
  );
});

writeFileSync(
  path.join(ROOT, 'content/repeaters.json'),
  JSON.stringify(repeaterDefs.map(migrateRepeaterDef), null, 2) + '\n',
);

writeFileSync(
  path.join(ROOT, 'content/relations.json'),
  JSON.stringify(
    RELATIONS.map((r) => ({ id: r.id, label: bi(r.label) })),
    null,
    2,
  ) + '\n',
);

writeFileSync(
  path.join(ROOT, 'content/clauses.json'),
  JSON.stringify(clauseBlocks.map(migrateClauseBlock), null, 2) + '\n',
);

// These "tail" sentence templates are used directly by the HELPERS composer
// functions in src/template/render.ts (beneficiaryTailOne/Several,
// lifeInterestTail, namesWithShares) via a hardcoded t(key, ...) call, not
// through any ClauseBlock/Fragment/Question field — so they never surface
// in clauseBlocks and need to be pulled out of clauses.json by key directly.
const HELPER_FRAGMENT_KEYS = [
  'frag.tail.one',
  'frag.tail.several',
  'frag.tail.contingent.children',
  'frag.tail.contingent.person',
  'frag.tail.contingent.residuary',
  'frag.tail.several.equal',
  'frag.tail.several.percentage',
  'frag.tail.several.describe',
  'frag.tail.contingent.group.children',
  'frag.tail.contingent.group.others',
  'frag.tail.contingent.group.residuary',
  'frag.tail.life',
  'frag.names_with_shares',
];

writeFileSync(
  path.join(ROOT, 'content/helpers.json'),
  JSON.stringify(
    HELPER_FRAGMENT_KEYS.map((key) => ({ key, text: bi(key) })),
    null,
    2,
  ) + '\n',
);

if (missing.length) {
  console.error(`\nMISSING i18n keys (${missing.length}):`);
  for (const k of missing) console.error(' -', k);
  process.exitCode = 1;
} else {
  console.log('Migration complete, no missing keys.');
}
