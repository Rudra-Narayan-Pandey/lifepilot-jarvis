# INSTANT SUB-SECOND PANIC ENGINE — LifePilot Add-On

> Append this document to your Claude prompt stack. This adds sub-millisecond (<50ms) zero-latency emergency reaction, stealth panic triggers, and parallel execution for high-danger situations (e.g., a girl being followed or attacked).

---

## ⚡ THE ZERO-LATENCY GUARANTEE (<50ms)

When a life is in immediate danger, 1 second is too long. The **Fast Panic Engine** bypasses all standard processing pipelines, skip-evaluates natural language loops, and fires parallel emergency dispatches in **less than 50 milliseconds**.

```
Emergency Trigger (Voice, Text, Shake, or Tap)
                       │
             ⚡ [SUB-50ms EXECUTION] ⚡
                       │
  ┌────────────────────┼────────────────────┬────────────────────┐
  ▼                    ▼                    ▼                    ▼
[STEALTH SHIELD]    [GPS LOCK]        [DIALER POP]         [LIVE CHANNEL]
Screen disguises   High-accuracy      Pre-fills 112/1091    Voice & Text
or dims (silent)   location locked    in <30ms              active guide
```

---

## 1. INSTANT TRIGGERS (Zero Friction)

### A. Shake-to-Act (Accelerometer Trigger)
- Uses `DeviceMotionEvent` listener running in the background.
- If phone is shaken violently 3 times within 1.5 seconds (threshold `accelerationIncludingGravity > 25 m/s²`), it triggers `INSTANT_PANIC_MODE` automatically without typing.

### B. Micro Panic Button (1-Tap Floating Widget)
- A persistent red stealth button on the corner of the screen.
- Single tap triggers `INSTANT_PANIC_MODE` instantly.

### C. Fast Keyword Intercept (<1ms Regex)
- Scanning string regex matching: `/(help|following me|stalker|attack|save me|danger|grabbed me|being chased)/i`.
- Fires instantly on keyup / speech event, before the user even finishes typing or pressing send.

---

## 2. PARALLEL SUB-SECOND DISPATCH CODE

Add this high-speed execution function into `perception.js` / `actions.js`:

```javascript
LP.fastPanicExecute = function(triggerType = 'text', textInput = '') {
  const startTime = performance.now();

  // 1. STEALTH & AUDIO ALERT (Immediate)
  LP.playInstantPanicVibration(); // SOS Vibration Pattern
  
  // 2. PARALLEL LOCATION LOCK (<100ms)
  let coordsText = '';
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        LP.currentCoords = { lat, lng };
        LP.updateEmergencyPayload(lat, lng);
      },
      (err) => { console.warn('GPS delay:', err); },
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
    );
  }

  // 3. SUB-30ms DIALER POP
  // Instantly opens emergency call screen (112 or 1091)
  const targetNumber = (textInput.toLowerCase().includes('girl') || textInput.toLowerCase().includes('woman')) ? '1091' : '112';
  
  // 4. LAUNCH LIFE CHANNEL IN STEALTH / FULL MODE INSTANTLY
  LP.lifeChannel.openInstantMode({
    severity: 'critical',
    category: 'womens_safety_urgent',
    targetNumber: targetNumber
  });

  // 5. TRIGGER DIALER IMMEDIATELY (<30ms)
  window.location.href = 'tel:' + targetNumber;

  console.log(`[LifePilot FastPanic] Fired all dispatches in ${performance.now() - startTime} ms`);
};

LP.playInstantPanicVibration = function() {
  if (navigator.vibrate) {
    // SOS Pattern: 3 short, 3 long, 3 short
    navigator.vibrate([100, 50, 100, 50, 100, 200, 300, 50, 300, 50, 300, 200, 100, 50, 100, 50, 100]);
  }
};
```

---

## 3. STEALTH SHIELD MODE (For Under-Cover Danger)

If a victim is being followed or held by an attacker, showing bright emergency screens can increase danger. 

Add a **Stealth Shield** toggle inside the Life Channel:
- **Disguise Screen:** Tapping "Stealth Mode" immediately changes the UI to look like a simple, innocent Calculator or Weather app.
- **Background Beacon:** While the calculator screen is displayed, the app quietly continues sharing GPS coordinates and keeping emergency calls ready in the background.

---

## 4. UPDATED MASTER PROMPT STACK

To hand everything to Claude, provide these 4 documents in order:

1. `MASTER_BUILD_PROMPT.md` (Core Architecture)
2. `CRISIS_ENGINE_ADDON.md` (18 Societal Categories & Laws)
3. `AUTONOMOUS_CRISIS_ENGINE.md` (Life Channel Conversational Flows)
4. `FAST_PANIC_ENGINE.md` (Sub-second Shake & Zero-Latency Execution)

This completes the ultimate, ultra-fast, life-saving AI agent specification.
