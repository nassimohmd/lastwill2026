import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppState, Person } from '../engine/types';
import { graph } from '../data/graph';
import { loadDraft, saveDraft, clearDraft } from './persistence';
import { ITEM_END, addMoreScreenId } from '../engine/repeaters';
import { repeaterRegistry } from '../data/repeaters';

export type Action =
  | { type: 'ANSWER'; qid: string; value: unknown; optionId?: string }
  | { type: 'SKIP'; qid: string }
  | { type: 'ANSWER_PERSON'; qid: string; personId: string; newPerson?: Person }
  | { type: 'ANSWER_PEOPLE'; qid: string; personIds: string[]; newPeople?: Person[] }
  | { type: 'REPEATER_ADD_ANOTHER'; repeaterId: string }
  | { type: 'REPEATER_FINISH'; repeaterId: string }
  | { type: 'BACK' }
  | { type: 'GOTO'; qid: string }
  | { type: 'START' }
  | { type: 'RESET' };

export function initialState(): AppState {
  const now = new Date().toISOString();
  return {
    meta: { schemaVersion: 1, locale: 'en', createdAt: now, updatedAt: now },
    people: [],
    answers: {},
    skipped: [],
    currentQuestionId: null,
    history: [],
    sectionStatus: {},
    repeaterSession: null,
    repeaterItems: {},
  };
}

function computeAgeYears(dob: string): number | null {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/** Derived answer keys, recomputed on every change (never asked directly). */
const DERIVED_KEYS = ['personal.age', 'personal.underage'];

function applyDerived(answers: Record<string, unknown>): Record<string, unknown> {
  const out = { ...answers };
  for (const k of DERIVED_KEYS) delete out[k];
  const dob = out['personal.dob'];
  if (typeof dob === 'string' && dob) {
    const age = computeAgeYears(dob);
    if (age !== null) {
      out['personal.age'] = age;
      out['personal.underage'] = age < 18;
    }
  }
  return out;
}

/**
 * Rebuild the "derived" people (spouse + children, ids "spouse"/"child-N")
 * from Section 1 answers, idempotently. Ad-hoc people added elsewhere (ids
 * "p-...", via SF-PERSON "someone else") are a real, append-only registry —
 * they are left untouched here.
 */
function deriveFamily(answers: Record<string, unknown>): Person[] {
  const people: Person[] = [];
  const relLine = answers['personal.relation_line'];
  const relName = answers['personal.relation_name'];
  if (relLine === 'wife_of' && typeof relName === 'string' && relName.trim()) {
    people.push({ id: 'spouse', name: relName.trim(), relation: 'husband' });
  } else if (relLine === 'husband_of' && typeof relName === 'string' && relName.trim()) {
    people.push({ id: 'spouse', name: relName.trim(), relation: 'wife' });
  } else {
    const spouseName = answers['personal.spouse_name'];
    if (typeof spouseName === 'string' && spouseName.trim()) {
      people.push({ id: 'spouse', name: spouseName.trim(), relation: 'spouse' });
    }
  }
  const children = answers['personal.children'];
  if (Array.isArray(children)) {
    children.forEach((c, i) => {
      if (c && typeof c === 'object' && typeof (c as Record<string, unknown>).name === 'string') {
        const item = c as Record<string, unknown>;
        people.push({
          id: `child-${i}`,
          name: (item.name as string).trim(),
          relation: item.gender === 'daughter' ? 'daughter' : 'son',
          minor: item.minor === 'yes',
        });
      }
    });
  }
  return people;
}

function syncPeople(answers: Record<string, unknown>, existing: Person[]): Person[] {
  const adhoc = existing.filter((p) => !/^(spouse|child-\d+)$/.test(p.id));
  return [...deriveFamily(answers), ...adhoc];
}

function upsertPerson(people: Person[], person: Person): Person[] {
  if (people.some((p) => p.id === person.id)) return people;
  return [...people, person];
}

/**
 * Walk the graph from the start along the answered/skipped path, to find
 * which answers are still "live" (on the path implied by the current
 * answers) versus stale leftovers from a branch the user has since changed.
 * Finished repeaters are treated as a single opaque, atomic step — their
 * per-item scratch keys are already gone from `answers` by the time they're
 * finished, so there is nothing to replay inside them.
 */
function reachableAnswered(state: AppState): Set<string> {
  const visited = new Set<string>();
  let current: string | null = graph.firstVisible(graph.firstQuestionId(), state);
  while (current && !visited.has(current)) {
    const def = repeaterRegistry.byEntryId.get(current);
    if (def) {
      if (state.answers[def.id] !== undefined) {
        visited.add(def.id);
        current = graph.firstVisible(def.afterId, state);
        continue;
      }
      // repeater not finished yet — its item keys are still live top-level
      // answers, so fall through and replay them like any other question.
    }
    const answered = state.answers[current] !== undefined;
    const skipped = state.skipped.includes(current);
    if (!answered && !skipped) break; // frontier — nothing beyond is settled
    visited.add(current);
    const q = graph.get(current);
    const chosenOptionId =
      q.type === 'single' && typeof state.answers[current] === 'string'
        ? (state.answers[current] as string)
        : undefined;
    const raw = graph.resolveNext(current, state, { chosenOptionId, skip: skipped && !answered });
    if (raw === ITEM_END) break; // mid-item — nothing beyond has happened yet
    current = raw;
  }
  return visited;
}

function purgeUnreachable(state: AppState): AppState {
  const reachable = reachableAnswered(state);
  const answers: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state.answers)) {
    if (reachable.has(k) || DERIVED_KEYS.includes(k)) answers[k] = v;
  }
  const skipped = state.skipped.filter((id) => reachable.has(id));
  const next = { ...state, answers: applyDerived(answers), skipped };
  return { ...next, people: syncPeople(next.answers, state.people) };
}

