import { ArrowRight, ShieldCheck, Sprout, Volume2, Square } from 'lucide-react';
import { ASSET_IMAGES } from '../data/sampleData';
import type { VoicePlaybackState } from '../hooks/useVoicePlayback';
import { TRANSLATIONS } from '../i18n/translations';
import type { Language } from '../types';
import { CropImage } from './CropImage';
import { PWAInstallBanner } from './PWAInstallBanner';
import { PWAInstallButton } from './PWAInstallButton';

interface WelcomeScreenProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language, enterHome: boolean) => void;
  voice: VoicePlaybackState;
}

const LANGUAGE_OPTIONS: Array<{
  code: Language;
  nativeLabel: string;
  englishLabel: string;
  regionLabel: string;
  shortMark: string;
}> = [
  {
    code: 'bn',
    nativeLabel: 'বাংলা',
    englishLabel: 'Bangla',
    regionLabel: 'বাংলাদেশ ও পশ্চিমবঙ্গ · Bangladesh & West Bengal',
    shortMark: 'বাং',
  },
  {
    code: 'hi',
    nativeLabel: 'हिन्दी',
    englishLabel: 'Hindi',
    regionLabel: 'बिहार, ओडिशा ও পূর্ব ভারত · Eastern India',
    shortMark: 'हि',
  },
  {
    code: 'en',
    nativeLabel: 'English',
    englishLabel: 'English',
    regionLabel: 'Simple English · Field & Reviewer Mode',
    shortMark: 'EN',
  },
];

export function WelcomeScreen({
  selectedLanguage,
  onSelectLanguage,
  voice,
}: WelcomeScreenProps) {
  const t = TRANSLATIONS[selectedLanguage];
  const isSpeakingGreeting = voice.isPlaying && voice.activeId === 'welcome-greeting';
  const isLoadingGreeting = voice.isLoading && voice.activeId === 'welcome-greeting';

  const handleLanguageTap = (lang: Language) => {
    const greeting = TRANSLATIONS[lang].voiceGreeting;
    void voice.speak(greeting, lang, 'welcome-greeting');
    onSelectLanguage(lang, true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-5xl">
        <PWAInstallBanner language={selectedLanguage} className="mb-4" />
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Visual Story Panel (desktop full height, compact top hero on mobile) */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-3xl bg-[#124E25] min-h-[220px] lg:min-h-[540px] flex flex-col justify-end">
          <CropImage
            src={ASSET_IMAGES.heroField}
            alt="Sunlit green rice paddy field in rural Bangladesh"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D3319]/95 via-[#0D3319]/45 to-transparent" />
          <div className="relative z-10 p-6 sm:p-8 text-white">
            <div className="flex items-center gap-2.5 text-[#F6C84C] text-sm font-semibold mb-3">
              <Sprout className="w-5 h-5" />
              <span>KrishiSetu</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              {t.tagline}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/90 leading-relaxed max-w-md">
              {t.welcomeSub}
            </p>
            <div className="mt-5 pt-4 border-t border-white/15 flex items-center gap-3 text-xs text-white/80">
              <span>1. Snap</span>
              <span aria-hidden="true">·</span>
              <span>2. Speak</span>
              <span aria-hidden="true">·</span>
              <span>3. Act</span>
              <span aria-hidden="true">·</span>
              <span>4. Trust</span>
            </div>
          </div>
        </div>

        {/* Right Language Selection & Voice Greeting Panel */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E6DF] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#1B7F3B]">{t.welcomeHeading}</p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#14231A]">
                  {t.chooseLanguagePrompt}
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  void voice.speak(t.voiceGreeting, selectedLanguage, 'welcome-greeting')
                }
                className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#E9F5EC] hover:bg-[#D9EFE0] text-[#135E2B] font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F3B]"
              >
                {isSpeakingGreeting ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
                <span>
                  {isLoadingGreeting
                    ? t.loadingVoice
                    : isSpeakingGreeting
                    ? t.stopAudio
                    : t.listenWelcome}
                </span>
              </button>
            </div>

            {/* Huge Touch-First Language Buttons */}
            <div className="mt-6 space-y-3.5">
              {LANGUAGE_OPTIONS.map((opt) => {
                const isActive = selectedLanguage === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleLanguageTap(opt.code)}
                    className={`w-full min-h-[78px] px-5 py-4 rounded-2xl border-2 text-left flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B7F3B] ${
                      isActive
                        ? 'border-[#1B7F3B] bg-[#F2FBF4]'
                        : 'border-[#E2E6DF] bg-white hover:border-[#1B7F3B]/50 hover:bg-[#FAFBF9]'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-13 h-13 rounded-2xl flex items-center justify-center font-display text-lg font-bold shrink-0 ${
                          isActive
                            ? 'bg-[#1B7F3B] text-white'
                            : 'bg-[#F0F3EE] text-[#14231A]'
                        }`}
                      >
                        {opt.shortMark}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <span className="font-display text-xl sm:text-2xl font-bold text-[#14231A]">
                            {opt.nativeLabel}
                          </span>
                          <span className="text-sm font-medium text-[#4A5D52]">
                            {opt.englishLabel}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#4A5D52] truncate mt-0.5">
                          {opt.regionLabel}
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-6 h-6 shrink-0 ${
                        isActive ? 'text-[#1B7F3B]' : 'text-[#7A8C80]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Guarantee & Install Prompt Footer */}
          <div className="mt-7 pt-5 border-t border-[#EAECE7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#4A5D52]">
              <ShieldCheck className="w-5 h-5 text-[#1B7F3B] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{t.privacyNote}</p>
            </div>
            <PWAInstallButton language={selectedLanguage} variant="subtle" voice={voice} />
          </div>
        </div>
      </div>
    </div>
  );
}
