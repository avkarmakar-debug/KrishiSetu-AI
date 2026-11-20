import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Mic,
  Square,
  RotateCcw,
  Send,
  AlertCircle,
  Loader2,
  MapPin,
  Volume2,
  Sprout,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DISTRICTS, SAMPLE_TEST_PRESETS, type SampleTestPreset } from '../data/sampleData';
import { TRANSLATIONS } from '../i18n/translations';
import { diagnoseCropViaApi } from '../services/api';
import type { CropCase, Language } from '../types';
import { blobToBase64, compressImageFile, imageUrlToBase64 } from '../utils/imageUtils';
import { CropImage } from './CropImage';

interface NewCaseViewProps {
  language: Language;
  defaultDistrict: string;
  initialMode: 'camera' | 'voice';
  onBack: () => void;
  onCaseCreated: (newCase: CropCase) => void;
  onDistrictChange: (district: string) => void;
}

export function NewCaseView({
  language,
  defaultDistrict,
  initialMode,
  onBack,
  onCaseCreated,
  onDistrictChange,
}: NewCaseViewProps) {
  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoMimeType, setPhotoMimeType] = useState<string | undefined>(undefined);
  const [cropHint, setCropHint] = useState<string | undefined>(undefined);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | undefined>(undefined);
  const [audioMimeType, setAudioMimeType] = useState<string | undefined>(undefined);
  const [micError, setMicError] = useState<string | null>(null);

  const [showOptional, setShowOptional] = useState(false);
  const [district, setDistrict] = useState(defaultDistrict);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitError(null);
    setCropHint(undefined);
    try {
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed.dataUrl);
      setPhotoBase64(compressed.base64);
      setPhotoMimeType(compressed.mimeType);
    } catch {
      setSubmitError('Could not read the photo. Please try again.');
    }
    e.target.value = '';
  };

  const handleUseSamplePreset = async (preset: SampleTestPreset) => {
    setSubmitError(null);
    setLoadingSampleId(preset.id);
    try {
      const encoded = await imageUrlToBase64(preset.imageUrl);
      setPhotoPreview(preset.imageUrl);
      setPhotoBase64(encoded.base64);
      setPhotoMimeType(encoded.mimeType);
      setCropHint(preset.cropHint);
      setDistrict(preset.district);
      onDistrictChange(preset.district);
      setNoteText(preset.sampleNote[language]);
    } catch {
      setSubmitError('Could not load sample photo. Please try again.');
    } finally {
      setLoadingSampleId(null);
    }
  };

  const startRecording = async () => {
    setMicError(null);
    setSubmitError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError(t.micUnavailable);
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

      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (blob.size > 0) {
          const encoded = await blobToBase64(blob);
          setAudioDataUrl(encoded.dataUrl);
          setAudioBase64(encoded.base64);
          setAudioMimeType(encoded.mimeType);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      setAudioDataUrl(null);
      setAudioBase64(undefined);

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 59) {
            recorder.stop();
            setIsRecording(false);
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setMicError(t.micUnavailable);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioDataUrl(null);
    setAudioBase64(undefined);
    setAudioMimeType(undefined);
    setRecordSeconds(0);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!photoBase64 && !audioBase64 && !noteText.trim()) {
      setSubmitError(t.needPhotoOrVoice);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await diagnoseCropViaApi({
        imageBase64: photoBase64,
        imageMimeType: photoMimeType,
        audioBase64,
        audioMimeType,
        noteText: noteText.trim() || undefined,
        language,
        district,
        cropHint,
      });

      const createdCase: CropCase = {
        id: `KS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        language,
        district,
        photoDataUrl: photoPreview || undefined,
        audioDataUrl: audioDataUrl || undefined,
        audioDurationSec: recordSeconds || undefined,
        noteText: noteText.trim() || undefined,
        transcript: response.transcript || undefined,
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

      onCaseCreated(createdCase);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Could not check your crop right now. Please tap Try Again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 pb-24">
        <div className="bg-[#EFECE3]/65 rounded-3xl border border-[#DFE4DC] p-5 sm:p-6 space-y-5">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#DCF5E3] border border-[#BEE3C9] p-3.5 text-[#14231A]">
              <p className="text-xs font-bold text-[#135E2B] mb-2">
                {t.farmerSentLabel}
              </p>
              {photoPreview && (
                <CropImage
                  src={photoPreview}
                  alt="Uploaded crop leaf"
                  className="w-52 h-36 object-cover rounded-xl mb-2"
                />
              )}
              {audioDataUrl && (
                <div className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2 text-xs font-semibold text-[#135E2B]">
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>{t.voiceRecorded}</span>
                  <span className="font-mono tabular-nums">{formatTimer(recordSeconds)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white border border-[#DCE2D9] p-5 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#1B7F3B] text-white flex items-center justify-center shrink-0">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-[#14231A]">
                    {t.checkingBubble}
                  </p>
                  <p className="text-xs sm:text-sm text-[#4A5D52] mt-0.5">
                    {t.checkingSub}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-[#E9EFEA] overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-[#1B7F3B] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const readyToCheck = Boolean(photoBase64 || audioBase64 || noteText.trim());

  // Put the mode the farmer tapped first so they act immediately without scrolling
  const voiceFirst = initialMode === 'voice';

  const photoBlock = (
    <section className="bg-white rounded-3xl border border-[#DCE2D9] p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E9F5EC] text-[#1B7F3B] flex items-center justify-center shrink-0">
            {photoPreview ? <Check className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </div>
          <h2 className="font-display text-lg font-bold text-[#14231A]">
            {t.btnSnapPhoto}
          </h2>
        </div>
        {photoPreview && (
          <button
            type="button"
            onClick={() => {
              setPhotoPreview(null);
              setPhotoBase64(undefined);
              setPhotoMimeType(undefined);
              setCropHint(undefined);
            }}
            className="text-xs font-bold text-[#1B7F3B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.retakePhoto}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileChange}
        className="hidden"
      />

      {photoPreview ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#DCE2D9]">
          <CropImage
            src={photoPreview}
            alt="Selected crop leaf"
            className="w-full h-56 object-cover"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/95 text-[#14231A] text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ImagePlus className="w-4 h-4 text-[#1B7F3B]" />
              <span>
                {language === 'bn' ? 'গ্যালারি' : language === 'hi' ? 'गैलरी' : 'Gallery'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#14231A]/85 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>{t.retakePhoto}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[148px] rounded-2xl border-2 border-dashed border-[#1B7F3B]/50 bg-[#F4FAF5] hover:bg-[#EAF6ED] p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-[#1B7F3B] text-white flex items-center justify-center mb-2.5">
              <Camera className="w-7 h-7" />
            </div>
            <span className="font-display text-base font-bold text-[#14231A]">
              {t.tapToSnap}
            </span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="min-h-[148px] rounded-2xl border-2 border-dashed border-[#1B7F3B]/40 bg-[#FAFBF9] hover:bg-[#EAF6ED] p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-[#E9F5EC] text-[#1B7F3B] flex items-center justify-center mb-2.5">
              <ImagePlus className="w-7 h-7" />
            </div>
            <span className="font-display text-base font-bold text-[#14231A]">
              {language === 'bn'
                ? 'গ্যালারি থেকে দিন'
                : language === 'hi'
                ? 'गैलरी से चुनें'
                : 'Choose from Gallery'}
            </span>
          </button>
        </div>
      )}

      {/* Compact 3-photo sample bar for instant demo testing */}
      <div className="pt-3 border-t border-[#EFF1EC]">
        <p className="text-xs font-semibold text-[#4A5D52] mb-2 flex items-center gap-1.5">
          <Sprout className="w-3.5 h-3.5 text-[#1B7F3B]" />
          {t.trySamplePhotos}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_TEST_PRESETS.map((preset) => {
            const isSelected = photoPreview === preset.imageUrl;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => void handleUseSamplePreset(preset)}
                disabled={loadingSampleId !== null}
                className={`rounded-xl border p-1.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#1B7F3B] bg-[#E9F5EC]'
                    : 'border-[#E2E6DF] bg-[#FAFBF9] hover:border-[#1B7F3B]/60'
                }`}
              >
                <CropImage
                  src={preset.imageUrl}
                  alt={preset.label[language]}
                  className="w-full h-14 object-cover rounded-lg"
                />
                <p className="mt-1 text-[11px] font-bold text-[#14231A] leading-tight line-clamp-1">
                  {loadingSampleId === preset.id ? '...' : preset.label[language]}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );

  const voiceBlock = (
    <section className="bg-white rounded-3xl border border-[#DCE2D9] p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FEF7E0] text-[#946600] flex items-center justify-center shrink-0">
            {audioDataUrl ? <Check className="w-5 h-5 text-[#1B7F3B]" /> : <Mic className="w-5 h-5" />}
          </div>
          <h2 className="font-display text-lg font-bold text-[#14231A]">
            {t.btnSpeak}
          </h2>
        </div>
        {audioDataUrl && (
          <button
            type="button"
            onClick={clearRecording}
            className="text-xs font-bold text-[#1B7F3B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.reRecord}
          </button>
        )}
      </div>

      {!audioDataUrl ? (
        <div className="rounded-2xl bg-[#FEFBF0] border border-[#E5A100]/45 p-5 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={isRecording ? stopRecording : () => void startRecording()}
            className={`w-22 h-22 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-sm ${
              isRecording
                ? 'bg-[#C62828] text-white'
                : 'bg-[#E5A100] hover:bg-[#D19300] text-[#14231A]'
            }`}
            aria-label={isRecording ? t.tapToStop : t.tapToSpeak}
          >
            {isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>

          <p className="mt-3 font-display text-lg font-bold text-[#14231A]">
            {isRecording ? t.recordingNow : t.tapToSpeak}
          </p>

          {isRecording && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 h-7" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
                  <span
                    key={bar}
                    className="w-1.5 h-6 rounded-full bg-[#C62828] animate-wave-bar"
                    style={{ animationDelay: `${bar * 90}ms` }}
                  />
                ))}
              </div>
              <span className="font-mono text-base font-bold text-[#C62828] tabular-nums">
                {formatTimer(recordSeconds)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#14231A] text-white text-sm font-bold cursor-pointer"
              >
                {t.tapToStop}
              </button>
            </div>
          )}

          {micError && (
            <p className="mt-3 text-xs text-[#92400E] bg-[#FEF3C7] rounded-xl px-3 py-2">
              {micError}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#BEE3C9] bg-[#EEF9F1] p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#135E2B]">
            <Volume2 className="w-4 h-4" />
            <span>{t.voiceRecorded}</span>
            <span className="font-mono text-xs tabular-nums">
              ({formatTimer(recordSeconds)})
            </span>
          </div>
          <audio controls src={audioDataUrl} className="w-full h-10" />
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-28 md:pb-12 space-y-5">
      {/* Simple Back Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE2D9] hover:bg-[#F3F6F2] text-sm font-bold text-[#14231A] flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </button>
        <h1 className="font-display text-xl font-bold text-[#14231A]">
          {t.newCaseTitle}
        </h1>
        <div className="w-14" aria-hidden="true" />
      </div>

      {/* Focused Single-Column Snap & Speak Flow */}
      {voiceFirst ? (
        <>
          {voiceBlock}
          {photoBlock}
        </>
      ) : (
        <>
          {photoBlock}
          {voiceBlock}
        </>
      )}

      {/* Collapsed Optional Note & District (Never Required!) */}
      <div className="bg-white rounded-2xl border border-[#E2E6DF] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptional((prev) => !prev)}
          className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#4A5D52] hover:bg-[#FAFBF9] cursor-pointer"
        >
          <span>{t.optionalDetails}</span>
          {showOptional ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showOptional && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#EFF1EC]">
            <div>
              <label
                htmlFor="farmer-district"
                className="text-xs font-semibold text-[#314438] flex items-center gap-1.5 mb-1"
              >
                <MapPin className="w-3.5 h-3.5 text-[#1B7F3B]" />
                {t.districtLabel}
              </label>
              <select
                id="farmer-district"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  onDistrictChange(e.target.value);
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D8DFD5] bg-[#FAFBF9] text-sm font-medium text-[#14231A]"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.optionalTextPlaceholder}
              className="w-full px-3 py-2 rounded-xl border border-[#D8DFD5] bg-[#FAFBF9] text-sm text-[#14231A] placeholder:text-[#7A8C80] resize-none"
            />
          </div>
        )}
      </div>

      {/* Friendly Retry Error Banner */}
      {submitError && (
        <div className="rounded-2xl bg-[#FEF2F2] border border-[#FECACA] p-4 flex items-start gap-2.5 text-sm text-[#991B1B]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{submitError}</p>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              className="mt-1.5 text-xs font-bold underline cursor-pointer"
            >
              {t.retryBtn}
            </button>
          </div>
        </div>
      )}

      {/* Giant Primary Submit Button */}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={isSubmitting}
        className={`w-full min-h-[64px] px-6 py-4 rounded-2xl font-display text-xl font-bold flex items-center justify-center gap-3 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
          readyToCheck
            ? 'bg-[#1B7F3B] hover:bg-[#135E2B] text-white'
            : 'bg-[#1B7F3B]/80 hover:bg-[#1B7F3B] text-white'
        }`}
      >
        <Send className="w-5 h-5" />
        <span>{t.checkMyCropBtn}</span>
      </button>
    </div>
  );
}