/** Snapshot the current repeater item into `repeaterItems`, clear its scratch
 *  keys from `answers`, and hand control to the built-in add-more screen. */
function finishItem(state: AppState): AppState {
  const repeaterId = state.repeaterSession!.repeaterId;
  const def = repeaterRegistry.byId.get(repeaterId)!;
  const prefix = def.keyPrefix + '.';
  const item: Record<string, unknown> = {};
  const answers = { ...state.answers };
  for (const k of Object.keys(answers)) {
    if (k.startsWith(prefix)) {
      item[k.slice(prefix.length)] = answers[k];
      delete answers[k];
    }
  }
  const skipped = state.skipped.filter((k) => !k.startsWith(prefix));
  const items = [...(state.repeaterItems[repeaterId] ?? []), item];
  return {
    ...state,
    answers,
    skipped,
    repeaterItems: { ...state.repeaterItems, [repeaterId]: items },
    currentQuestionId: addMoreScreenId(repeaterId),
  };
}

/** Resolve what happens after an answer/skip: repeater entry, repeater exit
 *  (ITEM_END), or an ordinary question — folding all three into one state. */
function routeAfter(state: AppState, rawNext: string | null): AppState {
  if (rawNext === ITEM_END) return finishItem(state);
  if (rawNext) {
    const def = repeaterRegistry.byEntryId.get(rawNext);
    if (def && state.repeaterSession?.repeaterId !== def.id) {
      return {
        ...state,
        currentQuestionId: rawNext,
        repeaterSession: { repeaterId: def.id },
        repeaterItems: { ...state.repeaterItems, [def.id]: [] },
      };
    }
  }
  return { ...state, currentQuestionId: rawNext };
}

