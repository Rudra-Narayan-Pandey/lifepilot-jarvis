# CRISIS ENGINE ADD-ON — LifePilot: "One Intent. Every Action."

> Append this entire document to the MASTER_BUILD_PROMPT.md before handing to Claude. This adds a complete societal crisis response system to LifePilot.

---

## WHY THIS EXISTS

LifePilot is not just a productivity tool. Real people face real crises — a 16-year-old being forced into marriage, a woman fleeing assault, a farmer drowning in debt, a man whose life is threatened by domestic violence. When someone in crisis types or speaks to LifePilot, the app must instantly become their lifeline — showing them their exact legal rights, the exact number to call, the exact government scheme they qualify for, and the exact steps to take RIGHT NOW.

This is not optional. This is the reason LifePilot exists.

---

## ARCHITECTURE: THE CRISIS CLASSIFIER

### How It Works

Add a new classification layer that runs BEFORE the standard orchestrator. It scans every input for crisis-level language across 18 categories. If a crisis is detected, it OVERRIDES the normal orchestrator output and produces a specialized **CRISIS CARD** instead.

### Priority Order
```
EMERGENCY (life-threatening) → CRISIS (societal/legal) → STANDARD ORCHESTRATOR
```

If both emergency AND crisis signals are detected, emergency wins (call 112 first, then show crisis resources).

### The Crisis Classifier Function

```javascript
LP.crisisClassify = function(text) {
  const t = text.toLowerCase();
  for (const category of LP.crisisDB) {
    if (category.triggers.some(trigger => t.includes(trigger))) {
      return category;
    }
  }
  return null;
};
```

### Integration with Existing Orchestrator

In `LP.compose()`, add this at the very top, BEFORE the existing emergency check:

```javascript
LP.compose = function(rawText) {
  // --- CRISIS CHECK: runs before everything else ---
  const crisis = LP.crisisClassify(rawText);
  if (crisis) {
    return {
      tier: 1,
      primaryIntent: 'CRISIS',
      cards: LP.buildCrisisCards(crisis, rawText),
      text: rawText,
      crisisCategory: crisis.id
    };
  }
  // ... existing orchestrator logic continues below ...
};
```

---

## THE CRISIS CARD BUILDER

Every crisis produces a multi-card response:

```javascript
LP.buildCrisisCards = function(crisis, rawText) {
  const cards = [];
  
  // Card 1: IMMEDIATE ACTION
  cards.push({
    id: LP.util.uid(), type: 'CRISIS_ACTION', permission: 'required',
    title: crisis.immediateAction.title,
    subtitle: 'What to do right now — step by step',
    body: crisis.immediateAction.steps.join('\n'),
    urgencyLevel: crisis.severity,
    createdAt: Date.now()
  });
  
  // Card 2+: HELPLINES
  crisis.helplines.forEach(helpline => {
    cards.push({
      id: LP.util.uid(), type: 'CRISIS_HELPLINE', permission: 'required',
      title: helpline.name, subtitle: helpline.number,
      telNumber: helpline.number,
      telLabel: 'Call ' + helpline.name + ' (' + helpline.number + ')',
      timing: helpline.timing || '24/7',
      createdAt: Date.now()
    });
  });
  
  // Card: LEGAL RIGHTS
  cards.push({
    id: LP.util.uid(), type: 'CRISIS_LEGAL', permission: 'auto',
    title: 'Your Legal Rights',
    subtitle: 'In plain language — not legalese',
    body: crisis.legalRights.join('\n\n'),
    laws: crisis.laws,
    createdAt: Date.now()
  });
  
  // Card: GOVERNMENT SCHEMES
  if (crisis.govSchemes && crisis.govSchemes.length > 0) {
    cards.push({
      id: LP.util.uid(), type: 'CRISIS_SCHEMES', permission: 'auto',
      title: 'Government Schemes You May Qualify For',
      subtitle: 'Free aid, loans, and support programs',
      schemes: crisis.govSchemes,
      createdAt: Date.now()
    });
  }
  
  // Card: NGOs
  if (crisis.ngos && crisis.ngos.length > 0) {
    cards.push({
      id: LP.util.uid(), type: 'CRISIS_NGO', permission: 'auto',
      title: 'Organizations That Can Help',
      ngos: crisis.ngos,
      createdAt: Date.now()
    });
  }
  
  // Card: EMERGENCY MESSAGE
  cards.push({
    id: LP.util.uid(), type: 'NOTIFY', permission: 'required',
    title: 'Send for help',
    subtitle: 'Pre-drafted message to your trusted contact',
    message: crisis.emergencyMessage,
    waUrl: LP.util.waUrl(crisis.emergencyMessage),
    smsUrl: LP.util.smsUrl(crisis.emergencyMessage),
    createdAt: Date.now()
  });
  
  // Card: SHARE LOCATION (critical only)
  if (crisis.severity === 'critical') {
    cards.push({
      id: LP.util.uid(), type: 'CRISIS_LOCATION', permission: 'required',
      title: 'Share your live location',
      subtitle: 'Send GPS coordinates to a trusted contact via WhatsApp',
      createdAt: Date.now()
    });
  }
  
  return cards;
};
```

---

## THE COMPLETE CRISIS DATABASE (LP.crisisDB)

### CATEGORY 1: Women's Safety & Assault

