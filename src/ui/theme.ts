export type Theme = 'light' | 'dark';

const KEY = 'lastwill.theme';

/** Explicit user choice if they've toggled before; otherwise the OS/browser
 *  preference at load time. Snapshotted once — doesn't live-follow a system
 *  theme change while the tab is open, only re-reads on next load. */
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // storage unavailable — fall through to the media-query default
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage unavailable — theme still applies for this session
  }
}
