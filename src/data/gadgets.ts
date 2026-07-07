import type { Question } from '../engine/types';
import { makeBeneficiaryPersonChain } from '../engine/subflows';
import { ITEM_END } from '../engine/repeaters';

// Section 15 — Gadgets & devices (docs/03-question-flows.md, GA1–GA3)
export const gadgetsQuestions: Question[] = [
  {
    id: 'gadgets.gate',
    section: 'gadgets',
    type: 'single',
    text: 'q.gadgets.gate',
    gate: true,
    options: [
      { id: 'wipe_give_family', label: 'q.gadgets.gate.opt.wipe_give_family' },
      { id: 'sell', label: 'q.gadgets.gate.opt.sell' },
      { id: 'specific', label: 'q.gadgets.gate.opt.specific', next: 'gadgets.item.desc' },
      { id: 'recycle', label: 'q.gadgets.gate.opt.recycle' },
      { id: 'family_decides', label: 'q.gadgets.gate.opt.family_decides' },
    ],
    next: 'gadgets.data',
  },
  { id: 'gadgets.item.desc', section: 'gadgets', type: 'text', text: 'q.gadgets.item.desc', next: 'gadgets.item.person' },

  ...makeBeneficiaryPersonChain({ section: 'gadgets', prefix: 'gadgets.item', afterNext: ITEM_END }),

  {
    id: 'gadgets.data',
    section: 'gadgets',
    type: 'single',
    text: 'q.gadgets.data',
    options: [
      { id: 'backup_then_wipe', label: 'q.gadgets.data.opt.backup_then_wipe' },
      { id: 'wipe_no_backup', label: 'q.gadgets.data.opt.wipe_no_backup' },
      { id: 'handed_as_is', label: 'q.gadgets.data.opt.handed_as_is' },
    ],
    next: 'digital.gate',
  },
];