```javascript
{
  id: 'womens_safety', severity: 'critical',
  triggers: ['someone is following me','being followed','stalking me','sexual assault','raped','rape','molested','touched me inappropriately','groped','harassed','eve teasing','i don\'t feel safe','someone is threatening me','man following me','attacked','physically assaulted','grabbed me','tried to kidnap','abducted','forced to go with','unsafe at night','someone broke into my house'],
  helplines: [
    { name: 'National Emergency', number: '112', timing: '24/7' },
    { name: 'Women Helpline', number: '1091', timing: '24/7' },
    { name: 'Women Helpline (Domestic Abuse)', number: '181', timing: '24/7' },
    { name: 'NCW Helpline', number: '7827170170', timing: '24/7' }
  ],
  immediateAction: { title: 'Your safety comes first', steps: [
    '1. Get to a safe place IMMEDIATELY — a shop, a crowd, any public space with people.',
    '2. Call 112 (National Emergency) — works even without SIM or balance.',
    '3. Do NOT confront the attacker.',
    '4. If sexual assault occurred: Do NOT bathe, change clothes, or wash anything — preserves DNA evidence.',
    '5. Any government hospital MUST treat you for free.',
    '6. File a "Zero FIR" at ANY police station — they cannot refuse.',
    '7. You have the right to a female officer and a private room for your statement.'
  ]},
  legalRights: [
    'BNS Section 64 (Rape): minimum 10 years, extendable to life imprisonment.',
    'BNS Section 74 (Assault/Outraging Modesty): up to 2 years.',
    'BNS Section 78 (Stalking): up to 3 years first offense, 5 years repeat.',
    'Zero FIR: You can file at ANY police station regardless of jurisdiction.',
    'Police CANNOT refuse to register your FIR.',
    'Your identity is protected by law — no media can publish your name or photo.'
  ],
  laws: [{ name: 'BNS Section 64 (Rape)', formerly: 'IPC 376' }, { name: 'BNS Section 74', formerly: 'IPC 354' }, { name: 'BNS Section 78 (Stalking)', formerly: 'IPC 354D' }],
  govSchemes: [{ name: 'One Stop Centre (Sakhi)', description: 'Integrated medical, legal, psychological, shelter support in every district.', url: 'https://wcd.nic.in' }],
  ngos: [{ name: 'Majlis Legal Centre', location: 'Mumbai', focus: 'Free legal aid' }, { name: 'Jagori', location: 'Delhi', focus: 'Women\'s safety' }, { name: 'Shakti Shalini', location: 'Delhi', focus: 'Shelter & crisis intervention' }],
  emergencyMessage: 'I am in an unsafe situation and need help urgently. Please call me or contact the police (112) immediately. I am sharing my location.'
}
```

### CATEGORY 2: Child Marriage / Child Abuse / Child Labor

```javascript
{
  id: 'child_protection', severity: 'critical',
  triggers: ['child marriage','forced marriage','marrying me off','i\'m being forced to marry','i am only 16','i am only 15','i am only 14','underage marriage','my parents want me to marry','too young to marry','child abuse','child labor','child labour','beating a child','hurting a child','child being abused','child molestation','my child is being abused','kid working in factory','parents forcing marriage'],
  helplines: [
    { name: 'Childline India', number: '1098', timing: '24/7' },
    { name: 'National Emergency', number: '112', timing: '24/7' }
  ],
  immediateAction: { title: 'Protecting a child — act now', steps: [
    '1. Call Childline (1098) IMMEDIATELY — they will dispatch a team.',
    '2. If immediate physical danger, call 112.',
    '3. Report to local Child Welfare Committee (CWC) or District Child Protection Unit (DCPU).',
    '4. Child marriage: Any person can report it. The marriage can be legally voided even after it happens.',
    '5. Child labor: Report to District Magistrate or Labor Inspector.',
    '6. Document everything — photos, dates, names, locations.',
    '7. The child has the right to free legal representation through NALSA.'
  ]},
  legalRights: [
    'Prohibition of Child Marriage Act 2006: Marriage where bride is under 18 or groom under 21 is VOIDABLE.',
    'Anyone performing/permitting child marriage: up to 2 years imprisonment and/or ₹1 Lakh fine.',
    'POCSO Act 2012: Sexual offense against minor — 3 years to life imprisonment.',
    'Child Labour Amendment Act 2016: Complete ban on employment under 14.',
    'RTE Act: Every child 6-14 has right to free education.',
    'Child victim statement can be recorded via video — no cross-examination in court.'
  ],
  laws: [{ name: 'Prohibition of Child Marriage Act, 2006' }, { name: 'POCSO Act, 2012' }, { name: 'Child Labour Amendment Act, 2016' }, { name: 'RTE Act, 2009' }],
  govSchemes: [],
  ngos: [{ name: 'Kailash Satyarthi Children\'s Foundation', focus: 'Child labor rescue' }, { name: 'CRY', focus: 'Child rights' }, { name: 'Pratham', focus: 'Education' }],
  emergencyMessage: 'A child is in danger and needs immediate help. Please contact Childline (1098) or Police (112) right away.'
}
```

### CATEGORY 3: Domestic Violence (All Genders)

