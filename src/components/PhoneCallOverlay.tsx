import {
  Camera,
  Loader2,
  Mic,
  PhoneOff,
  Square,
  Volume2,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SAMPLE_TEST_PRESETS } from '../data/sampleData';
import type { VoicePlaybackState } from '../hooks/useVoicePlayback';
import { diagnoseCropViaApi } from '../services/api';
import type { CropCase, Language } from '../types';
import { blobToBase64, compressImageFile, imageUrlToBase64 } from '../utils/imageUtils';
import { CropImage } from './CropImage';

interface PhoneCallOverlayProps {
  language: Language;
  district: string;
  voice: VoicePlaybackState;
  onChangeLanguage: (lang: Language) => void;
  onCaseCreated: (newCase: CropCase) => void;
  onClose: () => void;
  onOpenAgronomistQueue: (caseId: string) => void;
}

const CALL_COPY: Record<
  Language,
  {
    title: string;
    greeting: string;
    tapToTalk: string;
    listening: string;
    tapWhenDone: string;
    checking: string;
    speakingAnswer: string;
    askAgain: string;
    addPhotoOptional: string;
    photoAttached: string;
    endCall: string;
    demoSample: string;
    escalatedSpoken: string;
    micDenied: string;
    replay: string;
    openExpert: string;
  }
> = {
  bn: {
    title: 'কৃষি সেতু কল',
    greeting:
      'আসসালামু আলাইকুম ও নমস্কার! আমি কৃষি সেতু। নিচের সবুজ মাইক বোতামে চাপ দিয়ে আপনার ফসলের সমস্যা বলুন।',
    tapToTalk: 'কথা বলতে চাপ দিন',
    listening: 'শুনছি... বলুন',
    tapWhenDone: 'বলা শেষ হলে চাপ দিন',
    checking: 'আপনার ফসল পরীক্ষা করছি...',
    speakingAnswer: 'পরামর্শ শোনানো হচ্ছে...',
    askAgain: 'আরেকটি প্রশ্ন বলুন',
    addPhotoOptional: 'ছবি / গ্যালারি',
    photoAttached: 'ছবি যুক্ত হয়েছে',
    endCall: 'কল কাটুন',
    demoSample: 'নমুনা প্রশ্ন চেষ্টা করুন',
    escalatedSpoken:
      'পুরোপুরি নিশ্চিত না হওয়ায় আপনার প্রশ্নটি একজন কৃষিবিদের কাছে পাঠানো হয়েছে।',
    micDenied: 'মাইক্রোফোন অনুমতি পাওয়া যায়নি। নিচে "নমুনা প্রশ্ন" চেষ্টা করতে পারেন।',
    replay: 'আবার শুনুন',
    openExpert: 'কৃষিবিদ কিউ দেখুন',
  },
  hi: {
    title: 'कृषि सेतु कॉल',
    greeting:
      'नमस्ते! मैं कृषि सेतु हूं। नीचे हरे माइक बटन को दबाएं और अपनी फसल की समस्या बोलकर बताएं।',
    tapToTalk: 'बोलने के लिए दबाएं',
    listening: 'सुन रहे हैं... बोलें',
    tapWhenDone: 'बोलने के बाद दबाएं',
    checking: 'आपकी फसल की जांच हो रही है...',
    speakingAnswer: 'सलाह सुनाई जा रही है...',
    askAgain: 'दूसरा सवाल बोलें',
    addPhotoOptional: 'फोटो / गैलरी',
    photoAttached: 'फोटो जुड़ गई',
    endCall: 'कॉल काटें',
    demoSample: 'नमूना सवाल आजमाएं',
    escalatedSpoken:
      'पूरी तरह निश्चित न होने पर आपका मामला कृषि विशेषज्ञ को भेज दिया गया है।',
    micDenied: 'माइक्रोफोन की अनुमति नहीं मिली। आप नीचे नमूना सवाल आजमा सकते हैं।',
    replay: 'फिर से सुनें',
    openExpert: 'विशेषज्ञ क्यू देखें',
  },
  en: {
    title: 'KrishiSetu Call',
    greeting:
      'Hello! This is KrishiSetu. Tap the green microphone button below and tell me what happened to your crop.',
    tapToTalk: 'Tap to speak',
    listening: 'Listening... speak now',
    tapWhenDone: 'Tap when finished',
    checking: 'Checking your crop...',
    speakingAnswer: 'Speaking your advice...',
    askAgain: 'Speak again',
    addPhotoOptional: 'Photo / Gallery',
    photoAttached: 'Leaf photo attached',
    endCall: 'End call',
    demoSample: 'Try sample voice case',
    escalatedSpoken:
      'I am not fully sure, so I have sent your case to a human agronomist for safe review.',
    micDenied: 'Microphone permission unavailable. You can try the sample case below.',
    replay: 'Listen again',
    openExpert: 'Open Agronomist Queue',
  },
};

