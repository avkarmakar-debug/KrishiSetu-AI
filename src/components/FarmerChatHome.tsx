import {
  Camera,
  ImagePlus,
  Mic,
  Phone,
  Square,
  Send,
  Volume2,
  Play,
  Loader2,
  CheckCircle2,
  BadgeCheck,
  Clock,
  ShieldAlert,
  UserCheck,
  Keyboard,
  X,
  Sprout,
  CloudSun,
  Bug,
  TrendingUp,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  DISTRICT_ALERTS,
  SAMPLE_TEST_PRESETS,
  type SampleTestPreset,
} from '../data/sampleData';
import type { VoicePlaybackState } from '../hooks/useVoicePlayback';
import { TRANSLATIONS } from '../i18n/translations';
import { diagnoseCropViaApi } from '../services/api';
import type { AppScreen, CropCase, Language } from '../types';
import { blobToBase64, compressImageFile, imageUrlToBase64 } from '../utils/imageUtils';
import { formatRelativeTime } from '../utils/storage';
import { CropImage } from './CropImage';
import { PWAInstallBanner } from './PWAInstallBanner';
import { PWAInstallButton } from './PWAInstallButton';

interface FarmerChatHomeProps {
  language: Language;
  district: string;
  cases: CropCase[];
  voice: VoicePlaybackState;
  onChangeLanguage: (lang: Language) => void;
  onDistrictChange: (district: string) => void;
  onCaseCreated: (newCase: CropCase) => void;
  onOpenCase: (cropCase: CropCase) => void;
  onStartPhoneCall: () => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenAgronomistQueue: (caseId: string) => void;
  onDeleteCase: (caseId: string) => void;
  onClearAllCases: () => void;
}

const CHAT_LABELS: Record<
  Language,
  {
    callBtn: string;
    voiceGuidePrompt: string;
    tapPhoto: string;
    tapGallery: string;
    tapMic: string;
    recording: string;
    sendNow: string;
    trySample: string;
    playVoiceAnswer: string;
    stopVoice: string;
    fullPlan: string;
    typeOptional: string;
    sendHint: string;
    clearChat: string;
    confirmClearChat: string;
    confirmYes: string;
    cancel: string;
    deleteItem: string;
  }
> = {
  bn: {
    callBtn: 'কল করুন',
    voiceGuidePrompt: 'পাতার ছবি তুলুন, গ্যালারি থেকে দিন বা মাইকে কথা বলুন — আমি বাংলায় সমাধান শোনাব।',
    tapPhoto: 'ক্যামেরা',
    tapGallery: 'গ্যালারি',
    tapMic: 'কথা বলুন',
    recording: 'শুনছি... থামাতে চাপ দিন',
    sendNow: 'পাঠান',
    trySample: 'নমুনা পাতা:',
    playVoiceAnswer: 'উত্তর শুনুন (বাংলায়)',
    stopVoice: 'থামান',
    fullPlan: 'বিস্তারিত দেখুন',
    typeOptional: 'লিখুন (জরুরি নয়)',
    sendHint: 'ছবি বা ভয়েস পাঠান',
    clearChat: 'আগের চ্যাট মুছুন',
    confirmClearChat: 'আগের সব কেস ও চ্যাট মুছে ফেলবেন?',
    confirmYes: 'হ্যাঁ, মুছুন',
    cancel: 'থাক',
    deleteItem: 'মুছুন',
  },
  hi: {
    callBtn: 'कॉल करें',
    voiceGuidePrompt: 'पत्ते की फोटो लें, गैलरी से चुनें या माइक दबाकर बोलें — मैं हिन्दी में उपाय सुनाऊंगा।',
    tapPhoto: 'कैमरा',
    tapGallery: 'गैलरी',
    tapMic: 'बोलें',
    recording: 'सुन रहे हैं... रोकने के लिए दबाएं',
    sendNow: 'भेजें',
    trySample: 'नमूना पत्ता:',
    playVoiceAnswer: 'जवाब सुनें (हिन्दी में)',
    stopVoice: 'रोकें',
    fullPlan: 'पूरा देखें',
    typeOptional: 'लिखें (जरूरी नहीं)',
    sendHint: 'फोटो या आवाज भेजें',
    clearChat: 'पिछली चैट साफ करें',
    confirmClearChat: 'क्या पिछले सभी केस और चैट हटाएं?',
    confirmYes: 'हां, हटाएं',
    cancel: 'रद्द करें',
    deleteItem: 'हटाएं',
  },
  en: {
    callBtn: 'Call',
    voiceGuidePrompt: 'Take a leaf photo, pick from gallery, or tap the mic — I will speak the advice back to you.',
    tapPhoto: 'Camera',
    tapGallery: 'Gallery',
    tapMic: 'Speak',
    recording: 'Recording... tap to stop',
    sendNow: 'Send',
    trySample: 'Sample leaf:',
    playVoiceAnswer: 'Listen to advice',
    stopVoice: 'Stop',
    fullPlan: 'Full details',
    typeOptional: 'Type (optional)',
    sendHint: 'Tap camera, gallery, or mic below',
    clearChat: 'Clear history',
    confirmClearChat: 'Clear all previous cases and chat history?',
    confirmYes: 'Yes, clear',
    cancel: 'Cancel',
    deleteItem: 'Delete',
  },
};

