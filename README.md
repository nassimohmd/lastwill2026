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

Implemented so far (Phases 1–2 of [docs/05-roadmap.md](docs/05-roadmap.md)):
personal details & declaration, funeral/organ wishes, bank accounts (all-together
or account-by-account), real estate (incl. life interest), the residuary clause,
and executors (physical + digital) — enough to generate a legally complete will
for a simple estate. The shared sub-flow machinery (SF-PERSON/BENEFICIARY/
CONTINGENT/SHARES) and the flow-repeater engine that this is built on are meant
to carry the remaining sections (investments, receivables, vehicles, jewellery,
digital assets, guardianship...) in Phase 3 without further engine changes.

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
