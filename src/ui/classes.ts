// Shared Tailwind class recipes lifted from the Memoria design system doc
// (Buttons / Inputs / Cards / Badge & Tag Reference sections), centralized
// here because every interview screen needs the same button, input, card,
// and chip so they stay pixel-identical without copy-paste.
//
// Each recipe keeps its old semantic marker class (primary/secondary/link/
// option/chip/selected/hint/status-pill/...) at the front of the string,
// alongside the Tailwind utilities — the verify skill's Playwright scripts
// and .claude/skills/verify/SKILL.md key off those bare class names
// (button.primary, button.option.selected, etc.), not the utility classes.
//
// Light is the unprefixed default, dark is the `dark:` variant (driven by
// a `.dark` class on <html>, see src/ui/theme.ts) — the doc itself is
// dark-only, so the light values are a structural mirror (same borders,
// weights, tracking) rather than anything the doc specifies literally.

export const btnPrimary =
  'primary inline-flex items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600 dark:hover:bg-neutral-700';

export const btnPrimaryBig = `${btnPrimary} big px-8 py-3 text-base`;

export const btnSecondary =
  'secondary inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/30 dark:hover:text-white';

export const btnLink =
  'link text-sm text-neutral-500 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-neutral-200';

// header nav needs more contrast than the "whisper" in-card link — it's
// primary navigation (Review answers / Start over), not a secondary aside
export const navLink =
  'link whitespace-nowrap text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-300 dark:hover:text-white';

export const inputBase =
  'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-white dark:placeholder-neutral-600 dark:focus:border-neutral-600';

export const card = 'rounded-xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/60';

export const option =
  'option w-full rounded-xl border border-neutral-200 bg-white p-4 text-left text-[15px] text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/80';
export const optionSelected =
  'selected border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/40 dark:text-white';

export const chip =
  'chip rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200';
export const chipSelected =
  'selected border-neutral-900 bg-neutral-900 text-white dark:border-neutral-700 dark:bg-neutral-800';

export const label = 'text-xs font-medium uppercase tracking-widest text-neutral-500';

export const hint = 'hint text-sm text-neutral-500';
export const hintWarning = 'hint warning text-sm font-medium text-neutral-700 dark:text-neutral-300';

export const statusPill =
  'status-pill whitespace-nowrap rounded-full border border-neutral-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:border-neutral-800';
export const statusPillDone =
  'done border-neutral-400 bg-neutral-200 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200';

export const easeOut = [0.25, 0.46, 0.45, 0.94] as const;
export const easeQuestion = [0.25, 0.1, 0.25, 1] as const;
