import type { Question } from '../engine/types';
import { makeBeneficiarySubflow } from '../engine/subflows';
import { ITEM_END } from '../engine/repeaters';

// Section 6 — Bank accounts & money (docs/03-question-flows.md, BK1–BK7)
export const bankQuestions: Question[] = [
  {
    id: 'bank.gate',
    section: 'bank',
    type: 'single',
    text: 'q.bank.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'bank.mode' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'invest.gate',
  },
  {
    id: 'bank.mode',
    section: 'bank',
    type: 'single',
    text: 'q.bank.mode',
    options: [
      { id: 'all', label: 'q.bank.mode.opt.all', next: 'bank.all.mode' },
      { id: 'per_account', label: 'q.bank.mode.opt.per_account', next: 'bank.account.bank_name' },
    ],
    next: 'bank.locker.gate',
  },

  ...makeBeneficiarySubflow({
    section: 'bank',
    prefix: 'bank.all',
    questionText: 'q.bank.all.beneficiary',
    afterNext: 'bank.locker.gate',
  }),

  // — per-account repeater item chain (docs BK3) —
  { id: 'bank.account.bank_name', section: 'bank', type: 'text', text: 'q.bank.account.bank_name', next: 'bank.account.branch' },
  { id: 'bank.account.branch', section: 'bank', type: 'text', text: 'q.bank.account.branch', optional: true, next: 'bank.account.type' },
  {
    id: 'bank.account.type',
    section: 'bank',
    type: 'single',
    text: 'q.bank.account.type',
    options: [
      { id: 'savings', label: 'q.bank.account.type.opt.savings' },
      { id: 'current', label: 'q.bank.account.type.opt.current' },
      { id: 'joint', label: 'q.bank.account.type.opt.joint', next: 'bank.account.type.coholder' },
    ],
    next: 'bank.account.last4',
  },
  {
    id: 'bank.account.type.coholder',
    section: 'bank',
    type: 'person',
    text: 'q.bank.account.coholder',
    next: 'bank.account.last4',
  },
  { id: 'bank.account.last4', section: 'bank', type: 'text', text: 'q.bank.account.last4', help: 'q.bank.account.last4.help', optional: true, next: 'bank.account.beneficiary.mode' },

  ...makeBeneficiarySubflow({
    section: 'bank',
    prefix: 'bank.account.beneficiary',
    questionText: 'q.bank.account.beneficiary',
    afterNext: 'bank.account.nomination',
  }),

  {
    id: 'bank.account.nomination',
    section: 'bank',
    type: 'single',
    text: 'q.bank.account.nomination',
    help: 'q.bank.account.nomination.help',
    options: [
      { id: 'same', label: 'q.bank.account.nomination.opt.same' },
      { id: 'different', label: 'q.bank.account.nomination.opt.different' },
      { id: 'none', label: 'q.bank.account.nomination.opt.none' },
    ],
    next: ITEM_END,
  },

  // — locker —
  {
    id: 'bank.locker.gate',
    section: 'bank',
    type: 'single',
    text: 'q.bank.locker.gate',
    options: [
      { id: 'yes', label: 'ui.yes', next: 'bank.locker.bank' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'bank.cash.gate',
  },
  { id: 'bank.locker.bank', section: 'bank', type: 'text', text: 'q.bank.locker.bank', next: 'bank.locker.contents' },
  { id: 'bank.locker.contents', section: 'bank', type: 'longtext', text: 'q.bank.locker.contents', help: 'q.bank.locker.contents.help', optional: true, next: 'bank.locker.beneficiary.mode' },
  ...makeBeneficiarySubflow({
    section: 'bank',
    prefix: 'bank.locker.beneficiary',
    questionText: 'q.bank.locker.beneficiary',
    afterNext: 'bank.cash.gate',
  }),

  // — cash at home —
  {
    id: 'bank.cash.gate',
    section: 'bank',
    type: 'single',
    text: 'q.bank.cash.gate',
    options: [
      { id: 'yes', label: 'ui.yes', next: 'bank.cash.beneficiary.mode' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'invest.gate',
  },
  ...makeBeneficiarySubflow({
    section: 'bank',
    prefix: 'bank.cash.beneficiary',
    questionText: 'q.bank.cash.beneficiary',
    afterNext: 'invest.gate',
  }),
];
