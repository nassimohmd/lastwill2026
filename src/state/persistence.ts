import type { AppState } from '../engine/types';

const KEY = 'lastwill.draft.v1';

export function loadDraft(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed?.meta?.schemaVersion !== 1) return null; // future: run migrations
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — the interview still works, just no resume
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
