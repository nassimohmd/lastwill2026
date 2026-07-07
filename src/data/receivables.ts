import type { Question } from '../engine/types';
import { makeBeneficiaryPersonChain } from '../engine/subflows';
import { ITEM_END } from '../engine/repeaters';

// Section 8 — Receivables: money owed to you (docs/03-question-flows.md, RC1–RC2)
export const receivablesQuestions: Question[] = [
  {
    id: 'receivables.gate',
    section: 'receivables',
    type: 'single',
    text: 'q.receivables.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'receivables.item.who' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'realestate.gate',
  },
  { id: 'receivables.item.who', section: 'receivables', type: 'text', text: 'q.receivables.item.who', next: 'receivables.item.amount' },
  { id: 'receivables.item.amount', section: 'receivables', type: 'number', text: 'q.receivables.item.amount', next: 'receivables.item.proof' },
  {
    id: 'receivables.item.proof',
    section: 'receivables',
    type: 'single',
    text: 'q.receivables.item.proof',
    help: 'q.receivables.item.proof.help',
    options: [
      { id: 'written', label: 'q.receivables.item.proof.opt.written' },
      { id: 'bank_transfer', label: 'q.receivables.item.proof.opt.bank_transfer' },
      { id: 'informal', label: 'q.receivables.item.proof.opt.informal' },
    ],
    next: 'receivables.item.action',
  },
  {
    id: 'receivables.item.action',
    section: 'receivables',
    type: 'single',
    text: 'q.receivables.item.action',
    options: [
      { id: 'collect_estate', label: 'q.receivables.item.action.opt.collect_estate' },
      { id: 'collect_person', label: 'q.receivables.item.action.opt.collect_person', next: 'receivables.item.person' },
      { id: 'forgive', label: 'q.receivables.item.action.opt.forgive' },
    ],
    next: ITEM_END,
  },

  ...makeBeneficiaryPersonChain({ section: 'receivables', prefix: 'receivables.item', afterNext: ITEM_END }),
];
