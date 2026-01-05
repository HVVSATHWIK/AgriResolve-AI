import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export const useSpeechRecognition = () => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const hasSupport = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    if (!hasSupport) return;

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const instance = new SpeechRecognitionCtor();
    instance.continuous = false;
    instance.interimResults = true;
    instance.lang = 'en-US';

    instance.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
      }
    };

    instance.onerror = (event) => {
      // Most browsers provide event.error (e.g., "not-allowed", "network")
      console.error('Speech recognition error', event?.error);
      setIsListening(false);
    };

    instance.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = instance;

    return () => {
      try {
        instance.onresult = null;
        instance.onerror = null;
        instance.onend = null;
        instance.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [hasSupport]);

  const startListening = useCallback((lang: string = 'en-US') => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    setTranscript('');

    try {
      recognition.lang = lang;
      recognition.start();
      setIsListening(true);
    } catch (e) {
      // Calling start() twice throws in many implementations.
      console.error('Speech start error', e);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.stop();
    } finally {
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, startListening, stopListening, hasSupport };
};