export function PhoneCallOverlay({
  language,
  district,
  voice,
  onChangeLanguage,
  onCaseCreated,
  onClose,
  onOpenAgronomistQueue,
}: PhoneCallOverlayProps) {
  const copy = CALL_COPY[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [callSeconds, setCallSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latestCase, setLatestCase] = useState<CropCase | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoMimeType, setPhotoMimeType] = useState<string | undefined>(undefined);

  // Live call duration counter
  useEffect(() => {
    const id = window.setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Speak automatic warm phone greeting as soon as the call connects
  useEffect(() => {
    void voice.speak(copy.greeting, language, `call-greeting-${language}`);
    return () => {
      voice.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Recording duration counter
  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => {
      setRecordSeconds((s) => {
        if (s >= 45) {
          stopAndSendRecording();
          return 45;
        }
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const runDiagnosisAndSpeak = async (params: {
    audioBase64?: string;
    audioMimeType?: string;
    audioDataUrl?: string;
    noteText?: string;
    overridePhotoBase64?: string;
    overridePhotoMime?: string;
    overridePhotoPreview?: string;
  }) => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    voice.stop();

    try {
      const response = await diagnoseCropViaApi({
        imageBase64: params.overridePhotoBase64 ?? photoBase64,
        imageMimeType: params.overridePhotoMime ?? photoMimeType,
        audioBase64: params.audioBase64,
        audioMimeType: params.audioMimeType,
        noteText: params.noteText,
        language,
        district,
      });

      const created: CropCase = {
        id: `KS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        language,
        district,
        photoDataUrl: params.overridePhotoPreview ?? photoPreview ?? undefined,
        audioDataUrl: params.audioDataUrl,
        audioDurationSec: recordSeconds || undefined,
        noteText: params.noteText,
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

      setLatestCase(created);
      onCaseCreated(created);

      // Automatically read the diagnosis aloud to the caller!
      const toSpeak = created.needs_expert
        ? created.spoken_summary || copy.escalatedSpoken
        : created.spoken_summary ||
          `${created.crop}. ${created.likely_problem}. ${created.action_plan.slice(0, 3).join('. ')}`;

      void voice.speak(toSpeak, language, `call-answer-${created.id}`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not hear clearly. Please try speaking again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    voice.stop();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(copy.micDenied);
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

      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (blob.size > 0) {
          const encoded = await blobToBase64(blob);
          await runDiagnosisAndSpeak({
            audioBase64: encoded.base64,
            audioMimeType: encoded.mimeType,
            audioDataUrl: encoded.dataUrl,
          });
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecordSeconds(0);
      setIsRecording(true);
    } catch {
      setErrorMsg(copy.micDenied);
    }
  };

  const stopAndSendRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handlePhotoAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed.dataUrl);
      setPhotoBase64(compressed.base64);
      setPhotoMimeType(compressed.mimeType);
    } catch {
      // Ignore photo error on voice call
    }
    e.target.value = '';
  };

  const handleTrySampleCall = async () => {
    const sample = SAMPLE_TEST_PRESETS[0];
    const encoded = await imageUrlToBase64(sample.imageUrl);
    setPhotoPreview(sample.imageUrl);
    setPhotoBase64(encoded.base64);
    setPhotoMimeType(encoded.mimeType);
    await runDiagnosisAndSpeak({
      noteText: sample.sampleNote[language],
      overridePhotoBase64: encoded.base64,
      overridePhotoMime: encoded.mimeType,
      overridePhotoPreview: sample.imageUrl,
    });
  };

  const handleHangUp = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    voice.stop();
    onClose();
  };

  const isAdvisorSpeaking = voice.isPlaying || voice.isLoading;

  return (
    <div className="fixed inset-0 z-50 bg-[#0D3319] text-white flex flex-col justify-between px-5 py-6 sm:py-8 overflow-y-auto">
      {/* Top Call Status & Language Switch */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold tracking-tight text-white">
            {copy.title}
          </p>
          <p className="font-mono text-xs text-[#A7E3B9] tabular-nums">
            {formatCallTime(callSeconds)} · Voice Call
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
          {(['bn', 'hi', 'en'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onChangeLanguage(lang)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                language === lang
                  ? 'bg-[#E5A100] text-[#14231A]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {lang === 'bn' ? 'বাংলা' : lang === 'hi' ? 'हिन्दी' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* Center Call Visual & Live Answer Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6 flex flex-col items-center text-center space-y-5">
        {/* Calming Call Audio Ring */}
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-[#C62828]/25 ring-4 ring-[#EF5350]'
              : isAnalyzing
              ? 'bg-[#E5A100]/25 ring-4 ring-[#E5A100]'
              : isAdvisorSpeaking
              ? 'bg-[#1B7F3B]/50 ring-4 ring-[#6EE7B7]'
              : 'bg-white/10 ring-2 ring-white/25'
          }`}
        >
          {isAnalyzing ? (
            <Loader2 className="w-14 h-14 text-[#F6C84C] animate-spin" />
          ) : isRecording ? (
            <div className="flex items-center gap-1.5 h-12" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className="w-2 h-11 rounded-full bg-white animate-wave-bar"
                  style={{ animationDelay: `${bar * 100}ms` }}
                />
              ))}
            </div>
          ) : (
            <Volume2 className="w-14 h-14 text-white" />
          )}
        </div>

        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            {isAnalyzing
              ? copy.checking
              : isRecording
              ? `${copy.listening} (${formatCallTime(recordSeconds)})`
              : isAdvisorSpeaking
              ? copy.speakingAnswer
              : latestCase
              ? copy.askAgain
              : copy.tapToTalk}
          </h2>
          {photoPreview && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/12 rounded-xl px-3 py-1.5 text-xs text-[#A7E3B9]">
              <CropImage
                src={photoPreview}
                alt="Attached leaf"
                className="w-7 h-7 rounded-md object-cover"
              />
              <span>{copy.photoAttached}</span>
            </div>
          )}
        </div>

        {/* Simple Spoken Verdict Summary Card */}
        {latestCase && !isAnalyzing && (
          <div className="w-full rounded-3xl bg-white/10 border border-white/15 p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs font-bold">
              {latestCase.needs_expert ? (
                <span className="text-[#F6C84C] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Sent to Human Agronomist
                </span>
              ) : (
                <span className="text-[#6EE7B7] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {latestCase.crop}
                </span>
              )}
              <span className="font-mono tabular-nums text-white/80">
                {latestCase.confidence}%
              </span>
            </div>

            <p className="font-display text-lg font-bold text-white leading-snug">
              {latestCase.likely_problem}
            </p>
            <p className="text-sm text-white/90 leading-relaxed">
              {latestCase.spoken_summary}
            </p>

            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void voice.speak(
                    latestCase.spoken_summary || latestCase.likely_problem,
                    language,
                    `call-replay-${latestCase.id}`
                  )
                }
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{copy.replay}</span>
              </button>

              {latestCase.needs_expert && (
                <button
                  type="button"
                  onClick={() => {
                    voice.stop();
                    onOpenAgronomistQueue(latestCase.id);
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#E5A100] text-[#14231A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{copy.openExpert}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="w-full rounded-2xl bg-[#991B1B]/60 border border-[#FCA5A5]/40 px-4 py-3 text-xs sm:text-sm text-white">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Bottom Phone Controls: Huge Mic + Optional Photo + Giant Red Hang Up */}
      <div className="max-w-md w-full mx-auto space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoAttach}
          className="hidden"
        />

        <div className="flex items-center justify-around gap-4">
          {/* Optional Show Leaf Camera Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex flex-col items-center gap-1.5 text-white/85 hover:text-white cursor-pointer"
          >
            <div className="w-15 h-15 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-semibold max-w-[84px] text-center leading-tight">
              {copy.addPhotoOptional}
            </span>
          </button>

          {/* GIANT TALK / STOP BUTTON */}
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={isRecording ? stopAndSendRecording : () => void startRecording()}
            className="flex flex-col items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                isRecording
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16]'
              }`}
            >
              {isRecording ? (
                <Square className="w-9 h-9 fill-current" />
              ) : (
                <Mic className="w-11 h-11" />
              )}
            </div>
            <span className="text-xs font-bold text-white">
              {isRecording ? copy.tapWhenDone : copy.tapToTalk}
            </span>
          </button>

          {/* GIANT RED HANG UP BUTTON */}
          <button
            type="button"
            onClick={handleHangUp}
            className="flex flex-col items-center gap-1.5 text-white/90 hover:text-white cursor-pointer"
          >
            <div className="w-15 h-15 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] flex items-center justify-center shadow-md">
              <PhoneOff className="w-7 h-7 text-white" />
            </div>
            <span className="text-[11px] font-semibold">{copy.endCall}</span>
          </button>
        </div>

        {/* Helpful 1-tap demo trigger for judges without a mic */}
        <div className="text-center pt-1">
          <button
            type="button"
            disabled={isAnalyzing || isRecording}
            onClick={() => void handleTrySampleCall()}
            className="text-xs text-[#A7E3B9] hover:text-white underline cursor-pointer disabled:opacity-40"
          >
            {copy.demoSample}
          </button>
        </div>
      </div>
    </div>
  );
}
