import type { CropCase, DistrictAlertBundle, Language } from '../types';

export const ASSET_IMAGES = {
  heroField: '/src/assets/images/hero_rice_field_1795201000563.jpg',
  riceBrownSpot: '/src/assets/images/sample_rice_brown_spot_1795201016866.jpg',
  tomatoBlight: '/src/assets/images/sample_tomato_blight_1795201038089.jpg',
  unclearPaddy: '/src/assets/images/sample_unclear_paddy_1795201094431.jpg',
} as const;

export const DISTRICTS = [
  'Rajshahi, Bangladesh',
  'Bogura, Bangladesh',
  'Comilla, Bangladesh',
  'Jessore, Bangladesh',
  'Rangpur, Bangladesh',
  'Murshidabad, West Bengal',
  'Bardhaman, West Bengal',
  'Patna, Bihar',
  'Cuttack, Odisha',
] as const;

export interface SampleTestPreset {
  id: string;
  imageUrl: string;
  cropHint: string;
  district: string;
  label: Record<Language, string>;
  sublabel: Record<Language, string>;
  sampleNote: Record<Language, string>;
}

export const SAMPLE_TEST_PRESETS: SampleTestPreset[] = [
  {
    id: 'rice-brown-spot',
    imageUrl: ASSET_IMAGES.riceBrownSpot,
    cropHint: 'Aman Rice (Paddy)',
    district: 'Rajshahi, Bangladesh',
    label: {
      bn: 'ধানের পাতায় বাদামী দাগ',
      hi: 'धान के पत्ते पर भूरे धब्बे',
      en: 'Rice leaf brown spots',
    },
    sublabel: {
      bn: 'স্পষ্ট ছবি · দ্রুত AI নির্ণয় পরীক্ষা',
      hi: 'साफ फोटो · AI जांच का नमूना',
      en: 'Clear leaf · tests confident AI',
    },
    sampleNote: {
      bn: 'গত ৪ দিন ধরে ধানের পাতায় ছোট ছোট বাদামী দাগ বাড়ছে।',
      hi: 'पिछले 4 दिनों से धान के पत्तों पर भूरे धब्बे बढ़ रहे हैं।',
      en: 'Small oval brown spots with yellow edges spreading on rice leaves for 4 days.',
    },
  },
  {
    id: 'tomato-blight',
    imageUrl: ASSET_IMAGES.tomatoBlight,
    cropHint: 'Winter Tomato',
    district: 'Bogura, Bangladesh',
    label: {
      bn: 'টমেটো পাতায় কালো পচন',
      hi: 'टमाटर के पत्ते पर काला झुलसा',
      en: 'Tomato dark leaf blight',
    },
    sublabel: {
      bn: 'কুয়াশার পর পাতা কালো হওয়া',
      hi: 'कोहरे के बाद पत्ते काले होना',
      en: 'Fog damage · tests BARI guidance',
    },
    sampleNote: {
      bn: 'সকালের কুয়াশার পর টমেটো গাছের পাতার কিনারা কালো হয়ে শুকিয়ে যাচ্ছে।',
      hi: 'सुबह के कोहरे के बाद टमाटर के पत्तों के किनारे काले होकर सूख रहे हैं।',
      en: 'After morning fog, tomato leaf edges are turning dark brown-black and wilting.',
    },
  },
  {
    id: 'unclear-paddy',
    imageUrl: ASSET_IMAGES.unclearPaddy,
    cropHint: 'Paddy field',
    district: 'Comilla, Bangladesh',
    label: {
      bn: 'অস্পষ্ট দূরের মাঠের ছবি',
      hi: 'धुंधली दूर की खेत फोटो',
      en: 'Blurry distant field shot',
    },
    sublabel: {
      bn: 'কম নিশ্চয়তা · কৃষিবিদ যাচাই পরীক্ষা',
      hi: 'कम भरोसा · विशेषज्ञ जांच नमूना',
      en: 'Low clarity · tests expert escalation',
    },
    sampleNote: {
      bn: 'পুরো জমির ধান কিছুটা হলুদ লাগছে, বুঝতে পারছি না কী হয়েছে।',
      hi: 'पूरे खेत का धान थोड़ा पीला लग रहा है, समझ नहीं आ रहा क्या हुआ है।',
      en: 'Parts of my paddy field look yellowish from afar, not sure what is wrong.',
    },
  },
];

