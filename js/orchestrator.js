/* ============================================================
   LifePilot — Layer 1: COGNITION
   The general reasoning engine. ONE classifier. No topic branches.
   Everything below reasons about verb shape, entities, and stakes.
   Domain vocabulary (travel words, health words, etc.) is DATA in
   LP.vocab — never a new if/else branch.
   ============================================================ */

const LP = {};

/* ---------------------------------------------------------------
   1.0 — Shared utilities (date/time/amount/person/location parsing,
   deep-link builders). Pure functions, no side effects.
--------------------------------------------------------------- */

LP.util = {
  lower(s) { return (s || '').toLowerCase(); },

  /* ---------------------------------------------------------------
     7.1 — Typo Normalizer. DATA-driven (a lookup map), applied as a
     word-boundary pass before classification/crisis-matching so a
     rushed or panicked typist ("hlp", "emrgancy") still routes
     correctly. Never rewrites text shown back to the user — only
     the copy handed to the classifiers.
  --------------------------------------------------------------- */
  TYPO_MAP: {
    'hlp': 'help', 'plz': 'please', 'pls': 'please', 'peblm': 'problem',
    'problm': 'problem', 'emrgancy': 'emergency', 'emergancy': 'emergency',
    'emergecy': 'emergency', 'urgnt': 'urgent', 'asp': 'asap',
    'helpp': 'help', 'saftey': 'safety', 'safty': 'safety',
    'attak': 'attack', 'atack': 'attack', 'accdent': 'accident',
    'acident': 'accident', 'unconcious': 'unconscious', 'unconsious': 'unconscious',
    'suicdal': 'suicidal', 'ambulence': 'ambulance', 'hospitl': 'hospital',
    'polica': 'police', 'polce': 'police', 'stalkin': 'stalking',
    'harrassed': 'harassed', 'harrassment': 'harassment', 'domesic': 'domestic'
  },

  normalizeTypos(text) {
    if (!text) return text;
    return text.replace(/[A-Za-z']+/g, (word) => {
      const key = word.toLowerCase();
      const fix = LP.util.TYPO_MAP[key];
      if (!fix) return word;
      // Preserve simple capitalization of the original word.
      if (word[0] === word[0].toUpperCase()) return fix[0].toUpperCase() + fix.slice(1);
      return fix;
    });
  },

  extractTime(text) {
    // Don't treat a bare number immediately followed by a duration unit as a clock
    // time — "20 minutes" is a duration, not 8:00pm.
    const durationGuard = /\b(\d{1,2})\s*(?:min(?:ute)?s?|hrs?|hours?)\b/i;
    // Require :mm, am/pm, or explicit time prepositions (at, around, by) for bare numbers
    const timePrepGuard = /\b(?:at|around|by)\s+(\d{1,2})\b/i;
    const re = /\b([01]?\d|2[0-3])(?::([0-5]\d))?\s?(am|pm)?\b/i;
    const m = text.match(re);
    if (!m) return null;

    const hasColon = !!m[2];
    const hasAmPm = !!m[3];
    const hasTimePrep = timePrepGuard.test(text);

    // Bare numbers without :mm, am/pm, or 'at/around/by' are NOT clock times (e.g. iPhone 15, S24)
    if (!hasColon && !hasAmPm && !hasTimePrep) return null;

    if (durationGuard.test(text) && durationGuard.exec(text)[1] === m[1] && !hasAmPm && !hasColon) return null;
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3] ? m[3].toLowerCase() : null;
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    if (!ap && h < 7) h += 12;
    return { h, min };
  },

  extractDate(text, baseDate) {
    const now = baseDate ? new Date(baseDate) : new Date();
    const t = text.toLowerCase();
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

    if (/\btoday\b/.test(t)) return new Date(now);
    if (/\btomorrow\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 1); return d; }
    if (/\bday after tomorrow\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 2); return d; }

    for (let i = 0; i < dayNames.length; i++) {
      if (t.includes(dayNames[i])) {
        const d = new Date(now);
        let diff = (i - d.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        d.setDate(d.getDate() + diff);
        return d;
      }
    }
    const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const mdRe = /\b(\d{1,2})(st|nd|rd|th)?\s+(of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th)?\b/i;
    const m = t.match(mdRe);
    if (m) {
      let day, monIdx;
      if (m[1] && m[4]) { day = parseInt(m[1], 10); monIdx = monthNames.indexOf(m[4].toLowerCase()); }
      else { day = parseInt(m[6], 10); monIdx = monthNames.indexOf(m[5].toLowerCase()); }
      const d = new Date(now.getFullYear(), monIdx, day);
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
    const relRe = /\bin\s+(\d+)\s+(day|days|week|weeks|hour|hours|month|months)\b/i;
    const relM = t.match(relRe);
    if (relM) {
      const n = parseInt(relM[1], 10);
      const unit = relM[2];
      const d = new Date(now);
      if (unit.startsWith('day')) d.setDate(d.getDate() + n);
      else if (unit.startsWith('week')) d.setDate(d.getDate() + n * 7);
      else if (unit.startsWith('hour')) d.setHours(d.getHours() + n);
      else if (unit.startsWith('month')) d.setMonth(d.getMonth() + n);
      return d;
    }
    // "next month" / "next week"
    if (/\bnext month\b/.test(t)) { const d = new Date(now); d.setMonth(d.getMonth() + 1); return d; }
    if (/\bnext week\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 7); return d; }
    return null;
  },

  // "2 days before my exam" / "the morning after I arrive" style relative-to-event parsing.
  // Returns { offsetDays, anchorPhrase } or null. Actual anchor resolution happens by the
  // caller once the anchor event's date is known (used by decomposition, section 1.3/1.5).
  extractRelativeToEvent(text) {
    const t = text.toLowerCase();
    const before = t.match(/\b(\d+)\s+(day|days|week|weeks)\s+before\s+(?:my\s+|the\s+)?([a-z][a-z\s]{2,30})/i);
    if (before) {
      const n = parseInt(before[1], 10);
      const unit = before[2];
      const days = unit.startsWith('week') ? n * 7 : n;
      return { offsetDays: -days, anchorPhrase: before[3].trim() };
    }
    const after = t.match(/\b(?:the\s+)?(morning|day|evening)\s+after\s+(?:i\s+|my\s+)?([a-z][a-z\s]{2,30})/i);
    if (after) {
      return { offsetDays: 1, anchorPhrase: after[2].trim() };
    }
    return null;
  },

  // "every Monday and Thursday at 6pm" / "daily at 8am for 2 weeks" -> recurrence spec
  extractRecurrence(text) {
    const t = text.toLowerCase();
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const everyMatch = t.match(/\bevery\s+([a-z,\s]+?)(?:\s+at\s+|\s+for\s+|$)/i);
    const dailyMatch = /\bdaily\b/.test(t);
    if (!everyMatch && !dailyMatch) return null;

    let days = [];
    if (dailyMatch || /\bevery day\b/.test(t)) {
      days = [0, 1, 2, 3, 4, 5, 6];
    } else if (everyMatch) {
      dayNames.forEach((name, idx) => { if (everyMatch[1].includes(name)) days.push(idx); });
      if (days.length === 0) return null; // "every hour" etc, not a weekday recurrence we handle
    }

    const durationMatch = t.match(/\bfor\s+(\d+)\s+(day|days|week|weeks)\b/);
    let maxOccurrences = 30;
    if (durationMatch) {
      const n = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2];
      const totalDays = unit.startsWith('week') ? n * 7 : n;
      maxOccurrences = Math.min(30, Math.ceil(totalDays / 7) * days.length || totalDays);
    }
    return { days, maxOccurrences: Math.min(maxOccurrences, 30) };
  },

  extractAmount(text) {
    const re = /(?:₹|rs\.?|inr)\s?([\d,]+(?:\.\d+)?)|(?:\$)\s?([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s?(?:rupees|rs|dollars|usd|bucks)/i;
    const m = text.match(re);
    if (!m) return null;
    const raw = m[1] || m[2] || m[3];
    const val = parseFloat(raw.replace(/,/g, ''));
    const currency = /\$|dollars|usd|bucks/i.test(m[0]) ? 'USD' : 'INR';
    return { value: val, currency };
  },

  extractLocation(text) {
    const re = /\b(?:to|in|at|near|from)\s+([A-Z][a-zA-Z\s]{2,30}?)(?:[,.]|\s+(?:on|by|for|at|this|next|tomorrow|today)\b|$)/;
    const m = text.match(re);
    if (m) return m[1].trim();
    return null;
  },

  extractPerson(text) {
    const rel = text.match(/\b(?:tell|message|notify|text|whatsapp|ask|let|call|pay)\s+my\s+(mom|mother|dad|father|sister|brother|wife|husband|boss|manager|friend|roommate|teacher|doctor|colleague|coworker|landlord)\b/i);
    if (rel) return rel[1].charAt(0).toUpperCase() + rel[1].slice(1);
    const re = /\b(?:tell|message|notify|text|whatsapp|ask|let|call|pay)\s+([A-Z][a-zA-Z]{1,20})\b/i;
    const m = text.match(re);
    if (m) return m[1];
    return null;
  },

  formatDate(d) {
    if (!d) return null;
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  },

  formatTime(h, min) {
    const ap = h >= 12 ? 'PM' : 'AM';
    let hh = h % 12; if (hh === 0) hh = 12;
    return `${hh}:${String(min).padStart(2, '0')} ${ap}`;
  },

  gcalUrl({ title, start, end, details, location }) {
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: details || '',
      location: location || ''
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },

  mapsUrl(destination) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  },

  waUrl(message, phone) { return `https://wa.me/${phone ? phone.replace(/[^\d]/g, '') : ''}?text=${encodeURIComponent(message)}`; },
  smsUrl(message, phone) { return `sms:${phone || ''}?body=${encodeURIComponent(message)}`; },
  telUrl(number) { return `tel:${number}`; },
  mailtoUrl(subject, bodyText) { return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`; },
  searchUrl(query) { return `https://www.google.com/search?q=${encodeURIComponent(query)}`; },
  youtubeUrl(query) { return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`; },
  translateUrl(text, targetLang) { return `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}`; },
  gdocsUrl(title) { return `https://docs.google.com/document/create?title=${encodeURIComponent(title)}`; },
  spotifyUrl(query) { return `https://open.spotify.com/search/${encodeURIComponent(query)}`; },
  uberUrl() { return `https://m.uber.com/ul/?action=setPickup&pickup=my_location`; },
  upiUrl({ vpa, name, amount }) { return `upi://pay?pa=${encodeURIComponent(vpa || 'demo@upi')}&pn=${encodeURIComponent(name || 'Recipient')}&am=${amount}&cu=INR`; },

  uid(prefix) { return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
};

/* ---------------------------------------------------------------
   1.1 — Vocabulary packs (DATA, not code branches)
--------------------------------------------------------------- */

LP.vocab = {
  scheduleVerbs: ['book', 'schedule', 'plan a trip', 'plan my', 'add', 'set up', 'arrange', 'flight', 'train', 'hotel', 'class', 'meeting', 'appointment', 'session', 'exam', 'lecture', 'checkup', 'visit'],
  remindVerbs: ['remind me', "don't let me forget", 'nudge me', 'ping me', 'wake me', 'remind'],
  navigateVerbs: ['directions to', 'navigate to', 'how do i get to', 'route to', 'way to', 'take me to', 'navigate', 'directions'],
  notifyVerbs: ['tell', 'message', 'notify', 'text', 'whatsapp', 'let', 'inform', 'email'],
  callVerbs: ['call'],
  budgetVerbs: ['budget', 'spent', 'spend', 'save up', 'set aside', 'track spending', 'cost', 'expense', 'log this expense', 'i spent'],
  infoVerbs: ['explain', 'what is', 'what are', 'how does', 'how do', 'why does', 'why is', 'help me understand', 'define', 'difference between', 'derive', 'solve', 'summarize', 'summarise'],
  searchVerbs: ['search for', 'look up', 'find out about', 'google', 'find', 'search'],
  docVerbs: ['write a document', 'create a document', 'draft a document', 'make notes on', 'write up', 'save this'],
  habitVerbs: ['track my', 'log my habit', 'i did', 'streak', 'log my', 'finished my', 'just finished'],
  goalVerbs: ['my goal is', 'i want to achieve', 'set a goal', 'i want to', 'my goal'],
  compareVerbs: ['compare', 'vs', 'versus', 'which is better'],
  translateVerbs: ['translate', 'how do you say', 'in tamil', 'in hindi'],
  timerVerbs: ['start a timer', 'set a timer', 'pomodoro', 'countdown', 'timer'],
  noteVerbs: ['note that', 'save this note', 'jot down', 'remember that', 'save this'],
  payVerbs: ['pay', 'send money', 'upi'],
  cabVerbs: ['book a cab', 'call a cab', 'book an uber', 'get me a ride', 'uber', 'cab', 'taxi', 'need a cab', 'need an uber', 'get me a cab', 'get me an uber', 'drive to', 'book a ride', 'i need an uber', 'need an uber to', 'i need a cab', 'need a cab to', 'get me an uber to', 'order an uber', 'order a cab', 'call me a cab', 'hail a cab', 'request a ride', 'get a ride to', 'need a ride to', 'i need a ride', 'get me to', 'drop me to', 'drop me at', 'take me to', 'take me', 'book ola', 'book rapido', 'ola', 'rapido', 'auto rickshaw'],
  musicVerbs: ['play music', 'play focus music', 'play lofi', 'play some music', 'play some lofi', 'play lofi beats', 'play a playlist'],
  healthTerms: ['fever', 'headache', 'pain', 'hurts', 'medicine', 'medication', 'dose', 'dosage', 'symptom', 'symptoms', 'nausea', 'vomit', 'cough', 'cold', 'flu', 'rash', 'allergy', 'anxious', 'anxiety', 'depressed', 'depression', 'sick', 'unwell', 'injury', 'injured', 'sprain', 'cut', 'bleeding', 'dizzy', 'chest pain', 'stomach ache', 'sore throat', "not feeling well", "don't feel well", 'accident'],
  emergencyTerms: ['emergency', 'help me now', "can't breathe", 'cannot breathe', 'chest pain', 'heart attack', 'stroke', 'unconscious', 'suicidal', 'suicide', 'kill myself', 'overdose', 'severe bleeding', 'fire', 'choking', 'seizure', 'not breathing', 'call 911', 'call ambulance', 'emergency room'],
  openEndedMoods: ['feeling stressed', 'feeling overwhelmed', 'feeling sad', 'feeling lost', 'feeling anxious', 'feeling tired', "don't know what to do", 'having a rough day', 'having a bad day', "i'm stressed", 'i am stressed', 'feeling low', 'feeling down', 'burnt out', 'burned out', 'stressed about', 'stressed out'],
  conditionalKeywords: ['if ', 'unless ', 'only if ', 'in case ', 'otherwise', ' instead', ' else '],
  urgencyHigh: ['urgent', 'asap', 'right now', 'immediately', 'hurry'],
  urgencyCritical: ['emergency', "can't breathe", 'cannot breathe', 'help me now'],
  emotionStressed: ['stressed', 'overwhelmed', 'anxious', 'panic'],
  emotionExcited: ['excited', "can't wait", 'awesome', 'thrilled'],
  emotionSad: ['sad', 'down', 'low', 'depressed', 'upset'],
  emotionAngry: ['angry', 'furious', 'pissed', 'mad'],
  emotionScared: ['scared', 'afraid', 'terrified', 'frightened'],

  // Multi-step expansion templates keyed by trigger phrase, per section 1.3.
  // DATA, not branches: adding a new compound-life-event just means adding a key here.
  expansions: {
    'moving to': (text) => {
      const dest = LP.util.extractLocation(text) || 'the new city';
      const date = LP.util.extractDate(text) || (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();
      return [
        { type: 'SCHEDULE', title: `Book movers for move to ${dest}`, needsClarify: true, clarifyField: 'date' },
        { type: 'SCHEDULE', title: 'Cancel current lease (30-day notice)', date: (() => { const d = new Date(date); d.setDate(d.getDate() - 30); return d; })() },
        { type: 'NAVIGATE', destination: dest },
        { type: 'BUDGET_TRACK', label: 'Estimated moving costs', amount: 15000, currency: 'INR' },
        { type: 'NOTIFY', person: 'Landlord', payload: `I'm moving out and wanted to give notice — planning to move around ${LP.util.formatDate(date)}.` },
        { type: 'REMIND', title: 'Update address on documents', date: (() => { const d = new Date(date); d.setDate(d.getDate() + 3); return d; })() },
        { type: 'INFO_SUMMARY', topic: `best neighborhoods in ${dest}` }
      ];
    }
  }
};

LP.emergencyNumber = { country: 'India', number: '112', label: 'India National Emergency Number (112)' };

/* ---------------------------------------------------------------
   1.2 — Emotional Tone Analysis (keyword-based, not full ML)
--------------------------------------------------------------- */

LP.analyzeTone = function (rawText) {
  const t = LP.util.lower(rawText);
  const has = (arr) => arr.some(w => t.includes(w));

  let urgency = 'low';
  if (has(LP.vocab.urgencyCritical)) urgency = 'critical';
  else if (has(LP.vocab.urgencyHigh)) urgency = 'high';
  else if (/\btoday\b|\bsoon\b/.test(t)) urgency = 'medium';

  const hasCaps = /[A-Z]{4,}/.test(rawText);
  const hasExclaim = /!{1,}/.test(rawText);
  if ((hasCaps || hasExclaim) && urgency !== 'critical') {
    const order = ['low', 'medium', 'high', 'critical'];
    urgency = order[Math.min(order.indexOf(urgency) + 1, 3)];
  }

  let emotion = 'neutral';
  if (has(LP.vocab.emotionStressed)) emotion = 'stressed';
  else if (has(LP.vocab.emotionExcited)) emotion = 'excited';
  else if (has(LP.vocab.emotionSad)) emotion = 'sad';
  else if (has(LP.vocab.emotionAngry)) emotion = 'angry';
  else if (has(LP.vocab.emotionScared)) emotion = 'scared';

  const signalCount = [urgency !== 'low', emotion !== 'neutral'].filter(Boolean).length;
  const confidence = 0.5 + signalCount * 0.2;

  return { urgency, emotion, confidence: Math.min(confidence, 0.95) };
};

/* ---------------------------------------------------------------
   1.4 — Conditional Logic Detection
--------------------------------------------------------------- */

LP.detectConditional = function (text) {
  const t = text.toLowerCase();
  // "If X, Y [instead of/otherwise Z]"
  const ifMatch = text.match(/^\s*if\s+(.+?),\s*(.+?)(?:\s+instead(?:\s+of\s+.+)?|,?\s*otherwise\s+(.+))?\.?\s*$/i);
  if (ifMatch) {
    const conditionText = ifMatch[1].trim();
    const consequentText = ifMatch[2].trim();
    const alternativeText = ifMatch[3] ? ifMatch[3].trim() : null;

    let check = 'custom', operator = 'contains', value = conditionText;
    if (/\brain(s|ing)?\b/i.test(conditionText)) { check = 'weather'; operator = 'equals'; value = 'rain'; }
    else if (/\b(cost|price|more than|less than|₹|\$)\b/i.test(conditionText)) {
      check = 'price';
      const gtM = conditionText.match(/more than\s+(?:₹|\$)?\s?([\d,]+)/i);
      const ltM = conditionText.match(/less than\s+(?:₹|\$)?\s?([\d,]+)/i);
      if (gtM) { operator = 'gt'; value = parseFloat(gtM[1].replace(/,/g, '')); }
      else if (ltM) { operator = 'lt'; value = parseFloat(ltM[1].replace(/,/g, '')); }
    }

    return {
      type: 'CONDITIONAL',
      condition: { check, operator, value, source: check === 'weather' ? 'weather_api' : 'user_input', raw: conditionText },
      ifTrueText: consequentText,
      ifFalseText: alternativeText
    };
  }

  // "X only if Y"
  const onlyIfMatch = text.match(/^(.+?)\s+only if\s+(.+?)\.?\s*$/i);
  if (onlyIfMatch) {
    const consequentText = onlyIfMatch[1].trim();
    const conditionText = onlyIfMatch[2].trim();
    let check = 'custom', operator = 'contains', value = conditionText;
    if (/\brain(s|ing)?\b/i.test(conditionText)) { check = 'weather'; operator = 'equals'; value = 'rain'; }
    return {
      type: 'CONDITIONAL',
      condition: { check, operator, value, source: check === 'weather' ? 'weather_api' : 'user_input', raw: conditionText },
      ifTrueText: consequentText,
      ifFalseText: null
    };
  }

  return null;
};

/* ---------------------------------------------------------------
   1.6 — Tiered classification. This is the single general reasoner.
--------------------------------------------------------------- */

LP.classify = function (rawText) {
  const text = LP.util.normalizeTypos(rawText.trim());
  const t = LP.util.lower(text);
  const has = (arr) => arr.some(w => t.includes(w));

  const notifySignal = (has(LP.vocab.notifyVerbs) || has(LP.vocab.callVerbs)) && !!LP.util.extractPerson(text);
  const isNotifyLed = /^\s*(?:tell|message|notify|text|whatsapp|ask|let|call)\s+[A-Za-z]+/i.test(text);
  const isInfoLed = /^\s*(explain|what is|what are|how does|how do|why does|why is|help me understand|define|difference between|derive|solve|summarize|summarise)\b/i.test(text) || /\?$/.test(text.trim());
  // Robust mood detector: "feeling (adverb)? MOOD_WORD", "I'm/I am (adverb)? MOOD_WORD",
  // or a fixed phrase like "having a rough day" / "burnt out" — catches variations like
  // "feeling really stressed" that a brittle exact-phrase list would miss.
  const moodWords = 'stressed|overwhelmed|sad|lost|anxious|tired|low|down|burnt out|burned out|depressed|drained|exhausted';
  const isOpenEndedMood = new RegExp(`\\b(?:feeling|i'?m|i am)\\s+(?:so\\s+|really\\s+|quite\\s+|kind of\\s+|a bit\\s+)?(?:${moodWords})\\b`, 'i').test(text)
    || has(LP.vocab.openEndedMoods);
  const isTimerLed = /^\s*(?:set|start)\s+a\s+timer\b/i.test(text) || /\bpomodoro\b/i.test(text);

  const hasExplicitScheduleVerb = has(LP.vocab.scheduleVerbs) || /\b(schedule|book|meeting|appointment|flight|train|hotel|reservation|event|slot)\b/i.test(t);
  const isActionLed = has(LP.vocab.remindVerbs) || has(LP.vocab.budgetVerbs) || has(LP.vocab.habitVerbs) || has(LP.vocab.goalVerbs) || has(LP.vocab.noteVerbs) || has(LP.vocab.compareVerbs) || has(LP.vocab.translateVerbs) || has(LP.vocab.timerVerbs) || has(LP.vocab.cabVerbs) || has(LP.vocab.musicVerbs) || isNotifyLed;

  const signals = {
    health: has(LP.vocab.healthTerms) && !isActionLed,
    emergency: has(LP.vocab.emergencyTerms),
    schedule: !isNotifyLed && !isInfoLed && !isOpenEndedMood && !isTimerLed && (
      hasExplicitScheduleVerb ||
      (/\b(at|on)\s+\d/.test(t) && !isActionLed) ||
      (!!LP.util.extractTime(t) && !isActionLed) ||
      (!!LP.util.extractDate(t) && hasExplicitScheduleVerb)
    ),
    remind: has(LP.vocab.remindVerbs),
    navigate: has(LP.vocab.navigateVerbs),
    notify: notifySignal,
    budget: has(LP.vocab.budgetVerbs) || !!LP.util.extractAmount(text),
    info: has(LP.vocab.infoVerbs) || /\?$/.test(text.trim()),
    search: has(LP.vocab.searchVerbs),
    doc: has(LP.vocab.docVerbs),
    habit: has(LP.vocab.habitVerbs),
    goal: has(LP.vocab.goalVerbs),
    compare: has(LP.vocab.compareVerbs),
    translate: has(LP.vocab.translateVerbs),
    timer: has(LP.vocab.timerVerbs),
    note: has(LP.vocab.noteVerbs),
    pay: has(LP.vocab.payVerbs) && !!LP.util.extractAmount(text),
    cab: has(LP.vocab.cabVerbs),
    music: has(LP.vocab.musicVerbs) || /^\s*play\s+/i.test(text),
    openEnded: isOpenEndedMood,
    conditional: has(LP.vocab.conditionalKeywords) || /^\s*if\s+/i.test(text)
  };

  return { text, signals, tone: LP.analyzeTone(text) };
};
