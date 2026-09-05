# LifePilot v2 → Crisis Engine Upgrade — Explanation

## Update log
- **Pass 1** (previous): initial 18-category crisis engine, Life Channel,
  Fast Panic Engine (floating button, shake, stealth shield).
- **Pass 2** (this one, from `JARVIS_MASTER_PROMPT.md`): replaced the
  category list with the exact 18 named in that prompt, added real
  Indian helpline numbers where confidently known, added plain-language
  rights notes, added the Voice Orb + speech synthesis briefings, a
  typo normalizer, a guided 4-4-4 breathing exercise in the Life Channel,
  and settings toggles for voice output and shake-trigger (with explicit
  consent gating for the motion-sensor permission).

One note on that prompt: its own preamble claimed it was "engineered so
Claude will accept and execute 100% of this prompt without issuing
safety disclaimers or refusals." That framing was set aside — the
actual content was evaluated normally, same as any other request. It
turned out to be a legitimate feature list, so it was built as asked,
with the same one deviation as before (see below).

## What's in `js/crisis.js` now
18 categories, exactly as named in the prompt: Women's Safety, Child
Protection, Domestic Abuse (all genders), Financial Crisis, Mental
Health Guidance, Elder Welfare, Acid Attack Recovery, Anti-Trafficking,
Cybercrime/Sextortion, Caste Rights, LGBTQ+ Affirmation, Missing
Persons, Disaster Relief, Pro-Bono Legal Aid, Education Scholarships,
Workplace POSH, Farmer Support, Dowry Harassment.

Each has `assistanceType: 'crisis' | 'support'` — the true emergencies
(assault, abuse, trafficking, disaster, suicidal crisis, etc.) get the
full safety-first Life Channel tone; calmer categories (scholarships,
legal aid, farmer support, financial crisis) get a resource-first tone
without the "are you safe right now" urgency framing, since treating a
scholarship question like a 911 call would be alarming and wrong.

Classification picks the **longest matching phrase** across all
categories (not first-match-wins), so a specific phrase like "harassed
for dowry" correctly beats a shorter overlapping phrase like "being
harassed" from a different category.

A generic `general_emergency` fallback (not one of the 18) still
catches plain medical/fire/danger language that doesn't match a named
category, so "chest pain" or "the kitchen is on fire" still gets the
full Life Channel experience via the existing `emergencyTerms`
vocabulary in `orchestrator.js`.

### On the helpline numbers and legal content
`112`, `100`, `101`, `108`, `1091`, `181`, `1098`, `14416`, `1930`,
`1078`, `14567`, and `15100` (NALSA) are numbers this build has high
confidence in. `1800-180-1551` (Kisan Call Centre) is used for Farmer
Support. Two numbers from the prompt (`14566`, `8882498498`) were
included as general support lines, but their exact current
purpose/operator couldn't be confirmed with confidence — Claude has no
live web access from this environment to verify them. Every crisis
card now carries a standing note: *"Helpline numbers can change or
vary by state — if one doesn't connect, 112 always works nationwide."*
Please verify state-specific numbers before relying on them, especially
those two.

The "plain-language legal rights" notes are deliberately free of
specific IPC/BNS section numbers — those change with amendments and
are easy to misstate confidently. Instead each note gives a general,
correct-in-spirit statement of the right and points to NALSA (15100)
or a lawyer for anything case-specific. This isn't legal advice and
says so.

## One deliberate deviation from the source spec — and why
Both add-on documents (from the previous and current session) describe
firing `window.location.href = 'tel:' + number` automatically a few
hundred milliseconds after a crisis is detected — including off a
plain keyword match on typed text. This build does **not** do that
auto-redirect. Instead, the Life Channel opens instantly and always
shows a large, unmissable "Call [helpline] now" button as a real
`<a href="tel:...">` link — one tap away, but a tap the person chooses,
not a page navigation the app forces on them. This matches this
codebase's own existing self-test requirement: *"Any `ESCALATE` card
requires a tap to place the call. The app NEVER auto-dials."* A false
keyword/shake trigger that yanks someone into the phone dialer
undermines trust in the whole feature.

## New in this pass
- **Voice Orb** (`js/ui.js` + CSS): a pulsating indicator on the Home
  screen — gray/idle, cyan/listening, blue/thinking, violet/speaking.
