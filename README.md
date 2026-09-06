# LifePilot JARVIS Edition — "One Intent. Every Action."

> **An on-device, voice-first, autonomous life agent & emergency response engine.**  
> Type, speak, or upload anything — LifePilot reasons about intent, decomposes complex goals into real-world action trees, speaks back in real time, and executes across standard device apps and services.

---

## 🌟 Executive Overview

**LifePilot** is built on a single core philosophy: **"It must act, not just plan — like Iron Man's JARVIS."**

Most AI assistants output flat text or suggest manual to-do lists. LifePilot is designed as an **autonomous proxy** for daily human life. When you ask LifePilot to plan a trip, handle an emergency, schedule a meeting, or track a budget, it doesn't just display text — it generates a structured **Plan Tree** of executable action cards, speaks back out loud, and triggers real device applications (Google Calendar, Google Maps, Uber, WhatsApp, Spotify, Telephone Dialer, Web Crypto) via standard OS-level URI schemes.

### Core Architectural Guarantees:
1. **100% On-Device & Privacy-First:** All processing, intent parsing, preference graph extraction, and memory storage happen locally on your phone/laptop. Nothing is uploaded to third-party cloud trackers.
2. **Zero Server / API Costs:** Uses native Web APIs (`webkitSpeechRecognition`, `speechSynthesis`, `navigator.contacts`, `DeviceMotionEvent`, IndexedDB, Web Crypto) and standard URI schemes (`tel:`, `whatsapp://`, `maps://`, `upi://`) for zero-cost, unbreakable execution.
3. **Sub-50ms Emergency Fast Panic:** High-priority crisis classifier skip-evaluates slow processing pipelines and fires instant emergency call links (`112`, `1091`, `108`, `1930`) with haptic SOS vibration and GPS locking in under 50 milliseconds.

---

## ⚡ The 8 Pillars of Functionality

```
                     ┌─────────────────────────────────────────┐
                     │          LIFEPILOT JARVIS ENGINE        │
                     │ (Local-First On-Device AI Proxy System) │
                     └────────────────────┬────────────────────┘
                                          │
    ┌────────────────┬────────────────────┼────────────────────┬────────────────┐
    ▼                ▼                    ▼                    ▼                ▼
[VOICE LOOP]   [15 PRIMITIVES]    [18 CRISIS ENGINES]    [FAST PANIC]    [MEMORY VAULT]
Speech-to-     Schedule, Remind,  Women Safety, Child    Sub-50ms Shake, IndexedDB Graph,
Speech, Orb    Maps, Uber, Pay,   Abuse, DV, Cybercrime, Stealth Shield  AES-256-GCM,
Synthesis      Spotify, Docs...   Helplines, Laws, NGOs  Calculator UI   Habit Learning
```

### 1. Voice-First Ambient Loop (Talks & Listens)
- **Bidirectional Speech:** Speaks every action, plan summary, or emergency protocol aloud using `window.speechSynthesis`.
- **Continuous Voice Input:** Speech recognition via `webkitSpeechRecognition` with auto-reconnect.
- **Visual Voice Orb:** Dynamic UI orb on the Home screen that pulses to indicate states (*Cyan = Listening*, *Blue = Thinking*, *Electric Violet = Speaking*).

### 2. Universal 15-Primitive Action Engine
Supports 15 foundational real-world action primitives (detailed in the Primitive Matrix below). Automatically decomposes complex multi-step requests (*"I'm moving to Bangalore next month"*) into multi-card execution trees.

### 3. Native Hardware & Sensor Fusion
- **Contact Picker:** Uses `navigator.contacts.select()` to pick real phone numbers for messaging/calling.
- **Camera OCR:** Integrated `Tesseract.js` for instant text extraction from photos of whiteboards, receipts, or flyers.
- **Document Reader:** Multi-page PDF parsing via `pdf.js`.
- **Clipboard Sentinel:** Background monitoring with automatic intent suggestion banner when text is copied.
- **Motion Sensors:** `DeviceMotionEvent` accelerometer listener for Shake-to-Act panic triggers.

