import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  RotateCcw,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';
import type { CaseStatus, CropCase, Language } from '../types';
import { formatRelativeTime } from '../utils/storage';
import { CropImage } from './CropImage';

interface MyCasesViewProps {
  cases: CropCase[];
  language: Language;
  onOpenCase: (cropCase: CropCase) => void;
  onStartNewCase: () => void;
  onDeleteCase: (caseId: string) => void;
  onClearAllCases: () => void;
  onRestoreSampleCases: () => void;
}

const CLEAR_LABELS: Record<
  Language,
  {
    clearAll: string;
    confirmPrompt: string;
    confirmYes: string;
    cancel: string;
    deleteOne: string;
    restoreSamples: string;
  }
> = {
  bn: {
    clearAll: 'সব মুছুন',
    confirmPrompt: 'আগের সব কেস ও চ্যাট মুছে ফেলবেন?',
    confirmYes: 'হ্যাঁ, সব মুছুন',
    cancel: 'থাক',
    deleteOne: 'এই কেস মুছুন',
    restoreSamples: 'নমুনা কেস ফিরিয়ে আনুন',
  },
  hi: {
    clearAll: 'सब हटाएं',
    confirmPrompt: 'क्या आप पिछले सभी केस और चैट हटाना चाहते हैं?',
    confirmYes: 'हां, सब हटाएं',
    cancel: 'रद्द करें',
    deleteOne: 'यह केस हटाएं',
    restoreSamples: 'नमूना केस वापस लाएं',
  },
  en: {
    clearAll: 'Clear all',
    confirmPrompt: 'Clear all saved cases and chat history from this phone?',
    confirmYes: 'Yes, clear all',
    cancel: 'Cancel',
    deleteOne: 'Delete case',
    restoreSamples: 'Load sample cases',
  },
};

export function MyCasesView({
  cases,
  language,
  onOpenCase,
  onStartNewCase,
  onDeleteCase,
  onClearAllCases,
  onRestoreSampleCases,
}: MyCasesViewProps) {
  const t = TRANSLATIONS[language];
  const labels = CLEAR_LABELS[language];
  const [filter, setFilter] = useState<'all' | CaseStatus>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered =
    filter === 'all' ? cases : cases.filter((item) => item.status === filter);

  const tabs: Array<{ key: 'all' | CaseStatus; label: string; count: number }> = [
    { key: 'all', label: t.filterAll, count: cases.length },
    {
      key: 'ai_answered',
      label: t.filterAi,
      count: cases.filter((c) => c.status === 'ai_answered').length,
    },
    {
      key: 'with_expert',
      label: t.filterExpert,
      count: cases.filter((c) => c.status === 'with_expert').length,
    },
    {
      key: 'verified',
      label: t.filterVerified,
      count: cases.filter((c) => c.status === 'verified').length,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 md:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14231A]">
            {t.myCasesTitle}
          </h1>
          <p className="text-sm text-[#4A5D52] mt-1">
            Saved on this phone · Tap any case to listen or read the action plan
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {cases.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear((prev) => !prev)}
              className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-white border border-[#E5C6C6] hover:bg-[#FEF2F2] text-[#991B1B] text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>{labels.clearAll}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartNewCase}
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{t.btnSnapPhoto}</span>
          </button>
        </div>
      </div>

      {/* Safe In-App Confirmation Bar for Clear All */}
      {confirmClear && cases.length > 0 && (
        <div className="mb-5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#991B1B]">
            {labels.confirmPrompt}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-white border border-[#DCE2D9] text-[#14231A] text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                onClearAllCases();
                setConfirmClear(false);
                setFilter('all');
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#C62828] hover:bg-[#991B1B] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              {labels.confirmYes}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Status Filter Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-[#ECEFE9] rounded-2xl overflow-x-auto mb-6">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
                active
                  ? 'bg-white text-[#14231A] shadow-xs'
                  : 'text-[#4A5D52] hover:text-[#14231A]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-xs tabular-nums opacity-75">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E6DF] p-10 text-center">
          <p className="text-base text-[#4A5D52]">{t.myCasesEmpty}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartNewCase}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white text-sm font-bold cursor-pointer"
            >
              {t.btnSnapPhoto}
            </button>
            {cases.length === 0 && (
              <button
                type="button"
                onClick={onRestoreSampleCases}
                className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#FAFBF9] border border-[#DCE2D9] hover:border-[#1B7F3B] text-[#314438] text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#1B7F3B]" />
                <span>{labels.restoreSamples}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E2E6DF] divide-y divide-[#EEF1EC] overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center hover:bg-[#FAFBF9] transition-colors"
            >
              <button
                type="button"
                onClick={() => onOpenCase(item)}
                className="flex-1 min-w-0 p-4 sm:p-5 flex items-center gap-4 text-left cursor-pointer"
              >
                <CropImage
                  src={item.photoDataUrl}
                  alt={item.crop}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-[#E2E6DF]"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#4A5D52] flex-wrap">
                    <span className="font-semibold text-[#314438]">{item.crop}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.district.split(',')[0]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{item.confidence}% confidence</span>
                  </div>

                  <h2 className="mt-1 font-display text-lg font-bold text-[#14231A] truncate">
                    {item.likely_problem}
                  </h2>

                  <div className="mt-2 flex items-center gap-4 flex-wrap text-xs font-semibold">
                    {item.status === 'verified' ? (
                      <span className="text-[#0F766E] flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4" />
                        {t.verifiedBadge}
                      </span>
                    ) : item.status === 'with_expert' ? (
                      <span className="text-[#B45309] flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {t.withExpertBadge}
                      </span>
                    ) : (
                      <span className="text-[#1B7F3B] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {t.aiAnswerBadge}
                      </span>
                    )}

                    <span className="text-[#4A5D52] font-normal flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-[#1B7F3B]" />
                      Voice plan ready
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#7A8C80] shrink-0" />
              </button>

              <div className="pr-3 sm:pr-4 shrink-0">
                <button
                  type="button"
                  onClick={() => onDeleteCase(item.id)}
                  aria-label={labels.deleteOne}
                  title={labels.deleteOne}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-[#7A8C80] hover:text-[#991B1B] hover:bg-[#FEF2F2] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