```javascript
{
  id: 'domestic_violence', severity: 'critical',
  triggers: ['my husband beats me','husband hitting me','wife beats me','wife is violent','domestic violence','domestic abuse','abusive relationship','partner hits me','beaten at home','violence at home','abusive husband','abusive wife','threatens to kill me','wife and her boyfriend','trying to kill me','locked me in the house','won\'t let me leave','controlling me','marital rape','in-laws torturing me','dowry harassment','demanding dowry'],
  helplines: [
    { name: 'National Emergency', number: '112', timing: '24/7' },
    { name: 'Women Helpline (Domestic Abuse)', number: '181', timing: '24/7' },
    { name: 'Women Helpline', number: '1091', timing: '24/7' },
    { name: 'Save Indian Family Foundation (Men)', number: '8882498498', timing: 'Mon-Sat, 10 AM - 8 PM' },
    { name: 'Vaastav Foundation (Men)', number: '9167684555', timing: 'Male DV victims' }
  ],
  immediateAction: { title: 'You are not alone — here is what to do', steps: [
    '1. If in IMMEDIATE danger, call 112.',
    '2. Get to a safe location — neighbor, friend, relative, public place.',
    '3. Document injuries with photographs and timestamps.',
    '4. Get medical treatment — ask doctor to record injuries in MLC report.',
    '5. File a Domestic Incident Report (DIR) via Protection Officer.',
    '6. Seek a Protection Order from Magistrate under PWDVA.',
    '7. If you are a man: File FIR under general assault laws. Contact SIFF (8882498498).',
    '8. Keep a "go bag" ready: ID documents, cash, phone charger, medications.'
  ]},
  legalRights: [
    'PWDVA 2005 covers physical, emotional, verbal, sexual, AND economic abuse.',
    'Under PWDVA: Protection Order, Residence Order, Monetary Relief, Custody Order, Compensation.',
    'BNS Section 85 (Cruelty by husband/relatives): up to 3 years.',
    'Dowry Prohibition Act: minimum 5 years + ₹15,000 fine.',
    'For MEN: File FIRs under assault/extortion/criminal intimidation. SIFF provides legal aid.',
    'Free legal aid through NALSA if you cannot afford a lawyer.'
  ],
  laws: [{ name: 'PWDVA, 2005' }, { name: 'BNS Section 85', formerly: 'IPC 498A' }, { name: 'Dowry Prohibition Act, 1961' }],
  govSchemes: [{ name: 'Swadhar Greh', description: 'Shelter for women — food, clothing, medical, legal aid, vocational training.' }, { name: 'One Stop Centre (Sakhi)', description: 'Integrated support in every district.' }],
  ngos: [{ name: 'Shakti Shalini', location: 'Delhi', focus: 'Women crisis' }, { name: 'Save Indian Family Foundation', focus: 'Male DV victims' }, { name: 'Vaastav Foundation', location: 'Mumbai', focus: 'Male abuse victims' }],
  emergencyMessage: 'I am in an abusive/violent situation at home and need help. Please call me or contact police (112) immediately.'
}
```

### CATEGORY 4: Financial Distress / Wedding / Debt

```javascript
{
  id: 'financial_distress', severity: 'medium',
  triggers: ['need money for daughter\'s wedding','can\'t afford wedding','marriage expenses','no money for wedding','wedding without loan','drowning in debt','can\'t pay loan','loan shark','moneylender threatening','can\'t pay emi','financial crisis','no money for treatment','can\'t afford medicine','poverty','below poverty line','no money for food','can\'t feed my family','need financial help','government help for poor','can\'t pay rent','about to be evicted','homeless','predatory loan','debt trap'],
  helplines: [
    { name: 'NALSA Legal Aid', number: '15100', timing: 'Free legal advice on financial harassment' },
    { name: 'RBI Banking Ombudsman', number: '14448', timing: 'Illegal lending/recovery complaints' }
  ],
  immediateAction: { title: 'Financial help is available', steps: [
    '1. Do NOT take loans from unregistered moneylenders or loan apps — illegal interest rates.',
    '2. Check government schemes below — many provide DIRECT CASH TRANSFER with no repayment.',
    '3. Visit nearest Common Service Centre (CSC) — free help applying for schemes.',
    '4. Recovery agent harassment? Call 14448. Agents cannot call before 8 AM or after 7 PM.',
    '5. Wedding expenses: State governments offer ₹25,000-₹51,000 for BPL daughters\' marriages.',
    '6. Severe debt: Free legal aid through NALSA (15100). Discuss debt restructuring.',
    '7. Use Jan Samarth Portal (jansamarth.in) to auto-match eligible schemes.'
  ]},
  legalRights: [
    'No lender can charge above legally permitted interest rate. Recovery harassment is criminal.',
    'You CANNOT be imprisoned for failing to repay a civil debt in India.',
    'Loan apps sharing your contacts/data is cybercrime — report to 1930.',
    'Free legal aid through NALSA if income below ₹3,00,000/year.'
  ],
  laws: [{ name: 'RBI Fair Practices Code' }, { name: 'Consumer Protection Act, 2019' }],
  govSchemes: [
    { name: 'Kanya Vivah Yojana', description: '₹25,000-₹51,000 for BPL daughters\' marriages.' },
    { name: 'PM SVANidhi', description: 'Up to ₹50,000 micro-credit for street vendors. No collateral.', url: 'https://pmsvanidhi.mohua.gov.in' },
    { name: 'Mudra Loan (PMMY)', description: 'Up to ₹10 Lakhs for micro-enterprises. No collateral.', url: 'https://mudra.org.in' },
    { name: 'PM Awas Yojana', description: 'Subsidized housing — up to ₹2.67 Lakhs subsidy.', url: 'https://pmaymis.gov.in' },
    { name: 'Antyodaya Anna Yojana', description: '35 kg rice/wheat per month at ₹2-3/kg for poorest families.' },
    { name: 'Jan Samarth Portal', description: 'Discover all eligible schemes.', url: 'https://jansamarth.in' },
    { name: 'Haqdarshak App', description: 'Free app to find eligible welfare schemes.' }
  ],
  ngos: [{ name: 'Nudge Foundation', focus: 'Poverty alleviation' }, { name: 'Rang De', focus: 'Low-cost micro-loans' }],
  emergencyMessage: 'I am facing severe financial hardship and need guidance on government aid programs.'
}
```

### CATEGORY 5: Mental Health Crisis / Suicide Prevention

