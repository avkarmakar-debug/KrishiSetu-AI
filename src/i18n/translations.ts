import type { Language } from '../types';

export interface TranslationStrings {
  brand: string;
  tagline: string;
  welcomeHeading: string;
  welcomeSub: string;
  chooseLanguagePrompt: string;
  voiceGreeting: string;
  listenWelcome: string;
  playingAudio: string;
  stopAudio: string;
  continueHome: string;

  // Nav
  navHome: string;
  navCases: string;
  navAlerts: string;
  navAgronomist: string;
  navInsights: string;
  navCheckCrop: string;

  // Home
  homeGreeting: string;
  homePrompt: string;
  btnSnapPhoto: string;
  btnSnapDesc: string;
  btnSpeak: string;
  btnSpeakDesc: string;
  btnMyCases: string;
  btnMyCasesDesc: string;
  alertsRowTitle: string;
  viewAllAlerts: string;
  changeLanguage: string;
  privacyNote: string;

  // New Case
  newCaseTitle: string;
  back: string;
  stepPhotoTitle: string;
  tapToSnap: string;
  uploadOrCamera: string;
  retakePhoto: string;
  trySamplePhotos: string;
  stepVoiceTitle: string;
  tapToSpeak: string;
  recordingNow: string;
  tapToStop: string;
  voiceRecorded: string;
  reRecord: string;
  micUnavailable: string;
  optionalDetails: string;
  districtLabel: string;
  optionalTextPlaceholder: string;
  checkMyCropBtn: string;
  needPhotoOrVoice: string;
  checkingBubble: string;
  checkingSub: string;
  retryBtn: string;

  // Result
  farmerSentLabel: string;
  aiAnswerBadge: string;
  withExpertBadge: string;
  verifiedBadge: string;
  confidenceLabel: string;
  highConfidence: string;
  mediumConfidence: string;
  lowConfidence: string;
  listenInLanguage: string;
  loadingVoice: string;
  actionPlanTitle: string;
  warningSignsTitle: string;
  trustedSourcesTitle: string;
  notSureHeadline: string;
  notSureMessage: string;
  whyEscalated: string;
  expertConsultTitle: string;
  expertConsultDesc: string;
  expertConsultRequested: string;
  requestPriorityConsult: string;
  openAgronomistDemo: string;
  askExpertAnyway: string;
  verifiedByLabel: string;
  agronomistNoteLabel: string;
  checkAnotherCrop: string;

  // My Cases
  myCasesTitle: string;
  myCasesEmpty: string;
  filterAll: string;
  filterAi: string;
  filterExpert: string;
  filterVerified: string;

