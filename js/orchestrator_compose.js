/* ============================================================
   LifePilot — Layer 1 (continued): COMPOSITION
   Turns classified signals into a plan tree of action-card specs.
   ============================================================ */

/* ---------------------------------------------------------------
   1.3 — Recursive Intent Decomposition entry point
--------------------------------------------------------------- */

LP.findExpansionTrigger = function (text) {
  const t = LP.util.lower(text);
  for (const trigger in LP.vocab.expansions) {
    if (t.includes(trigger)) return trigger;
  }
  return null;
};

/* ---------------------------------------------------------------
   Main compose(): the single entry point the UI calls.
   Returns { tier, primaryIntent, cards, tree, text, tone }
--------------------------------------------------------------- */

LP.compose = function (rawText, opts) {
  opts = opts || {};
  const { text, signals, tone } = LP.classify(rawText);

  // --- STAKES GATE: crisis categories win first (18-category engine) ---
  const crisis = LP.crisisClassify ? LP.crisisClassify(text) : null;
  if (crisis) {
    const card = LP.buildCrisisCard(crisis, text);
    if (LP.lifeChannel) LP.lifeChannel.open(crisis, text);
    return { tier: 1, primaryIntent: 'ESCALATE', cards: [card], tree: LP.wrapTree([card]), text, tone, crisisId: crisis.id };
  }

  // --- STAKES GATE: generic emergency language wins next (medical/fire/etc
  // that doesn't match one of the 18 named categories) ---
  if (signals.emergency) {
    const card = LP.buildEscalateCard(text);
    if (LP.lifeChannel && LP.genericEmergencyCategory) LP.lifeChannel.open(LP.genericEmergencyCategory, text);
    return { tier: 1, primaryIntent: 'ESCALATE', cards: [card], tree: LP.wrapTree([card]), text, tone };
  }

  // --- Health always its own gated path ---
  if (signals.health) {
    const card = LP.buildHealthInfoCard(text);
    return { tier: 1, primaryIntent: 'HEALTH_INFO', cards: [card], tree: LP.wrapTree([card]), text, tone };
  }

  // --- Conditional language ("if it rains..., else...") ---
  if (signals.conditional && !opts.skipConditional) {
    const cond = LP.detectConditional(text);
    if (cond) {
      const node = LP.buildConditionalNode(cond, text);
      return { tier: 1, primaryIntent: 'CONDITIONAL', cards: [node], tree: LP.wrapTree([node]), text, tone };
    }
  }

  // --- Compound life-event expansion (e.g. "I'm moving to Bangalore") ---
  const trigger = LP.findExpansionTrigger(text);
  if (trigger) {
    const expansionSpecs = LP.vocab.expansions[trigger](text);
    const cards = expansionSpecs.map(spec => LP.buildCardFromExpansionSpec(spec, text));
    return { tier: 1, primaryIntent: 'DECOMPOSED', cards, tree: LP.wrapTree(cards), text, tone, decomposed: true };
  }

  // --- Open-ended / emotional, no other actionable signal ---
  const actionableSignalCount = ['schedule', 'remind', 'navigate', 'notify', 'budget', 'search', 'doc', 'habit', 'goal', 'compare', 'translate', 'timer', 'note', 'pay', 'cab', 'music'].filter(k => signals[k]).length;
  if (signals.openEnded && actionableSignalCount === 0 && !signals.info) {
    const card = LP.buildOpenEndedCard(text);
    return { tier: 3, primaryIntent: 'INFO_SUMMARY', cards: [card], tree: LP.wrapTree([card]), text, tone };
  }

  // --- Pure info / study / subject question ---
  if (signals.info && actionableSignalCount === 0) {
    const card = LP.buildInfoCard(text);
    return { tier: 1, primaryIntent: 'INFO_SUMMARY', cards: [card], tree: LP.wrapTree([card]), text, tone };
  }

  const cards = [];

  // --- Trip / multi-step booking-style detection ---
  const isTrip = /\btrip|travel|visit|vacation|flight|train to|holiday\b/i.test(text) && LP.util.extractLocation(text);
  if (isTrip) {
    cards.push(...LP.buildTripPlan(text));
  }

  // --- Recurrence: "every Monday and Thursday at 6pm" etc ---
  const recurrence = LP.util.extractRecurrence(text);
  if (recurrence && !isTrip) {
    cards.push(...LP.buildRecurringCards(text, recurrence));
  } else if (!isTrip && signals.schedule) {
    cards.push(...LP.buildScheduleCards(text));
  }

  if (signals.remind && !signals.schedule && !recurrence) cards.push(LP.buildReminderCard(text));
  if (signals.navigate && !isTrip) cards.push(LP.buildNavigateCard(text));
  if (signals.notify) cards.push(LP.buildNotifyCard(text));
  if (signals.pay) cards.push(LP.buildPayCard(text));
  else if (signals.budget && !isTrip) cards.push(LP.buildBudgetCard(text));
  if (signals.cab) cards.push(LP.buildCabCard(text));
  if (signals.music) cards.push(LP.buildMusicCard(text));
  if (signals.search) cards.push(LP.buildSearchCard(text));
  if (signals.doc) cards.push(LP.buildDocCard(text));
  if (signals.habit) cards.push(LP.buildHabitCard(text));
  if (signals.goal) cards.push(LP.buildGoalCard(text));
  if (signals.compare) cards.push(LP.buildCompareCard(text));
  if (signals.translate) cards.push(LP.buildTranslateCard(text, opts.language));
  if (signals.timer) cards.push(LP.buildTimerCard(text));
  if (signals.note) cards.push(LP.buildNoteCard(text));

  if (signals.info && cards.length > 0) cards.push(LP.buildInfoCard(text));

  // --- Tier 2 / Tier 3 fallback ---
  // Only reaches here if NO signal card was built above.
  // The looksActionShaped guard is intentionally narrow — it must NOT steal
  // inputs like "I need an Uber to the airport" (signals.cab fires above).
  if (cards.length === 0) {
    const wordCount = text.trim().split(/\s+/).length;
    const looksActionShaped = /\b(need to|have to|should|must|want to|gonna|going to|plan to)\b/i.test(text);
    // Only clarify if VERY short (≤4 words) or action-shaped with no entities extracted
    if (wordCount <= 4 || (looksActionShaped && wordCount <= 6)) {
      return { tier: 2, primaryIntent: 'CLARIFY', cards: [], tree: null, text, tone };
    }
    const card = LP.buildOpenEndedCard(text);
    return { tier: 3, primaryIntent: 'INFO_SUMMARY', cards: [card], tree: LP.wrapTree([card]), text, tone };
  }

  return { tier: 1, primaryIntent: 'COMPOSITE', cards, tree: LP.wrapTree(cards), text, tone };
};