```javascript
{
  id: 'mental_health_crisis', severity: 'critical',
  triggers: ['want to die','want to end it','suicidal','kill myself','end my life','no reason to live','better off dead','can\'t go on','can\'t take it anymore','self harm','cutting myself','hurting myself','overdose','severely depressed','hopeless','nothing matters','panic attack','mental breakdown','losing my mind'],
  helplines: [
    { name: 'Tele-MANAS (Govt of India)', number: '14416', timing: '24/7 Free' },
    { name: 'KIRAN Mental Health', number: '1800-599-0019', timing: '24/7 Toll-free' },
    { name: 'iCall (TISS)', number: '9152987821', timing: 'Mon-Sat, 8 AM - 10 PM' },
    { name: 'Vandrevala Foundation', number: '9999666555', timing: '24/7 Multilingual' }
  ],
  immediateAction: { title: 'You matter. Help is one call away.', steps: [
    '1. You are not alone. What you feel is real, and it is okay to ask for help.',
    '2. Call Tele-MANAS (14416) or KIRAN (1800-599-0019) RIGHT NOW. Free, confidential.',
    '3. If in immediate physical danger: Call 112 or go to nearest hospital ER.',
    '4. Tell ONE person you trust how you are feeling.',
    '5. Grounding: Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.',
    '6. Remove access to means of self-harm if possible.',
    '7. Attempting suicide is NOT a crime under Mental Healthcare Act 2017.'
  ]},
  legalRights: [
    'Mental Healthcare Act 2017 (Section 115): Suicide attempt is NOT a crime — mandates care, not punishment.',
    'Every person has the right to access government mental healthcare.',
    'Right to confidentiality — no professional can disclose without consent.',
    'Right to Advance Directive for mental health crisis treatment.',
    'Insurance companies CANNOT deny coverage for mental health treatment.'
  ],
  laws: [{ name: 'Mental Healthcare Act, 2017' }],
  govSchemes: [{ name: 'Tele-MANAS', description: 'Free 24/7 tele-counseling in 20+ languages.' }, { name: 'District Mental Health Programme', description: 'Free mental health services at district hospitals.' }],
  ngos: [{ name: 'iCall (TISS)', focus: 'Psychosocial counseling' }, { name: 'Vandrevala Foundation', focus: '24/7 crisis counseling' }, { name: 'Live Love Laugh Foundation', focus: 'Mental health awareness' }],
  emergencyMessage: 'I am going through a very difficult time and need support. Please check on me. If you cannot reach me, call KIRAN 1800-599-0019.'
}
```

### CATEGORY 6: Elder Abuse

```javascript
{
  id: 'elder_abuse', severity: 'high',
  triggers: ['elder abuse','senior citizen abuse','children not taking care of parents','abandoned parents','son beating father','daughter-in-law torturing','thrown out of house old','elderly neglect','property grabbed by children','my children won\'t support me','old and abandoned'],
  helplines: [{ name: 'National Elderline', number: '14567', timing: '24/7' }, { name: 'National Emergency', number: '112', timing: '24/7' }],
  immediateAction: { title: 'Senior citizens have strong legal protections', steps: [
    '1. Call National Elderline (14567) for immediate guidance.',
    '2. If in physical danger, call 112.',
    '3. Children/heirs are LEGALLY OBLIGATED to provide maintenance.',
    '4. File application with Maintenance Tribunal (Sub-Divisional Magistrate).',
    '5. Property transferred to neglectful children can be legally VOIDED.',
    '6. Contact HelpAge India through 14567 for free legal aid.'
  ]},
  legalRights: ['Maintenance Act 2007: Legal obligation for children to maintain senior citizens.','Tribunal can order up to ₹10,000/month maintenance.','Property transfers are VOIDABLE if care condition is violated.','Abandoning a senior citizen: up to 3 months imprisonment or ₹5,000 fine.'],
  laws: [{ name: 'Maintenance and Welfare of Parents and Senior Citizens Act, 2007' }],
  govSchemes: [{ name: 'IGNOAPS', description: '₹200-500/month pension for BPL seniors above 60.' },{ name: 'Ayushman Bharat (PM-JAY)', description: 'Free ₹5 Lakh health insurance per family/year.' }],
  ngos: [{ name: 'HelpAge India', focus: 'Elder care and legal aid' }, { name: 'Agewell Foundation', focus: 'Elder rights' }],
  emergencyMessage: 'A senior citizen is being abused/neglected. Please contact National Elderline (14567) or Police (112).'
}
```

### CATEGORY 7: Acid Attack

```javascript
{
  id: 'acid_attack', severity: 'critical',
  triggers: ['acid attack','acid thrown','someone threw acid','acid on face','chemical attack','acid burn'],
  helplines: [{ name: 'National Emergency', number: '112', timing: '24/7' }, { name: 'Women Helpline', number: '181', timing: '24/7' }],
  immediateAction: { title: 'Medical treatment is #1 priority', steps: [
    '1. Call 112 for ambulance IMMEDIATELY.',
    '2. Wash affected area with CLEAN RUNNING WATER for 20+ minutes.',
    '3. Remove contaminated clothing carefully.',
    '4. Do NOT use ice, butter, toothpaste, or home remedies.',
    '5. ANY hospital — public or private — MUST provide FREE treatment.',
    '6. Supreme Court mandates minimum ₹3 Lakhs compensation.',
    '7. File FIR — acid sale without license is also criminal.'
  ]},
  legalRights: ['BNS Section 124: minimum 10 years to life imprisonment.','Supreme Court: minimum ₹3 Lakhs compensation from state.','Free treatment at ANY hospital mandatory.','Survivors entitled to disability pension and employment reservation.'],
  laws: [{ name: 'BNS Section 124', formerly: 'IPC 326A, 326B' }, { name: 'Laxmi vs Union of India (Supreme Court)' }],
  govSchemes: [{ name: 'NALSA Victim Compensation', description: 'Minimum ₹3 Lakhs + ongoing medical expenses.' }],
  ngos: [{ name: 'Chhanv Foundation', focus: 'Rehabilitation, runs Sheroes Hangout' }, { name: 'Meer Foundation', focus: 'Comprehensive survivor rehabilitation' }],
  emergencyMessage: 'Someone has been attacked with acid and needs immediate medical attention. Call 112 for ambulance NOW.'
}
```

