// Shared Tailwind class recipes lifted verbatim from the Memoria design
// system doc (Buttons / Inputs / Cards / Badge & Tag Reference sections),
// centralized here because every interview screen needs the same button,
// input, card, and chip so they stay pixel-identical without copy-paste.
//
// Each recipe keeps its old semantic marker class (primary/secondary/link/
// option/chip/selected/hint/status-pill/...) at the front of the string,
// alongside the Tailwind utilities — the verify skill's Playwright scripts
// and .claude/skills/verify/SKILL.md key off those bare class names
// (button.primary, button.option.selected, etc.), not the utility classes.

export const btnPrimary =
  'primary inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-neutral-600 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40';

export const btnPrimaryBig = `${btnPrimary} big px-8 py-3 text-base`;

export const btnSecondary =
  'secondary inline-flex items-center justify-center rounded-lg border border-neutral-800 bg-transparent px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-900/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40';

export const btnLink =
  'link text-sm text-neutral-500 transition-colors hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-40';

export const inputBase =
  'w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-[15px] text-white placeholder-neutral-600 transition-colors focus:border-neutral-600 focus:outline-none';

export const card = 'rounded-xl border border-neutral-800 bg-neutral-900/60 p-5';

export const option =
  'option w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left text-[15px] text-neutral-200 transition-colors hover:border-neutral-700 hover:bg-neutral-900/80';
export const optionSelected = 'selected border-neutral-700 bg-neutral-800/40 text-white';

export const chip =
  'chip rounded-full border border-neutral-800 px-4 py-2 text-sm text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-200';
export const chipSelected = 'selected border-neutral-700 bg-neutral-800 text-white';

export const label = 'text-xs font-medium uppercase tracking-widest text-neutral-500';

export const hint = 'hint text-sm text-neutral-500';
export const hintWarning = 'hint warning text-sm font-medium text-neutral-300';

export const statusPill =
  'status-pill whitespace-nowrap rounded-full border border-neutral-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500';
export const statusPillDone = 'done border-neutral-700 bg-neutral-800 text-neutral-200';

export const easeOut = [0.25, 0.46, 0.45, 0.94] as const;
export const easeQuestion = [0.25, 0.1, 0.25, 1] as const;
