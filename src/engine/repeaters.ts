import type { Locale } from '../i18n';

/**
 * A "flow repeater" collects an array of items, where each item is filled in
 * through its own linear (possibly branching) question chain rather than a
 * flat field form (docs/01-architecture.md §4.3).
 *
 * There is no distinct "repeater" question node in the graph: entry happens
 * because some ordinary question's option (or default `next`) points at
 * `entryId`; the engine notices this and starts a session (see
 * state/store.tsx). Every question inside the item chain ends, on every
 * branch, at the sentinel `ITEM_END` — the engine intercepts that instead of
 * treating it as a real question id, snapshots the item, and shows a built-in
 * "add another?" screen.
 */
export const ITEM_END = '__ITEM_END__';

export function addMoreScreenId(repeaterId: string): string {
  return `${repeaterId}.__addmore__`;
}

export function repeaterIdFromAddMoreScreen(questionId: string): string | null {
  return questionId.endsWith('.__addmore__') ? questionId.slice(0, -'.__addmore__'.length) : null;
}

export interface FlowRepeaterDef {
  /** answer key the finished array is stored under, e.g. "bank.accounts" */
  id: string;
  /** item-scoped answer-key prefix, e.g. "bank.account" (no trailing dot) */
  keyPrefix: string;
  /** id of the first question of the item chain — this is how entry is detected */
  entryId: string;
  /** question id to continue to once the user says there are no more items */
  afterId: string;
  /** i18n key for the add-more screen heading, "{n}" substituted with the count so far */
  addMoreLabel: string;
  /** one-line summary of a completed item, for the add-more screen's list */
  summarize: (item: Record<string, unknown>, locale: Locale) => string;
}

export function buildRepeaterRegistry(defs: FlowRepeaterDef[]) {
  const byId = new Map(defs.map((d) => [d.id, d]));
  const byEntryId = new Map(defs.map((d) => [d.entryId, d]));
  return { byId, byEntryId };
}
