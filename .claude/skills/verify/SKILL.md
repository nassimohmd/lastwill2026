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
