import { useCallback, useEffect, useMemo, useState } from 'react';

const stripMarkdownForSpeech = (text: string) => {
  // remove code blocks and inline code
  let cleaned = text.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // remove links: [label](url) -> label
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  // remove common markdown tokens
  cleaned = cleaned.replace(/[*#_>~-]/g, ' ');

  // collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const hasSupport = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }, []);

  useEffect(() => {
    if (!hasSupport) return;

    const loadVoices = () => {
      try {
        setVoices(window.speechSynthesis.getVoices());
      } catch {
        setVoices([]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      try {
        window.speechSynthesis.onvoiceschanged = null;
      } catch {
        // ignore
      }
    };
  }, [hasSupport]);

  const cancel = useCallback(() => {
    if (!hasSupport) return;
    try {
      window.speechSynthesis.cancel();
    } finally {
      setIsSpeaking(false);
    }
  }, [hasSupport]);

  const speak = useCallback(
    (text: string, lang: string = 'en-US') => {
      if (!hasSupport) return;

      // Cancel any current speech
      window.speechSynthesis.cancel();

      const cleanText = stripMarkdownForSpeech(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const preferredVoice =
        voices.find((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase()) && v.name.includes('Google')) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith(lang.toLowerCase()));

      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [hasSupport, voices]
  );

  return { isSpeaking, voices, speak, cancel, hasSupport };
};
