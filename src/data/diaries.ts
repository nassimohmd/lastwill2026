import type { Question } from '../engine/types';
import { makeBeneficiaryPersonChain } from '../engine/subflows';

// Section 14 — Diaries & journals (docs/03-question-flows.md, DJ1–DJ3)
export const diariesQuestions: Question[] = [
  {
    id: 'diaries.gate',
    section: 'diaries',
    type: 'single',
    text: 'q.diaries.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'diaries.action' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'gadgets.gate',
  },
  {
    id: 'diaries.action',
    section: 'diaries',
    type: 'single',
    text: 'q.diaries.action',
    options: [
      { id: 'give_to_person', label: 'q.diaries.action.opt.give_to_person', next: 'diaries.action.person' },
      { id: 'destroy', label: 'q.diaries.action.opt.destroy' },
      { id: 'read_first', label: 'q.diaries.action.opt.read_first', next: 'diaries.action.reader' },
      { id: 'keep_with_family', label: 'q.diaries.action.opt.keep_with_family' },
      { id: 'family_decides', label: 'q.diaries.action.opt.family_decides' },
    ],
    next: 'diaries.notes',
  },

  ...makeBeneficiaryPersonChain({ section: 'diaries', prefix: 'diaries.action', afterNext: 'diaries.notes' }),

  { id: 'diaries.action.reader', section: 'diaries', type: 'person', text: 'q.diaries.action.reader', next: 'diaries.notes' },
  { id: 'diaries.notes', section: 'diaries', type: 'longtext', text: 'q.diaries.notes', optional: true, next: 'gadgets.gate' },
];
