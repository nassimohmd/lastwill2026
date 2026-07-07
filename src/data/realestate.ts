import type { Question } from '../engine/types';
import { makeBeneficiaryPersonChain } from '../engine/subflows';
import { ITEM_END } from '../engine/repeaters';

// Section 9 — Real estate (docs/03-question-flows.md, RE1–RE2g)
export const realEstateQuestions: Question[] = [
  {
    id: 'realestate.gate',
    section: 'realestate',
    type: 'single',
    text: 'q.realestate.gate',
    gate: true,
    options: [
      { id: 'yes', label: 'ui.yes', next: 'realestate.item.type' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'residuary.primary',
  },

  {
    id: 'realestate.item.type',
    section: 'realestate',
    type: 'single',
    text: 'q.realestate.item.type',
    options: [
      { id: 'house', label: 'q.realestate.item.type.opt.house' },
      { id: 'flat', label: 'q.realestate.item.type.opt.flat' },
      { id: 'plot', label: 'q.realestate.item.type.opt.plot' },
      { id: 'agricultural', label: 'q.realestate.item.type.opt.agricultural' },
      { id: 'commercial', label: 'q.realestate.item.type.opt.commercial' },
      { id: 'ancestral_share', label: 'q.realestate.item.type.opt.ancestral_share' },
    ],
    next: 'realestate.item.desc',
  },
  { id: 'realestate.item.desc', section: 'realestate', type: 'longtext', text: 'q.realestate.item.desc', help: 'q.realestate.item.desc.help', next: 'realestate.item.ownership' },
  {
    id: 'realestate.item.ownership',
    section: 'realestate',
    type: 'single',
    text: 'q.realestate.item.ownership',
    options: [
      { id: 'sole', label: 'q.realestate.item.ownership.opt.sole' },
      { id: 'joint', label: 'q.realestate.item.ownership.opt.joint', next: 'realestate.item.ownership.coowner' },
      { id: 'ancestral', label: 'q.realestate.item.ownership.opt.ancestral', next: 'realestate.item.ownership.ancestral_notice' },
    ],
    next: 'realestate.item.action',
  },
  { id: 'realestate.item.ownership.coowner', section: 'realestate', type: 'person', text: 'q.realestate.item.ownership.coowner', next: 'realestate.item.action' },
  { id: 'realestate.item.ownership.ancestral_notice', section: 'realestate', type: 'info', text: 'q.realestate.item.ownership.ancestral_notice', next: 'realestate.item.action' },

  {
    id: 'realestate.item.action',
    section: 'realestate',
    type: 'single',
    text: 'q.realestate.item.action',
    options: [
      { id: 'one', label: 'q.realestate.item.action.opt.one', next: 'realestate.item.ben.person' },
      { id: 'divide', label: 'q.realestate.item.action.opt.divide', next: 'realestate.item.ben.people' },
      { id: 'life_interest', label: 'q.realestate.item.action.opt.life_interest', next: 'realestate.item.life.occupant' },
      { id: 'sell', label: 'q.realestate.item.action.opt.sell' },
      { id: 'residuary', label: 'q.realestate.item.action.opt.residuary' },
    ],
    next: 'realestate.item.rented',
  },

  ...makeBeneficiaryPersonChain({
    section: 'realestate',
    prefix: 'realestate.item.ben',
    afterNext: 'realestate.item.rented',
  }),

  { id: 'realestate.item.life.occupant', section: 'realestate', type: 'person', text: 'q.realestate.item.life.occupant', next: 'realestate.item.life.remainder' },
  { id: 'realestate.item.life.remainder', section: 'realestate', type: 'person', text: 'q.realestate.item.life.remainder', next: 'realestate.item.rented' },

  {
    id: 'realestate.item.rented',
    section: 'realestate',
    type: 'single',
    text: 'q.realestate.item.rented',
    options: [
      { id: 'yes', label: 'ui.yes', next: 'realestate.item.rented.instructions' },
      { id: 'no', label: 'ui.no' },
    ],
    next: 'realestate.item.loan',
  },
  {
    id: 'realestate.item.rented.instructions',
    section: 'realestate',
    type: 'single',
    text: 'q.realestate.item.rented.instructions',
    options: [
      { id: 'continue_tenancy', label: 'q.realestate.item.rented.instructions.opt.continue_tenancy' },
      { id: 'new_owner_decides', label: 'q.realestate.item.rented.instructions.opt.new_owner_decides' },
      { id: 'custom', label: 'q.realestate.item.rented.instructions.opt.custom', next: 'realestate.item.rented.instructions_text' },
    ],
    next: 'realestate.item.loan',
  },
  { id: 'realestate.item.rented.instructions_text', section: 'realestate', type: 'text', text: 'q.realestate.item.rented.instructions_text', next: 'realestate.item.loan' },

  {
    id: 'realestate.item.loan',
    section: 'realestate',
    type: 'single',
    text: 'q.realestate.item.loan',
    help: 'q.realestate.item.loan.help',
    options: [
      { id: 'yes', label: 'ui.yes' },
      { id: 'no', label: 'ui.no' },
    ],
    next: ITEM_END,
  },
];
