import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getInitialTheme, persistTheme, type Theme } from './theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    persistTheme(next);
  };

  return (
    <button
      className="theme-toggle flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
