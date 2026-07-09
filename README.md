# LastWill — Simple Will Creation Tool (India)

A guided, question-by-question tool that helps a person create their Last Will and
Testament under Indian law. The user answers a long series of short multiple-choice
questions (every question is skippable), and at the end the tool generates the full
legal text of the will — ready to copy or download as a PDF, print, sign before two
witnesses, and optionally register.

**No AI. No backend. No data leaves the device.** The entire tool is deterministic:
a question graph drives the interview, answers fill a flat state object, and a
separate template layer assembles the will from conditional clause blocks.

## Design principles

- **Minimal, aesthetic UI** — one question on screen at a time, short answers,
  generous whitespace, a chapter-based progress bar.
- **Comprehensive coverage** — funeral wishes to crypto keys to social media
  accounts, with contingent beneficiaries for every major bequest.
- **Indian law first** — drafted around the Indian Succession Act, 1925, with
  personal-law awareness (e.g. the one-third rule for Muslim testators) and the
  formalities Indian wills require (attestation, executor, revocation clause).
- **Bilingual-ready** — English now; the architecture keys every string so a
  Malayalam locale can be added later with a per-question language toggle.
- **Private by design** — state lives in `localStorage`; the user can export /
  import their draft as a JSON file. Passwords and credentials are *never*
  collected — only pointers to where they are kept.

## Documents

| Doc | Contents |
|-----|----------|
| [docs/01-architecture.md](docs/01-architecture.md) | Tech stack, question-graph engine, state model, template engine, i18n framework, save/resume, PDF generation |
| [docs/02-legal-framework.md](docs/02-legal-framework.md) | Indian legal requirements a will must satisfy, personal-law variations, what a will can and cannot do |
| [docs/03-question-flows.md](docs/03-question-flows.md) | **The complete question bank** — every question, its answer options, and the branching logic, organised into chapters |
| [docs/04-will-template.md](docs/04-will-template.md) | The output layer — ordered conditional clause blocks that assemble the final will text |
| [docs/05-roadmap.md](docs/05-roadmap.md) | Build phases and milestones |

## Interview chapters

1. **You & Your Family** — identity, declaration of sound mind, family members
2. **Final Wishes** — funeral / memorial preferences, organ donation
3. **Your Dependents** — guardianship for minors and dependent adults
4. **Money & Property** — debts, bank accounts, investments, receivables, real estate, vehicles
5. **Personal Belongings** — collectibles, jewellery, intellectual property, diaries, gadgets
6. **Digital Life** — subscriptions, statements consent, social media, storage, photos, data backups
7. **Everything Else** — residuary clause
8. **Who's In Charge** — executors for physical and digital estates (primary + secondary)
9. **Review & Download** — review answers, generate will, signing instructions

## Status

All 18 interview sections from [docs/03-question-flows.md](docs/03-question-flows.md)
are implemented: personal details, funeral & organ donation, guardianship, debts,
bank accounts, investments, receivables, real estate, vehicles, collectibles,
jewellery, intellectual property, diaries, gadgets, digital life, the residuary
clause, and executors. The interview end-to-end produces a legally complete will.

A few sections were intentionally simplified versus the full docs spec to keep
the question graph maintainable (see comments in `src/data/*.ts`): per-child
guardian choice collapsed to one guardian pair for all minors; investments'
nine per-type mini-flows collapsed into one generic repeater; collectibles,
jewellery, and IP each collapsed to a single beneficiary pick rather than an
itemised list. These are straightforward to expand later using the same
`makeBeneficiarySubflow` / flow-repeater machinery — no engine changes needed.

UI: built on **shadcn/ui** (Radix primitives + `class-variance-authority`)
and Tailwind CSS v4, with `motion` (Framer Motion) for animation. Components
are copied into the repo at `src/components/ui/*` (shadcn's own model — you
own the code, not an installed dependency), themed with a strictly
**monochrome** CSS-variable palette in `src/styles.css` (`oklch(... 0 0)` —
zero chroma for every color, including the destructive/error state, which
is a heavier black/white weight rather than red). Light and dark both ship,
toggled manually (`.dark` class on `<html>`, `src/ui/ThemeToggle.tsx` +
`src/ui/theme.ts`, persisted in `localStorage` with the OS preference as the
first-visit default) — colors are semantic tokens (`bg-card`,
`text-foreground`, `border-border`, ...) that resolve differently per theme
automatically, so components don't carry `dark:` variants. Screens wake up
with a sequential blur-to-clear reveal on transition, and options/chips
stagger in on entry. The generated will (`.sheet`) is a separate artifact
from the app chrome — it always renders as black serif ink on a white page
regardless of theme, since it represents a document meant to be printed and
signed, not an app-chrome surface. No webfonts anywhere (CSP + privacy).

Output/review polish (Phase 4 of [docs/05-roadmap.md](docs/05-roadmap.md)):
a Review screen with per-section status and jump-to-fix warnings (missing
residuary clause, the Muslim one-third rule) between finishing the interview
and generating the will; a personal checklist derived from the answers
(nomination mismatches, unset digital access notes, "tell your executor");
a signing-instructions page appended to the generated will; JSON export/
import for moving a draft between devices without a backend; and a strict
`connect-src 'none'` CSP on the production build (dev keeps `'self'` for
Vite's HMR websocket).

**Malayalam (Phase 5)**: the full interview, all UI chrome, and the
generated-will clause templates are translated (`src/locales/ml/*.json`,
809 keys, zero missing, placeholder-token parity checked by
`src/i18n/malayalam.test.ts`). Two independent language toggles: one for
the interview/UI (landing page + header, sticky, switch anytime without
losing progress), and a separate one on the will screen for the *document
text itself*, which always defaults to English — the highest-stakes text
stays in the language with the most legal review. Selecting Malayalam for
the will shows a clear in-app notice that it's a draft translation pending
review by a Malayalam-speaking lawyer before anyone signs it. This is a
deliberate scope choice, not a technical limitation: the underlying
per-key-fallback i18n architecture makes flipping the default just as easy
once the Malayalam legal text has been professionally reviewed.

## Development

```bash
npm install
npm run dev        # local dev server
npm run test       # unit tests (engine, template, reducer)
npm run build      # production build
```

Deployed on Vercel (static build, no server) — `npm run build` output in `dist/`.

## Disclaimer

This tool produces a draft document and general information, not legal advice.
Users are advised to have the generated will reviewed by a lawyer, and the
generated document itself carries guidance on signing, witnessing, and optional
registration.
