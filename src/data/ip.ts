import type { Question } from '../engine/types';
import { makeBeneficiarySubflow } from '../engine/subflows';

// Section 13 — Intellectual property (docs/03-question-flows.md, IP1–IP2)
export const ipQuestions: Question[] = [
  {
    id: 'ip.gate',
    section: 'ip',
    type: 'single',
    text: 'q.ip.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'ip.types' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'diaries.gate',
  },
  {
    id: 'ip.types',
    section: 'ip',
    type: 'multi',
    text: 'q.ip.types',
    options: [
      { id: 'books', label: 'q.ip.types.opt.books' },
      { id: 'music', label: 'q.ip.types.opt.music' },
      { id: 'patents', label: 'q.ip.types.opt.patents' },
      { id: 'trademarks', label: 'q.ip.types.opt.trademarks' },
      { id: 'software', label: 'q.ip.types.opt.software' },
      { id: 'content', label: 'q.ip.types.opt.content' },
    ],
    next: 'ip.desc',
  },
  { id: 'ip.desc', section: 'ip', type: 'longtext', text: 'q.ip.desc', help: 'q.ip.desc.help', next: 'ip.beneficiary.mode' },

  ...makeBeneficiarySubflow({
    section: 'ip',
    prefix: 'ip.beneficiary',
    questionText: 'q.ip.beneficiary',
    afterNext: 'ip.wishes',
  }),

  { id: 'ip.wishes', section: 'ip', type: 'text', text: 'q.ip.wishes', optional: true, next: 'diaries.gate' },
];
