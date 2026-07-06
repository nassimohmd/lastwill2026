# 03 — Question Flows (complete question bank)

This is the full interview: every question, its answer options, and where
each answer leads. Question and option wording below is the actual `en`
copy — short, plain, second person where natural.

### Notation

- `id` in backticks is the state key; **Q-text in bold**; options as bullets.
- `→ X` = next question. Options without an arrow fall through to the
  question's **default next** (the next line item in the section).
- Every question also has **Skip** (not repeated below). Skip behaviour:
  records the skip, then goes to the question's default next. Skipping a
  **gate** question (marked ⛩) skips the whole section/topic.
- `[text]`, `[number]`, `[date]` = free input steps. Free inputs are used
  only where a choice can't work (names, places, amounts) and are optional
  wherever marked *(optional)*.
- ▸ `SF-…(context)` = invoke a shared sub-flow (§0) and store its result at
  the given key.
- All labels are i18n keys in the implementation; literal English shown here
  for readability.

---

## §0 Shared sub-flows

These four sub-flows are defined once and reused everywhere — this is how
~180 questions cover thousands of effective branch paths.

### SF-PERSON — "choose a person"

**Who?**
- *(one option per person already in the People Registry: "Anita — wife")*
- Someone else → **Their name?** [text] → **Their relationship to you?**
  - Wife / Husband / Son / Daughter / Father / Mother / Brother / Sister /
    Grandchild / Other relative / Friend / Other → person saved to registry
  → *(if used for executor/guardian)* **Their address?** [text] *(optional,
  recommended — helps identify them in the will)*

### SF-BENEFICIARY(asset) — "who receives this"

**Who should receive {asset}?**
- One person → ▸ SF-PERSON → ▸ SF-CONTINGENT(person, asset)
- More than one person → **Who all?** *(multi-pick via SF-PERSON, 2–8)* →
  ▸ SF-SHARES → ▸ SF-CONTINGENT(group, asset)
- Sell it, and add the money to my estate → *(proceeds flow to residuary;
  no contingent needed)*
- Let it pass with the rest of my estate *(residuary — also the effect of
  Skip)*

### SF-CONTINGENT(person/group, asset) — "if they don't survive you"

**If {name} passes away before you, {asset} should go to:**
- {Name}'s children
- Someone else → ▸ SF-PERSON *(one level only — the alternate's fallback is
  always the residuary estate; the engine does not nest contingents)*
- The rest of my estate *(residuary — also the effect of Skip)*

For a **group**, the question reads: **If any of them passes away before
you, their share should:**
- Go to their children
- Be shared by the others
- Go back to the rest of my estate *(also Skip)*

### SF-SHARES(group) — "how to divide"

**How should it be divided?**
- Equally
- I'll set percentages → *(one [number] per person; must total 100 — the UI
  live-validates)*
- I'll describe it → [text] *(e.g. "the house to Anita, the shop to Rahul")*

---

## Chapter 1 · You & Your Family

### Section 1 — Personal details & declaration (`personal.*`)

**PD1** `personal.full_name` — **Your full legal name?** [text]
*(not skippable — the only mandatory field besides PD10)*

**PD2** `personal.relation_line` — **This will describes you as:**
*(Indian wills identify the testator through a parent or spouse)*
- Son of → **Father's name?** [text]
- Daughter of → **Father's name?** [text]
- Wife of / Husband of → **Spouse's name?** [text] *(seeds registry)*
- Skip this style *(clause omits the line)*

**PD3** `personal.dob` — **Your date of birth?** [date]
→ if computed age < 18: ⚠ interstitial — "You must be 18 or older to make a
valid will in India." *(interview can continue; generation is blocked)*

**PD4** `personal.address` — **Your current residential address?** [text]

**PD5** `personal.id_type` ⛩ — **An ID to identify you by?** *(optional but
makes the will harder to dispute)*
- Aadhaar → **Last 4 digits?** [text]
- PAN → **PAN number?** [text]
- Passport → **Passport number?** [text]
- Voter ID → **Number?** [text]
- No ID in the will → PD6

