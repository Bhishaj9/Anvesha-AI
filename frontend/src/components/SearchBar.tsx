"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, isLoading, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");
          formData.append("language", "en-IN");

          const res = await fetch("/api/voice-to-text", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (data.text && !data.text.startsWith("[Voice recognition error")) {
            setQuery(data.text);
            // Auto-trigger search
            onSearch(data.text);
          }
        } catch (err) {
          console.error("Voice transcription error:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="w-full max-w-3xl relative">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary">
        <span className="material-symbols-outlined">search</span>
      </div>
      <input
        id="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full pl-12 pr-28 py-4 bg-white border-none rounded-2xl shadow-xl shadow-primary/5 focus:ring-2 focus:ring-primary/50 text-charcoal placeholder-charcoal/40"
        placeholder={
          isTranscribing
            ? "Transcribing your voice..."
            : isRecording
            ? "Listening... click mic to stop"
            : "Search the wisdom of the sutras..."
        }
        disabled={isLoading || isTranscribing}
      />
      <div className="absolute inset-y-0 right-4 flex items-center gap-2">
        <button
          onClick={toggleRecording}
          disabled={isLoading || isTranscribing}
          className={`p-2 transition-all rounded-full ${
            isRecording
              ? "text-red-500 bg-red-50 animate-pulse"
              : isTranscribing
              ? "text-primary/50 cursor-wait"
              : "text-charcoal/40 hover:text-primary hover:bg-primary/5"
          }`}
          aria-label={isRecording ? "Stop recording" : "Voice search"}
          title={isRecording ? "Stop recording" : "Voice search"}
        >
          <span className="material-symbols-outlined">
            {isRecording ? "stop_circle" : isTranscribing ? "hourglass_top" : "mic"}
          </span>
        </button>
        <button
          className="p-2 text-charcoal/40 hover:text-primary transition-colors"
          aria-label="Upload file"
        >
          <span className="material-symbols-outlined">upload_file</span>
        </button>
      </div>
    </div>
  );
}
