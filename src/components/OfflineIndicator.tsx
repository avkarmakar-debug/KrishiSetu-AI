import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { Language } from '../types';

interface OfflineIndicatorProps {
  language?: Language;
}

const OFFLINE_TEXT: Record<Language, string> = {
  bn: 'অফলাইন মোড — সংরক্ষিত কেস ও সতর্কতা দেখা যাচ্ছে।',
  hi: 'ऑफलाइन मोड — सहेजे गए केस और अलर्ट उपलब्ध हैं।',
  en: 'Offline mode — Saved cases & cached alerts remain available.',
};

export function OfflineIndicator({ language = 'en' }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-18 md:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-2xl bg-[#92400E] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{OFFLINE_TEXT[language]}</span>
    </div>
  );
}