**PD6** `personal.religion` — **Your religion?** *(asked because inheritance
law in India differs by religion — see the "why" note on the card)*
- Hindu · Muslim · Christian · Sikh · Jain · Buddhist · Parsi · Other /
  prefer not to say
- → if **Muslim**: info card **PD6a** — explains the one-third rule
  (bequests beyond ⅓ of the estate need your heirs' consent) and that a
  compliance clause will be added. Single button: "Understood."

**PD7** `personal.marital_status` — **Marital status?**
- Married → **Spouse's name?** [text] *(if not already from PD2; seeds
  registry)* → PD8
- Unmarried → PD8
- Widowed → PD8
- Divorced → PD8
- Separated → PD8

**PD8** `personal.children` ⛩ — **Do you have children?**
- Yes → **PD8a** repeater: **Child's name?** [text] → **Son or daughter?**
  → **Are they under 18?** (Yes / No) → **Add another child?** (Yes → loop /
  No) *(all children seed the registry; "under 18 = yes" arms the
  guardianship section)*
- No

**PD9** `personal.prior_will` — **Have you made a will before?**
- Yes → **PD9a — What should happen to it?**
  - Cancel it — this will replaces it *(standard; revocation clause names
    "all earlier wills")*
  - I meant to only update it → info card: this tool always produces a
    complete fresh will that supersedes earlier ones — safer than a codicil.
- No *(revocation clause still included as boilerplate — harmless and
  protective)*

**PD10** `personal.sound_mind` — **Confirm: you are making this will
voluntarily, of your own free will, and you are of sound mind.**
- I confirm *(not skippable; required before generation)*

**PD11** `personal.occupation` — **Your occupation?** [text] *(optional —
used only in the identity line)*

---

## Chapter 2 · Final Wishes

### Section 2 — Funeral & memorial (`funeral.*`)

**FN1** `funeral.method` ⛩ — **What should be done with your body?**
- Burial → FN2
- Cremation → FN4
- Donate my body to medical science → FN7
- Let my family decide → FN9

**FN2** `funeral.burial.place` — **Where should you be buried?**
*(options adapt to PD6: the matching religious option is listed first)*
- Our family burial ground → FN2a **Where is it?** [text] *(optional)*
- Mosque burial ground (qabristan) → FN2a **Which mosque?** [text] *(optional)*
- Church cemetery → FN2a **Which church?** [text] *(optional)*
- A public burial ground near my home
- A specific place → [text]
- Wherever is practical for my family

**FN3** `funeral.burial.rites` — **Religious rites for the burial?**
- According to the customs of my faith
- Keep it simple — no elaborate ceremony
- I have specific wishes → [text]
→ FN9

**FN4** `funeral.cremation.place` — **Where should the cremation take place?**
- The local crematorium
- A specific place → [text] *(e.g. a particular ghat or riverside)*
- Wherever is practical for my family

**FN5** `funeral.cremation.rites` — **Rites for the cremation?**
- According to the customs of my faith
- Keep it simple — no elaborate ceremony
- I have specific wishes → [text]

**FN6** `funeral.cremation.ashes` — **And your ashes?**
- Immersed → **Where?** [text] *(e.g. "the Bharathappuzha at Thirunavaya")*
- Scattered at a place → [text]
- Kept by family
- No preference
→ FN9

**FN7** `funeral.body_donation.institution` — **Do you have an institution
in mind?**
- Yes → **Which one?** [text] *(e.g. a medical college)*
- No — my executor should arrange it

**FN8** `funeral.body_donation.fallback` — **If the donation can't be
accepted** *(institutions sometimes decline)* **, then:**
- Burial → FN2 *(then returns to FN9)*
- Cremation → FN4 *(then returns to FN9)*
- Family decides
*(info note on card: body donation requires prior registration and family
cooperation — tell your family now; the will alone acts too late)*

**FN9** `funeral.memorial` — **Any memorial or gathering afterwards?**
- According to the customs of my faith *(e.g. prayer meeting / adiyanthiram
  / chehlum / requiem as applicable)*
- A simple gathering, nothing formal
- No ceremony, please
- Family decides

**FN10** `funeral.cost` — **A limit on funeral spending?**
- Keep it modest
- Spend whatever is customary
- A specific limit → [number] ₹

