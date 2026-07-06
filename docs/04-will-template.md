# 04 — Will Template (output layer)

The will is assembled from an **ordered list of clause blocks**. Each block
declares a `when` condition over the flat state (same DSL as the interview —
see [01-architecture.md §4.5](01-architecture.md)); blocks whose condition
fails simply vanish, and clause numbers are computed after filtering so the
document never shows gaps. Blocks may loop (`each`) over repeater arrays.

No question wording ever leaks into the will; no legal wording ever appears
in a question. The two layers meet only at the state object.

## Block schema

```jsonc
{
  "id": "clause.bequest.realestate.item",
  "part": "bequests",                       // ordering group
  "when": { "notEmpty": "realestate.items" },
  "each": "realestate.items",               // optional loop
  "text": { "en": "clause.re.item.en" },    // i18n key per locale; "ml" added later
  "fragments": {                            // nested conditionals inside the text
    "ownership": [
      { "when": { "eq": ["item.ownership", "sole"] },  "text": "clause.re.frag.sole.en" },
      { "when": { "in": ["item.ownership", ["joint", "ancestral"]] }, "text": "clause.re.frag.share.en" }
    ]
  }
}
```

Substitution: `{{answers.…}}`, `{{item.…}}` inside loops, `{{person(id).name}}`,
`{{label('q.id')}}` (option id → localized label at render time), and helper
formatters (`{{inr(amount)}}` → "₹ 5,00,000 (Rupees Five Lakh only)",
`{{fullDate(meta.date)}}`).

Pronoun/gender variants ("his/her", "son/daughter of") resolve from
`personal.relation_line` and person `relation` fields via a tiny inflection
table per locale — Malayalam will need its own table, which is why this is
data, not string concatenation.

---

## The assembled will, part by part

What follows is the **actual `en` clause copy** with its conditions.
Rendering conventions: A4, serif, 1.5 spacing, wide margins; UPPERCASE part
headings; clause numbers restart from 1 and run continuously; signature and
attestation blocks are kept unbreakable at the end.

### Part 0 — Title *(always)*

> **LAST WILL AND TESTAMENT OF {{personal.full_name}}**

### Part 1 — Declaration *(always)*

