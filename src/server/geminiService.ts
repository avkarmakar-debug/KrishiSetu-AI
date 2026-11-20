import { GoogleGenAI } from '@google/genai';

export type SupportedLanguage = 'bn' | 'hi' | 'en';

export interface DiagnoseInput {
  imageBase64?: string;
  imageMimeType?: string;
  audioBase64?: string;
  audioMimeType?: string;
  noteText?: string;
  language: SupportedLanguage;
  district?: string;
  cropHint?: string;
}

export interface GroundedSource {
  title: string;
  url?: string;
}

export interface DiagnosisResultPayload {
  crop: string;
  likely_problem: string;
  confidence: number;
  needs_expert: boolean;
  escalation_reason?: string;
  action_plan: string[];
  warning_signs: string[];
  sources: GroundedSource[];
  spoken_summary: string;
  transcript?: string;
  responseTimeMs: number;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  bn: 'Bangla (বাংলা) — use very simple, everyday rural Bangladesh/West Bengal Bangla words that a smallholder farmer understands easily when read aloud',
  hi: 'Hindi (हिन्दी) — use very simple, everyday rural Eastern India Hindi words that a smallholder farmer understands easily when read aloud',
  en: 'Simple English — use short, plain everyday sentences with zero heavy technical jargon',
};

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('DEADLINE_EXCEEDED');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 700 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function extractJsonObject(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error('Could not parse structured diagnosis JSON from model response.');
  }
}

