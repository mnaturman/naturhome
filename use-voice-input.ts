import { useState, useRef, useCallback, useEffect } from "react";

interface UseVoiceInputOptions {
  onUpdate: (liveText: string) => void;
  onStart?: () => void;
}

export function useVoiceInput({ onUpdate, onStart }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const committedRef = useRef(""); // finals accumulated across restarts
  const shouldRestartRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  const onStartRef = useRef(onStart);
  onUpdateRef.current = onUpdate;
  onStartRef.current = onStart;

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  // Starts one single-shot recognition session; auto-restarts if shouldRestartRef is true
  const startSession = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || recognitionRef.current) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const word = t.trim();
          committedRef.current = committedRef.current
            ? committedRef.current + " " + word
            : word;
        } else {
          interim += t;
        }
      }
      const live = interim
        ? committedRef.current
          ? committedRef.current + " " + interim
          : interim
        : committedRef.current;
      onUpdateRef.current(live);
    };

    recognition.onerror = (e: any) => {
      // "no-speech" is normal between phrases — just let onend handle the restart
      if (e.error !== "no-speech" && e.error !== "aborted") {
        shouldRestartRef.current = false;
        setIsListening(false);
      }
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (shouldRestartRef.current) {
        // Brief gap before restart so the browser can reset its audio buffer
        setTimeout(startSession, 150);
      } else {
        setIsListening(false);
        // Emit clean final committed text
        onUpdateRef.current(committedRef.current);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    committedRef.current = "";
    shouldRestartRef.current = true;
    setIsListening(true);
    onStartRef.current?.();
    startSession();
  }, [startSession]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    } else {
      // Already ended — just clean up state
      setIsListening(false);
      onUpdateRef.current(committedRef.current);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isListening, isSupported, toggle, start, stop };
}
