import type { Question } from '../engine/types';

// Section 17 — Executors (docs/03-question-flows.md, EX1–EX7)
export const executorQuestions: Question[] = [
  { id: 'executors.physical.primary', section: 'executors', type: 'person', text: 'q.executors.physical.primary', help: 'q.executors.physical.primary.help', askAddress: true, next: 'executors.physical.secondary' },
  { id: 'executors.physical.secondary', section: 'executors', type: 'person', text: 'q.executors.physical.secondary', askAddress: true, next: 'executors.digital.same' },

  {
    id: 'executors.digital.same',
    section: 'executors',
    type: 'single',
    text: 'q.executors.digital.same',
    options: [
      { id: 'yes', label: 'q.executors.digital.same.opt.yes' },
      { id: 'other', label: 'q.executors.digital.same.opt.other', next: 'executors.digital.primary' },
    ],
    next: 'executors.powers',
  },
  { id: 'executors.digital.primary', section: 'executors', type: 'person', text: 'q.executors.digital.primary', help: 'q.executors.digital.primary.help', askAddress: true, next: 'executors.digital.secondary' },
  { id: 'executors.digital.secondary', section: 'executors', type: 'person', text: 'q.executors.digital.secondary', askAddress: true, next: 'executors.powers' },

  {
    id: 'executors.powers',
    section: 'executors',
    type: 'single',
    text: 'q.executors.powers',
    help: 'q.executors.powers.help',
    options: [
      { id: 'standard', label: 'q.executors.powers.opt.standard' },
      { id: 'notes', label: 'q.executors.powers.opt.notes', next: 'executors.powers_notes' },
    ],
    next: 'executors.compensation',
  },
  { id: 'executors.powers_notes', section: 'executors', type: 'longtext', text: 'q.executors.powers_notes', next: 'executors.compensation' },

  {
    id: 'executors.compensation',
    section: 'executors',
    type: 'single',
    text: 'q.executors.compensation',
    options: [
      { id: 'none', label: 'q.executors.compensation.opt.none' },
      { id: 'fixed', label: 'q.executors.compensation.opt.fixed', next: 'executors.compensation_amount' },
      { id: 'reasonable', label: 'q.executors.compensation.opt.reasonable' },
    ],
    next: 'executors.informed',
  },
  { id: 'executors.compensation_amount', section: 'executors', type: 'number', text: 'q.executors.compensation_amount', next: 'executors.informed' },

  {
    id: 'executors.informed',
    section: 'executors',
    type: 'single',
    text: 'q.executors.informed',
    options: [
      { id: 'yes', label: 'ui.yes' },
      { id: 'no', label: 'ui.no' },
    ],
  },
];
