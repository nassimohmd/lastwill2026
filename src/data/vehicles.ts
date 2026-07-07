import type { Question } from '../engine/types';
import { makeBeneficiaryPersonChain } from '../engine/subflows';
import { ITEM_END } from '../engine/repeaters';

// Section 10 — Vehicles (docs/03-question-flows.md, VH1–VH2)
export const vehiclesQuestions: Question[] = [
  {
    id: 'vehicles.gate',
    section: 'vehicles',
    type: 'single',
    text: 'q.vehicles.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'vehicles.item.type' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'collect.gate',
  },
  {
    id: 'vehicles.item.type',
    section: 'vehicles',
    type: 'single',
    text: 'q.vehicles.item.type',
    options: [
      { id: 'car', label: 'q.vehicles.item.type.opt.car' },
      { id: 'motorcycle', label: 'q.vehicles.item.type.opt.motorcycle' },
      { id: 'commercial', label: 'q.vehicles.item.type.opt.commercial' },
      { id: 'other', label: 'q.vehicles.item.type.opt.other' },
    ],
    next: 'vehicles.item.desc',
  },
  { id: 'vehicles.item.desc', section: 'vehicles', type: 'text', text: 'q.vehicles.item.desc', next: 'vehicles.item.reg' },
  { id: 'vehicles.item.reg', section: 'vehicles', type: 'text', text: 'q.vehicles.item.reg', optional: true, next: 'vehicles.item.action' },
  {
    id: 'vehicles.item.action',
    section: 'vehicles',
    type: 'single',
    text: 'q.vehicles.item.action',
    options: [
      { id: 'person', label: 'q.vehicles.item.action.opt.person', next: 'vehicles.item.person' },
      { id: 'sell', label: 'q.vehicles.item.action.opt.sell' },
      { id: 'family_decides', label: 'q.vehicles.item.action.opt.family_decides' },
    ],
    next: 'vehicles.item.loan',
  },

  ...makeBeneficiaryPersonChain({ section: 'vehicles', prefix: 'vehicles.item', afterNext: 'vehicles.item.loan' }),

  {
    id: 'vehicles.item.loan',
    section: 'vehicles',
    type: 'single',
    text: 'q.vehicles.item.loan',
    options: [
      { id: 'yes', label: 'ui.yes' },
      { id: 'no', label: 'ui.no' },
    ],
    next: ITEM_END,
  },
];
