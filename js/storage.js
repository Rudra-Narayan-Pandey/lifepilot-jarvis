/* ============================================================
   LifePilot — Storage
   Settings (localStorage) + Layer 5.3 encryption helpers (Web
   Crypto AES-256-GCM, PBKDF2-derived key from a user passphrase).
   Episodic/fact/skill/habit storage itself lives in memory.js
   (IndexedDB); this module handles settings + the encrypt/decrypt
   wrapper used by export/import.
   ============================================================ */

LP.store = {
  KEYS: { SETTINGS: 'lifepilot_settings_v2', BUDGET: 'lifepilot_budget_v2', ONBOARDED: 'lifepilot_onboarded_v2' },

  defaultSettings() {
    return {
      language: 'en',
      voiceEnabled: true,
      voiceOutputEnabled: true,
      shakeTriggerEnabled: false,
      autoFireOrdinary: true,
      theme: 'dark', // 'dark' | 'light' | 'system'
      accentColor: '#3B82F6',
      userName: '',
      homeCity: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      passphraseSet: false,
      clipboardListenerEnabled: false
    };
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(this.KEYS.SETTINGS);
      if (!raw) return this.defaultSettings();
      return Object.assign(this.defaultSettings(), JSON.parse(raw));
    } catch (e) { return this.defaultSettings(); }
  },

  saveSettings(settings) { localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings)); },

  isOnboarded() { return localStorage.getItem(this.KEYS.ONBOARDED) === 'true'; },
  setOnboarded() { localStorage.setItem(this.KEYS.ONBOARDED, 'true'); },

  getBudget() {
    try {
      const raw = localStorage.getItem(this.KEYS.BUDGET);
      return raw ? JSON.parse(raw) : { total: 15000, currency: 'INR', reserved: 0, items: [] };
    } catch (e) { return { total: 15000, currency: 'INR', reserved: 0, items: [] }; }
  },

  saveBudget(b) { localStorage.setItem(this.KEYS.BUDGET, JSON.stringify(b)); },

  reserveBudget(amount, label) {
    const b = this.getBudget();
    b.reserved += amount;
    b.items.push({ amount, label, at: Date.now() });
    this.saveBudget(b);
    return b;
  },

  /* -------------------------------------------------------------
     5.3 — Encrypted local storage (Web Crypto AES-256-GCM + PBKDF2)
     If no passphrase is set, export data is stored/returned as
     plain JSON — this is disclosed plainly in Settings, per spec.
  ------------------------------------------------------------- */

  async deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  async encryptJSON(obj, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return {
      encrypted: true,
      salt: Array.from(salt),
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext))
    };
  },

  async decryptJSON(payload, passphrase) {
    const salt = new Uint8Array(payload.salt);
    const iv = new Uint8Array(payload.iv);
    const key = await this.deriveKey(passphrase, salt);
    const data = new Uint8Array(payload.data);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(new TextDecoder().decode(plaintext));
  },

  downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
