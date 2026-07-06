# 01 — Architecture

## 1. Overview

Three cleanly separated layers, all client-side:

```
┌────────────────────────────────────────────────────────┐
│  UI layer (React)                                      │
│  one-question-at-a-time renderer · progress bar ·      │
│  review screen · language toggle · PDF/copy export     │
└──────────────▲─────────────────────────▲───────────────┘
               │ reads                   │ reads
┌──────────────┴───────────┐  ┌──────────┴───────────────┐
│  Interview engine        │  │  Template engine         │
│  question graph (JSON)   │  │  clause blocks (JSON)    │
│  next-question resolver  │  │  condition evaluator     │
│  repeater sub-flows      │  │  variable substitution   │
└──────────────▲───────────┘  └──────────▲───────────────┘
               │ writes                  │ reads
        ┌──────┴──────────────────────────┴──────┐
        │  Flat state object (single source of   │
        │  truth) — autosaved to localStorage,   │
        │  exportable as JSON                    │
        └────────────────────────────────────────┘
```

The interview never contains will text; the template layer never contains
questions. Questions and clauses only communicate through the flat state
object. This is what makes the long branching flows maintainable: adding a
question is a data change, adding a clause is a data change, neither touches
engine code.

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | Static SPA, no server, fast dev loop |
| State | Single reducer (or zustand) over one flat object | The whole app is "answers in, text out" |
| Styling | CSS custom properties + a single stylesheet (or Tailwind) | Minimal aesthetic, easy dark mode |
| Persistence | `localStorage` autosave + JSON export/import | Save/resume without any backend |
| PDF | Print stylesheet + `window.print()` primary; `pdf-lib` fallback for a "Download PDF" button | Print CSS gives best typography control; pdf-lib allows font embedding (needed later for Malayalam — Noto Sans Malayalam) |
| i18n | Flat key → string JSON per locale (`locales/en/*.json`, later `locales/ml/*.json`) | Per-question toggle, no framework lock-in |
| Hosting | Any static host (Vercel/Netlify/GitHub Pages) | No data ever leaves the browser |

## 3. The flat state object

Every answer writes to one JSON document keyed by question id. Values are
**option ids or raw input values — never display strings** — so state is
language-independent and Malayalam can be added without migrating drafts.

```jsonc
{
  "meta": { "draftId": "…", "createdAt": "…", "updatedAt": "…",
            "locale": "en", "schemaVersion": 1,
            "sectionStatus": { "personal": "done", "funeral": "in_progress", "...": "not_started" } },

  "people": [                       // the People Registry (see §5)
    { "id": "p1", "name": "Anita", "relation": "spouse" },
    { "id": "p2", "name": "Rahul", "relation": "son", "dob": "2015-03-02" }
  ],

  "answers": {
    "personal.full_name": "…",
    "funeral.method": "cremation",             // option id
    "funeral.cremation.ashes": "immerse",
    "funeral.cremation.ashes.place": "Papanasam beach, Varkala",
    "bank.accounts": [                          // repeater → array of item states
      { "bank_name": "SBI", "type": "savings",
        "beneficiary": { "mode": "person", "personId": "p1",
                          "contingent": { "mode": "children" } } }
    ],
    "residuary.primary": { "mode": "split", "split": [ {"personId":"p1","share":50}, … ] }
  },

  "skipped": ["organ.method", "ip.gate"]        // explicit record of skips
}
```

Skips are recorded (not just absent) so the review screen can distinguish
"skipped" from "not reached yet", and so the template layer can emit nothing
for skipped topics deterministically.

## 4. Question graph

Questions are data, loaded from `data/questions/*.json` (one file per
section). No branching logic lives in components.

### 4.1 Question node schema

```jsonc
{
  "id": "funeral.method",
  "section": "funeral",
  "type": "single",              // single | multi | text | number | date | person | repeater | info
  "text": "q.funeral.method",    // i18n key
  "help": "q.funeral.method.help",   // optional one-line explainer, i18n key
  "skippable": true,             // default true; false only for personal.full_name & declaration
  "options": [
    { "id": "burial",    "label": "q.funeral.method.opt.burial",    "next": "funeral.burial.place" },
    { "id": "cremation", "label": "q.funeral.method.opt.cremation", "next": "funeral.cremation.place" },
    { "id": "donate_science", "label": "…", "next": "funeral.body_donation.institution" },
    { "id": "family_decides", "label": "…" }        // no next → falls through to default
  ],
  "next": "funeral.memorial",    // default next (used by family_decides and by Skip)
  "when": { "eq": ["personal.religion", "muslim"] } // optional visibility condition — question
                                                    // is silently bypassed when false
}
```

### 4.2 Next-question resolution order

1. Selected option's `next`, if present.
2. Question's conditional `nextRules`: `[{ "when": <cond>, "goto": "id" }, …]`
   (first match wins) — used where the branch depends on *earlier* answers,
   e.g. religion-aware funeral options.
3. Question's default `next`.
4. If none: next question in the section's declared order; at section end,
   the next section.

