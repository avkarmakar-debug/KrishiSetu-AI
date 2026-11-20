import {
  Camera,
  Mic,
  ClipboardList,
  CloudSun,
  Bug,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  Volume2,
  Square,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import { DISTRICT_ALERTS } from '../data/sampleData';
import type { VoicePlaybackState } from '../hooks/useVoicePlayback';
import { TRANSLATIONS } from '../i18n/translations';
import type { AppScreen, CropCase, Language } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface FarmerHomeProps {
  language: Language;
  district: string;
  cases: CropCase[];
  voice: VoicePlaybackState;
  onChangeLanguage: (lang: Language) => void;
  onStartNewCase: (initialMode: 'camera' | 'voice') => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenCase: (cropCase: CropCase) => void;
}

export function FarmerHome({
  language,
  district,
  cases,
  voice,
  onChangeLanguage,
  onStartNewCase,
  onNavigate,
}: FarmerHomeProps) {
  const t = TRANSLATIONS[language];
  const alertBundle =
    DISTRICT_ALERTS.find((d) => d.district === district) || DISTRICT_ALERTS[0];

  const verifiedCount = cases.filter((c) => c.status === 'verified').length;
  const pendingCount = cases.filter((c) => c.status === 'with_expert').length;
  const isPlayingGreeting = voice.isPlaying && voice.activeId === 'home-greeting';

  const handleQuickLang = (lang: Language) => {
    onChangeLanguage(lang);
    void voice.speak(TRANSLATIONS[lang].voiceGreeting, lang, 'home-greeting');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 md:pb-12 space-y-6">
      {/* Top Simple Bar: Language Pills (interactive toggle) + Listen Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-[#ECEFE9] rounded-2xl">
          {(['bn', 'hi', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleQuickLang(lang)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                language === lang
                  ? 'bg-[#1B7F3B] text-white'
                  : 'text-[#314438] hover:bg-white/70'
              }`}
            >
              {lang === 'bn' ? 'বাংলা' : lang === 'hi' ? 'हिन्दी' : 'English'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton language={language} variant="subtle" />
          <button
            type="button"
            onClick={() => void voice.speak(t.voiceGreeting, language, 'home-greeting')}
            aria-label={t.listenWelcome}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isPlayingGreeting
                ? 'bg-[#14231A] text-white'
                : 'bg-[#E9F5EC] hover:bg-[#D8EFE0] text-[#135E2B]'
            }`}
          >
            {isPlayingGreeting ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
            <span>{isPlayingGreeting ? t.stopAudio : t.listenWelcome}</span>
          </button>
        </div>
      </div>

      {/* Short, Friendly 1-Line Question */}
      <div className="text-center sm:text-left pt-1">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#14231A] leading-tight">
          {t.homeGreeting}
        </h1>
        <p className="mt-1.5 text-base text-[#4A5D52]">{t.homePrompt}</p>
      </div>

      {/* THREE HUGE, IMPOSSIBLE-TO-MISS FARMER BUTTONS */}
      <div className="space-y-4">
        {/* 1. SNAP A PHOTO */}
        <button
          type="button"
          onClick={() => onStartNewCase('camera')}
          className="w-full min-h-[112px] px-6 py-5 rounded-3xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white text-left flex items-center justify-between gap-4 shadow-sm transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F3B]"
        >
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 rounded-2xl bg-white/18 flex items-center justify-center shrink-0">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <div>
              <span className="block font-display text-2xl sm:text-3xl font-bold leading-snug">
                {t.btnSnapPhoto}
              </span>
              <span className="block text-sm sm:text-base text-white/90 mt-0.5">
                {t.btnSnapDesc}
              </span>
            </div>
          </div>
          <ChevronRight className="w-8 h-8 text-white/80 shrink-0" />
        </button>

        {/* 2. SPEAK */}
        <button
          type="button"
          onClick={() => onStartNewCase('voice')}
          className="w-full min-h-[108px] px-6 py-5 rounded-3xl bg-[#FEF7E0] hover:bg-[#FDEFC4] border-2 border-[#E5A100] text-[#14231A] text-left flex items-center justify-between gap-4 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5A100]"
        >
          <div className="flex items-center gap-5">
            <div className="w-18 h-18 rounded-2xl bg-[#E5A100] flex items-center justify-center shrink-0">
              <Mic className="w-10 h-10 text-[#14231A]" />
            </div>
            <div>
              <span className="block font-display text-2xl sm:text-3xl font-bold leading-snug">
                {t.btnSpeak}
              </span>
              <span className="block text-sm sm:text-base text-[#4A5D52] mt-0.5">
                {t.btnSpeakDesc}
              </span>
            </div>
          </div>
          <ChevronRight className="w-8 h-8 text-[#946600] shrink-0" />
        </button>

        {/* 3. MY CASES */}
        <button
          type="button"
          onClick={() => onNavigate('my_cases')}
          className="w-full min-h-[92px] px-6 py-4 rounded-3xl bg-white hover:bg-[#F5F8F4] border-2 border-[#DCE2D9] text-[#14231A] text-left flex items-center justify-between gap-4 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F3B]"
        >
          <div className="flex items-center gap-5">
            <div className="w-15 h-15 rounded-2xl bg-[#E9F5EC] flex items-center justify-center shrink-0">
              <ClipboardList className="w-8 h-8 text-[#1B7F3B]" />
            </div>
            <div>
              <span className="block font-display text-2xl font-bold leading-snug">
                {t.btnMyCases} ({cases.length})
              </span>
              <div className="mt-1 flex items-center gap-3 text-xs sm:text-sm font-semibold">
                {verifiedCount > 0 && (
                  <span className="text-[#0F766E] flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4" />
                    <span className="tabular-nums">{verifiedCount}</span>
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-[#B45309] flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="tabular-nums">{pendingCount}</span>
                  </span>
                )}
                <span className="font-normal text-[#4A5D52] truncate">
                  {t.btnMyCasesDesc}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-7 h-7 text-[#6B7E72] shrink-0" />
        </button>
      </div>

      {/* Compact 3-Icon Local Alerts Strip (Weather · Pest · Price) */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-[#4A5D52]">
            {alertBundle.district.split(',')[0]} · {t.alertsRowTitle}
          </span>
          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="text-xs font-bold text-[#1B7F3B] hover:underline cursor-pointer"
          >
            {t.viewAllAlerts} →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="min-h-[82px] p-3.5 rounded-2xl bg-white border border-[#E2E6DF] hover:border-[#1B7F3B] flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
          >
            <CloudSun className="w-6 h-6 text-[#1B7F3B]" />
            <span className="font-mono text-base font-bold text-[#14231A] tabular-nums">
              {alertBundle.weather.tempC}°C
            </span>
            <span className="text-[11px] font-medium text-[#4A5D52] truncate max-w-full">
              {t.weatherTitle}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="min-h-[82px] p-3.5 rounded-2xl bg-white border border-[#E2E6DF] hover:border-[#E5A100] flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
          >
            <Bug className="w-6 h-6 text-[#B45309]" />
            <span className="text-xs font-bold text-[#B45309]">
              {alertBundle.pest.severity === 'high' ? 'High risk' : 'Watch'}
            </span>
            <span className="text-[11px] font-medium text-[#4A5D52] truncate max-w-full">
              {alertBundle.pest.crop[language]}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="min-h-[82px] p-3.5 rounded-2xl bg-white border border-[#E2E6DF] hover:border-[#1B7F3B] flex flex-col items-center justify-center text-center gap-1 cursor-pointer"
          >
            <TrendingUp className="w-6 h-6 text-[#1B7F3B]" />
            <span className="font-mono text-xs sm:text-sm font-bold text-[#14231A] tabular-nums">
              {alertBundle.prices[0].priceText}
            </span>
            <span className="text-[11px] font-medium text-[#4A5D52] truncate max-w-full">
              {alertBundle.prices[0].crop[language]}
            </span>
          </button>
        </div>
      </div>

      {/* Short Reassuring Privacy Line */}
      <div className="rounded-2xl bg-[#F2F6F3] border border-[#DCE5DE] p-3.5 flex items-start gap-2.5 text-xs text-[#314438]">
        <ShieldCheck className="w-4 h-4 text-[#1B7F3B] shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.privacyNote}</p>
      </div>
    </div>
  );
}
