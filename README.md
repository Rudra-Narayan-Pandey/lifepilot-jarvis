# LifePilot JARVIS Edition — "One Intent. Every Action."

> **An on-device, voice-first, autonomous life agent & emergency response engine.**  
> Type, speak, or upload anything — LifePilot reasons about intent, decomposes complex goals into real-world action trees, speaks back in real time, and executes across standard device apps and services.

---

## 🌟 Executive Overview

**LifePilot** is built on a single core philosophy: **"It must act, not just plan — like Iron Man's JARVIS."**

Most AI assistants output flat text or suggest manual to-do lists. LifePilot is designed as an **autonomous proxy** for daily human life. When you ask LifePilot to plan a trip, handle an emergency, schedule a meeting, or track a budget, it doesn't just display text — it generates a structured **Plan Tree** of executable action cards, speaks back out loud, and triggers real device applications (Google Calendar, Google Maps, Uber, WhatsApp, Spotify, Telephone Dialer, Web Crypto) via standard OS-level URI schemes.

### Core Architectural Guarantees:
1. **100% On-Device & Privacy-First:** All processing, intent parsing, preference graph extraction, and memory storage happen locally on your phone/laptop. Nothing is uploaded to third-party cloud trackers.
2. **Zero Server / API Costs:** Uses native Web APIs (`webkitSpeechRecognition`, `speechSynthesis`, `navigator.contacts`, `DeviceMotionEvent`, IndexedDB, Web Crypto`) and standard URI schemes (`tel:`, `whatsapp://`, `maps://`, `upi://`) for zero-cost, unbreakable execution.
3. **Sub-50ms Emergency Fast Panic:** High-priority crisis classifier skip-evaluates slow processing pipelines and fires instant emergency call links (`112`, `1091`, `108`, `1930`) with haptic SOS vibration and GPS locking in under 50 milliseconds.

---

## 🛠️ PROTOTYPE TO PRODUCTION: SOFTWARE ROADMAP

To transition LifePilot from this working PWA prototype into a world-class, production-grade JARVIS ecosystem, the following software architecture upgrades are designed for implementation:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION SOFTWARE ARCHITECTURE (16-POINT ROADMAP)                   │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────────┘
   │          │          │          │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼          ▼          ▼          ▼
 TAURI    WEBGPU     WASM       WEB BT     P2P MESH   ZK SYNC    ERSS API   FED LEARN
 Native   On-Device  Browser    Biometric  LoRa SOS   CRDTs      DigiLocker TF Federated
 Pkg      SLM        Automate   Sensors    Relay      Encrypted  eKYC       Privacy ML
   │          │          │          │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼          ▼          ▼          ▼
 EVIDENCE  RISK       HEATMAPS   BHASHINI   SMART CITY FIR AUTO   A11Y       CAMPUS
 Locker    Scoring    Crowd-     22 Indic   IoT/CCTV   Insurance  Braille/   Safety
 SHA-256   ML Route   Sourced    Languages  Traffic    Claims     Haptic     Network
```

### 1. Native Desktop & Mobile Packaging (Tauri 2.0 & Capacitor)
- **Desktop Agent (Windows/Mac/Linux):** Package using **Tauri 2.0 (Rust)** for a lightweight (<10MB) native executable with system tray support, global `Alt+Space` hotkeys, and native OS desktop notification integration.
- **Mobile Agent (Android/iOS):** Package using **Capacitor / Native Plugins** for background accelerometer listening, lock-screen widgets, native Bluetooth beacon scanning, and Quick Settings tiles.

### 2. On-Device Small Language Model (WebGPU & ONNX Runtime)
- **Local Model Execution:** Integrate **WebLLM / ONNX Runtime Web** utilizing **WebGPU**.
- **0ms Latency SLM:** Run quantized small language models (e.g. Llama 3.2 1B, Gemma 2B, or Phi-3 Mini) directly on the device NPU/GPU for 100% offline, highly nuanced natural language reasoning without external API dependencies.

### 3. Wasm Autonomous Web Automation Agent
- **Headless Browser Execution:** Embed a WebAssembly browser automation runtime (like Playwright Wasm / Puppeteer Wasm).
- **Form-Filing Proxy:** Autonomously fills out multi-step web forms, compares hotel/flight pricing across portals, and submits government applications on behalf of the user under biometric approval.

### 4. Web Bluetooth Biometric Sensor Bridge
- **Wearable Integration:** Connect to Apple Watch, Galaxy Watch, and fitness bands via **Web Bluetooth API**.
- **Silent Panic Trigger:** Continuously monitors Heart Rate Variability (HRV), pulse spikes, and Galvanic Skin Response (GSR). If a stress spike occurs without physical exercise, LifePilot automatically locks GPS and activates silent emergency protocols.

### 5. Peer-to-Peer Disaster Mesh Network (Libp2p / WebRTC)
- **Zero-Cell Emergency Relay:** In disaster zones or areas with zero cellular connectivity, LifePilot devices form an ad-hoc local mesh network using **Libp2p / WebRTC DataChannels** over Bluetooth and Wi-Fi Direct.
- **Signal Hopping:** Emergency SOS messages hop from phone to phone across miles until reaching a device with active satellite or cellular service.

### 6. Zero-Knowledge End-to-End Encrypted Sync (CRDTs)
- **Conflict-Free Replicated Data Types (CRDTs):** Use **Automerge / Yjs** paired with Zero-Knowledge (ZK) encryption.
- **Private Cross-Device Sync:** Syncs preference graphs, habits, and notes across personal laptops and smartphones without any central server ever seeing unencrypted personal data.

### 7. Government API Direct Integration (ERSS 112 / DigiLocker / Aadhaar eKYC)
- **ERSS 112 Backend:** Direct API integration with India's **Emergency Response Support System (ERSS)** backend, enabling LifePilot to push structured emergency alerts (GPS coordinates, victim profile, incident type) directly into the police dispatch pipeline — bypassing manual voice calls entirely.
- **DigiLocker Document Vault:** Pull verified government documents (Aadhaar, PAN, driving license, vehicle RC, insurance policies) via **DigiLocker API** for instant identity verification during emergencies, hospital admissions, or police complaints.
- **Aadhaar eKYC:** Biometric/OTP-based identity verification for critical actions like filing FIRs, accessing welfare schemes, or authorizing emergency medical consent.

### 8. Federated Learning for Crisis Pattern Detection
- **Privacy-Preserving ML:** Deploy **TensorFlow Federated** or **Flower** framework to train crisis prediction models across thousands of LifePilot devices WITHOUT ever extracting raw user data.
- **Crowd Intelligence:** Each device trains a local model on anonymized crisis patterns (time-of-day, location clusters, incident types). Only encrypted model gradients are shared — never personal data.
- **Predictive Alerts:** The federated model learns regional crime/accident hotspots and proactively warns users entering statistically dangerous zones at dangerous times.

### 9. Digital Evidence Locker (Tamper-Proof, Court-Admissible)
- **Timestamped SHA-256 Hashed Recordings:** Automatically captures and hashes audio recordings, GPS trails, screenshots, and photos during crisis events using **Web Crypto API** with tamper-evident SHA-256 checksums.
- **Blockchain Timestamping:** Optional anchoring of evidence hashes to a public blockchain (Polygon/Ethereum L2) for independently verifiable, court-admissible proof of time and integrity.
- **Chain of Custody Logs:** Every access, export, or share of evidence is logged with timestamps, forming an unbroken digital chain of custody that meets Indian Evidence Act (Sec 65B) requirements for electronic evidence admissibility.

### 10. Predictive Risk Scoring Engine
- **ML-Based Daily Safety Assessment:** Analyzes the user's planned routes, time of travel, historical crime data (NCRB), and weather/disaster forecasts to generate a **Daily Safety Score (0-100)**.
- **Route Risk Heatmaps:** Overlays color-coded safety gradients on navigation maps, highlighting statistically dangerous stretches, poorly lit zones, and areas with high reported incidents.
- **Proactive Rerouting:** If a planned route scores below the safety threshold, LifePilot automatically suggests safer alternative routes — even if they are slightly longer.

### 11. Community Safety Heatmaps & Crowd-Sourced Reporting
- **Anonymous Incident Reporting:** Users can anonymously report safety incidents (harassment, theft, stray animal attacks, waterlogging, road damage) with GPS tags.
- **Real-Time Danger Zone Maps:** Aggregated reports generate live community heatmaps visible to all users, marking unsafe areas in real-time.
- **Municipal Integration:** Feed anonymized, aggregated reports directly into municipal corporation dashboards for faster infrastructure response (broken streetlights, open manholes, dangerous intersections).

### 12. Multilingual Bhashini / Indic Voice Engine (All 22 Scheduled Languages)
- **Bhashini API Integration:** Connect to India's **Bhashini (National Language Translation Mission)** platform for real-time speech-to-speech translation across all 22 constitutionally scheduled Indian languages: Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Maithili, Santali, Kashmiri, Nepali, Sindhi, Konkani, Dogri, Manipuri, Bodo, and Sanskrit.
- **Code-Switching Support:** Handle mixed-language inputs ("mujhe hospital le chalo" / "ennaku help venum") seamlessly without requiring the user to select a language.
- **Script-Agnostic Input:** Accept Devanagari, Roman transliteration, or any Indic script interchangeably.

### 13. Smart City & IoT Integration
- **CCTV Network Bridge:** In smart city deployments, LifePilot emergency alerts trigger nearby municipal CCTV cameras to auto-focus, zoom, and record the incident area — providing real-time visual evidence to police control rooms.
- **Streetlight SOS Beacons:** Integration with smart streetlights to flash rapid red SOS patterns when a panic alert is triggered nearby, drawing immediate public attention.
- **Traffic Signal Override:** During ambulance dispatch, LifePilot coordinates with smart traffic management systems to create green corridors along the ambulance route.

### 14. Insurance & FIR Auto-Filing Agent
- **Automated FIR Drafting:** Generates legally structured First Information Reports (FIRs) with incident details, timestamps, GPS coordinates, and witness information — ready for submission at any police station.
- **Insurance Claim Assembly:** Automatically collects and organizes all required documentation (medical reports, police FIR copy, timestamped photos, GPS evidence) for health/vehicle/property insurance claims.
- **Government Scheme Application Bot:** Fills out multi-step government welfare scheme applications (PM-KISAN, Mudra Loan, PMAY housing, scholarship portals) on behalf of users who cannot navigate complex web forms.

### 15. Universal Accessibility Engine
- **Screen Reader Harmony:** Full ARIA landmark, role, and live-region compliance for seamless TalkBack (Android) and VoiceOver (iOS) integration.
- **Haptic Language:** Distinct vibration patterns for different alert types — short double-pulse for reminders, long continuous for emergencies, rhythmic for navigation turns — enabling eyes-free, ears-free operation.
- **High-Contrast & Large-Text Modes:** WCAG AAA compliant color contrast ratios and dynamic text scaling for users with visual impairments.
- **Braille Display Support:** Web Braille API integration for refreshable Braille display devices used by blind users.

### 16. Campus Safety Network (Schools, Colleges & Hostels)
- **Institutional Deployment:** A dedicated campus mode where educational institutions deploy LifePilot across student devices as an official safety tool.
- **Geo-Fenced Alerts:** Automatic alert escalation to campus security, wardens, and administrators when a panic alert originates within campus geo-fence boundaries.
- **Anonymous Reporting Channel:** Students can anonymously report ragging, bullying, sexual harassment (POSH), or substance abuse to the Internal Complaints Committee (ICC) / Anti-Ragging Cell without fear of retaliation.
- **Hostel Curfew Safety:** Automated check-in system — if a student doesn't return to hostel geo-fence by curfew, LifePilot pings their emergency contacts and campus security.

---

## 🌍 SOCIETAL IMPACT OF THE FULLY DEPLOYED SYSTEM

When fully deployed, LifePilot transforms from a personal productivity assistant into a massive societal safety net:

```
                                    LIFEPILOT SOCIETAL IMPACT (10-POINT FRAMEWORK)
  ┌──────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────┐
  │ CRIME PREVENTION │ LEGAL JUSTICE    │ GOLDEN HOUR      │ MENTAL HEALTH    │ DIGITAL DIVIDE   │
  ├──────────────────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
  │ • Sub-50ms Alert │ • Rights Literacy│ • First-Aid Proto│ • 24/7 Triage    │ • Voice-First    │
  │ • GPS Lock       │ • FIR Auto-Draft │ • Ambulance 108  │ • Suicide Line   │ • 22 Languages   │
  ├──────────────────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
  │ NIGHT ECONOMY    │ CHILD TRAFFIC.   │ DISASTER RURAL   │ POLICE EFFICIENCY│ ELDERLY LIVING   │
  ├──────────────────┼──────────────────┼──────────────────┼──────────────────┼──────────────────┤
  │ • Safe Commute   │ • Pattern Detect │ • Mesh SOS Relay │ • Structured Data│ • Fall Detection  │
  │ • Escort Tracking│ • NCPCR Link     │ • Offline First   │ • Reduced Hoax   │ • Med Reminders  │
  └──────────────────┴──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### 1. Drastic Reduction in Crime Response Latency
By dropping emergency alert times from 15+ minutes down to sub-50 milliseconds via 3-shake gestures and instant dialers, LifePilot deprives attackers of isolation. High adoption acts as a major deterrent against stalking, assault, and harassment.

### 2. Democratizing Legal Awareness & Access to Justice
Millions of underprivileged citizens suffer from a lack of legal literacy. LifePilot translates complex legal codes (BNS 2023 / IPC, PWDVA 2005, POSH Act 2013, POCSO 2012, SC/ST Act 1989, RTE 2009) into actionable steps, drafting FIR text and connecting users directly to NALSA free legal aid (`15100`).

### 3. Saving Lives During Medical "Golden Hours"
In accidents, acid attacks, snake bites, or cardiac events, the first 15 minutes determine survival. LifePilot provides instant, accurate first-aid guidance (e.g. 20-minute running water protocol for acid burns, limb stabilization for bites) while dispatching ambulances (`108`), drastically improving survival rates.

### 4. Preventing Rural & Financial Suicides
By detecting financial distress and farmer debt early, LifePilot connects distressed individuals directly to Tele-MANAS (`14416`) / KIRAN (`1800-599-0019`) suicide prevention counselors, while guiding them to PM-KISAN, Mudra loan relief, and PMFBY crop insurance claims.

### 5. Bridging the Digital & Literacy Divide
With hands-free voice synthesis and recognition in local languages (English, Tamil, Hindi, Telugu, Bengali, etc.), illiterate, elderly, or disabled citizens can interact with digital services, welfare schemes, and emergency tools purely through voice conversation.

### 6. Closing the Gender Safety Gap in the Night Economy
Women, gig workers, and late-shift employees avoid night travel due to safety fears — a massive economic loss. LifePilot's **continuous GPS tracking, live location sharing with trusted contacts, and instant panic triggers** make night commutes measurably safer. At scale, this unlocks participation of millions of women in the night economy (BPOs, hospitals, logistics, food delivery), directly contributing to GDP growth and gender economic equality.

### 7. Child Trafficking & Missing Persons Prevention at Scale
India reports 100,000+ missing children annually (NCRB 2022). LifePilot's **federated crisis pattern detection** can identify suspicious movement patterns (child moving across state lines with unrelated adults, repeated location changes late at night). Combined with **NCPCR/TrackChild portal integration** and **instant community broadcast alerts**, LifePilot creates a crowd-powered Amber Alert system for India — where every LifePilot device in a 5km radius receives an anonymized missing child alert.

### 8. Disaster Resilience for Remote & Rural Villages
During floods, earthquakes, and cyclones, cellular towers are the first infrastructure to fail. LifePilot's **P2P mesh network** enables SOS signals to hop between devices via Bluetooth/Wi-Fi Direct, reaching rescue teams even when there is ZERO cellular connectivity. For villages with low smartphone penetration, a single LifePilot device in the village acts as a **community beacon**, capable of relaying GPS coordinates and headcounts to NDRF/SDRF command centers.

### 9. Reducing Police Response Overhead & Improving Accountability
Police control rooms are overwhelmed with unstructured voice calls — many requiring manual transcription. LifePilot sends **pre-structured digital alerts** containing incident type, GPS coordinates, timestamp, victim count, and severity score. This reduces average dispatch time, eliminates transcription errors, and creates an **auditable digital trail** that improves police accountability and reduces complaint dismissal rates.

### 10. Enabling Elderly Independent Living
India's 140 million+ senior citizens (Census 2021 projections) increasingly live alone due to urbanization of younger generations. LifePilot's **fall detection** (accelerometer spike + sudden inactivity), **medication reminders**, **daily wellness check-ins** (voice prompt asking "How are you feeling today?"), and **automatic family/hospital alerts** when anomalies are detected (missed check-ins, unusual inactivity, distress keywords) allow elderly citizens to live independently with dignity while maintaining an invisible safety net.

---

## 🚀 BEYOND PRODUCTION: MOONSHOT VISION (2027–2030)

> *"The best way to predict the future is to invent it." — Alan Kay*

These moonshot-grade architectural visions represent the **absolute frontier** of what LifePilot evolves into when scaled from a prototype to a national-grade life infrastructure platform.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              MOONSHOT ARCHITECTURE (12-POINT VISION)                                 │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│ VOICE    │NEURO-    │ DIGITAL  │ DRONE    │ MULTI-   │ QUANTUM  │ LEO SAT  │ AR/XR    │ NATIONAL     │
│ BIOMARK  │MORPHIC   │ TWIN     │ DISPATCH │ AGENT    │ CRYPTO   │ DIRECT   │ SAFE NAV │ SAFETY       │
│ DETECT   │EDGE AI   │ SIMULA.  │ MEDICAL  │ SWARM    │ FUTURE   │ SOS      │ OVERLAY  │ DATA LAKE    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤
│ WAKE     │ OPEN HW  │ CROSS    │ SYNTHETIC│          │          │          │          │              │
│ WORD     │ SOS      │ BORDER   │ DATA     │          │          │          │          │              │
│ TinyML   │ PENDANT  │ INTERPOL │ TRAINING │          │          │          │          │              │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
```

### M1. Voice Biomarker Mental Health Detection (Passive Screening)
- **The Insight:** Clinical research (MIT Lincoln Lab, Stanford) proves that voice carries measurable biomarkers — pitch jitter, harmonic-to-noise ratio (HNR), speech rate variability, and pause duration — that change WEEKS before a person consciously recognizes their own depression, PTSD, or suicidal ideation.
- **Implementation:** Run a lightweight **TinyML spectrogram classifier** (TensorFlow Lite Micro, <500KB) on every voice input. Extract MFCC (Mel-Frequency Cepstral Coefficients) and compare against the user's personal baseline established over time.
- **Intervention Protocol:** When voice biomarkers consistently deviate from baseline for 3+ days (elevated jitter, flattened pitch range, increased pause-to-speech ratio), LifePilot gently initiates a **non-intrusive wellness conversation**: *"Hey, I've noticed you sound a bit different lately. Would you like to talk to someone? I can connect you to Tele-MANAS right now."*
- **Why It Matters:** India loses 170,000+ lives to suicide annually (NCRB 2022). Most victims never explicitly ask for help. Voice biomarkers are the **earliest detectable signal** — earlier than text, behavior, or social withdrawal. This is passive, consent-based, zero-cloud screening that could save tens of thousands of lives.

### M2. Neuromorphic Edge Computing (Always-On, Near-Zero Power)
- **The Problem:** Current smartphone CPUs consume significant power running continuous ML inference. Always-on crisis monitoring drains batteries in hours.
- **Solution:** Integrate with **neuromorphic chips** (Intel Loihi 2, BrainChip Akida, SynSense Xylo) — processors that mimic biological neural networks, consuming **<1mW** during inference (1000x more efficient than GPUs).
- **Application:** A neuromorphic co-processor runs LifePilot's crisis classifier, accelerometer monitor, and voice biomarker detector **24/7** with near-zero battery impact. The main CPU/GPU stays asleep until the neuromorphic chip detects a genuine threat and wakes it.
- **Result:** LifePilot becomes a truly **ambient, invisible safety layer** — always protecting, never draining, never noticed until needed.

### M3. Digital Twin Safety Simulation
- **Concept:** Before the user leaves home each day, LifePilot generates a **digital twin** of their planned route/schedule — a virtual simulation incorporating:
  - Real-time crime data from NCRB + state police APIs
  - Historical accident hotspot data from MORTH (Ministry of Road Transport)
  - Weather forecasts (IMD API) and flood/landslide warnings
  - Crowd density estimates from telecom cell tower load data
  - Construction, diversion, and road closure information
- **Simulation Output:** The digital twin runs a Monte Carlo simulation of thousands of possible scenarios along the planned route, producing a **Risk Probability Distribution** and a **Safest Departure Time Window**.
- **User Experience:** *"JARVIS here. Your usual route through MG Road has a 34% elevated risk today due to reported waterlogging and a political rally. I recommend leaving 20 minutes earlier via Residency Road — that route scores 91/100 safety today."*

### M4. Autonomous Medical Drone Dispatch Integration
- **The Vision:** In cardiac emergencies, snake bites, or severe bleeding, every minute of delay reduces survival probability by 7-10%. India's ambulance average response time is 20-30 minutes in urban areas and 45+ minutes in rural areas.
- **Solution:** LifePilot integrates with **autonomous medical drone networks** (like Zipline, TechEagle, Redwing) to dispatch:
  - **Automated External Defibrillators (AEDs)** for cardiac arrests
  - **Anti-venom kits** for snake/scorpion bites
  - **Bleeding control kits** (tourniquets, hemostatic gauze) for accidents
  - **Epinephrine auto-injectors** for anaphylaxis
- **Protocol:** LifePilot sends GPS coordinates + incident type to the nearest drone hub. Drone arrives in **3-8 minutes** (vs. 30+ for ambulance), drops the medical payload via precision parachute, while LifePilot voice-guides the bystander through usage instructions.
- **Impact:** This literally bridges the "golden hour gap" that kills 1.5 lakh+ Indians annually in road accidents alone (MORTH 2022).

### M5. Multi-Agent AI Swarm Orchestration
- **Architecture:** Instead of a single monolithic AI, LifePilot deploys a **swarm of specialized micro-agents**, each an expert in one domain:
  - 🏥 **MedAgent** — Medical triage, first-aid protocols, drug interactions
  - ⚖️ **LegalAgent** — FIR drafting, rights lookup, lawyer matching
  - 🗺️ **NavAgent** — Safe routing, traffic avoidance, geo-fencing
  - 💰 **FinAgent** — Budget tracking, scheme eligibility, loan comparison
  - 🧠 **PsychAgent** — Emotional support, de-escalation, crisis counseling
  - 📋 **BureauAgent** — Government form filling, document assembly, portal navigation
  - 🔐 **SecAgent** — Encryption, evidence preservation, stealth operations
- **Orchestration:** A master **OrchestratorAgent** decomposes each user request and delegates sub-tasks to the relevant specialist agents. Agents communicate via a shared **blackboard architecture** and can override each other (e.g., MedAgent can interrupt FinAgent mid-conversation if it detects medical distress in the user's voice).
- **Why This Matters:** A single general model is mediocre at everything. Specialist agents are expert-level at their domain. The swarm collectively achieves **superhuman breadth AND depth**.

### M6. Quantum-Resistant Cryptography (Post-Quantum Readiness)
- **The Threat:** Quantum computers (expected 2028-2032) will break RSA-2048 and ECC-256 encryption — the same encryption that protects LifePilot's memory vault, evidence locker, and encrypted sync.
- **Solution:** Migrate all cryptographic primitives to **NIST Post-Quantum Standards**:
  - **ML-KEM (CRYSTALS-Kyber)** for key encapsulation (replacing ECDH)
  - **ML-DSA (CRYSTALS-Dilithium)** for digital signatures (replacing ECDSA)
  - **SLH-DSA (SPHINCS+)** for hash-based stateless signatures as backup
- **Hybrid Mode:** During the transition period, use **hybrid encryption** (classical AES-256-GCM + post-quantum ML-KEM) so that data is protected even if one layer is broken.
- **Why Now:** Evidence collected today (domestic violence recordings, financial harassment logs) may be needed in court 5-10 years from now. If that evidence was encrypted with quantum-vulnerable algorithms, it could be decrypted and tampered with retroactively. Post-quantum encryption ensures **forward secrecy for decades**.

### M7. LEO Satellite Direct-to-Device SOS (Starlink / AST SpaceMobile)
- **The Problem:** Even P2P mesh has limits — in truly remote areas (Ladakh, Andaman Islands, Northeast forests, deep mining areas), there may be zero other devices in mesh range.
- **Solution:** Integrate with **LEO (Low Earth Orbit) satellite direct-to-device protocols**:
  - **AST SpaceMobile** — Standard 4G/5G signals bounced off LEO satellites, no special hardware needed
  - **Starlink Direct to Cell** — SpaceX's satellite-to-phone service
  - **Qualcomm Snapdragon Satellite** — Emergency messaging via Iridium/Globalstar constellation
- **Application:** When LifePilot detects zero cellular AND zero mesh connectivity, it automatically switches to **satellite SOS mode**, transmitting a compressed emergency packet (GPS + incident type + user ID, ~100 bytes) via satellite uplink.
- **Coverage:** This gives LifePilot **100% Earth surface coverage** — oceans, mountains, deserts, forests. No human is ever truly unreachable.

### M8. Augmented Reality Safe Navigation Overlays (WebXR)
- **Implementation:** Using **WebXR Device API** and the phone's rear camera, overlay real-time safety information onto the user's view of the real world:
  - 🟢 **Green path markers** along the safest walking route
  - 🔴 **Red warning zones** where incidents were recently reported
  - 🏥 **Hospital/Police/Shelter markers** floating above actual building locations
  - 📹 **CCTV coverage indicators** showing which stretches are under surveillance
  - 🔦 **Lighting assessment** — highlights poorly-lit stretches and suggests crossing to the better-lit side
- **Night Mode:** At night, AR overlays become higher contrast with glow effects, and LifePilot auto-activates the phone flashlight when entering dark stretches.
- **Why AR Over Maps:** Reading a 2D map while walking is dangerous (screen fixation). AR keeps the user's eyes on the real world while providing safety intelligence as floating contextual overlays in their peripheral vision.

### M9. Custom Wake Word with On-Device TinyML ("Hey JARVIS")
- **Implementation:** Train a custom **keyword spotting model** using **TensorFlow Lite Micro** (<200KB, runs on Cortex-M4) that listens for "Hey JARVIS" or "JARVIS help" as a wake word.
- **Always-On Listening:** The TinyML model runs on a **dedicated low-power DSP** (like Qualcomm Hexagon or Google Edge TPU) consuming <0.5mW, listening 24/7 even when the phone screen is off and the main app is suspended.
- **Voice-Activated Emergency:** Saying "JARVIS help me" in any situation — hands tied, phone in pocket, screen broken — immediately activates the full emergency pipeline. No touch, no unlock, no button press needed.
- **Privacy:** The wake word model runs 100% on-device. Audio is NOT streamed or stored. Only the 1-second clip containing the detected wake word triggers the system.

### M10. Open-Source LifePilot SOS Hardware (Pendant / Wristband)
- **Vision:** Design an open-source hardware reference for a **LifePilot SOS Pendant/Wristband** — a ₹500-1000 device for mass distribution:
  - **ESP32-S3** microcontroller (Wi-Fi + BLE + TinyML capable)
  - **LoRa SX1276** radio module (10km+ range for mesh SOS)
  - **GPS module** (u-blox NEO-6M)
  - **Piezoelectric vibration motor** (haptic alerts)
  - **Single panic button** (large, tactile, waterproof)
  - **Rechargeable LiPo battery** (7-day standby)
- **Use Case:** Distribute to women in rural areas, elderly citizens, school children, construction workers, and delivery personnel who may not own smartphones but need emergency SOS capability.
- **Open Hardware License:** Published under **CERN Open Hardware Licence v2**, allowing any Indian manufacturer (or MSME) to mass-produce locally.

### M11. Cross-Border Emergency Protocol (Interpol / UNHCR Integration)
- **Problem:** Indian tourists abroad, foreign tourists in India, refugees, and trafficking victims crossing borders have no unified emergency system.
- **Solution:** LifePilot implements the **ICAO/Interpol EMER standard** for cross-border emergency interoperability:
  - Automatically detects the user's country via GPS and switches to **local emergency numbers** (911 USA, 999 UK, 000 Australia, 112 EU)
  - Connects to **UNHCR emergency channels** for refugees and stateless persons
  - Sends structured alerts to **Interpol I-24/7 network** for cross-border trafficking cases
  - Translates crisis communication in real-time between the victim's language and local responders' language
- **Impact:** A single app that protects you **anywhere on Earth**, regardless of which country you're in.

### M12. Synthetic Data Engine for Crisis Model Training
- **The Ethical Problem:** Training ML models for crisis detection requires crisis data — real recordings of assaults, abuse, medical emergencies. Using real victim data is deeply unethical and often illegal.
- **Solution:** Build a **Synthetic Crisis Data Generator** using:
  - **Text-to-Speech synthesis** with emotional prosody modeling to generate realistic distress voices
  - **Generative Adversarial Networks (GANs)** to create synthetic accelerometer patterns matching real assault/fall/accident signatures
  - **Large Language Models** to generate thousands of diverse crisis text inputs across languages, dialects, and typo patterns
- **Result:** LifePilot's crisis models are trained exclusively on **synthetic data** — no real victim data is ever collected, stored, or used. The models are then **validated** (not trained) on anonymized, consented, IRB-approved research datasets.
- **Open Dataset:** The synthetic dataset is published openly for the global safety research community, enabling other apps and governments to build better crisis detection without ethical compromises.

---

## 🔮 DEEP SOCIETAL TRANSFORMATION: THE FULLY REALIZED LIFEPILOT ECOSYSTEM

> When LifePilot scales from a single user's phone to millions of devices forming a connected safety mesh, it stops being an app and becomes **societal infrastructure** — like streetlights, ambulances, or the 112 system itself, but smarter, faster, and always in your pocket.

### T1. Eradicating Dowry Deaths Through Pattern Detection
- **India's Reality:** 20+ women die every day due to dowry-related violence (NCRB 2022). Most cases follow a **predictable escalation pattern** — verbal abuse → financial demands → physical violence → murder/suicide — over weeks to months.
- **LifePilot's Intervention:** The voice biomarker system detects increasing distress. The crisis classifier catches phrases about dowry demands, in-law harassment, and financial pressure. The preference graph notices the user searching for "how to file dowry complaint" or "women shelter near me."
- **Pre-Emptive Action:** Before the violence reaches lethal levels, LifePilot initiates a **staged intervention**: (1) Silently shares live GPS with trusted contacts, (2) Pre-drafts a dowry harassment FIR with timestamps of previous incidents, (3) Identifies the nearest One-Stop Centre (Sakhi) and offers voice-guided navigation, (4) Connects to 181 Women Helpline with a single tap.
- **At Scale:** If even 10% of at-risk women have LifePilot, the app creates a **visible deterrent effect** — abusers know that evidence is being silently collected and emergency systems are one shake away.

### T2. Creating India's First National Safety Data Lake (Anonymized, Privacy-First)
- **Vision:** Aggregated, anonymized, differentially-private crisis data from millions of LifePilot devices creates a **National Safety Data Lake** — the world's most granular real-time safety intelligence platform.
- **What It Contains:** Anonymized incident type, time, GPS cluster (not exact location), response time, resolution status — with **differential privacy guarantees** (ε < 1.0) ensuring no individual can ever be identified.
- **Who Uses It:**
  - **Municipal Corporations:** Identify which streets need better lighting, where to deploy more police patrols, which intersections need traffic redesign
  - **NCRB (National Crime Records Bureau):** Real-time crime trend dashboards instead of annual reports published 2 years late
  - **Insurance Companies:** Actuarial models based on real safety data, potentially reducing premiums in LifePilot-dense areas
  - **Urban Planners:** Evidence-based city design — parks, transit routes, commercial zones planned around actual safety patterns
  - **Researchers & NGOs:** Open anonymized datasets for academic safety research, policy papers, and intervention design

### T3. Transforming Emergency Response from Reactive to Predictive
- **Current Model:** Something bad happens → victim calls → police respond → report filed → statistics compiled 2 years later.
- **LifePilot Model:** Federated ML detects emerging crime clusters → **predictive deployment** of police patrols to predicted hotspots → incidents are **prevented before they occur** → real-time dashboards show what was prevented.
- **Analogy:** This is the "Minority Report" model — but instead of fictional pre-cogs, it uses **real statistical patterns** from community safety data. If Friday nights between 10 PM and 2 AM in a specific 500m zone consistently show elevated harassment incidents, police patrols are automatically recommended for that zone during those hours.
- **Measurable KPI:** Reduction in first-occurrence crimes (not just faster response to existing crimes).

### T4. Reducing Insurance Premiums Through Verified Safety Adoption
- **Insurance Economics:** Health, vehicle, and life insurance premiums are priced on risk. LifePilot users demonstrably have:
  - Faster emergency response times (reduced severity of injuries)
  - Better golden-hour outcomes (lower mortality from same accidents)
  - Continuous health monitoring (earlier detection of chronic conditions)
  - Documented evidence for claims (reduced fraud)
- **Insurance Partnership Model:** Insurance companies offer **5-15% premium discounts** to verified LifePilot users — similar to how car insurance discounts apply for dashcams or safe-driving apps.
- **Societal Effect:** Financial incentive drives mass adoption → more users → denser safety mesh → safer communities → further premium reduction. A **virtuous cycle**.

### T5. Empowering 27 Million Persons with Disabilities (PwD) for Full Autonomy
- **India's PwD Population:** 26.8 million (Census 2011, likely 40M+ now). Most assistive technology is expensive, imported, and English-only.
- **LifePilot for PwD:**
  - **Blind users:** Full voice-driven interaction + AR audio beacons for navigation + haptic vibration patterns for alerts
  - **Deaf users:** Visual alert system + vibration-coded emergency patterns + auto-generated text transcripts of all crisis audio
  - **Motor-impaired users:** Wake word activation ("Hey JARVIS") eliminates need for touch. Eye-tracking integration via front camera for hands-free navigation.
  - **Cognitive disabilities:** Simplified voice prompts, step-by-step guided procedures, automatic contact of designated caregiver for complex situations
- **Impact:** For the first time, a PwD citizen in a rural village can independently call an ambulance, file a police complaint, apply for a disability pension, or navigate to a hospital — using only their voice in their own language.

### T6. Fighting Misinformation During Crises (Verified Channel Only)
- **The Problem:** During disasters, riots, or public health emergencies, WhatsApp forwards and social media spread dangerous misinformation (fake rescue numbers, wrong medical advice, communal provocation).
- **LifePilot's Approach:** During detected crisis events, LifePilot activates **Verified Channel Mode**:
  - Only surfaces information from **verified government sources** (NDMA, IMD, ICMR, state disaster management authorities)
  - Cross-references user-reported incidents against official disaster declarations
  - Flags and suppresses unverified forwards that contradict official advisories
  - Provides **source attribution** for every piece of crisis information displayed
- **Example:** During a flood, instead of panicking from WhatsApp forwards saying "dam broken," LifePilot shows: *"IMD Official Alert (verified 14:32 IST): Heavy rainfall warning for your district. River level at 2.1m (danger: 3.0m). No dam breach reported. Nearest relief camp: Government School, Sector 14 — 2.3 km from you."*

### T7. Migrant Worker & Labor Rights Protection
- **India's Reality:** 450+ million internal migrant workers (Economic Survey 2017) face wage theft, unsafe working conditions, trafficking, and complete lack of legal awareness.
- **LifePilot for Migrants:**
  - **Wage Tracking:** Voice-logged daily wage entries create an undeniable digital record for labor court disputes
  - **Contractor Accountability:** GPS + timestamp logs prove presence at work sites, countering employers who deny employment
  - **Inter-State Legal Bridge:** Automatically identifies which state's labor laws apply and connects to the correct Labor Commissioner helpline
  - **Building & Bridging Workers Act Compliance:** Alerts unregistered construction workers about their right to register for BOCW welfare benefits (pension, health insurance, education grants for children)
  - **Language Bridge:** Migrant from Bihar working in Tamil Nadu can interact in Hindi/Bhojpuri while LifePilot translates emergency communications into Tamil for local authorities

### T8. Environmental & Public Health Early Warning Network
- **Crowd-Sourced Environmental Monitoring:** LifePilot devices with connected IoT sensors (air quality, water level, temperature, humidity) create a **distributed environmental sensor network** across cities and villages:
  - **Air Quality Index (AQI) Alerts:** When local AQI exceeds 200 (Very Poor), LifePilot warns outdoor workers, asthmatics, and elderly to stay indoors and provides nearest clean-air shelter locations
  - **Flood Early Warning:** Water level sensors in streams/rivers relay real-time data through the P2P mesh. When levels cross danger thresholds, upstream LifePilot devices trigger evacuation alerts for downstream villages — **minutes before official warnings reach them**
  - **Heatwave Mortality Prevention:** During heatwaves (India loses 2,000+ lives annually), LifePilot monitors ambient temperature via phone sensors and reminds vulnerable users (elderly, outdoor workers, construction laborers) to hydrate, rest, and seek shade — with nearest cooling center locations
  - **Epidemic Symptom Clustering:** If multiple LifePilot users in a geographic cluster report similar symptoms (fever + body ache + cough), the system flags a potential **disease outbreak** to district health authorities via IDSP (Integrated Disease Surveillance Programme), enabling rapid containment before exponential spread

---

## 🎯 PROBLEM STATEMENT & MULTI-SECTOR IMPACT

### 1. The Core Problems LifePilot Solves
- **Critical Delay During Emergencies:** In panic situations (assault, stalking, domestic abuse, acid attack, accidents), victims cannot spend minutes searching for numbers, typing messages, or navigating complex app menus.
- **Fragmented Emergency Infrastructure:** People do not know which specific helpline to call (e.g., Cybercrime is 1930, Childline is 1098, Elderline is 14567, Women Safety is 1091, Ambulance is 108, National Emergency is 112).
- **Ignorance of Legal Rights & Welfare Schemes:** Millions of eligible citizens remain unaware of free legal aid (NALSA), Zero FIR rights, government shelter homes (Sakhi / Swadhar Greh), POSH Act protections, or agricultural relief schemes (PM-KISAN / PMFBY).
- **Cloud Dependency & Privacy Invasive AI:** Existing AI agents stream private user voices, locations, and personal thoughts to central cloud servers, requiring monthly subscriptions and internet connectivity.

---

## ⚡ The 8 Pillars of Current Functionality

```
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
Supports 15 foundational real-world action primitives. Automatically decomposes complex multi-step requests (*"I'm moving to Bangalore next month"*) into multi-card execution trees.

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

## 📜 License & Privacy

**LifePilot** is open-source, local-first software. All user data, preference graphs, and memory logs remain exclusively on the user's local device inside IndexedDB, encrypted with AES-256-GCM. Zero user data is transmitted to external servers.
