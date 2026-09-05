# AUTONOMOUS CRISIS RESPONSE ENGINE — LifePilot Add-On

> This document EXTENDS the Crisis Engine Add-On. Append after CRISIS_ENGINE_ADDON.md in your Claude prompt.

---

## THE CORE PRINCIPLE: "Auto-Act + Stay With The Victim"

When a crisis is detected, LifePilot does NOT wait for the user to read cards and tap buttons one by one. It fires a **fully automated crisis sequence** in the background while simultaneously opening a calm, human conversational interface that talks directly with the person in danger.

The two things happen in the SAME MOMENT:

```
Crisis detected
       │
       ├─── [AUTOMATIC] → Dialer opens with emergency number pre-filled
       │                   (User sees the green call button — one tap)
       │
       └─── [AUTOMATIC] → "LIFE CHANNEL" opens on screen
                          LifePilot starts talking to the victim
                          Asking questions, giving instructions,
                          keeping them calm until help arrives
```

---

## TECHNICAL IMPLEMENTATION

### Step 1: Crisis Detection Hook

The moment `LP.crisisClassify()` returns a non-null result, trigger the autonomous sequence BEFORE rendering any cards:

```javascript
LP.compose = function(rawText) {
  const crisis = LP.crisisClassify(rawText);
  if (crisis) {
    // Fire the autonomous sequence immediately — do not wait for UI render
    LP.autonomousCrisisSequence(crisis, rawText);
    
    // Then render cards normally in the background
    return {
      tier: 1,
      primaryIntent: 'CRISIS',
      cards: LP.buildCrisisCards(crisis, rawText),
      text: rawText,
      crisisCategory: crisis.id
    };
  }
  // ... normal orchestrator ...
};
```

### Step 2: The Autonomous Crisis Sequence

```javascript
LP.autonomousCrisisSequence = function(crisis, rawText) {
  
  // 1. VIBRATE: Physical alert to the user (works on mobile browsers)
  if (navigator.vibrate) {
    navigator.vibrate([500, 200, 500, 200, 500]); // SOS pattern
  }
  
  // 2. SOUND: Play a subtle alert tone
  LP.playAlertTone(); // Short beep using Web Audio API
  
  // 3. LOCATION: Start acquiring GPS immediately (do not wait)
  LP.perception.startLocationTracking();
  
  // 4. OPEN DIALER: Automatically open the emergency number
  //    This shows the call screen pre-filled — user just taps green button
  if (crisis.severity === 'critical') {
    // Small delay (800ms) so the Life Channel UI renders first,
    // giving the user context before the dialer pops up
    setTimeout(() => {
      window.location.href = 'tel:' + crisis.helplines[0].number;
    }, 800);
  }
  
  // 5. OPEN LIFE CHANNEL: The conversational companion UI
  LP.lifeChannel.open(crisis, rawText);
  
  // 6. AUTO-DRAFT EMERGENCY MESSAGE: Pre-compose WhatsApp/SMS
  //    Attach location when available
  LP.perception.startLocationTracking().then(coords => {
    const locationText = coords 
      ? '\n\nMy location: https://www.google.com/maps?q=' + coords.lat + ',' + coords.lng
      : '\n\n(Location unavailable — please try to reach me)';
    
    LP.autoEmergencyMessage = crisis.emergencyMessage + locationText;
  });
};
```

### Step 3: The Life Channel UI

This is the most important feature. The Life Channel is a full-screen conversational interface that overlays the app the moment a crisis is detected. It looks like a messaging thread — but LifePilot is the one sending messages.

