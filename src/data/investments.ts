import type { Question } from '../engine/types';
import { makeBeneficiarySubflow } from '../engine/subflows';
import { ITEM_END } from '../engine/repeaters';

// Section 7 — Investments (docs/03-question-flows.md, IV1–IV9)
// Simplified into one repeater (per-type mini-flows collapsed into one
// generic item chain); insurance is recorded but not re-bequeathed, since
// the proceeds go to the policy's nominee under insurance law.
export const investmentsQuestions: Question[] = [
  {
    id: 'invest.gate',
    section: 'invest',
    type: 'single',
    text: 'q.invest.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'invest.item.type' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'receivables.gate',
  },
  {
    id: 'invest.item.type',
    section: 'invest',
    type: 'single',
    text: 'q.invest.item.type',
    options: [
      { id: 'shares', label: 'q.invest.item.type.opt.shares' },
      { id: 'mutual_funds', label: 'q.invest.item.type.opt.mutual_funds' },
      { id: 'fd', label: 'q.invest.item.type.opt.fd' },
      { id: 'retirement', label: 'q.invest.item.type.opt.retirement' },
      { id: 'insurance', label: 'q.invest.item.type.opt.insurance' },
      { id: 'bonds', label: 'q.invest.item.type.opt.bonds' },
      { id: 'chit', label: 'q.invest.item.type.opt.chit' },
      { id: 'crypto', label: 'q.invest.item.type.opt.crypto' },
    ],
    next: 'invest.item.desc',
  },
  { id: 'invest.item.desc', section: 'invest', type: 'text', text: 'q.invest.item.desc', help: 'q.invest.item.desc.help', next: 'invest.item.beneficiary.mode' },

  ...makeBeneficiarySubflow({
    section: 'invest',
    prefix: 'invest.item.beneficiary',
    questionText: 'q.invest.item.beneficiary',
    when: { not: { eq: ['invest.item.type', 'insurance'] } },
    afterNext: 'invest.item.nomination',
  }),

  {
    id: 'invest.item.nomination',
    section: 'invest',
    type: 'single',
    text: 'q.invest.item.nomination',
    help: 'q.invest.item.nomination.help',
    options: [
      { id: 'same', label: 'q.bank.account.nomination.opt.same' },
      { id: 'different', label: 'q.bank.account.nomination.opt.different' },
      { id: 'none', label: 'q.bank.account.nomination.opt.none' },
    ],
    nextRules: [{ when: { eq: ['invest.item.type', 'crypto'] }, goto: 'invest.item.crypto_access' }],
    next: ITEM_END,
  },
  {
    id: 'invest.item.crypto_access',
    section: 'invest',
    type: 'single',
    text: 'q.invest.item.crypto_access',
    help: 'q.invest.item.crypto_access.help',
    options: [
      { id: 'sealed_envelope', label: 'q.invest.item.crypto_access.opt.sealed_envelope' },
      { id: 'password_manager', label: 'q.invest.item.crypto_access.opt.password_manager' },
      { id: 'trusted_person', label: 'q.invest.item.crypto_access.opt.trusted_person', next: 'invest.item.crypto_access.person' },
      { id: 'not_set', label: 'q.invest.item.crypto_access.opt.not_set' },
    ],
    next: ITEM_END,
  },
  { id: 'invest.item.crypto_access.person', section: 'invest', type: 'person', text: 'q.sf.beneficiary.person', next: ITEM_END },
];