export async function diagnoseCrop(input: DiagnoseInput): Promise<DiagnosisResultPayload> {
  const startedAt = Date.now();
  const ai = getAiClient();

  const langGuide = LANGUAGE_LABELS[input.language] || LANGUAGE_LABELS.en;

  const systemInstruction = [
    'You are KrishiSetu, a warm, trustworthy agricultural advisor for smallholder farmers in Bangladesh and eastern India.',
    `Always write all human-readable fields (crop, likely_problem, escalation_reason, action_plan, warning_signs, spoken_summary) in ${langGuide}.`,
    'Base your agronomic guidance on trusted agricultural extension sources: BRRI (Bangladesh Rice Research Institute), BARI (Bangladesh Agricultural Research Institute), DAE, IRRI, and FAO.',
    'Use Google Search grounding to verify crop disease symptoms and safe recommended management practices.',
    'SAFETY RULE — NEVER GUESS: If the photo is blurry, too far away, backlit, poorly lit, does not clearly show a plant/leaf/crop, or if symptoms could match multiple different diseases, be honest: set confidence strictly below 65 (e.g. 30 to 58) and set needs_expert to true, and clearly explain in escalation_reason why a human agronomist must inspect it.',
    'Prefer low-cost, locally available cultural, sanitation, and biological steps first (removing infected leaves, water/drainage control, spacing, ash/neem where appropriate).',
    'Be very careful with chemical pesticides or fungicides: if any chemical treatment is mentioned, state protective gear (gloves/mask) and pre-harvest waiting period, and set needs_expert to true whenever strong/restricted chemicals are needed or confidence is below 70.',
    'Keep sentences very short, calm, and actionable.',
    'Return ONLY a single raw JSON object (no markdown fences, no commentary outside JSON) with these exact keys:',
    '{',
    '  "crop": "string — crop name (or Unclear crop if not identifiable)",',
    '  "likely_problem": "string — short plain-language diagnosis",',
    '  "confidence": number (integer 0 to 100),',
    '  "needs_expert": boolean (true if confidence < 70 OR photo/symptoms are unclear OR risky chemicals are involved),',
    '  "escalation_reason": "string — brief plain-language explanation if needs_expert is true, otherwise empty string",',
    '  "action_plan": ["3 to 5 short numbered-ready practical steps, low-cost first"],',
    '  "warning_signs": ["2 to 3 warning signs that mean urgent specialist help is needed"],',
    '  "sources": ["2 to 4 trusted source names such as BRRI Rice Knowledge Bank, BARI Crop Protection Guide, FAO Plant Production"],',
    '  "spoken_summary": "2 to 3 warm, short sentences written specifically to be read aloud to the farmer in their chosen language",',
    '  "transcript": "If an audio voice note was provided, transcribe or summarize what the farmer said in their language (with brief English meaning in brackets if non-English). Otherwise empty string."',
    '}',
  ].join('\n');

  const parts: Array<
    | { inlineData: { mimeType: string; data: string } }
    | { text: string }
  > = [];

  if (input.imageBase64 && input.imageMimeType) {
    parts.push({
      inlineData: {
        mimeType: input.imageMimeType,
        data: input.imageBase64,
      },
    });
  }

  if (input.audioBase64 && input.audioMimeType) {
    parts.push({
      inlineData: {
        mimeType: input.audioMimeType,
        data: input.audioBase64,
      },
    });
  }

  const contextLines = [
    `Farmer chosen language: ${input.language}`,
    input.district ? `Farmer district/region: ${input.district}` : 'Farmer region: Bangladesh / Eastern India',
    input.cropHint ? `Farmer mentioned crop: ${input.cropHint}` : '',
    input.noteText?.trim() ? `Farmer written note: "${input.noteText.trim()}"` : '',
    input.audioBase64
      ? 'The farmer recorded the attached voice note describing the crop problem in their local language/dialect. Listen carefully and include the transcript.'
      : 'No voice note attached.',
    input.imageBase64
      ? 'Inspect the attached crop photograph carefully for visual clarity, distance, lighting, and disease/pest/nutrient symptoms.'
      : 'No crop photo was attached — remember to keep confidence conservative if visual confirmation is missing.',
    'Respond ONLY with the valid JSON object specified in your instructions.',
  ].filter(Boolean);

  parts.push({ text: contextLines.join('\n') });

  const attempts: Array<{ model: string; useSearch: boolean }> = [
    { model: 'gemini-4-hydrogen', useSearch: true },
    { model: 'gemini-4-hydrogen', useSearch: false },
    { model: 'gemini-3.1-flash-lite', useSearch: false },
  ];

  let response;
  let lastErr: unknown;
  for (const attempt of attempts) {
    try {
      response = await withRetry(async () => {
        return ai.models.generateContent({
          model: attempt.model,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction,
            ...(attempt.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
          },
        });
      }, 0);
      break;
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryableAcrossFallback =
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('404') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('503');
      if (!isRetryableAcrossFallback) {
        throw err;
      }
    }
  }

  if (!response) {
    throw lastErr instanceof Error
      ? lastErr
      : new Error('Unable to reach Gemini right now. Please try again.');
  }

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  const parsed = extractJsonObject(rawText);

  const rawConfidence = Number(parsed.confidence);
  const confidence = Number.isFinite(rawConfidence)
    ? Math.max(0, Math.min(100, Math.round(rawConfidence)))
    : 50;

  const modelNeedsExpert = Boolean(parsed.needs_expert);
  const needs_expert = modelNeedsExpert || confidence < 70;

  // Combine model-listed sources and real Google Search grounding chunks
  const groundedSources: GroundedSource[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      const web = (chunk as { web?: { uri?: string; title?: string } }).web;
      if (web?.uri && !seenUrls.has(web.uri)) {
        seenUrls.add(web.uri);
        const title = web.title?.trim() || web.uri;
        seenTitles.add(title.toLowerCase());
        groundedSources.push({ title, url: web.uri });
      }
    }
  }

  if (Array.isArray(parsed.sources)) {
    for (const src of parsed.sources) {
      if (typeof src === 'string' && src.trim()) {
        const clean = src.trim();
        if (!seenTitles.has(clean.toLowerCase())) {
          seenTitles.add(clean.toLowerCase());
          const isUrl = /^https?:\/\//i.test(clean);
          groundedSources.push(isUrl ? { title: clean, url: clean } : { title: clean });
        }
      }
    }
  }

  const action_plan = Array.isArray(parsed.action_plan)
    ? parsed.action_plan.map((s) => String(s).trim()).filter(Boolean).slice(0, 6)
    : [];

  const warning_signs = Array.isArray(parsed.warning_signs)
    ? parsed.warning_signs.map((s) => String(s).trim()).filter(Boolean).slice(0, 5)
    : [];

  return {
    crop: String(parsed.crop || 'Crop').trim(),
    likely_problem: String(parsed.likely_problem || 'Needs closer inspection').trim(),
    confidence,
    needs_expert,
    escalation_reason: parsed.escalation_reason ? String(parsed.escalation_reason).trim() : undefined,
    action_plan,
    warning_signs,
    sources: groundedSources.slice(0, 6),
    spoken_summary: String(parsed.spoken_summary || '').trim(),
    transcript: parsed.transcript ? String(parsed.transcript).trim() : undefined,
    responseTimeMs: Date.now() - startedAt,
  };
}

export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage
): Promise<{ audioBase64: string; mimeType: string }> {
  const ai = getAiClient();

  const styleByLang: Record<SupportedLanguage, string> = {
    bn: 'Warm, calm, reassuring rural agricultural advisor speaking clear natural Bengali at a steady, easy-to-follow pace',
    hi: 'Warm, calm, reassuring rural agricultural advisor speaking clear natural Hindi at a steady, easy-to-follow pace',
    en: 'Warm, calm, reassuring agricultural advisor speaking simple clear English at a steady, easy-to-follow pace',
  };

  const response = await withRetry(async () => {
    return ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 1200),
              speechMetadata: {
                style: styleByLang[language] || styleByLang.en,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
  }, 1);

  const audioBase64 =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioBase64) {
    throw new Error('No audio generated by TTS model.');
  }

  return {
    audioBase64,
    mimeType: 'audio/wav',
  };
}
