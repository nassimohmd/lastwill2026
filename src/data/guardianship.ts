import type { NextRule, Question } from '../engine/types';
import { ITEM_END } from '../engine/repeaters';

// Section 4 — Guardianship (docs/03-question-flows.md, GD1–GD13)
// Simplified: one guardian pair covers all minor children (per-child choice
// is a documented v1 scope reduction — see docs/05-roadmap.md non-goals).
const afterMinors: { nextRules: NextRule[]; next: string } = {
  nextRules: [{ when: { eq: ['guardianship.gate', 'both'] }, goto: 'guardianship.dependents.item.person' }],
  next: 'debts.gate',
};

export const guardianshipQuestions: Question[] = [
  {
    id: 'guardianship.gate',
    section: 'guardianship',
    type: 'single',
    text: 'q.guardianship.gate',
    gate: true,
    options: [
      { id: 'minors', label: 'q.guardianship.gate.opt.minors', next: 'guardianship.primary' },
      { id: 'dependent_adult', label: 'q.guardianship.gate.opt.dependent_adult', next: 'guardianship.dependents.item.person' },
      { id: 'both', label: 'q.guardianship.gate.opt.both', next: 'guardianship.primary' },
      { id: 'no', label: 'q.guardianship.gate.opt.no' },
    ],
    next: 'debts.gate',
  },

  { id: 'guardianship.primary', section: 'guardianship', type: 'person', text: 'q.guardianship.primary', askAddress: true, next: 'guardianship.alternate' },
  { id: 'guardianship.alternate', section: 'guardianship', type: 'person', text: 'q.guardianship.alternate', askAddress: true, next: 'guardianship.property_guardian' },
  {
    id: 'guardianship.property_guardian',
    section: 'guardianship',
    type: 'single',
    text: 'q.guardianship.property_guardian',
    help: 'q.guardianship.property_guardian.help',
    options: [
      { id: 'same', label: 'q.guardianship.property_guardian.opt.same' },
      { id: 'different', label: 'q.guardianship.property_guardian.opt.different', next: 'guardianship.property_guardian.person' },
    ],
    next: 'guardianship.until_age',
  },
  { id: 'guardianship.property_guardian.person', section: 'guardianship', type: 'person', text: 'q.guardianship.property_guardian.person', next: 'guardianship.until_age' },
  {
    id: 'guardianship.until_age',
    section: 'guardianship',
    type: 'single',
    text: 'q.guardianship.until_age',
    help: 'q.guardianship.until_age.help',
    options: [
      { id: '18', label: 'q.guardianship.until_age.opt.18' },
      { id: '21', label: 'q.guardianship.until_age.opt.21' },
      { id: '25', label: 'q.guardianship.until_age.opt.25' },
    ],
    next: 'guardianship.upbringing',
  },
  { id: 'guardianship.upbringing', section: 'guardianship', type: 'longtext', text: 'q.guardianship.upbringing', optional: true, next: 'guardianship.provision' },
  {
    id: 'guardianship.provision',
    section: 'guardianship',
    type: 'single',
    text: 'q.guardianship.provision',
    options: [
      { id: 'amount', label: 'q.guardianship.provision.opt.amount', next: 'guardianship.provision_amount' },
      { id: 'general_estate', label: 'q.guardianship.provision.opt.general_estate' },
      { id: 'no', label: 'q.guardianship.provision.opt.no' },
    ],
    ...afterMinors,
  },
  { id: 'guardianship.provision_amount', section: 'guardianship', type: 'number', text: 'q.guardianship.provision_amount', next: 'guardianship.provision_source' },
  {
    id: 'guardianship.provision_source',
    section: 'guardianship',
    type: 'single',
    text: 'q.guardianship.provision_source',
    options: [
      { id: 'bank', label: 'q.guardianship.provision_source.opt.bank' },
      { id: 'asset_sale', label: 'q.guardianship.provision_source.opt.asset_sale', next: 'guardianship.provision_source_desc' },
      { id: 'executor', label: 'q.guardianship.provision_source.opt.executor' },
    ],
    ...afterMinors,
  },
  { id: 'guardianship.provision_source_desc', section: 'guardianship', type: 'text', text: 'q.guardianship.provision_source_desc', ...afterMinors },

  // — dependent adults (repeater) —
  { id: 'guardianship.dependents.item.person', section: 'guardianship', type: 'person', text: 'q.guardianship.dependents.person', next: 'guardianship.dependents.item.carer' },
  { id: 'guardianship.dependents.item.carer', section: 'guardianship', type: 'person', text: 'q.guardianship.dependents.carer', next: 'guardianship.dependents.item.alt_carer' },
  { id: 'guardianship.dependents.item.alt_carer', section: 'guardianship', type: 'person', text: 'q.guardianship.dependents.alt_carer', next: 'guardianship.dependents.item.provision' },
  {
    id: 'guardianship.dependents.item.provision',
    section: 'guardianship',
    type: 'single',
    text: 'q.guardianship.dependents.provision',
    options: [
      { id: 'yes', label: 'ui.yes', next: 'guardianship.dependents.item.provision_amount' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'guardianship.dependents.item.instructions',
  },
  { id: 'guardianship.dependents.item.provision_amount', section: 'guardianship', type: 'number', text: 'q.guardianship.dependents.provision_amount', next: 'guardianship.dependents.item.instructions' },
  { id: 'guardianship.dependents.item.instructions', section: 'guardianship', type: 'longtext', text: 'q.guardianship.dependents.instructions', optional: true, next: ITEM_END },
];