### 4. 18-Category Societal Crisis Engine
Dedicated high-priority classifier for societal emergencies. Includes verified Indian 24/7 helplines, plain-language legal protections (BNS 2023 / IPC, PWDVA 2005, POSH 2013, POCSO 2012, SC/ST Act 1989, IT Act 2000, RTE Act 2009), government welfare schemes, and NGO contacts.

### 5. Sub-50ms Fast Panic & Stealth Shield Mode
- **Sub-50ms Reaction:** Fast-path string regex scanner that pops emergency dialers (`112`, `1091`) and locks GPS coordinates in under 50 milliseconds.
- **Shake-to-Act:** Shaking the phone 3 times (acceleration threshold >22 m/s²) automatically fires emergency alerts without typing.
- **Stealth Calculator Shield:** Long-pressing the floating red panic dot transforms the entire app into a fully functional **fake Calculator UI**, hiding the emergency state while keeping GPS tracking and call shortcuts active underneath.

### 6. Life Channel Conversational Companion
A bottom-sheet modal (`#life-channel`) that opens during crisis events. Acts as a calm, voice-guided interactive companion — asking safety questions, offering step-by-step instructions, and leading 4-4-4 box breathing exercises during panic attacks.

### 7. Deep-Link Action Matrix (100% Reliable Execution)
Executes actions via un-breakable OS URI schemes (`gcalUrl`, `mapsUrl`, `waUrl`, `smsUrl`, `telUrl`, `upiUrl`, `uberUrl`, `spotifyUrl`, `searchUrl`, `gdocsUrl`). Automatically navigates to the app/service when an intent is triggered.

### 8. Memory Graph & Encrypted Vault
- **Preference Extraction:** Automatically extracts user context (*"my sister is Priya"*, *"allergic to peanuts"*) into a local IndexedDB graph.
- **Habit Detection Engine:** Identifies 3-time recurring weekly patterns and offers automated habit cards.
- **Teachable Macro Skills:** Allows users to teach custom routines (*"Learn this: 'Morning' means..."*).
- **Web Crypto Encryption:** AES-256-GCM encrypted backup export/import using PBKDF2 key derivation.

---

## 📋 The 15 Action Primitives & Deep-Link Matrix

| Primitive | Description | Output & Integration | Permission Gate |
|-----------|-------------|----------------------|-----------------|
| **`SCHEDULE`** | Calendar events & booking | Google Calendar link (`gcalUrl`) + Day-strip widget | `auto` |
| **`REMIND`** | Countdown reminders | Circular SVG timer + Calendar notification | `auto` |
| **`NAVIGATE`** | Location turn-by-turn | Google Maps link (`mapsUrl`) + Map thumb widget | `auto` |
| **`NOTIFY`** | Pre-written text messages | WhatsApp (`waUrl`) / SMS (`smsUrl`) draft | `required` (Human-in-the-Loop) |
| **`BUDGET_TRACK`**| Expense tracking | Interactive expense bar + Pie chart widget | `required` (Sandbox confirm) |
| **`PAY`** | Instant money transfers | UPI Payment URI (`upiUrl`) | `required` (Human-in-the-Loop) |
| **`CAB`** | On-demand rides | Uber pickup link (`uberUrl`) | `auto` (Direct App Redirect) |
| **`MUSIC`** | Media streaming | Spotify track/playlist search (`spotifyUrl`) | `auto` |
| **`SEARCH_WEB`** | Online research | Google Search (`searchUrl`) & YouTube (`youtubeUrl`) | `auto` |
| **`GENERATE_DOC`**| Document creation | Formatted doc preview + Google Docs (`gdocsUrl`) | `auto` |
| **`TRACK_HABIT`** | Habit streak tracking | GitHub-style 7-day contribution grid | `auto` |
| **`SET_GOAL`** | Long-term milestone tracking| Progress bar with 25/50/75/100% milestone chips | `auto` |
| **`COMPARE`** | Side-by-side decision tool | Two-column comparative evaluation stack | `auto` |
| **`TRANSLATE`** | Language translation | Google Translate link (`translateUrl`) | `auto` |
| **`TIMER`** | Circular countdown timer | Radial SVG countdown widget | `auto` |
| **`CAPTURE_NOTE`**| Fast note archiver | Local searchable note storage | `auto` |

---

## 🛡️ The 18 Societal Crisis Engines

