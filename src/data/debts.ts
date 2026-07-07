import type { Question } from '../engine/types';
import { ITEM_END } from '../engine/repeaters';

// Section 5 — Debts & liabilities (docs/03-question-flows.md, DB1–DB4)
// Simplified: one repeater collects each debt (its own "kind" question
// replaces the separate multi-select gate) rather than one sub-flow per kind.
export const debtsQuestions: Question[] = [
  {
    id: 'debts.gate',
    section: 'debts',
    type: 'single',
    text: 'q.debts.gate',
    gate: true,
    help: 'q.debts.gate.help',
    options: [
      { id: 'yes', label: 'q.debts.gate.opt.yes', next: 'debts.item.kind' },
      { id: 'not_sure', label: 'q.debts.gate.opt.not_sure', next: 'debts.item.kind' },
      { id: 'no', label: 'q.debts.gate.opt.no' },
    ],
    next: 'bank.gate',
  },
  {
    id: 'debts.item.kind',
    section: 'debts',
    type: 'single',
    text: 'q.debts.item.kind',
    options: [
      { id: 'home_loan', label: 'q.debts.item.kind.opt.home_loan' },
      { id: 'vehicle_loan', label: 'q.debts.item.kind.opt.vehicle_loan' },
      { id: 'personal_loan', label: 'q.debts.item.kind.opt.personal_loan' },
      { id: 'gold_loan', label: 'q.debts.item.kind.opt.gold_loan' },
      { id: 'credit_card', label: 'q.debts.item.kind.opt.credit_card' },
      { id: 'person_debt', label: 'q.debts.item.kind.opt.person_debt' },
      { id: 'other', label: 'q.debts.item.kind.opt.other' },
    ],
    next: 'debts.item.lender',
  },
  { id: 'debts.item.lender', section: 'debts', type: 'text', text: 'q.debts.item.lender', next: 'debts.item.amount' },
  { id: 'debts.item.amount', section: 'debts', type: 'number', text: 'q.debts.item.amount', optional: true, next: 'debts.item.insured' },
  {
    id: 'debts.item.insured',
    section: 'debts',
    type: 'single',
    text: 'q.debts.item.insured',
    help: 'q.debts.item.insured.help',
    options: [
      { id: 'yes', label: 'ui.yes' },
      { id: 'no', label: 'ui.no' },
      { id: 'not_sure', label: 'q.debts.item.insured.opt.not_sure' },
    ],
    next: 'debts.item.secured_strategy',
  },
  {
    id: 'debts.item.secured_strategy',
    section: 'debts',
    type: 'single',
    text: 'q.debts.item.secured_strategy',
    help: 'q.debts.item.secured_strategy.help',
    options: [
      { id: 'sell_asset', label: 'q.debts.item.secured_strategy.opt.sell_asset' },
      { id: 'keep_asset', label: 'q.debts.item.secured_strategy.opt.keep_asset' },
      { id: 'executor_decides', label: 'q.debts.item.secured_strategy.opt.executor_decides' },
    ],
    next: ITEM_END,
  },
];