### CATEGORY 8: Human Trafficking

```javascript
{
  id: 'human_trafficking', severity: 'critical',
  triggers: ['human trafficking','being trafficked','sold me','forced into prostitution','bonded labor','bonded labour','forced labor','trapped in brothel','held against my will','can\'t leave this place','taken my passport','forced to work without pay','enslaved'],
  helplines: [{ name: 'National Emergency', number: '112', timing: '24/7' }, { name: 'Childline (if minor)', number: '1098', timing: '24/7' }],
  immediateAction: { title: 'You have the right to be rescued', steps: [
    '1. If you can call, call 112 immediately.',
    '2. If you cannot call, share your location with anyone you trust.',
    '3. Report to Anti-Human Trafficking Unit (AHTU) of state police.',
    '4. You are the VICTIM — you will NOT be prosecuted.',
    '5. You are entitled to rescue, rehabilitation, shelter at government expense.',
    '6. If you know someone trafficked: File FIR as witness — police must investigate.'
  ]},
  legalRights: ['BNS Section 143: 7 years to life imprisonment.','ITPA 1956: Victims protected from prosecution.','Bonded Labour Abolition Act 1976: All bonded labor is illegal and void.','Entitled to rescue, rehabilitation, shelter, legal aid at state expense.'],
  laws: [{ name: 'BNS Section 143', formerly: 'IPC 370' }, { name: 'ITPA, 1956' }, { name: 'Bonded Labour Abolition Act, 1976' }],
  govSchemes: [{ name: 'Ujjawala Scheme', description: 'Prevention, rescue, rehabilitation of trafficking victims.' }],
  ngos: [{ name: 'Prajwala', location: 'Hyderabad', focus: 'Anti-trafficking rescue' }, { name: 'Rescue Foundation', location: 'Mumbai', focus: 'Rescue operations' }],
  emergencyMessage: 'Someone is being held against their will/trafficked. Please contact Police (112) urgently.'
}
```

### CATEGORY 9: Cybercrime / Online Harassment

```javascript
{
  id: 'cybercrime', severity: 'high',
  triggers: ['cybercrime','online harassment','revenge porn','leaked my photos','shared my private photos','shared my nudes','blackmailing me online','sextortion','morphed photos','fake profile','identity theft','hacked my account','online stalking','cyber bullying','cyberbullying','loan app harassment','loan app threatening','online fraud','upi fraud','bank fraud','money stolen from account','scammed online'],
  helplines: [{ name: 'Cyber Crime Helpline', number: '1930', timing: '24/7' }, { name: 'RBI Ombudsman', number: '14448', timing: 'Financial fraud' }],
  immediateAction: { title: 'Preserve evidence — do NOT delete anything', steps: [
    '1. Do NOT delete messages, posts, emails — they are evidence.',
    '2. Take SCREENSHOTS with URLs, timestamps, profile details.',
    '3. Call 1930 — especially for financial fraud (they can freeze transactions).',
    '4. File online at cybercrime.gov.in — anonymous reporting available.',
    '5. Intimate images shared without consent is criminal under IT Act.',
    '6. Loan app harassment: Report to RBI (14448). Agents cannot call before 8 AM/after 7 PM.',
    '7. Change passwords, enable 2FA immediately.',
    '8. Money stolen: Contact bank immediately to freeze and reverse.'
  ]},
  legalRights: ['IT Act 66C (Identity theft): 3 years + ₹1 Lakh.','IT Act 66E (Privacy violation): 3 years + ₹2 Lakhs.','IT Act 67/67A (Obscene material): 5 years + ₹10 Lakhs.','Loan apps sharing data with contacts is criminal under IT Act 66E.'],
  laws: [{ name: 'IT Act Sections 66C, 66E, 67, 67A' }, { name: 'BNS Section 78 (Cyber Stalking)' }],
  govSchemes: [],
  ngos: [{ name: 'Cyber Peace Foundation', focus: 'Cybercrime awareness' }],
  emergencyMessage: 'I am being harassed/threatened online. I have preserved evidence. Please help me report to Cyber Crime helpline (1930).'
}
```

### CATEGORY 10: Caste-Based Discrimination

```javascript
{
  id: 'caste_discrimination', severity: 'high',
  triggers: ['caste discrimination','untouchability','caste violence','caste atrocity','denied entry because of caste','caste slur','dalit atrocity','sc st atrocity','inter-caste marriage threatened','honor killing','honour killing'],
  helplines: [{ name: 'National Helpline Against Atrocities', number: '14566', timing: '24/7' }, { name: 'National Emergency', number: '112', timing: '24/7' }],
  immediateAction: { title: 'Caste atrocities are among the most serious offenses in Indian law', steps: [
    '1. Call 14566 for immediate guidance.',
    '2. If in physical danger, call 112.',
    '3. File FIR under SC/ST Act — police CANNOT refuse.',
    '4. Accused does NOT get anticipatory bail under this Act.',
    '5. Document everything — witnesses, photos, recordings.',
    '6. Entitled to free legal aid, travel expenses, maintenance during trial.',
    '7. Honor killing threats = attempted murder. Call 112 immediately.'
  ]},
  legalRights: ['SC/ST (Prevention of Atrocities) Act, 1989: One of India\'s strongest protective laws.','Covers: assault, boycott, denial of access, forced labor, humiliation, land grabbing.','No anticipatory bail for the accused.','Victims entitled to: legal aid, travel, maintenance, compensation, rehabilitation.','Article 17: Untouchability is abolished.'],
  laws: [{ name: 'SC/ST (Prevention of Atrocities) Act, 1989' }, { name: 'Article 17 of the Constitution' }],
  govSchemes: [{ name: 'Post-Matric Scholarship for SC/ST', description: 'Full scholarship for higher education.', url: 'https://scholarships.gov.in' }, { name: 'Stand-Up India', description: '₹10 Lakhs to ₹1 Crore loans for SC/ST entrepreneurs.', url: 'https://standupmitra.in' }],
  ngos: [{ name: 'NCDHR', focus: 'Dalit rights advocacy' }],
  emergencyMessage: 'I am facing caste-based discrimination/violence. Please contact 14566 or Police (112).'
}
```

