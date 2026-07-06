# 02 — Legal Framework (India)

Everything the tool asks, and every clause it emits, is shaped by the rules
below. This document is the reference the question bank and clause templates
were drafted against. (The tool itself gives general information, not legal
advice, and says so.)

## 1. What makes a will valid in India

Governing statute: **Indian Succession Act, 1925 (ISA)**, primarily §§59–63.

| Requirement | Rule | How the tool handles it |
|---|---|---|
| Capacity | Testator must be **18+** and of **sound mind** (§59) | Age asked in Section 1; under-18 blocks generation with an explanation. Sound-mind declaration is a mandatory, non-skippable confirmation and appears in the opening clause |
| Free will | No coercion, fraud, undue influence (§61) | Declared in the opening clause |
| Writing & signature | Will must be signed (or thumb-marked) by the testator (§63) | Signature block generated; instructions say sign **every page** (best practice) |
| Attestation | **Two or more witnesses** must attest, each having seen the testator sign (§63(c)) | Attestation clause with two witness blocks; instructions explain the procedure |
| Stamp paper / notarisation | **Not required.** Plain paper is fine | Instructions say so explicitly (common misconception) |
| Registration | **Optional** (Registration Act 1908, §18) but useful evidence | Final screen explains how/where (Sub-Registrar) and the pros |
| Revocation | A later will revokes earlier ones; an express clause avoids doubt | Revocation clause always included; Section 1 asks about prior wills |
| Date | Not strictly mandatory but practically essential (latest will prevails) | Date and place fields in the testimonium |

### Witnesses and beneficiaries

Under ISA §67 a bequest to an attesting witness (or their spouse) is void —
and although §67 does not technically apply to Hindu, Buddhist, Sikh and
Jain testators (ISA §57 + Schedule III), having a beneficiary attest invites
challenge for everyone. The tool's rule: **generation-time check — if a
named beneficiary, executor-beneficiary, or guardian is likely to witness,
warn**; signing instructions state plainly that *witnesses must not be
beneficiaries* and ideally not the executor.

### Probate

Probate is mandatory only in limited cases (broadly: wills of Hindus etc.
made or with immovable property within the erstwhile Presidency towns —
Kolkata, Mumbai, Chennai; ISA §57/§213). Elsewhere (including Kerala) it is
optional. The final-instructions page mentions this in one paragraph.

## 2. Personal-law variations

Testamentary freedom differs by the testator's religion, which is why
Section 1 asks it (skippable, with a clear "why we ask").

- **Hindus, Buddhists, Jains, Sikhs, Christians, Parsis** — full freedom to
  will away self-acquired property to anyone.