export function reducer(state: AppState, action: Action): AppState {
  const touch = (s: AppState): AppState => ({
    ...s,
    meta: { ...s.meta, updatedAt: new Date().toISOString() },
  });

  switch (action.type) {
    case 'START': {
      const current = graph.firstVisible(graph.firstQuestionId(), state);
      return touch({ ...state, currentQuestionId: current, history: [] });
    }

    case 'ANSWER': {
      const answers = applyDerived({ ...state.answers, [action.qid]: action.value });
      let next: AppState = {
        ...state,
        answers,
        skipped: state.skipped.filter((id) => id !== action.qid),
      };
      next = purgeUnreachable(next);
      const raw = graph.resolveNext(action.qid, next, { chosenOptionId: action.optionId });
      next = routeAfter(next, raw);
      return touch({ ...next, history: [...state.history, action.qid] });
    }

    case 'SKIP': {
      const answers = { ...state.answers };
      delete answers[action.qid];
      let next: AppState = {
        ...state,
        answers: applyDerived(answers),
        skipped: state.skipped.includes(action.qid) ? state.skipped : [...state.skipped, action.qid],
      };
      next = purgeUnreachable(next);
      const raw = graph.resolveNext(action.qid, next, { skip: true });
      next = routeAfter(next, raw);
      return touch({ ...next, history: [...state.history, action.qid] });
    }

    case 'ANSWER_PERSON': {
      let people = state.people;
      if (action.newPerson) people = upsertPerson(people, action.newPerson);
      const answers = applyDerived({ ...state.answers, [action.qid]: action.personId });
      let next: AppState = {
        ...state,
        people,
        answers,
        skipped: state.skipped.filter((id) => id !== action.qid),
      };
      next = purgeUnreachable(next);
      const raw = graph.resolveNext(action.qid, next, {});
      next = routeAfter(next, raw);
      return touch({ ...next, history: [...state.history, action.qid] });
    }

    case 'ANSWER_PEOPLE': {
      let people = state.people;
      for (const p of action.newPeople ?? []) people = upsertPerson(people, p);
      const answers = applyDerived({ ...state.answers, [action.qid]: action.personIds });
      let next: AppState = {
        ...state,
        people,
        answers,
        skipped: state.skipped.filter((id) => id !== action.qid),
      };
      next = purgeUnreachable(next);
      const raw = graph.resolveNext(action.qid, next, {});
      next = routeAfter(next, raw);
      return touch({ ...next, history: [...state.history, action.qid] });
    }

    case 'REPEATER_ADD_ANOTHER': {
      const def = repeaterRegistry.byId.get(action.repeaterId);
      if (!def) return state;
      return touch({
        ...state,
        currentQuestionId: def.entryId,
        history: [...state.history, addMoreScreenId(action.repeaterId)],
      });
    }

    case 'REPEATER_FINISH': {
      const def = repeaterRegistry.byId.get(action.repeaterId);
      if (!def) return state;
      const items = state.repeaterItems[action.repeaterId] ?? [];
      const answers = applyDerived({ ...state.answers, [action.repeaterId]: items });
      const repeaterItems = { ...state.repeaterItems };
      delete repeaterItems[action.repeaterId];
      const next: AppState = {
        ...state,
        answers,
        repeaterItems,
        repeaterSession: null,
      };
      return touch({
        ...next,
        currentQuestionId: graph.firstVisible(def.afterId, next),
        history: [...state.history, addMoreScreenId(action.repeaterId)],
      });
    }

    case 'BACK': {
      if (state.history.length === 0) return state;
      const history = state.history.slice(0, -1);
      const currentQuestionId = state.history[state.history.length - 1];
      return touch({ ...state, history, currentQuestionId });
    }

    case 'GOTO': {
      const from = state.currentQuestionId;
      return touch({
        ...state,
        currentQuestionId: action.qid,
        history: from ? [...state.history, from] : state.history,
      });
    }

    case 'RESET':
      clearDraft();
      return initialState();

    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  dispatch: (a: Action) => void;
  hasSavedDraft: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved] = useMemo(() => [loadDraft()], []);
  const [state, dispatch] = useReducer(reducer, saved ?? initialState());

  // save synchronously on every change — the state is small, and a debounce
  // window would lose the last answer if the tab closes right after it
  useEffect(() => {
    saveDraft(state);
  }, [state]);

  const value = useMemo(
    () => ({ state, dispatch, hasSavedDraft: saved !== null }),
    [state, saved],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
