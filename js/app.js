/* ============================================================
   LifePilot App Controller — router + view rendering + wiring
   ============================================================ */

const App = {
  state: {
    settings: null,
    currentPlan: null,
    clarifyContext: null, // { originalText } when in Tier 2
    recognizing: false
  },

  init() {
    this.state.settings = LP.store.getSettings();
    window.addEventListener('hashchange', () => this.route());
    this.route();
    this.registerSW();
  },

  route() {
    const hash = location.hash || '#/home';
    const root = document.getElementById('app-root');
    root.innerHTML = '';
    document.querySelectorAll('.tabbar__item').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute('href') === hash.split('?')[0]);
    });

    if (hash.startsWith('#/plan')) this.renderPlanView(root);
    else if (hash.startsWith('#/history')) this.renderHistoryView(root);
    else if (hash.startsWith('#/settings')) this.renderSettingsView(root);
    else this.renderHomeView(root);
  },

  registerSW() {
    // no-op placeholder; keeping SW out to avoid caching complications in a
    // hackathon zero-config drop, manifest alone is enough for installability
  },

  t(key) { return LP.i18n.t(key, this.state.settings.language); },

  /* ============== HOME VIEW ============== */

  renderHomeView(root) {
    const examples = [
      { icon: 'plane', text: 'Book a trip to Goa next weekend, budget ₹15000' },
      { icon: 'calendar', text: 'I have chemistry class at 9am, gym at 6pm, and grocery run tomorrow' },
      { icon: 'book', text: 'Explain photosynthesis for my biology exam' },
      { icon: 'home', text: 'Remind me to pay the electricity bill on the 5th' },
      { icon: 'heart', text: 'I have a mild headache and slight fever since morning' },
      { icon: 'cloud', text: 'I\'m feeling really stressed about everything lately' }
    ];

    const el = document.createElement('div');
    el.className = 'view view--home';
    el.innerHTML = `
      <header class="hero">
        <div class="hero__badge">${this.svgIcon('bolt')}</div>
        <h1 class="hero__title">LifePilot</h1>
        <p class="hero__tagline">One Intent. Every Action.</p>
      </header>

      <form class="composer" id="composer-form" autocomplete="off">
        <div class="composer__field">
          <textarea id="intent-input" class="composer__input" placeholder="${this.t('placeholder')}" rows="2"></textarea>
          <button type="button" id="mic-btn" class="composer__mic" aria-label="Voice input">${this.svgIcon('mic')}</button>
        </div>
        <div class="composer__row">
          <span class="composer__voice-status" id="voice-status"></span>
          <button type="submit" class="btn btn--primary">Build my plan</button>
        </div>
      </form>

      <section class="examples" id="clarify-zone"></section>

      <section class="examples">
        <h2 class="examples__title">${this.t('examplesTitle')}</h2>
        <div class="examples__grid">
          ${examples.map((e, i) => `
            <button class="example-chip" data-example="${i}">
              <span class="example-chip__icon">${this.svgIcon(e.icon)}</span>
              <span class="example-chip__text">${e.text}</span>
            </button>
          `).join('')}
        </div>
      </section>

      <div id="status-stages" class="stages" hidden></div>
    `;
    root.appendChild(el);

    const input = el.querySelector('#intent-input');
    const form = el.querySelector('#composer-form');
    const examplesGrid = el.querySelectorAll('.example-chip');

    examplesGrid.forEach((chip, i) => {
      chip.addEventListener('click', () => {
        input.value = examples[i].text;
        input.focus();
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.handleIntent(text, el);
    });

    this.wireVoiceInput(el, input);
  },

  wireVoiceInput(el, input) {
    const micBtn = el.querySelector('#mic-btn');
    const statusEl = el.querySelector('#voice-status');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      micBtn.classList.add('is-disabled');
      micBtn.addEventListener('click', () => {
        statusEl.textContent = this.t('micUnsupported');
        statusEl.classList.add('is-warning');
      });
      return;
    }

    let recognition = null;
    micBtn.addEventListener('click', () => {
      if (this.state.recognizing) {
        recognition && recognition.stop();
        return;
      }
      try {
        recognition = new SR();
        recognition.lang = LP.i18n.speechLangCode(this.state.settings.language);
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          this.state.recognizing = true;
          micBtn.classList.add('is-listening');
          statusEl.classList.remove('is-warning');
          statusEl.textContent = this.t('speakNow');
        };
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          input.value = transcript;
        };
        recognition.onerror = (event) => {
          statusEl.textContent = 'Voice input error (' + event.error + ') — you can type instead.';
          statusEl.classList.add('is-warning');
        };
        recognition.onend = () => {
          this.state.recognizing = false;
          micBtn.classList.remove('is-listening');
          if (statusEl.textContent === this.t('speakNow')) statusEl.textContent = '';
        };
        recognition.start();
      } catch (err) {
        statusEl.textContent = this.t('micUnsupported');
        statusEl.classList.add('is-warning');
      }
    });
  },

  async handleIntent(text, homeEl) {
    const stagesEl = homeEl.querySelector('#status-stages');
    stagesEl.hidden = false;
    stagesEl.innerHTML = `
      <div class="stage" data-stage="1"><span class="stage__dot"></span>${this.t('stage1')}</div>
      <div class="stage" data-stage="2"><span class="stage__dot"></span>${this.t('stage2')}</div>
      <div class="stage" data-stage="3"><span class="stage__dot"></span>${this.t('stage3')}</div>
    `;
    const stages = stagesEl.querySelectorAll('.stage');
    const activate = (i) => stages[i].classList.add('is-active');
    const complete = (i) => { stages[i].classList.remove('is-active'); stages[i].classList.add('is-done'); };

    activate(0);
    await this.wait(450);
    complete(0); activate(1);
    await this.wait(450);
    complete(1); activate(2);
    await this.wait(400);
    complete(2);

    const combinedText = this.state.clarifyContext
      ? `${this.state.clarifyContext.originalText} ${text}`
      : text;

    const result = LP.compose(combinedText);

    if (result.tier === 2) {
      this.state.clarifyContext = { originalText: text };
      this.renderClarify(homeEl, text);
      stagesEl.hidden = true;
      return;
    }

    this.state.clarifyContext = null;
    this.state.currentPlan = result;

    LP.store.addHistoryEntry({
      id: LP.util.uid(),
      input: combinedText,
      tier: result.tier,
      primaryIntent: result.primaryIntent,
      cardTypes: result.cards.map(c => c.type),
      cards: result.cards,
      at: Date.now()
    });

    location.hash = '#/plan';
  },

  renderClarify(homeEl, originalText) {
    const zone = homeEl.querySelector('#clarify-zone');
    zone.innerHTML = `
      <div class="clarify-card">
        <p class="clarify-card__prompt">${this.t('clarifyPrompt')}</p>
        <p class="clarify-card__question">Could you tell me a bit more — is this something to schedule, a question to answer, or a message to send to someone?</p>
        <form id="clarify-form" class="clarify-card__form">
          <input type="text" id="clarify-input" class="clarify-card__input" placeholder="e.g. \"schedule it for tomorrow at 5pm\" or \"just answer my question\"" />
          <button type="submit" class="btn btn--primary btn--sm">Continue</button>
        </form>
      </div>
    `;
    const form = zone.querySelector('#clarify-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = zone.querySelector('#clarify-input').value.trim();
      if (!val) return;
      zone.innerHTML = '';
      this.handleIntent(val, homeEl);
    });
    zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  wait(ms) { return new Promise(r => setTimeout(r, ms)); },

  /* ============== PLAN / DASHBOARD VIEW ============== */

  renderPlanView(root) {
    const plan = this.state.currentPlan;
    const el = document.createElement('div');
    el.className = 'view view--plan';

    if (!plan) {
      el.innerHTML = `
        <header class="page-header"><h1>Your plan</h1></header>
        <div class="empty-state">
          <p>No active plan yet.</p>
          <a href="#/home" class="btn btn--primary">Start on Home</a>
        </div>
      `;
      root.appendChild(el);
      return;
    }

    el.innerHTML = `
      <header class="page-header">
        <h1>Your plan</h1>
        <p class="page-header__sub">“${this.escapeHtml(plan.text)}”</p>
      </header>
      <div class="card-stack" id="card-stack"></div>
    `;
    root.appendChild(el);

    const stack = el.querySelector('#card-stack');
    plan.cards.forEach((card, i) => {
      const cardEl = this.renderCard(card);
      cardEl.style.animationDelay = `${i * 90}ms`;
      stack.appendChild(cardEl);
    });

    // Auto-fire ordinary actions the moment the plan renders (zero taps)
    requestAnimationFrame(() => {
      plan.cards.forEach(card => {
        if (card.permission === 'auto' && card.type !== 'INFO_SUMMARY') {
          this.autoFireCard(card);
        }
      });
    });
  },

  autoFireCard(card) {
    // Open the real link automatically for SCHEDULE / REMIND / NAVIGATE.
    // We open in a new tab; on a phone this hands off to the Calendar/Maps app.
    const url = card.gcalUrl || card.mapsUrl;
    if (!url) return;
    const win = window.open(url, '_blank');
    const badge = document.querySelector(`[data-card-id="${card.id}"] .action-card__firedbadge`);
    if (badge) badge.hidden = !win ? true : false;
    if (!win) {
      const note = document.querySelector(`[data-card-id="${card.id}"] .action-card__popupnote`);
      if (note) note.hidden = false;
    }
  },

  renderCard(card) {
    const wrap = document.createElement('article');
    wrap.className = `action-card action-card--${card.type.toLowerCase()} action-card--${card.permission}`;
    wrap.setAttribute('data-card-id', card.id);

    const permBadge = card.permission === 'auto'
      ? `<span class="badge badge--auto">${this.svgIcon('check')} ${this.t('doneAutomatically')}</span>`
      : `<span class="badge badge--permission">${this.svgIcon('lock')} ${this.t('needsPermission')}</span>`;

    let bodyHtml = '';
    let footerHtml = '';

    switch (card.type) {
      case 'SCHEDULE':
      case 'REMIND':
        bodyHtml = `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          ${card.tripMeta ? this.renderTripMetaHtml(card.tripMeta) : ''}
        `;
        footerHtml = `
          <a href="${card.gcalUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm action-card__link">${this.svgIcon('calendar')} Open in Calendar</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>
          <span class="action-card__popupnote" hidden>Your browser blocked the automatic pop-up — tap "Open in Calendar" to finish.</span>
        `;
        break;

      case 'NAVIGATE':
        bodyHtml = `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
        `;
        footerHtml = `
          <a href="${card.mapsUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm action-card__link">${this.svgIcon('pin')} Open in Maps</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>
          <span class="action-card__popupnote" hidden>Your browser blocked the automatic pop-up — tap "Open in Maps" to finish.</span>
        `;
        break;

      case 'NOTIFY':
        bodyHtml = `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <div class="message-preview">${this.escapeHtml(card.message)}</div>
        `;
        footerHtml = `
          <button class="btn btn--primary btn--sm" data-confirm-notify="${card.id}">${this.svgIcon('send')} ${this.t('confirmSend')}</button>
          <span class="action-card__sentbadge" hidden>${this.svgIcon('check')} Sent</span>
        `;
        break;

      case 'BUDGET_TRACK':
        bodyHtml = this.renderBudgetBodyHtml(card);
        footerHtml = `
          <button class="btn btn--primary btn--sm" data-confirm-budget="${card.id}" data-amount="${card.amount}" data-label="${this.escapeHtml(card.label || '')}">${this.svgIcon('wallet')} ${this.t('confirmReserve')}</button>
          <span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Reserved</span>
        `;
        break;

      case 'INFO_SUMMARY':
        bodyHtml = `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__answer">${this.escapeHtml(card.body)}</p>
        `;
        if (card.softSuggestion) {
          footerHtml = `<button class="btn btn--ghost btn--sm" data-soft-remind="${card.id}">${this.svgIcon('bell')} ${this.escapeHtml(card.softSuggestion.label)}</button>
          <span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Reminder added</span>`;
        }
        break;

      case 'HEALTH_INFO':
        bodyHtml = `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <p class="action-card__answer">${this.escapeHtml(card.body)}</p>
        `;
        footerHtml = `
          <button class="btn btn--primary btn--sm" data-confirm-health="${card.id}">${this.svgIcon('check')} ${card.suggestedFollowUp ? this.escapeHtml(card.suggestedFollowUp.label) : 'Acknowledge'}</button>
          <span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Added</span>
        `;
        break;

      case 'ESCALATE':
        bodyHtml = `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <p class="action-card__answer">${this.escapeHtml(card.body)}</p>
          <p class="action-card__honesty">${this.escapeHtml(card.honestyNote)}</p>
        `;
        footerHtml = `
          <a href="tel:${card.telNumber}" class="btn btn--emergency btn--sm">${this.svgIcon('phone')} ${this.escapeHtml(card.telLabel)}</a>
          <a href="${LP.util.waUrl(card.shareLocationText)}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">${this.svgIcon('pin')} Share situation with a contact</a>
          <div class="reference-links">
            ${card.referenceLinks.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${this.escapeHtml(l.label)}</a>`).join('')}
          </div>
        `;
        break;
    }

    wrap.innerHTML = `
      <div class="action-card__head">
        ${permBadge}
        <span class="action-card__type">${card.type.replace('_', ' ')}</span>
      </div>
      <div class="action-card__body">${bodyHtml}</div>
      <div class="action-card__footer">${footerHtml}</div>
    `;

    this.wireCardInteractions(wrap, card);
    return wrap;
  },

  renderTripMetaHtml(meta) {
    if (meta.kind === 'transport') {
      const c = meta.chosen;
      return `<p class="action-card__tripnote">${this.svgIcon('spark')} Chosen automatically: ${c.mode} · ${c.name} · ₹${c.price} · ${c.durationHrs}h · comfort ${c.comfort}/5, best fit among ${meta.allOptions.length} options within budget.</p>`;
    }
    if (meta.kind === 'hotel') {
      const c = meta.chosen;
      return `<p class="action-card__tripnote">${this.svgIcon('spark')} Chosen automatically: ${c.name} · ₹${c.pricePerNight}/night · rating ${c.rating}/5, best fit among ${meta.allOptions.length} options within budget.</p>`;
    }
    return '';
  },

  renderBudgetBodyHtml(card) {
    const budget = LP.store.getBudget();
    const projected = budget.reserved + card.amount;
    const pct = Math.min(100, Math.round((budget.reserved / budget.total) * 100));
    const projectedPct = Math.min(100, Math.round((projected / budget.total) * 100));
    const over = projected > budget.total;
    return `
      <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
      <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
      <div class="budget-bar">
        <div class="budget-bar__track">
          <div class="budget-bar__fill" style="width:${pct}%"></div>
          <div class="budget-bar__proposed ${over ? 'is-over' : ''}" style="width:${projectedPct}%"></div>
        </div>
        <div class="budget-bar__labels">
          <span>₹${budget.reserved} reserved of ₹${budget.total}</span>
          <span class="${over ? 'is-over-text' : ''}">${over ? this.t('budgetOver') : this.t('budgetOk')}: after this, ₹${projected}</span>
        </div>
      </div>
    `;
  },

  wireCardInteractions(wrap, card) {
    const notifyBtn = wrap.querySelector('[data-confirm-notify]');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        window.open(card.waUrl, '_blank');
        notifyBtn.hidden = true;
        wrap.querySelector('.action-card__sentbadge').hidden = false;
      });
    }

    const budgetBtn = wrap.querySelector('[data-confirm-budget]');
    if (budgetBtn) {
      budgetBtn.addEventListener('click', () => {
        LP.store.reserveBudget(card.amount, card.label);
        budgetBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
        const bodyEl = wrap.querySelector('.action-card__body');
        bodyEl.innerHTML = this.renderBudgetBodyHtml(card);
      });
    }

    const healthBtn = wrap.querySelector('[data-confirm-health]');
    if (healthBtn) {
      healthBtn.addEventListener('click', () => {
        if (card.suggestedFollowUp) {
          const start = card.suggestedFollowUp.time;
          const url = LP.util.gcalUrl({ title: `Check-in: ${card.title}`, start, end: new Date(start.getTime() + 15 * 60000), details: 'Added after your confirmation via LifePilot.' });
          window.open(url, '_blank');
        }
        healthBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
      });
    }

    const softBtn = wrap.querySelector('[data-soft-remind]');
    if (softBtn) {
      softBtn.addEventListener('click', () => {
        const start = card.softSuggestion.time;
        const url = LP.util.gcalUrl({ title: 'Check-in with yourself', start, end: new Date(start.getTime() + 15 * 60000), details: 'Added after your confirmation via LifePilot.' });
        window.open(url, '_blank');
        softBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
      });
    }
  },

  /* ============== HISTORY VIEW ============== */

  renderHistoryView(root) {
    const hist = LP.store.getHistory();
    const el = document.createElement('div');
    el.className = 'view view--history';
    el.innerHTML = `
      <header class="page-header"><h1>${this.t('historyTitle')}</h1></header>
      ${hist.length === 0 ? `<div class="empty-state"><p>${this.t('historyEmpty')}</p></div>` : `
        <div class="history-list">
          ${hist.map(h => `
            <div class="history-item" data-history-id="${h.id}">
              <div class="history-item__main" data-open="${h.id}">
                <p class="history-item__input">“${this.escapeHtml(h.input)}”</p>
                <p class="history-item__meta">${new Date(h.at).toLocaleString()} · ${h.cardTypes.join(', ')}</p>
              </div>
              <button class="history-item__delete" data-delete="${h.id}" aria-label="Delete">${this.svgIcon('trash')}</button>
            </div>
          `).join('')}
        </div>
      `}
    `;
    root.appendChild(el);

    el.querySelectorAll('[data-open]').forEach(node => {
      node.addEventListener('click', () => {
        const id = node.getAttribute('data-open');
        const entry = hist.find(h => h.id === id);
        if (!entry) return;
        // rehydrate dates that were JSON-stringified
        entry.cards.forEach(c => { if (c.start) c.start = new Date(c.start); if (c.end) c.end = new Date(c.end); });
        this.state.currentPlan = { tier: entry.tier, primaryIntent: entry.primaryIntent, cards: entry.cards, text: entry.input };
        location.hash = '#/plan';
      });
    });

    el.querySelectorAll('[data-delete]').forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        LP.store.deleteHistoryEntry(node.getAttribute('data-delete'));
        this.route();
      });
    });
  },

  /* ============== SETTINGS VIEW ============== */

  renderSettingsView(root) {
    const s = this.state.settings;
    const el = document.createElement('div');
    el.className = 'view view--settings';
    el.innerHTML = `
      <header class="page-header"><h1>${this.t('settingsTitle')}</h1></header>

      <div class="settings-group">
        <label class="settings-row">
          <span>Language</span>
          <select id="lang-select" class="settings-select">
            <option value="en" ${s.language === 'en' ? 'selected' : ''}>English</option>
            <option value="ta" ${s.language === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
          </select>
        </label>
        <p class="settings-hint">Only English and Tamil are actually translated and tested. No other language is supported yet.</p>
      </div>

      <div class="settings-group">
        <label class="settings-row">
          <span>Voice input</span>
          <input type="checkbox" id="voice-toggle" class="switch" ${s.voiceEnabled ? 'checked' : ''} />
        </label>
        <p class="settings-hint">Uses your browser's built-in speech recognition. Falls back to text automatically if unsupported.</p>
      </div>

      <div class="settings-group">
        <label class="settings-row">
          <span>Auto-fire ordinary actions</span>
          <input type="checkbox" id="autofire-toggle" class="switch" ${s.autoFireOrdinary ? 'checked' : ''} />
        </label>
        <p class="settings-hint">When on, schedule/reminder/navigation cards open automatically with zero taps. Health, money, messages, and emergencies always ask first regardless of this setting.</p>
      </div>

      <div class="settings-group">
        <button class="btn btn--ghost" id="clear-history-btn">Clear all history</button>
        <button class="btn btn--ghost" id="reset-budget-btn">Reset sandbox budget</button>
      </div>

      <div class="architecture-note">
        <h3>${this.svgIcon('device')} How your data is handled</h3>
        <p>Everything you type, every plan, and your history live only on this device, inside your browser's local storage. Nothing is uploaded to a server or the cloud — this is a fully on-device prototype. The only network calls this app ever makes are the real ones you approve: opening Google Calendar, Google Maps, WhatsApp, SMS, or your phone's dialer.</p>
      </div>
    `;
    root.appendChild(el);

    el.querySelector('#lang-select').addEventListener('change', (e) => {
      this.state.settings.language = e.target.value;
      LP.store.saveSettings(this.state.settings);
      this.route();
    });
    el.querySelector('#voice-toggle').addEventListener('change', (e) => {
      this.state.settings.voiceEnabled = e.target.checked;
      LP.store.saveSettings(this.state.settings);
    });
    el.querySelector('#autofire-toggle').addEventListener('change', (e) => {
      this.state.settings.autoFireOrdinary = e.target.checked;
      LP.store.saveSettings(this.state.settings);
    });
    el.querySelector('#clear-history-btn').addEventListener('click', () => {
      if (confirm('Clear all saved plans from history?')) { LP.store.clearHistory(); this.route(); }
    });
    el.querySelector('#reset-budget-btn').addEventListener('click', () => {
      if (confirm('Reset the sandbox budget tracker back to ₹15,000 with nothing reserved?')) {
        LP.store.saveBudget({ total: 15000, currency: 'INR', reserved: 0, items: [] });
        this.route();
      }
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
      bolt: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      mic: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      pin: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s7-7.4 7-12.5A7 7 0 105 9.5C5 14.6 12 22 12 22z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.6"/></svg>',
      send: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11l18-8-8 18-2-8-8-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      wallet: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 13h3M2 10h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      bell: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 19a2 2 0 004 0" stroke="currentColor" stroke-width="1.6"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2C9.5 21 3 14.5 3 6a2 2 0 012-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12l6 6L20 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      lock: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" stroke-width="1.6"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      device: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M11 18h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      spark: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      plane: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 16l20-7-7 20-3-8-8-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 00-2 2V5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 5a2 2 0 00-2-2h-6v18h6a2 2 0 012 2V5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      home: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11l9-7 9 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
      cloud: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 18a4 4 0 01-1-7.9A5 5 0 0116 8a4.5 4.5 0 011 8.9" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
    };
    return icons[name] || '';
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