export function FarmerChatHome({
  language,
  district,
  cases,
  voice,
  onChangeLanguage,
  onDistrictChange,
  onCaseCreated,
  onOpenCase,
  onStartPhoneCall,
  onNavigate,
  onOpenAgronomistQueue,
  onDeleteCase,
  onClearAllCases,
}: FarmerChatHomeProps) {
  const t = TRANSLATIONS[language];
  const labels = CHAT_LABELS[language];
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const isSubmittingRef = useRef(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoMimeType, setPhotoMimeType] = useState<string | undefined>(undefined);
  const [cropHint, setCropHint] = useState<string | undefined>(undefined);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | undefined>(undefined);
  const [audioMimeType, setAudioMimeType] = useState<string | undefined>(undefined);

  const [showKeyboard, setShowKeyboard] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [confirmClearChat, setConfirmClearChat] = useState(false);

  const alertBundle =
    DISTRICT_ALERTS.find((d) => d.district === district) || DISTRICT_ALERTS[0];

  // Show oldest-to-newest like WhatsApp (latest 4 cases right in the thread!)
  const threadCases = [...cases.slice(0, 4)].reverse();

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const scrollToBottom = () => {
    window.setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const handleLangSwitch = (lang: Language) => {
    onChangeLanguage(lang);
    void voice.speak(TRANSLATIONS[lang].voiceGreeting, lang, `chat-greet-${lang}`);
  };

  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setCropHint(undefined);
    try {
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed.dataUrl);
      setPhotoBase64(compressed.base64);
      setPhotoMimeType(compressed.mimeType);
      scrollToBottom();
    } catch {
      setErrorMsg('Could not read photo. Please try again.');
    }
    e.target.value = '';
  };

  const handleSamplePreset = async (preset: SampleTestPreset) => {
    setErrorMsg(null);
    setLoadingSampleId(preset.id);
    try {
      const encoded = await imageUrlToBase64(preset.imageUrl);
      setPhotoPreview(preset.imageUrl);
      setPhotoBase64(encoded.base64);
      setPhotoMimeType(encoded.mimeType);
      setCropHint(preset.cropHint);
      onDistrictChange(preset.district);
      setNoteText(preset.sampleNote[language]);
      scrollToBottom();
    } catch {
      setErrorMsg('Could not load sample photo.');
    } finally {
      setLoadingSampleId(null);
    }
  };

  const sendMessageToGemini = async (overrideAudio?: {
    base64: string;
    mimeType: string;
    dataUrl: string;
    durationSec: number;
  }) => {
    if (isSubmittingRef.current) return;

    const finalAudioB64 = overrideAudio?.base64 ?? audioBase64;
    const finalAudioMime = overrideAudio?.mimeType ?? audioMimeType;
    const finalAudioUrl = overrideAudio?.dataUrl ?? audioDataUrl;
    const finalAudioDur = overrideAudio?.durationSec ?? recordSeconds;

    if (!photoBase64 && !finalAudioB64 && !noteText.trim()) {
      setErrorMsg(t.needPhotoOrVoice);
      return;
    }

    isSubmittingRef.current = true;
    setErrorMsg(null);
    setIsSending(true);
    scrollToBottom();

    const submittedPhotoPreview = photoPreview;
    const submittedNote = noteText.trim();

    try {
      const response = await diagnoseCropViaApi({
        imageBase64: photoBase64,
        imageMimeType: photoMimeType,
        audioBase64: finalAudioB64,
        audioMimeType: finalAudioMime,
        noteText: submittedNote || undefined,
        language,
        district,
        cropHint,
      });

      const created: CropCase = {
        id: `KS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        language,
        district,
        photoDataUrl: submittedPhotoPreview || undefined,
        audioDataUrl: finalAudioUrl || undefined,
        audioDurationSec: finalAudioDur || undefined,
        noteText: submittedNote || undefined,
        transcript: response.transcript,
        crop: response.crop,
        likely_problem: response.likely_problem,
        confidence: response.confidence,
        needs_expert: response.needs_expert,
        escalation_reason: response.escalation_reason,
        action_plan: response.action_plan,
        warning_signs: response.warning_signs,
        sources: response.sources,
        spoken_summary: response.spoken_summary,
        status: response.needs_expert ? 'with_expert' : 'ai_answered',
        responseTimeMs: response.responseTimeMs,
        aiOriginalGuess: response.likely_problem,
        aiOriginalConfidence: response.confidence,
      };

      // Clear composer
      setPhotoPreview(null);
      setPhotoBase64(undefined);
      setPhotoMimeType(undefined);
      setCropHint(undefined);
      setAudioDataUrl(null);
      setAudioBase64(undefined);
      setAudioMimeType(undefined);
      setRecordSeconds(0);
      setNoteText('');
      setShowKeyboard(false);

      onCaseCreated(created);
      scrollToBottom();

      // Auto-play the voice diagnosis aloud right in the chat so illiterate farmers hear it immediately!
      const spokenText =
        created.spoken_summary ||
        `${created.crop}. ${created.likely_problem}. ${created.action_plan.slice(0, 3).join('. ')}`;
      void voice.speak(spokenText, language, `chat-case-${created.id}`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not reach KrishiSetu right now. Please tap Send again.'
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSending(false);
    }
  };

  const startVoiceRecord = async () => {
    setErrorMsg(null);
    voice.stop();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(t.micUnavailable);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      const startedAt = Date.now();
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const dur = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        if (blob.size > 0) {
          const encoded = await blobToBase64(blob);
          // Just like WhatsApp: releasing/stopping mic immediately sends the voice note (with attached photo if any)!
          await sendMessageToGemini({
            base64: encoded.base64,
            mimeType: encoded.mimeType,
            dataUrl: encoded.dataUrl,
            durationSec: dur,
          });
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 59) {
            recorder.stop();
            setIsRecording(false);
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setErrorMsg(t.micUnavailable);
    }
  };

  const stopVoiceRecord = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const hasDraft = Boolean(photoBase64 || audioBase64 || noteText.trim());

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-6 pt-3 pb-24 md:pb-8 flex flex-col">
      {/* Clean 1-Tap Mobile Chrome Install Banner (inline, only shown when directly in browser) */}
      <PWAInstallBanner language={language} className="mb-2.5" />

      {/* WhatsApp-Familiar Green Chat Banner with Language Switch + 1-Tap Phone Call */}
      <div className="rounded-t-3xl bg-[#1B7F3B] text-white px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Sprout className="w-6 h-6 text-[#F6C84C]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold truncate">KrishiSetu</h1>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {(['bn', 'hi', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLangSwitch(lang)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                    language === lang
                      ? 'bg-[#F6C84C] text-[#14231A]'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {lang === 'bn' ? 'বাংলা' : lang === 'hi' ? 'हिन्दी' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GIANT FAMILIAR PHONE CALL BUTTON (for farmers who only make phone calls!) */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton language={language} variant="header" voice={voice} />
          <button
            type="button"
            onClick={onStartPhoneCall}
            className="min-h-[46px] px-4 py-2 rounded-2xl bg-[#F6C84C] hover:bg-[#E5A100] text-[#14231A] font-display text-sm font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>{labels.callBtn}</span>
          </button>
        </div>
      </div>

      {/* Compact 1-Row Hyperlocal Weather / Pest / Price Strip */}
      <button
        type="button"
        onClick={() => onNavigate('alerts')}
        className="w-full bg-[#F2F7F3] border-x border-b border-[#DCE4DC] px-4 py-2 flex items-center justify-between gap-3 text-xs text-[#14231A] hover:bg-[#E7F3EA] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
          <span className="flex items-center gap-1 font-semibold">
            <CloudSun className="w-4 h-4 text-[#1B7F3B]" />
            <span className="font-mono tabular-nums">{alertBundle.weather.tempC}°C</span>
          </span>
          <span aria-hidden="true" className="text-[#9AA89F]">·</span>
          <span className="flex items-center gap-1 font-semibold text-[#B45309]">
            <Bug className="w-4 h-4" />
            <span>{alertBundle.pest.crop[language]}</span>
          </span>
          <span aria-hidden="true" className="text-[#9AA89F]">·</span>
          <span className="flex items-center gap-1 font-mono font-semibold text-[#135E2B] tabular-nums">
            <TrendingUp className="w-4 h-4" />
            <span>{alertBundle.prices[0].priceText}</span>
          </span>
        </div>
        <span className="text-[#1B7F3B] font-bold shrink-0">{t.navAlerts} →</span>
      </button>

      {/* WHATSAPP-STYLE CHAT STREAM */}
      <div className="bg-[#EFECE3] border-x border-[#DCE4DC] px-3 sm:px-5 py-4 space-y-4 min-h-[420px]">
        {/* KrishiSetu Welcome Voice Bubble */}
        <div className="flex justify-start">
          <div className="max-w-[92%] sm:max-w-[82%] rounded-2xl rounded-tl-sm bg-white border border-[#DFE4DC] p-3.5 shadow-2xs space-y-2.5">
            <button
              type="button"
              onClick={() =>
                void voice.speak(t.voiceGreeting, language, `welcome-bubble-${language}`)
              }
              className="w-full min-h-[52px] px-4 py-2.5 rounded-xl bg-[#E9F5EC] hover:bg-[#D8EFE0] text-[#135E2B] flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#1B7F3B] text-white flex items-center justify-center shrink-0">
                {voice.isPlaying && voice.activeId === `welcome-bubble-${language}` ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1 h-4" aria-hidden="true">
                  {[4, 9, 14, 7, 15, 11, 6, 13, 8, 12, 5, 10, 14, 7, 9].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-[#1B7F3B]/70"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
                <span className="block text-xs font-bold text-[#135E2B] mt-1">
                  {voice.isPlaying && voice.activeId === `welcome-bubble-${language}`
                    ? labels.stopVoice
                    : t.listenWelcome}
                </span>
              </div>
            </button>
            <p className="text-sm text-[#14231A] leading-snug">
              {labels.voiceGuidePrompt}
            </p>
          </div>
        </div>

        {/* Optional Clear Previous Cases Bar (only shown when previous cases exist) */}
        {cases.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            {confirmClearChat ? (
              <div className="w-full rounded-2xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#991B1B]">
                  {labels.confirmClearChat}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClearChat(false)}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-white border border-[#DCE2D9] text-[#14231A] font-bold cursor-pointer"
                  >
                    {labels.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllCases();
                      setConfirmClearChat(false);
                    }}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-[#C62828] text-white font-bold cursor-pointer"
                  >
                    {labels.confirmYes}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearChat(true)}
                className="min-h-[36px] px-3 py-1 rounded-xl bg-white/80 hover:bg-white border border-[#DCE4DC] text-xs font-semibold text-[#5A6D61] hover:text-[#991B1B] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{labels.clearChat}</span>
              </button>
            )}
          </div>
        )}

        {/* Past & Live Crop Checks as WhatsApp Chat Pairs */}
        {threadCases.map((item) => {
          const voiceKey = `chat-case-${item.id}`;
          const isPlayingThis = voice.isPlaying && voice.activeId === voiceKey;
          const isLoadingThis = voice.isLoading && voice.activeId === voiceKey;
          const spokenPayload =
            item.spoken_summary ||
            `${item.crop}. ${item.likely_problem}. ${item.action_plan.slice(0, 3).join('. ')}`;

          return (
            <div key={item.id} className="space-y-2.5">
              {/* Right: Farmer's Outgoing Photo / Voice Bubble */}
              <div className="flex justify-end">
                <div className="max-w-[82%] sm:max-w-[70%] rounded-2xl rounded-tr-sm bg-[#DCF5E3] border border-[#BEE3C9] p-2.5 space-y-2">
                  {item.photoDataUrl && (
                    <CropImage
                      src={item.photoDataUrl}
                      alt={item.crop}
                      className="w-56 sm:w-64 h-40 object-cover rounded-xl"
                    />
                  )}
                  {item.audioDataUrl && (
                    <audio controls src={item.audioDataUrl} className="w-full max-w-[240px] h-9" />
                  )}
                  {item.transcript && (
                    <p className="text-xs text-[#135E2B] italic px-1">{item.transcript}</p>
                  )}
                  <p className="text-[10px] text-[#3B6B4A] text-right font-mono tabular-nums px-1">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>

              {/* Left: KrishiSetu Advisor Reply Card */}
              <div className="flex justify-start">
                <div className="max-w-[94%] sm:max-w-[84%] rounded-2xl rounded-tl-sm bg-white border border-[#DCE2D9] p-4 shadow-2xs space-y-3">
                  {/* Status Row */}
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
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
                    <span className="font-mono tabular-nums text-[#4A5D52]">
                      {item.confidence}%
                    </span>
                  </div>

                  {/* GIANT WHATSAPP-STYLE VOICE REPLY PLAYER */}
                  <button
                    type="button"
                    onClick={() =>
                      void voice.speak(spokenPayload, item.language || language, voiceKey)
                    }
                    className={`w-full min-h-[56px] px-4 py-2.5 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer ${
                      isPlayingThis
                        ? 'bg-[#14231A] text-white'
                        : 'bg-[#1B7F3B] hover:bg-[#135E2B] text-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      {isLoadingThis ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isPlayingThis ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </div>
                    <span className="font-display text-base font-bold text-left">
                      {isLoadingThis
                        ? t.loadingVoice
                        : isPlayingThis
                        ? labels.stopVoice
                        : labels.playVoiceAnswer}
                    </span>
                  </button>

                  {/* Not Sure Escalation Notice OR Confident Verdict */}
                  {item.status === 'with_expert' ? (
                    <div className="rounded-xl bg-[#FFFBEB] border border-[#F5D07E] p-3 space-y-2">
                      <p className="text-sm font-bold text-[#92400E] flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        {t.notSureHeadline}
                      </p>
                      <p className="text-xs sm:text-sm text-[#78350F] leading-snug">
                        {t.notSureMessage}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenAgronomistQueue(item.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#14231A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t.openAgronomistDemo}</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-[#4A5D52]">{item.crop}</p>
                        <p className="font-display text-lg font-bold text-[#14231A] leading-snug">
                          {item.likely_problem}
                        </p>
                      </div>

                      {/* Simple Confidence Meter */}
                      <div className="w-full h-2 rounded-full bg-[#E5EAE3] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1B7F3B]"
                          style={{ width: `${Math.max(8, item.confidence)}%` }}
                        />
                      </div>

                      {/* Top 3 Short Action Steps */}
                      {item.action_plan.length > 0 && (
                        <ol className="space-y-1.5 text-sm text-[#14231A]">
                          {item.action_plan.slice(0, 3).map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-md bg-[#E9F5EC] text-[#135E2B] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                                {i + 1}
                              </span>
                              <span className="leading-snug">{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </>
                  )}

                  <div className="pt-1 border-t border-[#F0F2ED] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onDeleteCase(item.id)}
                      className="text-xs font-medium text-[#7A8C80] hover:text-[#991B1B] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{labels.deleteItem}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenCase(item)}
                      className="text-xs font-bold text-[#1B7F3B] hover:underline cursor-pointer"
                    >
                      {labels.fullPlan} →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Checking Bubble */}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-white border border-[#DCE2D9] p-4 flex items-center gap-3 shadow-xs">
              <Loader2 className="w-6 h-6 text-[#1B7F3B] animate-spin shrink-0" />
              <div>
                <p className="font-display text-base font-bold text-[#14231A]">
                  {t.checkingBubble}
                </p>
                <p className="text-xs text-[#4A5D52]">{t.checkingSub}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* BOTTOM WHATSAPP-STYLE VOICE & CAMERA COMPOSER */}
      <div className="sticky bottom-14 md:bottom-0 z-20 rounded-b-3xl bg-white border border-[#DCE4DC] p-3 sm:p-4 space-y-3 shadow-sm">
        {/* Friendly Error Notice */}
        {errorMsg && (
          <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 flex items-center justify-between gap-2 text-xs text-[#991B1B]">
            <span className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="p-1 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attached Photo Preview Ready to Send */}
        {photoPreview && (
          <div className="flex items-center justify-between gap-3 bg-[#F2FAF4] border border-[#BEE3C9] rounded-2xl p-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <CropImage
                src={photoPreview}
                alt="Ready to send"
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#135E2B] truncate">
                  {cropHint || t.stepPhotoTitle}
                </p>
                <p className="text-[11px] text-[#4A5D52]">
                  Tap Send or speak a voice note too
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPhotoPreview(null);
                setPhotoBase64(undefined);
                setPhotoMimeType(undefined);
                setCropHint(undefined);
                setNoteText('');
              }}
              aria-label="Remove photo"
              className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-white text-[#4A5D52] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Optional Keyboard Input (only shown if user explicitly taps keyboard icon) */}
        {showKeyboard && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.optionalTextPlaceholder}
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D8DFD5] bg-[#FAFBF9] text-sm text-[#14231A] focus:outline-none focus:border-[#1B7F3B]"
            />
          </div>
        )}

        {/* Quick 1-Tap Sample Leaf Strip for Judges */}
        {!isRecording && !photoPreview && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-[#4A5D52] shrink-0">
              {labels.trySample}
            </span>
            {SAMPLE_TEST_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={loadingSampleId !== null || isSending}
                onClick={() => void handleSamplePreset(preset)}
                className="flex items-center gap-1.5 pr-2.5 pl-1 py-1 rounded-xl border border-[#E2E6DF] bg-[#FAFBF9] hover:border-[#1B7F3B] text-[11px] font-semibold text-[#14231A] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CropImage
                  src={preset.imageUrl}
                  alt={preset.label[language]}
                  className="w-6 h-6 rounded-lg object-cover"
                />
                <span>
                  {loadingSampleId === preset.id ? '...' : preset.label[language]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Hidden Native Rear Camera & Gallery Photo Triggers */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleCameraChange}
          className="hidden"
        />

        {/* MAIN THUMB-ZONE ACTION ROW: CAMERA · GALLERY · HUGE MIC (or SEND) · OPTIONAL KEYBOARD */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopVoiceRecord}
            className="w-full min-h-[64px] px-5 py-3 rounded-2xl bg-[#C62828] hover:bg-[#B91C1C] text-white flex items-center justify-between gap-4 cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-7" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((b) => (
                  <span
                    key={b}
                    className="w-1.5 h-6 rounded-full bg-white animate-wave-bar"
                    style={{ animationDelay: `${b * 90}ms` }}
                  />
                ))}
              </div>
              <span className="font-mono text-base font-bold tabular-nums">
                {formatTimer(recordSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-2 font-display text-base font-bold">
              <span>{labels.recording}</span>
              <Square className="w-5 h-5 fill-current" />
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* 1. CAMERA BUTTON */}
            <button
              type="button"
              disabled={isSending}
              onClick={() => cameraInputRef.current?.click()}
              className="min-h-[60px] min-w-[66px] sm:min-w-[116px] px-2.5 sm:px-4 py-2 rounded-2xl bg-[#E9F5EC] hover:bg-[#D8EFE0] border border-[#BFE2C9] text-[#135E2B] font-display text-[11px] sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-transform active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Camera className="w-5 h-5 shrink-0" />
              <span>{labels.tapPhoto}</span>
            </button>

            {/* 2. GALLERY PHOTO PICKER BUTTON */}
            <button
              type="button"
              disabled={isSending}
              onClick={() => galleryInputRef.current?.click()}
              className="min-h-[60px] min-w-[66px] sm:min-w-[116px] px-2.5 sm:px-4 py-2 rounded-2xl bg-[#E9F5EC] hover:bg-[#D8EFE0] border border-[#BFE2C9] text-[#135E2B] font-display text-[11px] sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-transform active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ImagePlus className="w-5 h-5 shrink-0" />
              <span>{labels.tapGallery}</span>
            </button>

            {/* 3. BIG VOICE MIC BUTTON (or SEND if photo/text already attached) */}
            {hasDraft ? (
              <button
                type="button"
                disabled={isSending}
                onClick={() => void sendMessageToGemini()}
                className="flex-1 min-h-[60px] px-4 sm:px-5 py-3 rounded-2xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white font-display text-base sm:text-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer"
              >
                <Send className="w-5 h-5 shrink-0" />
                <span>{labels.sendNow}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSending}
                onClick={() => void startVoiceRecord()}
                className="flex-1 min-h-[60px] px-4 sm:px-5 py-3 rounded-2xl bg-[#1B7F3B] hover:bg-[#135E2B] text-white font-display text-base sm:text-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer"
              >
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <span>{labels.tapMic}</span>
              </button>
            )}

            {/* 4. Small Optional Keyboard Toggle (never pushed on illiterate farmers) */}
            <button
              type="button"
              onClick={() => setShowKeyboard((prev) => !prev)}
              aria-label={labels.typeOptional}
              title={labels.typeOptional}
              className={`min-h-[60px] min-w-[46px] sm:min-w-[52px] rounded-2xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                showKeyboard
                  ? 'bg-[#14231A] text-white border-[#14231A]'
                  : 'bg-[#FAFBF9] text-[#4A5D52] border-[#DCE2D9] hover:border-[#1B7F3B]'
              }`}
            >
              <Keyboard className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
