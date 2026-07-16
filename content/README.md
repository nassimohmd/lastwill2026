# Editing the interview & the generated will

Everything in this `content/` folder drives what LastWill asks and what it
writes into the final will — question wording, answer choices, help text,
and the will's own legal-clause text, each in English and Malayalam. None
of it is code. Editing it doesn't require touching `src/`.

## How to edit it

The intended way is **[Pages CMS](https://pagescms.org)**, a free, hosted
form editor that reads `.pages.yml` at the repo root and turns these JSON
files into web forms — sign in with GitHub, grant it access to
`nassimohmd/lastwill2026`, and you get a form per question instead of raw
JSON. Saving in Pages CMS commits straight to this branch, which is what
Vercel deploys from — so a save there is a live change a minute or two
later.

If Pages CMS ever looks wrong for a particular file (a dropdown missing,
a list not showing) the file is still just JSON — GitHub's own web editor
(the pencil icon on any file in this repo) works too, or ask whoever set
this up to fix the `.pages.yml` mapping for that one field. Nothing about
the app depends on Pages CMS specifically; it's just the friendliest way in.

## What's safe

**A bad edit cannot take the live site down.** Every commit to this repo
runs a content check before Vercel builds it (`npm run prebuild`, see
`src/content/validate.ts`) — a typo'd routing target, a duplicate question
ID, a malformed condition, or an empty required field fails that check with
a plain-English message, and the build stops. Vercel just keeps serving the
last version that passed. Nothing is ever half-broken in production.

## What's in each file

- **`sections/01-personal.json` … `18-executors.json`** — one file per
  interview section, in the order they're asked. Each has a `title`
  (shown in the progress bar) and a `questions` list, in the order they're
  asked within that section. This is where you'll do almost all your
  editing: rewording a question, adding/removing/reordering answer
  options, adding a new question, changing help text.
- **`clauses.json`** — the will's own text, as an ordered list of clause
  blocks. Each has `text` (with `{{...}}` placeholders the app fills in
  from the interview answers) and sometimes `fragments` — a list of small
  conditional inserts. Each fragment has a `group` name matching a
  `{{frag:group}}` slot in the clause text, an optional condition, and its
  own bilingual text. Within a group, the app uses the **first** fragment
  whose condition matches (an entry with no condition acts as the
  fallback), so the order of fragments matters.
- **`helpers.json`** — a handful of shared sentence templates (e.g. "to
  {person} absolutely. If they do not survive me, this bequest shall
  {contingent}") reused across several different clauses.
- **`repeaters.json`** — settings for the "add another?" lists (bank
  accounts, real estate, debts, etc.): the heading shown while adding
  items, and how a finished item is summarised in the list.
- **`relations.json`** — the relationship choices offered whenever the
  interview asks how someone is related to you (wife, son, friend, ...).
- **`chapters.json`** — the top-level groups sections are organised into
  (e.g. "Money & Property").

## The one technical corner: routing

Each question can have a `next` (default next question), `nextRules`
(conditional routing), and `when` (whether the question shows at all).
These describe *branching logic* — "if the testator said X, jump to Y" —
which doesn't map cleanly onto a form field, so they're edited as JSON
**text** in a code box in the CMS (in the files they're stored as JSON
strings; the app parses them, and the build check rejects invalid JSON
with the exact location). Leaving one blank means "no condition" /
"always". A condition looks like:

```json
{ "eq": ["personal.marital_status", "married"] }
```

meaning "the answer to `personal.marital_status` equals `married`". You can
combine conditions with `"and": [...]`, `"or": [...]`, or `"not": {...}`,
and check `"notEmpty": "some.answer.key"` or `"exists": "some.answer.key"`.
The answer keys (`personal.marital_status`) are the question `id`s and
repeater item field `id`s you'll see right there in the same JSON file —
if you're not changing branching, you can leave these fields alone
entirely; deleting a question doesn't require touching anyone else's
routing unless something else pointed `next` at it (the content check
described above will tell you exactly that, by name, if you get it wrong).

## What isn't editable here

- **App chrome** — button labels, navigation, the review screen's own
  copy — lives in `src/locales/{en,ml}/ui.json`, not here. That's
  intentionally developer-owned so the app's controls read consistently
  regardless of interview language.
- **Adding a brand-new top-level section** (as opposed to adding a
  question to an existing section) needs a small code change — each
  section file is wired into the app by name in `src/content/load.ts`.
  Reordering, renaming, or adding/removing *questions and options* within
  the 18 existing sections needs no code at all.