| Category | Primary Helplines | Key Laws & Rights (BNS / IPC) | Government Schemes & Support |
|----------|-------------------|-------------------------------|------------------------------|
| **Women's Safety & Assault** | `112`, `1091`, `181`, `7827170170` | BNS Sec 64 (Rape), Sec 74 (Modesty), Sec 78 (Stalking). Zero FIR right. | Sakhi One Stop Centres (every district), 181 Helpline |
| **Child Protection & Marriage** | `1098` (Childline), `112` | Prohibition of Child Marriage Act 2006, POCSO Act 2012, RTE Act | Child Welfare Committee (CWC), DCPU |
| **Domestic Violence (All Genders)**| `181`, `1091`, `8882498498` (SIFF) | PWDVA 2005 (Protection/Residence orders), BNS Sec 85 | Swadhar Greh shelter homes, SIFF legal aid for men |
| **Financial Distress / Debt** | `15100` (NALSA), `14448` (RBI) | RBI Fair Lending Code (harassment illegal), Civil debt protections | PM SVANidhi, Mudra Loans, Kanya Vivah Yojana |
| **Mental Health / Suicide** | `14416` (Tele-MANAS), `1800-599-0019` | Mental Healthcare Act 2017 (Sec 115 decriminalizes suicide) | Tele-MANAS 24/7 multilingual counseling, DMHP |
| **Elder Welfare & Abuse** | `14567` (Elderline), `112` | Maintenance and Welfare of Parents and Senior Citizens Act 2007 | Maintenance Tribunal, IGNOAPS pension, HelpAge India |
| **Acid Attack Recovery** | `112`, `108` (Ambulance) | BNS Sec 124. Mandatory free hospital treatment (SC mandate) | NALSA Victim Compensation Scheme (Min ₹3 Lakhs), Chhanv |
| **Anti-Trafficking** | `112`, `1098` | BNS Sec 143 (Trafficking), ITPA 1956, Bonded Labour Abolition Act | Ujjawala Scheme (Rescue & Rehabilitation) |
| **Cybercrime / Sextortion** | `1930` (Cyber Helpline) | IT Act Sec 66C (Identity), Sec 66E (Privacy), Sec 67/67A | National Cyber Crime Portal (`cybercrime.gov.in`) |
| **Caste Rights & Atrocities** | `14566` (NHAA), `112` | SC/ST (Prevention of Atrocities) Act 1989 (No anticipatory bail) | Post-Matric Scholarships, Stand-Up India |
| **LGBTQ+ Affirmation** | `9152987821` (iCall), `9999666555` | Navtej Singh Johar 2018 (Decriminalization), Transgender Act 2019 | SMILE Scheme, Transgender Identity Certificate |
| **Missing Persons** | `112`, `1098` | SC Guidelines (No 24-hour waiting period to file FIR) | TrackChild Portal (`trackthemissingchild.gov.in`), ZIPNET |
| **Disaster & Road Accidents** | `112`, `108`, `101`, `1078` | Good Samaritan Law (Motor Vehicles Act 2019 — complete protection) | NDRF, State Disaster Response Fund (SDRF) |
| **Pro-Bono Legal Aid** | `15100` (NALSA) | Article 39A of Constitution, Legal Services Authorities Act 1987 | Free lawyer & waived court fees via DLSA / Lok Adalats |
| **Education Support** | `15100` | Right to Education (RTE) Act 2009 (25% EWS reservation in private schools) | National Scholarship Portal (`scholarships.gov.in`), NMMS |
| **Workplace POSH (Harassment)** | `181`, `shebox.nic.in` | POSH Act 2013 (Mandatory Internal Complaints Committee in 10+ emp orgs) | SHe-Box Portal, E-Shram Portal |
| **Farmer Support** | `1800-180-1551` (Kisan Call) | PMFBY Crop Insurance Guidelines, RBI Agricultural Lending rules | PM-KISAN (₹6,000/yr), PMFBY, Kisan Credit Card |
| **Dowry Harassment** | `1091`, `181`, `112` | Dowry Prohibition Act 1961, BNS Sec 85 (Cruelty), BNS Sec 80 (Death) | One Stop Centre (Sakhi), Protection Officers |

---

## 🛠️ Project Structure

