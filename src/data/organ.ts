import type { Question } from '../engine/types';

// Section 3 — Organ donation (docs/03-question-flows.md, OD1–OD3)
// Auto-skipped when the body is already being donated to science (FN1).
export const organQuestions: Question[] = [
  {
    id: 'organ.gate',
    section: 'organ',
    type: 'single',
    text: 'q.organ.gate',
    gate: true,
    when: { not: { eq: ['funeral.method', 'donate_science'] } },
    options: [
      { id: 'yes_any', label: 'q.organ.gate.opt.yes_any', next: 'organ.registered' },
      { id: 'yes_specific', label: 'q.organ.gate.opt.yes_specific', next: 'organ.specific' },
      { id: 'no', label: 'q.organ.gate.opt.no' },
      { id: 'family_decides', label: 'q.organ.gate.opt.family_decides' },
    ],
    next: 'guardianship.gate',
  },
  {
    id: 'organ.specific',
    section: 'organ',
    type: 'multi',
    text: 'q.organ.specific',
    options: [
      { id: 'eyes', label: 'q.organ.specific.opt.eyes' },
      { id: 'kidneys', label: 'q.organ.specific.opt.kidneys' },
      { id: 'heart', label: 'q.organ.specific.opt.heart' },
      { id: 'liver', label: 'q.organ.specific.opt.liver' },
      { id: 'lungs', label: 'q.organ.specific.opt.lungs' },
      { id: 'pancreas', label: 'q.organ.specific.opt.pancreas' },
      { id: 'skin', label: 'q.organ.specific.opt.skin' },
      { id: 'bones', label: 'q.organ.specific.opt.bones' },
    ],
    next: 'organ.registered',
  },
  {
    id: 'organ.registered',
    section: 'organ',
    type: 'single',
    text: 'q.organ.registered',
    options: [
      { id: 'yes', label: 'ui.yes', next: 'organ.registered_details' },
      { id: 'no', label: 'ui.no', next: 'organ.registered_notice' },
    ],
    next: 'guardianship.gate',
  },
  { id: 'organ.registered_details', section: 'organ', type: 'text', text: 'q.organ.registered_details', optional: true, next: 'guardianship.gate' },
  { id: 'organ.registered_notice', section: 'organ', type: 'info', text: 'q.organ.registered_notice', next: 'guardianship.gate' },
];