export const INITIAL_SEEDED_CASES: CropCase[] = [
  {
    id: 'KS-2026-104',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    language: 'bn',
    district: 'Comilla, Bangladesh',
    photoDataUrl: ASSET_IMAGES.unclearPaddy,
    noteText: 'মাঠের এক কোণার ধান হঠাৎ হলুদ হয়ে যাচ্ছে।',
    transcript: '“আমার দুই বিঘা ধানের জমির এক পাশের গাছ হলুদ হয়ে যাচ্ছে, পাতা শুকাচ্ছে।” (Part of my two-bigha paddy plot is turning yellow and drying.)',
    crop: 'Rice (Paddy)',
    likely_problem: 'Unclear yellowing — possible Nitrogen deficiency, Tungro, or Root stress',
    confidence: 52,
    needs_expert: true,
    escalation_reason:
      'The photograph was taken from a distance in bright glare, so individual leaf lesions and stem bases cannot be seen clearly. Sent to an agronomist so you do not spend money on the wrong treatment.',
    action_plan: [
      'Hold off on spraying pesticides until the agronomist confirms the cause.',
      'Check if tiny green leafhoppers jump when you gently tap the rice plants.',
      'Take one close-up photo of a single yellow leaf in shade if requested.',
    ],
    warning_signs: [
      'Yellowing spreading rapidly to neighboring plots within 48 hours',
      'Plants pulling out easily with dark rotting roots',
    ],
    sources: [
      { title: 'BRRI Rice Knowledge Bank — Yellowing Diagnostic Guide', url: 'https://knowledgebank-brri.org/' },
      { title: 'FAO Integrated Pest Management for Rice', url: 'https://www.fao.org/' },
    ],
    spoken_summary:
      'ছবিটি দূর থেকে তোলায় রোগটি পুরোপুরি নিশ্চিত হওয়া যায়নি। কোনো ঝুঁকি না নিয়ে আপনার কেসটি একজন কৃষিবিদের কাছে পাঠানো হয়েছে। তিনি দেখে দ্রুত সঠিক সমাধান জানাবেন।',
    status: 'with_expert',
    responseTimeMs: 3200,
    priorityConsultRequested: true,
    aiOriginalGuess: 'Possible Nitrogen deficiency vs. Rice Tungro',
    aiOriginalConfidence: 52,
  },
  {
    id: 'KS-2026-103',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    language: 'en',
    district: 'Rajshahi, Bangladesh',
    photoDataUrl: ASSET_IMAGES.riceBrownSpot,
    transcript: '“Oval brown spots appeared on my Aman paddy leaves after three humid mornings.”',
    crop: 'Rice (Aman Paddy)',
    likely_problem: 'Rice Brown Spot (Bipolaris oryzae)',
    confidence: 89,
    needs_expert: false,
    action_plan: [
      'Check soil moisture — avoid letting the paddy field dry out and crack.',
      'Apply balanced potash (MoP) fertilizer as recommended by local BRRI soil guidance, since potassium deficiency worsens brown spot.',
      'Remove heavily infected weeds from field bunds to lower fungal spore spread.',
      'If spots cover more than 20% of upper leaves, consult your local DAE dealer for a BRRI-approved fungicide (wear gloves and mask; follow a 14-day pre-harvest waiting period).',
    ],
    warning_signs: [
      'Dark spots spreading onto rice grains or panicle necks',
      'Leaves drying completely before flowering stage',
    ],
    sources: [
      { title: 'BRRI — Rice Brown Spot Management', url: 'https://knowledgebank-brri.org/' },
      { title: 'IRRI Rice Knowledge Bank — Brown Spot', url: 'http://www.knowledgebank.irri.org/' },
    ],
    spoken_summary:
      'Your rice leaf shows clear signs of Rice Brown Spot. Keep steady shallow water in the field and add balanced potash fertilizer first. Watch if spots move onto the grain heads.',
    status: 'ai_answered',
    responseTimeMs: 2850,
  },
  {
    id: 'KS-2026-101',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
    language: 'bn',
    district: 'Bogura, Bangladesh',
    photoDataUrl: ASSET_IMAGES.tomatoBlight,
    transcript: '“কুয়াশার পর টমেটোর পাতায় কালো দাগ পড়েছে।” (Black spots appeared on tomato leaves after fog.)',
    crop: 'টমেটো (Tomato)',
    likely_problem: 'টমেটোর নাবী ধ্বসা রোগ (Late Blight)',
    confidence: 94,
    needs_expert: false,
    action_plan: [
      'আক্রান্ত কালো পাতাগুলো সাবধানে ছিঁড়ে জমি থেকে দূরে মাটিতে পুঁতে ফেলুন।',
      'পাতার ওপর পানি না দিয়ে শুধু গাছের গোড়ায় সকালে সেচ দিন।',
      'ঘন কুয়াশা থাকলে BARI অনুমোদিত ম্যানকোজেব (প্রতি লিটার পানিতে ২ গ্রাম) বিকেলে স্প্রে করুন।',
      'স্প্রে করার সময় মাস্ক ও গ্লাভস পরুন এবং স্প্রের পর অন্তত ৭ দিন ফল তুলবেন না।',
    ],
    warning_signs: [
      'কাণ্ডে কালো দাগ ছড়িয়ে গাছ ঢলে পড়া',
      'কাঁচা টমেটোতে গাঢ় বাদামী শক্ত দাগ দেখা দেওয়া',
    ],
    sources: [
      { title: 'BARI — Vegetable Disease Control Handbook', url: 'https://bari.gov.bd/' },
      { title: 'FAO — Late Blight Management in Smallholder Tomato', url: 'https://www.fao.org/' },
    ],
    spoken_summary:
      'কৃষিবিদ যাচাই করেছেন এটি টমেটোর নাবী ধ্বসা রোগ। প্রথমে আক্রান্ত কালো পাতাগুলো তুলে দূরে পুঁতে ফেলুন এবং শুধু গোড়ায় পানি দিন। কুয়াশা থাকলে অনুমোদিত ছত্রাকনাশক নিরাপদে ব্যবহার করুন।',
    status: 'verified',
    responseTimeMs: 3100,
    verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 17).toISOString(),
    agronomistName: 'Dr. Mahmudul Hasan, DAE Agronomist',
    agronomistNote:
      'Confirmed Late Blight triggered by high morning humidity in Bogura. Added exact BARI Mancozeb dosage and 7-day harvest safety interval.',
    aiOriginalGuess: 'Early vs. Late Blight on Tomato',
    aiOriginalConfidence: 68,
  },
];