```
lifepilot/
├── index.html                 # PWA shell with script loaders (cache-busted)
├── manifest.json              # Web App Manifest for mobile/desktop PWA installation
├── sw.js                      # Service Worker for 100% offline caching
├── Explanation_For_Judges.md  # Plain-English technical doc for hackathon evaluation
├── README.md                  # Complete architectural specification & manual
├── css/
│   └── style.css              # Universal design system, themes & Life Channel CSS
├── icons/
│   ├── icon-192.svg           # PWA icon 192x192
│   ├── icon-512.svg           # PWA icon 512x512
│   └── icon-maskable.svg      # Maskable Android icon
└── js/
    ├── orchestrator.js        # Cognition Layer: LP.classify & shared utilities
    ├── orchestrator_compose.js# Intent Decomposition & Card Builders
    ├── crisis.js              # 18-Category Crisis Database, Helplines & Laws
    ├── fastPanic.js           # Accelerometer Shake Listener & Stealth Calculator Shield
    ├── lifeChannel.js         # Conversational Emergency Guidance Overlay
    ├── perception.js          # Speech Synthesis, Recognition, OCR & Contact Picker
    ├── memory.js              # Preference Graph, Habit Engine & Skill Macros
    ├── storage.js             # IndexedDB & AES-256-GCM Encryption
    ├── i18n.js                # Multilingual Translations (English & Tamil)
    ├── ui.js                  # Main Application Controller & View Router
    ├── ui_cards.js            # Dispatch renderers for all 15 Action Primitives
    └── ui_screens.js          # History, Habits/Goals, and Settings screens
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Safari, Firefox).
- Python 3.x (or any static local server).

### Running the App
1. Open your terminal in the project directory:
   ```bash
   cd c:/Users/visma/Downloads/LifePilot_Code/lifepilot
   ```
2. Start a local HTTP server:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to:
   👉 **`http://localhost:8080`**

---

## 🧪 Master Test Suite (Try these prompts!)

### 1. Everyday Actions & Apps
- **Uber Auto-Launch:** `"I need an Uber to take me to the airport"` → Automatically redirects to Uber!
- **Google Maps:** `"Directions to Phoenix Mall Hyderabad"` → Automatically opens Google Maps turn-by-turn!
- **Spotify Music:** `"Play some lofi focus music"` → Opens Spotify search!
- **Calendar & Reminder:** `"Remind me to study mitosis tomorrow at 6 PM"` → Creates Calendar reminder with countdown.

### 2. Complex Goals & Multi-Step Decomposition
- **Moving Cities:** `"I'm moving to Bangalore next month"` → Decomposes into 6 linked cards (Movers, Lease cancellation, Route, Moving budget, Notice to landlord, Address update).
- **Trip Planning:** `"Plan a trip to Goa for ₹8000 next weekend"` → Spawns full transport, hotel, route, and budget tree.

### 3. Societal Crisis & Safety Triggers
- **Typo Emergency:** `"i am in peblm please help me"` → Auto-corrects typo (`peblm` → `problem`), triggers Urgent Danger mode, opens Life Channel & 112 dialer.
- **Medical Emergency:** `"snake bite"` → Pops Ambulance 108 shortcut & displays anti-venom protocol steps.
- **Women's Safety:** `"a man is following me down an empty street"` → Pops 1091/112, activates location tracking & safety steps.
- **Child Protection:** `"my parents are forcing me to marry, I am only 16"` → Pops Childline 1098 & legal rights under Prohibition of Child Marriage Act.
- **Dowry Harassment:** `"dowry demand, in-laws demanding money, dowry torture"` → Pops 1091/181 + BNS Sec 85 legal protections.

### 4. Hardware Gestures & Stealth Disguise
- **Shake-to-Act:** Shake your phone violently 3 times → Instantly triggers emergency dispatch + SOS vibration.
- **Stealth Calculator Shield:** Long-press the floating red panic dot → Turns the screen into a working **fake Calculator UI** while keeping emergency GPS active underneath (tap the corner dot 5 times to exit).

---

## 📜 License & Privacy

**LifePilot** is open-source, local-first software. All user data, preference graphs, and memory logs remain exclusively on the user's local device inside IndexedDB, encrypted with AES-256-GCM. Zero user data is transmitted to external servers.
