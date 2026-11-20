import { useCallback, useEffect, useRef, useState } from 'react';
import { requestTtsAudio } from '../services/api';
import type { Language } from '../types';

const ttsCache = new Map<string, string>();

const SPEECH_LANG_CODES: Record<Language, string> = {
  bn: 'bn-BD',
  hi: 'hi-IN',
  en: 'en-IN',
};

export interface VoicePlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  activeId: string | null;
  speak: (text: string, language: Language, id?: string) => Promise<void>;
  stop: () => void;
}

export function useVoicePlayback(): VoicePlaybackState {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestCounterRef = useRef(0);

  const stop = useCallback(() => {
    requestCounterRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoading(false);
    setActiveId(null);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fallbackBrowserSpeak = useCallback(
    (text: string, language: Language, id: string, token: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsLoading(false);
        setIsPlaying(false);
        setActiveId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = SPEECH_LANG_CODES[language];
      utterance.rate = 0.92;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = language === 'bn' ? 'bn' : language === 'hi' ? 'hi' : 'en';
      const matchingVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(langPrefix)
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        if (requestCounterRef.current !== token) return;
        setIsLoading(false);
        setIsPlaying(true);
        setActiveId(id);
      };
      utterance.onend = () => {
        if (requestCounterRef.current !== token) return;
        setIsLoading(false);
        setIsPlaying(false);
        setActiveId(null);
      };
      utterance.onerror = () => {
        if (requestCounterRef.current !== token) return;
        setIsLoading(false);
        setIsPlaying(false);
        setActiveId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const speak = useCallback(
    async (text: string, language: Language, id = 'default') => {
      if (!text.trim()) return;

      // Toggle off if tapping the currently playing button
      if ((isPlaying || isLoading) && activeId === id) {
        stop();
        return;
      }

      stop();
      const token = requestCounterRef.current;
      setActiveId(id);
      setIsLoading(true);

      const cacheKey = `${language}::${text.trim()}`;
      try {
        let dataUrl = ttsCache.get(cacheKey);
        if (!dataUrl) {
          const result = await requestTtsAudio(text, language);
          dataUrl = `data:${result.mimeType};base64,${result.audioBase64}`;
          ttsCache.set(cacheKey, dataUrl);
        }

        if (requestCounterRef.current !== token) return;

        const audio = new Audio(dataUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          if (requestCounterRef.current !== token) return;
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          if (requestCounterRef.current !== token) return;
          setIsLoading(false);
          setIsPlaying(false);
          setActiveId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          if (requestCounterRef.current !== token) return;
          fallbackBrowserSpeak(text, language, id, token);
        };

        await audio.play();
      } catch {
        if (requestCounterRef.current !== token) return;
        fallbackBrowserSpeak(text, language, id, token);
      }
    },
    [activeId, fallbackBrowserSpeak, isLoading, isPlaying, stop]
  );

  return { isPlaying, isLoading, activeId, speak, stop };
}