### CATEGORY 11: LGBTQ+ Support

```javascript
{
  id: 'lgbtq_support', severity: 'medium',
  triggers: ['i am gay and need help','lgbtq','transgender help','coming out','family rejected me for being gay','conversion therapy','queer support','same sex relationship problem','gender identity','i am trans','kicked out for being gay'],
  helplines: [{ name: 'iCall (Queer-Affirmative)', number: '9152987821', timing: 'Mon-Sat, 8 AM - 10 PM' }, { name: 'Vandrevala Foundation', number: '9999666555', timing: '24/7' }],
  immediateAction: { title: 'You are valid. Your identity is protected by law.', steps: [
    '1. If in danger (violence, forced conversion therapy), call 112.',
    '2. Same-sex relations are FULLY LEGAL since 2018 Supreme Court verdict.',
    '3. Conversion therapy has no scientific basis — if forced, it may be assault.',
    '4. Call iCall (9152987821) for queer-affirmative counseling.',
    '5. Transgender persons: apply for Certificate of Identity under TPA 2019.',
    '6. Connect with community organizations below for peer support.'
  ]},
  legalRights: ['Navtej Singh Johar v. UOI (2018): Consensual same-sex relations decriminalized.','Transgender Persons Act 2019: Self-perceived gender identity, non-discrimination.','NALSA v. UOI (2014): Third gender recognized with full constitutional rights.'],
  laws: [{ name: 'Navtej Singh Johar v. UOI (2018)' }, { name: 'Transgender Persons Act, 2019' }],
  govSchemes: [{ name: 'SMILE Scheme', description: 'Housing, education, skill development for transgender persons.' }],
  ngos: [{ name: 'Humsafar Trust', location: 'Mumbai', focus: 'LGBTQ+ health' }, { name: 'Naz Foundation', location: 'Delhi', focus: 'LGBTQ+ rights' }, { name: 'SAATHII', focus: 'Queer health across India' }],
  emergencyMessage: 'I am facing discrimination/violence because of my identity and need support. Please check on me.'
}
```

### CATEGORY 12: Missing Persons

```javascript
{
  id: 'missing_person', severity: 'critical',
  triggers: ['missing person','someone is missing','child is missing','my child is missing','can\'t find my child','person went missing','disappeared','kidnapped child'],
  helplines: [{ name: 'National Emergency', number: '112', timing: '24/7' }, { name: 'Childline (if minor)', number: '1098', timing: '24/7' }],
  immediateAction: { title: 'There is NO waiting period to report', steps: [
    '1. Go to NEAREST police station and file FIR IMMEDIATELY. NO 24-hour waiting period — that is a myth.',
    '2. Police CANNOT refuse to register missing person FIR.',
    '3. Provide recent photograph and physical identifiers.',
    '4. For children: Also report on TrackChild (trackthemissingchild.gov.in).',
    '5. Check hospitals, friends, last known location.',
    '6. If you suspect kidnapping, mention explicitly in FIR for urgent investigation.'
  ]},
  legalRights: ['NO legal waiting period for missing person report — Supreme Court has ruled.','Police MUST register FIR immediately.','Women/children cases treated as priority investigation.'],
  laws: [{ name: 'Supreme Court Guidelines (Bachpan Bachao Andolan v. UOI)' }],
  govSchemes: [{ name: 'TrackChild Portal', description: 'National missing children database.', url: 'https://trackthemissingchild.gov.in' }],
  ngos: [{ name: 'Bachpan Bachao Andolan', focus: 'Finding missing children' }],
  emergencyMessage: 'A person has gone missing. Please contact Police (112) immediately. Sharing details and last known location.'
}
```

### CATEGORY 13: Natural Disaster / Accident

```javascript
{
  id: 'disaster_accident', severity: 'critical',
  triggers: ['earthquake','flood','tsunami','cyclone','landslide','building collapsed','fire in building','house on fire','car accident','road accident','someone hit by car','injured on road','drowning','electrocution','gas leak','natural disaster'],
  helplines: [{ name: 'National Emergency', number: '112', timing: '24/7' }, { name: 'Ambulance', number: '108', timing: '24/7' }, { name: 'Fire', number: '101', timing: '24/7' }, { name: 'NDRF', number: '9711077372', timing: '24/7' }, { name: 'State Emergency', number: '1070', timing: '24/7' }],
  immediateAction: { title: 'Safety first — then call for help', steps: [
    '1. Ensure YOUR safety first.',
    '2. Call 112 and 108 (Ambulance).',
    '3. Fire: Call 101. No elevators. Crawl low.',
    '4. Road accidents: You are LEGALLY PROTECTED if you help (Good Samaritan Law).',
    '5. First aid: Stop bleeding with pressure, clear airway, do NOT move spinal injuries.',
    '6. Natural disasters: Follow NDMA alerts. Higher ground for floods, cover for earthquakes.'
  ]},
  legalRights: ['Good Samaritan Law (2019): Helpers protected from liability and police harassment.','Hospitals MUST provide free emergency treatment — cannot demand payment first.'],
  laws: [{ name: 'Good Samaritan Law (Motor Vehicles Amendment Act, 2019)' }, { name: 'Disaster Management Act, 2005' }],
  govSchemes: [{ name: 'PM National Relief Fund', description: 'Financial relief for disaster-affected families.' }],
  ngos: [{ name: 'Goonj', focus: 'Disaster relief' }],
  emergencyMessage: 'Emergency/accident/disaster happening. Please call 112 and 108 (Ambulance) immediately. Sharing location.'
}
```

