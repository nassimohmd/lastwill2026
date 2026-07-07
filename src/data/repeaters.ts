import type { FlowRepeaterDef } from '../engine/repeaters';
import { buildRepeaterRegistry } from '../engine/repeaters';

// The `summarize` functions produce a short human-readable line for the
// "add another?" screen — full clause rendering happens later in
// template/render.ts, independent of this.
export const repeaterDefs: FlowRepeaterDef[] = [
  {
    id: 'bank.accounts',
    keyPrefix: 'bank.account',
    entryId: 'bank.account.bank_name',
    afterId: 'bank.locker.gate',
    addMoreLabel: 'ui.repeater.bank.addMore',
    summarize: (item) => [item.bank_name, item.type].filter(Boolean).join(' — ') as string,
  },
  {
    id: 'realestate.items',
    keyPrefix: 'realestate.item',
    entryId: 'realestate.item.type',
    afterId: 'residuary.primary',
    addMoreLabel: 'ui.repeater.realestate.addMore',
    summarize: (item) => {
      const desc = String(item.desc ?? '');
      return desc.length > 60 ? desc.slice(0, 57) + '…' : desc;
    },
  },
];

export const repeaterRegistry = buildRepeaterRegistry(repeaterDefs);