  // Alerts
  alertsTitle: string;
  alertsSampleLabel: string;
  listenAlerts: string;
  weatherTitle: string;
  pestAlertTitle: string;
  marketPricesTitle: string;
  humidityLabel: string;
  rainChanceLabel: string;
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
  bn: {
    brand: 'KrishiSetu',
    tagline: 'কথা বলুন। ছবি তুলুন। ফসল বাঁচান।',
    welcomeHeading: 'আপনার ফসলের বন্ধু',
    welcomeSub: 'পাতার ছবি তুলুন বা মুখের ভাষায় বলুন — সহজ সমাধান শুনুন আপনার নিজের ভাষায়।',
    chooseLanguagePrompt: 'আপনার ভাষা বেছে নিন',
    voiceGreeting:
      'নমস্কার ও আসসালামু আলাইকুম! আমি কৃষি সেতু, আপনার ফসলের বন্ধু। অসুস্থ পাতার ছবি তুলুন বা কথা বলে জানান, আমি সহজ সমাধান দেব।',
    listenWelcome: 'স্বাগতম বার্তা শুনুন',
    playingAudio: 'শোনানো হচ্ছে...',
    stopAudio: 'থামান',
    continueHome: 'শুরু করুন',

    navHome: 'হোম',
    navCases: 'আমার কেস',
    navAlerts: 'সতর্কতা',
    navAgronomist: 'কৃষিবিদ',
    navInsights: 'তথ্যচিত্র',
    navCheckCrop: 'ফসল পরীক্ষা',

    homeGreeting: 'আজ আপনার ফসলের কী অবস্থা?',
    homePrompt: 'লিখতে হবে না — শুধু ছবি তুলুন বা মুখে বলুন।',
    btnSnapPhoto: 'ছবি তুলুন',
    btnSnapDesc: 'অসুস্থ পাতা বা গাছের কাছ থেকে ছবি দিন',
    btnSpeak: 'কথা বলুন',
    btnSpeakDesc: 'আপনার নিজের ভাষায় সমস্যাটি বলুন',
    btnMyCases: 'আমার কেসসমূহ',
    btnMyCasesDesc: 'আগের পরীক্ষা ও কৃষিবিদের পরামর্শ দেখুন',
    alertsRowTitle: 'আজকের স্থানীয় তথ্য (নমুনা)',
    viewAllAlerts: 'সব দেখুন',
    changeLanguage: 'ভাষা পরিবর্তন',
    privacyNote:
      'গোপনীয়তা: আপনার ছবি ও কণ্ঠস্বর শুধুমাত্র ফসলের রোগ নির্ণয়ের জন্য ব্যবহৃত হয়। ড্যাশবোর্ডে কোনো ব্যক্তিগত তথ্য দেখানো হয় না।',

    newCaseTitle: 'নতুন ফসল পরীক্ষা',
    back: 'ফিরুন',
    stepPhotoTitle: '১. অসুস্থ পাতার ছবি দিন',
    tapToSnap: 'ক্যামেরা দিয়ে ছবি তুলুন',
    uploadOrCamera: 'কাছ থেকে পরিষ্কার আলোয় পাতার ছবি তুলুন',
    retakePhoto: 'নতুন ছবি তুলুন',
    trySamplePhotos: 'দ্রুত পরীক্ষার জন্য নমুনা ছবি:',
    stepVoiceTitle: '২. মুখে সমস্যা বলুন (ভয়েস নোট)',
    tapToSpeak: 'চাপ দিন এবং কথা বলুন',
    recordingNow: 'রেকর্ড হচ্ছে... বলুন',
    tapToStop: 'বলা শেষ হলে থামান',
    voiceRecorded: 'আপনার কথা রেকর্ড হয়েছে',
    reRecord: 'আবার বলুন',
    micUnavailable: 'মাইক্রোফোন পাওয়া যায়নি। ছবি তুলে বা নিচে লিখে এগিয়ে যান।',
    optionalDetails: 'অতিরিক্ত তথ্য (না দিলেও চলবে)',
    districtLabel: 'আপনার জেলা',
    optionalTextPlaceholder: 'চাইলে দু-এক কথা লিখতে পারেন (বাধ্যতামূলক নয়)',
    checkMyCropBtn: 'আমার ফসল পরীক্ষা করুন',
    needPhotoOrVoice: 'অনুগ্রহ করে অন্তত একটি ছবি তুলুন অথবা কথা রেকর্ড করুন।',
    checkingBubble: 'পেয়েছি! আপনার ফসল পরীক্ষা করছি...',
    checkingSub: 'BRRI, BARI ও FAO নির্দেশিকা মিলিয়ে দেখা হচ্ছে',
    retryBtn: 'আবার চেষ্টা করুন',

    farmerSentLabel: 'আপনার পাঠানো তথ্য',
    aiAnswerBadge: 'AI পরামর্শ',
    withExpertBadge: 'কৃষিবিদের কাছে আছে',
    verifiedBadge: 'কৃষিবিদ দ্বারা যাচাইকৃত',
    confidenceLabel: 'নিশ্চয়তার মাত্রা',
    highConfidence: 'উচ্চ নিশ্চয়তা',
    mediumConfidence: 'মাঝারি নিশ্চয়তা',
    lowConfidence: 'কম নিশ্চয়তা — যাচাই প্রয়োজন',
    listenInLanguage: 'বাংলায় শুনুন',
    loadingVoice: 'কণ্ঠস্বর তৈরি হচ্ছে...',
    actionPlanTitle: 'আপনার করণীয় ধাপ',
    warningSignsTitle: 'সতর্কতার লক্ষণ',
    trustedSourcesTitle: 'বিশ্বস্ত উৎস',
    notSureHeadline: 'পুরোপুরি নিশ্চিত নই',
    notSureMessage:
      'কোনো ঝুঁকিপূর্ণ পরামর্শ না দিয়ে আপনার কেসটি একজন প্রকৃত কৃষিবিদের কাছে পাঠানো হয়েছে। তিনি যাচাই করে সঠিক সমাধান পাঠাবেন।',
    whyEscalated: 'কেন কৃষিবিদের কাছে পাঠানো হলো:',
    expertConsultTitle: 'অগ্রাধিকার কৃষিবিদ পরামর্শ (BDT 20–50 · নমুনা)',
    expertConsultDesc: 'দ্রুত সরাসরি বিশেষজ্ঞের মতামতের জন্য অনুরোধ করুন (কোনো টাকা কাটবে না — ডেমো)।',
    expertConsultRequested: 'অগ্রাধিকার অনুরোধ পাঠানো হয়েছে (ডেমো)',
    requestPriorityConsult: 'অগ্রাধিকার যাচাই চান (BDT 20–50 ডেমো)',
    openAgronomistDemo: 'কৃষিবিদ রিভিউ কিউ খুলুন (ডেমো)',
    askExpertAnyway: 'কৃষিবিদ দিয়ে পুনরায় যাচাই করান',
    verifiedByLabel: 'যাচাই করেছেন',
    agronomistNoteLabel: 'কৃষিবিদের বিশেষ পরামর্শ',
    checkAnotherCrop: 'আরেকটি ফসল পরীক্ষা করুন',

    myCasesTitle: 'আমার কেসসমূহ',
    myCasesEmpty: 'এখনো কোনো ফসল পরীক্ষা করা হয়নি।',
    filterAll: 'সব',
    filterAi: 'AI পরামর্শ',
    filterExpert: 'কৃষিবিদের কাছে',
    filterVerified: 'যাচাইকৃত',

    alertsTitle: 'আবহাওয়া, পোকা ও বাজারদর',
    alertsSampleLabel: 'নমুনা তথ্য (Sample data) — লাইভ BMD, DAE ও DAM API যুক্ত করার জন্য প্রস্তুত',
    listenAlerts: 'আজকের সতর্কতা শুনুন',
    weatherTitle: 'আবহাওয়া বার্তা',
    pestAlertTitle: 'পোকা ও রোগের সতর্কতা',
    marketPricesTitle: 'স্থানীয় বাজারদর',
    humidityLabel: 'আর্দ্রতা',
    rainChanceLabel: 'বৃষ্টির সম্ভাবনা',
  },

