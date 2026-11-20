import { INITIAL_SEEDED_CASES } from '../data/sampleData';
import type { CropCase, Language } from '../types';

const CASES_KEY = 'krishisetu_cases_v1';
const LANG_KEY = 'krishisetu_lang_v1';
const DISTRICT_KEY = 'krishisetu_district_v1';

export function loadSavedLanguage(): Language | null {
  try {
    const val = localStorage.getItem(LANG_KEY);
    if (val === 'bn' || val === 'hi' || val === 'en') {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSavedDistrict(): string {
  try {
    return localStorage.getItem(DISTRICT_KEY) || 'Rajshahi, Bangladesh';
  } catch {
    return 'Rajshahi, Bangladesh';
  }
}

export function saveDistrict(district: string): void {
  try {
    localStorage.setItem(DISTRICT_KEY, district);
  } catch {
    // Ignore
  }
}

export function loadCases(): CropCase[] {
  try {
    const raw = localStorage.getItem(CASES_KEY);
    if (raw === null) {
      localStorage.setItem(CASES_KEY, JSON.stringify(INITIAL_SEEDED_CASES));
      return INITIAL_SEEDED_CASES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as CropCase[];
    }
    return INITIAL_SEEDED_CASES;
  } catch {
    return INITIAL_SEEDED_CASES;
  }
}

export function restoreSampleCases(): CropCase[] {
  saveCases(INITIAL_SEEDED_CASES);
  return INITIAL_SEEDED_CASES;
}

export function saveCases(cases: CropCase[]): void {
  try {
    // Keep up to 30 most recent cases; strip bulky audio blobs from very old cases if needed
    const trimmed = cases.slice(0, 30);
    localStorage.setItem(CASES_KEY, JSON.stringify(trimmed));
  } catch {
    try {
      const compact = cases.slice(0, 15).map((c, idx) =>
        idx > 3 ? { ...c, audioDataUrl: undefined } : c
      );
      localStorage.setItem(CASES_KEY, JSON.stringify(compact));
    } catch {
      // Ignore storage full edge case
    }
  }
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