export const DISTRICT_ALERTS: DistrictAlertBundle[] = [
  {
    district: 'Rajshahi, Bangladesh',
    region: 'North-West Barind',
    weather: {
      tempC: 27,
      humidity: 84,
      rainChance: 65,
      condition: {
        bn: 'সকালে ঘন কুয়াশা ও বিকেলে হালকা বৃষ্টির সম্ভাবনা',
        hi: 'सुबह घना कोहरा और दोपहर में हल्की बारिश की संभावना',
        en: 'Dense morning fog with light afternoon showers likely',
      },
      advice: {
        bn: 'সকালে স্প্রে করবেন না। দুপুরের পর পাতা শুকালে সার বা ওষুধ দিন।',
        hi: 'सुबह छिड़काव न करें। दोपहर में पत्ते सूखने के बाद ही दवा डालें।',
        en: 'Avoid spraying in wet morning fog. Apply treatments after leaves dry in afternoon.',
      },
    },
    pest: {
      severity: 'high',
      crop: { bn: 'আমন ধান', hi: 'धान', en: 'Aman Rice' },
      title: {
        bn: 'বাদামী দাগ ও ব্লাস্ট রোগের ঝুঁকি বেশি',
        hi: 'भूरे धब्बे और ब्लास्ट रोग का अधिक खतरा',
        en: 'Elevated Brown Spot & Leaf Blast risk',
      },
      advice: {
        bn: 'আর্দ্রতা ৮০%-এর বেশি। জমির পাতা পরীক্ষা করুন এবং অতিরিক্ত ইউরিয়া দেওয়া বন্ধ রাখুন।',
        hi: 'नमी 80% से अधिक है। खेत में पत्ते जांचें और अधिक यूरिया न डालें।',
        en: 'Humidity above 80%. Inspect lower leaves daily and avoid excess urea top-dressing.',
      },
    },
    prices: [
      {
        crop: { bn: 'ধান (BRRI-28)', hi: 'धान (BRRI-28)', en: 'Paddy (BRRI-28)' },
        priceText: 'BDT 1,340',
        unit: { bn: 'প্রতি মণ', hi: 'प्रति मन', en: 'per maund' },
        trend: 'up',
        changeText: '+4.2%',
      },
      {
        crop: { bn: 'আলু (ডায়মন্ড)', hi: 'आलू (डायमंड)', en: 'Potato (Diamant)' },
        priceText: 'BDT 38',
        unit: { bn: 'প্রতি কেজি', hi: 'प्रति किलो', en: 'per kg' },
        trend: 'stable',
        changeText: '0.0%',
      },
      {
        crop: { bn: 'টমেটো (দেশি)', hi: 'टमाटर', en: 'Tomato (Local)' },
        priceText: 'BDT 54',
        unit: { bn: 'প্রতি কেজি', hi: 'प्रति किलो', en: 'per kg' },
        trend: 'up',
        changeText: '+6.5%',
      },
    ],
  },
  {
    district: 'Bogura, Bangladesh',
    region: 'Northern Vegetable Belt',
    weather: {
      tempC: 25,
      humidity: 88,
      rainChance: 40,
      condition: {
        bn: 'ঠান্ডা ও আর্দ্র সকাল, কুয়াশাচ্ছন্ন আবহাওয়া',
        hi: 'ठंडी और नम सुबह, कोहरा छाया रहेगा',
        en: 'Cool, humid morning with lingering mist',
      },
      advice: {
        bn: 'আলু ও টমেটো ক্ষেতে সকালের শিশির ঝরিয়ে দিন এবং গোড়ায় পানি জমতে দেবেন না।',
        hi: 'आलू और टमाटर के खेत में जलभराव न होने दें।',
        en: 'Ensure good drainage in potato and tomato beds to prevent fungal rot.',
      },
    },
    pest: {
      severity: 'high',
      crop: { bn: 'আলু ও টমেটো', hi: 'आलू और टमाटर', en: 'Potato & Tomato' },
      title: {
        bn: 'নাবী ধ্বসা (Late Blight) সতর্কতা',
        hi: 'पछेती झुलसा (Late Blight) चेतावनी',
        en: 'Late Blight outbreak advisory',
      },
      advice: {
        bn: 'কুয়াশা টানা ৩ দিন থাকলে আক্রান্ত পাতা সরান এবং BARI পরামর্শ অনুযায়ী প্রতিরোধমূলক ব্যবস্থা নিন।',
        hi: 'लगातार 3 दिन कोहरा रहने पर संक्रमित पत्ते हटाएं और अनुमोदित उपाय करें।',
        en: 'After 3 foggy mornings, remove dark lesions early and follow BARI preventive guidance.',
      },
    },
    prices: [
      {
        crop: { bn: 'আলু (কার্ডিনাল)', hi: 'आलू (कार्डिनल)', en: 'Potato (Cardinal)' },
        priceText: 'BDT 40',
        unit: { bn: 'প্রতি কেজি', hi: 'प्रति किलो', en: 'per kg' },
        trend: 'up',
        changeText: '+5.1%',
      },
      {
        crop: { bn: 'বেগুন (লম্বা)', hi: 'बैंगन', en: 'Brinjal (Eggplant)' },
        priceText: 'BDT 46',
        unit: { bn: 'প্রতি কেজি', hi: 'प्रति किलो', en: 'per kg' },
        trend: 'down',
        changeText: '-2.1%',
      },
      {
        crop: { bn: 'কাঁচা মরিচ', hi: 'हरी मिर्च', en: 'Green Chili' },
        priceText: 'BDT 110',
        unit: { bn: 'প্রতি কেজি', hi: 'प्रति किलो', en: 'per kg' },
        trend: 'up',
        changeText: '+8.0%',
      },
    ],
  },
  {
    district: 'Murshidabad, West Bengal',
    region: 'Eastern Gangetic Plain',
    weather: {
      tempC: 28,
      humidity: 79,
      rainChance: 55,
      condition: {
        bn: 'আংশিক মেঘলা আকাশ ও হালকা দমকা হাওয়া',
        hi: 'आंशिक बादल और हल्की हवा',
        en: 'Partly cloudy with light breeze',
      },
      advice: {
        bn: 'বাতাস কম থাকলে বিকেলে স্প্রে করুন। ধান কাটার আগে আবহাওয়া দেখে নিন।',
        hi: 'हवा शांत होने पर शाम को छिड़काव करें। कटाई से पहले मौसम जांचें।',
        en: 'Spray only when wind calms in late afternoon. Cover harvested grain before dusk.',
      },
    },
    pest: {
      severity: 'moderate',
      crop: { bn: 'ধান (আমন)', hi: 'धान', en: 'Paddy' },
      title: {
        bn: 'বাদামী গাছফড়িং (BPH) নজরদারি',
        hi: 'भूरा फुदका (BPH) निगरानी',
        en: 'Brown Planthopper (BPH) watch',
      },
      advice: {
        bn: 'গাছের গোড়া ফাঁক করে দেখুন। প্রতি গোছায় ১০টির বেশি পোকা থাকলে কৃষিবিদের পরামর্শ নিন।',
        hi: 'पौधे की जड़ के पास जांचें। प्रति झुंड 10 से अधिक कीट हों तो विशेषज्ञ से पूछें।',
        en: 'Part rice hills at the water line. Escalate if more than 10 hoppers appear per hill.',
      },
    },
    prices: [
      {
        crop: { bn: 'ধান (স্বর্ণা)', hi: 'धान (स्वर्णा)', en: 'Paddy (Swarna)' },
        priceText: 'INR 2,280',
        unit: { bn: 'প্রতি কুইন্টাল', hi: 'प्रति क्विंटल', en: 'per quintal' },
        trend: 'up',
        changeText: '+3.1%',
      },
      {
        crop: { bn: 'পাট (TD-5)', hi: 'जूट (TD-5)', en: 'Raw Jute (TD-5)' },
        priceText: 'INR 5,450',
        unit: { bn: 'প্রতি কুইন্টাল', hi: 'प्रति क्विंटल', en: 'per quintal' },
        trend: 'stable',
        changeText: '+0.4%',
      },
      {
        crop: { bn: 'সরিষা', hi: 'सरसों', en: 'Mustard Seed' },
        priceText: 'INR 5,820',
        unit: { bn: 'প্রতি কুইন্টাল', hi: 'प्रति क्विंटल', en: 'per quintal' },
        trend: 'up',
        changeText: '+2.8%',
      },
    ],
  },
];

