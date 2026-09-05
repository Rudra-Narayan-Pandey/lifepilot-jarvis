/* ============================================================
   LifePilot — LIFE CHANNEL
   Full-screen calm companion overlay shown alongside (never
   instead of) the normal ESCALATE card. Talks the person through
   a crisis category using DATA from LP.crisisCategories — no
   per-category dialogue trees to maintain, no auto-dial, no
   auto-send. Every phone call and every outgoing message is a
   real <a> tap the person makes themselves.
   ============================================================ */

LP.lifeChannel = {

  open(crisis, rawInput) {
    if (document.getElementById('life-channel')) return; // already open
    const primary = crisis.helplines[0];
    const overlay = document.createElement('div');
    overlay.id = 'life-channel';
    overlay.className = 'life-channel-overlay crisis-severity-' + crisis.severity;
    overlay.innerHTML = `
      <div class="lc-header">
        <div class="lc-pulse-dot"></div>
        <span class="lc-title">LifePilot is with you — ${LP.lifeChannel.escapeHtml(crisis.label)}</span>
        <button class="lc-minimize" aria-label="Minimize" data-lc-minimize>↓</button>
      </div>
      <a href="tel:${primary.number}" class="lc-call-now">${LP.lifeChannel.svgPhone()} Call ${LP.lifeChannel.escapeHtml(primary.label)} now</a>
      <div class="lc-messages" id="lc-messages-container"></div>
      <div class="lc-quick-replies" id="lc-quick-replies"></div>
      <div class="lc-input-row">
        <input type="text" id="lc-text-input" placeholder="Type here or use the buttons above..." />
        <button data-lc-send aria-label="Send">→</button>
      </div>
      <div class="lc-footer-note">LifePilot never places a call or sends a message on its own — every tap is yours.</div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-lc-minimize]').addEventListener('click', () => LP.lifeChannel.minimize());
    overlay.querySelector('[data-lc-send]').addEventListener('click', () => LP.lifeChannel.sendUserMessage());
    overlay.querySelector('#lc-text-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') LP.lifeChannel.sendUserMessage();
    });

    LP.lifeChannel.currentCrisis = crisis;
    LP.lifeChannel.startConversation(crisis, rawInput);
  },

  close() {
    const overlay = document.getElementById('life-channel');
    if (overlay) overlay.remove();
    LP.lifeChannel.currentFlow = null;
  },

  minimize() {
    const overlay = document.getElementById('life-channel');
    if (overlay) overlay.classList.toggle('lc-minimized');
  },

  escapeHtml(s) {
    const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
  },

  svgPhone() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .5 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8Z" stroke="currentColor" stroke-width="1.6"/></svg>';
  },

  addMessage(text, sender, delay = 0) {
    setTimeout(() => {
      const container = document.getElementById('lc-messages-container');
      if (!container) return;
      const msg = document.createElement('div');
      msg.className = 'lc-message lc-message-' + sender;
      msg.innerHTML = `<p>${LP.lifeChannel.escapeHtml(text)}</p><span class="lc-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    }, delay);
  },

  setQuickReplies(options) {
    const container = document.getElementById('lc-quick-replies');
    if (!container) return;
    container.innerHTML = options.map((opt, i) =>
      `<button class="lc-quick-reply" data-lc-reply="${i}">${LP.lifeChannel.escapeHtml(opt.label)}</button>`
    ).join('');
    Array.from(container.querySelectorAll('[data-lc-reply]')).forEach((btn, i) => {
      btn.addEventListener('click', () => LP.lifeChannel.handleQuickReply(options[i]));
    });
  },

  /* -------------------------------------------------------------
     Flow generation — built from crisis.safetyTips (DATA), not a
     hand-written script per category. Sensitive categories get a
     resource-first tone; others get a practical-steps tone.
  ------------------------------------------------------------- */
  buildFlow(crisis) {
    const steps = [];
    const isSupport = crisis.assistanceType === 'support';
    const opener = crisis.sensitive
      ? `I hear you. This is a lot to carry — the ${crisis.helplines[0].label} line above is free, confidential, and trained for exactly this. You can tap it any time.`
      : isSupport
        ? `I've pulled together helplines and resources for "${crisis.label}." Tap the button above any time, or just tell me more.`
        : `I'm right here with you. Tap "Call ${crisis.helplines[0].label}" above whenever you're ready — I'll stay on screen and walk through this with you.`;
    steps.push({ botMessage: opener, autoAdvance: 1600 });

    if (!isSupport) {
      steps.push({
        botMessage: 'Are you safe in this exact moment?',
        quickReplies: [
          { label: 'Yes, for now', value: 'safe' },
          { label: 'No', value: 'unsafe' },
          { label: "I'm not sure", value: 'unsure' }
        ]
      });
    }

    if (crisis.offerBreathing) {
      steps.push({
        botMessage: 'Would it help to do a short breathing exercise together right now?',
        quickReplies: [
          { label: 'Yes, guide me', value: 'breathing' },
          { label: 'Not right now', value: 'skip_breathing' }
        ]
      });
    }

    (crisis.safetyTips || []).forEach((tip) => {
      steps.push({ botMessage: tip, autoAdvance: 2600 });
    });

    if (crisis.rightsNote) {
      steps.push({ botMessage: crisis.rightsNote, autoAdvance: 3200 });
    }

    if (!isSupport) {
      steps.push({
        botMessage: 'Would you like me to prepare a message to a trusted contact? I will show it to you first — nothing sends without your tap.',
        quickReplies: [
          { label: 'Yes, prepare it', value: 'prepare_message' },
          { label: 'Not right now', value: 'skip_message' }
        ]
      });
    }

    steps.push({
      botMessage: isSupport
        ? "Tell me more about your situation, or tap the helpline above whenever you're ready."
        : "I'm still here. Tell me what's happening in your own words, or tap the call button above whenever you're ready.",
      quickReplies: [
        { label: isSupport ? 'This helped — end this' : "I'm safe now — end this", value: 'end' }
      ]
    });

    return steps;
  },

  startConversation(crisis) {
    LP.lifeChannel.currentFlow = LP.lifeChannel.buildFlow(crisis);
    LP.lifeChannel.runFlow(0);
  },

  runFlow(stepIndex) {
    const flow = LP.lifeChannel.currentFlow;
    if (!flow || stepIndex >= flow.length) return;
    const step = flow[stepIndex];
    LP.lifeChannel.currentStep = stepIndex;
    LP.lifeChannel.addMessage(step.botMessage, 'bot', step.delay || 0);

    const qr = document.getElementById('lc-quick-replies');
    if (qr) qr.innerHTML = '';

    if (step.quickReplies) {
      setTimeout(() => LP.lifeChannel.setQuickReplies(step.quickReplies), (step.delay || 0) + 400);
    }
    if (step.autoAdvance) {
      setTimeout(() => LP.lifeChannel.runFlow(stepIndex + 1), (step.delay || 0) + step.autoAdvance);
    }
  },

  handleQuickReply(opt) {
    LP.lifeChannel.addMessage(opt.label, 'user');
    LP.lifeChannel.evaluateReply(opt.value);
  },

  sendUserMessage() {
    const input = document.getElementById('lc-text-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';
    LP.lifeChannel.addMessage(text, 'user');
    LP.lifeChannel.evaluateReply(text.toLowerCase());
  },

  evaluateReply(value) {
    const crisis = LP.lifeChannel.currentCrisis;
    if (value === 'end') {
      LP.lifeChannel.addMessage("Okay — I'm glad this helped. This will stay minimized if you need it again.", 'bot', 300);
      setTimeout(() => LP.lifeChannel.minimize(), 1600);
      return;
    }
    if (value === 'unsafe') {
      LP.lifeChannel.addMessage("Please tap the call button above now if you can. I'll stay right here.", 'bot', 300);
    } else if (value === 'breathing') {
      LP.lifeChannel.runBreathingExercise();
      return;
    } else if (value === 'skip_breathing') {
      LP.lifeChannel.addMessage('Okay — no pressure. I\'m still right here.', 'bot', 300);
    } else if (value === 'prepare_message') {
      LP.lifeChannel.offerMessageDraft(crisis);
      return;
    } else if (value === 'skip_message') {
      LP.lifeChannel.addMessage('Okay, no message drafted. I\'m still here whenever you want it.', 'bot', 300);
    }
    // Continue the underlying step flow for anything else typed/tapped.
    const nextIndex = (LP.lifeChannel.currentStep || 0) + 1;
    setTimeout(() => LP.lifeChannel.runFlow(nextIndex), 900);
  },

  /* Guided 4-4-4 breathing (in for 4, hold for 4, out for 4) — a widely
     used grounding technique, shown as a simple animated pill rather
     than described only in text. Purely visual/timed; no data leaves
     the device. */
  runBreathingExercise() {
    LP.lifeChannel.addMessage("Let's do a few rounds together: in for 4, hold for 4, out for 4.", 'bot', 200);
    setTimeout(() => {
      const container = document.getElementById('lc-messages-container');
      if (!container) return;
      const wrap = document.createElement('div');
      wrap.className = 'lc-message lc-message-bot lc-breathing';
      wrap.innerHTML = `<div class="lc-breath-circle"><span id="lc-breath-label">In</span></div>`;
      container.appendChild(wrap);
      container.scrollTop = container.scrollHeight;
      const circle = wrap.querySelector('.lc-breath-circle');
      const label = wrap.querySelector('#lc-breath-label');
      const phases = [{ t: 'In', cls: 'lc-breath-in' }, { t: 'Hold', cls: 'lc-breath-hold' }, { t: 'Out', cls: 'lc-breath-out' }];
      let round = 0, phaseIdx = 0;
      const step = () => {
        if (round >= 3) {
          label.textContent = 'Nicely done';
          circle.className = 'lc-breath-circle';
          setTimeout(() => LP.lifeChannel.runFlow((LP.lifeChannel.currentStep || 0) + 1), 1400);
          return;
        }
        const phase = phases[phaseIdx];
        circle.className = 'lc-breath-circle ' + phase.cls;
        label.textContent = phase.t;
        phaseIdx = (phaseIdx + 1) % phases.length;
        if (phaseIdx === 0) round++;
        setTimeout(step, 4000);
      };
      step();
    }, 600);
  },

  /* Prepares (never sends) a WhatsApp/SMS draft with the person's
     live location, mirroring the honesty model of the ESCALATE card. */
  offerMessageDraft(crisis) {
    LP.perception.startLocationTracking().then((coords) => {
      const locText = coords
        ? `\n\nMy location: https://www.google.com/maps?q=${coords.lat},${coords.lng}`
        : '\n\n(Location unavailable — please try to reach me by phone.)';
      const draft = `I need help right now (${crisis.label}). Please call me.` + locText;
      LP.lifeChannel.addMessage('Here is the draft — tap to open it in WhatsApp or Messages and send it yourself:', 'bot', 300);
      setTimeout(() => {
        const container = document.getElementById('lc-messages-container');
        if (!container) return;
        const wrap = document.createElement('div');
        wrap.className = 'lc-message lc-message-bot lc-draft';
        wrap.innerHTML = `<p>${LP.lifeChannel.escapeHtml(draft)}</p>
          <div class="lc-draft-actions">
            <a href="${LP.util.waUrl(draft)}" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Open in WhatsApp</a>
            <a href="sms:?body=${encodeURIComponent(draft)}" class="btn btn--ghost btn--sm">Open as SMS</a>
          </div>`;
        container.appendChild(wrap);
        container.scrollTop = container.scrollHeight;
      }, 700);
      setTimeout(() => LP.lifeChannel.runFlow((LP.lifeChannel.currentStep || 0) + 1), 1400);
    });
  }
};
