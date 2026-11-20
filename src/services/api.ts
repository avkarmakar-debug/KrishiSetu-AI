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

export async function diagnoseCropViaApi(
  payload: DiagnoseRequestPayload
): Promise<DiagnoseResponsePayload> {
  const response = await fetch('/api/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ||
        'Unable to reach the crop advisor right now. Please try again.'
    );
  }

  return data as DiagnoseResponsePayload;
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

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !(data as { audioBase64?: string }).audioBase64) {
    throw new Error((data as { error?: string }).error || 'TTS failed');
  }

  return data as { audioBase64: string; mimeType: string };
}