### CATEGORY 14: Legal Aid for the Poor

```javascript
{
  id: 'legal_aid', severity: 'medium',
  triggers: ['need a lawyer','can\'t afford lawyer','free legal aid','need legal advice','wrongly arrested','false case against me','in jail need help','legal aid for poor'],
  helplines: [{ name: 'NALSA Helpline', number: '15100', timing: 'Free legal aid' }],
  immediateAction: { title: 'Free legal aid is your constitutional right', steps: [
    '1. Call NALSA (15100) for immediate legal guidance.',
    '2. Visit District Legal Services Authority (DLSA) at district court.',
    '3. Eligible if: woman, child, SC/ST, trafficking victim, disabled, worker, or income below ₹3,00,000.',
    '4. Free aid includes: assigned lawyer, court fees waived, filing assistance.',
    '5. Urgent matters (detention, bail): DLSA can arrange lawyer within hours.',
    '6. Lok Adalats provide free, fast resolution for civil cases.'
  ]},
  legalRights: ['Article 39A: Constitutional guarantee of free legal aid.','Legal Services Authorities Act 1987: Right to free legal services for eligible persons.','Lok Adalat decisions are final and binding.'],
  laws: [{ name: 'Legal Services Authorities Act, 1987' }, { name: 'Article 39A' }],
  govSchemes: [{ name: 'NALSA Free Legal Aid', description: 'Free lawyer and court fees.', url: 'https://nalsa.gov.in' }, { name: 'Tele-Law', description: 'Free legal advice via video call at CSCs.' }],
  ngos: [{ name: 'HRLN', focus: 'Pro-bono legal aid' }],
  emergencyMessage: 'I need legal help and cannot afford a lawyer. Please help me contact NALSA (15100).'
}
```

### CATEGORY 15: Education Support

```javascript
{
  id: 'education_support', severity: 'medium',
  triggers: ['can\'t afford school','can\'t afford college','need scholarship','school not admitting','denied admission','right to education','free education','scholarship for poor','education for underprivileged','drop out help'],
  helplines: [],
  immediateAction: { title: 'Education is a fundamental right', steps: [
    '1. RTE Act: Every child 6-14 has right to FREE compulsory education.',
    '2. Private schools MUST reserve 25% seats for EWS under RTE.',
    '3. Apply at National Scholarship Portal (scholarships.gov.in).',
    '4. Visit nearest CSC for application help.',
    '5. Post-Matric Scholarships cover tuition, maintenance, books for SC/ST/OBC/Minority.'
  ]},
  legalRights: ['RTE Act 2009: Free compulsory education ages 6-14.','25% EWS reservation in private schools.','No child expelled or held back until Class 8.','No capitation fees or screening at elementary level.'],
  laws: [{ name: 'RTE Act, 2009' }, { name: 'Article 21A' }],
  govSchemes: [{ name: 'National Scholarship Portal', description: 'All government scholarships.', url: 'https://scholarships.gov.in' }, { name: 'NMMS', description: '₹12,000/year for meritorious EWS students Class 9-12.' }],
  ngos: [{ name: 'Teach For India', focus: 'Quality education' }, { name: 'Pratham', focus: 'Foundational literacy' }],
  emergencyMessage: 'I need help accessing education/scholarships. Can you help explore government schemes?'
}
```

### CATEGORY 16: Workplace Harassment / Labor Rights

```javascript
{
  id: 'workplace_harassment', severity: 'high',
  triggers: ['sexual harassment at work','boss harassing me','posh complaint','workplace harassment','not paying salary','not paying minimum wage','forced to work overtime','fired unfairly','wrongful termination','labor rights','hostile work environment','inappropriate touching at work'],
  helplines: [{ name: 'Women Helpline', number: '181', timing: '24/7' }],
  immediateAction: { title: 'You have strong legal protection at work', steps: [
    '1. Sexual harassment: File with Internal Complaints Committee (ICC) if company has 10+ employees.',
    '2. No ICC: File with Local Complaints Committee via district officer.',
    '3. Central govt: Use SHe-Box portal (shebox.nic.in).',
    '4. Unpaid wages: Complaint to Labour Commissioner.',
    '5. Register on E-Shram (eshram.gov.in) if unorganized worker.',
    '6. Document everything — emails, messages, witnesses.',
    '7. Employer CANNOT retaliate for filing a complaint.'
  ]},
  legalRights: ['POSH Act 2013: Organizations with 10+ employees MUST have ICC.','ICC must complete inquiry within 90 days.','Minimum Wages Act: Failure to pay minimum wage is criminal.','Equal Remuneration Act: Equal pay for equal work regardless of gender.'],
  laws: [{ name: 'POSH Act, 2013' }, { name: 'Minimum Wages Act, 1948' }],
  govSchemes: [{ name: 'E-Shram Portal', description: '₹2 Lakh insurance for unorganized workers.', url: 'https://eshram.gov.in' }, { name: 'SHe-Box', description: 'Online workplace harassment complaints.', url: 'https://shebox.nic.in' }],
  ngos: [{ name: 'Martha Farrell Foundation', focus: 'POSH compliance' }],
  emergencyMessage: 'I am facing harassment/rights violation at work and need help filing a complaint.'
}
```

