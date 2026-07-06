# 05 — Roadmap

Build in vertical slices — each phase ends with something usable end-to-end.

## Phase 1 — Engine walking skeleton (~1 week of focused work)

- Vite + React + TS scaffold; flat-state reducer; localStorage autosave.
- Condition evaluator (the shared DSL) with unit tests — this is the one
  piece worth testing exhaustively up front.
- Question renderer for `single`, `multi`, `text`, `info` types; Skip on
  every card; next-question resolver (option → nextRules → default →
  section order).
- **Slice content**: Section 1 (Personal) + Section 2 (Funeral) as real
  JSON data, since Funeral exercises deep option-level branching.
- Minimal template engine: declaration + funeral wish clauses rendering to
  an on-screen preview.

**Exit test**: answer Sections 1–2 (including the burial vs cremation vs
body-donation branches), reload the page mid-way, resume, and see a correct
two-part will preview.

## Phase 2 — Shared machinery

- People Registry + `SF-PERSON`.
- Repeater engine; `SF-BENEFICIARY`, `SF-CONTINGENT`, `SF-SHARES`.
- Chapter/section navigation, progress bar, section status, jump-back with
  downstream-answer invalidation.
- **Slice content**: Bank accounts + Real estate (the two heaviest
  repeaters) + Residuary + Executors — at this point a *minimal but legally
  complete* will can be generated.

**Exit test**: a full "simple estate" run (one house, two accounts, spouse +
two kids) produces a will containing every mandatory part in
[02-legal-framework.md §6](02-legal-framework.md).

## Phase 3 — Full content

- Author remaining question JSON: organ, guardianship, debts, investments,
  receivables, vehicles, collectibles, jewellery, IP, diaries, gadgets,
  digital life — straight from [03-question-flows.md](03-question-flows.md).
- Author all clause blocks from [04-will-template.md](04-will-template.md),
  including the Muslim-law compliance clause and religion-aware funeral
  fragments.
- ⚑ checklist collection + review-screen warnings (residuary, age,
  witness/beneficiary, nominations).

## Phase 4 — Output polish & privacy hardening

- Review screen with edit-in-place jumps.
- Print stylesheet → PDF (page footer with initials line, unbreakable
  signature block); plain-text copy; signing-instructions page; personal
  checklist page.
- Export / import draft JSON; "Clear all data"; verify zero network calls
  with user data (CSP `connect-src 'none'` as a hard guarantee).
- Visual pass: typography, spacing, dark mode, mobile.

## Phase 5 — Malayalam enablement (framework now, content later)

Done in earlier phases by construction (keys everywhere, ids in state);
this phase is the *content* work when ready:

1. `locales/ml/ui.json` — chrome first (ships alone; per-key fallback to en).
2. `locales/ml/questions.json` — question/option copy.
3. `locales/ml/clauses.json` — legally reviewed Malayalam clause templates +
   Malayalam inflection table.
4. Embed Noto Sans Malayalam in the PDF path; verify shaping/line-breaking.
5. Per-question EN | മലയാളം toggle is already wired — flipping it just
   changes the lookup locale.

## Phase 6 — Review & release

- A lawyer pass over `locales/en/clauses.json` and the legal-framework doc.
- Test matrix: religion × marital status × (minors? y/n) × (skips
  everything vs answers everything) — snapshot-test the generated wills.
- Accessibility pass (keyboard-only completion, screen-reader labels).
- Static deploy.

## Explicit non-goals (v1)

- No accounts, no server, no sync — export/import JSON is the portability
  story.
- No AI anywhere in the flow (hard requirement).
- No collection of passwords/keys/full account numbers (hard requirement).
- No joint/mutual wills, no trusts beyond the minor-guardianship holding
  language, no probate filings — out of scope, noted in the FAQ.