  hi: {
    brand: 'KrishiSetu',
    tagline: 'बोलें। फोटो खींचें। फसल बचाएं।',
    welcomeHeading: 'आपकी फसल का साथी',
    welcomeSub: 'बीमार पत्ते की फोटो भेजें या अपनी भाषा में बोलें — तुरंत आसान सलाह सुनें।',
    chooseLanguagePrompt: 'अपनी भाषा चुनें',
    voiceGreeting:
      'नमस्ते! मैं कृषि सेतु हूं, आपकी फसल का साथी। बीमार पत्ते की फोटो खींचें या बोलकर बताएं, मैं आसान उपाय बताऊंगा।',
    listenWelcome: 'स्वागत संदेश सुनें',
    playingAudio: 'सुनाया जा रहा है...',
    stopAudio: 'रोकें',
    continueHome: 'आगे बढ़ें',

    navHome: 'होम',
    navCases: 'मेरे केस',
    navAlerts: 'अलर्ट',
    navAgronomist: 'कृषि विशेषज्ञ',
    navInsights: 'डैशबोर्ड',
    navCheckCrop: 'फसल जांचें',

    homeGreeting: 'आज आपकी फसल कैसी है?',
    homePrompt: 'लिखने की जरूरत नहीं — बस फोटो खींचें या बोलें।',
    btnSnapPhoto: 'फोटो खींचें',
    btnSnapDesc: 'बीमार पत्ते या पौधे की पास से फोटो लें',
    btnSpeak: 'बोलें',
    btnSpeakDesc: 'अपनी भाषा में फसल की समस्या बताएं',
    btnMyCases: 'मेरे केस',
    btnMyCasesDesc: 'पुरानी जांच और विशेषज्ञ की सलाह देखें',
    alertsRowTitle: 'आज के स्थानीय अलर्ट (नमूना)',
    viewAllAlerts: 'सभी देखें',
    changeLanguage: 'भाषा बदलें',
    privacyNote:
      'गोपनीयता: आपकी फोटो और आवाज केवल फसल की जांच के लिए उपयोग होती है। डैशबोर्ड में कोई निजी जानकारी नहीं दिखाई जाती।',

    newCaseTitle: 'नई फसल जांच',
    back: 'वापस',
    stepPhotoTitle: '1. बीमार पत्ते की फोटो लें',
    tapToSnap: 'कैमरे से फोटो खींचें',
    uploadOrCamera: 'साफ रोशनी में पत्ते के पास से फोटो लें',
    retakePhoto: 'दोबारा फोटो लें',
    trySamplePhotos: 'तुरंत जांचने के लिए नमूना फोटो:',
    stepVoiceTitle: '2. बोलकर बताएं (वॉइस नोट)',
    tapToSpeak: 'दबाएं और बोलें',
    recordingNow: 'रिकॉर्ड हो रहा है... बोलें',
    tapToStop: 'बोलना पूरा हो तो रोकें',
    voiceRecorded: 'आपकी आवाज रिकॉर्ड हो गई',
    reRecord: 'फिर से बोलें',
    micUnavailable: 'माइक्रोफोन उपलब्ध नहीं है। फोटो लेकर या नीचे लिखकर आगे बढ़ें।',
    optionalDetails: 'अतिरिक्त जानकारी (जरूरी नहीं)',
    districtLabel: 'आपका जिला',
    optionalTextPlaceholder: 'चाहें तो थोड़ा लिखें (जरूरी नहीं)',
    checkMyCropBtn: 'मेरी फसल जांचें',
    needPhotoOrVoice: 'कृपया कम से कम एक फोटो लें या आवाज रिकॉर्ड करें।',
    checkingBubble: 'मिल गया! आपकी फसल की जांच कर रहे हैं...',
    checkingSub: 'BRRI, BARI और FAO स्रोतों से मिलान हो रहा है',
    retryBtn: 'फिर कोशिश करें',

    farmerSentLabel: 'आपने भेजा',
    aiAnswerBadge: 'AI सलाह',
    withExpertBadge: 'विशेषज्ञ के पास',
    verifiedBadge: 'कृषि विशेषज्ञ द्वारा सत्यापित',
    confidenceLabel: 'भरोसे का स्तर',
    highConfidence: 'उच्च विश्वास',
    mediumConfidence: 'मध्यम विश्वास',
    lowConfidence: 'कम विश्वास — विशेषज्ञ जांच जरूरी',
    listenInLanguage: 'हिन्दी में सुनें',
    loadingVoice: 'आवाज तैयार हो रही है...',
    actionPlanTitle: 'करने योग्य आसान कदम',
    warningSignsTitle: 'चेतावनी के संकेत',
    trustedSourcesTitle: 'विश्वसनीय स्रोत',
    notSureHeadline: 'पूरी तरह निश्चित नहीं',
    notSureMessage:
      'गलत या जोखिम भरी सलाह देने के बजाय आपका केस कृषि विशेषज्ञ को भेजा गया है। विशेषज्ञ जांच के बाद सही उपाय भेजेंगे।',
    whyEscalated: 'विशेषज्ञ को क्यों भेजा गया:',
    expertConsultTitle: 'प्राथमिकता विशेषज्ञ सलाह (BDT 20–50 · नमूना)',
    expertConsultDesc: 'तेज विशेषज्ञ जांच का अनुरोध करें (डेमो — कोई शुल्क नहीं)।',
    expertConsultRequested: 'प्राथमिकता अनुरोध भेजा गया (डेमो)',
    requestPriorityConsult: 'प्राथमिकता जांच चुनें (BDT 20–50 डेमो)',
    openAgronomistDemo: 'विशेषज्ञ रिव्यू क्यू खोलें (डेमो)',
    askExpertAnyway: 'कृषि विशेषज्ञ से दोबारा जांच कराएं',
    verifiedByLabel: 'सत्यापनकर्ता',
    agronomistNoteLabel: 'विशेषज्ञ की टिप्पणी',
    checkAnotherCrop: 'दूसरी फसल जांचें',

    myCasesTitle: 'मेरे केस',
    myCasesEmpty: 'अभी तक कोई फसल जांच नहीं की गई है।',
    filterAll: 'सभी',
    filterAi: 'AI सलाह',
    filterExpert: 'विशेषज्ञ के पास',
    filterVerified: 'सत्यापित',

    alertsTitle: 'मौसम, कीट और मंडी भाव',
    alertsSampleLabel: 'नमूना डेटा (Sample data) — लाइव मौसम व मंडी API के लिए तैयार',
    listenAlerts: 'आज के अलर्ट सुनें',
    weatherTitle: 'मौसम की जानकारी',
    pestAlertTitle: 'कीट और रोग चेतावनी',
    marketPricesTitle: 'स्थानीय मंडी भाव',
    humidityLabel: 'नमी',
    rainChanceLabel: 'बारिश की संभावना',
  },

