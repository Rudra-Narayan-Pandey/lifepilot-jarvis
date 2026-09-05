/* ============================================================
   LifePilot — i18n. English + Tamil only, honestly labeled.
   ============================================================ */

LP.i18n = {
  supported: ['en', 'ta'],

  strings: {
    en: {
      appName: 'LifePilot', tagline: 'One Intent. Every Action.',
      placeholderRotation: [
        'Plan a trip to Goa for ₹8000…', 'Remind me to call the dentist tomorrow at 3 PM…',
        'Explain the Pythagorean theorem…', "Tell Mom I'll be late…", 'I just got into a minor accident…'
      ],
      micUnsupported: "Voice input is not supported on this browser.",
      doneAutomatically: 'Auto ✓', needsPermission: 'Requires your approval 🔒',
      sandbox: 'Sandbox', confirmSend: 'Send', confirmReserve: 'Approve',
      cancel: 'Not now', historyEmpty: 'No episodes yet.', historyTitle: 'History',
      settingsTitle: 'Settings', clarifyPrompt: 'One quick thing before I build this —',
      speakNow: 'Listening…', budgetOver: 'Over budget', budgetOk: 'Within budget',
      greetingMorning: 'Good morning', greetingAfternoon: 'Good afternoon', greetingEvening: 'Good evening', greetingNight: 'Good night',
      thinking1: 'Understanding intent…', thinking2: 'Identifying actions…', thinking3: 'Building your plan…'
    },
    ta: {
      appName: 'LifePilot', tagline: 'ஒரு நோக்கம். ஒவ்வொரு செயலும்.',
      placeholderRotation: [
        'கோவாவிற்கு ₹8000-க்கு பயணத் திட்டமிடுங்கள்…', 'நாளை மதியம் 3 மணிக்கு டென்டிஸ்டை அழைக்க நினைவூட்டவும்…',
        'பித்தகோரஸ் தேற்றத்தை விளக்குங்கள்…', 'நான் தாமதமாக வருவேன் என்று அம்மாவிடம் சொல்லுங்கள்…', 'எனக்கு ஒரு சிறிய விபத்து ஏற்பட்டது…'
      ],
      micUnsupported: 'இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.',
      doneAutomatically: 'தானாக ✓', needsPermission: 'உங்கள் அனுமதி தேவை 🔒',
      sandbox: 'சோதனை பகுதி', confirmSend: 'அனுப்பு', confirmReserve: 'அனுமதி',
      cancel: 'இப்போது வேண்டாம்', historyEmpty: 'இன்னும் எபிசோடுகள் இல்லை.', historyTitle: 'வரலாறு',
      settingsTitle: 'அமைப்புகள்', clarifyPrompt: 'இதை உருவாக்குவதற்கு முன் ஒரு விரைவான விஷயம் —',
      speakNow: 'கேட்கிறது…', budgetOver: 'பட்ஜெட்டை மீறியது', budgetOk: 'பட்ஜெட்டிற்குள்',
      greetingMorning: 'காலை வணக்கம்', greetingAfternoon: 'மதிய வணக்கம்', greetingEvening: 'மாலை வணக்கம்', greetingNight: 'இரவு வணக்கம்',
      thinking1: 'நோக்கத்தைப் புரிந்துகொள்கிறது…', thinking2: 'செயல்களை அடையாளம் காண்கிறது…', thinking3: 'உங்கள் திட்டத்தை உருவாக்குகிறது…'
    }
  },

  t(key, lang) {
    const l = this.supported.includes(lang) ? lang : 'en';
    return (this.strings[l] && this.strings[l][key]) || this.strings.en[key] || key;
  },

  speechLangCode(lang) { return lang === 'ta' ? 'ta-IN' : 'en-IN'; }
};