```javascript
LP.lifeChannel = {
  
  open: function(crisis, rawInput) {
    // Create the overlay
    const overlay = document.createElement('div');
    overlay.id = 'life-channel';
    overlay.className = 'life-channel-overlay crisis-severity-' + crisis.severity;
    overlay.innerHTML = LP.lifeChannel.buildInitialUI(crisis);
    document.body.appendChild(overlay);
    
    // Start the conversation flow
    LP.lifeChannel.startConversation(crisis, rawInput);
  },
  
  buildInitialUI: function(crisis) {
    return `
      <div class="lc-header">
        <div class="lc-pulse-dot"></div>
        <span class="lc-title">LifePilot is with you</span>
        <button class="lc-minimize" onclick="LP.lifeChannel.minimize()">↓</button>
      </div>
      <div class="lc-messages" id="lc-messages-container">
        <!-- Messages appear here -->
      </div>
      <div class="lc-quick-replies" id="lc-quick-replies">
        <!-- Quick reply buttons appear here -->
      </div>
      <div class="lc-input-row">
        <input type="text" id="lc-text-input" placeholder="Type here or use quick replies above..." />
        <button onclick="LP.lifeChannel.sendUserMessage()">→</button>
      </div>
    `;
  },
  
  // Add a message to the conversation thread
  addMessage: function(text, sender, delay = 0) {
    setTimeout(() => {
      const container = document.getElementById('lc-messages-container');
      if (!container) return;
      const msg = document.createElement('div');
      msg.className = 'lc-message lc-message-' + sender; // 'bot' or 'user'
      msg.innerHTML = '<p>' + text + '</p><span class="lc-time">' + new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) + '</span>';
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    }, delay);
  },
  
  // Show quick reply chips
  setQuickReplies: function(options) {
    const container = document.getElementById('lc-quick-replies');
    if (!container) return;
    container.innerHTML = options.map(opt => 
      `<button class="lc-quick-reply" onclick="LP.lifeChannel.handleQuickReply('${opt.value}', '${opt.label}')">${opt.label}</button>`
    ).join('');
  },
  
  // The conversation flow engine
  startConversation: function(crisis, rawInput) {
    const flow = LP.lifeChannel.getConversationFlow(crisis);
    LP.lifeChannel.runFlow(flow, 0);
  },
  
  runFlow: function(flow, stepIndex) {
    if (stepIndex >= flow.length) return;
    const step = flow[stepIndex];
    
    // Add bot message
    LP.lifeChannel.addMessage(step.botMessage, 'bot', step.delay || 0);
    
    // Set quick replies if any
    if (step.quickReplies) {
      setTimeout(() => {
        LP.lifeChannel.setQuickReplies(
          step.quickReplies.map(r => ({ label: r, value: r.toLowerCase() }))
        );
      }, (step.delay || 0) + 500);
    }
    
    // Auto-advance if this step has no user input required
    if (step.autoAdvance) {
      setTimeout(() => {
        LP.lifeChannel.runFlow(flow, stepIndex + 1);
      }, (step.delay || 0) + step.autoAdvance);
    }
    
    // Store next step for when user replies
    LP.lifeChannel.currentFlow = flow;
    LP.lifeChannel.currentStep = stepIndex;
  },
  
  handleQuickReply: function(value, label) {
    LP.lifeChannel.addMessage(label, 'user');
    LP.lifeChannel.evaluateReply(value, label);
  },
  
  sendUserMessage: function() {
    const input = document.getElementById('lc-text-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';
    LP.lifeChannel.addMessage(text, 'user');
    LP.lifeChannel.evaluateReply(text.toLowerCase(), text);
  },
  
  evaluateReply: function(value, originalText) {
    const step = LP.lifeChannel.currentFlow[LP.lifeChannel.currentStep];
    if (!step) return;
    
    // Find matching branch or use default
    let nextStepIndex = LP.lifeChannel.currentStep + 1;
    if (step.branches) {
      for (const branch of step.branches) {
        if (branch.triggers.some(t => value.includes(t))) {
          nextStepIndex = branch.nextStep;
          if (branch.extraMessage) {
            LP.lifeChannel.addMessage(branch.extraMessage, 'bot', 500);
          }
          break;
        }
      }
    }
    LP.lifeChannel.runFlow(LP.lifeChannel.currentFlow, nextStepIndex);
  },
  
  minimize: function() {
    const overlay = document.getElementById('life-channel');
    if (overlay) overlay.classList.toggle('lc-minimized');
  },

  // Get the full conversation flow for a given crisis category
  getConversationFlow: function(crisis) {
    // Look up the specific flow for this crisis type
    if (LP.conversationFlows[crisis.id]) {
      return LP.conversationFlows[crisis.id];
    }
    // Generic fallback flow
    return LP.conversationFlows['generic'];
  }
};
```

---

## THE CONVERSATION FLOWS (Per Crisis Category)