### CATEGORY 17: Farmer Distress

```javascript
{
  id: 'farmer_distress', severity: 'high',
  triggers: ['crop failed','crop failure','drought','farm loan','farmer debt','farmer suicide','can\'t pay farm loan','agricultural distress','crop destroyed','pest attack','flood destroyed crop','not getting fair price','farmer help','kisan help'],
  helplines: [{ name: 'Kisan Call Center', number: '1800-180-1551', timing: 'Toll-free, 6 AM - 10 PM' }, { name: 'KIRAN Mental Health', number: '1800-599-0019', timing: '24/7 Toll-free' }],
  immediateAction: { title: 'Support is available for farmers', steps: [
    '1. Call Kisan Call Center (1800-180-1551) — toll-free, local languages.',
    '2. Crop loss: File PMFBY claim within 72 hours.',
    '3. Debt: Contact bank about restructuring. Banks cannot use coercive recovery.',
    '4. Apply for PM-KISAN (₹6,000/year) at pmkisan.gov.in.',
    '5. Get Kisan Credit Card for 4% interest credit.',
    '6. Emotional distress: Call KIRAN (1800-599-0019).',
    '7. Visit nearest Krishi Vigyan Kendra for free agricultural advice.'
  ]},
  legalRights: ['Banks cannot use coercive recovery against farmers.','PMFBY premiums subsidized to 1.5-2%.','Right to sell produce at any market — not restricted to mandis.'],
  laws: [{ name: 'PMFBY Guidelines' }, { name: 'RBI Agricultural Lending Guidelines' }],
  govSchemes: [{ name: 'PM-KISAN', description: '₹6,000/year income support.', url: 'https://pmkisan.gov.in' }, { name: 'PM Fasal Bima Yojana', description: 'Crop insurance at subsidized premiums.', url: 'https://pmfby.gov.in' }, { name: 'Kisan Credit Card', description: '4% interest short-term credit.' }],
  ngos: [{ name: 'PRADAN', focus: 'Rural livelihoods' }],
  emergencyMessage: 'A farmer is in severe distress. Please contact Kisan Call Center (1800-180-1551) or KIRAN (1800-599-0019).'
}
```

### CATEGORY 18: Dowry Harassment (Dedicated)

```javascript
{
  id: 'dowry', severity: 'high',
  triggers: ['dowry demand','demanding dowry','dowry harassment','in-laws demanding money','husband demanding dowry','dowry death','bride burning','in-laws threatening for dowry','dowry torture'],
  helplines: [{ name: 'Women Helpline', number: '1091', timing: '24/7' }, { name: 'Domestic Abuse', number: '181', timing: '24/7' }, { name: 'National Emergency', number: '112', timing: '24/7' }],
  immediateAction: { title: 'Dowry is a serious criminal offense', steps: [
    '1. Giving or taking dowry is ILLEGAL. You are the victim.',
    '2. Call 1091 or 181 for support.',
    '3. File FIR at nearest station or Crime Against Women Cell.',
    '4. Retain ALL evidence: messages, call recordings, receipts, bank records.',
    '5. Seek Protection Order under PWDVA.',
    '6. Free legal aid: NALSA (15100).',
    '7. If in physical danger, call 112.'
  ]},
  legalRights: ['Dowry Prohibition Act: minimum 5 years + ₹15,000 fine.','BNS Section 85: Cruelty for dowry — up to 3 years.','BNS Section 80: Dowry death — 7 years to life.','Burden of proof shifts to accused in dowry death cases.','Right to reside in shared household under PWDVA.'],
  laws: [{ name: 'Dowry Prohibition Act, 1961' }, { name: 'BNS Section 85', formerly: 'IPC 498A' }, { name: 'BNS Section 80', formerly: 'IPC 304B' }],
  govSchemes: [{ name: 'One Stop Centre (Sakhi)', description: 'Integrated support in every district.' }],
  ngos: [{ name: 'All India Women\'s Conference', focus: 'Anti-dowry advocacy' }],
  emergencyMessage: 'I am being harassed for dowry. Please contact Women Helpline (1091) or Police (112) immediately.'
}
```

---

## UI RENDERING RULES FOR CRISIS CARDS

- **CRISIS_HELPLINE**: Large phone number (32px+ font). Full-width call button. ALWAYS `required` permission.
- **CRISIS_ACTION**: Red gradient background for `critical`, amber for `high`, blue for `medium`. Numbered steps.
- **CRISIS_LEGAL**: Accordion — each right expandable. Plain language starting with "You have the right to..."
- **CRISIS_SCHEMES**: Sub-cards per scheme with Name, Description, "Learn More" link.
- **CRISIS_NGO**: List with "Get Directions" Maps links.
- **CRISIS_LOCATION**: Large "Share My Location" button → opens WhatsApp with Google Maps coordinates.

## TONE RULES

- **Warm and human** — never robotic.
- **Empowering** — "You have the right to..." not "The law states..."
- **Non-judgmental** — especially for mental health, LGBTQ+, domestic violence.
- **Honest** — "LifePilot cannot call anyone for you. Only your tap places the call."
- **Never diagnose.** Direct to professionals.
- **Never assume gender.** DV resources cover ALL genders.
- **All helpline numbers are REAL AND VERIFIED.**
- **Permission is ABSOLUTE.** No auto-dial, auto-message, or auto-share.
- **100% offline.** Entire crisis DB is hardcoded in JS.

---

*LifePilot — because the most important intent someone ever types might be the one that saves their life.*