/* ---------------------------------------------------------------
   Plan tree wrapper (flat list -> simple tree structure per 1.3)
--------------------------------------------------------------- */

LP.wrapTree = function (cards) {
  return {
    id: LP.util.uid('tree'),
    children: cards.map(c => ({ id: c.id, type: c.type, title: c.title, children: [], dependsOn: null, permission: c.permission }))
  };
};

/* ---------------------------------------------------------------
   1.4 — Conditional node builder
--------------------------------------------------------------- */

LP.buildConditionalNode = function (cond, originalText) {
  const ifTrueCompose = LP.compose(cond.ifTrueText, { skipConditional: true });
  const ifFalseCompose = cond.ifFalseText ? LP.compose(cond.ifFalseText, { skipConditional: true }) : null;
  return {
    id: LP.util.uid(), type: 'CONDITIONAL', permission: 'auto',
    title: `If ${cond.condition.raw}…`,
    subtitle: cond.condition.check === 'weather' ? 'Checked against live weather data' : 'Checked against your input',
    condition: cond.condition,
    ifTrue: ifTrueCompose.cards,
    ifFalse: ifFalseCompose ? ifFalseCompose.cards : [],
    createdAt: Date.now()
  };
};

/* ---------------------------------------------------------------
   1.3 — Expansion spec -> real card (used by compound life events)
--------------------------------------------------------------- */