**FN11** `funeral.notes` — **Anything else about your final rites?** [text]
*(optional)*

### Section 3 — Organ donation (`organ.*`)

*(Section auto-skipped with a note if FN1 = donate to science — whole-body
donation and organ donation are mutually exclusive in practice.)*

**OD1** `organ.wish` ⛩ — **Would you like to donate your organs?**
- Yes — any organs and tissues that can help someone
- Yes — only specific organs → **OD1a Which?** *(multi)*: Eyes/corneas ·
  Kidneys · Heart · Liver · Lungs · Pancreas · Skin · Bones/tissue
- No
- Family decides

**OD2** *(if OD1 = yes-any / yes-specific)* `organ.registered` — **Are you
registered as an organ donor?** *(e.g. a NOTTO donor pledge)*
- Yes → **Pledge/registration details?** [text] *(optional)*
- No → info card: the will is usually read *after* the window for donation —
  register a pledge and tell your family now. The will still records the
  wish.

**OD3** *(if OD1 = yes)* `organ.after` — info card: **After donation, your
funeral wishes from the previous section apply to the rest.** "Understood."

---

## Chapter 3 · Your Dependents

### Section 4 — Guardianship (`guardianship.*`)

*(Section is offered when the registry has a child under 18 (PD8a) — else
GD1 still appears once, as a catch-all for other dependents.)*

**GD1** `guardianship.gate` ⛩ — **Is anyone dependent on your care?**
- Yes — my minor children *(pre-ticked if PD8a found minors)*
- Yes — a dependent adult (a parent, or a family member with special needs)
- Yes — both
- No

**— Minor children branch —**

**GD2** `guardianship.same_for_all` *(only if 2+ minors)* — **Same guardian
for all your children?**
- Yes → GD3 (once)
- Choose per child → GD3 repeats per child

**GD3** `guardianship.primary` — **Who should raise {child/them} if neither
parent can?** ▸ SF-PERSON *(address requested)*

**GD4** `guardianship.alternate` — **And if {guardian} can't?** ▸ SF-PERSON

**GD5** `guardianship.property_guardian` — **Who should manage the money and
property your children inherit until they come of age?**
- The same guardian
- A different person → ▸ SF-PERSON *(separating care from money is a common
  safeguard — help text says so)*

**GD6** `guardianship.until_age` — **They should receive their inheritance
outright at age:**
- 18 · 21 · 25
*(help: until then the property guardian holds and applies it for their
benefit — education, health, maintenance)*

**GD7** `guardianship.upbringing` — **Any wishes about their upbringing?**
[text] *(optional — education, values, staying together, religion)*

**GD8** `guardianship.provision` — **Set aside money specifically for their
care?**
- Yes, an amount → [number] ₹ → **From where?** — My bank balances / Sale of
  an asset (describe → [text]) / Executor decides
- My general estate will cover it
- No

**— Dependent adult branch —** *(repeater per dependent)*

**GD9** `guardianship.dependents[]` — **Who depends on you?** ▸ SF-PERSON
→ **GD10 Who should look after them?** ▸ SF-PERSON →
**GD11 And if that person can't?** ▸ SF-PERSON →
**GD12 Set aside money for their care?** — Yes → [number] ₹ / My general
estate will cover it / No →
**GD13 Any care instructions?** [text] *(optional — routines, medical needs)*

---

## Chapter 4 · Money & Property

### Section 5 — Debts & liabilities (`debts.*`)

*(A standard clause — funeral costs, debts and taxes are paid from the
estate first — is always in the will. This section adds specifics.)*

**DB1** `debts.gate` ⛩ — **Do you currently owe money to anyone — banks or
people?**
- Yes → DB2
- No
- Not sure → info card: the executor gets standing authority to discover and
  settle debts; you can still list what you remember → DB2

**DB2** `debts.types` — **What kinds?** *(multi)*
- Home loan · Vehicle loan · Personal loan · Gold loan · Credit cards ·
  Money borrowed from a person · Other EMIs / dues → DB3 repeats per
  selected kind

