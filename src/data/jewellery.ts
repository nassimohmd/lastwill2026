import type { Question } from '../engine/types';
import { makeBeneficiarySubflow } from '../engine/subflows';

// Section 12 — Jewellery (docs/03-question-flows.md, JW1–JW5)
// Simplified to one beneficiary pick for all of it, as with Collectibles.
export const jewelleryQuestions: Question[] = [
  {
    id: 'jewellery.gate',
    section: 'jewellery',
    type: 'single',
    text: 'q.jewellery.gate',
    help: 'q.jewellery.gate.help',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'jewellery.kept' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'ip.gate',
  },
  {
    id: 'jewellery.kept',
    section: 'jewellery',
    type: 'multi',
    text: 'q.jewellery.kept',
    options: [
      { id: 'home', label: 'q.jewellery.kept.opt.home' },
      { id: 'locker', label: 'q.jewellery.kept.opt.locker' },
      { id: 'family_member', label: 'q.jewellery.kept.opt.family_member' },
    ],
    next: 'jewellery.beneficiary.mode',
  },

  ...makeBeneficiarySubflow({
    section: 'jewellery',
    prefix: 'jewellery.beneficiary',
    questionText: 'q.jewellery.beneficiary',
    afterNext: 'ip.gate',
  }),
];
