import type { Question } from '../engine/types';
import { makeBeneficiarySubflow } from '../engine/subflows';

// Section 11 — Collectibles & valuables (docs/03-question-flows.md, CL1–CL4)
// Simplified to one beneficiary pick for the collection as a whole (the
// itemised "specific pieces to specific people" path is covered by Jewellery
// for the one asset class where it matters most — see docs/05-roadmap.md).
export const collectiblesQuestions: Question[] = [
  {
    id: 'collect.gate',
    section: 'collect',
    type: 'single',
    text: 'q.collect.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'collect.types' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'jewellery.gate',
  },
  {
    id: 'collect.types',
    section: 'collect',
    type: 'multi',
    text: 'q.collect.types',
    help: 'q.collect.types.help',
    options: [
      { id: 'art', label: 'q.collect.types.opt.art' },
      { id: 'antiques', label: 'q.collect.types.opt.antiques' },
      { id: 'watches', label: 'q.collect.types.opt.watches' },
      { id: 'coins_stamps', label: 'q.collect.types.opt.coins_stamps' },
      { id: 'books', label: 'q.collect.types.opt.books' },
      { id: 'instruments', label: 'q.collect.types.opt.instruments' },
      { id: 'electronics', label: 'q.collect.types.opt.electronics' },
      { id: 'other', label: 'q.collect.types.opt.other' },
    ],
    next: 'collect.beneficiary.mode',
  },

  ...makeBeneficiarySubflow({
    section: 'collect',
    prefix: 'collect.beneficiary',
    questionText: 'q.collect.beneficiary',
    afterNext: 'jewellery.gate',
  }),
];