**Skip** always resolves via steps 2→4 (never an option `next`) and records
the id in `skipped`. Skipping a *gate* question (e.g. "Do you own any
vehicles?") skips its whole section.

### 4.3 Repeaters

A `repeater` node points at a sub-flow (an ordered list of question ids)
executed once per item, writing into an array:

```jsonc
{
  "id": "realestate.properties",
  "type": "repeater",
  "itemFlow": ["re.item.type", "re.item.desc", "re.item.ownership",
               "re.item.action", "re.item.beneficiary"],
  "itemLabel": "q.re.item_label",           // "Property {n}"
  "addMore": "q.re.add_more",               // "Add another property?"
  "max": 20
}
```

### 4.4 Shared sub-flows (the key to managing branch explosion)

Recurring patterns are defined **once** and instantiated by reference with a
`context` (what asset, where to store the answer). See
[03-question-flows.md §0](03-question-flows.md) for their full question text.

| Sub-flow | Purpose |
|---|---|
| `SF-PERSON` | Pick a person from the People Registry or add a new one |
| `SF-BENEFICIARY` | "Who should receive X?" → one person / several people (shares) / sell & add to estate / part of residuary |
| `SF-CONTINGENT` | "If {person} does not survive me…" → their children / an alternate person / residuary estate |
| `SF-SHARES` | Equal split / percentages / describe the division |

This is why the graph stays tractable: ~180 authored questions cover what
would otherwise be thousands of hardcoded branch paths.

### 4.5 Condition DSL (used by `when`, `nextRules`, and clause blocks)

Small, declarative, JSON-serialisable:

```jsonc
{ "eq":  ["personal.religion", "muslim"] }
{ "in":  ["funeral.method", ["burial", "cremation"]] }
{ "exists": "guardianship.primary" }
{ "notEmpty": "bank.accounts" }
{ "gt": [{ "count": "people[relation=child][minor=true]" }, 0] }
{ "and": [ …conds ] }   { "or": [ …conds ] }   { "not": <cond> }
```

One evaluator (~60 lines) is shared by the interview engine and the template
engine.

## 5. People Registry

Names entered once are reused everywhere. Section 1 seeds it (spouse,
children, parents); every `SF-PERSON` invocation offers the registry plus
"Someone else" (which adds to it). Each person: `id`, `name`, `relation`,
optional `dob`/`age` (drives the guardianship gate for minors), optional
`address` (executors and guardians should be identifiable in the will text).

Deleting a person is blocked while any answer references their `id`; the UI
lists where they are used.

## 6. Sections, chapters, progress, save/resume

- 18 interview sections grouped into 9 chapters (see README). The progress
  bar shows chapters; within a chapter, a thin per-section tick row.
- Chapters are **navigable in any order** from a contents screen; the
  default flow is linear. Each section shows done / in-progress / skipped.
- State autosaves to `localStorage` on every answer (debounced). "Export
  draft" downloads the state JSON; "Import draft" restores it — this is the
  cross-device story without a backend.
- A schema version in `meta` + tiny migration functions protect old drafts
  as questions evolve.

## 7. Template engine (output layer)

Fully specified in [04-will-template.md](04-will-template.md). Summary:

- The will is an **ordered list of clause blocks** (`data/clauses/*.json`).
- Each block has a `when` condition (same DSL), a `text` i18n key, and may
  contain `each` loops over arrays (properties, accounts…) and nested
  conditional fragments.
- Variable substitution: `{{answers.personal.full_name}}`,
  `{{person(p1).name}}`, `{{label('funeral.method')}}` (resolves an option
  id to its localized label — labels are looked up at render time, so the
  same state renders in English today and Malayalam later).
- Clause numbering is computed after filtering (blocks that don't apply
  simply vanish; numbering never has holes).
- Output targets: on-screen preview, copy-to-clipboard (plain text), and
  PDF (A4, generous margins, serif face, page numbers, signature/attestation
  block kept unbroken on the final page via CSS `break-inside: avoid`).

## 8. Internationalisation framework (Malayalam-ready, English-only for now)

- **Every user-visible string is a key**: question texts, option labels,
  help texts, UI chrome, and clause templates. Nothing is hardcoded.
- Locale files: `locales/en/questions.json`, `locales/en/ui.json`,
  `locales/en/clauses.json`. Adding Malayalam = adding `locales/ml/*` —
  zero engine changes.
- **Per-question toggle**: a small "EN | മലയാളം" control on the question
  card switches the display language of *that card* instantly (global
  default lives in `meta.locale`). This works because state stores option
  ids, never labels.
- Missing-key fallback: `ml` falls back to `en` per key, so Malayalam can be
  shipped incrementally (UI first, questions next, clauses last).
- **Clause templates are per-locale documents, not word-for-word
  translations** — legal Malayalam phrasing differs structurally. The clause
  schema therefore allows `"text": { "en": "key.en", "ml": "key.ml" }` where
  the `ml` template may reorder variables.
- Flagged for later: Malayalam legal terminology must be reviewed by a
  lawyer/translator; PDF export must embed Noto Sans Malayalam; dates render
  via `Intl` with the active locale.

## 9. Privacy & safety rules (enforced in code)

1. No network calls carrying user data. No analytics on answer content.
2. **Never collect passwords, PINs, OTPs, private keys, or full account
   numbers.** Digital-asset questions only ask *where* credentials are kept.
   Account questions accept at most last-4 digits, clearly optional.
3. A "Clear all data" action wipes localStorage after confirmation.
4. Every screen footer: "This is a document-drafting aid, not legal advice."

## 10. Repository layout (target)

```
src/
  engine/        # graph resolver, condition evaluator, repeater logic
  template/      # clause assembler, variable substitution, numbering
  state/         # reducer, persistence, migrations, people registry
  ui/            # QuestionCard, ProgressBar, Review, Export, i18n toggle
data/
  questions/     # one JSON per section  (personal.json, funeral.json, …)
  subflows/      # SF-PERSON, SF-BENEFICIARY, SF-CONTINGENT, SF-SHARES
  clauses/       # ordered clause blocks per will part
locales/
  en/            # questions.json, ui.json, clauses.json
  ml/            # (later)
docs/            # these plan documents
```
