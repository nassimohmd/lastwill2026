import { Graph } from '../engine/resolver';
import type { Chapter, Section } from '../engine/types';
import { personalQuestions } from './personal';
import { funeralQuestions } from './funeral';

export const chapters: Chapter[] = [
  { id: 'you', title: 'ui.chapter.you' },
  { id: 'wishes', title: 'ui.chapter.wishes' },
];

export const sections: Section[] = [
  {
    id: 'personal',
    title: 'ui.section.personal',
    chapter: 'you',
    order: personalQuestions.map((q) => q.id),
  },
  {
    id: 'funeral',
    title: 'ui.section.funeral',
    chapter: 'wishes',
    order: funeralQuestions.map((q) => q.id),
  },
];

export const graph = new Graph([...personalQuestions, ...funeralQuestions], sections);
