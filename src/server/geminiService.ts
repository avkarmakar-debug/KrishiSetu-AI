import { createHash } from 'crypto';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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

export type GeminiErrorCategory =
  | 'billing_depleted'
  | 'auth_invalid'
  | 'quota_exhausted'
  | 'rate_limited'
  | 'transient'
  | 'unknown';

export interface ClassifiedGeminiError {
  category: GeminiErrorCategory;
  httpStatus: number;
  retryable: boolean;
  retryAfterSec?: number;
  userMessage: string;
  rawMessage: string;
}

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  bn: 'Bangla (বাংলা) — use very simple, everyday rural Bangladesh/West Bengal Bangla words that a smallholder farmer understands easily when read aloud',
  hi: 'Hindi (हिन्दी) — use very simple, everyday rural Eastern India Hindi words that a smallholder farmer understands easily when read aloud',
  en: 'Simple English — use short, plain everyday sentences with zero heavy technical jargon',
};

// Cached singleton SDK client keyed by current API key
let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

// Short-TTL in-memory caches + in-flight deduplication to avoid duplicate API calls & quota burn
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DIAGNOSIS_CACHE_TTL_MS = 10 * 60 * 1000;
const DIAGNOSIS_CACHE_MAX = 50;
const diagnosisCache = new Map<string, CacheEntry<DiagnosisResultPayload>>();
const inFlightDiagnoses = new Map<string, Promise<DiagnosisResultPayload>>();

const TTS_CACHE_TTL_MS = 30 * 60 * 1000;
const TTS_CACHE_MAX = 100;
const ttsCache = new Map<string, CacheEntry<{ audioBase64: string; mimeType: string }>>();
const inFlightTts = new Map<string, Promise<{ audioBase64: string; mimeType: string }>>();

function getCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  // Refresh LRU order
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function setCachedValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
  maxEntries: number
): void {
  if (cache.has(key)) {
    cache.delete(key);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  while (cache.size > maxEntries) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    } else {
      break;
    }
  }
}

function buildDiagnosisCacheKey(input: DiagnoseInput): string {
  const hash = createHash('sha256');
  hash.update(input.language || 'en');
  hash.update('|');
  hash.update((input.district || '').trim().toLowerCase());
  hash.update('|');
  hash.update((input.cropHint || '').trim().toLowerCase());
  hash.update('|');
  hash.update((input.noteText || '').trim());
  hash.update('|');
  hash.update(input.imageMimeType || '');
  hash.update('|');
  hash.update(input.imageBase64 || '');
  hash.update('|');
  hash.update(input.audioMimeType || '');
  hash.update('|');
  hash.update(input.audioBase64 || '');
  return hash.digest('hex');
}

function buildTtsCacheKey(text: string, language: SupportedLanguage): string {
  return createHash('sha256').update(`${language}|${text}`).digest('hex');
}

