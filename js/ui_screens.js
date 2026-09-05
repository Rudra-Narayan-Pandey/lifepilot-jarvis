/* ============================================================
   LifePilot — Layer 4 (continued): HISTORY, HABITS & GOALS, SETTINGS
   ============================================================ */

Object.assign(App, {

  /* ============== HISTORY (Screen 3) ============== */

  async renderHistoryView(root) {
    const episodes = await LP.memory.getAllEpisodes();
    const el = document.createElement('div');
    el.className = 'view view--history';
    el.innerHTML = `
      <header class="page-header"><h1>${this.t('historyTitle')}</h1></header>
      <input type="text" id="history-search" class="search-bar" placeholder="Search past episodes…" />
      <div class="history-list" id="history-list"></div>
    `;
    root.appendChild(el);

    const renderList = (list) => {
      const container = el.querySelector('#history-list');
      if (list.length === 0) { container.innerHTML = `<div class="empty-state"><p>${this.t('historyEmpty')}</p></div>`; return; }
      container.innerHTML = list.map(ep => `
        <div class="history-item" data-history-id="${ep.id}">
          <div class="history-item__main" data-open="${ep.id}">
            <p class="history-item__input">"${this.escapeHtml(ep.rawInput)}"</p>
            <p class="history-item__meta">${new Date(ep.timestamp).toLocaleString()} · ${(ep.cards || []).length} action${(ep.cards || []).length === 1 ? '' : 's'} · <span class="status-badge status-badge--${ep.outcome}">${ep.outcome}</span></p>
          </div>
          <button class="history-item__delete" data-delete="${ep.id}" aria-label="Delete">${this.svgIcon('trash')}</button>
        </div>`).join('');

      container.querySelectorAll('[data-open]').forEach(node => {
        node.addEventListener('click', () => {
          const id = node.getAttribute('data-open');
          const entry = list.find(e => e.id === id);
          if (!entry) return;
          const cards = (entry.cards || []).map(c => { const copy = { ...c }; if (copy.start) copy.start = new Date(copy.start); if (copy.end) copy.end = new Date(copy.end); return copy; });
          this.state.currentPlan = { tier: entry.tier, primaryIntent: entry.primaryIntent, cards, tree: LP.wrapTree(cards), text: entry.rawInput, tone: LP.analyzeTone(entry.rawInput) };
          location.hash = '#/plan';
        });
      });
      container.querySelectorAll('[data-delete]').forEach(node => {
        node.addEventListener('click', async (e) => {
          e.stopPropagation();
          await LP.memory.deleteEpisode(node.getAttribute('data-delete'));
          this.route();
        });
      });
    };

    renderList(episodes);
    el.querySelector('#history-search').addEventListener('input', async (e) => {
      const kw = e.target.value.trim();
      renderList(kw ? await LP.memory.findEpisodesByKeyword(kw) : episodes);
    });
  },

  /* ============== HABITS & GOALS (Screen 4) ============== */

  async renderHabitsGoalsView(root) {
    const detected = await LP.memory.getDetectedHabits();
    const el = document.createElement('div');
    el.className = 'view view--habits';
    el.innerHTML = `
      <header class="page-header"><h1>Habits &amp; Goals</h1></header>
      <div class="tabs">
        <button class="tab is-active" data-tab="habits">Habits</button>
        <button class="tab" data-tab="goals">Goals</button>
      </div>
      <div id="habits-panel" class="tab-panel"></div>
      <div id="goals-panel" class="tab-panel" hidden></div>
      <button class="fab" id="add-habit-goal-fab" aria-label="Add">${this.svgIcon('plus')}</button>
    `;
    root.appendChild(el);

    const habitsPanel = el.querySelector('#habits-panel');
    if (detected.filter(h => !h.stopped).length === 0) {
      habitsPanel.innerHTML = `<div class="empty-state"><p>No habits detected yet. LifePilot looks for patterns after a few days of use.</p></div>`;
    } else {
      habitsPanel.innerHTML = detected.filter(h => !h.stopped).map(h => `
        <div class="habit-detected-card" data-habit-id="${h.id}">
          <p class="habit-detected-card__desc">${this.escapeHtml(h.description)}</p>
          <p class="habit-detected-card__conf">Confidence: ${Math.round(h.confidence * 100)}% · seen ${h.count}×</p>
          <div class="habit-detected-card__controls">
            <label class="switch-row"><input type="checkbox" data-toggle-suggest="${h.id}" ${h.autoSuggest ? 'checked' : ''}/> Suggest automatically</label>
            <button class="btn btn--ghost btn--sm" data-stop-habit="${h.id}">Stop suggesting</button>
          </div>
        </div>`).join('');

      habitsPanel.querySelectorAll('[data-toggle-suggest]').forEach(cb => {
        cb.addEventListener('change', () => LP.memory.setHabitAutoSuggest(cb.getAttribute('data-toggle-suggest'), cb.checked));
      });
      habitsPanel.querySelectorAll('[data-stop-habit]').forEach(btn => {
        btn.addEventListener('click', async () => { await LP.memory.stopHabit(btn.getAttribute('data-stop-habit')); this.route(); });
      });
    }

    const goalsPanel = el.querySelector('#goals-panel');
    goalsPanel.innerHTML = `<div class="empty-state"><p>Say something like "My goal is to save ₹50000 this year" on Home to create one.</p></div>`;

    el.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const which = tab.getAttribute('data-tab');
        habitsPanel.hidden = which !== 'habits';
        goalsPanel.hidden = which !== 'goals';
      });
    });

    el.querySelector('#add-habit-goal-fab').addEventListener('click', () => {
      location.hash = '#/home';
      this.route();
      this.showToast('Try: "Track my running habit" or "My goal is to…"');
    });
  },

  /* ============== SETTINGS (Screen 5) ============== */

  async renderSettingsView(root) {
    const s = this.state.settings;
    const facts = await LP.memory.getAllFacts();
    const skills = await LP.memory.getAllSkills();
    const el = document.createElement('div');
    el.className = 'view view--settings';
    el.innerHTML = `
      <header class="page-header"><h1>${this.t('settingsTitle')}</h1></header>

      <div class="settings-group">
        <label class="settings-row"><span>Language</span>
          <select id="lang-select" class="settings-select">
            <option value="en" ${s.language === 'en' ? 'selected' : ''}>English</option>
            <option value="ta" ${s.language === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
          </select>
        </label>
        <p class="settings-hint">Only English and Tamil are actually translated and tested. Other languages will show "coming soon."</p>
      </div>

      <div class="settings-group">
        <label class="settings-row"><span>Theme</span>
          <select id="theme-select" class="settings-select">
            <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option>
            <option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="system" ${s.theme === 'system' ? 'selected' : ''}>System</option>
          </select>
        </label>
        <label class="settings-row"><span>Accent color</span><input type="color" id="accent-picker" value="${s.accentColor}"/></label>
      </div>

      <div class="settings-group">
        <label class="settings-row"><span>Voice input</span><input type="checkbox" id="voice-toggle" class="switch" ${s.voiceEnabled ? 'checked' : ''}/></label>
        <label class="settings-row"><span>Voice replies (speak plan summaries)</span><input type="checkbox" id="voice-output-toggle" class="switch" ${s.voiceOutputEnabled ? 'checked' : ''}/></label>
        <label class="settings-row"><span>Shake-to-trigger panic mode</span><input type="checkbox" id="shake-toggle" class="switch" ${s.shakeTriggerEnabled ? 'checked' : ''}/></label>
        <p class="settings-hint">Shake-to-trigger asks your browser for motion-sensor permission once you turn it on. It only opens the Life Channel — it never places a call by itself.</p>
        <label class="settings-row"><span>Auto-fire ordinary actions</span><input type="checkbox" id="autofire-toggle" class="switch" ${s.autoFireOrdinary ? 'checked' : ''}/></label>
        <label class="settings-row"><span>Clipboard suggestions</span><input type="checkbox" id="clipboard-toggle" class="switch" ${s.clipboardListenerEnabled ? 'checked' : ''}/></label>
        <p class="settings-hint">Health, money, messages, and emergencies always ask first regardless of these settings.</p>
      </div>

      <div class="settings-group">
        <h3 class="settings-group__title">My Memory</h3>
        ${facts.length === 0 ? '<p class="settings-hint">Nothing remembered yet.</p>' : facts.map(f => `
          <div class="fact-card"><span>${this.escapeHtml(f.label)}: <strong>${this.escapeHtml(String(f.value))}</strong></span><button data-delete-fact="${f.id}" aria-label="Delete">${this.svgIcon('trash')}</button></div>`).join('')}
        <button class="btn btn--ghost btn--sm" id="clear-memory-btn">Clear All Memory</button>
      </div>

      <div class="settings-group">
        <h3 class="settings-group__title">My Skills</h3>
        ${skills.length === 0 ? '<p class="settings-hint">No taught skills yet. Try: "Learn this: \'Morning routine\' means remind me to meditate at 6:15."</p>' : skills.map(sk => `
          <div class="fact-card"><span>${this.escapeHtml(sk.name)} <em>(${sk.actions.length} steps)</em></span><button data-delete-skill="${sk.id}" aria-label="Delete">${this.svgIcon('trash')}</button></div>`).join('')}
      </div>

      <div class="settings-group">
        <h3 class="settings-group__title">Privacy</h3>
        <p class="settings-hint">All data is stored locally on your device. Nothing is sent to any server.</p>
        <label class="settings-row"><span>Encrypt exports (AES-256-GCM)</span><input type="checkbox" id="passphrase-toggle" class="switch" ${s.passphraseSet ? 'checked' : ''}/></label>
        ${s.passphraseSet ? '<p class="settings-hint">Exports will be encrypted. Importing an encrypted file will ask for the passphrase.</p>' : ''}
        <button class="btn btn--ghost btn--sm" id="export-btn">Export Memory</button>
        <input type="file" id="import-file" accept="application/json" hidden />
        <button class="btn btn--ghost btn--sm" id="import-btn">Import Memory</button>
        <button class="btn btn--ghost btn--sm" id="clear-all-btn">Clear All Data</button>
      </div>

      <div class="settings-group">
        <button class="btn btn--ghost btn--sm" id="reset-budget-btn">Reset sandbox budget</button>
      </div>

      <div class="architecture-note">
        <h3>${this.svgIcon('device')} About</h3>
        <p><strong>LifePilot</strong> — One Intent. Every Action. A hackathon prototype built for the Productivity track. Everything you type, every plan, and your history live only on this device. The only network calls this app makes are the real ones you approve.</p>
      </div>
    `;
    root.appendChild(el);

    el.querySelector('#lang-select').addEventListener('change', (e) => { this.state.settings.language = e.target.value; LP.store.saveSettings(this.state.settings); this.route(); });
    el.querySelector('#theme-select').addEventListener('change', (e) => { this.state.settings.theme = e.target.value; LP.store.saveSettings(this.state.settings); this.applyTheme(); });
    el.querySelector('#accent-picker').addEventListener('change', (e) => { this.state.settings.accentColor = e.target.value; LP.store.saveSettings(this.state.settings); this.applyTheme(); });
    el.querySelector('#voice-toggle').addEventListener('change', (e) => { this.state.settings.voiceEnabled = e.target.checked; LP.store.saveSettings(this.state.settings); });
    el.querySelector('#voice-output-toggle').addEventListener('change', (e) => {
      this.state.settings.voiceOutputEnabled = e.target.checked;
      LP.store.saveSettings(this.state.settings);
      if (!e.target.checked) LP.perception.stopSpeaking();
    });
    el.querySelector('#shake-toggle').addEventListener('change', async (e) => {
      if (e.target.checked) {
        const granted = await LP.fastPanic.enableShake();
        this.state.settings.shakeTriggerEnabled = granted;
        e.target.checked = granted;
        if (!granted) this.showToast('Motion permission was not granted — shake trigger stays off.');
      } else {
        LP.fastPanic.disableShake();
        this.state.settings.shakeTriggerEnabled = false;
      }
      LP.store.saveSettings(this.state.settings);
    });
    el.querySelector('#autofire-toggle').addEventListener('change', (e) => { this.state.settings.autoFireOrdinary = e.target.checked; LP.store.saveSettings(this.state.settings); });
    el.querySelector('#clipboard-toggle').addEventListener('change', (e) => { this.state.settings.clipboardListenerEnabled = e.target.checked; LP.store.saveSettings(this.state.settings); });

    el.querySelectorAll('[data-delete-fact]').forEach(btn => btn.addEventListener('click', async () => { await LP.memory.deleteFact(btn.getAttribute('data-delete-fact')); this.route(); }));
    el.querySelectorAll('[data-delete-skill]').forEach(btn => btn.addEventListener('click', async () => { await LP.memory.deleteSkill(btn.getAttribute('data-delete-skill')); this.route(); }));

    el.querySelector('#clear-memory-btn').addEventListener('click', async () => {
      if (confirm('Clear all remembered facts?') && confirm('Are you absolutely sure? This cannot be undone.')) { await LP.memory.clearAllFacts(); this.route(); }
    });

    el.querySelector('#passphrase-toggle').addEventListener('change', async (e) => {
      if (e.target.checked) {
        const pass = prompt('Set a passphrase for encrypted exports. Store it somewhere safe — LifePilot does not save it and cannot recover it. You will be asked for it again each time you export or import.');
        if (!pass || pass.length < 6) {
          this.showToast('Passphrase must be at least 6 characters — encryption stays off.');
          e.target.checked = false;
          return;
        }
        const confirmPass = prompt('Confirm your passphrase.');
        if (confirmPass !== pass) {
          this.showToast('Passphrases did not match — encryption stays off.');
          e.target.checked = false;
          return;
        }
        // Only the boolean flag is persisted — the passphrase itself is never
        // stored, so every export/import prompts for it fresh.
        this.state.settings.passphraseSet = true;
        LP.store.saveSettings(this.state.settings);
        this.showToast('Exports will now be encrypted.');
        this.route();
      } else {
        if (confirm('Turn off encrypted exports? Future exports will be plain JSON.')) {
          this.state.settings.passphraseSet = false;
          LP.store.saveSettings(this.state.settings);
          this.route();
        } else {
          e.target.checked = true;
        }
      }
    });

    el.querySelector('#export-btn').addEventListener('click', async () => {
      const data = await LP.memory.exportAll();
      if (this.state.settings.passphraseSet) {
        const pass = prompt('Enter your passphrase to encrypt this export.');
        if (!pass) { this.showToast('Export cancelled — no passphrase entered.'); return; }
        const encrypted = await LP.store.encryptJSON(data, pass);
        LP.store.downloadJSON(encrypted, `lifepilot-export-${Date.now()}.encrypted.json`);
        this.showToast('Encrypted export downloaded.');
      } else {
        LP.store.downloadJSON(data, `lifepilot-export-${Date.now()}.json`);
      }
    });
    el.querySelector('#import-btn').addEventListener('click', () => el.querySelector('#import-file').click());
    el.querySelector('#import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        let data = JSON.parse(text);
        if (data && data.encrypted) {
          const pass = prompt('This export is encrypted. Enter the passphrase to decrypt it.');
          if (!pass) return;
          try {
            data = await LP.store.decryptJSON(data, pass);
          } catch (decErr) {
            this.showToast('Wrong passphrase or corrupted file — could not decrypt.');
            return;
          }
        }
        if (confirm(`This file contains ${(data.episodes || []).length} episodes, ${(data.facts || []).length} facts, ${(data.skills || []).length} skills. Merge into your current data?`)) {
          await LP.memory.importAll(data);
          this.showToast('Import complete');
          this.route();
        }
      } catch (err) { this.showToast('Could not read that file — ' + err.message); }
    });

    el.querySelector('#clear-all-btn').addEventListener('click', async () => {
      if (confirm('Clear ALL data — memory, history, skills, habits, budget?') && confirm('This is permanent. Are you sure?')) {
        await Promise.all(['facts', 'episodes', 'skills', 'habits'].map(s => LP.memory.clearStore(s)));
        LP.store.saveBudget({ total: 15000, currency: 'INR', reserved: 0, items: [] });
        this.showToast('All data cleared');
        this.route();
      }
    });

    el.querySelector('#reset-budget-btn').addEventListener('click', () => {
      if (confirm('Reset the sandbox budget tracker back to ₹15,000 with nothing reserved?')) { LP.store.saveBudget({ total: 15000, currency: 'INR', reserved: 0, items: [] }); this.route(); }
    });
  },

  /* ============== UTIL ============== */

  escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s == null ? '' : String(s);
    return div.innerHTML;
  },

  svgIcon(name) {
    const icons = {
      bolt: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      mic: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      pin: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7.4 7-12.5A7 7 0 105 9.5C5 14.6 12 22 12 22z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/></svg>',
      send: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 11l18-8-8 18-2-8-8-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      wallet: '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 13h3M2 10h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      bell: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 19a2 2 0 004 0" stroke="currentColor" stroke-width="1.6"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2C9.5 21 3 14.5 3 6a2 2 0 012-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12l6 6L20 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      lock: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" stroke-width="1.6"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      device: '<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M11 18h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      spark: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      plane: '<svg viewBox="0 0 24 24" fill="none"><path d="M2 16l20-7-7 20-3-8-8-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 00-2 2V5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 5a2 2 0 00-2-2h-6v18h6a2 2 0 012 2V5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      home: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 11l9-7 9 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      cloud: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 18a4 4 0 01-1-7.9A5 5 0 0116 8a4.5 4.5 0 011 8.9" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      camera: '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="14" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 7l1.5-3h5L16 7" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      file: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2v6h6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      'arrow-up': '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20V4M5 11l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 13a1.7 1.7 0 00.3-1.9l-1-1.8a1.7 1.7 0 00-1.7-1l-1.9.2a7 7 0 00-1.6-1l-.5-1.9a1.7 1.7 0 00-1.6-1.3h-2a1.7 1.7 0 00-1.6 1.3l-.5 1.9a7 7 0 00-1.6 1l-1.9-.2a1.7 1.7 0 00-1.7 1l-1 1.8a1.7 1.7 0 00.3 1.9l1.3 1.4a7 7 0 000 1.9l-1.3 1.4a1.7 1.7 0 00-.3 1.9l1 1.8a1.7 1.7 0 001.7 1l1.9-.2a7 7 0 001.6 1l.5 1.9a1.7 1.7 0 001.6 1.3h2a1.7 1.7 0 001.6-1.3l.5-1.9a7 7 0 001.6-1l1.9.2a1.7 1.7 0 001.7-1l1-1.8a1.7 1.7 0 00-.3-1.9L18 13.7c.1-.6.1-1.3 0-1.9z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    return icons[name] || '';
  }
});

document.addEventListener('DOMContentLoaded', () => App.init());
