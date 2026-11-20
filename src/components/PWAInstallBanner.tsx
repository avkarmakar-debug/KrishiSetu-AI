import { Download, MoreVertical, Share, Sprout, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { Language } from '../types';

interface PWAInstallBannerProps {
  language: Language;
  className?: string;
}

const BANNER_COPY: Record<
  Language,
  {
    title: string;
    subtitleReady: string;
    subtitleAndroidFallback: string;
    subtitleIOSFallback: string;
    installNow: string;
    dismiss: string;
  }
> = {
  bn: {
    title: 'KrishiSetu অ্যাপ ইনস্টল করুন',
    subtitleReady: '১ ট্যাপে হোম স্ক্রিনে যোগ করুন',
    subtitleAndroidFallback: 'Chrome ⋮ মেনু → Install app চাপুন',
    subtitleIOSFallback: 'Safari Share → Add to Home Screen',
    installNow: 'ইনস্টল',
    dismiss: 'বাদ দিন',
  },
  hi: {
    title: 'KrishiSetu ऐप इंस्टॉल करें',
    subtitleReady: '1 टैप में होम स्क्रीन पर जोड़ें',
    subtitleAndroidFallback: 'Chrome ⋮ मेन्यू → Install app दबाएं',
    subtitleIOSFallback: 'Safari Share → Add to Home Screen',
    installNow: 'इंस्टॉल',
    dismiss: 'हटाएं',
  },
  en: {
    title: 'Install KrishiSetu App',
    subtitleReady: 'Add to your home screen in 1 tap',
    subtitleAndroidFallback: 'Tap Chrome ⋮ menu → Install app',
    subtitleIOSFallback: 'Tap Safari Share → Add to Home Screen',
    installNow: 'Install',
    dismiss: 'Dismiss',
  },
};

export function PWAInstallBanner({
  language,
  className = '',
}: PWAInstallBannerProps) {
  const {
    isInstallable,
    isInstalled,
    isInIframe,
    installIntent,
    bannerDismissed,
    platform,
    install,
    dismissBanner,
  } = usePWAInstall();

  // Only show inline banner when directly in a top-level browser (not installed, not embedded, not dismissed)
  // AND either Chrome's native 1-tap prompt is ready OR the user explicitly opened via ?install=1.
  if (isInstalled || isInIframe || bannerDismissed) {
    return null;
  }

  if (!isInstallable && !installIntent) {
    return null;
  }

  const copy = BANNER_COPY[language];
  const fallbackSubtitle =
    platform === 'ios'
      ? copy.subtitleIOSFallback
      : copy.subtitleAndroidFallback;

  return (
    <div
      role="region"
      aria-label={copy.title}
      className={`rounded-2xl bg-[#E9F5EC] border border-[#BFE2C9] px-3.5 py-2.5 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#1B7F3B] text-white flex items-center justify-center shrink-0">
          <Sprout className="w-5 h-5 text-[#F6C84C]" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-[#14231A] truncate">
            {copy.title}
          </p>
          <p className="text-xs text-[#2B5939] flex items-center gap-1 truncate">
            {!isInstallable &&
              (platform === 'ios' ? (
                <Share className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <MoreVertical className="w-3.5 h-3.5 shrink-0" />
              ))}
            <span className="truncate">
              {isInstallable ? copy.subtitleReady : fallbackSubtitle}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isInstallable && (
          <button
            type="button"
            onClick={() => void install()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white font-display text-sm font-bold flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{copy.installNow}</span>
          </button>
        )}

        <button
          type="button"
          onClick={dismissBanner}
          aria-label={copy.dismiss}
          className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-[#D8EFE0] text-[#2B5939] flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
