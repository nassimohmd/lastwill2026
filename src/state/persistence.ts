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

/** Downloads the current draft as a JSON file the user can keep or move
 *  to another device — the only portability story, since there's no backend. */
export function exportDraft(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = typeof state.answers['personal.full_name'] === 'string' ? state.answers['personal.full_name'] : 'draft';
  a.href = url;
  a.download = `lastwill-${String(name).trim().replace(/\s+/g, '-').toLowerCase() || 'draft'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parses an imported draft file. Returns null if it doesn't look valid —
 *  the caller decides how to surface that. */
export function parseImportedDraft(text: string): AppState | null {
  try {
    const parsed = JSON.parse(text) as AppState;
    if (parsed?.meta?.schemaVersion !== 1 || typeof parsed.answers !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}
