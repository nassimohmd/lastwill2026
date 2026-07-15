// Bespoke recipes for the pieces of the interview that don't map onto a
// stock shadcn/ui primitive (the big option rows, pill chips, field hints).
// Everywhere else uses the real shadcn components directly
// (@/components/ui/button, /card, /input, /textarea, /badge, /alert).
//
// All colors are shadcn theme tokens (bg-card, text-foreground,
// border-border, ...) defined in src/styles.css, themed to match Cal.com's
// coss.com/ui palette (neutral-800 foreground, alpha-blended borders/
// accents, semantic destructive/success/warning colors) — light/dark both
// flip automatically via the `.dark` class without any component-level
// `dark:` variants.
//
// Each recipe keeps its old semantic marker class (option/chip/selected/
// hint/...) at the front of the string — .claude/skills/verify/SKILL.md and
// its Playwright scripts key off those bare class names, not the utilities.

export const option =
  'option w-full rounded-xl border border-border bg-card p-4 text-left text-[15px] text-foreground shadow-xs hover:border-ring/60 hover:bg-accent/50';
export const optionSelected = 'selected border-primary bg-accent shadow-none';

export const chip =
  'chip rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-ring/60 hover:text-foreground';
export const chipSelected = 'selected border-primary bg-primary text-primary-foreground hover:text-primary-foreground';

export const hint = 'hint text-sm text-muted-foreground';
export const hintWarning = 'hint warning text-sm font-medium text-foreground';

// plain text navigation (Back, Skip, Remove, Fix this, Review, Start over) —
// deliberately not the shadcn Button "link" variant, which underlines on
// hover; these read as quiet in-flow actions, not calls to action
export const btnLink =
  'link text-sm text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40';
export const navLink =
  'link whitespace-nowrap text-sm font-medium text-foreground/70 hover:text-foreground disabled:pointer-events-none disabled:opacity-40';
