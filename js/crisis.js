/* ============================================================
   LifePilot — CRISIS ENGINE
   18 crisis categories as DATA (never new if/else branches — add
   a category by adding an entry to LP.crisisCategories).
   Everything here only ever *prepares* a call/message; nothing in
   this file ever places a call or sends a message without a tap.
   See Explanation_For_Judges.md → "Why tel: links are never auto-
   navigated" for the reasoning.
   ============================================================ */

/* Word-boundary phrase matcher — avoids the false-positive trap of
   naive .includes() (e.g. "help me plan a party" should NOT fire
   women's-safety crisis mode just because it contains "help"). */
LP.crisisUtil = {
  matchesAny(text, phrases) {
    const t = ' ' + text.toLowerCase().replace(/[^\w\s']/g, ' ') + ' ';
    return phrases.some(p => t.includes(' ' + p.toLowerCase() + ' '));
  }
};

/* ---------------------------------------------------------------
   Helpline directory (India-first, matches LP.emergencyNumber).
   Swap/extend for other regions in Settings → Region.
--------------------------------------------------------------- */
LP.helplines = {
  allEmergency: { number: '112', label: 'National Emergency (112)' },
  police: { number: '100', label: 'Police (100)' },
  fire: { number: '101', label: 'Fire (101)' },
  ambulance: { number: '108', label: 'Ambulance (108)' },
  womenHelpline: { number: '1091', label: "Women's Safety Helpline (1091)" },
  womenAllIssues: { number: '181', label: 'Women Helpline — All Issues (181)' },
  childHelpline: { number: '1098', label: 'Child Helpline (1098)' },
  mentalHealth: { number: '14416', label: 'KIRAN Mental Health Helpline (14416)' },
  cyberCrime: { number: '1930', label: 'Cyber Crime Helpline (1930)' },
  disasterMgmt: { number: '1078', label: 'Disaster Management (1078)' },
  elderHelpline: { number: '14567', label: 'Elder Line — Senior Citizens (14567)' },
  legalAid: { number: '15100', label: 'NALSA Free Legal Aid (15100)' },
  farmerHelpline: { number: '1800-180-1551', label: 'Kisan Call Centre — Farmer Helpline (1800-180-1551)' },
  supportLine: { number: '14566', label: 'National Support Helpline (14566)' },
  supportLineAlt: { number: '8882498498', label: 'Additional Support Helpline (8882498498)' }
};

/* Helpline numbers change over time and can vary by state — LifePilot
   cannot verify them live (it has no network access of its own). This
   note is appended to every crisis card so nobody over-trusts a stale
   number in a real emergency. */
LP.HELPLINE_FRESHNESS_NOTE = 'Helpline numbers can change or vary by state — if one doesn\u2019t connect, 112 always works nationwide.';

/* ---------------------------------------------------------------
   Plain-language rights notes — general information only, not
   legal advice, and deliberately free of specific section numbers
   (IPC/BNS citations shift with amendments and jurisdiction — a
   wrong citation in a crisis is worse than none). Every note points
   to NALSA (15100) or a lawyer for anything specific to a case.
--------------------------------------------------------------- */
const RIGHTS_DISCLAIMER = 'This is general information, not legal advice — NALSA (15100) offers free legal aid if you want help specific to your situation.';

/* ---------------------------------------------------------------
   18-CATEGORY ASSISTANCE ENGINE
   Each: id, label, severity (critical/high/medium/low — drives the
   Life Channel's color/urgency, not its usefulness), assistanceType
   ('crisis' = safety-first tone, 'support' = calmer resource tone),
   keyword phrases, helplines (priority order), safetyTips, an
   optional rightsNote, and `sensitive` for a softer script.
--------------------------------------------------------------- */
LP.crisisCategories = [
  {
    id: 'womens_safety', label: "Women's Safety", severity: 'critical', assistanceType: 'crisis',
    phrases: ['being followed', 'following me', 'a stalker', 'stalker', 'stalking', 'someone is stalking me', 'being harassed', 'catcalled', 'a man is following me', 'grabbed me', 'being chased', 'eve teasing', 'groped', 'touched inappropriately', 'unsafe at night'],
    helplines: [LP.helplines.womenHelpline, LP.helplines.allEmergency],
    safetyTips: ['Head toward the nearest place with other people — a shop, a lit building, a crowd.', 'Walk briskly, do not run, and stay visible.', 'If you can, call a trusted contact and stay on the line.']
  },
  {
    id: 'child_protection', label: 'Child Protection', severity: 'critical', assistanceType: 'crisis',
    phrases: ['my child is missing', 'lost my kid', 'a stranger is near my child', 'child abuse', 'kid is alone outside', 'child is being abused', 'child marriage', 'forced marriage', 'underage marriage', 'marrying me off', 'child labor', 'child labour', 'i am only 16'],
    helplines: [LP.helplines.childHelpline, LP.helplines.police],
    safetyTips: ['Alert nearby staff or security immediately — most venues can lock down exits.', 'Check the last place the child was seen before moving further.', 'Have a recent photo ready to show people.']
  },
  {
    id: 'domestic_abuse', label: 'Domestic Abuse (all genders)', severity: 'critical', assistanceType: 'crisis', sensitive: true,
    phrases: ['my husband is hitting me', 'husband beats me', 'husband hitting me', 'my wife is hitting me', 'wife beats me', 'wife hitting me', 'my partner is hitting me', 'being abused at home', 'my partner hit me', 'domestic violence', 'domestic abuse', 'he is going to hurt me', 'she is going to hurt me', 'abusive relationship', 'beaten at home', 'husband is violent', 'wife is violent'],
    helplines: [LP.helplines.womenAllIssues, LP.helplines.allEmergency],
    safetyTips: ['If you can safely leave the room or the house, do that first.', 'A neighbor, stairwell, or locked room can buy you time.', 'The helpline can also connect you with local shelters — regardless of your gender.'],
    rightsNote: 'Domestic abuse is a legal wrong in India regardless of the survivor\u2019s gender, and protection orders can be sought through the courts. ' + RIGHTS_DISCLAIMER
  },
  {
    id: 'financial_crisis', label: 'Financial Crisis', severity: 'medium', assistanceType: 'support',
    phrases: ['drowning in debt', 'about to lose my house', 'cannot pay my loan', "can't pay my loan", 'financial crisis', 'loan sharks are threatening me', 'daughter\'s wedding', 'wedding expenses', 'can\'t afford wedding', 'wedding without loan', 'collect money for wedding', 'no money for wedding'],
    helplines: [LP.helplines.legalAid, LP.helplines.supportLine],
    safetyTips: ['If a lender is threatening or harassing you, that is illegal — document every message and call.', 'Banking ombudsman and consumer courts exist specifically for loan disputes.', 'A free financial/legal counselor can help you prioritize which debts to address first.']
  },
  {
    id: 'mental_health', label: 'Mental Health Guidance', severity: 'high', assistanceType: 'crisis', sensitive: true,
    phrases: ['having a panic attack', 'panic attack right now', 'having a breakdown', "i can't cope", 'mental breakdown', 'want to kill myself', 'i want to die', 'thinking about suicide', 'suicidal', 'ending my life', 'self harm', 'cutting myself', 'feeling hopeless'],
    helplines: [LP.helplines.mentalHealth],
    safetyTips: ['Try to slow your breathing — I can guide you through a short breathing exercise if you\u2019d like.', 'Name 5 things you can see, 4 you can hear, 3 you can touch — it helps ground the moment.', 'Trained counselors on the helpline are free, confidential, and available 24/7.'],
    offerBreathing: true
  },
  {
    id: 'elder_welfare', label: 'Elder Welfare', severity: 'high', assistanceType: 'crisis', sensitive: true,
    phrases: ['my grandmother is being abused', 'elder abuse', 'my grandfather is being neglected', 'caretaker is hurting', 'elderly parent needs help', 'abandoned parents', 'thrown out of house old', 'property grabbed by children'],
    helplines: [LP.helplines.elderHelpline, LP.helplines.police],
    safetyTips: ['If they are in immediate danger, prioritize getting them away from the person first.', 'Elder Line can arrange a welfare check and connect you to local services.', 'Document what you have observed once things are safe.']
  },
  {
    id: 'acid_attack_recovery', label: 'Acid Attack Recovery', severity: 'critical', assistanceType: 'crisis', sensitive: true,
    phrases: ['acid attack', 'someone threw acid', 'acid was thrown on me', 'acid burns', 'acid burn'],
    helplines: [LP.helplines.ambulance, LP.helplines.allEmergency],
    safetyTips: ['Flush the affected area with large amounts of clean, running water for at least 15–20 minutes.', 'Remove any contaminated clothing or jewelry near the burn if it can be done safely.', 'Get to a hospital burn unit immediately — acid burns need specialist care.'],
    rightsNote: 'Survivors are legally entitled to free treatment at both government and private hospitals in India, and to victim compensation. ' + RIGHTS_DISCLAIMER
  },
  {
    id: 'anti_trafficking', label: 'Anti-Trafficking', severity: 'critical', assistanceType: 'crisis', sensitive: true,
    phrases: ['i am being trafficked', 'being trafficked', 'trafficked', 'i was sold', 'being held against my will', 'they took my passport and wont let me leave', "won't let me leave", 'trapped in brothel', 'forced into prostitution', 'bonded labor'],
    helplines: [LP.helplines.childHelpline, LP.helplines.allEmergency],
    safetyTips: ['If you can reach a phone privately, that is the priority — the details can wait.', 'Try to note anything identifying about the location if it is safe to do so.', 'You will not be treated as a criminal for having been trafficked — the law is on your side.']
  },
  {
    id: 'cybercrime_sextortion', label: 'Cybercrime / Sextortion', severity: 'high', assistanceType: 'crisis', sensitive: true,
    phrases: ['someone is blackmailing me with photos', 'blackmailing', 'sextortion', 'revenge porn', 'leaked my photos', 'shared my private photos', 'threatening to leak my photos', 'my bank account was hacked', 'hacked my bank account', 'money was stolen from my account', 'gave my otp to a scammer', 'my account was hacked', 'someone is threatening to share my pictures', 'loan app harassment'],
    helplines: [LP.helplines.cyberCrime],
    safetyTips: ['Do not pay or send more images — it rarely stops the demands.', 'Screenshot everything before blocking the person.', 'Report at cybercrime.gov.in or call 1930 — platforms can also fast-track takedowns once reported.']
  },
  {
    id: 'caste_rights', label: 'Caste Rights', severity: 'medium', assistanceType: 'support', sensitive: true,
    phrases: ['caste discrimination', 'denied entry because of my caste', 'caste based violence', 'casteist slurs', 'caste atrocity', 'dalit atrocity', 'sc st atrocity', 'untouchability'],
    helplines: [LP.helplines.legalAid, LP.helplines.police],
    safetyTips: ['Document what happened — dates, witnesses, and any messages or recordings.', 'The National/State Commission for Scheduled Castes & Scheduled Tribes can take formal complaints.', 'Free legal aid can help you understand the fastest path for your situation.'],
    rightsNote: 'Caste-based discrimination and atrocities are specifically prohibited under Indian law, with dedicated courts for faster hearings in many states. ' + RIGHTS_DISCLAIMER
  },
  {
    id: 'lgbtq_affirmation', label: 'LGBTQ+ Affirmation', severity: 'medium', assistanceType: 'support', sensitive: true,
    phrases: ['my family found out i am gay', 'kicked out for being gay', 'i am scared to come out', 'being outed', 'conversion therapy', 'forced conversion therapy', 'transgender help'],
    helplines: [LP.helplines.mentalHealth, LP.helplines.supportLineAlt],
    safetyTips: ['You are not alone, and there is nothing wrong with who you are.', 'If home isn\u2019t safe right now, LGBTQ+ community helplines can point you to shelters and peer support.', 'Counselors on these lines are specifically trained for this and won\u2019t judge you.']
  },
  {
    id: 'missing_persons', label: 'Missing Persons', severity: 'high', assistanceType: 'crisis',
    phrases: ['someone is missing', "can't find my friend", "can't find my sister", 'my brother is missing', "hasn't come home", 'child is missing', 'my child is missing', 'disappeared'],
    helplines: [LP.helplines.police],
    safetyTips: ['Check their last known location and who they were last with.', "Call the person's phone and any friends they were with.", "File a missing-person report if it's been more than a few hours or you're worried."]
  },
  {
    id: 'disaster_relief', label: 'Disaster Relief', severity: 'critical', assistanceType: 'crisis',
    phrases: ['earthquake', 'building collapsed', 'flood water rising', 'trapped under debris', 'landslide', 'cyclone hit our village', 'car accident', 'road accident', 'injured on road'],
    helplines: [LP.helplines.disasterMgmt, LP.helplines.allEmergency],
    safetyTips: ['If a structure feels unstable, move to open ground away from walls and windows.', 'Do not use elevators or open flames if you smell gas.', 'Conserve your phone battery — send your location once, then stay quiet.']
  },
  {
    id: 'legal_aid', label: 'Pro-Bono Legal Aid', severity: 'low', assistanceType: 'support',
    phrases: ['i cannot afford a lawyer', "can't afford a lawyer", 'need free legal help', 'need a lawyer but have no money', 'free legal aid', 'nalsa', 'false case against me'],
    helplines: [LP.helplines.legalAid],
    safetyTips: ['NALSA provides free legal aid to women, children, SC/ST individuals, and anyone earning below the eligibility limit.', 'Every district has a Legal Services Authority that can assign you a lawyer at no cost.', 'Bring any documents related to your case when you visit.'],
    rightsNote: 'Free legal aid is a right under Indian law for a wide range of people, not a favor. ' + RIGHTS_DISCLAIMER
  },
  {
    id: 'education_scholarships', label: 'Education Scholarships', severity: 'low', assistanceType: 'support',
    phrases: ['need a scholarship', 'cannot afford college fees', "can't afford college fees", 'looking for education funding', 'right to education', 'free education'],
    helplines: [LP.helplines.supportLine],
    safetyTips: ['The National Scholarship Portal (scholarships.gov.in) lists most central and state scholarships in one place.', 'Many scholarships are caste-, income-, or disability-specific — check eligibility before applying.', 'Your school/college financial aid office can often point you to local and private scholarships too.']
  },
  {
    id: 'workplace_posh', label: 'Workplace POSH (Harassment)', severity: 'medium', assistanceType: 'crisis', sensitive: true,
    phrases: ['being harassed at work', 'my boss is inappropriate', 'workplace harassment', 'sexually harassed at office', 'posh complaint', 'inappropriate touching at work'],
    helplines: [LP.helplines.womenHelpline, LP.helplines.legalAid],
    safetyTips: ["Write down what happened with dates while it's fresh — this matters later.", 'Every workplace above a certain size is legally required to have an Internal Committee (ICC) for exactly this.', 'You can also approach the police or the women\u2019s helpline if you feel unsafe.'],
    rightsNote: 'Workplace sexual harassment complaints in India are governed by the POSH Act, with the ICC required to complete an inquiry within a set timeframe. ' + RIGHTS_DISCLAIMER
  },
  {
    id: 'farmer_support', label: 'Farmer Support', severity: 'medium', assistanceType: 'support',
    phrases: ['crop failed', 'crop loss', 'lost my harvest', 'farmer in debt', 'need help with my farm', 'crop destroyed', 'farm loan', 'farmer debt'],
    helplines: [LP.helplines.farmerHelpline],
    safetyTips: ['The Kisan Call Centre connects you with agriculture experts in your local language.', 'Crop insurance (PMFBY) claims have specific windows after a loss — check timing with your local agriculture office.', 'State-level farmer debt relief and relief-fund schemes vary — the call centre can point you to what applies locally.']
  },
  {
    id: 'dowry_harassment', label: 'Dowry Harassment', severity: 'high', assistanceType: 'crisis', sensitive: true,
    phrases: ['dowry', 'dowry demand', 'dowry demands', 'in-laws demanding dowry', 'in-laws demanding money', 'dowry torture', 'threatened over dowry', 'being harassed for dowry', 'husband demanding money', 'dowry harassment', 'demanding dowry', 'in laws demanding money'],
    helplines: [LP.helplines.womenAllIssues, LP.helplines.police],
    safetyTips: ['If you feel physically unsafe right now, prioritize getting somewhere safe first.', 'Keep records of demands — messages, witnesses, dates.', 'Women\u2019s helplines can connect you with a protection officer, who exists specifically for cases like this.'],
    rightsNote: 'Demanding dowry is illegal in India regardless of who asks for it or when. ' + RIGHTS_DISCLAIMER
  }
];

/* ---------------------------------------------------------------
   Generic fallback used only for medical/fire/immediate-danger
   language that DOESN'T match one of the 18 named categories above
   (e.g. "chest pain", "the kitchen is on fire", "can't breathe").
   Not counted among the 18 — it exists so the base emergencyTerms
   vocabulary in orchestrator.js still gets the full Life Channel
   treatment instead of just the plain ESCALATE card.
--------------------------------------------------------------- */
LP.genericEmergencyCategory = {
  id: 'general_emergency', label: 'Emergency', severity: 'critical', assistanceType: 'crisis',
  helplines: [LP.helplines.allEmergency, LP.helplines.ambulance],
  safetyTips: ['If someone is unconscious but breathing, turn them onto their side.', "If there's fire or smoke, get low and get out — don't stop for belongings.", 'Keep the area around the person clear and stay on the line with the helpline once connected.']
};
/* ---------------------------------------------------------------
   Classifier — evaluates every category and returns the one whose
   matched phrase is the longest (most specific), so a specific
   phrase like "harassed for dowry" wins over a shorter overlapping
   one like "being harassed" in a different category. Returns null
   when nothing matches.
--------------------------------------------------------------- */
LP.crisisUtil.bestMatch = function (text, phrases) {
  const t = ' ' + text.toLowerCase().replace(/[^\w\s']/g, ' ') + ' ';
  let best = null;
  for (const p of phrases) {
    if (t.includes(' ' + p.toLowerCase() + ' ') && (!best || p.length > best.length)) best = p;
  }
  return best;
};

LP.crisisClassify = function (rawText) {
  const text = (rawText || '').trim();
  if (!text) return null;
  let winner = null, winnerLen = -1;
  for (const cat of LP.crisisCategories) {
    const match = LP.crisisUtil.bestMatch(text, cat.phrases);
    if (match && match.length > winnerLen) { winner = cat; winnerLen = match.length; }
  }
  return winner;
};

/* ---------------------------------------------------------------
   Build the ESCALATE-style card data for a crisis category. This
   feeds the existing ESCALATE card renderer (ui_cards.js) as well
   as the Life Channel overlay.
--------------------------------------------------------------- */
LP.buildCrisisCard = function (crisis, rawText) {
  const primary = crisis.helplines[0];
  const body = crisis.assistanceType === 'support'
    ? `LifePilot matched this to "${crisis.label}." Below are helplines and resources — nothing here contacts anyone without your tap.`
    : `LifePilot cannot place a call or contact anyone for you — only your tap on the button below does that. Tap it now if you need help.`;
  return {
    id: LP.util.uid(), type: 'ESCALATE', permission: 'required',
    title: `Detected: ${crisis.label}`,
    subtitle: `LifePilot matched your message to "${crisis.label}."`,
    body,
    telNumber: primary.number, telLabel: `Call ${primary.label}`,
    shareLocationText: crisis.sensitive
      ? "I need help. Can you call me?"
      : `I need help right now (${crisis.label}). My location: `,
    referenceLinks: crisis.helplines.slice(1).map(h => ({ label: h.label, url: 'tel:' + h.number })),
    honestyNote: 'LifePilot has not contacted emergency services, a doctor, or anyone else. The tap is yours to make. '
      + LP.HELPLINE_FRESHNESS_NOTE + (crisis.rightsNote ? ' ' + crisis.rightsNote : ''),
    crisisId: crisis.id, crisisSeverity: crisis.severity
  };
};
