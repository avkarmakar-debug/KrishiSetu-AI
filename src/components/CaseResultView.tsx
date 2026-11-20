import {
  ArrowLeft,
  Volume2,
  Square,
  CheckCircle2,
  BadgeCheck,
  Clock,
  AlertTriangle,
  ExternalLink,
  UserCheck,
  Camera,
  Loader2,
  BookOpen,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import type { VoicePlaybackState } from '../hooks/useVoicePlayback';
import { TRANSLATIONS } from '../i18n/translations';
import type { CropCase, Language } from '../types';
import { formatRelativeTime } from '../utils/storage';
import { CropImage } from './CropImage';

interface CaseResultViewProps {
  cropCase: CropCase;
  language: Language;
  voice: VoicePlaybackState;
  onBack: () => void;
  onCheckAnother: () => void;
  onRequestEscalation: (caseId: string, priorityConsult: boolean) => void;
  onOpenAgronomistQueue: (caseId: string) => void;
}

export function CaseResultView({
  cropCase,
  language,
  voice,
  onBack,
  onCheckAnother,
  onRequestEscalation,
  onOpenAgronomistQueue,
}: CaseResultViewProps) {
  const t = TRANSLATIONS[language];
  const [showSources, setShowSources] = useState(false);

  const isVerified = cropCase.status === 'verified';
  const isWithExpert = cropCase.status === 'with_expert';
  const voiceKey = `case-${cropCase.id}`;
  const isPlayingThis = voice.isPlaying && voice.activeId === voiceKey;
  const isLoadingThis = voice.isLoading && voice.activeId === voiceKey;

  const spokenPayload =
    cropCase.spoken_summary ||
    `${cropCase.crop}. ${cropCase.likely_problem}. ${cropCase.action_plan.join('. ')}`;

  const confidenceTone =
    cropCase.confidence >= 75
      ? { bar: 'bg-[#1B7F3B]', text: 'text-[#135E2B]', label: t.highConfidence }
      : cropCase.confidence >= 70
      ? { bar: 'bg-[#D97706]', text: 'text-[#B45309]', label: t.mediumConfidence }
      : { bar: 'bg-[#D97706]', text: 'text-[#B45309]', label: t.lowConfidence };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-28 md:pb-12 space-y-5">
      {/* Simple Back Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE2D9] hover:bg-[#F3F6F2] text-sm font-bold text-[#14231A] flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </button>

        <span className="text-xs text-[#4A5D52] font-mono tabular-nums">
          {formatRelativeTime(cropCase.createdAt)}
        </span>
      </div>

      {/* WhatsApp-Style Warm Thread */}
      <div className="bg-[#EFECE3]/60 rounded-3xl border border-[#DFE4DC] p-4 sm:p-5 space-y-4">
        {/* Compact Farmer Photo / Voice Bubble */}
        {(cropCase.photoDataUrl || cropCase.audioDataUrl) && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#DCF5E3] border border-[#BEE3C9] p-3">
              {cropCase.photoDataUrl && (
                <CropImage
                  src={cropCase.photoDataUrl}
                  alt={cropCase.crop}
                  className="w-48 h-32 object-cover rounded-xl"
                />
              )}
              {cropCase.audioDataUrl && (
                <audio controls src={cropCase.audioDataUrl} className="w-full h-9 mt-2" />
              )}
            </div>
          </div>
        )}

        {/* Main Advisor Answer Card */}
        <div className="bg-white rounded-3xl border border-[#DCE2D9] p-5 sm:p-6 space-y-5">
          {/* Status Line */}
          <div className="flex items-center gap-2.5">
            {isVerified ? (
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-sm">
                <BadgeCheck className="w-5 h-5 shrink-0" />
                <span>{t.verifiedBadge}</span>
              </div>
            ) : isWithExpert ? (
              <div className="flex items-center gap-2 text-[#B45309] font-bold text-sm">
                <Clock className="w-5 h-5 shrink-0" />
                <span>{t.withExpertBadge}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#1B7F3B] font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{t.aiAnswerBadge}</span>
              </div>
            )}
          </div>

          {/* GIANT VOICE PLAYBACK BUTTON FIRST (Zero reading needed!) */}
          <button
            type="button"
            onClick={() => void voice.speak(spokenPayload, cropCase.language || language, voiceKey)}
            className={`w-full min-h-[68px] px-5 py-4 rounded-2xl font-display text-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer ${
              isPlayingThis
                ? 'bg-[#14231A] text-white'
                : 'bg-[#1B7F3B] hover:bg-[#135E2B] text-white'
            }`}
          >
            {isLoadingThis ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : isPlayingThis ? (
              <Square className="w-6 h-6 fill-current" />
            ) : (
              <Volume2 className="w-7 h-7" />
            )}
            <span>
              {isLoadingThis
                ? t.loadingVoice
                : isPlayingThis
                ? t.stopAudio
                : t.listenInLanguage}
            </span>
          </button>

          {/* Escalated / Not Sure Safety Card */}
          {isWithExpert && (
            <div className="rounded-2xl bg-[#FFFBEB] border border-[#F5D07E] p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-[#B45309] shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-xl font-bold text-[#92400E]">
                    {t.notSureHeadline}
                  </h2>
                  <p className="mt-1 text-sm sm:text-base text-[#78350F] leading-relaxed">
                    {t.notSureMessage}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => onRequestEscalation(cropCase.id, true)}
                  disabled={cropCase.priorityConsultRequested}
                  className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer ${
                    cropCase.priorityConsultRequested
                      ? 'bg-[#E9F5EC] text-[#135E2B] border border-[#B7DFC2]'
                      : 'bg-white hover:bg-[#FEF7E0] text-[#92400E] border border-[#E5A100]'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {cropCase.priorityConsultRequested
                      ? t.expertConsultRequested
                      : t.requestPriorityConsult}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAgronomistQueue(cropCase.id)}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#14231A] hover:bg-[#1F3527] text-white text-sm font-semibold cursor-pointer"
                >
                  {t.openAgronomistDemo}
                </button>
              </div>
            </div>
          )}

          {/* Clear Crop & Problem Headline + Simple Confidence Bar */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#4A5D52]">{cropCase.crop}</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14231A] leading-snug">
                {cropCase.likely_problem}
              </h2>
            </div>

            <div className="rounded-2xl bg-[#F8FAF7] border border-[#E4EAE2] p-3.5">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                <span className={`font-bold ${confidenceTone.text}`}>
                  {confidenceTone.label}
                </span>
                <span className="font-mono font-bold text-[#14231A] tabular-nums">
                  {cropCase.confidence}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#E3E9E2] overflow-hidden">
                <div
                  className={`h-full rounded-full ${confidenceTone.bar}`}
                  style={{ width: `${Math.max(6, Math.min(100, cropCase.confidence))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Agronomist Verified Note */}
          {isVerified && cropCase.agronomistNote && (
            <div className="rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] p-4 text-sm text-[#064E3B]">
              <p className="font-bold text-xs text-[#065F46] mb-1">
                {cropCase.agronomistName || t.verifiedBadge}
              </p>
              <p className="leading-relaxed">{cropCase.agronomistNote}</p>
            </div>
          )}

          {/* Simple Large Numbered Action Steps */}
          {cropCase.action_plan.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-bold text-[#14231A] mb-3">
                {t.actionPlanTitle}
              </h3>
              <ol className="space-y-2.5">
                {cropCase.action_plan.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAFBF9] border border-[#E8ECE6]"
                  >
                    <span className="w-8 h-8 rounded-xl bg-[#1B7F3B] text-white font-mono text-base font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <p className="text-base text-[#14231A] leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Warning Signs */}
          {cropCase.warning_signs.length > 0 && (
            <div className="rounded-2xl bg-[#FEF2F2]/80 border border-[#FECACA] p-4">
              <h3 className="text-sm font-bold text-[#991B1B] flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{t.warningSignsTitle}</span>
              </h3>
              <ul className="space-y-1.5 text-sm text-[#7F1D1D]">
                {cropCase.warning_signs.map((sign, i) => (
                  <li key={i}>• {sign}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Trusted Sources (keeps farmer screen clean & readable) */}
          {cropCase.sources.length > 0 && (
            <div className="border-t border-[#EEF1EC] pt-3">
              <button
                type="button"
                onClick={() => setShowSources((prev) => !prev)}
                className="w-full py-1.5 flex items-center justify-between text-xs font-bold text-[#4A5D52] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#1B7F3B]" />
                  {t.trustedSourcesTitle} ({cropCase.sources.length})
                </span>
                {showSources ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showSources && (
                <div className="mt-2 space-y-2">
                  {cropCase.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-[#314438] flex items-center justify-between gap-2 py-1"
                    >
                      <span className="truncate">{src.title}</span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1B7F3B] hover:underline flex items-center gap-1 shrink-0 font-semibold"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Simple Actions */}
          <div className="pt-2 space-y-2.5">
            {cropCase.status === 'ai_answered' && (
              <button
                type="button"
                onClick={() => onRequestEscalation(cropCase.id, false)}
                className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-[#FEF7E0] hover:bg-[#FDEFC4] border border-[#E5A100]/60 text-[#78350F] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t.askExpertAnyway}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCheckAnother}
              className="w-full min-h-[54px] px-5 py-3 rounded-2xl bg-[#F2F6F3] hover:bg-[#E4EFE7] text-[#135E2B] text-base font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>{t.checkAnotherCrop}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
