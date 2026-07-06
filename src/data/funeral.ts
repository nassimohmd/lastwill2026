import type { Question } from '../engine/types';

// Section 2 — Funeral & memorial (docs/03-question-flows.md, FN1–FN11)
export const funeralQuestions: Question[] = [
  {
    id: 'funeral.method',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.method',
    gate: true, // skipping this skips the whole funeral section
    options: [
      { id: 'burial', label: 'q.funeral.method.opt.burial', next: 'funeral.burial.place' },
      { id: 'cremation', label: 'q.funeral.method.opt.cremation', next: 'funeral.cremation.place' },
      { id: 'donate_science', label: 'q.funeral.method.opt.donate_science', next: 'funeral.body_donation.institution' },
      { id: 'family_decides', label: 'q.funeral.method.opt.family_decides' },
    ],
    next: 'funeral.memorial',
  },

  // — Burial branch —
  {
    id: 'funeral.burial.place',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.burial.place',
    options: [
      { id: 'family_ground', label: 'q.funeral.burial.place.opt.family_ground', next: 'funeral.burial.place_detail' },
      { id: 'mosque', label: 'q.funeral.burial.place.opt.mosque', next: 'funeral.burial.place_detail' },
      { id: 'church', label: 'q.funeral.burial.place.opt.church', next: 'funeral.burial.place_detail' },
      { id: 'public', label: 'q.funeral.burial.place.opt.public' },
      { id: 'specific', label: 'q.funeral.burial.place.opt.specific', next: 'funeral.burial.place_detail' },
      { id: 'practical', label: 'q.funeral.burial.place.opt.practical' },
    ],
    next: 'funeral.burial.rites',
  },
  {
    id: 'funeral.burial.place_detail',
    section: 'funeral',
    type: 'text',
    text: 'q.funeral.burial.place_detail',
    help: 'q.funeral.burial.place_detail.help',
    optional: true,
    next: 'funeral.burial.rites',
  },
  {
    id: 'funeral.burial.rites',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.burial.rites',
    options: [
      { id: 'customs', label: 'q.funeral.burial.rites.opt.customs' },
      { id: 'simple', label: 'q.funeral.burial.rites.opt.simple' },
      { id: 'custom', label: 'q.funeral.burial.rites.opt.custom', next: 'funeral.burial.rites_custom' },
    ],
    next: 'funeral.memorial',
  },
  {
    id: 'funeral.burial.rites_custom',
    section: 'funeral',
    type: 'longtext',
    text: 'q.funeral.burial.rites_custom',
    next: 'funeral.memorial',
  },

  // — Cremation branch —
  {
    id: 'funeral.cremation.place',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.cremation.place',
    options: [
      { id: 'local', label: 'q.funeral.cremation.place.opt.local' },
      { id: 'specific', label: 'q.funeral.cremation.place.opt.specific', next: 'funeral.cremation.place_detail' },
      { id: 'practical', label: 'q.funeral.cremation.place.opt.practical' },
    ],
    next: 'funeral.cremation.rites',
  },
  {
    id: 'funeral.cremation.place_detail',
    section: 'funeral',
    type: 'text',
    text: 'q.funeral.cremation.place_detail',
    help: 'q.funeral.cremation.place_detail.help',
    optional: true,
    next: 'funeral.cremation.rites',
  },
  {
    id: 'funeral.cremation.rites',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.cremation.rites',
    options: [
      { id: 'customs', label: 'q.funeral.cremation.rites.opt.customs' },
      { id: 'simple', label: 'q.funeral.cremation.rites.opt.simple' },
      { id: 'custom', label: 'q.funeral.cremation.rites.opt.custom', next: 'funeral.cremation.rites_custom' },
    ],
    next: 'funeral.cremation.ashes',
  },
  {
    id: 'funeral.cremation.rites_custom',
    section: 'funeral',
    type: 'longtext',
    text: 'q.funeral.cremation.rites_custom',
    next: 'funeral.cremation.ashes',
  },
  {
    id: 'funeral.cremation.ashes',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.cremation.ashes',
    options: [
      { id: 'immerse', label: 'q.funeral.cremation.ashes.opt.immerse', next: 'funeral.cremation.ashes_place' },
      { id: 'scatter', label: 'q.funeral.cremation.ashes.opt.scatter', next: 'funeral.cremation.ashes_place' },
      { id: 'kept', label: 'q.funeral.cremation.ashes.opt.kept' },
      { id: 'none', label: 'q.funeral.cremation.ashes.opt.none' },
    ],
    next: 'funeral.memorial',
  },
  {
    id: 'funeral.cremation.ashes_place',
    section: 'funeral',
    type: 'text',
    text: 'q.funeral.cremation.ashes_place',
    help: 'q.funeral.cremation.ashes_place.help',
    optional: true,
    next: 'funeral.memorial',
  },

  // — Body donation branch —
  {
    id: 'funeral.body_donation.institution',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.body_donation.institution',
    options: [
      { id: 'known', label: 'q.funeral.body_donation.institution.opt.known', next: 'funeral.body_donation.institution_name' },
      { id: 'executor', label: 'q.funeral.body_donation.institution.opt.executor' },
    ],
    next: 'funeral.body_donation.fallback',
  },
  {
    id: 'funeral.body_donation.institution_name',
    section: 'funeral',
    type: 'text',
    text: 'q.funeral.body_donation.institution_name',
    help: 'q.funeral.body_donation.institution_name.help',
    next: 'funeral.body_donation.fallback',
  },
  {
    id: 'funeral.body_donation.fallback',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.body_donation.fallback',
    help: 'q.funeral.body_donation.fallback.help',
    options: [
      { id: 'burial', label: 'q.funeral.body_donation.fallback.opt.burial', next: 'funeral.burial.place' },
      { id: 'cremation', label: 'q.funeral.body_donation.fallback.opt.cremation', next: 'funeral.cremation.place' },
      { id: 'family', label: 'q.funeral.body_donation.fallback.opt.family' },
    ],
    next: 'funeral.memorial',
  },

  // — Common tail —
  {
    id: 'funeral.memorial',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.memorial',
    options: [
      { id: 'customs', label: 'q.funeral.memorial.opt.customs' },
      { id: 'simple', label: 'q.funeral.memorial.opt.simple' },
      { id: 'none', label: 'q.funeral.memorial.opt.none' },
      { id: 'family', label: 'q.funeral.memorial.opt.family' },
    ],
    next: 'funeral.cost',
  },
  {
    id: 'funeral.cost',
    section: 'funeral',
    type: 'single',
    text: 'q.funeral.cost',
    options: [
      { id: 'modest', label: 'q.funeral.cost.opt.modest' },
      { id: 'customary', label: 'q.funeral.cost.opt.customary' },
      { id: 'limit', label: 'q.funeral.cost.opt.limit', next: 'funeral.cost_amount' },
    ],
    next: 'funeral.notes',
  },
  {
    id: 'funeral.cost_amount',
    section: 'funeral',
    type: 'number',
    text: 'q.funeral.cost_amount',
    next: 'funeral.notes',
  },
  {
    id: 'funeral.notes',
    section: 'funeral',
    type: 'longtext',
    text: 'q.funeral.notes',
    help: 'q.funeral.notes.help',
    optional: true,
  },
];
