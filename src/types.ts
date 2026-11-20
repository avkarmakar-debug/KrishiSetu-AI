export type Language = 'bn' | 'hi' | 'en';

export type CaseStatus = 'ai_answered' | 'with_expert' | 'verified';

export type AppScreen =
  | 'welcome'
  | 'home'
  | 'new_case'
  | 'result'
  | 'my_cases'
  | 'alerts'
  | 'agronomist'
  | 'insights';

export interface GroundedSource {
  title: string;
  url?: string;
}

export interface CropCase {
  id: string;
  createdAt: string; // ISO timestamp
  language: Language;
  district: string;
  photoDataUrl?: string; // base64 data URL or generated asset URL
  audioDataUrl?: string; // base64 audio data URL
  audioDurationSec?: number;
  noteText?: string;
  transcript?: string;

  // Diagnosis fields (initially from Gemini, editable by Agronomist)
  crop: string;
  likely_problem: string;
  confidence: number; // 0-100
  needs_expert: boolean;
  escalation_reason?: string;
  action_plan: string[];
  warning_signs: string[];
  sources: GroundedSource[];
  spoken_summary: string;

  // Workflow metadata
  status: CaseStatus;
  responseTimeMs: number;
  priorityConsultRequested?: boolean; // Simulated BDT 20-50 consult label

  // Human agronomist verification metadata
  verifiedAt?: string;
  agronomistName?: string;
  agronomistNote?: string;
  aiOriginalGuess?: string;
  aiOriginalConfidence?: number;
}

export interface DistrictAlertBundle {
  district: string;
  region: string;
  weather: {
    tempC: number;
    humidity: number;
    rainChance: number;
    condition: Record<Language, string>;
    advice: Record<Language, string>;
  };
  pest: {
    severity: 'high' | 'moderate' | 'low';
    crop: Record<Language, string>;
    title: Record<Language, string>;
    advice: Record<Language, string>;
  };
  prices: Array<{
    crop: Record<Language, string>;
    priceText: string;
    unit: Record<Language, string>;
    trend: 'up' | 'down' | 'stable';
    changeText: string;
  }>;
}