**DB3** `debts.items[]` *(repeater per debt)* —
**DB3a Lender / who you owe?** [text] →
**DB3b Roughly how much?** [number] ₹ *(optional)* →
**DB3c** *(loans only)* **Is it insured?** *(many home/vehicle loans carry
loan-cover insurance that repays on death)*
- Yes → clause directs executor to claim the insurance first
- No / Not sure
→ **DB3d** *(secured loans only)* **If the estate's cash can't cover it:**
- Sell the pledged/mortgaged asset if needed
- Try to keep the asset — pay from other assets first
- Executor decides

**DB4** `debts.person_note` *(if "money borrowed from a person" chosen)* —
info card: **These are often undocumented — naming them here makes sure
they're honoured.** Repeater DB3 collects person + amount.

### Section 6 — Bank accounts & money (`bank.*`)

**BK1** `bank.gate` ⛩ — **Do you have bank accounts?**
- Yes → BK2
- No → BK7

**BK2** `bank.mode` — **How do you want to deal with them?**
- All accounts together, to the same people → ▸ SF-BENEFICIARY("the money in
  all my bank accounts") → BK5
- Account by account → BK3

**BK3** `bank.accounts[]` *(repeater per account)* —
**BK3a Bank name?** [text] →
**BK3b Branch?** [text] *(optional)* →
**BK3c Account type?** — Savings · Current · Joint → *(if Joint)* **With
whom?** ▸ SF-PERSON *(help: only your share of a joint account passes under
the will)* →
**BK3d Last 4 digits?** [text] *(optional — never the full number)* →
**BK3e** ▸ SF-BENEFICIARY("the money in this account") →
**BK3f Does this account have a nominee?**
- Yes — the same person as above
- Yes — someone else → ⚑ flagged: final checklist will say "update this
  nomination to match the will" *(help: the will prevails, but mismatches
  cause hassle for your family)*
- No / Not sure → ⚑ checklist: "add a nomination"

**BK4** `bank.add_more` — **Add another account?** Yes → BK3 / No → BK5

**BK5** `bank.locker` ⛩ — **Do you have a bank locker?**
- Yes → **BK5a Which bank/branch?** [text] → **BK5b What's mostly in it?**
  *(multi)* — Jewellery *(→ handled in the Jewellery section; noted)* ·
  Documents · Cash · Valuables → **BK5c Who should receive the locker's
  contents (except items you give away elsewhere in this will)?**
  ▸ SF-BENEFICIARY("the contents of my locker")
- No

**BK6** `bank.cash` — **Cash kept at home or elsewhere?**
- Yes → ▸ SF-BENEFICIARY("cash held at home")
- No

**BK7** *(section end)*

### Section 7 — Investments (`invest.*`)

**IV1** `invest.gate` ⛩ — **Which of these do you have?** *(multi)*
- Shares / demat account
- Mutual funds
- Fixed / recurring deposits
- PPF / EPF / NPS (retirement funds)
- Life insurance policies
- Bonds / gold bonds (SGB)
- Chit funds
- Crypto / digital assets of value
- None of these → section ends

*(Each selected type opens its mini-flow; unselected are skipped.)*

**IV2 Shares & demat** — **One bequest for all, or split?**
- All my shares/demat holdings → ▸ SF-BENEFICIARY
- Split → repeater: **Which holding/company or demat account?** [text] →
  ▸ SF-BENEFICIARY each
→ **IV2a Nominee on the demat account?** — Matches / Different ⚑ / None ⚑

**IV3 Mutual funds** — same shape as IV2 (all / per folio) → nominee check ⚑

**IV4 FDs / RDs** — repeater: **Bank & rough amount?** [text] →
▸ SF-BENEFICIARY each — or **All my deposits together** → ▸ SF-BENEFICIARY
→ nominee check ⚑

**IV5 PPF / EPF / NPS** — info card first: **these usually pay the nominee
directly; recording them here guides your executor and heirs.** →
**Which do you hold?** *(multi: PPF · EPF · NPS)* → per pick: **Nominee up
to date?** — Yes / No ⚑ / Not sure ⚑ → **Who should ultimately benefit?**
▸ SF-BENEFICIARY *(clause words this as an expression of intent alongside
the nomination)*

