import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppState, Person } from '../engine/types';
import { graph } from '../data/graph';
import { loadDraft, saveDraft, clearDraft } from './persistence';

export type Action =
  | { type: 'ANSWER'; qid: string; value: unknown; optionId?: string }
  | { type: 'SKIP'; qid: string }
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

/** Rebuild the People Registry from answers (idempotent). */
function syncPeople(answers: Record<string, unknown>): Person[] {
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

/**
 * Walk the graph from the start along the answered/skipped path. Answers for
 * questions no longer on the path (after the user goes back and changes a
 * branching answer) are stale and get purged.
 */
function reachableAnswered(state: AppState): Set<string> {
  const visited = new Set<string>();
  let current = graph.firstVisible(graph.firstQuestionId(), state);
  while (current && !visited.has(current)) {
    const answered = state.answers[current] !== undefined;
    const skipped = state.skipped.includes(current);
    if (!answered && !skipped) break; // frontier — nothing beyond is settled
    visited.add(current);
    const q = graph.get(current);
    const chosenOptionId =
      q.type === 'single' && typeof state.answers[current] === 'string'
        ? (state.answers[current] as string)
        : undefined;
    current = graph.resolveNext(current, state, { chosenOptionId, skip: skipped && !answered });
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
  return { ...state, answers: applyDerived(answers), skipped };
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
        people: syncPeople(answers),
      };
      next = purgeUnreachable(next);
      next.people = syncPeople(next.answers);
      const currentQuestionId = graph.resolveNext(action.qid, next, {
        chosenOptionId: action.optionId,
      });
      return touch({
        ...next,
        currentQuestionId,
        history: [...state.history, action.qid],
      });
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
      next.people = syncPeople(next.answers);
      const currentQuestionId = graph.resolveNext(action.qid, next, { skip: true });
      return touch({
        ...next,
        currentQuestionId,
        history: [...state.history, action.qid],
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
