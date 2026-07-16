---
name: verify
description: Build, launch, and drive the LastWill interview app end-to-end to verify changes at the UI surface.
---

# Verifying LastWill

Static React SPA (Vite + TS). No backend — everything observable happens in
the browser at the interview surface and the generated-will preview.

## Build & launch

```bash
npm install            # once
npm run test           # vitest unit tests (engine + template) — CI's job, not verification
npm run dev -- --port 5173 --strictPort   # dev server
```

## Drive (headless chromium)

Playwright with the pre-installed browser:

```js
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

Selectors that matter:
- question heading: `h2.question-text` (assert its text before answering —
  catches flow-routing regressions)
- options: `button.option`; free input: `input` / `textarea` + `button.primary`
  "Continue"; skip: `button.link` "Skip this question"; back: `button.link` "Back"
- repeater: `.item-form input`, `button.chip`, "Add another …", "Done"
- generated will: `.sheet` (assert clause text on its `textContent`)

## Flows worth driving

1. **Full path**: personal (incl. religion = Muslim → notice card, married →
   spouse, children repeater) → funeral burial branch → done screen →
   assert declaration / family / burial / Muslim clauses in `.sheet`.
2. **Save/resume**: `page.reload()` mid-interview → landing must offer
   "Continue where I left off" and resume at the *exact* question.
   (Saves are synchronous on purpose — a debounce here loses the last answer.)
3. **Branch change**: from done, walk Back to `funeral.method`, switch
   burial → cremation → stale burial answers must vanish from the will.
4. **Skip everything**: only name + sound-mind are unskippable; must still
   reach a clean minimal will (no dangling ", residing at ,"-style blanks).
5. **Underage**: dob < 18 years ago → warning card mid-flow, blocked screen
   instead of preview at the end.

## Gotchas

- `localStorage` persists per browser context — use a fresh
  `browser.newContext()` per scenario.
- The done screen has no `h2.question-text`; guard question-text reads with
  a short timeout + catch.
- Autosave to localStorage is synchronous (on purpose) — a debounce here
  silently loses the last answer on a fast reload-to-resume test.

## Phase 2: flow-repeaters (bank accounts, real estate) and SF-PERSON

- Person picker: `button.option` for existing registry people, "Someone
  else" opens an inline form (`.freeform input` for name, `button.chip` for
  relation); submit via `.freeform button.primary` "Continue".
- Multi-person picker: `.chip-row button.chip` toggles existing people;
  "Someone else" is `button.secondary`, appends and re-selects; a hint
  (`p.hint`) blocks Continue below the minimum count.
- Shares picker: click "I'll set percentages", then fill
  `.freeform input[type=number]` per person in order; Continue is disabled
  until they sum to 100.
- The repeater's "add another?" screen has no `h2.question-text` matching a
  known question — it's a synthetic `<repeaterId>.__addmore__` state, shown
  as its own heading ("Account added (N so far). Add another?"). Look for
  `button.secondary` "Add another" / `button.primary` "Done".
- Worth driving: reload the page *mid-item* (after answering some but not
  all of one repeater item's fields) — resume must land back inside the
  item, not skip it or duplicate it.
- When checking clause numbering from rendered HTML, read
  `page.locator('.clause-no').allTextContents()` — don't regex the flattened
  `.sheet` `textContent()` for `\d+\.`; sibling `<p>` tags have no separator
  in `textContent`, so a fragile "digit preceded by whitespace" regex will
  undercount or find nothing even when the numbering is correct.

## Phase 3: full 18-section interview, multi-select, Flexoki theme

- The single most valuable regression test for wiring 12 sections at once is
  a "skip everything" walk from start to done — it's in
  `src/state/phase3.test.ts` as a unit test, and worth replaying in the
  browser too (`button.link` "Skip this question" repeatedly, answering only
  the name and sound-mind confirmation) to confirm the whole chain still
  terminates and the progress bar/section labels track correctly.
- `type: 'multi'` questions render as `.chip-row button.chip` (multi-select,
  not mutually exclusive) + a `button.primary` "Continue". After clicking two
  chips, wait ~100ms before asserting/screenshotting — a screenshot taken
  immediately after the second click can catch React one render behind and
  make the first chip look selected while the second doesn't (not a bug,
  just a timing artifact in the driving script — verify via
  `chip.getAttribute('class')` after a short wait, not visually mid-render).
- Theme check: launch a `browser.newContext({ colorScheme: 'light' | 'dark' })`
  — the app has no in-app toggle, it follows `prefers-color-scheme` only.
- The UI is strict monochrome (no accent/danger hues) — selected options are
  double-black-border + grey fill, selected chips are inverted (black bg),
  warnings differ by border weight not color. When screenshotting option
  states, remember Playwright leaves a hover state on the last-moused
  element, which in this design also draws a black border — check for the
  `.selected` class, not just the visual.
- Layout regression worth guarding: `.witness` blocks must render
  side-by-side inside the sheet (compare their `getBoundingClientRect().top`
  values) — the flex `min-width` is tuned to the sheet's inner width, and
  padding/max-width changes can silently wrap them into a vertical stack.

## Review summaries, repeater editing, keyboard shortcuts

- Review rows show a one-line answer gist (`.review-section-summary`) for
  answered sections, falling back to the chapter caption for skipped ones.
  Summaries come from `src/template/summaries.ts` — pure state → string,
  reusing option-label keys, so they localize for free; unit-test new
  sections there rather than screenshotting every row.
- Re-answering a finished repeater's mode/gate **reopens** its items on the
  add-more screen (they move from `answers[def.id]` into `repeaterItems`)
  instead of wiping them; each row has a Remove link
  (`REPEATER_REMOVE_ITEM`). RETURN_TO_REVIEW commits non-empty
  `repeaterItems` back into `answers` — worth re-driving the
  reopen → jump-to-Review path after touching the reducer, since items
  living in `repeaterItems` are invisible to the will/checklist until
  committed.
- Number keys 1–9 answer single-choice questions (hints rendered as
  `.option-key`, hidden on touch via `@media (hover: none)`). The listener
  ignores keys while an input/textarea has focus — probe that by focusing
  the date field and pressing a digit; the question must not advance.

## UI stack: shadcn/ui + Tailwind, themed to match Cal.com (coss.com/ui)

- The UI runs on **shadcn/ui** — Radix primitives (`radix-ui` npm package)
  + `class-variance-authority` + Tailwind CSS v4, with components copied
  into the repo at `src/components/ui/*.tsx` (button, input, textarea,
  label, card, badge, alert, toggle, toggle-group — only what's actually
  used; unused ones like `progress`/`separator` were deleted rather than
  left as dead scaffolding) — not an npm dependency, so edit those files
  directly rather than looking for a package to bump. `src/lib/utils.ts`
  has the `cn()` helper (clsx + tailwind-merge) every component uses to
  merge classes. `components.json` + the `@/*` path alias
  (`tsconfig.json`, `vite.config.ts`) are shadcn's own scaffolding, kept
  so `npx shadcn add <component>` still works if you need another
  primitive later — **but ui.shadcn.com is blocked by this environment's
  egress policy**; fetch component source from
  `raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/...`
  instead (that host is reachable) and wire imports/paths in by hand.
- **Visual design is modeled on Cal.com's own design system**
  (coss.com/ui, github.com/cosscom/coss — also blocked at the apex
  domain, same fix: `raw.githubusercontent.com/cosscom/coss/main/...`
  works). Deliberately *not* migrated onto their actual stack (Base UI +
  `@coss/ui`): that package is **AGPL-3.0**, and copying its component
  source into a web-served app would pull the whole thing under AGPL's
  copyleft. Instead, the *token values* — colors, radii — were re-derived
  from their published `packages/ui/src/styles/globals.css` (not
  copyrightable the way source files are) and applied to our existing
  MIT-licensed Radix/shadcn components, which were rewritten in our own
  words to get a comparable look (soft embossed cards/buttons, alpha-
  blended neutral overlays, `rounded-lg`/`rounded-2xl` radii, semantic
  destructive/success/warning/info accent colors) without copying their
  `.tsx` files. If you want to go further with this system, re-derive
  values/behavior from their source rather than pasting it in verbatim —
  same reasoning applies to any other AGPL/GPL dependency.
- **Theming is CSS-variable based, not per-component `dark:` classes.**
  Every color in `src/styles.css` (`--background`, `--foreground`,
  `--card`, `--primary`, `--muted`, `--accent`, `--destructive`,
  `--success`, `--warning`, `--info`, `--border`, etc.) is defined once in
  `:root` (light) and overridden in `.dark`; components use semantic
  Tailwind classes (`bg-card`, `text-foreground`, `border-border`, ...)
  that resolve differently per theme automatically — **don't add `dark:`
  variants to new UI**, that pattern was retired with the Tailwind-only
  version. If a color looks wrong in one theme, fix the variable in
  `src/styles.css`, not the component. Unlike the prior monochrome pass,
  this theme **does use color** (red destructive, amber warning, emerald
  success, blue info) — that's intentional fidelity to Cal.com's actual
  palette, not a regression of an earlier "strictly monochrome" request.
- **Theme mechanics**: a `.dark` class on `<html>`, toggled by
  `src/ui/ThemeToggle.tsx` (a shadcn `Button`) and read/written via
  `src/ui/theme.ts` (`lastwill.theme` in localStorage; falls back to
  `prefers-color-scheme` on first visit). Wired via
  `@custom-variant dark (&:is(.dark *));` in `src/styles.css`. Applied in
  `main.tsx` before `ReactDOM.render` (not in a `useEffect`) to avoid a
  flash of the wrong theme — CSP forbids an inline blocking `<script>` in
  `index.html`, so this is the earliest available hook.
- `.sheet` (the generated will) is unaffected by either theme: it's still
  forced white-bg/black-ink/serif regardless, styled with plain CSS in
  `src/styles.css`, not Tailwind/shadcn — it's a printed document, not an
  app-chrome surface.
- **Selector contract preserved on purpose**: every component still carries
  its old bare marker class (`button.option`, `button.chip` + `.selected`,
  `button.primary`/`.secondary`/`.link`, `.freeform`, `.chip-row`, `.items`,
  `.item-form`, `.field`, `.repeater-actions`, `.question-card`, `.hint` +
  `.warning`, `.status-pill` + `.done`, `.progress-chapter` + `.current`,
  `.chapter-label`, `.progress-count`, `.header-links`, `.card-footer`,
  etc.) alongside the Tailwind/shadcn utility classes — see
  `src/ui/classes.ts` for the bespoke recipes (option/chip/hint), and every
  `<Button>`/`<Badge>`/`<Alert>` usage passes the marker class through its
  own `className` prop (e.g. `<Button className="primary">`,
  `<Badge className="status-pill done">`). Don't drop these when touching a
  component; the selectors above (and this whole file) depend on them, not
  on the shadcn component names.
- **No animation library, no transitions, anywhere — deliberate.** `motion`
  (Framer Motion) was removed entirely; view swaps (question → question,
  question → Review, Review → will) are plain conditional rendering in
  `App.tsx` with no `AnimatePresence`/blur/fade, and the shadcn primitives
  in `src/components/ui/*.tsx` have had their `transition-*` classes
  stripped from the upstream source. A click's effect (new question, new
  theme, progress-bar fill) is in the DOM on the next render — no
  `waitForTimeout` budget needed between steps in a driving script; a
  present-immediately check is enough. If you add new UI, don't reach for
  `motion` or Tailwind `transition-*`/`animate-*` classes — that's a
  reintroduction of exactly what this pass removed.
- **Info/notice and "Confirm: …" branches have no Skip link.** Any question
  with `type: 'info'`, or a single-choice "Confirm: I acknowledge…" gate
  (e.g. the Muslim one-third-rule notice), only advances via its own
  "Understood" / "I confirm" button — a generic skip-loop needs a fallback
  that looks for `button.option` matching `/confirm/i` or `button.primary`
  matching `/understood/i` before concluding it's stuck.
- Mobile header (`≤390px` viewports): brand and the link/toggle group wrap
  onto two rows (`flex-wrap` on both `header` and `.header-links`, with
  `whitespace-nowrap` on each link) rather than squeezing onto one line —
  verify this after touching header markup, since a missing `whitespace-nowrap`
  makes "Review answers" / "Start over" wrap mid-word instead of moving the
  whole button down.
- **The `<header>` doesn't render at all on the landing screen** (`App.tsx`'s
  `showHeader = started || finished`) — the landing page has its own hero/
  lead/language-and-theme toggle, so a near-empty top bar above it (just the
  wordmark) was cut. It appears once the user has clicked past landing
  (`started`) or on a resumed already-finished session. Check `header`
  count is 0 on landing, 1 everywhere else.
- **Review always renders even with generation blockers outstanding**
  (unconfirmed sound-mind, underage). `App.tsx` only calls
  `generationBlockers()` when `showWill` is true (i.e. the user clicked
  "Generate my will"), not just because `finished` is true — so landing on
  Review (via natural completion or `RETURN_TO_REVIEW`) never shows the bare
  `.blocked` wall. Instead `getWarnings()` in `src/template/checklist.ts`
  surfaces the same blockers as `.warning-card.strong` rows with a "Fix
  this" jump link, same as the residuary-clause warning. If you add a new
  blocker to `generationBlockers()` in `src/template/render.ts`, mirror it
  in `getWarnings()` too, or it'll only surface after the user already
  clicked Generate.
- Fresh screenshots taken **immediately** after a state-changing click can
  catch the view mid-animation (opacity/blur not yet settled, or — once
  observed — an apparently "blank" card) purely from timing, not a real bug;
  re-shoot after the ~450ms transition window before treating it as a
  regression.

## Chapter progress + English-only chrome

- The progress track is two-level: 8 `.progress-chapter` groups (wider
  gaps, `flex-grow` = section count, `.current` gets a darker empty-track
  tint) each containing per-section `.progress-seg`s. The label reads
  "CHAPTER (2/6) — SECTION" for multi-section chapters (no counter when a
  chapter has one section) with the overall "N / 18" on the right.
- **Language rule**: only content localizes — keys under `q.*`, `clause.*`,
  `frag.*`, `part.*`, `ui.will.*`, `chap.*`, `sec.*`, `rep.*`, plus the
  exact keys `ui.yes`/`ui.no` (they live in the ui namespace but are answer
  options). Everything else is pinned to English inside `t()` itself
  regardless of locale. When verifying Malayalam, assert the question/
  options *and* the chapter/section titles in the progress bar are
  Malayalam, while the Skip link, header links, and review pills stay
  English. Watch for the ui.yes/ui.no class of bug: a key's namespace
  doesn't determine whether it's chrome — where it renders does.
  Chapter/section titles and repeater "add another?" prompts moved from
  `ui.json` (pinned English) into `content/` as part of the content-layer
  migration below — they now localize too, which is a deliberate change
  from earlier phases, not a regression.

## Phase 4: review screen, checklist, export/import, CSP

- Finishing the interview lands on **Review** (`h2` "Review your answers"),
  not straight on the will — `button.primary` "Generate my will" is the
  transition. "Back to questions" from the will screen returns to Review,
  not the interview (an effect in App.tsx resets `showWill` whenever
  `currentQuestionId` goes non-null, so editing an answer also re-lands on
  Review afterward, not straight back to the will).
- Warnings render as `.warning-card` (`.strong` variant for blocking-style
  issues, e.g. missing residuary clause); each has an optional `button.link`
  "Fix this" that dispatches GOTO to the relevant question.
- **Editing an early answer does not auto-replay already-answered
  downstream questions** — every question after the edit point must be
  clicked/skipped through again on the way back to Review, even ones whose
  answer is unaffected. This is existing navigation behavior, not a Phase 4
  regression; don't mistake it for a bug when a verification script's
  "return to Review" step needs more steps than expected.
- Checklist (`.checklist`) and warnings are pure functions of current state
  (`src/template/checklist.ts`) — if you skip/re-answer a question that
  originally triggered a checklist item, the item correctly disappears. When
  scripting a "checklist item survives a round trip" check, re-affirm the
  same answer on the way back, don't just skip through it.
- Export downloads via a real browser download event
  (`page.waitForEvent('download')` + `download.saveAs(path)`); import is a
  plain `<input type=file>` — drive it with `page.setInputFiles(...)`.
- CSP: `npm run build` should produce `dist/index.html` with
  `connect-src 'none'`; the dev-mode `index.html` source keeps
  `connect-src 'self'` (Vite HMR needs it) — don't flag that as a
  regression, it's swapped only at build time by the `strict-production-csp`
  Vite plugin.
- **"Review answers" header link**: always visible while `inProgress` (any
  question or the repeater add-more screen), dispatches `RETURN_TO_REVIEW` —
  jumps straight back to Review in one step, purging anything the edit made
  stale, without requiring the user to click/skip through every remaining
  downstream question first. Worth re-checking after any change to the
  purge/reachability logic, since this action reuses it directly.

## Phase 5: Malayalam locale

- Two independent language choices, don't conflate them: `.lang-toggle` in
  the landing page and header switches `state.meta.locale` (drives the
  interview + all UI chrome); `.will-lang-picker` on the will screen only
  (a local `useState`, not app state) switches the *generated document's*
  language, always defaulting to English regardless of the interview
  locale, with a `.hint.warning` disclaimer shown when set to Malayalam
  ("draft translation, needs review by a Malayalam-speaking lawyer").
- Switching either toggle never loses progress — every key falls back to
  English per-key (see `src/i18n/malayalam.test.ts`, which asserts full
  key-for-key coverage and placeholder-token parity between `locales/en/*`
  and `locales/ml/*` — run that test after touching any locale file, it's
  the fast way to catch a missed translation or a broken `{{placeholder}}`).
- `.sheet[lang="ml"]` gets `text-align: left` (not `justify` — Malayalam's
  spacing metrics make justified text produce ugly, uneven gaps; caught by
  screenshotting the actual will, not by unit tests) and taller
  `line-height` (Malayalam glyphs need more vertical room than Latin at the
  same font-size).
- The English clause templates bake an ordinal ("7th day of...") into
  `{{today.day}}`; the Malayalam templates supply their own grammatical
  suffix in the template text itself (e.g. `{{today.day}}-ന്`) — so
  `resolveVar` must emit a bare number for `locale==='ml'`, not the English
  ordinal, or you get "7th-ന്" nonsense. Verify by generating a will in
  Malayalam and reading the date in the declaration, not just by reading
  the code.

## Phase 6: content layer (owner-editable via Pages CMS)

- All interview/will wording and structure now lives in `content/*.json`
  (plain JSON, `{en, ml?}` inline per question/option/fragment — no i18n-key
  indirection), not in `src/data/*.ts`. `src/content/load.ts` is the only
  place that reads `content/`: it derives a unique dictionary key per
  question/option/field/clause/fragment (`q.<id>`, `q.<id>.opt.<optId>`,
  `clause.<id>`, `chap.<id>`, `sec.<id>`, `rep.<id>.addMore`, etc.),
  populates `contentEn`/`contentMl`, and reconstructs the exact runtime
  shapes (`Question`, `Section`, `Chapter`, `ClauseBlock`,
  `FlowRepeaterDef`) the rest of the app already consumes.
  `src/data/{graph,clauses,repeaters,relations}.ts` are now thin re-export
  shims over the loader — the 18 old per-section files and
  `src/engine/subflows.ts` are gone; if you're looking for where a
  question's text lives, it's `content/sections/<nn>-<id>.json`, not a
  `.ts` file.
- **Content is validated at build time.** `npm run prebuild` (wired via
  npm's implicit `pre<script>` hook, so `npm run build` always runs it
  first) executes `scripts/validate-content.ts` →
  `src/content/validateContent()`: checks every question id is unique,
  every `next`/option-`next`/`nextRules.goto`/repeater `entryId`/`afterId`
  resolves to a real question (with a Levenshtein "did you mean" hint),
  every `Condition` shape is well-formed, no required text is empty, and —
  reusing the same logic as `phase3.test.ts`'s skip-everything walk — that
  every section is reachable and the whole content set still renders a
  valid will end to end. A bad edit fails the build with a readable
  message instead of shipping broken; verify this still works after
  touching `content/*.json`, `src/content/load.ts`, or `src/content/
  validate.ts` by deliberately corrupting one field (e.g. set a
  `next` to a nonexistent id) and confirming `npm run build` exits
  non-zero with that exact message, then revert.
- **Pages CMS** (`.pages.yml` at repo root) is the intended editing UI —
  a hosted form editor that commits straight to this branch. It's
  configured but not something to test in this sandbox (no live
  pagescms.org session here); if you change the shape of `content/*.json`
  (add/rename/remove a field), update `.pages.yml` to match or the CMS
  form will drift from what the loader actually reads. `content/README.md`
  is the owner-facing editing guide — keep it in sync with any schema
  change too.
- **Pages CMS hard constraints** (learned by reading its source after two
  live breakages — don't rediscover these): (1) a `type: file` entry whose
  JSON root is a bare array needs `list: true` at the *entry* level, with
  `fields:` describing one item — a wrapper field inside `fields:` binds
  nothing. (2) A `type: code` field's value must be a **string** — an
  object crashes its CodeMirror editor with "value must be typeof string
  but got object", and its save schema is `z.string()`. That's why every
  condition-shaped value (`when`, `nextRules`, `summarize`) is stored in
  content JSON as a *JSON string*, parsed by `parseJsonField()` in
  `src/content/load.ts` (blank string = unset; bad JSON = build failure
  with location). (3) **Pages CMS deletes any data key not declared in
  `.pages.yml` when an entry is saved** — never add a key to a content
  file without declaring a matching field, and never "hide" a key by
  removing its field (that's silent data loss on the owner's next save;
  `hidden: true` doesn't help — it still validates). (4) Clause
  `fragments` are a **flat list** with a `group` key (not a group-keyed
  map — the CMS can't model arbitrary map keys); `loadFragments()`
  regroups them, preserving order within each group (first match wins).
- A CMS form can write back an empty array/string for a field the editor
  never touched (`"options": []`, `"help": {"en": "", "ml": ""}`) instead
  of omitting the key — `src/content/load.ts`'s `present()`/`textPresent()`/
  `strPresent()` helpers treat those the same as "not set". If you add a
  new optional field to the content schema, route it through one of those
  helpers rather than a bare truthy check, or a CMS-saved-but-untouched
  field will silently start behaving as if it were set.
