import type { Question } from '../engine/types';

// Section 16 — Residuary clause (docs/03-question-flows.md, RS1–RS2)
export const residuaryQuestions: Question[] = [
  {
    id: 'residuary.primary',
    section: 'residuary',
    type: 'single',
    text: 'q.residuary.primary',
    help: 'q.residuary.primary.help',
    options: [
      { id: 'spouse', label: 'q.residuary.primary.opt.spouse' },
      { id: 'children', label: 'q.residuary.primary.opt.children' },
      { id: 'spouse_children', label: 'q.residuary.primary.opt.spouse_children' },
      { id: 'one_person', label: 'q.residuary.primary.opt.one_person', next: 'residuary.primary.person' },
      { id: 'several_people', label: 'q.residuary.primary.opt.several_people', next: 'residuary.primary.people' },
      { id: 'charity', label: 'q.residuary.primary.opt.charity', next: 'residuary.primary.charity' },
    ],
    next: 'residuary.contingent',
  },
  { id: 'residuary.primary.person', section: 'residuary', type: 'person', text: 'q.residuary.primary.person', next: 'residuary.contingent' },
  { id: 'residuary.primary.people', section: 'residuary', type: 'personMulti', text: 'q.residuary.primary.people', minPeople: 2, next: 'residuary.primary.shares' },
  { id: 'residuary.primary.shares', section: 'residuary', type: 'shares', text: 'q.sf.shares', peopleSource: 'residuary.primary.people', next: 'residuary.contingent' },
  { id: 'residuary.primary.charity', section: 'residuary', type: 'text', text: 'q.residuary.primary.charity', help: 'q.residuary.primary.charity.help', next: 'residuary.contingent' },

  {
    id: 'residuary.contingent',
    section: 'residuary',
    type: 'single',
    text: 'q.residuary.contingent',
    options: [
      { id: 'alt_person', label: 'q.residuary.contingent.opt.alt_person', next: 'residuary.contingent.person' },
      { id: 'alt_charity', label: 'q.residuary.contingent.opt.alt_charity', next: 'residuary.contingent.charity' },
      { id: 'legal_heirs', label: 'q.residuary.contingent.opt.legal_heirs' },
    ],
    next: 'executors.physical.primary',
  },
  { id: 'residuary.contingent.person', section: 'residuary', type: 'person', text: 'q.sf.contingent.person', next: 'executors.physical.primary' },
  { id: 'residuary.contingent.charity', section: 'residuary', type: 'text', text: 'q.residuary.contingent.charity', next: 'executors.physical.primary' },
];