LP.buildCardFromExpansionSpec = function (spec, originalText) {
  const now = new Date();
  switch (spec.type) {
    case 'SCHEDULE': {
      const start = spec.date ? new Date(spec.date) : (() => { const d = new Date(now); d.setDate(d.getDate() + 7); d.setHours(10, 0, 0, 0); return d; })();
      const end = new Date(start.getTime() + 60 * 60000);
      return {
        id: LP.util.uid(), type: 'SCHEDULE', permission: 'auto',
        title: spec.title, subtitle: `${LP.util.formatDate(start)}${spec.needsClarify ? ' (estimated — tap to adjust)' : ''}`,
        start, end, gcalUrl: LP.util.gcalUrl({ title: spec.title, start, end, details: `Part of a multi-step plan from: "${originalText}"` }),
        createdAt: Date.now()
      };
    }
    case 'NAVIGATE':
      return LP.buildNavigateCard(`directions to ${spec.destination}`);
    case 'BUDGET_TRACK':
      return { id: LP.util.uid(), type: 'BUDGET_TRACK', permission: 'required', title: `Reserve ₹${spec.amount} — ${spec.label}`, subtitle: 'Sandbox only', amount: spec.amount, currency: spec.currency, label: spec.label, createdAt: Date.now() };
    case 'NOTIFY': {
      const message = `Hi ${spec.person}, ${spec.payload}`;
      return { id: LP.util.uid(), type: 'NOTIFY', permission: 'required', title: `Message ${spec.person}`, subtitle: 'Pre-written — nothing sends until you tap', person: spec.person, message, waUrl: LP.util.waUrl(message), smsUrl: LP.util.smsUrl(message), createdAt: Date.now() };
    }
    case 'REMIND': {
      const start = new Date(spec.date);
      return { id: LP.util.uid(), type: 'REMIND', permission: 'auto', title: spec.title, subtitle: `${LP.util.formatDate(start)}`, start, gcalUrl: LP.util.gcalUrl({ title: `Reminder: ${spec.title}`, start, end: new Date(start.getTime() + 30 * 60000) }), createdAt: Date.now() };
    }
    case 'INFO_SUMMARY':
      return LP.buildInfoCard(`explain ${spec.topic}`);
    default:
      return LP.buildInfoCard(originalText);
  }
};

/* ---------------------------------------------------------------
   Card builders — one per primitive. Each returns a plain object;
   rendering lives entirely in ui.js.
--------------------------------------------------------------- */

LP.buildEscalateCard = function (text) {
  return {
    id: LP.util.uid(), type: 'ESCALATE', permission: 'required',
    title: 'This looks urgent', subtitle: 'Get real help immediately — one tap',
    body: `LifePilot detected language suggesting a possible emergency. It cannot contact anyone for you — only you tapping the button below places a real call.`,
    telNumber: LP.emergencyNumber.number, telLabel: `Call ${LP.emergencyNumber.label}`,
    referenceLinks: [
      { label: 'St. John Ambulance — First Aid basics', url: 'https://www.sja.org.uk/get-advice/first-aid-advice/' },
      { label: 'WHO — Emergency care guidance', url: 'https://www.who.int/health-topics/emergency-care' }
    ],
    shareLocationText: 'I need help. This is my current situation — please call or come as soon as you can.',
    honestyNote: 'LifePilot has not contacted emergency services, a doctor, or anyone else. The tap is yours to make.',
    createdAt: Date.now()
  };
};

LP.buildHealthInfoCard = function (text) {
  const t = LP.util.lower(text);
  let guidance = 'General self-care guidance: rest, stay hydrated, and monitor your symptoms. This is not a diagnosis.';
  if (/fever/.test(t)) guidance = 'For a fever: rest, drink fluids, and monitor your temperature. Seek medical care if it exceeds 103°F (39.4°C), lasts more than 3 days, or comes with severe symptoms.';
  else if (/headache/.test(t)) guidance = 'For a routine headache: rest in a quiet, dark room, stay hydrated, and consider an over-the-counter pain reliever per the label. Seek care for a sudden, severe, "worst-ever" headache.';
  else if (/cough|cold|flu|sore throat/.test(t)) guidance = 'For cold/flu-like symptoms: rest, fluids, and over-the-counter symptom relief per label instructions. Seek care if breathing becomes difficult or symptoms worsen after a week.';
  else if (/anxious|anxiety|stress|depress/.test(t)) guidance = "What you're describing is worth taking seriously. Grounding techniques (slow breathing, naming 5 things you can see) can help in the moment — and talking to a counselor or doctor is a reasonable next step if this persists.";
  else if (/medication|medicine|dose|dosage/.test(t)) guidance = "LifePilot can't give dosing guidance. Please check the medication's label, ask a pharmacist, or call your doctor before taking or combining anything.";
  else if (/accident/.test(t)) guidance = 'If this was a minor accident: check yourself and others for injuries, move to safety if possible, and note down what happened while it\'s fresh. If anyone is seriously hurt, this needs immediate real help, not an app.';

  return {
    id: LP.util.uid(), type: 'HEALTH_INFO', permission: 'required',
    title: 'Health-related — needs your OK first', subtitle: "Nothing added to your calendar until you approve",
    body: guidance,
    suggestedFollowUp: { kind: 'REMIND', label: 'Add a reminder to check on this again in a few hours', time: (() => { const d = new Date(); d.setHours(d.getHours() + 4); return d; })() },
    createdAt: Date.now()
  };
};