function extractRetryDelaySec(message: string): number | undefined {
  const jsonMatch = message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (jsonMatch) {
    const parsed = Number(jsonMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return Math.ceil(parsed);
  }
  const textMatch = message.match(/retry in\s+(\d+(?:\.\d+)?)\s*s/i);
  if (textMatch) {
    const parsed = Number(textMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return Math.ceil(parsed);
  }
  return undefined;
}

function extractStatusCode(err: unknown, message: string): number | undefined {
  if (typeof err === 'object' && err !== null) {
    const maybeStatus = (err as { status?: unknown; statusCode?: unknown; code?: unknown });
    for (const candidate of [maybeStatus.status, maybeStatus.statusCode, maybeStatus.code]) {
      if (typeof candidate === 'number' && candidate >= 100 && candidate < 600) {
        return candidate;
      }
    }
  }
  const codeMatch = message.match(/"code"\s*:\s*(\d{3})/);
  if (codeMatch) {
    return Number(codeMatch[1]);
  }
  return undefined;
}

export function classifyGeminiError(err: unknown): ClassifiedGeminiError {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();
  const numericCode = extractStatusCode(err, rawMessage);

  // 1. Billing / prepayment credits exhausted (HTTP 402 — often also carries status: RESOURCE_EXHAUSTED!)
  if (
    numericCode === 402 ||
    lower.includes('prepayment credits') ||
    lower.includes('credits are depleted') ||
    lower.includes('billing_disabled') ||
    lower.includes('enable billing') ||
    lower.includes('docs/billing')
  ) {
    return {
      category: 'billing_depleted',
      httpStatus: 402,
      retryable: false,
      userMessage:
        'Gemini API credits are depleted on this project. Please add credits at ai.studio/projects or choose another API key in Settings > Secrets.',
      rawMessage,
    };
  }

  // 2. Missing or invalid API key / permissions
  if (
    numericCode === 401 ||
    numericCode === 403 ||
    rawMessage.includes('GEMINI_API_KEY') ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED')
  ) {
    return {
      category: 'auth_invalid',
      httpStatus: 500,
      retryable: false,
      userMessage:
        'The Gemini API key is missing or invalid. Please check Settings > Secrets in AI Studio.',
      rawMessage,
    };
  }

  // 3. Hard quota exhaustion (daily quota or free-tier limit: 0)
  const isResourceExhausted =
    numericCode === 429 ||
    rawMessage.includes('429') ||
    rawMessage.includes('RESOURCE_EXHAUSTED');

  if (
    isResourceExhausted &&
    (lower.includes('limit: 0') ||
      lower.includes('perday') ||
      lower.includes('per_day') ||
      lower.includes('daily') ||
      lower.includes('free_tier'))
  ) {
    return {
      category: 'quota_exhausted',
      httpStatus: 429,
      retryable: false,
      userMessage:
        'Gemini API quota for this key is exhausted. Please select a billing-enabled API key in Settings > Secrets in AI Studio.',
      rawMessage,
    };
  }

  // 4. Genuine transient rate limit (burst RPM / TPM)
  if (isResourceExhausted) {
    const retryAfterSec = Math.min(extractRetryDelaySec(rawMessage) ?? 8, 60);
    return {
      category: 'rate_limited',
      httpStatus: 429,
      retryable: true,
      retryAfterSec,
      userMessage: `Too many crop checks at once. Please wait ${retryAfterSec} seconds and tap Try Again.`,
      rawMessage,
    };
  }

  // 5. Transient upstream unavailability
  if (
    numericCode === 500 ||
    numericCode === 503 ||
    numericCode === 504 ||
    rawMessage.includes('503') ||
    rawMessage.includes('UNAVAILABLE') ||
    rawMessage.includes('DEADLINE_EXCEEDED') ||
    rawMessage.includes('ETIMEDOUT') ||
    rawMessage.includes('ECONNRESET')
  ) {
    return {
      category: 'transient',
      httpStatus: 503,
      retryable: true,
      retryAfterSec: 3,
      userMessage: 'The crop advisor is temporarily busy. Please tap Try Again in a moment.',
      rawMessage,
    };
  }

  return {
    category: 'unknown',
    httpStatus: 502,
    retryable: true,
    userMessage: 'Could not reach the crop advisor right now. Please tap Try Again.',
    rawMessage,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const classified = classifyGeminiError(err);

      // Never retry non-transient errors (e.g. 402 billing depleted, 403 auth, daily quota)
      const shouldRetry =
        (classified.category === 'rate_limited' || classified.category === 'transient') &&
        attempt < maxRetries;

      if (!shouldRetry) {
        throw err;
      }

      const hintedMs = classified.retryAfterSec ? classified.retryAfterSec * 1000 : undefined;
      const baseDelayMs = hintedMs ?? 800 * Math.pow(2, attempt);
      const jitterMs = Math.floor(Math.random() * 350);
      const delayMs = Math.min(baseDelayMs + jitterMs, 5000);
      await sleep(delayMs);
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

async function executeCropDiagnosis(input: DiagnoseInput): Promise<DiagnosisResultPayload> {
  const startedAt = Date.now();
  const ai = getAiClient();

  const langGuide = LANGUAGE_LABELS[input.language] || LANGUAGE_LABELS.en;

  const systemInstruction = [
    'You are KrishiSetu, a warm, trustworthy agricultural advisor for smallholder farmers in Bangladesh and eastern India.',
    `Always write all human-readable fields (crop, likely_problem, escalation_reason, action_plan, warning_signs, spoken_summary) in ${langGuide}.`,
    'Base your agronomic guidance on trusted agricultural extension sources: BRRI (Bangladesh Rice Research Institute), BARI (Bangladesh Agricultural Research Institute), DAE, IRRI, and FAO.',
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

  // Use low-latency, low-token thinking levels and two separate model quota pools
  // (never hit the same model twice back-to-back on 429, and never retry 402/403).
  const attempts: Array<{ model: string; thinkingLevel: ThinkingLevel }> = [
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  ];

  let response;
  let lastErr: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    try {
      response = await withRetry(async () => {
        return ai.models.generateContent({
          model: attempt.model,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: attempt.thinkingLevel },
          },
        });
      }, 1);
      break;
    } catch (err: unknown) {
      lastErr = err;
      const classified = classifyGeminiError(err);

      // Fail fast on billing/credit depletion, invalid API keys, or hard quota exhaustion
      if (
        classified.category === 'billing_depleted' ||
        classified.category === 'auth_invalid' ||
        classified.category === 'quota_exhausted'
      ) {
        throw err;
      }

      const rawMsg = classified.rawMessage;
      const canFallback =
        classified.category === 'rate_limited' ||
        classified.category === 'transient' ||
        rawMsg.includes('404') ||
        rawMsg.includes('NOT_FOUND');

      if (!canFallback || i === attempts.length - 1) {
        throw err;
      }

      // Brief jittered pause before falling back to the secondary model pool
      await sleep(600 + Math.floor(Math.random() * 400));
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

  const groundedSources: GroundedSource[] = [];
  const seenTitles = new Set<string>();

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

export async function diagnoseCrop(input: DiagnoseInput): Promise<DiagnosisResultPayload> {
  const cacheKey = buildDiagnosisCacheKey(input);
  const cached = getCachedValue(diagnosisCache, cacheKey);
  if (cached) {
    return { ...cached, responseTimeMs: 1 };
  }

  const existingPromise = inFlightDiagnoses.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = executeCropDiagnosis(input)
    .then((result) => {
      setCachedValue(diagnosisCache, cacheKey, result, DIAGNOSIS_CACHE_TTL_MS, DIAGNOSIS_CACHE_MAX);
      return result;
    })
    .finally(() => {
      inFlightDiagnoses.delete(cacheKey);
    });

  inFlightDiagnoses.set(cacheKey, promise);
  return promise;
}

export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage
): Promise<{ audioBase64: string; mimeType: string }> {
  const trimmedText = text.trim().slice(0, 1200);
  const cacheKey = buildTtsCacheKey(trimmedText, language);

  const cached = getCachedValue(ttsCache, cacheKey);
  if (cached) {
    return cached;
  }

  const existingPromise = inFlightTts.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const styleByLang: Record<SupportedLanguage, string> = {
    bn: 'Warm, calm, reassuring rural agricultural advisor speaking clear natural Bengali at a steady, easy-to-follow pace',
    hi: 'Warm, calm, reassuring rural agricultural advisor speaking clear natural Hindi at a steady, easy-to-follow pace',
    en: 'Warm, calm, reassuring agricultural advisor speaking simple clear English at a steady, easy-to-follow pace',
  };

  const promise = (async () => {
    const ai = getAiClient();
    const response = await withRetry(async () => {
      return ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: trimmedText,
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

    const result = {
      audioBase64,
      mimeType: 'audio/wav',
    };
    setCachedValue(ttsCache, cacheKey, result, TTS_CACHE_TTL_MS, TTS_CACHE_MAX);
    return result;
  })().finally(() => {
    inFlightTts.delete(cacheKey);
  });

  inFlightTts.set(cacheKey, promise);
  return promise;
}
