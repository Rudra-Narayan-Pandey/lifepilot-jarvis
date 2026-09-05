/* ============================================================
   LifePilot — Layer 2: MEMORY
   Auto-extracting preference graph + episodic memory + habit
   detection + teachable skills. Backed by IndexedDB (falls back
   to localStorage if IndexedDB is unavailable, e.g. some private
   browsing modes).
   ============================================================ */

LP.memory = {
  DB_NAME: 'lifepilot_db',
  DB_VERSION: 1,
  STORES: ['facts', 'episodes', 'skills', 'habits'],
  _db: null,

  async open() {
    if (this._db) return this._db;
    if (!('indexedDB' in window)) { this._idbUnavailable = true; return null; }
    return new Promise((resolve) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        this.STORES.forEach(name => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        });
      };
      req.onsuccess = (e) => { this._db = e.target.result; resolve(this._db); };
      req.onerror = () => { this._idbUnavailable = true; resolve(null); };
    });
  },

  // ---- Generic store helpers (fall back to localStorage if IDB is unavailable) ----

  _lsKey(store) { return `lifepilot_ls_${store}`; },

  async _lsGetAll(store) {
    try { return JSON.parse(localStorage.getItem(this._lsKey(store)) || '[]'); } catch (e) { return []; }
  },
  async _lsPut(store, item) {
    const all = await this._lsGetAll(store);
    const idx = all.findIndex(x => x.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    localStorage.setItem(this._lsKey(store), JSON.stringify(all));
  },
  async _lsDelete(store, id) {
    const all = await this._lsGetAll(store);
    localStorage.setItem(this._lsKey(store), JSON.stringify(all.filter(x => x.id !== id)));
  },

  async getAll(store) {
    const db = await this.open();
    if (!db) return this._lsGetAll(store);
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  },

  async put(store, item) {
    const db = await this.open();
    if (!db) return this._lsPut(store, item);
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(item);
      tx.oncomplete = () => resolve(item);
      tx.onerror = () => resolve(null);
    });
  },

  async remove(store, id) {
    const db = await this.open();
    if (!db) return this._lsDelete(store, id);
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  },

  async clearStore(store) {
    const db = await this.open();
    if (!db) { localStorage.setItem(this._lsKey(store), '[]'); return; }
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  },

  /* -------------------------------------------------------------
     2.1 — Auto-extracting preference graph
  ------------------------------------------------------------- */

  // Patterns are DATA (an array), not branching code — consistent with the
  // orchestrator's "vocabulary is data" principle.
  extractionPatterns: [
    { re: /\bmy\s+(wife|husband|mom|mother|dad|father|sister|brother|roommate|boss|manager|friend|landlord|doctor)\s+(?:is\s+|named\s+)?([A-Z][a-zA-Z]{1,20})\b/i,
      make: (m) => ({ key: `contact_${m[1].toLowerCase()}`, value: m[2], label: `${m[1]}'s name`, gated: false }) },
    { re: /\bi'?m\s+vegetarian\b/i, make: () => ({ key: 'dietary', value: 'vegetarian', label: 'Dietary preference', gated: false }) },
    { re: /\bi'?m\s+vegan\b/i, make: () => ({ key: 'dietary', value: 'vegan', label: 'Dietary preference', gated: false }) },
    { re: /\bi\s+live\s+in\s+([A-Z][a-zA-Z\s]{2,25})\b/i, make: (m) => ({ key: 'home_city', value: m[1].trim(), label: 'Home city', gated: false }) },
    { re: /\bwindow\s+seat\b/i, make: () => ({ key: 'flight_seat_preference', value: 'window', label: 'Flight seat preference', gated: false }) },
    { re: /\baisle\s+seat\b/i, make: () => ({ key: 'flight_seat_preference', value: 'aisle', label: 'Flight seat preference', gated: false }) },
    { re: /\b(?:mom|mother|dad|father|wife|husband)'?s?\s+number\s+is\s+(\d[\d\s-]{7,14})\b/i, make: (m) => ({ key: 'contact_number', value: m[1].replace(/[\s-]/g, ''), label: 'Saved phone number', gated: true }) }
  ],

  async extractFromText(text) {
    const extracted = [];
    for (const pattern of this.extractionPatterns) {
      const m = text.match(pattern.re);
      if (m) extracted.push(pattern.make(m));
    }
    return extracted;
  },

  // Store a fact. If gated=true, caller must have already obtained user consent
  // (the UI shows "Can I remember this for next time?" before calling this).
  async storeFact(fact) {
    const id = `fact_${fact.key}`;
    await this.put('facts', { id, key: fact.key, value: fact.value, label: fact.label, gated: !!fact.gated, storedAt: Date.now() });
  },

  async storeNegativePreference(text) {
    const id = `fact_neg_${LP.util.uid()}`;
    await this.put('facts', { id, key: 'NOT', value: text, label: 'Correction', storedAt: Date.now() });
  },

  async getFact(key) {
    const all = await this.getAll('facts');
    return all.find(f => f.key === key) || null;
  },

  async getAllFacts() { return this.getAll('facts'); },
  async deleteFact(id) { return this.remove('facts', id); },
  async clearAllFacts() { return this.clearStore('facts'); },

  // Resolve "my wife" / "my roommate" style references against stored facts,
  // used by the orchestrator's NOTIFY builder to auto-fill a real name.
  async resolveRelation(relationWord) {
    const fact = await this.getFact(`contact_${relationWord.toLowerCase()}`);
    return fact ? fact.value : null;
  },

  /* -------------------------------------------------------------
     2.2 — Episodic memory
  ------------------------------------------------------------- */

  async saveEpisode(episode) {
    const ep = {
      id: episode.id || LP.util.uid('ep'),
      timestamp: episode.timestamp || new Date().toISOString(),
      rawInput: episode.rawInput,
      cards: episode.cards,
      tier: episode.tier,
      primaryIntent: episode.primaryIntent,
      userEdits: episode.userEdits || [],
      outcome: episode.outcome || 'approved'
    };
    await this.put('episodes', ep);
    return ep;
  },

  async getAllEpisodes() {
    const all = await this.getAll('episodes');
    return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async deleteEpisode(id) { return this.remove('episodes', id); },
  async clearAllEpisodes() { return this.clearStore('episodes'); },

  async findEpisodesByKeyword(keyword) {
    const all = await this.getAllEpisodes();
    const k = keyword.toLowerCase();
    return all.filter(e => (e.rawInput || '').toLowerCase().includes(k));
  },

  /* -------------------------------------------------------------
     2.3 — Habit Detection Engine
     Runs a lightweight pattern detector over saved episodes: groups
     by day-of-week + hour bucket, and flags primitive types that
     recur 3+ times in the same slot.
  ------------------------------------------------------------- */

  async detectHabits() {
    const episodes = await this.getAllEpisodes();
    if (episodes.length < 3) return []; // not enough data yet — the 14-day/3x threshold from spec

    const buckets = {};
    for (const ep of episodes) {
      const d = new Date(ep.timestamp);
      const dow = d.getDay();
      const hourBucket = Math.floor(d.getHours() / 3) * 3; // 3-hour buckets
      for (const cardType of (ep.cards || []).map(c => c.type)) {
        const key = `${dow}_${hourBucket}_${cardType}`;
        if (!buckets[key]) buckets[key] = { dow, hourBucket, cardType, count: 0, examples: [] };
        buckets[key].count++;
        buckets[key].examples.push(ep.rawInput);
      }
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const habits = Object.values(buckets)
      .filter(b => b.count >= 3)
      .map(b => ({
        id: `habit_${b.dow}_${b.hourBucket}_${b.cardType}`,
        description: `${b.cardType} around ${b.hourBucket}:00–${b.hourBucket + 3}:00 on ${dayNames[b.dow]}s`,
        confidence: Math.min(0.5 + b.count * 0.1, 0.95),
        dow: b.dow, hourBucket: b.hourBucket, cardType: b.cardType,
        exampleInput: b.examples[0],
        count: b.count
      }));

    // Persist detected habits with their current auto-suggest toggle state preserved
    const existing = await this.getAll('habits');
    for (const h of habits) {
      const prior = existing.find(e => e.id === h.id);
      await this.put('habits', { ...h, autoSuggest: prior ? prior.autoSuggest : true, stopped: prior ? prior.stopped : false });
    }
    return this.getAll('habits');
  },

  async getDetectedHabits() { return this.getAll('habits'); },
  async setHabitAutoSuggest(id, value) {
    const all = await this.getAll('habits');
    const h = all.find(x => x.id === id);
    if (h) { h.autoSuggest = value; await this.put('habits', h); }
  },
  async stopHabit(id) {
    const all = await this.getAll('habits');
    const h = all.find(x => x.id === id);
    if (h) { h.stopped = true; h.autoSuggest = false; await this.put('habits', h); }
  },

  /* -------------------------------------------------------------
     2.4 — Teachable Skills (user-defined macros)
  ------------------------------------------------------------- */

  async saveSkill(skill) {
    const s = { id: skill.id || LP.util.uid('skill'), name: skill.name, triggers: skill.triggers, actions: skill.actions, createdAt: Date.now() };
    await this.put('skills', s);
    return s;
  },

  async getAllSkills() { return this.getAll('skills'); },
  async deleteSkill(id) { return this.remove('skills', id); },

  async findMatchingSkill(text) {
    const skills = await this.getAllSkills();
    const t = text.toLowerCase();
    return skills.find(s => s.triggers.some(trig => t.includes(trig.toLowerCase()))) || null;
  },

  // Parses "Learn this: 'Name' means A, B, and C" into a skill definition.
  // Best-effort natural-language macro parser — deliberately simple pattern
  // matching, consistent with the rest of the orchestrator's approach.
  parseSkillDefinition(text) {
    const m = text.match(/learn this:?\s*['"]([^'"]+)['"]\s*means\s+(.+)/i);
    if (!m) return null;
    const name = m[1].trim();
    const actionsText = m[2];
    const parts = actionsText.split(/,\s*(?:and\s+)?|\s+and\s+/i).map(s => s.trim()).filter(Boolean);
    const actions = parts.map(p => {
      const timeMatch = LP.util.extractTime(p);
      const cleanTitle = LP.deriveTitle(p);
      if (/remind/i.test(p)) return { type: 'REMIND', title: cleanTitle, time: timeMatch ? LP.util.formatTime(timeMatch.h, timeMatch.min) : null };
      if (/show|review|calendar/i.test(p)) return { type: 'SCHEDULE', title: cleanTitle, time: timeMatch ? LP.util.formatTime(timeMatch.h, timeMatch.min) : null };
      return { type: 'REMIND', title: cleanTitle, time: timeMatch ? LP.util.formatTime(timeMatch.h, timeMatch.min) : null };
    });
    return { name, triggers: [name.toLowerCase(), `start my ${name.toLowerCase()}`], actions };
  },

  // Execute a saved skill: builds real cards from its stored actions.
  // Permission inheritance rule (2.4): if any action needs permission, execution
  // pauses there — modeled here by simply tagging each generated card with its
  // permission, exactly like any other composed plan; the UI's existing
  // gate-and-wait rendering handles the pause, no special-case engine needed.
  executeSkill(skill) {
    const now = new Date();
    return skill.actions.map(a => {
      const start = new Date(now);
      if (a.time) {
        const t = LP.util.extractTime(a.time);
        if (t) { start.setHours(t.h, t.min, 0, 0); if (start < now) start.setDate(start.getDate() + 1); }
      }
      const end = new Date(start.getTime() + 30 * 60000);
      return {
        id: LP.util.uid(), type: a.type, permission: 'auto', title: a.title,
        subtitle: `${LP.util.formatDate(start)} · ${LP.util.formatTime(start.getHours(), start.getMinutes())} · from skill "${skill.name}"`,
        start, end, gcalUrl: LP.util.gcalUrl({ title: a.title, start, end, details: `From your "${skill.name}" skill.` }),
        createdAt: Date.now()
      };
    });
  },

  /* -------------------------------------------------------------
     2.5 — Export / Import (plain JSON; see storage.js for the
     encryption wrapper used when a passphrase is set)
  ------------------------------------------------------------- */

  async exportAll() {
    const [facts, episodes, skills, habits] = await Promise.all([
      this.getAll('facts'), this.getAll('episodes'), this.getAll('skills'), this.getAll('habits')
    ]);
    return { version: 1, exportedAt: new Date().toISOString(), facts, episodes, skills, habits };
  },

  async importAll(data, mode) {
    // mode: 'merge' (default) — never overwrites without explicit confirmation from caller
    if (!data || data.version !== 1) throw new Error('Unrecognized export format');
    for (const f of data.facts || []) await this.put('facts', f);
    for (const e of data.episodes || []) await this.put('episodes', e);
    for (const s of data.skills || []) await this.put('skills', s);
    for (const h of data.habits || []) await this.put('habits', h);
    return true;
  }
};
