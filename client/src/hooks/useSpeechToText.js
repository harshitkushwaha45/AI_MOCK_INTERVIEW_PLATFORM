import { useState, useRef, useEffect, useCallback } from "react";

const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const committedTranscriptRef = useRef("");
  const shouldListenRef = useRef(false);
  const onResultRef = useRef(null);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore cleanup errors if speech recognition already stopped.
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    committedTranscriptRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, []);

  const startListening = (onResult, initialText = "") => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    if (recognitionRef.current) return;

    committedTranscriptRef.current = initialText.trim();
    shouldListenRef.current = true;
    onResultRef.current = onResult;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalChunk += `${transcript} `;
        } else {
          interimChunk += transcript;
        }
      }

      if (finalChunk.trim()) {
        committedTranscriptRef.current = [
          committedTranscriptRef.current,
          finalChunk.trim(),
        ]
          .filter(Boolean)
          .join(" ");
      }

      const nextTranscript = [
        committedTranscriptRef.current,
        interimChunk.trim(),
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ");

      onResultRef.current?.(nextTranscript);
    };

    recognition.onerror = (event) => {
      const ignoredErrors = ["aborted", "no-speech", "network"];

      if (!ignoredErrors.includes(event.error)) {
        console.error("Speech error:", event);
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        stopListening();
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (shouldListenRef.current) {
        window.setTimeout(() => {
          if (!recognitionRef.current && shouldListenRef.current) {
            startListening(onResultRef.current, committedTranscriptRef.current);
          }
        }, 160);
        return;
      }

      setIsListening(false);
    };

    recognition.onspeechstart = () => {
      setIsListening(true);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      shouldListenRef.current = false;
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  return { isListening, startListening, stopListening };
};

export default useSpeechToText;
