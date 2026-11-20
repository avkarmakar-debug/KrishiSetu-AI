import {
  Download,
  Loader2,
  MoreVertical,
  Share,
  Smartphone,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall, type InstallPlatform } from '../hooks/usePWAInstall';
import type { VoicePlaybackState } from '../hooks/useVoicePlayback';
import type { Language } from '../types';

interface PWAInstallButtonProps {
  language?: Language;
  variant?: 'default' | 'subtle' | 'header' | 'menu';
  voice?: VoicePlaybackState;
}

interface InstallCopy {
  buttonLabel: string;
  buttonShort: string;
  menuHint: string;
  menuPreviewHint: string;
  fallbackTitle: string;
  androidHint: string;
  iosHint: string;
  desktopHint: string;
  listenHint: string;
  loadingVoice: string;
  stopVoice: string;
  close: string;
}

const INSTALL_COPY: Record<Language, InstallCopy> = {
  bn: {
    buttonLabel: 'অ্যাপ ইনস্টল',
    buttonShort: 'অ্যাপ',
    menuHint: '১ ট্যাপে ইনস্টল',
    menuPreviewHint: 'Chrome-এ খুলুন',
    fallbackTitle: 'ফোনে KrishiSetu যোগ করুন',
    androidHint: 'Chrome-এর উপরে ডানদিকে ⋮ মেনু → "Install app" বা "Add to Home screen" চাপুন।',
    iosHint: 'Safari-এর নিচে Share আইকন → "Add to Home Screen" চাপুন।',
    desktopHint: 'ব্রাউজারের অ্যাড্রেস বারের Install আইকন অথবা ⋮ → "Install KrishiSetu" চাপুন।',
    listenHint: 'শুনুন (বাংলায়)',
    loadingVoice: 'অডিও চালু হচ্ছে...',
    stopVoice: 'থামান',
    close: 'ঠিক আছে',
  },
  hi: {
    buttonLabel: 'ऐप इंस्टॉल',
    buttonShort: 'ऐप',
    menuHint: '1 टैप में इंस्टॉल',
    menuPreviewHint: 'Chrome में खोलें',
    fallbackTitle: 'फोन में KrishiSetu जोड़ें',
    androidHint: 'Chrome में ऊपर दाईं ओर ⋮ मेन्यू → "Install app" या "Add to Home screen" दबाएं।',
    iosHint: 'Safari में नीचे Share बटन → "Add to Home Screen" दबाएं।',
    desktopHint: 'ब्राउज़र एड्रेस बार में Install आइकन या ⋮ → "Install KrishiSetu" चुनें।',
    listenHint: 'सुनें (हिन्दी में)',
    loadingVoice: 'ऑडियो चल रहा है...',
    stopVoice: 'रोकें',
    close: 'ठीक है',
  },
  en: {
    buttonLabel: 'Install App',
    buttonShort: 'Install',
    menuHint: '1-tap install',
    menuPreviewHint: 'Open in Chrome',
    fallbackTitle: 'Add KrishiSetu to Home Screen',
    androidHint: 'Tap Chrome’s top-right ⋮ menu → "Install app" (or "Add to Home screen").',
    iosHint: 'Tap Safari’s Share button → "Add to Home Screen".',
    desktopHint: 'Click the Install icon in the address bar or ⋮ → "Install KrishiSetu".',
    listenHint: 'Listen',
    loadingVoice: 'Starting voice...',
    stopVoice: 'Stop',
    close: 'Got it',
  },
};

function getHintText(copy: InstallCopy, platform: InstallPlatform): string {
  if (platform === 'ios') return copy.iosHint;
  if (platform === 'android') return copy.androidHint;
  return copy.desktopHint;
}