  en: {
    brand: 'KrishiSetu',
    tagline: 'Talk. Snap. Save your crop.',
    welcomeHeading: 'Your crop-health companion',
    welcomeSub: 'Snap a sick leaf or speak in your own language — get safe, voice-guided advice.',
    chooseLanguagePrompt: 'Choose your language',
    voiceGreeting:
      'Welcome to KrishiSetu, your crop-health companion. Snap a photo of a sick leaf or speak to tell us the problem, and we will guide you step by step.',
    listenWelcome: 'Listen to welcome',
    playingAudio: 'Speaking...',
    stopAudio: 'Stop',
    continueHome: 'Continue',

    navHome: 'Home',
    navCases: 'My Cases',
    navAlerts: 'Alerts',
    navAgronomist: 'Agronomist',
    navInsights: 'Insights',
    navCheckCrop: 'Check Crop',

    homeGreeting: 'How is your crop today?',
    homePrompt: 'No typing needed — just snap a photo or speak.',
    btnSnapPhoto: 'Snap a photo',
    btnSnapDesc: 'Take a close-up photo of the sick leaf or stem',
    btnSpeak: 'Speak',
    btnSpeakDesc: 'Record a voice note in Bangla, Hindi, or English',
    btnMyCases: 'My cases',
    btnMyCasesDesc: 'View past checks and agronomist-verified plans',
    alertsRowTitle: "Today's local alerts (sample data)",
    viewAllAlerts: 'View all',
    changeLanguage: 'Change language',
    privacyNote:
      'Privacy: Your photos and voice are used only to diagnose your crop. No personal farmer data is ever shown in the insights dashboard.',

    newCaseTitle: 'New crop check',
    back: 'Back',
    stepPhotoTitle: '1. Snap a sick leaf',
    tapToSnap: 'Take or upload a photo',
    uploadOrCamera: 'Hold phone close to the leaf in clear daylight',
    retakePhoto: 'Change photo',
    trySamplePhotos: 'Quick test with sample crop photos:',
    stepVoiceTitle: '2. Speak your problem (voice note)',
    tapToSpeak: 'Tap to record voice',
    recordingNow: 'Recording... speak now',
    tapToStop: 'Tap to stop recording',
    voiceRecorded: 'Voice note recorded',
    reRecord: 'Record again',
    micUnavailable: 'Microphone unavailable here. You can still submit a photo or optional note.',
    optionalDetails: 'Optional details (never required)',
    districtLabel: 'District / Area',
    optionalTextPlaceholder: 'Optional note — typing is never required',
    checkMyCropBtn: 'Check my crop',
    needPhotoOrVoice: 'Please snap a photo or record a voice note first.',
    checkingBubble: 'Got it! Checking your crop...',
    checkingSub: 'Cross-checking with BRRI, BARI & FAO guidance',
    retryBtn: 'Try again',

    farmerSentLabel: 'You sent',
    aiAnswerBadge: 'AI answer',
    withExpertBadge: 'With expert',
    verifiedBadge: 'Verified by agronomist',
    confidenceLabel: 'Confidence score',
    highConfidence: 'High confidence',
    mediumConfidence: 'Moderate confidence',
    lowConfidence: 'Low confidence — expert check required',
    listenInLanguage: 'Listen in English',
    loadingVoice: 'Preparing voice...',
    actionPlanTitle: 'Your action plan',
    warningSignsTitle: 'Warning signs to watch',
    trustedSourcesTitle: 'Trusted sources',
    notSureHeadline: 'Not fully sure',
    notSureMessage:
      'Rather than guessing, a human agronomist is reviewing your case. You will receive a verified plan right here in My Cases.',
    whyEscalated: 'Why this went to an agronomist:',
    expertConsultTitle: 'Priority agronomist consult (BDT 20–50 · simulated)',
    expertConsultDesc: 'Request faster direct expert follow-up (simulated demo, no real payment).',
    expertConsultRequested: 'Priority consult requested (simulated)',
    requestPriorityConsult: 'Request priority check (BDT 20–50 demo)',
    openAgronomistDemo: 'Open Agronomist Review Queue →',
    askExpertAnyway: 'Ask human agronomist to double-check',
    verifiedByLabel: 'Verified by',
    agronomistNoteLabel: 'Agronomist note',
    checkAnotherCrop: 'Check another crop',

    myCasesTitle: 'My cases',
    myCasesEmpty: 'No crop checks yet. Snap a photo or speak to start.',
    filterAll: 'All',
    filterAi: 'AI answered',
    filterExpert: 'With expert',
    filterVerified: 'Verified',

    alertsTitle: 'Weather, pest & price alerts',
    alertsSampleLabel: 'Sample data — structured for live BMD, DAE, IMD & DAM API integration',
    listenAlerts: "Listen to today's alerts",
    weatherTitle: 'Hyperlocal weather',
    pestAlertTitle: 'Pest & disease watch',
    marketPricesTitle: 'Local market prices',
    humidityLabel: 'Humidity',
    rainChanceLabel: 'Rain chance',
  },
};