**IV6 Insurance** — repeater per policy: **Insurer & policy type?** [text]
→ **Sum assured?** [number] ₹ *(optional)* → **Nominee set?** — Yes / No ⚑
→ info card: **policy money goes to the nominee under insurance law; the
will records the policies so nothing is missed.** *(No SF-BENEFICIARY here —
deliberately, to avoid drafting a conflict.)*

**IV7 Bonds / SGB** — **All together?** → ▸ SF-BENEFICIARY *(or repeater
per bond)*

**IV8 Chit funds** — repeater: **Which chit / foreman?** [text] → **Paid-up
or prized?** — Still paying · Prized (money due to me → also counted under
Receivables) → ▸ SF-BENEFICIARY("my interest in this chit")

**IV9 Crypto** — **What should happen to it?**
- Transfer to a person → ▸ SF-PERSON → ▸ SF-CONTINGENT
- Sell and add to my estate
- Executor decides
→ **IV9a Where will your executor find access instructions?** *(never the
keys themselves — a will can become public)*
- A sealed envelope kept with my important papers
- My password manager's emergency access
- A trusted person knows → ▸ SF-PERSON
- I'll set this up later ⚑ checklist

### Section 8 — Receivables (money owed *to* you) (`receivables.*`)

**RC1** `receivables.gate` ⛩ — **Does anyone owe you money?**
- Yes → RC2
- No

**RC2** `receivables.items[]` *(repeater)* —
**RC2a Who?** [text] →
**RC2b Roughly how much?** [number] ₹ →
**RC2c Any written proof?** — Promissory note / written agreement · Bank
transfer records · It's informal *(help: informal loans are hard to recover;
naming them here at least authorises the executor to pursue)* →
**RC2d What should happen?**
- Collect it — it joins my estate
- Collect it and give it to a specific person → ▸ SF-PERSON → ▸ SF-CONTINGENT
- **Forgive it** — they owe nothing after me *(a will can legally forgive a
  debt — clause drafts a release)*
→ **RC2e Add another?** Yes → loop / No

### Section 9 — Real estate (`realestate.*`)

**RE1** `realestate.gate` ⛩ — **Do you own any land or buildings?**
- Yes → RE2
- No

**RE2** `realestate.items[]` *(repeater per property)* —

**RE2a Type?** — House · Flat / apartment · House plot · Agricultural land ·
Commercial property · A share in family/ancestral property