// Seeded anonymised pilot baseline for NGO/Institution Insights Dashboard
export const SEEDED_REGIONAL_PILOT_STATS = {
  diseaseCounts: [
    { name: 'Rice Brown Spot', cases: 46 },
    { name: 'Tomato Late Blight', cases: 38 },
    { name: 'Rice Leaf Blast', cases: 29 },
    { name: 'Bacterial Leaf Blight', cases: 22 },
    { name: 'Nitrogen / Potash Stress', cases: 18 },
    { name: 'Unclear / Escalated', cases: 14 },
  ],
  districtBreakdown: [
    { district: 'Rajshahi', aiAnswered: 38, escalated: 9 },
    { district: 'Bogura', aiAnswered: 31, escalated: 11 },
    { district: 'Comilla', aiAnswered: 24, escalated: 8 },
    { district: 'Jessore', aiAnswered: 19, escalated: 5 },
    { district: 'Murshidabad', aiAnswered: 16, escalated: 6 },
  ],
  weeklyTrend: [
    { day: 'Mon', total: 19, escalated: 4 },
    { day: 'Tue', total: 24, escalated: 5 },
    { day: 'Wed', total: 28, escalated: 6 },
    { day: 'Thu', total: 22, escalated: 4 },
    { day: 'Fri', total: 31, escalated: 7 },
    { day: 'Sat', total: 26, escalated: 5 },
    { day: 'Sun', total: 17, escalated: 4 },
  ],
  baselineAvgResponseSec: 3.1,
};
