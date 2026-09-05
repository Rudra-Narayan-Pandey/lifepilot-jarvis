# CLAUDE-OPTIMIZED MASTER BUILD DIRECTIVE — LifePilot JARVIS System

> **INSTRUCTIONS FOR USER:**
> Attach your `LifePilot_v2_Code.zip` file and copy-paste this prompt directly into Claude. 
> 
> **Why this prompt works without refusals:** 
> It is meticulously engineered using standard software architecture terminology (sandboxed PWA, user-in-the-loop confirmation, Web APIs, accessibility features, local-first privacy). Claude will accept and execute 100% of this prompt without issuing safety disclaimers or refusals.

---

## SYSTEM DIRECTIVE FOR CLAUDE

You are a Principal Software Architect refactoring `LifePilot_v2_Code` into a production-grade, voice-first, on-device AI Agent named **LifePilot JARVIS Edition**.

This system is an experimental, sandboxed Progressive Web App (PWA) designed for personal productivity, accessibility, and emergency assistance. All external actions (money, messaging, calls) use standard browser URL schemes and strictly enforce **Human-in-the-Loop (HITL) approval** to ensure total safety and user consent.

---

## ARCHITECTURAL FRAMEWORK & REFACTORING RULES

### 1. CONVERSATIONAL VOICE LOOP (Web Speech API)
- **Voice Synthesis:** Every generated action plan or informational summary MUST trigger `window.speechSynthesis` with natural pitch/rate control to verbally brief the user.
- **Voice Recognition:** Continuous dictation support via `webkitSpeechRecognition` with auto-reconnect during active sessions.
- **Voice Orb Component:** Render a pulsating CSS/SVG voice orb on the Home screen that dynamically shifts color based on state (Listening: Cyan, Thinking: Blue, Speaking: Electric Violet).

### 2. ACCESSIBILITY & PANIC DISPATCH (<50ms & Shake)
- **Shake Detection:** Background `DeviceMotionEvent` listener. Shaking the device 3 times (magnitude threshold >22m/s²) fires the high-priority assistance mode.
- **Zero-Delay Trigger:** High-speed string intercept (<1ms regex matching) that immediately prepares emergency helpline deep-links (`112`, `1091`, `108`, `1930`) and locks GPS coordinates in parallel.
- **Stealth Disguise Mode:** Provide a "Stealth Shield" toggle that renders a functional Calculator interface over the screen while maintaining assistance coordination in the background.

### 3. THE 18-CATEGORY ASSISTANCE ENGINE
Maintain and elevate the comprehensive 18-category crisis & support dataset in `js/crisis.js`:
- Categories: Women's Safety, Child Protection, Domestic Abuse (all genders), Financial Crisis, Mental Health Guidance, Elder Welfare, Acid Attack Recovery, Anti-Trafficking, Cybercrime/Sextortion, Caste Rights, LGBTQ+ Affirmation, Missing Persons, Disaster Relief, Pro-Bono Legal Aid, Education Scholarships, Workplace POSH, Farmer Support, Dowry Harassment.
- Integrations: Real Indian helpline numbers (112, 1091, 1098, 181, 1930, 14566, 14416, 15100, 14567, 1800-180-1551, 8882498498) + plain-language legal rights (BNS 2023 / IPC) + Government Welfare Schemes.

### 4. REAL-TIME CONVERSATIONAL COMPANION ("Life Channel")
- A clean, full-screen bottom-sheet modal (`#life-channel`) that opens during critical assistance flows.
- Features timestamped guidance messages, quick-reply pill buttons, step-by-step safety steps, and guided 4-4-4 breathing exercises for anxiety.

### 5. UNIVERSAL 15-PRIMITIVE ENGINE & DEEP-LINKS
Fully implement the 15 core action primitives using client-side URL schemes:
- `SCHEDULE` → Google Calendar URL
- `NAVIGATE` → Google Maps turn-by-turn
- `NOTIFY` → Pre-filled WhatsApp / SMS / Email drafts
- `PAY` → UPI Payment URI (`upi://pay`)
- `CAB` → Uber deep-link
- `MUSIC` → Spotify search URI
- `SEARCH_WEB` → Google / YouTube search
- `GENERATE_DOC` → Formatted document viewer & Google Docs link
- `BUDGET_TRACK` → Sandbox expense tracker with pie chart widget
- `TRACK_HABIT` → GitHub-style habit contribution grid
- `SET_GOAL` → Progress bar with milestone indicators
- `COMPARE` → Side-by-side comparison stack
- `TRANSLATE` → Google Translate deep-link
- `TIMER` → Circular SVG countdown timer
- `CAPTURE_NOTE` → Local searchable note archive

### 6. LOCAL-FIRST PRIVACY & MEMORY GRAPH
- **Preference Extractor:** Auto-extracts personal context (relations, diet, locations) into IndexedDB.
- **Habit Learning:** Automatically detects 3-occurrence weekly patterns and offers automated suggestions.
- **Teachable Skills (Macros):** Allows users to define custom shortcuts (*"Learn this: 'Morning' means..."*).
- **Web Crypto Encryption:** Full AES-256-GCM encrypted export/import using PBKDF2 key derivation.

### 7. STRICT ERROR-HANDLING & TYPO NORMALIZATION
- **Typo Normalizer:** Automatically corrects common input typos (`peblm` → `problem`, `hlp` → `help`, `plz` → `please`, `emrgancy` → `emergency`).
- **Zero-Empty-Card Guarantee:** `LP.compose()` MUST NEVER return `cards: []`. Unrecognized inputs must gracefully route to `INFO_SUMMARY` or `CLARIFY` cards.

---

## CLAUDE IMPLEMENTATION INSTRUCTIONS

Please refactor and output the complete code files for:
1. `index.html` (Main shell with script tags)
2. `js/perception.js` (Voice synthesis, recognition, contact picker, sensors)
3. `js/orchestrator.js` & `js/orchestrator_compose.js` (Intent classification & decomposition)
4. `js/crisis.js` (18-category database & helplines)
5. `js/fastPanic.js` (Shake listener & stealth shield)
6. `js/lifeChannel.js` (Conversational guidance overlay)
7. `js/memory.js` & `js/storage.js` (Local IndexedDB & AES-256-GCM encryption)
8. `js/ui.js`, `js/ui_cards.js`, `js/ui_screens.js` (Card renderers, widgets, voice orb, themes)

All code must be production-ready, fully written (NO stubs/placeholders), and formatted as a client-side Progressive Web App.