export function PWAInstallButton({
  language = 'en',
  variant = 'default',
  voice,
}: PWAInstallButtonProps) {
  const {
    isInstallable,
    isInstalled,
    platform,
    isInIframe,
    standaloneInstallUrl,
    install,
  } = usePWAInstall();
  const [showHint, setShowHint] = useState(false);
  const copy = INSTALL_COPY[language];
  const voiceKey = `pwa-install-hint-${language}`;
  const hintText = getHintText(copy, platform);

  const closeHint = () => {
    setShowHint(false);
    if (voice && voice.activeId === voiceKey) {
      voice.stop();
    }
  };

  useEffect(() => {
    if (!showHint) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHint(false);
        if (voice && voice.activeId === voiceKey) {
          voice.stop();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHint, voice, voiceKey]);

  if (isInstalled) {
    return null;
  }

  const handleDirectClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowHint(true);
  };

  const getButtonClassName = () => {
    if (variant === 'header') {
      return 'min-h-[44px] px-3 py-2 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-display text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer';
    }
    if (variant === 'menu') {
      return 'w-full min-h-[52px] px-4 py-2.5 rounded-2xl bg-[#E9F5EC] hover:bg-[#D8EFE0] border border-[#BFE2C9] flex items-center justify-between gap-3 text-sm font-bold text-[#135E2B] transition-colors cursor-pointer';
    }
    return `min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      variant === 'default'
        ? 'bg-[#1B7F3B] hover:bg-[#135E2B] text-white'
        : 'bg-white border border-[#DCE2D9] hover:border-[#1B7F3B] text-[#14231A]'
    }`;
  };

  const renderInnerContent = () => {
    if (variant === 'header') {
      return (
        <>
          <Download className="w-4 h-4 shrink-0 text-[#F6C84C]" />
          <span className="sm:hidden">{copy.buttonShort}</span>
          <span className="hidden sm:inline">{copy.buttonLabel}</span>
        </>
      );
    }
    if (variant === 'menu') {
      return (
        <>
          <span className="flex items-center gap-3 min-w-0">
            <Download className="w-5 h-5 text-[#1B7F3B] shrink-0" />
            <span className="truncate">{copy.buttonLabel}</span>
          </span>
          <span className="text-xs font-semibold text-[#1B7F3B] whitespace-nowrap shrink-0">
            {isInIframe ? copy.menuPreviewHint : copy.menuHint}
          </span>
        </>
      );
    }
    return (
      <>
        <Download
          className={`w-4 h-4 shrink-0 ${
            variant === 'default' ? 'text-white' : 'text-[#1B7F3B]'
          }`}
        />
        <span>{copy.buttonLabel}</span>
      </>
    );
  };

  // Inside an embedded preview iframe, launch KrishiSetu's standalone URL in 1 tap (?install=1)
  // so Android Chrome immediately exits the iframe and enables native 1-tap installation.
  if (isInIframe && !isInstallable) {
    return (
      <a
        href={standaloneInstallUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={getButtonClassName()}
      >
        {renderInnerContent()}
      </a>
    );
  }

  const isPlayingHint = Boolean(voice && voice.isPlaying && voice.activeId === voiceKey);
  const isLoadingHint = Boolean(voice && voice.isLoading && voice.activeId === voiceKey);
  const HintIcon = platform === 'ios' ? Share : MoreVertical;

  const fallbackModal =
    showHint && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-hint-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeHint();
            }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#14231A]/55 backdrop-blur-xs p-0 sm:p-4"
          >
            <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#FAF9F5] border border-[#DCE2D9] p-5 shadow-2xl space-y-4">
              <div className="sm:hidden w-10 h-1 rounded-full bg-[#CBD4C9] mx-auto -mt-1" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#1B7F3B] text-white flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3
                    id="pwa-hint-title"
                    className="font-display text-base font-bold text-[#14231A] leading-snug"
                  >
                    {copy.fallbackTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeHint}
                  aria-label={copy.close}
                  className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[#ECEFE9] flex items-center justify-center text-[#4A5D52] shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl bg-white border border-[#DCE2D9] p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E9F5EC] text-[#1B7F3B] flex items-center justify-center shrink-0 mt-0.5">
                  <HintIcon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-[#14231A] leading-relaxed">
                  {hintText}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {voice && (
                  <button
                    type="button"
                    onClick={() =>
                      void voice.speak(`${copy.fallbackTitle}. ${hintText}`, language, voiceKey)
                    }
                    className={`min-h-[48px] px-4 rounded-xl font-display text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isPlayingHint
                        ? 'bg-[#14231A] text-white'
                        : 'bg-[#E9F5EC] hover:bg-[#D8EFE0] border border-[#BFE2C9] text-[#135E2B]'
                    }`}
                  >
                    {isLoadingHint ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isPlayingHint ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span>
                      {isLoadingHint
                        ? copy.loadingVoice
                        : isPlayingHint
                        ? copy.stopVoice
                        : copy.listenHint}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeHint}
                  className="flex-1 min-h-[48px] rounded-xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white font-display text-sm font-bold transition-colors cursor-pointer"
                >
                  {copy.close}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => void handleDirectClick()}
        className={getButtonClassName()}
      >
        {renderInnerContent()}
      </button>
      {fallbackModal}
    </>
  );
}