**RE2b Describe it** [text] — address / survey number / extent *(help: enough
detail that a stranger could identify it — e.g. "12 cents & house, Sy.No
231/4, Vengara village")*

**RE2c Ownership?**
- Only mine
- Joint → **With whom?** ▸ SF-PERSON → *(clause becomes "my share, right,
  title and interest in…")*
- Ancestral / inherited share → info card: **you can will only your own
  share of ancestral property** → clause adjusts as above

**RE2d What should happen to it?**
- Give it to one person → ▸ SF-PERSON → ▸ SF-CONTINGENT
- Divide it among people → SF-PERSON multi → ▸ SF-SHARES → ▸ SF-CONTINGENT
- **Let someone live there for life, then pass it on** → **Who lives
  there?** ▸ SF-PERSON *(typically a spouse or parent)* → **And after
  them?** ▸ SF-PERSON/group → *(life-interest clause)*
- Sell it and distribute the money → ▸ SF-BENEFICIARY("the sale proceeds")
- Let it pass with the rest of my estate

**RE2e Is it rented out / occupied?**
- Yes → **Instructions?** — Continue the tenancy, rents to the new owner ·
  New owner decides · [text]
- No

**RE2f Any loan against it?** — Yes *(linked to Debts: clause notes the
property passes subject to the executor settling the loan per DB3d)* · No

**RE2g Add another property?** Yes → RE2 / No

### Section 10 — Vehicles (`vehicles.*`)

**VH1** `vehicles.gate` ⛩ — **Do you own any vehicles?**
- Yes → VH2
- No

**VH2** `vehicles.items[]` *(repeater)* —
**VH2a Type?** — Car · Motorcycle / scooter · Commercial vehicle · Other →
**VH2b Make & model?** [text] → **VH2c Registration number?** [text]
*(optional)* →
**VH2d What should happen to it?**
- Give it to a person → ▸ SF-PERSON → ▸ SF-CONTINGENT
- Sell it — money joins my estate
- Family decides
→ **VH2e Loan on this vehicle?** — Yes *(→ Debts linkage, as RE2f)* · No
→ **VH2f Another vehicle?** Yes → loop / No

---

## Chapter 5 · Personal Belongings

### Section 11 — Collectibles & valuables (`collect.*`)

**CL1** `collect.gate` ⛩ — **Any valuables or collections?** *(multi)*
- Art · Antiques · Watches · Coins / stamps · Books · Musical instruments ·
  Electronics of value · Other → CL2
- Nothing significant → section ends

**CL2** `collect.mode` — **Give specific items to specific people, or deal
with them together?**
- Specific items → **CL3** repeater: **Describe the item** [text] →
  ▸ SF-PERSON → ▸ SF-CONTINGENT → **Another item?** → after loop, **CL4
  And everything else in your collections?** — One person → ▸ SF-PERSON ·
  Family shares them out · Sell, money to estate · Rest of my estate
- All together → ▸ SF-BENEFICIARY("my collections and valuables")

### Section 12 — Jewellery (`jewellery.*`)

**JW1** `jewellery.gate` ⛩ — **Do you own jewellery?** *(help: only your
own — a spouse's jewellery, including streedhan, is theirs and doesn't
belong in your will)*
- Yes → JW2
- No

**JW2** `jewellery.kept` — **Where is it kept?** *(multi)*
- At home · Bank locker *(links to BK5)* · With a family member → **Who?**
  ▸ SF-PERSON

**JW3** `jewellery.mode` — **How should it be given?**
- All of it to one person → ▸ SF-PERSON → ▸ SF-CONTINGENT
- Divided among people → SF-PERSON multi → ▸ SF-SHARES *(equal by weight or
  value — help text)* → ▸ SF-CONTINGENT
- Specific pieces to specific people → **JW4** repeater: **Describe the
  piece** [text] *(e.g. "my mother's gold chain, ~4 sovereigns")* →
  ▸ SF-PERSON → ▸ SF-CONTINGENT → loop → **JW5 And the remaining
  jewellery?** — One person → ▸ SF-PERSON · Divided equally among the same
  people · Rest of my estate
- As per a list I keep with this will → info card: **sign and date that
  list; the will refers to it** *(memorandum clause)*
- My spouse decides

### Section 13 — Intellectual property (`ip.*`)

**IP1** `ip.gate` ⛩ — **Have you created anything that earns or could earn —
books, music, inventions, brands, software, online content?** *(multi)*
- Books / writing (royalties)
- Music / art
- Patents / inventions
- Trademarks / brand names
- Software / code
- Monetised online content (YouTube channel, blog…)
- None → section ends

**IP2** *(per selected type)* — **IP2a What is it?** [text] *(title,
registration no., channel name…)* → **IP2b Who should own the rights and
future income?**
- One person → ▸ SF-PERSON → ▸ SF-CONTINGENT
- Split among people → SF-SHARES → ▸ SF-CONTINGENT
- My executor manages it; income to my estate
→ **IP2c Any wishes on how it's used?** [text] *(optional — e.g. "keep the
book in print", "don't sell the trademark")*

### Section 14 — Diaries & journals (`diaries.*`)

**DJ1** `diaries.gate` ⛩ — **Do you keep personal diaries, journals or
letters?**
- Yes → DJ2
- No

**DJ2** `diaries.action` — **What should happen to them?**
- Give them to someone → ▸ SF-PERSON → ▸ SF-CONTINGENT("they should be
  destroyed unread / kept by family / …" — mini-pick)
- **Destroy them unread** *(clause directs the executor personally)*
- Let someone read them first, then decide → ▸ SF-PERSON
- Keep them with the family
- Family decides

**DJ3** `diaries.notes` — **Anything specific — certain volumes, letters, or
people who should or shouldn't see them?** [text] *(optional)*

### Section 15 — Gadgets & devices (`gadgets.*`)

**GA1** `gadgets.gate` ⛩ — **Your devices — phone, laptop, tablet, camera…
what should generally happen to them?**
- Wipe them and give them to family
- Sell them; money to my estate
- Specific devices to specific people → **GA2** repeater: **Which device?**
  [text] → ▸ SF-PERSON → ▸ SF-CONTINGENT → loop → **GA2b And the rest?** —
  Wipe & give to family · Sell · Recycle responsibly
- Recycle them responsibly
- Family decides

**GA3** `gadgets.data` — **Before anything is given away or sold, the data
on them should be:**
- Backed up first, then wiped *(links to Digital Life — DA7 decides what's
  backed up and who gets it)*
- Wiped without backup
- Handed over as-is *(help: means the receiver may see everything)*

---

## Chapter 6 · Digital Life (`digital.*`)

**DA1** `digital.gate` ⛩ — **Shall we go through your digital life —
accounts, subscriptions, photos, files?**
- Yes → DA2
- Nothing important there → **DA1a** minimal fallback: a single clause
  authorising the executor to close accounts and cancel subscriptions.
  → section ends

**DA2 Subscriptions** `digital.subs` — **Your recurring subscriptions and
memberships (OTT, cloud, apps, gym, clubs…)?**
- Cancel them all; claim any refunds for my estate *(default clause)*
- Cancel all, but a few need care → **DA2a** repeater: **Which one?** [text]
  → **Do what?** — Transfer to someone → ▸ SF-PERSON · Keep active for
  family · Cancel
- Family decides

**DA3 Statements consent** `digital.statements` — **May your executor obtain
your bank/card statements and transaction history to settle your estate?**
*(help: banks ask for explicit authority; this clause provides it)*
- Yes — full consent *(clause: executor may request statements, transaction
  history and account information from any bank/institution)*
- Yes, but only for closing accounts and paying debts *(narrower clause)*
- No

**DA4 Social media** `digital.social` — **Your social media accounts?**
- Delete them all
- Memorialise where possible, delete the rest *(help: Facebook/Instagram
  offer memorial accounts)*
- Download my content for family, then delete → **Who receives the
  archive?** ▸ SF-PERSON
- Leave them as they are
- Decide per platform → **DA4a** repeater: **Platform?** — Facebook ·
  Instagram · X/Twitter · YouTube · LinkedIn · WhatsApp · Other [text] →
  **Do what?** — Delete · Memorialise · Archive to family → ▸ SF-PERSON ·
  Leave it
→ **DA4b** info card: **set up each platform's legacy tools now (Facebook
Legacy Contact, Google Inactive Account Manager…) — they work faster than a
will.** ⚑ checklist

**DA5 Email** `digital.email` — **Your email accounts?**
- Keep them open briefly for estate matters, then delete *(clause: executor
  may access to the extent the provider permits, for up to ~1 year)*
- Delete them
- Hand over to someone → ▸ SF-PERSON
- Leave as-is

**DA6 Storage & files** `digital.storage` — **Files on your computer and in
cloud drives?**
- A trusted person should review, keep what matters, delete the rest →
  ▸ SF-PERSON → ▸ SF-CONTINGENT
- Copy everything for family → **Who receives it?** ▸ SF-PERSON
- Delete everything
- Family decides

**DA7 Photos** `digital.photos` — **Your photos — on devices and in the
cloud?**
- Share copies with my family *(clause names the digital executor to
  distribute)*
- Give them to one person → ▸ SF-PERSON → ▸ SF-CONTINGENT
- A trusted person reviews first, deletes what's private → ▸ SF-PERSON
- Delete them all
- Family decides

**DA8 Other data to preserve** `digital.backup` — **Anything else worth
backing up before accounts close?** *(multi)*
- Call history · SMS / chat exports · Emails · Documents (IDs, records) ·
  Contacts · Nothing else
→ *(if any picked)* **DA8a Who should receive these backups?** ▸ SF-PERSON

**DA9 Access** `digital.access` — **Where will your digital executor find
your access instructions?** *(never typed into this tool — a will can become
a public document)*
- A sealed envelope with my important papers
- My password manager's emergency access
- A trusted person already knows → ▸ SF-PERSON
- Nowhere yet ⚑ checklist: "create an access note — without it most of these
  wishes stall"

---

## Chapter 7 · Everything Else

### Section 16 — Residuary clause (`residuary.*`)

*(Intro card: **everything you haven't specifically given away — including
anything you acquire after signing, and any gift that fails — passes under
this clause. It's the safety net of the will.** This section is skippable
like all others, but skipping triggers a strong warning at review:
"Without this, anything not named is distributed by inheritance law, not by
you.")*

**RS1** `residuary.primary` — **Everything else should go to:**
- My spouse
- My children, equally
- My spouse and children, equally
- One person → ▸ SF-PERSON
- Several people → SF-PERSON multi → ▸ SF-SHARES
- Charity → **Which?** [text] *(name & place — help: identify it precisely)*

**RS2** `residuary.contingent` — **If none of them survive you, everything
else goes to:**
- An alternate person → ▸ SF-PERSON
- An alternate charity → [text]
- My legal heirs, as the law provides

---

## Chapter 8 · Who's In Charge

### Section 17 — Executors (`executors.*`)

*(Intro card: **your executor carries out this will — collects assets, pays
debts, distributes property. Choose someone you trust, ideally younger than
you and reachable in India.**)*

**EX1** `executors.physical.primary` — **Who should be your executor?**
▸ SF-PERSON *(address requested; may be a beneficiary — that's legal and
common, but they then shouldn't be a witness — noted for the checklist ⚑)*

**EX2** `executors.physical.secondary` — **If they can't act, who steps in?**
▸ SF-PERSON

**EX3** `executors.digital.same` — **And your digital life — same executor?**
- Yes, the same person(s) → EX5
- Someone else for digital → EX4 *(help: pick whoever is actually good with
  technology)*

**EX4a** `executors.digital.primary` — **Digital executor?** ▸ SF-PERSON →
**EX4b** `executors.digital.secondary` — **Backup digital executor?**
▸ SF-PERSON

**EX5** `executors.powers` — **Give your executor standard powers?** *(sell
assets to pay debts, sign documents, hire a lawyer/accountant, settle
claims)*
- Yes, standard powers *(recommended — default)*
- Standard powers, plus my notes → [text]

**EX6** `executors.compensation` — **Payment for the executor?**
- No payment — but all expenses reimbursed *(common for family)*
- A fixed amount → [number] ₹
- Reasonable compensation from the estate

**EX7** `executors.informed` — **Does your executor know they're named?**
- Yes
- Not yet → ⚑ checklist: "tell them, and tell them where the signed will is
  kept"

---

## Chapter 9 · Review & Download

**RV1 Review screen** — all sections listed with their answers; skipped
items shown as "Skipped"; tap any answer to jump back to that question
(downstream answers that depended on it are re-validated; orphaned answers
are discarded with a notice). Warnings surface here:
- No residuary clause *(strong)*
- Under 18 *(blocks generation)*
- Sound-mind confirmation missing *(blocks generation)*
- Muslim testator + bequests: one-third reminder
- ⚑ checklist items collected during the interview

**RV2 Generate** — renders the will (see 04-will-template.md) →
- **Copy text** (plain text to clipboard)
- **Download PDF** (will + the signing-instructions page + the personal
  checklist of ⚑ items)

**RV3 Signing instructions page** — as specified in
[02-legal-framework.md §7](02-legal-framework.md).

---

## Flow-count summary

| Chapter | Sections | Authored questions (incl. sub-steps) |
|---|---|---|
| 1 You & Family | 1 | 14 |
| 2 Final Wishes | 2 | 17 |
| 3 Dependents | 1 | 13 |
| 4 Money & Property | 6 | ~58 |
| 5 Belongings | 5 | ~28 |
| 6 Digital Life | 1 | ~20 |
| 7 Residuary | 1 | 2 + intro |
| 8 Executors | 1 | 8 |
| 9 Review | 1 | 3 screens |
| **Total** | **18 + review** | **~165 authored** (+4 shared sub-flows) |

With repeaters and sub-flows expanded, a thorough user answers 80–250
questions depending on their estate — which is why chapters, autosave, and
save/resume are first-class features.