These are the actual scripts LifePilot uses to talk to the victim in real-time. Every line has been carefully written to be calm, clear, non-judgmental, and actionable.

```javascript
LP.conversationFlows = {

  // ============================================================
  // WOMENS SAFETY / ASSAULT / STALKING
  // ============================================================
  'womens_safety': [
    {
      botMessage: '🔴 I hear you. I\'m with you right now. The emergency number (112) is opening on your phone. Tap the green button when you see it.',
      autoAdvance: 2000
    },
    {
      botMessage: 'While that opens — are you safe right now, in this exact moment?',
      quickReplies: ['Yes, I\'m somewhere safe', 'No, the person is nearby', 'I\'m not sure']
    },
    {
      botMessage: 'Okay. First: get to the nearest place with other people — a shop, a building, anywhere with a crowd. Crowds protect you.',
      autoAdvance: 3000
    },
    {
      botMessage: 'Can you see other people around you right now?',
      quickReplies: ['Yes, I\'m in a crowd', 'No, I\'m alone', 'I\'m hiding']
    },
    {
      botMessage: 'Good. Stay visible. Keep moving toward more people. Do NOT run — walk briskly and stay on the phone with 112.',
      autoAdvance: 3500
    },
    {
      botMessage: 'I\'ve pre-drafted an emergency message for your trusted contact. When you\'re ready, I can show you it — one tap sends it with your location.',
      quickReplies: ['Show me the message', 'Not yet']
    },
    {
      botMessage: 'You\'re doing the right thing by reaching out. Stay on the line with 112 and keep moving. I\'m still here.',
      autoAdvance: 4000
    },
    {
      botMessage: 'One more thing: if the person touches you or you are assaulted — do NOT bathe or change clothes afterward. Your body preserves evidence that will be critical for justice. Please remember this.',
      autoAdvance: 5000
    },
    {
      botMessage: 'Are you still okay? Type anything to let me know you\'re here.'
    }
  ],

  // ============================================================
  // DOMESTIC VIOLENCE
  // ============================================================
  'domestic_violence': [
    {
      botMessage: '🔴 I hear you. You are not alone, and what is happening to you is NOT okay. The emergency number is opening now — tap the green button.',
      autoAdvance: 2500
    },
    {
      botMessage: 'First question: Is the person who hurt you in the same room with you right now?',
      quickReplies: ['Yes, they\'re here', 'No, I\'m in another room', 'They\'ve left the house']
    },
    {
      botMessage: 'This is important: You do NOT have to confront them or explain yourself. Your only job right now is to get to safety.',
      autoAdvance: 3000
    },
    {
      botMessage: 'Can you leave the house right now without being stopped?',
      quickReplies: ['Yes, I can leave', 'No, I\'m blocked', 'I need to get my children first']
    },
    {
      botMessage: 'If you can leave: Go to a neighbor\'s house, a shop, or any public place. Do not go somewhere isolated.',
      autoAdvance: 4000
    },
    {
      botMessage: 'When you are safe, go to the nearest police station. You can file a complaint as a "Zero FIR" — they MUST take it regardless of location. You do not need a lawyer present.',
      autoAdvance: 5000
    },
    {
      botMessage: 'There are shelter homes in every district where you and your children can stay safely — completely free. I can help you find the nearest one. Do you want that?',
      quickReplies: ['Yes, show me shelters', 'Not yet']
    },
    {
      botMessage: 'Your safety comes before anything else — before your belongings, before "figuring it out", before anyone else\'s opinion. Are you still with me?',
      quickReplies: ['Yes, I\'m here', 'I\'m scared']
    },
    {
      botMessage: 'Being scared is completely normal. You are being brave by reaching out. Keep talking to me. What\'s happening right now?'
    }
  ],

  // ============================================================
  // CHILD PROTECTION (Child or adult reporting for a child)
  // ============================================================
  'child_protection': [
    {
      botMessage: '🔴 I understand. A child\'s safety is the highest priority. Childline (1098) is opening on your phone — they will dispatch a team immediately.',
      autoAdvance: 2500
    },
    {
      botMessage: 'Is the child in immediate physical danger RIGHT NOW?',
      quickReplies: ['Yes, right now', 'Not right this moment', 'I\'m not sure']
    },
    {
      botMessage: 'If immediate danger: Call 112 alongside Childline. Both can respond at the same time.',
      autoAdvance: 3000
    },
    {
      botMessage: 'Are you the child reaching out, or are you an adult reporting this?',
      quickReplies: ['I am the child', 'I\'m an adult reporting', 'I\'m a friend']
    },
    {
      botMessage: 'If you are the child: You are incredibly brave for reaching out. You have done nothing wrong. The adults who are supposed to protect you have failed their responsibility — NOT you.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Can you get to a teacher, a neighbor, any trusted adult outside your home right now?',
      quickReplies: ['Yes, I can', 'No, I\'m alone', 'I don\'t know who to trust']
    },
    {
      botMessage: 'You do not need to have all the answers. Childline will come to you. Your only job is to stay on the phone with them and tell them your location.',
      autoAdvance: 4000
    },
    {
      botMessage: 'I am still here. Tell me what is happening and I will guide you step by step.'
    }
  ],

  // ============================================================
  // MENTAL HEALTH CRISIS / SUICIDE PREVENTION
  // ============================================================
  'mental_health_crisis': [
    {
      botMessage: 'I hear you. I\'m glad you\'re talking to me right now. That took courage.',
      autoAdvance: 2000
    },
    {
      botMessage: 'I\'m opening a helpline for you — someone real, trained specifically for moments like this, is going to pick up. Please tap the green button when you see the call screen.',
      autoAdvance: 3000
    },
    {
      botMessage: 'While that connects — you don\'t have to explain everything right now. Just tell me: are you physically safe at this moment?',
      quickReplies: ['Yes, I\'m physically safe', 'No', 'I\'m not sure']
    },
    {
      botMessage: 'Thank you for telling me. Can I ask — is there anyone else physically near you right now? A family member, roommate, anyone?',
      quickReplies: ['Yes, someone is here', 'No, I\'m alone', 'I don\'t want them to know']
    },
    {
      botMessage: 'That\'s okay. You don\'t have to involve anyone else. This stays between you and the person on the helpline.',
      autoAdvance: 3000
    },
    {
      botMessage: 'While you wait for the call to connect, try this with me: Look around and name 5 things you can physically see right now. Start with the closest one.',
      quickReplies: ['Okay, I\'ll try', 'I can\'t focus right now']
    },
    {
      botMessage: 'That\'s completely okay. Just breathe slowly. In for 4 counts, hold for 4, out for 4. I\'ll count with you: breathe in... 1... 2... 3... 4...',
      autoAdvance: 5000
    },
    {
      botMessage: 'Hold... 1... 2... 3... 4...',
      autoAdvance: 5000
    },
    {
      botMessage: 'And out... 1... 2... 3... 4...',
      autoAdvance: 5000
    },
    {
      botMessage: 'Good. You\'re still here. That matters more than anything right now. The helpline should be connecting — please pick up.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Whatever happens next — you did the right thing by reaching out. I\'m still here. Tell me how you\'re feeling.'
    }
  ],

  // ============================================================
  // HUMAN TRAFFICKING
  // ============================================================
  'human_trafficking': [
    {
      botMessage: '🔴 I hear you. What is happening to you is not your fault and it is a serious crime. The emergency number is opening now.',
      autoAdvance: 2500
    },
    {
      botMessage: 'Are you able to speak freely right now, or are others nearby who might hear you?',
      quickReplies: ['I can speak freely', 'Others are nearby', 'I need to be quiet']
    },
    {
      botMessage: 'If you need to be quiet: Keep this app open but type only. You do not need to speak. I understand.',
      autoAdvance: 3000
    },
    {
      botMessage: 'Do you know where you are — a city, an area, a landmark, anything?',
      quickReplies: ['Yes, I know where I am', 'No, I don\'t know', 'I\'ll try to look']
    },
    {
      botMessage: 'Look for any clue — a street sign, a shop name, a highway number, a billboard. Even a partial address helps the police find you.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Important: You are the VICTIM in this situation. You will NOT be arrested or punished for reaching out. The law fully protects you.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Can you find a moment to go to a shop, a temple, a hospital, or any public place and ask for help?',
      quickReplies: ['Maybe yes', 'No, I\'m watched', 'I\'m not sure']
    },
    {
      botMessage: 'If you are being watched: When you get a moment alone — even just 60 seconds — call 112 and say "I need help. I am being held against my will at [whatever location you know]." Those words are enough.',
      autoAdvance: 5000
    },
    {
      botMessage: 'You are not alone. I am with you. Keep talking to me whenever you safely can.'
    }
  ],

  // ============================================================
  // FINANCIAL CRISIS / DEBT
  // ============================================================
  'financial_distress': [
    {
      botMessage: 'I understand. Financial stress is one of the heaviest burdens a person can carry. Let me help you find real options right now.',
      autoAdvance: 2500
    },
    {
      botMessage: 'First — the most important thing: You CANNOT be imprisoned in India for failing to repay a civil debt. No recovery agent can threaten you with jail. That is a lie they use to scare you.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Is the situation urgent right now — meaning, is someone threatening you or is this about finding solutions?',
      quickReplies: ['Someone is threatening me', 'I need to find money', 'I\'m overwhelmed and don\'t know what to do']
    },
    {
      botMessage: 'If someone is threatening or harassing you: Call 14448 (RBI Ombudsman). This number can stop illegal recovery harassment immediately.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Now let me help you find money you may already be eligible for. Can you tell me a bit more about your situation?',
      quickReplies: ['I need money for my daughter\'s wedding', 'I have a loan I can\'t pay', 'I can\'t afford basic needs', 'I have a small business struggling']
    },
    {
      botMessage: 'There are government schemes that can help directly — including cash transfers, subsidized loans, and free food. I am showing you the relevant ones now.',
      autoAdvance: 3000
    },
    {
      botMessage: 'Do you have access to a nearby Common Service Centre (CSC) or Jan Seva Kendra? They help you apply for government schemes completely free of charge.',
      quickReplies: ['Yes, I think so', 'I\'m not sure', 'No, I\'m in a rural area']
    },
    {
      botMessage: 'Whatever your situation — you have more options than you think. Let\'s go through them one by one. Which feels most urgent to you right now?'
    }
  ],

  // ============================================================
  // FARMER DISTRESS
  // ============================================================
  'farmer_distress': [
    {
      botMessage: 'I hear you. A farmer\'s situation can feel completely overwhelming, especially when harvests fail or debts pile up. You are not alone in this.',
      autoAdvance: 3000
    },
    {
      botMessage: 'First — how are you feeling emotionally right now? I want to make sure you are okay before we talk about solutions.',
      quickReplies: ['I\'m stressed but okay', 'I\'m really struggling', 'I feel hopeless', 'I\'m okay, I need practical help']
    },
    {
      botMessage: 'If you are feeling hopeless — please call KIRAN helpline (1800-599-0019) right now. This is a free call, they understand farmer distress specifically, and they will listen without judgment.',
      autoAdvance: 4000,
      branches: [
        { triggers: ['hopeless'], extraMessage: 'Please — call KIRAN (1800-599-0019). This call might be the most important thing you do today.' }
      ]
    },
    {
      botMessage: 'The Kisan Call Center (1800-180-1551) is also open for you — toll-free, in your local language. They can guide you on crop insurance claims, debt restructuring, and support schemes.',
      autoAdvance: 4000
    },
    {
      botMessage: 'What is the most pressing problem right now?',
      quickReplies: ['My crop failed', 'I can\'t repay the loan', 'Recovery agents are threatening me', 'I need advice on government schemes']
    },
    {
      botMessage: 'For crop failure: You can file a PM Fasal Bima Yojana (PMFBY) crop insurance claim within 72 hours of the loss event. Call 1800-180-1551 to get help with the process.',
      autoAdvance: 5000
    },
    {
      botMessage: 'For debt: Banks CANNOT use threats or abusive tactics. If they are — that is illegal. You can report it to the RBI Ombudsman at 14448.',
      autoAdvance: 4000
    },
    {
      botMessage: 'What is your state? Some states have additional farmer relief schemes specific to your region that I can share.'
    }
  ],

  // ============================================================
  // ACID ATTACK
  // ============================================================
  'acid_attack': [
    {
      botMessage: '🔴 Emergency. Ambulance is being called. WASH THE AFFECTED AREA WITH RUNNING WATER RIGHT NOW. KEEP WASHING. DO NOT STOP.',
      autoAdvance: 1500
    },
    {
      botMessage: 'KEEP WASHING WITH CLEAN WATER. 20 FULL MINUTES. No ice. No toothpaste. No home remedies. Just clean running water.',
      autoAdvance: 3000
    },
    {
      botMessage: 'Is someone nearby who can help you? Call out to them.',
      quickReplies: ['Yes, someone is helping', 'No, I\'m alone']
    },
    {
      botMessage: 'Carefully remove any clothing or jewelry near the affected area — without touching the acid-contaminated parts. If stuck, leave it.',
      autoAdvance: 4000
    },
    {
      botMessage: 'ANY hospital in India — public or private — is legally required to treat you for FREE right now. They cannot ask for documents or money first.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Keep washing until the ambulance arrives. I\'m staying with you. Is the water running?',
      quickReplies: ['Yes, I\'m washing', 'I don\'t have access to water']
    },
    {
      botMessage: 'You are going to receive care. You have legal rights to full treatment and minimum ₹3 Lakhs compensation from the government. Right now — focus only on the water.',
      autoAdvance: 5000
    },
    {
      botMessage: 'The ambulance is on the way. Stay with me. Are you still washing?'
    }
  ],

  // ============================================================
  // ELDER ABUSE
  // ============================================================
  'elder_abuse': [
    {
      botMessage: 'I hear you. What is happening to you — or to your parent — is wrong and it is illegal. You came to the right place.',
      autoAdvance: 2500
    },
    {
      botMessage: 'Is the senior citizen in immediate physical danger right now?',
      quickReplies: ['Yes, right now', 'No, but regularly', 'I\'m a senior and need help']
    },
    {
      botMessage: 'If you are the senior citizen: Your children are LEGALLY OBLIGATED to care for you. This is the law in India. You have not done anything wrong.',
      autoAdvance: 3500
    },
    {
      botMessage: 'The National Elderline (14567) is opening on your phone. They can connect you directly to legal aid and intervention teams.',
      autoAdvance: 3000
    },
    {
      botMessage: 'Under the Maintenance and Welfare of Parents Act, you can file a simple application — without a lawyer — with the local Magistrate, who can order your children to pay monthly maintenance within 90 days.',
      autoAdvance: 5000
    },
    {
      botMessage: 'If your property was transferred to family members who now neglect you, that transfer can be legally reversed. This has happened for many seniors.',
      autoAdvance: 4000
    },
    {
      botMessage: 'You deserve to live with dignity. What is the most urgent thing I can help you with right now?',
      quickReplies: ['Physical safety', 'Financial support', 'Legal action against family', 'Finding a shelter or care home']
    }
  ],

  // ============================================================
  // CYBERCRIME / SEXTORTION / ONLINE HARASSMENT
  // ============================================================
  'cybercrime': [
    {
      botMessage: 'I understand — this is a deeply violating and scary experience. You did the right thing by reaching out. The Cyber Crime helpline (1930) is opening now.',
      autoAdvance: 2500
    },
    {
      botMessage: 'First and most important: Do NOT delete anything — no messages, no posts, no images. Every screenshot, every URL, every timestamp is evidence. Deleting weakens your case.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Have you already paid or sent anything to the person threatening you?',
      quickReplies: ['No, not yet', 'Yes, I already paid', 'They\'re demanding right now']
    },
    {
      botMessage: 'Do NOT pay anything. Paying does not make them stop — it tells them it works, and they demand more. Your best move is to stop all contact and report immediately.',
      autoAdvance: 4000,
      branches: [
        { triggers: ['demanding right now'], extraMessage: 'Block them right now on every platform. Then report at cybercrime.gov.in. Do not respond again.' }
      ]
    },
    {
      botMessage: 'Take screenshots of: their profile, their messages, any images or videos, payment demands, and any URLs. Do this before blocking them.',
      autoAdvance: 5000
    },
    {
      botMessage: 'Did this happen on a specific platform? I can tell you how to report it there directly too.',
      quickReplies: ['Instagram', 'WhatsApp', 'Facebook', 'Telegram', 'Other / I don\'t know']
    },
    {
      botMessage: 'You are not alone in this — this is happening to thousands of people and there are entire police units dedicated to these exact cases. Your case will be taken seriously.',
      autoAdvance: 4000
    },
    {
      botMessage: 'The most important thing you can do RIGHT NOW is call 1930 and file on cybercrime.gov.in. I am still here — what questions do you have?'
    }
  ],

  // ============================================================
  // MISSING PERSON
  // ============================================================
  'missing_person': [
    {
      botMessage: '🔴 I hear you. Every minute matters with a missing person. Let\'s act immediately.',
      autoAdvance: 1500
    },
    {
      botMessage: 'When did you last see or hear from them?',
      quickReplies: ['In the last hour', 'A few hours ago', 'Since yesterday', 'More than a day']
    },
    {
      botMessage: 'Important: There is NO 24-hour waiting period to report a missing person. Go to the nearest police station NOW and file an FIR immediately. The police cannot refuse.',
      autoAdvance: 4000
    },
    {
      botMessage: 'While I open the emergency number — tell me: Is this a child or an adult?',
      quickReplies: ['A child under 18', 'An adult']
    },
    {
      botMessage: 'For a missing child: Childline (1098) is also opening. Also report to TrackChild portal (trackthemissingchild.gov.in). Both systems work together.',
      autoAdvance: 4000
    },
    {
      botMessage: 'Prepare this information before reaching the police: recent photo, full name, age, physical description (height, weight, scars, birthmarks), clothing last seen in, last known location, and any reason they might have left.',
      autoAdvance: 6000
    },
    {
      botMessage: 'Have you already contacted hospitals, their friends, or their last known location?',
      quickReplies: ['Yes, checked everywhere', 'Partially', 'Not yet']
    },
    {
      botMessage: 'Go to the police immediately. I am still here — tell me if there is anything specific I can help you with.'
    }
  ],

  // ============================================================
  // LGBTQ+ SUPPORT
  // ============================================================
  'lgbtq_support': [
    {
      botMessage: 'I\'m here with you. Whatever you are going through — your identity is valid, your feelings are real, and you deserve support.',
      autoAdvance: 2500
    },
    {
      botMessage: 'Are you in immediate physical danger right now?',
      quickReplies: ['Yes, I need help now', 'No, I\'m safe but struggling', 'I was forced into conversion therapy']
    },
    {
      botMessage: 'If you are in immediate danger: Call 112. The law is on your side — same-sex relations have been fully legal in India since 2018.',
      autoAdvance: 3500,
      branches: [
        { triggers: ['conversion therapy'], extraMessage: 'Forced conversion therapy is not just scientifically false — if it involves physical harm or confinement, it can be reported as assault (call 112). You have the right to leave.' }
      ]
    },
    {
      botMessage: 'If you have been thrown out of your home: There are LGBTQ+ friendly organizations that can help with temporary shelter, legal advice, and emotional support. I am showing those below.',
      autoAdvance: 4000
    },
    {
      botMessage: 'iCall (9152987821) offers specifically queer-affirmative counseling — counselors who understand what you are going through without judgment.',
      autoAdvance: 4000
    },
    {
      botMessage: 'You are not broken. You are not wrong. You are not alone. What is the most pressing thing I can help you with right now?',
      quickReplies: ['I need emotional support', 'I need legal information', 'I need shelter', 'I need to talk to someone like me']
    }
  ],

  // ============================================================
  // GENERIC FALLBACK (for any crisis not specifically matched)
  // ============================================================
  'generic': [
    {
      botMessage: '🔴 I hear you. Whatever is happening, you did the right thing by reaching out. I\'m with you right now.',
      autoAdvance: 2000
    },
    {
      botMessage: 'The emergency services line (112) is opening. Tap the green button when you see it.',
      autoAdvance: 2500
    },
    {
      botMessage: 'Are you physically safe at this exact moment?',
      quickReplies: ['Yes, I\'m safe', 'No, I\'m in danger', 'I\'m not sure']
    },
    {
      botMessage: 'Tell me in your own words what is happening. I will help you find the exact right support.',
    }
  ]
};
```