LP.buildOpenEndedCard = function (text) {
  return {
    id: LP.util.uid(), type: 'INFO_SUMMARY', permission: 'auto', tier: 3,
    title: 'No action needed — just a thought', subtitle: 'Open-ended input',
    body: `That sounds like a lot to be sitting with. There's nothing to schedule or send here — sometimes naming how you feel is the useful part. If it would help, a short walk, writing down what's actually on your mind, or talking to someone you trust are all reasonable next steps. If this feeling is intense or persistent, consider talking to a counselor or doctor.`,
    softSuggestion: { kind: 'REMIND', label: 'Set a gentle check-in reminder for this evening', time: (() => { const d = new Date(); d.setHours(20, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); return d; })() },
    createdAt: Date.now()
  };
};

LP.buildInfoCard = function (text) {
  return { id: LP.util.uid(), type: 'INFO_SUMMARY', permission: 'auto', title: "Here's what you need to know", subtitle: 'Answered directly — nothing to schedule', body: LP.synthesizeInfoAnswer(text), createdAt: Date.now() };
};

LP.synthesizeInfoAnswer = function (text) {
  const t = LP.util.lower(text);
  const clean = text.replace(/^(explain|what is|what are|how does|how do|why does|why is|help me understand|define|solve|summarize|summarise)\s*/i, '').replace(/\?$/, '').trim();
  const kb = [
    { test: /photosynthesis/, ans: "Photosynthesis is how plants convert light energy into chemical energy. Chlorophyll in the leaves absorbs sunlight, which powers a reaction combining carbon dioxide (from air) and water (from roots) into glucose (the plant's food) and oxygen (released as a byproduct). It happens in two stages: light-dependent reactions in the thylakoid membrane that capture energy, and the Calvin cycle in the stroma that uses that energy to build sugar." },
    { test: /newton.*(second|2nd).*law|f\s?=\s?ma/, ans: "Newton's Second Law states that force equals mass times acceleration (F = ma). It means the acceleration of an object depends on two things: how much force is applied, and how much mass the object has. Push the same object harder, it accelerates more. Push a heavier object with the same force, it accelerates less." },
    { test: /mitosis/, ans: "Mitosis is how a single cell divides into two identical daughter cells. It runs through four main phases: prophase (chromosomes condense), metaphase (they line up in the middle), anaphase (they're pulled to opposite ends), and telophase (two new nuclei form). It's how your body grows and repairs tissue." },
    { test: /compound interest/, ans: 'Compound interest is interest calculated on both the original amount you invested (principal) and the interest that has already accumulated. That\'s different from simple interest, which only ever applies to the principal. Over time this creates exponential rather than linear growth — the formula is A = P(1 + r/n)^(nt), where P is principal, r is annual rate, n is compounding frequency per year, and t is years.' },
    { test: /supply and demand/, ans: 'Supply and demand describes how price is set in a market. When demand for something rises while supply stays fixed, prices tend to go up, because more people are competing for the same amount of stuff. When supply increases while demand stays fixed, prices tend to fall. The "equilibrium price" is where the amount sellers want to sell matches the amount buyers want to buy.' },
    { test: /osmosis/, ans: "Osmosis is the movement of water molecules across a semi-permeable membrane, from an area of lower solute concentration to an area of higher solute concentration, until both sides reach equilibrium. It's passive — no energy is spent — and it's how plant roots absorb water and how your cells stay properly hydrated." },
    { test: /pythagorean/, ans: "The Pythagorean theorem applies to right-angled triangles: the square of the hypotenuse (the longest side, opposite the right angle) equals the sum of the squares of the other two sides — a² + b² = c². It's used constantly in geometry, construction, and navigation to find an unknown side length." }
  ];
  for (const entry of kb) if (entry.test.test(t)) return entry.ans;
  return `Here's a working explanation of "${clean || text}": at its core, this is asking you to break a concept into its parts and see how they connect. Start by identifying the key terms involved, then figure out the relationship or process that links them — most "explain X" questions boil down to cause → mechanism → effect. If you tell LifePilot a bit more about which part is unclear (a definition, a formula, a real-world example), it can narrow the explanation further. For now: look at what each term literally means, trace the sequence of events or logic step by step, and connect it back to a concrete example you already know.`;
};

