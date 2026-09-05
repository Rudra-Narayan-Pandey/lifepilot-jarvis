/* ============================================================
   LifePilot — Layer 4: INTERFACE
   Screen rendering, card rendering, widgets, theming, onboarding.
   ============================================================ */

const App = {
  state: {
    settings: null,
    currentPlan: null,
    clarifyContext: null,
    recognizing: false,
    ambientContext: null
  },

  async init() {
    this.state.settings = LP.store.getSettings();
    this.applyTheme();
    window.addEventListener('hashchange', () => this.route());
    this.state.ambientContext = await LP.perception.buildAmbientContext();

    if (!LP.store.isOnboarded()) {
      this.renderOnboarding();
    } else {
      this.route();
    }
    this.wireClipboardBanner();
    this.registerSW();
    if (LP.fastPanic) {
      LP.fastPanic.init();
      // Re-attach shake listener on browsers that don't require a fresh
      // permission gesture each load (iOS Safari does, so it stays off
      // there until the user re-toggles it in Settings).
      if (this.state.settings.shakeTriggerEnabled && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission !== 'function') {
        LP.fastPanic.enableShake();
      }
    }
  },

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support best-effort */ });
    }
  },

  applyTheme() {
    const theme = this.state.settings.theme;
    let resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.setProperty('--accent', this.state.settings.accentColor || '#3B82F6');
  },

  t(key) { return LP.i18n.t(key, this.state.settings.language); },

  route() {
    const hash = location.hash || '#/home';
    const root = document.getElementById('app-root');
    root.innerHTML = '';
    document.querySelectorAll('.tabbar__item').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute('href') === hash.split('?')[0]);
    });
    document.querySelector('.tabbar').hidden = false;

    if (hash.startsWith('#/plan')) this.renderPlanView(root);
    else if (hash.startsWith('#/history')) this.renderHistoryView(root);
    else if (hash.startsWith('#/habits')) this.renderHabitsGoalsView(root);
    else if (hash.startsWith('#/settings')) this.renderSettingsView(root);
    else this.renderHomeView(root);
  },

  /* ============== ONBOARDING (4.7) ============== */

  renderOnboarding() {
    const root = document.getElementById('app-root');
    document.querySelector('.tabbar').hidden = true;
    let step = 0;
    const steps = [
      { title: 'Meet LifePilot', body: 'One Intent. Every Action.', icon: 'bolt' },
      { title: 'Speak or type anything', body: 'Text, voice, or a photo of a flyer, receipt, or whiteboard — LifePilot reads it all.', icon: 'mic' },
      { title: "It acts, not just plans", body: 'Say "Plan a trip to Goa" and watch four real actions fire — calendar, hotel, maps, budget.', icon: 'spark' },
      { title: 'Your data stays yours', body: 'All processing happens on your device. Nothing is uploaded anywhere unless you explicitly export it.', icon: 'device' }
    ];

    const renderStep = () => {
      const el = document.createElement('div');
      el.className = 'view view--onboarding';
      if (step < steps.length) {
        const s = steps[step];
        el.innerHTML = `
          <div class="onboard-card">
            <div class="onboard-card__icon">${this.svgIcon(s.icon)}</div>
            <h1>${s.title}</h1>
            <p>${s.body}</p>
            <div class="onboard-dots">${steps.map((_, i) => `<span class="onboard-dot ${i === step ? 'is-active' : ''}"></span>`).join('')}</div>
            <button class="btn btn--primary onboard-next">${step === steps.length - 1 ? "Let's go" : 'Next'}</button>
            ${step < steps.length - 1 ? '<button class="btn btn--ghost onboard-skip">Skip</button>' : ''}
          </div>`;
      } else {
        el.innerHTML = `
          <div class="onboard-card">
            <h1>Want to personalize?</h1>
            <p>Totally optional — skip if you'd rather just dive in.</p>
            <form id="quick-setup-form" class="onboard-form">
              <input type="text" name="userName" placeholder="Your name" />
              <input type="text" name="homeCity" placeholder="Home city" />
              <input type="text" name="emergencyContactName" placeholder="Emergency contact name" />
              <input type="tel" name="emergencyContactNumber" placeholder="Emergency contact number" />
              <button type="submit" class="btn btn--primary">Save & continue</button>
              <button type="button" class="btn btn--ghost onboard-skip-setup">Skip</button>
            </form>
          </div>`;
      }
      root.innerHTML = '';
      root.appendChild(el);

      const next = el.querySelector('.onboard-next');
      if (next) next.addEventListener('click', () => { step++; renderStep(); });
      const skip = el.querySelector('.onboard-skip');
      if (skip) skip.addEventListener('click', () => { step = steps.length; renderStep(); });
      const form = el.querySelector('#quick-setup-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          for (const [k, v] of fd.entries()) if (v) this.state.settings[k] = v;
          LP.store.saveSettings(this.state.settings);
          this.finishOnboarding();
        });
        el.querySelector('.onboard-skip-setup').addEventListener('click', () => this.finishOnboarding());
      }
    };
    renderStep();
  },

  finishOnboarding() {
    LP.store.setOnboarded();
    document.querySelector('.tabbar').hidden = false;
    location.hash = '#/home';
    this.route();
  },

  /* ============== CLIPBOARD BANNER (0.6) ============== */

  wireClipboardBanner() {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState !== 'visible') return;
      if (!this.state.settings.clipboardListenerEnabled) return;
      const text = await LP.perception.checkClipboardForBanner();
      if (text) this.showClipboardBanner(text);
    });
  },

  showClipboardBanner(text) {
    const existing = document.getElementById('clipboard-banner');
    if (existing) existing.remove();
    const banner = document.createElement('div');
    banner.id = 'clipboard-banner';
    banner.className = 'clipboard-banner';
    banner.innerHTML = `
      <span class="clipboard-banner__text">Copied: "${this.escapeHtml(text.slice(0, 50))}${text.length > 50 ? '…' : ''}" — Want me to handle this?</span>
      <div class="clipboard-banner__actions">
        <button class="btn btn--sm btn--primary" id="clipboard-yes">Yes</button>
        <button class="btn btn--sm btn--ghost" id="clipboard-dismiss">Dismiss</button>
      </div>`;
    document.body.appendChild(banner);
    banner.querySelector('#clipboard-yes').addEventListener('click', () => {
      banner.remove();
      location.hash = '#/home';
      this.route();
      setTimeout(() => this.handleIntent(text, document.querySelector('.view--home')), 200);
    });
    banner.querySelector('#clipboard-dismiss').addEventListener('click', () => banner.remove());
  },

  /* ============== HOME (Screen 1) ============== */

  renderHomeView(root) {
    const greeting = this.getGreeting();
    const el = document.createElement('div');
    el.className = 'view view--home';
    const placeholders = LP.i18n.strings[this.state.settings.language].placeholderRotation;

    el.innerHTML = `
      <header class="hero">
        <div class="voice-orb" id="voice-orb" data-state="idle" aria-hidden="true">
          <span class="voice-orb__core"></span>
          <span class="voice-orb__ring"></span>
        </div>
        <p class="hero__greeting">${greeting}${this.state.settings.userName ? ', ' + this.escapeHtml(this.state.settings.userName) : ''}.</p>
        <div class="ambient-strip" id="ambient-strip">
          <span>${this.svgIcon('clock')} ${this.state.ambientContext ? this.state.ambientContext.timeOfDay : ''}</span>
          <span>${this.svgIcon('device')} ${this.state.ambientContext && this.state.ambientContext.batteryLevel != null ? Math.round(this.state.ambientContext.batteryLevel * 100) + '%' : ''}</span>
          <span id="ambient-weather">${this.svgIcon('cloud')} …</span>
        </div>
      </header>

      <div class="canvas" id="canvas">
        <div class="canvas__suggestions" id="canvas-suggestions">
          ${placeholders.slice(0, 4).map(p => `<button class="suggestion-chip">${this.escapeHtml(p)}</button>`).join('')}
        </div>
      </div>

      <section class="composer">
        <div class="composer__preview" id="input-preview" hidden></div>
        <div class="composer__field">
          <textarea id="intent-input" class="composer__input" placeholder="${this.escapeHtml(placeholders[0])}" rows="1"></textarea>
          <div class="composer__buttons">
            <button type="button" id="camera-btn" class="composer__icon-btn" aria-label="Camera input">${this.svgIcon('camera')}</button>
            <button type="button" id="file-btn" class="composer__icon-btn" aria-label="File upload">${this.svgIcon('file')}</button>
            <button type="button" id="mic-btn" class="composer__icon-btn composer__mic" aria-label="Voice input">${this.svgIcon('mic')}</button>
            <button type="button" id="submit-btn" class="composer__icon-btn composer__submit" aria-label="Submit">${this.svgIcon('arrow-up')}</button>
          </div>
        </div>
        <input type="file" id="camera-input" accept="image/*" capture="environment" hidden />
        <input type="file" id="pdf-input" accept="application/pdf,image/*" hidden />
        <span class="composer__voice-status" id="voice-status"></span>
      </section>

      <section id="clarify-zone"></section>
      <div id="status-stages" class="stages" hidden></div>
    `;
    root.appendChild(el);

    this.loadWeatherStrip();

    const input = el.querySelector('#intent-input');
    const submitBtn = el.querySelector('#submit-btn');
    const doSubmit = () => {
      const text = input.value.trim();
      if (!text) return;
      this.handleIntent(text, el);
    };
    submitBtn.addEventListener('click', doSubmit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSubmit(); } });

    el.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => { input.value = chip.textContent; input.focus(); });
    });

    this.wireVoiceInput(el, input);
    this.wireCameraInput(el, input);
    this.wireFileInput(el, input);
    this.wirePasteListener(el, input);
  },

  getGreeting() {
    const tod = LP.perception.getTimeOfDay();
    const key = tod === 'morning' ? 'greetingMorning' : tod === 'afternoon' ? 'greetingAfternoon' : tod === 'evening' ? 'greetingEvening' : 'greetingNight';
    return this.t(key);
  },

  async loadWeatherStrip() {
    const el = document.getElementById('ambient-weather');
    if (!el) return;
    if (!navigator.onLine) { el.innerHTML = `${this.svgIcon('cloud')} offline`; return; }
    try {
      // Default coordinates: Vellore, TN (user context) — a real build would use
      // getGeoLocation() once permission has been granted via a NAVIGATE action.
      const lat = 12.9165, lng = 79.1325;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&timezone=auto`);
      const data = await res.json();
      const temp = data.current && data.current.temperature_2m;
      el.innerHTML = `${this.svgIcon('cloud')} ${temp != null ? Math.round(temp) + '°C' : '—'}`;
    } catch (e) {
      el.innerHTML = `${this.svgIcon('cloud')} —`;
    }
  },

  /* ============== VOICE ORB (JARVIS-style state indicator) ============== */

  setOrbState(state) {
    const orb = document.getElementById('voice-orb');
    if (orb) orb.setAttribute('data-state', state); // idle | listening | thinking | speaking
  },

  /* ============== VOICE / CAMERA / FILE INPUT WIRING ============== */

  wireVoiceInput(el, input) {
    const micBtn = el.querySelector('#mic-btn');
    const statusEl = el.querySelector('#voice-status');
    if (!LP.perception.isVoiceSupported() || !this.state.settings.voiceEnabled) {
      micBtn.classList.add('is-disabled');
      micBtn.title = this.t('micUnsupported');
      micBtn.addEventListener('click', () => {
        statusEl.textContent = this.t('micUnsupported');
        statusEl.classList.add('is-warning');
      });
      return;
    }

    let recognition = null;
    let userStopped = false;
    micBtn.addEventListener('click', () => {
      if (this.state.recognizing) { userStopped = true; recognition && recognition.stop(); return; }
      userStopped = false;
      startRecognition();
    });

    const startRecognition = () => {
      recognition = LP.perception.createRecognizer(LP.i18n.speechLangCode(this.state.settings.language));
      if (!recognition) { statusEl.textContent = this.t('micUnsupported'); return; }

      recognition.onstart = () => {
        this.state.recognizing = true;
        micBtn.classList.add('is-listening');
        this.setOrbState('listening');
        statusEl.classList.remove('is-warning');
        statusEl.textContent = this.t('speakNow');
      };
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) finalTranscript += event.results[i][0].transcript;
        input.value = finalTranscript;
      };
      recognition.onerror = (event) => {
        // "no-speech" / "network" are transient — auto-reconnect handles them
        // via onend below. Anything else surfaces to the person.
        if (event.error !== 'no-speech' && event.error !== 'network') {
          statusEl.textContent = 'Voice input error (' + event.error + ') — you can type instead.';
          statusEl.classList.add('is-warning');
          userStopped = true; // don't fight a real error by reconnecting forever
        }
      };
      recognition.onend = () => {
        // Some browsers end a "continuous" session after a silence gap even
        // though the person never tapped stop — auto-reconnect keeps the
        // conversation going, per the spec's "auto-reconnect during active
        // sessions." Only stops for real when the person taps the mic again
        // or a non-transient error occurred.
        if (!userStopped) { startRecognition(); return; }
        this.state.recognizing = false;
        micBtn.classList.remove('is-listening');
        this.setOrbState('idle');
        if (statusEl.textContent === this.t('speakNow')) statusEl.textContent = '';
      };
      recognition.start();
    };
  },

  wireCameraInput(el, input) {
    const cameraBtn = el.querySelector('#camera-btn');
    const cameraInput = el.querySelector('#camera-input');
    cameraBtn.addEventListener('click', () => cameraInput.click());
    cameraInput.addEventListener('change', async () => {
      const file = cameraInput.files[0];
      if (!file) return;
      await this.handleImageCapture(el, file);
    });
  },

  wireFileInput(el, input) {
    const fileBtn = el.querySelector('#file-btn');
    const fileInput = el.querySelector('#pdf-input');
    fileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (file.type === 'application/pdf') await this.handlePdfUpload(el, file);
      else await this.handleImageCapture(el, file);
    });
  },

  wirePasteListener(el, input) {
    input.addEventListener('paste', async (e) => {
      const imageFile = LP.perception.extractImageFromClipboardEvent(e);
      if (imageFile) {
        e.preventDefault();
        await this.handleImageCapture(el, imageFile);
      }
    });
  },

  async handleImageCapture(el, file) {
    const preview = el.querySelector('#input-preview');
    const url = URL.createObjectURL(file);
    preview.hidden = false;
    preview.innerHTML = `<img src="${url}" alt="Captured" class="preview-img" /><p class="preview-status">Reading image…</p>`;
    const result = await LP.perception.runOCRWithFallback(file);
    if (result.ok) {
      preview.querySelector('.preview-status').textContent = 'Extracted text below — edit if needed.';
      const input = el.querySelector('#intent-input');
      input.value = result.text.length > 300 ? result.text.slice(0, 300) : (result.text || 'Handle this');
    } else {
      preview.querySelector('.preview-status').textContent = result.message;
    }
  },

  async handlePdfUpload(el, file) {
    const preview = el.querySelector('#input-preview');
    preview.hidden = false;
    preview.innerHTML = `<p class="preview-status">Reading your document…</p>`;
    try {
      const text = await LP.perception.extractTextFromPDF(file);
      preview.querySelector('.preview-status').textContent = 'Extracted text below — edit if needed.';
      const input = el.querySelector('#intent-input');
      input.value = text.length > 500 ? text.slice(0, 500) : (text || 'Handle this document');
    } catch (e) {
      preview.querySelector('.preview-status').textContent = 'Could not read that PDF — ' + e.message;
    }
  },

  wait(ms) { return new Promise(r => setTimeout(r, ms)); },

  /* ============== THINKING ANIMATION (4.4) + INTENT HANDLING ============== */

  async handleIntent(text, homeEl) {
    // Check for a matching taught skill first (Layer 2.4)
    const skill = await LP.memory.findMatchingSkill(text);
    if (skill) {
      const cards = LP.memory.executeSkill(skill);
      this.state.currentPlan = { tier: 1, primaryIntent: 'SKILL', cards, tree: LP.wrapTree(cards), text, tone: LP.analyzeTone(text) };
      await LP.memory.saveEpisode({ rawInput: text, cards, tier: 1, primaryIntent: 'SKILL' });
      location.hash = '#/plan';
      return;
    }

    // Skill teaching
    const skillDef = LP.memory.parseSkillDefinition(text);
    if (skillDef) {
      await LP.memory.saveSkill(skillDef);
      this.showToast(`Learned "${skillDef.name}" — try saying "start my ${skillDef.name.toLowerCase()}"`);
      return;
    }

    const stagesEl = homeEl.querySelector('#status-stages');
    stagesEl.hidden = false;
    this.setOrbState('thinking');
    stagesEl.innerHTML = `
      <div class="stage" data-stage="1"><span class="stage__dot"></span>${this.t('thinking1')}</div>
      <div class="stage" data-stage="2"><span class="stage__dot"></span>${this.t('thinking2')}</div>
      <div class="stage" data-stage="3"><span class="stage__dot"></span>${this.t('thinking3')}</div>
    `;
    const stages = stagesEl.querySelectorAll('.stage');
    const activate = (i) => stages[i].classList.add('is-active');
    const complete = (i) => { stages[i].classList.remove('is-active'); stages[i].classList.add('is-done'); };

    activate(0); await this.wait(400);
    complete(0); activate(1); await this.wait(400);
    complete(1); activate(2); await this.wait(350);
    complete(2);

    const combinedText = this.state.clarifyContext ? `${this.state.clarifyContext.originalText} ${text}` : text;
    const result = LP.compose(combinedText, { language: this.state.settings.language });

    if (result.tier === 2) {
      this.state.clarifyContext = { originalText: text };
      this.renderClarify(homeEl, text);
      stagesEl.hidden = true;
      this.setOrbState('idle');
      return;
    }

    this.state.clarifyContext = null;
    this.state.currentPlan = result;

    this.speakPlanSummary(result);

    await LP.memory.saveEpisode({ rawInput: combinedText, cards: result.cards, tier: result.tier, primaryIntent: result.primaryIntent });
    await LP.memory.extractFromText(combinedText).then(async (facts) => {
      for (const f of facts) {
        if (f.gated) {
          // Gated facts require explicit consent — show a soft prompt rather than
          // silently storing something like a phone number.
          this.showFactConsentPrompt(f);
        } else {
          await LP.memory.storeFact(f);
        }
      }
    });

    // Habit detection re-runs after each new episode (spec 2.3)
    LP.memory.detectHabits();

    location.hash = '#/plan';
  },

  speakPlanSummary(result) {
    if (!this.state.settings.voiceOutputEnabled || !LP.perception.isSpeechSynthesisSupported()) return;
    const n = (result.cards || []).length;
    let summary;
    if (result.primaryIntent === 'ESCALATE') {
      summary = `I've found emergency guidance and a call button for you. Tap it whenever you're ready.`;
    } else if (n === 0) {
      summary = "Here's what I found.";
    } else if (n === 1) {
      summary = `Done — I've prepared ${this.describeCardForSpeech(result.cards[0])}.`;
    } else {
      summary = `Done — I've prepared ${n} things for you, starting with ${this.describeCardForSpeech(result.cards[0])}.`;
    }
    this.setOrbState('speaking');
    LP.perception.speak(summary, {
      lang: LP.i18n.speechLangCode(this.state.settings.language),
      onEnd: () => this.setOrbState('idle')
    });
  },

  describeCardForSpeech(card) {
    const map = {
      SCHEDULE: 'a calendar event', REMIND: 'a reminder', NAVIGATE: 'directions',
      NOTIFY: 'a message draft', BUDGET_TRACK: 'a budget entry', PAY: 'a payment link',
      INFO_SUMMARY: 'an answer', HEALTH_INFO: 'some health information', CAB: 'a cab booking',
      MUSIC: 'a music search', TIMER: 'a timer', CAPTURE_NOTE: 'a note'
    };
    return map[card.type] || 'an action';
  },

  showFactConsentPrompt(fact) {
    const banner = document.createElement('div');
    banner.className = 'clipboard-banner';
    banner.innerHTML = `
      <span class="clipboard-banner__text">Can I remember "${this.escapeHtml(fact.label)}: ${this.escapeHtml(fact.value)}" for next time?</span>
      <div class="clipboard-banner__actions">
        <button class="btn btn--sm btn--primary" id="fact-yes">Yes</button>
        <button class="btn btn--sm btn--ghost" id="fact-no">No</button>
      </div>`;
    document.body.appendChild(banner);
    banner.querySelector('#fact-yes').addEventListener('click', async () => { await LP.memory.storeFact(fact); banner.remove(); });
    banner.querySelector('#fact-no').addEventListener('click', () => banner.remove());
  },

  showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('is-visible'), 10);
    setTimeout(() => { t.classList.remove('is-visible'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  renderClarify(homeEl, originalText) {
    const zone = homeEl.querySelector('#clarify-zone');
    zone.innerHTML = `
      <div class="clarify-card">
        <p class="clarify-card__prompt">${this.t('clarifyPrompt')}</p>
        <p class="clarify-card__question">Got it — when should I schedule this?</p>
        <div class="clarify-quickreplies">
          <button class="chip" data-quick="today">Today</button>
          <button class="chip" data-quick="tomorrow">Tomorrow</button>
          <button class="chip" data-quick="this weekend">This weekend</button>
          <button class="chip" data-quick="__type">Let me type it</button>
        </div>
        <form id="clarify-form" class="clarify-card__form" hidden>
          <input type="text" id="clarify-input" class="clarify-card__input" placeholder="e.g. tomorrow at 5pm" />
          <button type="submit" class="btn btn--primary btn--sm">Continue</button>
        </form>
      </div>
    `;
    const form = zone.querySelector('#clarify-form');
    zone.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-quick');
        if (val === '__type') { form.hidden = false; zone.querySelector('#clarify-input').focus(); return; }
        zone.innerHTML = '';
        this.handleIntent(val, homeEl);
      });
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = zone.querySelector('#clarify-input').value.trim();
      if (!val) return;
      zone.innerHTML = '';
      this.handleIntent(val, homeEl);
    });
    zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
