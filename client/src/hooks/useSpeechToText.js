import { useState, useRef, useEffect } from "react";

const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // ✅ Cleanup on unmount (VERY IMPORTANT)
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = (onResult) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    // ✅ Prevent multiple instances
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      onResult(transcript);
    };

    recognition.onerror = (event) => {
      const ignoredErrors = ["aborted", "no-speech"];

      if (!ignoredErrors.includes(event.error)) {
        console.error("Speech error:", event);
      }

      if (event.error !== "aborted") {
        stopListening();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();

    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  return { isListening, startListening, stopListening };
};

export default useSpeechToText;
