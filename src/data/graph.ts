import { Graph } from '../engine/resolver';
import type { Chapter, Section } from '../engine/types';
import { personalQuestions } from './personal';
import { funeralQuestions } from './funeral';
import { organQuestions } from './organ';
import { guardianshipQuestions } from './guardianship';
import { debtsQuestions } from './debts';
import { bankQuestions } from './bank';
import { investmentsQuestions } from './investments';
import { receivablesQuestions } from './receivables';
import { realEstateQuestions } from './realestate';
import { vehiclesQuestions } from './vehicles';
import { collectiblesQuestions } from './collectibles';
import { jewelleryQuestions } from './jewellery';
import { ipQuestions } from './ip';
import { diariesQuestions } from './diaries';
import { gadgetsQuestions } from './gadgets';
import { digitalQuestions } from './digital';
import { residuaryQuestions } from './residuary';
import { executorQuestions } from './executors';

export const chapters: Chapter[] = [
  { id: 'you', title: 'ui.chapter.you' },
  { id: 'wishes', title: 'ui.chapter.wishes' },
  { id: 'dependents', title: 'ui.chapter.dependents' },
  { id: 'money', title: 'ui.chapter.money' },
  { id: 'belongings', title: 'ui.chapter.belongings' },
  { id: 'digital', title: 'ui.chapter.digital' },
  { id: 'residuary', title: 'ui.chapter.residuary' },
  { id: 'incharge', title: 'ui.chapter.incharge' },
];

export const sections: Section[] = [
  { id: 'personal', title: 'ui.section.personal', chapter: 'you', order: personalQuestions.map((q) => q.id) },
  { id: 'funeral', title: 'ui.section.funeral', chapter: 'wishes', order: funeralQuestions.map((q) => q.id) },
  { id: 'organ', title: 'ui.section.organ', chapter: 'wishes', order: organQuestions.map((q) => q.id) },
  { id: 'guardianship', title: 'ui.section.guardianship', chapter: 'dependents', order: guardianshipQuestions.map((q) => q.id) },
  { id: 'debts', title: 'ui.section.debts', chapter: 'money', order: debtsQuestions.map((q) => q.id) },
  { id: 'bank', title: 'ui.section.bank', chapter: 'money', order: bankQuestions.map((q) => q.id) },
  { id: 'invest', title: 'ui.section.invest', chapter: 'money', order: investmentsQuestions.map((q) => q.id) },
  { id: 'receivables', title: 'ui.section.receivables', chapter: 'money', order: receivablesQuestions.map((q) => q.id) },
  { id: 'realestate', title: 'ui.section.realestate', chapter: 'money', order: realEstateQuestions.map((q) => q.id) },
  { id: 'vehicles', title: 'ui.section.vehicles', chapter: 'money', order: vehiclesQuestions.map((q) => q.id) },
  { id: 'collect', title: 'ui.section.collect', chapter: 'belongings', order: collectiblesQuestions.map((q) => q.id) },
  { id: 'jewellery', title: 'ui.section.jewellery', chapter: 'belongings', order: jewelleryQuestions.map((q) => q.id) },
  { id: 'ip', title: 'ui.section.ip', chapter: 'belongings', order: ipQuestions.map((q) => q.id) },
  { id: 'diaries', title: 'ui.section.diaries', chapter: 'belongings', order: diariesQuestions.map((q) => q.id) },
  { id: 'gadgets', title: 'ui.section.gadgets', chapter: 'belongings', order: gadgetsQuestions.map((q) => q.id) },
  { id: 'digital', title: 'ui.section.digital', chapter: 'digital', order: digitalQuestions.map((q) => q.id) },
  { id: 'residuary', title: 'ui.section.residuary', chapter: 'residuary', order: residuaryQuestions.map((q) => q.id) },
  { id: 'executors', title: 'ui.section.executors', chapter: 'incharge', order: executorQuestions.map((q) => q.id) },
];

export const graph = new Graph(
  [
    ...personalQuestions,
    ...funeralQuestions,
    ...organQuestions,
    ...guardianshipQuestions,
    ...debtsQuestions,
    ...bankQuestions,
    ...investmentsQuestions,
    ...receivablesQuestions,
    ...realEstateQuestions,
    ...vehiclesQuestions,
    ...collectiblesQuestions,
    ...jewelleryQuestions,
    ...ipQuestions,
    ...diariesQuestions,
    ...gadgetsQuestions,
    ...digitalQuestions,
    ...residuaryQuestions,
    ...executorQuestions,
  ],
  sections,
);