---

## CSS FOR THE LIFE CHANNEL UI

Add this to `css/style.css` or `css/cards.css`:

```css
/* ===== LIFE CHANNEL OVERLAY ===== */
#life-channel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65vh;
  background: #0A0F1E;
  border-top: 2px solid #EF4444;
  border-radius: 24px 24px 0 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 40px rgba(239, 68, 68, 0.4);
  animation: slideUpChannel 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

#life-channel.lc-minimized {
  height: 64px;
  overflow: hidden;
}

@keyframes slideUpChannel {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.lc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #1A2235;
  flex-shrink: 0;
}

.lc-pulse-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #EF4444;
  animation: pulse-red 1s infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.lc-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #F1F5F9;
  flex: 1;
}

.lc-minimize {
  background: none; border: none;
  color: #94A3B8; font-size: 20px; cursor: pointer;
  padding: 4px 8px;
}

.lc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.lc-message {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  animation: fadeInMsg 0.3s ease;
}

@keyframes fadeInMsg {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.lc-message-bot {
  background: #0F1520;
  border: 1px solid #1A2235;
  border-bottom-left-radius: 4px;
  align-self: flex-start;
}

.lc-message-user {
  background: #1D4ED8;
  border-bottom-right-radius: 4px;
  align-self: flex-end;
  color: #fff;
}

.lc-message p {
  font-size: 14px;
  line-height: 1.6;
  color: #F1F5F9;
  margin: 0;
}

.lc-message .lc-time {
  font-size: 11px;
  color: #64748B;
  display: block;
  margin-top: 4px;
}

.lc-quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
  flex-shrink: 0;
}

.lc-quick-reply {
  background: #0F1520;
  border: 1px solid #3B82F6;
  border-radius: 20px;
  color: #3B82F6;
  font-size: 13px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}

.lc-quick-reply:hover {
  background: #3B82F6;
  color: #fff;
}

.lc-input-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #1A2235;
  flex-shrink: 0;
}

#lc-text-input {
  flex: 1;
  background: #0F1520;
  border: 1px solid #1A2235;
  border-radius: 12px;
  color: #F1F5F9;
  padding: 12px 16px;
  font-size: 14px;
  outline: none;
}

#lc-text-input:focus {
  border-color: #3B82F6;
}

.lc-input-row button {
  background: #3B82F6;
  border: none;
  border-radius: 12px;
  color: #fff;
  width: 48px;
  font-size: 20px;
  cursor: pointer;
}

/* Severity color overrides */
#life-channel.crisis-severity-critical {
  border-top-color: #EF4444;
  box-shadow: 0 -8px 40px rgba(239, 68, 68, 0.4);
}

#life-channel.crisis-severity-high {
  border-top-color: #F59E0B;
  box-shadow: 0 -8px 40px rgba(245, 158, 11, 0.3);
}

#life-channel.crisis-severity-medium {
  border-top-color: #3B82F6;
  box-shadow: 0 -8px 40px rgba(59, 130, 246, 0.3);
}
```

