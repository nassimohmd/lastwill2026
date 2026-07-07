import type { ClauseBlock } from '../template/render';
import type { Condition } from '../engine/types';

// Phase 1 clause blocks: declaration + funeral wishes + closing formalities
// (docs/04-will-template.md, Parts 0–2, 5, 10–13).

const burialWhen: Condition = {
  or: [
    { eq: ['funeral.method', 'burial'] },
    { eq: ['funeral.body_donation.fallback', 'burial'] },
  ],
};

const cremationWhen: Condition = {
  or: [
    { eq: ['funeral.method', 'cremation'] },
    { eq: ['funeral.body_donation.fallback', 'cremation'] },
  ],
};

export const clauseBlocks: ClauseBlock[] = [
  { id: 'title', kind: 'title', text: 'clause.title' },

  {
    id: 'declaration',
    kind: 'plain',
    text: 'clause.declaration',
    fragments: {
      relation: [
        { when: { eq: ['personal.relation_line', 'son_of'] }, text: 'frag.decl.relation.son_of' },
        { when: { eq: ['personal.relation_line', 'daughter_of'] }, text: 'frag.decl.relation.daughter_of' },
        { when: { eq: ['personal.relation_line', 'wife_of'] }, text: 'frag.decl.relation.wife_of' },
        { when: { eq: ['personal.relation_line', 'husband_of'] }, text: 'frag.decl.relation.husband_of' },
      ],
      age: [{ when: { notEmpty: 'personal.dob' }, text: 'frag.decl.age' }],
      occupation: [{ when: { notEmpty: 'personal.occupation' }, text: 'frag.decl.occupation' }],
      residence: [{ when: { notEmpty: 'personal.address' }, text: 'frag.decl.residence' }],
      id: [
        {
          when: {
            and: [
              { notEmpty: 'personal.id_value' },
              { not: { eq: ['personal.id_type', 'none'] } },
            ],
          },
          text: 'frag.decl.id',
        },
      ],
    },
  },

  { id: 'soundmind', kind: 'clause', text: 'clause.soundmind' },
  { id: 'revocation', kind: 'clause', text: 'clause.revocation' },

  {
    id: 'family',
    kind: 'clause',
    text: 'clause.family',
    when: {
      or: [
        { notEmpty: 'personal.spouse_name' },
        { in: ['personal.relation_line', ['wife_of', 'husband_of']] },
        { notEmpty: 'personal.children' },
      ],
    },
  },

  {
    id: 'executor.physical',
    kind: 'clause',
    text: 'clause.executor.physical',
    when: { notEmpty: 'executors.physical.primary' },
    fragments: {
      secondary: [{ when: { notEmpty: 'executors.physical.secondary' }, text: 'frag.executor.physical.secondary' }],
    },
  },
  {
    id: 'executor.digital',
    kind: 'clause',
    text: 'clause.executor.digital',
    when: {
      and: [{ eq: ['executors.digital.same', 'other'] }, { notEmpty: 'executors.digital.primary' }],
    },
    fragments: {
      secondary: [{ when: { notEmpty: 'executors.digital.secondary' }, text: 'frag.executor.digital.secondary' }],
    },
  },
  {
    id: 'executor.powers',
    kind: 'clause',
    text: 'clause.executor.powers',
    when: { notEmpty: 'executors.physical.primary' },
    fragments: {
      notes: [
        {
          when: { and: [{ eq: ['executors.powers', 'notes'] }, { notEmpty: 'executors.powers_notes' }] },
          text: 'frag.executor.powers.notes',
        },
      ],
    },
  },
  {
    id: 'executor.compensation',
    kind: 'clause',
    text: 'clause.executor.compensation',
    when: { notEmpty: 'executors.compensation' },
    fragments: {
      comp: [
        { when: { eq: ['executors.compensation', 'none'] }, text: 'clause.executor.compensation.none' },
        {
          when: { and: [{ eq: ['executors.compensation', 'fixed'] }, { notEmpty: 'executors.compensation_amount' }] },
          text: 'clause.executor.compensation.fixed',
        },
        { text: 'clause.executor.compensation.reasonable' },
      ],
    },
  },

  { id: 'debts.first', kind: 'clause', text: 'clause.debts.first' },

  {
    id: 'debts.item',
    kind: 'clause',
    text: 'clause.debts.item',
    each: 'debts.items',
    itemKeyPrefix: 'debts.item',
    fragments: {
      amount: [
        { when: { notEmpty: 'item.amount' }, text: 'frag.debts.amount.known' },
        { text: 'frag.debts.amount.unknown' },
      ],
      insured: [{ when: { eq: ['item.insured', 'yes'] }, text: 'frag.debts.insured' }],
      strategy: [
        { when: { eq: ['item.secured_strategy', 'sell_asset'] }, text: 'frag.debts.strategy.sell_asset' },
        { when: { eq: ['item.secured_strategy', 'keep_asset'] }, text: 'frag.debts.strategy.keep_asset' },
      ],
    },
  },

  {
    id: 'part.wishes',
    kind: 'heading',
    text: 'part.wishes',
    when: { notEmpty: 'funeral.method' },
  },

  {
    id: 'funeral.donation',
    kind: 'clause',
    text: 'clause.funeral.donation',
    when: { eq: ['funeral.method', 'donate_science'] },
    fragments: {
      institution: [
        { when: { notEmpty: 'funeral.body_donation.institution_name' }, text: 'frag.donation.institution.named' },
        { text: 'frag.donation.institution.executor' },
      ],
      fallback: [
        { when: { eq: ['funeral.body_donation.fallback', 'burial'] }, text: 'frag.donation.fallback.burial' },
        { when: { eq: ['funeral.body_donation.fallback', 'cremation'] }, text: 'frag.donation.fallback.cremation' },
        { text: 'frag.donation.fallback.family' },
      ],
    },
  },

  {
    id: 'funeral.burial',
    kind: 'clause',
    text: 'clause.funeral.burial',
    when: burialWhen,
    fragments: {
      place: [
        {
          when: { and: [{ eq: ['funeral.burial.place', 'family_ground'] }, { notEmpty: 'funeral.burial.place_detail' }] },
          text: 'frag.burial.place.family_ground_at',
        },
        { when: { eq: ['funeral.burial.place', 'family_ground'] }, text: 'frag.burial.place.family_ground' },
        {
          when: { and: [{ eq: ['funeral.burial.place', 'mosque'] }, { notEmpty: 'funeral.burial.place_detail' }] },
          text: 'frag.burial.place.mosque_at',
        },
        { when: { eq: ['funeral.burial.place', 'mosque'] }, text: 'frag.burial.place.mosque' },
        {
          when: { and: [{ eq: ['funeral.burial.place', 'church'] }, { notEmpty: 'funeral.burial.place_detail' }] },
          text: 'frag.burial.place.church_at',
        },
        { when: { eq: ['funeral.burial.place', 'church'] }, text: 'frag.burial.place.church' },
        { when: { eq: ['funeral.burial.place', 'public'] }, text: 'frag.burial.place.public' },
        {
          when: { and: [{ eq: ['funeral.burial.place', 'specific'] }, { notEmpty: 'funeral.burial.place_detail' }] },
          text: 'frag.burial.place.specific',
        },
        { text: 'frag.burial.place.practical' },
      ],
      rites: [
        { when: { eq: ['funeral.burial.rites', 'customs'] }, text: 'frag.burial.rites.customs' },
        { when: { eq: ['funeral.burial.rites', 'simple'] }, text: 'frag.burial.rites.simple' },
        {
          when: { and: [{ eq: ['funeral.burial.rites', 'custom'] }, { notEmpty: 'funeral.burial.rites_custom' }] },
          text: 'frag.burial.rites.custom',
        },
      ],
    },
  },

  {
    id: 'funeral.cremation',
    kind: 'clause',
    text: 'clause.funeral.cremation',
    when: cremationWhen,
    fragments: {
      place: [
        {
          when: { and: [{ eq: ['funeral.cremation.place', 'specific'] }, { notEmpty: 'funeral.cremation.place_detail' }] },
          text: 'frag.crem.place.specific_at',
        },
        { when: { eq: ['funeral.cremation.place', 'practical'] }, text: 'frag.crem.place.practical' },
        { text: 'frag.crem.place.local' },
      ],
      rites: [
        { when: { eq: ['funeral.cremation.rites', 'customs'] }, text: 'frag.crem.rites.customs' },
        { when: { eq: ['funeral.cremation.rites', 'simple'] }, text: 'frag.crem.rites.simple' },
        {
          when: { and: [{ eq: ['funeral.cremation.rites', 'custom'] }, { notEmpty: 'funeral.cremation.rites_custom' }] },
          text: 'frag.crem.rites.custom',
        },
      ],
      ashes: [
        {
          when: { and: [{ eq: ['funeral.cremation.ashes', 'immerse'] }, { notEmpty: 'funeral.cremation.ashes_place' }] },
          text: 'frag.crem.ashes.immerse_at',
        },
        { when: { eq: ['funeral.cremation.ashes', 'immerse'] }, text: 'frag.crem.ashes.immerse' },
        {
          when: { and: [{ eq: ['funeral.cremation.ashes', 'scatter'] }, { notEmpty: 'funeral.cremation.ashes_place' }] },
          text: 'frag.crem.ashes.scatter_at',
        },
        { when: { eq: ['funeral.cremation.ashes', 'scatter'] }, text: 'frag.crem.ashes.scatter' },
        { when: { eq: ['funeral.cremation.ashes', 'kept'] }, text: 'frag.crem.ashes.kept' },
      ],
    },
  },

  {
    id: 'funeral.family_decides',
    kind: 'clause',
    text: 'clause.funeral.family_decides',
    when: { eq: ['funeral.method', 'family_decides'] },
  },

  {
    id: 'funeral.memorial',
    kind: 'clause',
    text: 'clause.funeral.memorial',
    when: { notEmpty: 'funeral.memorial' },
    fragments: {
      memorial: [
        { when: { eq: ['funeral.memorial', 'customs'] }, text: 'frag.memorial.customs' },
        { when: { eq: ['funeral.memorial', 'simple'] }, text: 'frag.memorial.simple' },
        { when: { eq: ['funeral.memorial', 'none'] }, text: 'frag.memorial.none' },
        { text: 'frag.memorial.family' },
      ],
    },
  },

  {
    id: 'funeral.cost',
    kind: 'clause',
    text: 'clause.funeral.cost',
    when: {
      or: [
        { in: ['funeral.cost', ['modest', 'customary']] },
        { and: [{ eq: ['funeral.cost', 'limit'] }, { notEmpty: 'funeral.cost_amount' }] },
      ],
    },
    fragments: {
      cost: [
        { when: { eq: ['funeral.cost', 'modest'] }, text: 'frag.cost.modest' },
        { when: { eq: ['funeral.cost', 'limit'] }, text: 'frag.cost.limit' },
        { text: 'frag.cost.customary' },
      ],
    },
  },

  {
    id: 'funeral.notes',
    kind: 'clause',
    text: 'clause.funeral.notes',
    when: { notEmpty: 'funeral.notes' },
  },

  {
    id: 'organ',
    kind: 'clause',
    text: 'clause.organ',
    when: { notEmpty: 'organ.gate' },
    fragments: {
      wish: [
        { when: { eq: ['organ.gate', 'yes_any'] }, text: 'frag.organ.yes_any' },
        { when: { eq: ['organ.gate', 'yes_specific'] }, text: 'frag.organ.yes_specific' },
        { when: { eq: ['organ.gate', 'no'] }, text: 'frag.organ.no' },
        { when: { eq: ['organ.gate', 'family_decides'] }, text: 'frag.organ.family_decides' },
      ],
      registered: [
        {
          when: { and: [{ eq: ['organ.registered', 'yes'] }, { notEmpty: 'organ.registered_details' }] },
          text: 'frag.organ.registered.yes_details',
        },
        { when: { eq: ['organ.registered', 'yes'] }, text: 'frag.organ.registered.yes' },
        { when: { eq: ['organ.registered', 'no'] }, text: 'frag.organ.registered.no' },
      ],
    },
  },

  {
    id: 'guardianship.minors',
    kind: 'clause',
    text: 'clause.guardianship.minors',
    when: { notEmpty: 'guardianship.primary' },
    fragments: {
      alt: [{ when: { notEmpty: 'guardianship.alternate' }, text: 'frag.guardianship.alt' }],
    },
  },
  {
    id: 'guardianship.property',
    kind: 'clause',
    text: 'clause.guardianship.property',
    when: { notEmpty: 'guardianship.until_age' },
    fragments: {
      who: [
        { when: { eq: ['guardianship.property_guardian', 'different'] }, text: 'frag.guardianship.property.different' },
        { text: 'frag.guardianship.property.same' },
      ],
    },
  },
  {
    id: 'guardianship.upbringing',
    kind: 'clause',
    text: 'clause.guardianship.upbringing',
    when: { notEmpty: 'guardianship.upbringing' },
  },
  {
    id: 'guardianship.provision',
    kind: 'clause',
    text: 'clause.guardianship.provision',
    when: { and: [{ eq: ['guardianship.provision', 'amount'] }, { notEmpty: 'guardianship.provision_amount' }] },
    fragments: {
      source: [
        { when: { eq: ['guardianship.provision_source', 'bank'] }, text: 'frag.guardianship.source.bank' },
        {
          when: { and: [{ eq: ['guardianship.provision_source', 'asset_sale'] }, { notEmpty: 'guardianship.provision_source_desc' }] },
          text: 'frag.guardianship.source.asset_named',
        },
        { when: { eq: ['guardianship.provision_source', 'asset_sale'] }, text: 'frag.guardianship.source.asset' },
        { text: 'frag.guardianship.source.executor' },
      ],
    },
  },
  {
    id: 'guardianship.dependent',
    kind: 'clause',
    text: 'clause.guardianship.dependent',
    each: 'guardianship.dependents',
    itemKeyPrefix: 'guardianship.dependents.item',
    fragments: {
      provision: [{ when: { eq: ['item.provision', 'yes'] }, text: 'frag.guardianship.dependent.provision' }],
      instructions: [{ when: { notEmpty: 'item.instructions' }, text: 'frag.guardianship.dependent.instructions' }],
    },
  },

  {
    id: 'realestate.item',
    kind: 'clause',
    text: 'clause.realestate.item',
    each: 'realestate.items',
    itemKeyPrefix: 'realestate.item',
    fragments: {
      ownership: [
        { when: { eq: ['item.ownership', 'sole'] }, text: 'frag.re.ownership.sole' },
        { text: 'frag.re.ownership.share' },
      ],
      action: [
        { when: { eq: ['item.action', 'one'] }, text: 'frag.re.action.one' },
        { when: { eq: ['item.action', 'divide'] }, text: 'frag.re.action.divide' },
        { when: { eq: ['item.action', 'life_interest'] }, text: 'frag.re.action.life' },
        { when: { eq: ['item.action', 'sell'] }, text: 'frag.re.action.sell' },
        { text: 'frag.re.action.residuary' },
      ],
      rented: [
        { when: { eq: ['item.rented.instructions', 'continue_tenancy'] }, text: 'frag.re.rented.continue_tenancy' },
        { when: { eq: ['item.rented.instructions', 'new_owner_decides'] }, text: 'frag.re.rented.new_owner_decides' },
        {
          when: { and: [{ eq: ['item.rented.instructions', 'custom'] }, { notEmpty: 'item.rented.instructions_text' }] },
          text: 'frag.re.rented.custom',
        },
      ],
      loan: [{ when: { eq: ['item.loan', 'yes'] }, text: 'frag.re.loan' }],
    },
  },

  {
    id: 'bank.all',
    kind: 'clause',
    text: 'clause.bank.all',
    when: { eq: ['bank.mode', 'all'] },
    fragments: {
      tail: [
        { when: { eq: ['bank.all.mode', 'one'] }, text: 'frag.bank.all.tail.one' },
        { when: { eq: ['bank.all.mode', 'several'] }, text: 'frag.bank.all.tail.several' },
        { when: { eq: ['bank.all.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
    },
  },
  {
    id: 'bank.account',
    kind: 'clause',
    text: 'clause.bank.account',
    each: 'bank.accounts',
    itemKeyPrefix: 'bank.account',
    fragments: {
      branch: [{ when: { notEmpty: 'item.branch' }, text: 'frag.bank.account.branch' }],
      last4: [{ when: { notEmpty: 'item.last4' }, text: 'frag.bank.account.last4' }],
      joint: [{ when: { eq: ['item.type', 'joint'] }, text: 'frag.bank.account.joint' }],
      tail: [
        { when: { eq: ['item.beneficiary.mode', 'one'] }, text: 'frag.bank.account.tail.one' },
        { when: { eq: ['item.beneficiary.mode', 'several'] }, text: 'frag.bank.account.tail.several' },
        { when: { eq: ['item.beneficiary.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
    },
  },
  {
    id: 'bank.locker',
    kind: 'clause',
    text: 'clause.bank.locker',
    when: { notEmpty: 'bank.locker.bank' },
    fragments: {
      tail: [
        { when: { eq: ['bank.locker.beneficiary.mode', 'one'] }, text: 'frag.bank.locker.tail.one' },
        { when: { eq: ['bank.locker.beneficiary.mode', 'several'] }, text: 'frag.bank.locker.tail.several' },
        { when: { eq: ['bank.locker.beneficiary.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
    },
  },
  {
    id: 'bank.cash',
    kind: 'clause',
    text: 'clause.bank.cash',
    when: { eq: ['bank.cash.gate', 'yes'] },
    fragments: {
      tail: [
        { when: { eq: ['bank.cash.beneficiary.mode', 'one'] }, text: 'frag.bank.cash.tail.one' },
        { when: { eq: ['bank.cash.beneficiary.mode', 'several'] }, text: 'frag.bank.cash.tail.several' },
        { when: { eq: ['bank.cash.beneficiary.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
    },
  },

  {
    id: 'invest.item',
    kind: 'clause',
    text: 'clause.invest.item',
    each: 'invest.items',
    itemKeyPrefix: 'invest.item',
    fragments: {
      tail: [
        { when: { eq: ['item.type', 'insurance'] }, text: 'frag.invest.insurance' },
        { when: { eq: ['item.beneficiary.mode', 'one'] }, text: 'frag.invest.tail.one' },
        { when: { eq: ['item.beneficiary.mode', 'several'] }, text: 'frag.invest.tail.several' },
        { when: { eq: ['item.beneficiary.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
    },
  },

  {
    id: 'receivables.item',
    kind: 'clause',
    text: 'clause.receivables.item',
    each: 'receivables.items',
    itemKeyPrefix: 'receivables.item',
    fragments: {
      action: [
        { when: { eq: ['item.action', 'collect_person'] }, text: 'clause.receivables.collect_person' },
        { when: { eq: ['item.action', 'forgive'] }, text: 'clause.receivables.forgive' },
        { text: 'clause.receivables.collect_estate' },
      ],
    },
  },

  {
    id: 'vehicles.item',
    kind: 'clause',
    text: 'clause.vehicles.item',
    each: 'vehicles.items',
    itemKeyPrefix: 'vehicles.item',
    fragments: {
      action: [
        { when: { eq: ['item.action', 'person'] }, text: 'frag.vehicles.action.person' },
        { when: { eq: ['item.action', 'sell'] }, text: 'frag.tail.sell' },
        { when: { eq: ['item.action', 'family_decides'] }, text: 'frag.vehicles.action.family_decides' },
      ],
      loan: [{ when: { eq: ['item.loan', 'yes'] }, text: 'frag.vehicles.loan' }],
    },
  },

  {
    id: 'collect',
    kind: 'clause',
    text: 'clause.collect',
    when: { notEmpty: 'collect.beneficiary.mode' },
    fragments: {
      tail: [
        { when: { eq: ['collect.beneficiary.mode', 'one'] }, text: 'frag.collect.tail.one' },
        { when: { eq: ['collect.beneficiary.mode', 'several'] }, text: 'frag.collect.tail.several' },
        { when: { eq: ['collect.beneficiary.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
    },
  },

  {
    id: 'jewellery',
    kind: 'clause',
    text: 'clause.jewellery',
    when: { notEmpty: 'jewellery.beneficiary.mode' },
    fragments: {
      tail: [
        { when: { eq: ['jewellery.beneficiary.mode', 'one'] }, text: 'frag.jewellery.tail.one' },
        { when: { eq: ['jewellery.beneficiary.mode', 'several'] }, text: 'frag.jewellery.tail.several' },
        { when: { eq: ['jewellery.beneficiary.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
    },
  },
  {
    id: 'jewellery.streedhan',
    kind: 'clause',
    text: 'clause.jewellery.streedhan',
    when: {
      and: [
        { notEmpty: 'jewellery.beneficiary.mode' },
        {
          or: [
            { in: ['personal.relation_line', ['wife_of', 'husband_of']] },
            { notEmpty: 'personal.spouse_name' },
          ],
        },
      ],
    },
  },

  {
    id: 'ip',
    kind: 'clause',
    text: 'clause.ip',
    when: { notEmpty: 'ip.beneficiary.mode' },
    fragments: {
      tail: [
        { when: { eq: ['ip.beneficiary.mode', 'one'] }, text: 'frag.ip.tail.one' },
        { when: { eq: ['ip.beneficiary.mode', 'several'] }, text: 'frag.ip.tail.several' },
        { when: { eq: ['ip.beneficiary.mode', 'sell'] }, text: 'frag.tail.sell' },
        { text: 'frag.tail.residuary' },
      ],
      wishes: [{ when: { notEmpty: 'ip.wishes' }, text: 'frag.ip.wishes' }],
    },
  },

  {
    id: 'diaries.action',
    kind: 'clause',
    text: 'clause.diaries.action',
    when: { notEmpty: 'diaries.action' },
    fragments: {
      action: [
        { when: { eq: ['diaries.action', 'give_to_person'] }, text: 'frag.diaries.give_to_person' },
        { when: { eq: ['diaries.action', 'destroy'] }, text: 'frag.diaries.destroy' },
        { when: { eq: ['diaries.action', 'read_first'] }, text: 'frag.diaries.read_first' },
        { when: { eq: ['diaries.action', 'keep_with_family'] }, text: 'frag.diaries.keep_with_family' },
        { when: { eq: ['diaries.action', 'family_decides'] }, text: 'frag.diaries.family_decides' },
      ],
    },
  },
  {
    id: 'diaries.notes',
    kind: 'clause',
    text: 'clause.diaries.notes',
    when: { notEmpty: 'diaries.notes' },
  },

  {
    id: 'gadgets.action',
    kind: 'clause',
    text: 'clause.gadgets.action',
    when: { in: ['gadgets.gate', ['wipe_give_family', 'sell', 'recycle', 'family_decides']] },
    fragments: {
      action: [
        { when: { eq: ['gadgets.gate', 'wipe_give_family'] }, text: 'frag.gadgets.wipe_give_family' },
        { when: { eq: ['gadgets.gate', 'sell'] }, text: 'frag.gadgets.sell' },
        { when: { eq: ['gadgets.gate', 'recycle'] }, text: 'frag.gadgets.recycle' },
        { text: 'frag.gadgets.family_decides' },
      ],
    },
  },
  {
    id: 'gadgets.item',
    kind: 'clause',
    text: 'clause.gadgets.item',
    each: 'gadgets.items',
    itemKeyPrefix: 'gadgets.item',
  },
  {
    id: 'gadgets.data',
    kind: 'clause',
    text: 'clause.gadgets.data',
    when: { notEmpty: 'gadgets.data' },
    fragments: {
      data: [
        { when: { eq: ['gadgets.data', 'backup_then_wipe'] }, text: 'frag.gadgets.data.backup_then_wipe' },
        { when: { eq: ['gadgets.data', 'wipe_no_backup'] }, text: 'frag.gadgets.data.wipe_no_backup' },
        { when: { eq: ['gadgets.data', 'handed_as_is'] }, text: 'frag.gadgets.data.handed_as_is' },
      ],
    },
  },

  {
    id: 'part.digital',
    kind: 'heading',
    text: 'part.digital',
    when: { eq: ['digital.gate', 'yes'] },
  },
  { id: 'digital.intro', kind: 'clause', text: 'clause.digital.intro', when: { eq: ['digital.gate', 'yes'] } },
  {
    id: 'digital.subs',
    kind: 'clause',
    text: 'clause.digital.subs',
    when: { eq: ['digital.gate', 'yes'] },
    fragments: {
      subs: [
        {
          when: { and: [{ eq: ['digital.subs', 'cancel_with_exceptions'] }, { notEmpty: 'digital.subs.exceptions' }] },
          text: 'frag.digital.subs.exceptions',
        },
        { when: { eq: ['digital.subs', 'family_decides'] }, text: 'frag.digital.subs.family_decides' },
        { text: 'frag.digital.subs.cancel_all' },
      ],
    },
  },
  {
    id: 'digital.statements',
    kind: 'clause',
    text: 'clause.digital.statements',
    when: { in: ['digital.statements', ['full_consent', 'narrow_consent']] },
    fragments: {
      statements: [
        { when: { eq: ['digital.statements', 'full_consent'] }, text: 'frag.digital.statements.full_consent' },
        { text: 'frag.digital.statements.narrow_consent' },
      ],
    },
  },
  {
    id: 'digital.social',
    kind: 'clause',
    text: 'clause.digital.social',
    when: { and: [{ eq: ['digital.gate', 'yes'] }, { notEmpty: 'digital.social' }] },
    fragments: {
      social: [
        { when: { eq: ['digital.social', 'delete_all'] }, text: 'frag.digital.social.delete_all' },
        { when: { eq: ['digital.social', 'memorialise'] }, text: 'frag.digital.social.memorialise' },
        { when: { eq: ['digital.social', 'archive_then_delete'] }, text: 'frag.digital.social.archive_then_delete' },
        { when: { eq: ['digital.social', 'leave_as_is'] }, text: 'frag.digital.social.leave_as_is' },
        {
          when: { and: [{ eq: ['digital.social', 'per_platform'] }, { notEmpty: 'digital.social.notes' }] },
          text: 'frag.digital.social.per_platform',
        },
      ],
    },
  },
  {
    id: 'digital.email',
    kind: 'clause',
    text: 'clause.digital.email',
    when: { and: [{ eq: ['digital.gate', 'yes'] }, { notEmpty: 'digital.email' }] },
    fragments: {
      email: [
        { when: { eq: ['digital.email', 'keep_briefly'] }, text: 'frag.digital.email.keep_briefly' },
        { when: { eq: ['digital.email', 'delete'] }, text: 'frag.digital.email.delete' },
        { when: { eq: ['digital.email', 'hand_over'] }, text: 'frag.digital.email.hand_over' },
        { text: 'frag.digital.email.leave_as_is' },
      ],
    },
  },
  {
    id: 'digital.storage',
    kind: 'clause',
    text: 'clause.digital.storage',
    when: { and: [{ eq: ['digital.gate', 'yes'] }, { notEmpty: 'digital.storage' }] },
    fragments: {
      storage: [
        { when: { eq: ['digital.storage', 'trusted_review'] }, text: 'frag.digital.storage.trusted_review' },
        { when: { eq: ['digital.storage', 'copy_for_family'] }, text: 'frag.digital.storage.copy_for_family' },
        { when: { eq: ['digital.storage', 'delete_all'] }, text: 'frag.digital.storage.delete_all' },
        { text: 'frag.digital.storage.family_decides' },
      ],
    },
  },
  {
    id: 'digital.photos',
    kind: 'clause',
    text: 'clause.digital.photos',
    when: { and: [{ eq: ['digital.gate', 'yes'] }, { notEmpty: 'digital.photos' }] },
    fragments: {
      photos: [
        { when: { eq: ['digital.photos', 'share_with_family'] }, text: 'frag.digital.photos.share_with_family' },
        { when: { eq: ['digital.photos', 'one_person'] }, text: 'frag.digital.photos.one_person' },
        { when: { eq: ['digital.photos', 'review_first'] }, text: 'frag.digital.photos.review_first' },
        { when: { eq: ['digital.photos', 'delete_all'] }, text: 'frag.digital.photos.delete_all' },
        { text: 'frag.digital.photos.family_decides' },
      ],
    },
  },
  {
    id: 'digital.backup',
    kind: 'clause',
    text: 'clause.digital.backup',
    when: { and: [{ eq: ['digital.gate', 'yes'] }, { notEmpty: 'digital.backup' }, { notEmpty: 'digital.backup.recipient' }] },
  },
  {
    id: 'digital.access',
    kind: 'clause',
    text: 'clause.digital.access',
    when: { and: [{ eq: ['digital.gate', 'yes'] }, { notEmpty: 'digital.access' }] },
    fragments: {
      access: [
        { when: { eq: ['digital.access', 'sealed_envelope'] }, text: 'frag.digital.access.sealed_envelope' },
        { when: { eq: ['digital.access', 'password_manager'] }, text: 'frag.digital.access.password_manager' },
        { when: { eq: ['digital.access', 'trusted_person'] }, text: 'frag.digital.access.trusted_person' },
        { text: 'frag.digital.access.not_set' },
      ],
    },
  },
  {
    id: 'digital.access.footer',
    kind: 'clause',
    text: 'clause.digital.access.footer',
    when: { eq: ['digital.gate', 'yes'] },
  },

  {
    id: 'residuary',
    kind: 'clause',
    text: 'clause.residuary',
    when: { notEmpty: 'residuary.primary' },
    fragments: {
      primary: [
        { when: { eq: ['residuary.primary', 'spouse'] }, text: 'frag.residuary.primary.spouse' },
        { when: { eq: ['residuary.primary', 'children'] }, text: 'frag.residuary.primary.children' },
        { when: { eq: ['residuary.primary', 'spouse_children'] }, text: 'frag.residuary.primary.spouse_children' },
        { when: { eq: ['residuary.primary', 'one_person'] }, text: 'frag.residuary.primary.one_person' },
        { when: { eq: ['residuary.primary', 'several_people'] }, text: 'frag.residuary.primary.several_people' },
        { when: { eq: ['residuary.primary', 'charity'] }, text: 'frag.residuary.primary.charity' },
      ],
      contingent: [
        { when: { eq: ['residuary.contingent', 'alt_person'] }, text: 'frag.residuary.contingent.alt_person' },
        { when: { eq: ['residuary.contingent', 'alt_charity'] }, text: 'frag.residuary.contingent.alt_charity' },
        { text: 'frag.residuary.contingent.legal_heirs' },
      ],
    },
  },

  {
    id: 'muslim',
    kind: 'clause',
    text: 'clause.muslim',
    when: { eq: ['personal.religion', 'muslim'] },
  },

  { id: 'general.single', kind: 'clause', text: 'clause.general.single' },

  { id: 'testimonium', kind: 'plain', text: 'clause.testimonium' },
  { id: 'attestation', kind: 'plain', text: 'clause.attestation' },
];
