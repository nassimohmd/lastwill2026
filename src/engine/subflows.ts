import type { Condition, NextRule, Question } from './types';

/**
 * Shared sub-flow factories (docs/03-question-flows.md §0). Each call
 * generates a small set of concrete, uniquely-id'ed question nodes for one
 * usage site (e.g. "who inherits this bank account"). The generic sub-question
 * wording ("Who?", "How should it be divided?"...) is authored once in the
 * locale files and reused by every instantiation; only the top-level
 * "who receives X" question text is supplied per call.
 *
 * SF-PERSON itself isn't a multi-node flow here: a single `person`-type
 * question renders the registry + "someone else" inline (see ui/PersonPicker),
 * so picking a person never needs more than one graph node.
 */

export interface PersonChainOpts {
  section: string;
  /** id prefix for this instantiation, e.g. "bank.account.beneficiary" */
  prefix: string;
  /** where every branch converges once the chain is done (may be ITEM_END) */
  afterNext: string;
}

/** The "who / if they don't survive you" portion shared by every beneficiary pick. */
export function makeBeneficiaryPersonChain(o: PersonChainOpts): Question[] {
  const p = o.prefix;
  return [
    {
      id: `${p}.person`,
      section: o.section,
      type: 'person',
      text: 'q.sf.beneficiary.person',
      next: `${p}.contingent.mode`,
    },
    {
      id: `${p}.people`,
      section: o.section,
      type: 'personMulti',
      text: 'q.sf.beneficiary.people',
      minPeople: 2,
      next: `${p}.shares`,
    },
    {
      id: `${p}.shares`,
      section: o.section,
      type: 'shares',
      text: 'q.sf.shares',
      peopleSource: `${p}.people`,
      next: `${p}.contingent.group_mode`,
    },
    {
      id: `${p}.contingent.mode`,
      section: o.section,
      type: 'single',
      text: 'q.sf.contingent.mode',
      options: [
        { id: 'children', label: 'q.sf.contingent.opt.children' },
        { id: 'someone_else', label: 'q.sf.contingent.opt.someone_else', next: `${p}.contingent.person` },
        { id: 'residuary', label: 'q.sf.contingent.opt.residuary' },
      ],
      next: o.afterNext,
    },
    {
      id: `${p}.contingent.person`,
      section: o.section,
      type: 'person',
      text: 'q.sf.contingent.person',
      next: o.afterNext,
    },
    {
      id: `${p}.contingent.group_mode`,
      section: o.section,
      type: 'single',
      text: 'q.sf.contingent.group_mode',
      options: [
        { id: 'children', label: 'q.sf.contingent.group.opt.children' },
        { id: 'others', label: 'q.sf.contingent.group.opt.others' },
        { id: 'residuary', label: 'q.sf.contingent.group.opt.residuary' },
      ],
      next: o.afterNext,
    },
  ];
}

export interface BeneficiarySubflowOpts extends PersonChainOpts {
  /** i18n key for "who should receive {asset}?" */
  questionText: string;
  when?: Condition;
  nextRules?: NextRule[];
}

/** Full SF-BENEFICIARY: the mode question plus the shared person chain. */
export function makeBeneficiarySubflow(o: BeneficiarySubflowOpts): Question[] {
  const p = o.prefix;
  const mode: Question = {
    id: `${p}.mode`,
    section: o.section,
    type: 'single',
    text: o.questionText,
    when: o.when,
    options: [
      { id: 'one', label: 'q.sf.beneficiary.opt.one', next: `${p}.person` },
      { id: 'several', label: 'q.sf.beneficiary.opt.several', next: `${p}.people` },
      { id: 'sell', label: 'q.sf.beneficiary.opt.sell' },
      { id: 'residuary', label: 'q.sf.beneficiary.opt.residuary' },
    ],
    next: o.afterNext,
  };
  return [mode, ...makeBeneficiaryPersonChain(o)];
}