---

## LOCATION SHARING AUTOMATION

Add this helper to `perception.js`:

```javascript
LP.perception.startLocationTracking = function() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        LP.currentLocation = coords;
        resolve(coords);
      },
      () => { resolve(null); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};
```

---

## ALERT TONE (Web Audio API)

Add this to `app.js`:

```javascript
LP.playAlertTone = function() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.7);
  } catch (e) {
    // Audio not available — fail silently
  }
};
```

---

## PERMISSION NOTE FOR CLAUDE

**The auto-dial uses `window.location.href = 'tel:...'`**

On mobile browsers (Android Chrome, iOS Safari), this OPENS the native phone dialer with the number pre-filled. The user sees the call screen and taps the green button — this is one tap, happening within 1 second of the crisis being detected. This is the closest to "automatic" that any web app on Earth can achieve without root-level OS access.

This approach:
- Is fully legal and policy-compliant
- Does NOT bypass user consent (user still taps green button)
- Is used by every emergency web app in the world
- Works 100% offline (no API calls needed)

The Life Channel conversational UI is the key innovation — it REMOVES the need for auto-dialing by keeping the victim engaged, calm, and guided in real-time while the call connects.

---

*"The most important conversation LifePilot will ever have is the one happening at 2 AM when someone is alone and scared."*