LP.buildScheduleCards = function (text) {
  let clauses = text.split(/,|\b(?:and then|then|and also|and)\b/i).map(s => s.trim()).filter(s => s.length > 3);
  const selfAnchoredCount = clauses.filter(c => LP.util.extractTime(c) || LP.util.extractDate(c)).length;
  if (selfAnchoredCount < 2) clauses = [text];

  const cards = [];
  const used = new Set();

  clauses.forEach((clause, idx) => {
    const time = LP.util.extractTime(clause) || LP.util.extractTime(text);
    const date = LP.util.extractDate(clause) || LP.util.extractDate(text) || new Date();
    const title = LP.deriveTitle(clause);
    if (used.has(title.toLowerCase())) return;
    used.add(title.toLowerCase());

    const start = new Date(date);
    if (time) start.setHours(time.h, time.min, 0, 0);
    else start.setHours(9 + idx, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const isRemind = /\bremind me\b/i.test(clause);
    cards.push({
      id: LP.util.uid(), type: isRemind ? 'REMIND' : 'SCHEDULE', permission: 'auto', title,
      subtitle: `${LP.util.formatDate(start)} · ${LP.util.formatTime(start.getHours(), start.getMinutes())}`,
      start, end, gcalUrl: LP.util.gcalUrl({ title, start, end, details: `Added automatically by LifePilot from: "${text}"` }),
      createdAt: Date.now()
    });
  });

  if (cards.length === 0) {
    const date = LP.util.extractDate(text) || new Date();
    const time = LP.util.extractTime(text);
    const start = new Date(date);
    if (time) start.setHours(time.h, time.min, 0, 0); else start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = LP.deriveTitle(text);
    cards.push({ id: LP.util.uid(), type: 'SCHEDULE', permission: 'auto', title, subtitle: `${LP.util.formatDate(start)} · ${LP.util.formatTime(start.getHours(), start.getMinutes())}`, start, end, gcalUrl: LP.util.gcalUrl({ title, start, end, details: `Added automatically by LifePilot from: "${text}"` }), createdAt: Date.now() });
  }
  return cards;
};

/* ---------------------------------------------------------------
   1.5 — Recurring event expansion
--------------------------------------------------------------- */

LP.buildRecurringCards = function (text, recurrence) {
  const time = LP.util.extractTime(text) || { h: 9, min: 0 };
  const title = LP.deriveTitle(text.replace(/\bevery\b.*$/i, '').trim() || text);
  const now = new Date();
  const occurrences = [];
  let cursor = new Date(now);
  let guard = 0;
  while (occurrences.length < recurrence.maxOccurrences && guard < 60) {
    guard++;
    if (recurrence.days.includes(cursor.getDay())) {
      const start = new Date(cursor);
      start.setHours(time.h, time.min, 0, 0);
      if (start > now) {
        occurrences.push(start);
      }
    }
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }

  const groupId = LP.util.uid('recur');
  return [{
    id: groupId, type: 'SCHEDULE', permission: 'auto', title,
    subtitle: `${occurrences.length} sessions scheduled — tap to expand`,
    isRecurringGroup: true,
    occurrences: occurrences.map(start => ({
      start, end: new Date(start.getTime() + 60 * 60000),
      gcalUrl: LP.util.gcalUrl({ title, start, end: new Date(start.getTime() + 60 * 60000), details: `Recurring — added by LifePilot from: "${text}"` })
    })),
    createdAt: Date.now()
  }];
};

LP.buildReminderCard = function (text) {
  const date = LP.util.extractDate(text) || new Date();
  const time = LP.util.extractTime(text);
  const start = new Date(date);
  if (time) start.setHours(time.h, time.min, 0, 0);
  else start.setHours(start.getHours() + 2, 0, 0, 0);
  const title = LP.deriveTitle(text.replace(/remind me( to)?/i, '').trim() || text);
  return { id: LP.util.uid(), type: 'REMIND', permission: 'auto', title, subtitle: `${LP.util.formatDate(start)} · ${LP.util.formatTime(start.getHours(), start.getMinutes())}`, start, gcalUrl: LP.util.gcalUrl({ title: `Reminder: ${title}`, start, end: new Date(start.getTime() + 30 * 60000), details: `Added automatically by LifePilot from: "${text}"` }), createdAt: Date.now() };
};

LP.buildNavigateCard = function (text) {
  const dest = LP.util.extractLocation(text) || 'destination';
  return { id: LP.util.uid(), type: 'NAVIGATE', permission: 'auto', title: `Directions to ${dest}`, subtitle: 'Opens in Google Maps', destination: dest, mapsUrl: LP.util.mapsUrl(dest), createdAt: Date.now() };
};

LP.buildNotifyCard = function (text) {
  const person = LP.util.extractPerson(text) || 'them';
  const message = LP.composeMessage(text, person);
  return { id: LP.util.uid(), type: 'NOTIFY', permission: 'required', title: `Message ${person}`, subtitle: 'Pre-written — nothing sends until you tap', person, message, waUrl: LP.util.waUrl(message), smsUrl: LP.util.smsUrl(message), mailtoUrl: LP.util.mailtoUrl(`Message from LifePilot`, message), createdAt: Date.now() };
};

LP.composeMessage = function (text, person) {
  let payload = text.replace(/^.*?\b(?:tell|message|notify|text|whatsapp|ask|let|call)\s+(?:my\s+)?[A-Za-z]+\s*(that|to)?\s*/i, '').trim();
  if (!payload) payload = text;
  payload = payload.charAt(0).toUpperCase() + payload.slice(1);
  if (!/[.!?]$/.test(payload)) payload += '.';
  return `Hi ${person}, ${payload}`;
};

LP.buildBudgetCard = function (text) {
  const amt = LP.util.extractAmount(text) || { value: 0, currency: 'INR' };
  const title = LP.deriveTitle(text);
  return { id: LP.util.uid(), type: 'BUDGET_TRACK', permission: 'required', title: `Track ${amt.currency === 'USD' ? '$' : '₹'}${amt.value || '—'} for "${title}"`, subtitle: 'Sandbox only — no real money moves', amount: amt.value, currency: amt.currency, label: title, createdAt: Date.now() };
};

LP.buildPayCard = function (text) {
  const amt = LP.util.extractAmount(text) || { value: 0, currency: 'INR' };
  const person = LP.util.extractPerson(text) || 'recipient';
  return { id: LP.util.uid(), type: 'PAY', permission: 'required', title: `Pay ₹${amt.value} to ${person}`, subtitle: 'UPI sandbox link — no real money moves in this prototype', amount: amt.value, person, upiUrl: LP.util.upiUrl({ name: person, amount: amt.value }), createdAt: Date.now() };
};

LP.buildCabCard = function (text) {
  const dest = LP.util.extractLocation(text) || 'your destination';
  return { id: LP.util.uid(), type: 'CAB', permission: 'auto', title: `Book Uber to ${dest}`, subtitle: 'Opening Uber automatically...', destination: dest, uberUrl: LP.util.uberUrl(dest), createdAt: Date.now() };
};

LP.buildMusicCard = function (text) {
  let query = 'focus music';
  if (/lofi/i.test(text)) query = 'lofi beats';
  else if (/focus/i.test(text)) query = 'focus music';
  return { id: LP.util.uid(), type: 'MUSIC', permission: 'auto', title: `Play "${query}"`, subtitle: 'Opens in Spotify', spotifyUrl: LP.util.spotifyUrl(query), createdAt: Date.now() };
};

LP.buildSearchCard = function (text) {
  const query = text.replace(/^(search for|look up|find out about|google)\s*/i, '').trim() || text;
  return { id: LP.util.uid(), type: 'SEARCH_WEB', permission: 'auto', title: `Search: ${query}`, subtitle: 'Opens Google Search', query, searchUrl: LP.util.searchUrl(query), youtubeUrl: LP.util.youtubeUrl(query), createdAt: Date.now() };
};

LP.buildDocCard = function (text) {
  const title = LP.deriveTitle(text.replace(/^(write a document|create a document|draft a document|make notes on|write up)\s*(about|on)?\s*/i, '')) || 'New document';
  return { id: LP.util.uid(), type: 'GENERATE_DOC', permission: 'auto', title: `Document: ${title}`, subtitle: 'Preview below — opens Google Docs to save', content: `# ${title}\n\n${LP.synthesizeInfoAnswer(text)}`, gdocsUrl: LP.util.gdocsUrl(title), createdAt: Date.now() };
};

LP.buildHabitCard = function (text) {
  const title = LP.deriveTitle(text.replace(/^(track my|log my habit|i did)\s*/i, '')) || 'Habit';
  return { id: LP.util.uid(), type: 'TRACK_HABIT', permission: 'auto', title, subtitle: 'Logged today', loggedDates: [new Date().toDateString()], createdAt: Date.now() };
};

LP.buildGoalCard = function (text) {
  const title = LP.deriveTitle(text.replace(/^(my goal is|i want to achieve|set a goal)\s*(to|of)?\s*/i, '')) || 'New goal';
  return { id: LP.util.uid(), type: 'SET_GOAL', permission: 'auto', title, subtitle: '0% complete', progress: 0, milestones: [25, 50, 75, 100], createdAt: Date.now() };
};

LP.buildCompareCard = function (text) {
  const parts = text.split(/\bvs\.?\b|\bversus\b|\bor\b/i).map(s => s.trim()).filter(Boolean);
  const optionA = parts[0] ? LP.deriveTitle(parts[0].replace(/^compare\s*/i, '')) : 'Option A';
  const optionB = parts[1] ? LP.deriveTitle(parts[1]) : 'Option B';
  return { id: LP.util.uid(), type: 'COMPARE', permission: 'auto', title: `${optionA} vs ${optionB}`, subtitle: 'Quick comparison', optionA, optionB, createdAt: Date.now() };
};

LP.buildTranslateCard = function (text, uiLang) {
  const target = /tamil/i.test(text) ? 'ta' : /hindi/i.test(text) ? 'hi' : (uiLang === 'ta' ? 'ta' : 'en');
  const payload = text.replace(/^(translate|how do you say|in tamil|in hindi)\s*/i, '').trim() || text;
  return { id: LP.util.uid(), type: 'TRANSLATE', permission: 'auto', title: `Translate: "${payload}"`, subtitle: `Opens Google Translate`, sourceText: payload, targetLang: target, translateUrl: LP.util.translateUrl(payload, target), createdAt: Date.now() };
};

LP.buildTimerCard = function (text) {
  const m = text.match(/(\d+)\s*min/i);
  const minutes = m ? parseInt(m[1], 10) : (/pomodoro/i.test(text) ? 25 : 10);
  return { id: LP.util.uid(), type: 'TIMER', permission: 'auto', title: `${minutes}-minute timer`, subtitle: 'Starts immediately', minutes, createdAt: Date.now() };
};

LP.buildNoteCard = function (text) {
  const payload = text.replace(/^(note that|save this note|jot down|remember that)\s*/i, '').trim() || text;
  return { id: LP.util.uid(), type: 'CAPTURE_NOTE', permission: 'auto', title: 'Note saved', subtitle: new Date().toLocaleString(), content: payload, createdAt: Date.now() };
};

LP.deriveTitle = function (clause) {
  let c = clause.trim();
  c = c.replace(/^(book|schedule|add|set up|arrange|plan)\s+/i, '');
  c = c.replace(/^(i\s+have|i've got|i have got|we have)\s+/i, '');
  c = c.replace(/^(a|an|the)\s+/i, '');
  c = c.replace(/\b(at|on)\s+\d.*$/i, '').trim();
  c = c.replace(/\btomorrow\b|\btoday\b/gi, '').trim();
  c = c.replace(/\s+/g, ' ').replace(/,$/, '').trim();
  if (c.length > 60) c = c.slice(0, 60) + '…';
  if (!c) c = 'Untitled event';
  return c.charAt(0).toUpperCase() + c.slice(1);
};

/* ---------------------------------------------------------------
   Trip planning composite (mocked dataset, full auto flow)
--------------------------------------------------------------- */

LP.mockTripOptions = [
  { mode: 'Train', name: 'Shatabdi Express', price: 1200, durationHrs: 5, comfort: 4 },
  { mode: 'Flight', name: 'IndiGo 6E-204', price: 4200, durationHrs: 1.5, comfort: 5 },
  { mode: 'Bus', name: 'VRL Sleeper Coach', price: 800, durationHrs: 9, comfort: 2 },
  { mode: 'Train', name: 'Rajdhani Express', price: 2200, durationHrs: 6, comfort: 4 }
];

LP.mockHotels = [
  { name: 'City Comfort Inn', pricePerNight: 1800, rating: 4.1 },
  { name: 'Budget Stay Lodge', pricePerNight: 900, rating: 3.6 },
  { name: 'Grand Plaza Hotel', pricePerNight: 3500, rating: 4.6 }
];

LP.buildTripPlan = function (text) {
  const dest = LP.util.extractLocation(text) || 'your destination';
  const date = LP.util.extractDate(text) || (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })();
  const budget = LP.util.extractAmount(text);
  const cards = [];

  const budgetVal = budget ? budget.value : 5000;
  const affordable = LP.mockTripOptions.filter(o => o.price <= budgetVal * 0.6).sort((a, b) => b.comfort - a.comfort);
  const chosenTransport = affordable[0] || LP.mockTripOptions.slice().sort((a, b) => a.price - b.price)[0];

  const affordableHotels = LP.mockHotels.filter(h => h.pricePerNight <= budgetVal * 0.3).sort((a, b) => b.rating - a.rating);
  const chosenHotel = affordableHotels[0] || LP.mockHotels.slice().sort((a, b) => a.pricePerNight - b.pricePerNight)[0];

  const start = new Date(date); start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + chosenTransport.durationHrs * 3600000);

  cards.push({
    id: LP.util.uid(), type: 'SCHEDULE', permission: 'auto', title: `${chosenTransport.mode} to ${dest} — ${chosenTransport.name}`,
    subtitle: `${LP.util.formatDate(start)} · ${LP.util.formatTime(9, 0)} · Selected automatically from ${LP.mockTripOptions.length} mocked options (best comfort within 60% of budget)`,
    start, end, gcalUrl: LP.util.gcalUrl({ title: `${chosenTransport.mode} to ${dest} (${chosenTransport.name})`, start, end, location: dest, details: `Auto-booked in sandbox by LifePilot. Price: ₹${chosenTransport.price}. From: "${text}"` }),
    tripMeta: { kind: 'transport', chosen: chosenTransport, allOptions: LP.mockTripOptions }, createdAt: Date.now()
  });

  cards.push({
    id: LP.util.uid(), type: 'SCHEDULE', permission: 'auto', title: `Stay at ${chosenHotel.name}, ${dest}`,
    subtitle: `Check-in ${LP.util.formatDate(start)} · Selected automatically (best rating within budget)`,
    start, end: new Date(start.getTime() + 24 * 3600000),
    gcalUrl: LP.util.gcalUrl({ title: `Hotel: ${chosenHotel.name}`, start, end: new Date(start.getTime() + 24 * 3600000), location: dest, details: `Auto-booked in sandbox. ₹${chosenHotel.pricePerNight}/night. From: "${text}"` }),
    tripMeta: { kind: 'hotel', chosen: chosenHotel, allOptions: LP.mockHotels }, createdAt: Date.now()
  });

  cards.push(LP.buildNavigateCard(`directions to ${dest}`));

  const totalCost = chosenTransport.price + chosenHotel.pricePerNight;
  cards.push({
    id: LP.util.uid(), type: 'BUDGET_TRACK', permission: 'required', title: `Reserve ₹${totalCost} for ${dest} trip`,
    subtitle: `Sandbox only — transport ₹${chosenTransport.price} + stay ₹${chosenHotel.pricePerNight}/night`,
    amount: totalCost, currency: 'INR', label: `${dest} trip`, createdAt: Date.now()
  });

  return cards;
};
