import type { GroundedSource, Language } from '../types';

export interface DiagnoseRequestPayload {
  imageBase64?: string;
  imageMimeType?: string;
  audioBase64?: string;
  audioMimeType?: string;
  noteText?: string;
  language: Language;
  district?: string;
  cropHint?: string;
}

export interface DiagnoseResponsePayload {
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

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

export async function diagnoseCropViaApi(
  payload: DiagnoseRequestPayload
): Promise<DiagnoseResponsePayload> {
  const response = await fetch('/api/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new ApiRequestError(
      data.error || 'Unable to reach the crop advisor right now. Please try again.',
      response.status,
      data.code
    );
  }

  return data as unknown as DiagnoseResponsePayload;
}

export async function requestTtsAudio(
  text: string,
  language: Language
): Promise<{ audioBase64: string; mimeType: string }> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    audioBase64?: string;
    mimeType?: string;
    error?: string;
    code?: string;
  };
  if (!response.ok || !data.audioBase64) {
    throw new ApiRequestError(data.error || 'TTS failed', response.status, data.code);
  }

  return { audioBase64: data.audioBase64, mimeType: data.mimeType || 'audio/wav' };
}
