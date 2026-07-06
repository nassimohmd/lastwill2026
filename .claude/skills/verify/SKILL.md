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