> I, **{{personal.full_name}}**{{frag: relation_line → ", son of {{X}}" /
> ", daughter of {{X}}" / ", wife of {{X}}" / ", husband of {{X}}" / ∅}},
> aged {{computedAge}} years{{frag: occupation → ", {{occupation}} by
> occupation"}}, residing at {{personal.address}}{{frag: id → ", holding
> {{idTypeLabel}} No. {{idValue}}"}}, do hereby declare this to be my LAST
> WILL AND TESTAMENT, made on this {{day}} day of {{month}}, {{year}} at
> {{place}}.
>
> 1. I declare that I am of sound mind, memory and understanding, and that I
>    make this Will voluntarily, of my own free will, without any coercion,
>    fraud or undue influence from any person.
> 2. I hereby revoke all Wills and Codicils heretofore made by me, and
>    declare this to be my last Will.
>    *(unchanged whether or not a prior will exists — protective boilerplate)*

### Part 2 — Family particulars *(when: people registry has spouse/children)*

> 3. My family consists of {{sentence-list: e.g. "my wife Anita, my son
>    Rahul (minor), and my daughter Meera"}}.
>    *(minor children flagged, feeding the guardianship part)*

### Part 3 — Executors

**Physical executor** *(when: executors.physical.primary exists — else a
fallback block appoints "the person my principal beneficiary nominates",
plus a review-screen warning)*:

> 4. I appoint **{{person.name}}** ({{relation}}, residing at {{address}})
>    as the Executor of this Will. If {{he/she}} is unable or unwilling to
>    act, I appoint **{{secondary.name}}** ({{relation}}) as Executor in
>    {{his/her}} place.

**Digital executor** *(when: executors.digital.same = "different")*:

> 5. I appoint **{{digital.primary.name}}** as my Digital Executor, to deal
>    with my digital assets, online accounts and electronic records as
>    directed in this Will, and I direct my Executor to extend all necessary
>    cooperation and authority to {{him/her}}. If {{he/she}} is unable to
>    act, **{{digital.secondary.name}}** shall act in {{his/her}} place.

*(when: same person → one sentence appended to clause 4: "My Executor shall
also act as my Digital Executor for the purposes of Part … below.")*

**Powers** *(always when an executor exists; extra text when EX5 = custom)*:

> 6. My Executor shall have full power to collect and realise my assets,
>    to sell or convert any asset where necessary to give effect to this
>    Will or to pay debts, to sign all documents, to engage professional
>    assistance, to compromise claims, and to do all things necessary for
>    the administration of my estate. {{frag: compensation → "My Executor
>    shall act without remuneration but shall be reimbursed all expenses" /
>    "shall be paid ₹{{amount}} from my estate" / "shall receive reasonable
>    compensation from my estate"}}.

### Part 4 — Debts first *(always)*

> 7. I direct my Executor to first pay from my estate my funeral expenses,
>    all my just debts, taxes and liabilities, and the costs of
>    administering my estate.

*(when: debts.items non-empty — loop)*:

> 8. Without limiting the above, I owe approximately the following, which I
>    direct to be settled: {{each item → "{{inr(amount)}} to {{lender}}
>    ({{typeLabel}})"}}. {{frag: insured → "The {{type}} is covered by loan
>    insurance, and I direct my Executor to first pursue that cover."}}
>    {{frag: secured strategy → "If necessary, the asset securing the
>    {{type}} may be sold to discharge it." / "I direct that the secured
>    asset be preserved and the loan discharged from my other assets so far
>    as possible."}}

*(when: funeral.cost = specific)*: appended sentence — "My funeral expenses
shall not exceed {{inr(amount)}}." *(modest → "shall be kept modest.")*

### Part 5 — Wishes (funeral, memorial, organs)

*(Part heading: "MY WISHES REGARDING MY REMAINS". Every clause here opens
with "I desire and direct that…" — expressive, addressed to family and
executor.)*

- *(funeral.method = burial)* → "…my body be buried at {{place-fragment:
  'our family burial ground at …' / 'the burial ground (qabristan) of
  {{mosque}}' / 'the cemetery of {{church}}' / 'a public burial ground near
  my residence' / '{{text}}' / 'a place convenient to my family'}},
  {{rites-fragment: 'with the customary rites of my faith' / 'with a simple
  ceremony and without elaborate ritual' / 'observing the following:
  {{text}}'}}."
- *(cremation)* → "…my body be cremated at {{place-fragment}}
  {{rites-fragment}}. {{ashes-fragment: 'My ashes shall be immersed at
  {{place}}.' / 'scattered at {{place}}.' / 'kept by my family.' / ∅}}"
- *(donate_science)* → "…my body be donated for medical education or
  research{{frag: ', preferably to {{institution}}' / ', to an institution
  my Executor selects'}}. If the donation cannot be accepted, {{fallback:
  burial/cremation clause above / 'my family shall decide'}}."
- *(family_decides)* → "…the arrangements for my remains be as my family
  decides."
- *(memorial answered)* → "As to any memorial, I wish for {{'observances
  according to the customs of my faith' / 'a simple gathering' / 'no
  ceremony'/ 'whatever my family decides'}}."
- *(funeral.notes)* → verbatim wish sentence.

**Organ donation** *(when: organ.wish = yes\_any | yes\_specific)*:

> I wish to donate {{'all organs and tissues that may benefit others' /
> 'my {{list}}'}} upon my death, and I request my family and physicians to
> give effect to this wish without delay{{frag: registered → ', in
> accordance with my donor pledge ({{details}})'}}. My funeral directions
> above apply to my remains thereafter.

*(organ.wish = no → "I do not wish to donate my organs." — stated expressly
so family isn't left guessing; family_decides → sentence to that effect.)*

### Part 6 — Guardianship *(when: guardianship answered)*

> I appoint **{{guardian.name}}** ({{relation}}, residing at {{address}})
> as the guardian of the person of my minor {{child/children
> {{names}}}}, in the event my spouse does not survive me or is unable to
> act. If {{guardian}} is unable or unwilling, I appoint
> **{{alternate.name}}** in {{his/her}} place.

*(property_guardian = different)*:

> I appoint **{{pg.name}}** as guardian of the property of my minor
> children. All property my minor children take under this Will shall be
> held and applied by the said guardian for their maintenance, education
> and benefit until each attains the age of {{18/21/25}} years, whereupon
> the remainder shall be transferred to them absolutely.

*(provision)* → "I direct my Executor to set apart {{inr(amount)}}
{{from-fragment}} for the care of my children, to be applied by the
guardian." *(upbringing text → "It is my wish that {{text}}.")*

*(dependent adults — loop)* → care clause naming carer, alternate, amount
set aside, and instructions.

### Part 7 — Specific bequests

*(Part heading: "SPECIFIC BEQUESTS". One clause per bequest, generated from
the repeater arrays, immovable first. The beneficiary/contingent tail is a
single shared fragment — the mirror of SF-BENEFICIARY/SF-CONTINGENT:)*

**Shared beneficiary tail** `frag.bequest.tail`:

> …to **{{person.name}}** ({{relation}}) absolutely. If {{he/she}} does not
> survive me, this bequest shall pass to {{'his/her children in equal
> shares' / '**{{alt.name}}** ({{relation}})' / 'my residuary estate'}}.

*(multi-person variant)*: "…to {{names}} {{'in equal shares' / 'in the
proportions {{list}}' / 'as follows: {{text}}'}}. If any of them does not
survive me, {{'his or her share shall pass to his or her children' / 'the
survivors shall take that share equally' / 'that share shall fall into my
residuary estate'}}." *(sell variant)*: "…I direct that it be sold and the
net proceeds be added to my residuary estate."

**Real estate** *(each realestate.items)*:

> I give and bequeath {{ownership-fragment: 'my property, namely' / 'all my
> share, right, title and interest in'}} **{{description}}** {{tail}}.
> {{frag: tenancy → 'The existing tenancy may continue, rents accruing to
> the beneficiary.'}} {{frag: loan → 'This property passes subject to
> clause {{n}} regarding the loan secured on it.'}}

*(life-interest variant)*:

> I give **{{occupant.name}}** the right to reside in and enjoy
> **{{description}}** for {{his/her}} lifetime, without power of sale, and
> upon {{his/her}} death the property shall pass absolutely to
> {{remainder-tail}}.

**Bank** — blanket clause *(bank.mode = all)* or per account *(each)*:

> I bequeath the balance in my {{type}} account with **{{bank}},
> {{branch}}** {{frag: last4 → '(No. ending {{last4}})'}} {{tail}}.

*(locker → contents clause; cash → "any cash held at my residence…" tail.)*

**Investments** — one clause per instrument group, same shapes; PPF/EPF/NPS
worded as *"I confirm the nominations made… and to the extent the balance
forms part of my estate, I bequeath it {{tail}}"*; insurance rendered as a
**record**, not a bequest: "I hold the following policies… the proceeds are
payable to the nominees under the respective policies; I direct my Executor
to notify the insurers and assist the claims."; crypto: "my virtual digital
assets, access instructions for which are kept {{location-fragment}},
{{tail / 'shall be realised and added to my residuary estate'}}."

**Receivables** *(each)* — collect variant: "The sum of {{inr(amount)}} due
to me from {{who}} shall be recovered and {{'added to my estate' / 'paid to
{{tail}}'}}." **Forgiveness variant**: "I forgive and release the debt of
{{inr(amount)}} owed to me by **{{who}}**, and direct that no claim be made
in respect of it."

**Vehicles / collectibles / jewellery / gadgets** *(each)* — "I bequeath my
{{description}} {{tail}}." Jewellery adds: *(list mode)* "…as per the signed
memorandum kept with this Will, which shall be read as part of it." /
*(spouse decides)* "…to be distributed as my {{wife/husband}} decides." A
one-line streedhan disclaimer renders when spouse exists: "For clarity,
jewellery and articles belonging to my {{wife/husband}} are {{hers/his}}
alone and do not form part of my estate."

**Intellectual property** *(each)* — "I bequeath all my rights, title and
interest in **{{what}}**, including copyrights/patent rights/trademark
rights and all royalties and future income, {{tail}}. {{frag: wishes → 'It
is my wish that {{text}}.'}}"

**Diaries** — bequest / "I direct my Executor to destroy my personal
diaries and journals unread." / review-first clause naming the person.

### Part 8 — Digital assets *(when: digital.gate ≠ skipped, else minimal clause)*

> **DIGITAL ASSETS.** I direct my {{Digital Executor/Executor}} to deal with
> my digital assets, accounts and records as follows, to the extent
> permitted by applicable law and the terms of the relevant services:

Then one lettered sub-clause per answered topic:

- *(subs)* "(a) cancel all my recurring subscriptions and memberships and
  claim refunds for my estate{{frag: exceptions loop → ', except {{name}},
  which shall be {{transferred to {{person}} / kept active for my family /
  cancelled}}'}};"
- *(statements)* "(b) I authorise my Executor to obtain from any bank or
  financial institution my statements of account and transaction history
  {{frag: narrow → 'so far as required to close my accounts and settle my
  liabilities'}};" *(no → block omitted)*
- *(social)* "(c) as to my social media accounts, {{'delete all' /
  'memorialise where the platform permits and delete the rest' / 'download
  my content and deliver it to {{person}}, then delete' / 'leave them
  unaltered' / per-platform list}};"
- *(email)* "(d) my email accounts shall be {{kept accessible for estate
  administration for a reasonable period not exceeding one year and then
  closed / closed / handed over to {{person}} / left unaltered}};"
- *(storage)* "(e) my files and cloud storage shall be {{reviewed by
  {{person}}, who shall preserve what is of value to my family and delete
  the rest / copied and delivered to {{person}} / deleted}};"
- *(photos)* "(f) my photographs shall be {{shared with my family / given to
  {{person}} / reviewed first by {{person}} / deleted}};"
- *(backup)* "(g) before any account is closed, the following shall be
  preserved and delivered to {{person}}: {{list}};"
- *(access)* "(h) instructions for access are kept {{'in a sealed envelope
  with my important papers' / 'via my password manager's emergency access' /
  'with {{person}}'}}; no password or key forms part of this Will."

### Part 9 — Residuary *(when: residuary answered; if skipped, omitted + hard warning at review)*

> **RESIDUARY ESTATE.** All the rest and residue of my estate, whether
> movable or immovable, present or future, including any property not
> specifically dealt with above and any bequest that fails, I give and
> bequeath to {{'my wife/husband {{name}}' / 'my children {{names}} in
> equal shares' / 'my spouse and children in equal shares' / '{{person}}' /
> '{{names + shares}}' / '{{charity}}, for its general purposes'}}.
> If none of the above survive me, my residuary estate shall pass to
> {{'{{alt person}}' / '{{alt charity}}' / 'my legal heirs as per the law
> applicable to me'}}.

### Part 10 — Personal-law compliance *(when: religion = muslim)*

> I am aware that under the Muslim personal law applicable to me,
> bequests exceeding one-third of my net estate, and bequests in favour of
> my legal heirs, take effect only with the consent of my heirs. The
> bequests in this Will are intended to operate within that rule, and to
> the extent any bequest exceeds it, it shall take effect only so far as my
> heirs consent after my death; the remainder of my estate shall devolve
> upon my heirs in accordance with that law.

### Part 11 — General *(always)*

> - This Will is executed in a single original. Any photocopy or draft
>   shall not be treated as my Will.
> - If any provision of this Will is held invalid, the remaining provisions
>   shall continue in full force.
> - Words importing one gender include the other as the context requires.

### Part 12 — Testimonium & signature *(always)*

> IN WITNESS WHEREOF I, **{{personal.full_name}}**, have signed this Will
> on this {{day}} day of {{month}}, {{year}} at {{place}}, in the joint
> presence of the witnesses below, who have attested it in my presence and
> in the presence of each other.
>
> {{signature line}} — **{{personal.full_name}}** (Testator)

### Part 13 — Attestation *(always)*

> **ATTESTATION**: Signed by the above-named Testator as {{his/her}} Last
> Will and Testament in our joint presence, and signed by us as witnesses
> in {{his/her}} presence and in the presence of each other, all being
> present at the same time. We believe the Testator to be of sound mind,
> memory and understanding.
>
> Witness 1 — Name / Address / Occupation / Signature
> Witness 2 — Name / Address / Occupation / Signature

*(Page footer on every page: "Page {n} of {N} — Will of {{name}} dated
{{date}} — Testator's initials: ____", implementing the sign-every-page
practice.)*

---

## Rendering pipeline

1. **Validate**: age ≥ 18, sound-mind confirmed; collect warnings
   (residuary missing, beneficiary-witness risk, Muslim ⅓ notice).
2. **Filter**: evaluate `when` on every block in declared order.
3. **Expand**: run `each` loops; resolve fragments; substitute variables;
   run inflection (gender/relation) and formatters (₹ words, dates).
4. **Number**: assign continuous clause numbers to numbered blocks.
5. **Emit**: HTML preview → print CSS for PDF; plain-text serialiser for
   copy (same tree, different writer). The signing-instructions page and
   the ⚑ personal checklist render as separate trailing pages.

## Malayalam note

Each clause's `ml` template will be an independently drafted Malayalam legal
text (not a machine rendering of the English), keyed identically, using the
same variables and its own inflection table. Because state stores only ids
and raw values, the *same draft* can be rendered in either language once
`locales/ml/clauses.json` exists and a Malayalam-capable font is embedded in
the PDF (Noto Sans Malayalam).