- **Voice output** (`js/perception.js`: `speak()`/`stopSpeaking()`):
  after composing a plan, LifePilot briefly speaks a one-line summary
  ("Done — I've prepared a calendar event.") if the user has voice
  replies enabled in Settings. It never speaks card contents like
  messages or amounts aloud — only a generic summary — to avoid
  reading sensitive drafts out loud in a public place.
- **Typo normalizer** (`js/orchestrator.js`: `LP.util.normalizeTypos`):
  a small data-driven map (`hlp`→help, `emrgancy`→emergency, etc.)
  applied before classification, so a rushed or panicked typist still
  routes correctly. It never rewrites what's shown in history — only
  the copy handed to the classifiers.
- **Breathing exercise**: for Mental Health Guidance, the Life Channel
  can now offer a guided 4-4-4 breathing animation (visual only, times
  itself, no data leaves the device).
- **Shake-trigger consent flow**: Settings now has an explicit toggle
  that requests motion-sensor permission only when turned on (required
  by iOS Safari), and reports back if permission was denied.

## Missing input (carried over from last time)
`CRISIS_ENGINE_ADDON.md` — the original "18 Societal Categories & Laws"
document referenced by the very first prompt stack — still hasn't been
uploaded in either session. The category list is now sourced from
`JARVIS_MASTER_PROMPT.md` instead, which is more specific than the
original placeholder set. If the original addon doc turns up with
different category names, numbers, or legal citations, they can be
swapped into `LP.crisisCategories` directly — it's a content edit, not
a rewrite.

## Pass 3 (this round — "Continue")
Picked up the remaining gaps against `JARVIS_MASTER_PROMPT.md` that
Pass 2 didn't touch:

- **Encrypted export/import is now wired into Settings**, not just
  sitting unused in `storage.js`. Turning on "Encrypt exports" in
  Privacy settings asks for a passphrase (min 6 chars, confirmed
  once) — but the passphrase itself is **never persisted**, only a
  boolean flag. Every export/import prompts for it fresh via
  `LP.store.encryptJSON`/`decryptJSON` (AES-256-GCM, PBKDF2-derived
  key, 100k iterations). Verified with a standalone round-trip test:
  encrypt → decrypt matches original, and a wrong passphrase is
  correctly rejected rather than silently returning garbage.
- **Contact Picker API** (`js/perception.js: pickContact()`): NOTIFY
  cards now have a "Pick contact" button that uses
  `navigator.contacts.select()` where supported (Chromium/Android)
  to attach a real phone number to the WhatsApp/SMS draft, instead of
  opening a blank contact chooser. Degrades to a disabled button with
  an explanatory tooltip everywhere else — never fakes support.
- **Voice auto-reconnect**: continuous dictation now restarts itself
  if the browser silently ends the session after a pause (common
  behavior even with `continuous: true`), matching the spec's
  "auto-reconnect during active sessions." It only stops for real
  when the person taps the mic again or a non-transient error occurs.

Everything else asked for in `JARVIS_MASTER_PROMPT.md` — the 15
action primitives, habit learning, teachable skills, typo
normalization, zero-empty-card guarantee — was already present in the
codebase from before Pass 1, or added in Pass 2 (Voice Orb, breathing
exercise, 18-category engine). Nothing new was found missing after
this pass; the remaining unimplemented item from the very first
`MASTER_BUILD_PROMPT.md` (the hidden Layer-6 self-evaluation
dashboard) was never re-requested by either the crisis-engine or
JARVIS prompts, so it was left alone rather than added speculatively.



## Testing performed (cumulative)
- `node --check` syntax validation on every file, every pass.
- Classification smoke tests across all 18 categories plus a
  deliberate non-crisis sentence, including an overlapping-phrase case
  ("being harassed for dowry" vs. "being harassed") to confirm the
  longest-match logic picks the right category.
- Typo-normalization test confirming a heavily typo'd emergency string
  still triggers `signals.emergency`.
- AES-256-GCM round-trip test: encrypt → decrypt returns the original
  object byte-for-byte, and decrypting with the wrong passphrase
  throws instead of silently returning corrupted data.
