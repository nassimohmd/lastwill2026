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
