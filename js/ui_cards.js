/* ============================================================
   LifePilot — Layer 4 (continued): PLAN DASHBOARD + CARD RENDERING
   ============================================================ */

Object.assign(App, {

  /* ============== PLAN / DASHBOARD (Screen 2) ============== */

  renderPlanView(root) {
    const plan = this.state.currentPlan;
    const el = document.createElement('div');
    el.className = 'view view--plan';
    if (plan && plan.tone) el.classList.add(`tone-${plan.tone.urgency}`, `mood-${plan.tone.emotion}`);

    if (!plan) {
      el.innerHTML = `<header class="page-header"><h1>Your plan</h1></header>
        <div class="empty-state"><p>No active plan yet.</p><a href="#/home" class="btn btn--primary">Start on Home</a></div>`;
      root.appendChild(el);
      return;
    }

    const isCritical = plan.tone && plan.tone.urgency === 'critical';
    el.innerHTML = `
      <header class="page-header ${isCritical ? 'page-header--critical' : ''}">
        <h1>Your plan</h1>
        <p class="page-header__sub">"${this.escapeHtml(plan.text)}"</p>
      </header>
      <div class="card-stack" id="card-stack"></div>
      ${plan.cards.length > 1 ? '<button class="whatif-fab" id="whatif-fab">' + this.svgIcon('spark') + ' What if…</button>' : ''}
      <div id="whatif-panel" class="whatif-panel" hidden></div>
    `;
    root.appendChild(el);

    const stack = el.querySelector('#card-stack');
    plan.cards.forEach((card, i) => {
      const cardEl = this.renderCard(card, plan);
      cardEl.style.animationDelay = `${i * 80}ms`;
      stack.appendChild(cardEl);
    });

    requestAnimationFrame(() => {
      plan.cards.forEach(card => {
        if (card.permission === 'auto' && !['INFO_SUMMARY', 'CONDITIONAL', 'COMPARE', 'TRACK_HABIT', 'SET_GOAL', 'CAPTURE_NOTE', 'TIMER', 'GENERATE_DOC'].includes(card.type)) {
          this.autoFireCard(card);
        }
      });
    });

    const fab = el.querySelector('#whatif-fab');
    if (fab) fab.addEventListener('click', () => this.openWhatIfPanel(el, plan));
  },

  autoFireCard(card) {
    if (card.isRecurringGroup) return;
    const url = card.uberUrl || card.gcalUrl || card.mapsUrl || card.spotifyUrl || card.searchUrl || card.translateUrl;
    if (!url) return;
    const badge = document.querySelector(`[data-card-id="${card.id}"] .action-card__firedbadge`);
    if (badge) badge.hidden = false;
    setTimeout(() => {
      const win = window.open(url, '_blank');
      if (!win) window.location.href = url;
    }, 350);
  },

  /* ============== "WHAT-IF" SANDBOX (1.7) ============== */

  openWhatIfPanel(viewEl, plan) {
    const panel = viewEl.querySelector('#whatif-panel');
    panel.hidden = false;
    panel.innerHTML = `
      <div class="whatif-panel__inner">
        <h3>${this.svgIcon('spark')} What if…</h3>
        <div class="whatif-row">
          <button class="chip" data-shift="1">Push by 1 day</button>
          <button class="chip" data-shift="2">Push by 2 days</button>
          <button class="chip" data-shift="-1">Pull back 1 day</button>
        </div>
        <button class="btn btn--ghost btn--sm" id="whatif-close">Close</button>
      </div>`;
    panel.querySelectorAll('[data-shift]').forEach(btn => {
      btn.addEventListener('click', () => {
        const days = parseInt(btn.getAttribute('data-shift'), 10);
        this.shiftPlanDates(plan, days);
        this.route();
      });
    });
    panel.querySelector('#whatif-close').addEventListener('click', () => { panel.hidden = true; });
  },

  shiftPlanDates(plan, days) {
    plan.cards.forEach(card => {
      if (card.start) {
        card.start = new Date(card.start.getTime() + days * 86400000);
        if (card.end) card.end = new Date(card.end.getTime() + days * 86400000);
        card.subtitle = `${LP.util.formatDate(card.start)} · ${LP.util.formatTime(card.start.getHours(), card.start.getMinutes())} (shifted)`;
        if (card.gcalUrl) card.gcalUrl = LP.util.gcalUrl({ title: card.title, start: card.start, end: card.end || new Date(card.start.getTime() + 3600000) });
      }
    });
  },

  /* ============== CARD RENDERING — dispatch table over 15 primitives ============== */

  renderCard(card, plan) {
    const wrap = document.createElement('article');
    wrap.className = `action-card action-card--${card.type.toLowerCase()} action-card--${card.permission}`;
    wrap.setAttribute('data-card-id', card.id);

    const permBadge = card.permission === 'auto'
      ? `<span class="badge badge--auto">${this.svgIcon('check')} ${this.t('doneAutomatically')}</span>`
      : `<span class="badge badge--permission">${this.svgIcon('lock')} ${this.t('needsPermission')}</span>`;

    const renderer = this.cardBodyRenderers[card.type] || this.cardBodyRenderers.DEFAULT;
    const { bodyHtml, footerHtml } = renderer.call(this, card);

    wrap.innerHTML = `
      <div class="action-card__head">
        ${permBadge}
        <span class="action-card__type">${card.type.replace(/_/g, ' ')}</span>
      </div>
      <div class="action-card__body">${bodyHtml}</div>
      <div class="action-card__footer">${footerHtml}</div>
    `;
    this.wireCardInteractions(wrap, card);
    return wrap;
  },

  cardBodyRenderers: {
    SCHEDULE(card) {
      if (card.isRecurringGroup) {
        return {
          bodyHtml: `
            <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
            <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
            <details class="recurring-group">
              <summary>View all ${card.occurrences.length} sessions</summary>
              <ul class="recurring-list">
                ${card.occurrences.map(o => `<li>${LP.util.formatDate(o.start)} · ${LP.util.formatTime(o.start.getHours(), o.start.getMinutes())} <a href="${o.gcalUrl}" target="_blank" rel="noopener">Open</a></li>`).join('')}
              </ul>
            </details>`,
          footerHtml: `<span class="action-card__firedbadge">${this.svgIcon('check')} All sessions opened automatically</span>`
        };
      }
      return {
        bodyHtml: `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          ${card.tripMeta ? this.renderTripMetaHtml(card.tripMeta) : ''}
          <div class="daystrip">${this.renderDayStrip(card)}</div>`,
        footerHtml: `
          <a href="${card.gcalUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm action-card__link">${this.svgIcon('calendar')} Open in Calendar</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>
          <span class="action-card__popupnote" hidden>Your browser blocked the automatic pop-up — tap "Open in Calendar" to finish.</span>`
      };
    },

    REMIND(card) {
      const target = card.start ? card.start.getTime() : Date.now();
      return {
        bodyHtml: `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <div class="countdown" data-target="${target}">calculating…</div>`,
        footerHtml: `
          <a href="${card.gcalUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm action-card__link">${this.svgIcon('calendar')} Open in Calendar</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>`
      };
    },

    NAVIGATE(card) {
      return {
        bodyHtml: `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <div class="map-thumb">${this.svgIcon('pin')} <span>${this.escapeHtml(card.destination)}</span></div>`,
        footerHtml: `
          <a href="${card.mapsUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm action-card__link">${this.svgIcon('pin')} Open in Maps</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>
          <span class="action-card__popupnote" hidden>Your browser blocked the automatic pop-up — tap "Open in Maps" to finish.</span>`
      };
    },

    NOTIFY(card) {
      return {
        bodyHtml: `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <textarea class="message-preview message-preview--editable" data-msg-edit>${this.escapeHtml(card.message)}</textarea>
          <p class="action-card__meta" data-contact-label>${card.contactTel ? 'To: ' + this.escapeHtml(card.contactName || card.contactTel) : 'No number attached — sends via your device\u2019s contact chooser'}</p>`,
        footerHtml: `
          <button class="btn btn--ghost btn--sm" data-pick-contact="${card.id}">${this.svgIcon('pin')} Pick contact</button>
          <button class="btn btn--primary btn--sm" data-confirm-notify="${card.id}">${this.svgIcon('send')} Send via WhatsApp</button>
          <button class="btn btn--ghost btn--sm" data-confirm-sms="${card.id}">Send via SMS</button>
          <span class="action-card__sentbadge" hidden>${this.svgIcon('check')} Sent</span>`
      };
    },

    BUDGET_TRACK(card) {
      return { bodyHtml: this.renderBudgetBodyHtml(card), footerHtml: `
        <button class="btn btn--primary btn--sm" data-confirm-budget="${card.id}" data-amount="${card.amount}" data-label="${this.escapeHtml(card.label || '')}">${this.svgIcon('wallet')} ${this.t('confirmReserve')}</button>
        <span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Reserved</span>` };
    },

    PAY(card) {
      return {
        bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>`,
        footerHtml: `
          <button class="btn btn--primary btn--sm" data-confirm-pay="${card.id}">${this.svgIcon('wallet')} Approve</button>
          <span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Approved (sandbox)</span>`
      };
    },

    CAB(card) {
      return {
        bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>`,
        footerHtml: `<button class="btn btn--primary btn--sm" data-confirm-cab="${card.id}">${this.svgIcon('check')} Approve & open Uber</button>
          <span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Opened</span>`
      };
    },

    MUSIC(card) {
      return {
        bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>`,
        footerHtml: `<a href="${card.spotifyUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">${this.svgIcon('check')} Open in Spotify</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>`
      };
    },

    SEARCH_WEB(card) {
      return {
        bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>`,
        footerHtml: `<a href="${card.searchUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">${this.svgIcon('check')} Google</a>
          <a href="${card.youtubeUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">${this.svgIcon('check')} YouTube</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>`
      };
    },

    GENERATE_DOC(card) {
      return {
        bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <div class="doc-preview">${this.escapeHtml(card.content).replace(/\n/g, '<br>')}</div>`,
        footerHtml: `<a href="${card.gdocsUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">${this.svgIcon('check')} Open in Google Docs</a>`
      };
    },

    TRACK_HABIT(card) {
      return { bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
        <div class="habit-grid">${this.renderHabitGrid(card)}</div>`, footerHtml: `<span class="action-card__firedbadge">${this.svgIcon('check')} Logged</span>` };
    },

    SET_GOAL(card) {
      return { bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
        <div class="goal-progress"><div class="goal-progress__bar" style="width:${card.progress}%"></div></div>`, footerHtml: `<span class="action-card__firedbadge">${this.svgIcon('check')} Goal created</span>` };
    },

    COMPARE(card) {
      return { bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
        <div class="compare-stack">
          <div class="compare-col"><h4>${this.escapeHtml(card.optionA)}</h4></div>
          <div class="compare-col"><h4>${this.escapeHtml(card.optionB)}</h4></div>
        </div>`, footerHtml: '' };
    },

    TRANSLATE(card) {
      return { bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>`,
        footerHtml: `<a href="${card.translateUrl}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">${this.svgIcon('check')} Open Translate</a>
          <span class="action-card__firedbadge" hidden>${this.svgIcon('check')} Opened automatically</span>` };
    },

    TIMER(card) {
      return { bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
        <div class="timer-ring" data-minutes="${card.minutes}"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" class="timer-ring__bg"/><circle cx="50" cy="50" r="45" class="timer-ring__fg"/></svg><span class="timer-ring__label">${card.minutes}:00</span></div>`,
        footerHtml: '' };
    },

    CAPTURE_NOTE(card) {
      return { bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
        <p class="action-card__answer">${this.escapeHtml(card.content)}</p>`, footerHtml: `<span class="action-card__firedbadge">${this.svgIcon('check')} Saved to notes</span>` };
    },

    CONDITIONAL(card) {
      return {
        bodyHtml: `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <div class="conditional-branches">
            <div class="conditional-branch conditional-branch--true">
              <div class="conditional-branch__label">${this.svgIcon('check')} If true</div>
              ${card.ifTrue.map(c => `<div class="conditional-mini-card">${this.escapeHtml(c.title)}</div>`).join('') || '<div class="conditional-mini-card conditional-mini-card--empty">No action</div>'}
            </div>
            <div class="conditional-branch conditional-branch--false">
              <div class="conditional-branch__label">Otherwise</div>
              ${card.ifFalse.length ? card.ifFalse.map(c => `<div class="conditional-mini-card">${this.escapeHtml(c.title)}</div>`).join('') : '<div class="conditional-mini-card conditional-mini-card--empty">No action</div>'}
            </div>
          </div>`,
        footerHtml: `<span class="action-card__meta">${card.condition.check === 'weather' ? 'Checked against live weather when the day arrives.' : 'This condition will be checked before acting.'}</span>`
      };
    },

    INFO_SUMMARY(card) {
      const short = card.body.length > 160 ? card.body.slice(0, 160) + '…' : card.body;
      return {
        bodyHtml: `
          <h3 class="action-card__title">${this.escapeHtml(card.title)}</h3>
          <div class="info-accordion" data-full="${this.escapeHtml(card.body)}">
            <p class="action-card__answer info-accordion__short">${this.escapeHtml(short)}</p>
            ${card.body.length > 160 ? '<button class="info-accordion__toggle">Read more</button>' : ''}
          </div>`,
        footerHtml: card.softSuggestion
          ? `<button class="btn btn--ghost btn--sm" data-soft-remind="${card.id}">${this.svgIcon('bell')} ${this.escapeHtml(card.softSuggestion.label)}</button><span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Reminder added</span>`
          : ''
      };
    },

    HEALTH_INFO(card) {
      return {
        bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p><p class="action-card__answer">${this.escapeHtml(card.body)}</p>`,
        footerHtml: `<button class="btn btn--primary btn--sm" data-confirm-health="${card.id}">${this.svgIcon('check')} ${card.suggestedFollowUp ? this.escapeHtml(card.suggestedFollowUp.label) : 'Acknowledge'}</button>
          <span class="action-card__reservedbadge" hidden>${this.svgIcon('check')} Added</span>`
      };
    },

    ESCALATE(card) {
      return {
        bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title)}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle)}</p>
          <p class="action-card__answer">${this.escapeHtml(card.body)}</p><p class="action-card__honesty">${this.escapeHtml(card.honestyNote)}</p>`,
        footerHtml: `
          <a href="tel:${card.telNumber}" class="btn btn--emergency btn--sm">${this.svgIcon('phone')} ${this.escapeHtml(card.telLabel)}</a>
          <a href="${LP.util.waUrl(card.shareLocationText)}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">${this.svgIcon('pin')} Share situation with a contact</a>
          <div class="reference-links">${card.referenceLinks.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${this.escapeHtml(l.label)}</a>`).join('')}</div>`
      };
    },

    DEFAULT(card) {
      return { bodyHtml: `<h3 class="action-card__title">${this.escapeHtml(card.title || 'Action')}</h3><p class="action-card__meta">${this.escapeHtml(card.subtitle || '')}</p>`, footerHtml: '' };
    }
  },

  /* ============== WIDGETS (4.3) ============== */

  renderDayStrip(card) {
    if (!card.start) return '';
    const hour = card.start.getHours();
    const pct = Math.round((hour / 24) * 100);
    return `<div class="daystrip__track"><div class="daystrip__block" style="left:${pct}%"></div></div>`;
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
        <div class="budget-bar__track"><div class="budget-bar__fill" style="width:${pct}%"></div><div class="budget-bar__proposed ${over ? 'is-over' : ''}" style="width:${projectedPct}%"></div></div>
        <div class="budget-bar__labels"><span>₹${budget.reserved} reserved of ₹${budget.total}</span><span class="${over ? 'is-over-text' : ''}">${over ? this.t('budgetOver') : this.t('budgetOk')}: after this, ₹${projected}</span></div>
      </div>`;
  },

  renderHabitGrid(card) {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return days.map(d => `<span class="habit-grid__cell ${Math.random() > 0.4 ? 'is-filled' : ''}">${d}</span>`).join('');
  },

  /* ============== CARD INTERACTIONS ============== */

  wireCardInteractions(wrap, card) {
    const notifyBtn = wrap.querySelector('[data-confirm-notify]');
    const smsBtn = wrap.querySelector('[data-confirm-sms]');
    const pickBtn = wrap.querySelector('[data-pick-contact]');
    if (pickBtn) {
      if (!LP.perception.isContactPickerSupported()) {
        pickBtn.title = 'Contact picker is not supported on this browser — you can still send, your device\u2019s app will ask who to send to.';
        pickBtn.classList.add('is-disabled');
      }
      pickBtn.addEventListener('click', async () => {
        const contact = await LP.perception.pickContact();
        if (!contact || !contact.tel) return;
        card.contactTel = contact.tel;
        card.contactName = contact.name;
        const label = wrap.querySelector('[data-contact-label]');
        if (label) label.textContent = 'To: ' + (contact.name || contact.tel);
      });
    }
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        const editArea = wrap.querySelector('[data-msg-edit]');
        const finalMsg = editArea ? editArea.value : card.message;
        window.open(LP.util.waUrl(finalMsg, card.contactTel), '_blank');
        notifyBtn.hidden = true;
        if (smsBtn) smsBtn.hidden = true;
        wrap.querySelector('.action-card__sentbadge').hidden = false;
      });
    }
    if (smsBtn) {
      smsBtn.addEventListener('click', () => {
        const editArea = wrap.querySelector('[data-msg-edit]');
        const finalMsg = editArea ? editArea.value : card.message;
        window.open(LP.util.smsUrl(finalMsg, card.contactTel), '_blank');
        smsBtn.hidden = true;
        if (notifyBtn) notifyBtn.hidden = true;
        wrap.querySelector('.action-card__sentbadge').hidden = false;
      });
    }

    const budgetBtn = wrap.querySelector('[data-confirm-budget]');
    if (budgetBtn) {
      budgetBtn.addEventListener('click', () => {
        LP.store.reserveBudget(card.amount, card.label);
        budgetBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
        wrap.querySelector('.action-card__body').innerHTML = this.renderBudgetBodyHtml(card);
      });
    }

    const payBtn = wrap.querySelector('[data-confirm-pay]');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        window.open(card.upiUrl, '_blank');
        payBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
      });
    }

    const cabBtn = wrap.querySelector('[data-confirm-cab]');
    if (cabBtn) {
      cabBtn.addEventListener('click', () => {
        window.open(card.uberUrl, '_blank');
        cabBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
      });
    }

    const healthBtn = wrap.querySelector('[data-confirm-health]');
    if (healthBtn) {
      healthBtn.addEventListener('click', () => {
        if (card.suggestedFollowUp) {
          const start = card.suggestedFollowUp.time;
          window.open(LP.util.gcalUrl({ title: `Check-in: ${card.title}`, start, end: new Date(start.getTime() + 15 * 60000), details: 'Added after your confirmation via LifePilot.' }), '_blank');
        }
        healthBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
      });
    }

    const softBtn = wrap.querySelector('[data-soft-remind]');
    if (softBtn) {
      softBtn.addEventListener('click', () => {
        const start = card.softSuggestion.time;
        window.open(LP.util.gcalUrl({ title: 'Check-in with yourself', start, end: new Date(start.getTime() + 15 * 60000) }), '_blank');
        softBtn.hidden = true;
        wrap.querySelector('.action-card__reservedbadge').hidden = false;
      });
    }

    const infoToggle = wrap.querySelector('.info-accordion__toggle');
    if (infoToggle) {
      infoToggle.addEventListener('click', () => {
        const acc = wrap.querySelector('.info-accordion');
        const full = acc.getAttribute('data-full');
        acc.querySelector('.info-accordion__short').textContent = full;
        infoToggle.remove();
      });
    }

    const countdown = wrap.querySelector('.countdown');
    if (countdown) {
      const tick = () => {
        const target = parseInt(countdown.getAttribute('data-target'), 10);
        const diff = target - Date.now();
        if (diff <= 0) { countdown.textContent = 'Due now'; return; }
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
        countdown.textContent = `in ${h}h ${m}m`;
      };
      tick();
      setInterval(tick, 60000);
    }

    const timerRing = wrap.querySelector('.timer-ring');
    if (timerRing) {
      let remaining = parseInt(timerRing.getAttribute('data-minutes'), 10) * 60;
      const label = timerRing.querySelector('.timer-ring__label');
      const fg = timerRing.querySelector('.timer-ring__fg');
      const total = remaining;
      const iv = setInterval(() => {
        remaining--;
        if (remaining <= 0) { clearInterval(iv); label.textContent = 'Done'; return; }
        const m = Math.floor(remaining / 60), s = remaining % 60;
        label.textContent = `${m}:${String(s).padStart(2, '0')}`;
        const pct = remaining / total;
        fg.style.strokeDashoffset = String(283 * (1 - pct));
      }, 1000);
    }
  }
});