- **Muslims** — a will (wasiyat) is governed by personal law, not ISA
  formalities (it can even be oral, though writing is strongly advised):
  1. Only up to **one-third** of the net estate (after debts and funeral
     expenses) may be bequeathed without the consent of legal heirs.
  2. A bequest **to a legal heir** requires the consent of the other heirs
     (Sunni position: consent after death; Shia: the one-third to anyone,
     including an heir, without consent).
  3. The remaining two-thirds devolve by Islamic inheritance shares.

  The tool's handling: when religion = Muslim, (a) show a one-time notice
  explaining the one-third rule, (b) insert an adapted compliance clause in
  the will ("bequests herein are intended to operate within the one-third…
  to the extent any bequest exceeds… it shall take effect only with the
  consent of my legal heirs"), (c) keep all questions available — the tool
  never blocks, it informs.

- **Ancestral / coparcenary property** — a Hindu can will only their own
  undivided share, not the whole. The real-estate flow asks ownership type
  and adjusts the clause to "my share, right, title and interest in…".

## 3. What a will can direct vs. only express

The tool covers both, but the generated text is honest about which is which.

**Binding dispositions:** property of every kind (immovable, movable,
financial, IP), appointment of executor(s), appointment of a testamentary
guardian for minor children (Hindu Minority & Guardianship Act 1956 §9;
Guardians & Wards Act 1890), forgiveness of debts owed to the testator,
residuary disposition.

**Wishes / directions to family & executor (not enforceable as property
dispositions):** funeral, cremation/burial place and rites, memorial
preferences, organ/body donation, treatment of diaries, social-media
handling. These are drafted as *"I desire and direct…"* wish clauses in a
distinct part of the will, plus practical notes (e.g. organ donation happens
within hours of death — the will is usually read later, so the tool tells
the user to also inform family now and register a donor pledge).

## 4. Nominee vs. will

For most assets (bank accounts, mutual funds, shares, PF), a **nominee is a
trustee/receiver — the will prevails** for beneficial ownership. Exceptions
where nomination effectively wins or has special status: insurance under the
**Married Women's Property Act 1874** policies, and (per case law) some
instruments treat the nominee as owner. The tool: every financial-asset flow
asks whether a nomination exists and, on mismatch, adds a to-do in the final
checklist — "align your nominations with this will to spare your family
disputes." Insurance proceeds questions are framed as *recording* policies
for the executor rather than re-bequeathing them.

## 5. Other doctrines the flows respect

- **Only your own property.** Joint assets → only the testator's share.
  A wife's *streedhan* (her jewellery/gifts) is hers — the jewellery section
  reminds the testator to include only their own.
- **Contingent (alternate) beneficiaries.** Every major bequest asks "if
  they don't survive me" — defaults to the residuary estate, avoiding lapse.
- **Residuary clause is non-negotiable in spirit.** If skipped, generation
  shows a strong warning (partial intestacy) and the review screen keeps a
  persistent nudge.
- **Debts before legacies.** Funeral costs, debts and taxes are paid from
  the estate first (standard direction clause, always included).
- **Executor.** Not mandatory in law but practically essential; the tool
  asks for a primary and an alternate, plus a separate *digital executor*
  (no statutory concept in India — drafted as an executor's delegate with
  specific authority over digital assets, which is the accepted drafting
  practice).
- **Digital assets.** No Indian statute governs digital estates. Clauses
  are drafted as (a) bequests where there is property value (crypto, domain
  names, monetised channels/IP) and (b) authority + instructions to the
  digital executor for the rest (accounts, storage, subscriptions). The IT
  Act and platform ToS limit what's transferable — the text authorises the
  executor to act "to the extent permitted by applicable law and the
  service's terms".
- **No passwords in the will.** A will may become a public document
  (probate/registration). The tool only ever references an external,
  updatable "access instructions" location (e.g. sealed envelope, password
  manager's emergency access).

## 6. Structure of the generated will

Indian wills follow a conventional shape; the clause blocks in
[04-will-template.md](04-will-template.md) assemble in this order:

1. Title — LAST WILL AND TESTAMENT OF [NAME]
2. Declaration — identity (name, s/o–d/o–w/o, age, address, ID), sound mind,
   free volition, revocation of prior wills/codicils
3. Family particulars
4. Appointment of executor(s) and digital executor(s), powers
5. Direction to pay funeral expenses, debts and taxes first
6. Wishes — funeral, memorial, organ/body donation
7. Guardianship of minor children / dependents
8. Specific bequests — immovable property, then movable (bank, investments,
   receivables, vehicles, jewellery, valuables, IP, personal effects,
   gadgets)
9. Digital assets — bequests + executor authority + account directions
10. Residuary clause (with contingent residuary)
11. Personal-law compliance clause (conditional — Muslim testators)
12. General — single original, prior drafts void, severability
13. Testimonium — signature, date, place
14. Attestation — two witnesses (names, addresses, signatures)

## 7. The final-instructions page (generated alongside the will)

A one-page checklist the user downloads with the will: print single-sided →
sign every page + full signature at the end → two adult witnesses, not
beneficiaries, sign in your and each other's presence → optional doctor's
fitness certificate (recommended for senior testators — pre-empts
sound-mind challenges) → optional registration at the Sub-Registrar →
store the original safely; tell the executor where it is → review after
major life events (marriage, divorce, births, big purchases) → align
nominations (auto-lists the mismatches detected during the interview).
