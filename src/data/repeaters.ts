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
    afterId: 'vehicles.gate',
    addMoreLabel: 'ui.repeater.realestate.addMore',
    summarize: (item) => {
      const desc = String(item.desc ?? '');
      return desc.length > 60 ? desc.slice(0, 57) + '…' : desc;
    },
  },
  {
    id: 'guardianship.dependents',
    keyPrefix: 'guardianship.dependents.item',
    entryId: 'guardianship.dependents.item.person',
    afterId: 'debts.gate',
    addMoreLabel: 'ui.repeater.guardianship.addMore',
    summarize: () => 'A dependent',
  },
  {
    id: 'debts.items',
    keyPrefix: 'debts.item',
    entryId: 'debts.item.kind',
    afterId: 'bank.gate',
    addMoreLabel: 'ui.repeater.debts.addMore',
    summarize: (item) => [item.lender, item.kind].filter(Boolean).join(' — ') as string,
  },
  {
    id: 'invest.items',
    keyPrefix: 'invest.item',
    entryId: 'invest.item.type',
    afterId: 'receivables.gate',
    addMoreLabel: 'ui.repeater.invest.addMore',
    summarize: (item) => {
      const desc = String(item.desc ?? '');
      return [desc.length > 40 ? desc.slice(0, 37) + '…' : desc, item.type].filter(Boolean).join(' — ') as string;
    },
  },
  {
    id: 'receivables.items',
    keyPrefix: 'receivables.item',
    entryId: 'receivables.item.who',
    afterId: 'realestate.gate',
    addMoreLabel: 'ui.repeater.receivables.addMore',
    summarize: (item) => String(item.who ?? ''),
  },
  {
    id: 'vehicles.items',
    keyPrefix: 'vehicles.item',
    entryId: 'vehicles.item.type',
    afterId: 'collect.gate',
    addMoreLabel: 'ui.repeater.vehicles.addMore',
    summarize: (item) => [item.type, item.desc].filter(Boolean).join(' — ') as string,
  },
  {
    id: 'gadgets.items',
    keyPrefix: 'gadgets.item',
    entryId: 'gadgets.item.desc',
    afterId: 'gadgets.data',
    addMoreLabel: 'ui.repeater.gadgets.addMore',
    summarize: (item) => String(item.desc ?? ''),
  },
];

export const repeaterRegistry = buildRepeaterRegistry(repeaterDefs);
