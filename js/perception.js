/* ============================================================
   LifePilot — Layer 0: PERCEPTION
   All the ways the app can receive input: text, voice, camera/OCR,
   clipboard image paste, PDF drop, clipboard-text listener, and
   ambient context. Each function degrades honestly if a browser
   capability is missing — never fakes support.
   ============================================================ */

LP.perception = {

  /* -------------------------------------------------------------
     0.2 — Voice input (continuous dictation, en-IN by default)
  ------------------------------------------------------------- */

  isVoiceSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  createRecognizer(lang) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = lang || 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    return rec;
  },

  /* -------------------------------------------------------------
     Voice OUTPUT — speaks action-plan summaries back to the user.
     Drives the Voice Orb's "speaking" state via onStart/onEnd
     callbacks; degrades silently (returns false) if unsupported.
  ------------------------------------------------------------- */
  isSpeechSynthesisSupported() {
    return 'speechSynthesis' in window;
  },

  speak(text, opts = {}) {
    if (!this.isSpeechSynthesisSupported() || !text) {
      if (opts.onEnd) opts.onEnd();
      return false;
    }
    window.speechSynthesis.cancel(); // don't stack multiple briefings
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = opts.lang || 'en-IN';
    utter.rate = opts.rate || 1.0;
    utter.pitch = opts.pitch || 1.0;
    if (opts.onStart) utter.onstart = opts.onStart;
    if (opts.onEnd) utter.onend = opts.onEnd;
    utter.onerror = () => { if (opts.onEnd) opts.onEnd(); };
    window.speechSynthesis.speak(utter);
    return true;
  },

  stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
  },

  /* -------------------------------------------------------------
     Contact Picker API — lets the person attach a real phone number
     to a NOTIFY card instead of relying on a name match from Memory.
     Chromium-on-Android only at present; degrades to `null` (the UI
     falls back to a generic WhatsApp/SMS composer) everywhere else.
     Requires a user gesture — never called on page load.
  ------------------------------------------------------------- */
  isContactPickerSupported() {
    return !!(navigator.contacts && navigator.contacts.select && window.ContactsManager);
  },

  async pickContact() {
    if (!this.isContactPickerSupported()) return null;
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      const contacts = await navigator.contacts.select(props, opts);
      if (!contacts || !contacts.length) return null;
      const c = contacts[0];
      return {
        name: (c.name && c.name[0]) || null,
        tel: (c.tel && c.tel[0]) || null
      };
    } catch (e) {
      return null; // permission denied or user cancelled — fail quietly
    }
  },

  /* -------------------------------------------------------------
     0.3 — Camera / vision input (OCR via Tesseract.js, loaded on demand)
  ------------------------------------------------------------- */

  _tesseractLoaded: false,

  async loadTesseract() {
    if (this._tesseractLoaded && window.Tesseract) return window.Tesseract;
    if (window.Tesseract) { this._tesseractLoaded = true; return window.Tesseract; }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js';
      script.onload = () => { this._tesseractLoaded = true; resolve(window.Tesseract); };
      script.onerror = () => reject(new Error('Could not load OCR library — check your connection.'));
      document.head.appendChild(script);
    });
  },

  async runOCR(imageSourceOrFile, onProgress) {
    const Tesseract = await this.loadTesseract();
    const result = await Tesseract.recognize(imageSourceOrFile, 'eng', {
      logger: (m) => { if (onProgress && m.status === 'recognizing text') onProgress(m.progress); }
    });
    const text = (result.data && result.data.text) ? result.data.text.trim() : '';
    return text;
  },

  // Wraps OCR with the "couldn't read this clearly" honesty rule from spec 0.3.6
  async runOCRWithFallback(imageSourceOrFile, onProgress) {
    try {
      const text = await this.runOCR(imageSourceOrFile, onProgress);
      if (text.length < 5) {
        return { ok: false, text: '', message: "Couldn't read this image clearly. Try a sharper photo or type what you see." };
      }
      return { ok: true, text, message: null };
    } catch (e) {
      return { ok: false, text: '', message: "Couldn't run text recognition right now — " + e.message };
    }
  },

  /* -------------------------------------------------------------
     0.4 — Screenshot / clipboard image paste
  ------------------------------------------------------------- */

  extractImageFromClipboardEvent(pasteEvent) {
    const items = (pasteEvent.clipboardData || {}).items || [];
    for (const item of items) {
      if (item.type && item.type.startsWith('image/')) {
        return item.getAsFile();
      }
    }
    return null;
  },

  /* -------------------------------------------------------------
     0.5 — File drop / PDF parsing (pdf.js, loaded on demand)
  ------------------------------------------------------------- */

  _pdfjsLoaded: false,

  async loadPdfJs() {
    if (this._pdfjsLoaded && window.pdfjsLib) return window.pdfjsLib;
    if (window.pdfjsLib) { this._pdfjsLoaded = true; return window.pdfjsLib; }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
        this._pdfjsLoaded = true;
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error('Could not load PDF reader — check your connection.'));
      document.head.appendChild(script);
    });
  },

  async extractTextFromPDF(fileOrArrayBuffer, onProgress) {
    const pdfjsLib = await this.loadPdfJs();
    const data = fileOrArrayBuffer instanceof File ? await fileOrArrayBuffer.arrayBuffer() : fileOrArrayBuffer;
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(it => it.str).join(' ');
      fullText += pageText + '\n';
      if (onProgress) onProgress(i / pdf.numPages);
    }
    fullText = fullText.trim();

    // If the PDF is image-based (near-empty text layer), fall back to OCR on a
    // rendered page image, per spec 0.5.
    if (fullText.length < 20 && pdf.numPages > 0) {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const ocrResult = await this.runOCRWithFallback(canvas);
      return ocrResult.ok ? ocrResult.text : fullText;
    }
    return fullText;
  },

  /* -------------------------------------------------------------
     0.6 — Clipboard text listener (banner: "Copied: ... handle this?")
     Requires user permission via the Permissions/Clipboard API and
     is only checked when the app is foregrounded (visibilitychange),
     never polled continuously in the background.
  ------------------------------------------------------------- */

  _lastSeenClipboard: null,

  async checkClipboardForBanner() {
    if (!navigator.clipboard || !navigator.clipboard.readText) return null;
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim().length < 8) return null;
      if (text === this._lastSeenClipboard) return null; // already dismissed/shown this one
      this._lastSeenClipboard = text;
      return text.trim();
    } catch (e) {
      // Permission not granted or denied — fail silently, this is a passive
      // convenience feature, not a required one.
      return null;
    }
  },

  /* -------------------------------------------------------------
     0.7 — Ambient context (passive sensors)
  ------------------------------------------------------------- */

  getTimeOfDay() {
    const h = new Date().getHours();
    if (h < 5) return 'night';
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    if (h < 21) return 'evening';
    return 'night';
  },

  async getBatteryLevel() {
    try {
      if (navigator.getBattery) {
        const b = await navigator.getBattery();
        return b.level;
      }
    } catch (e) { /* not supported */ }
    return null;
  },

  // Never called proactively — only right before a NAVIGATE action fires,
  // per spec 0.7. Returns null (not a rejection thrown) if denied.
  getGeoLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 4000 }
      );
    });
  },

  // Crisis-only location fetch — used by the Life Channel / Fast Panic
  // Engine, which are themselves only reachable after a crisis phrase,
  // shake gesture, or explicit panic-button tap. Never runs on page load.
  startLocationTracking() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          LP.currentLocation = coords;
          resolve(coords);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  },

  async buildAmbientContext() {
    return {
      timestamp: new Date().toISOString(),
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: new Date().toLocaleDateString('en', { weekday: 'long' }),
      batteryLevel: await this.getBatteryLevel(),
      isOnline: navigator.onLine,
      geoLocation: null // populated only when a NAVIGATE action is about to fire
    };
  }
};
