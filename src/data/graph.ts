import { Graph } from '../engine/resolver';
import type { Chapter, Section } from '../engine/types';
import { personalQuestions } from './personal';
import { funeralQuestions } from './funeral';
import { bankQuestions } from './bank';
import { realEstateQuestions } from './realestate';
import { residuaryQuestions } from './residuary';
import { executorQuestions } from './executors';

export const chapters: Chapter[] = [
  { id: 'you', title: 'ui.chapter.you' },
  { id: 'wishes', title: 'ui.chapter.wishes' },
  { id: 'money', title: 'ui.chapter.money' },
  { id: 'residuary', title: 'ui.chapter.residuary' },
  { id: 'incharge', title: 'ui.chapter.incharge' },
];

export const sections: Section[] = [
  { id: 'personal', title: 'ui.section.personal', chapter: 'you', order: personalQuestions.map((q) => q.id) },
  { id: 'funeral', title: 'ui.section.funeral', chapter: 'wishes', order: funeralQuestions.map((q) => q.id) },
  { id: 'bank', title: 'ui.section.bank', chapter: 'money', order: bankQuestions.map((q) => q.id) },
  { id: 'realestate', title: 'ui.section.realestate', chapter: 'money', order: realEstateQuestions.map((q) => q.id) },
  { id: 'residuary', title: 'ui.section.residuary', chapter: 'residuary', order: residuaryQuestions.map((q) => q.id) },
  { id: 'executors', title: 'ui.section.executors', chapter: 'incharge', order: executorQuestions.map((q) => q.id) },
];

export const graph = new Graph(
  [
    ...personalQuestions,
    ...funeralQuestions,
    ...bankQuestions,
    ...realEstateQuestions,
    ...residuaryQuestions,
    ...executorQuestions,
  ],
  sections,
);
