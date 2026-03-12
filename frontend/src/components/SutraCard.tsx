"use client";

import { useState, useRef } from "react";

interface SutraCardProps {
  title: string;
  content: string;
  url: string;
  citationIndex: number;
}

export default function SutraCard({
  title,
  content,
  url,
  citationIndex,
}: SutraCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isGovIn = url.includes(".gov.in");
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  const handleListen = async () => {
    // If already playing, stop
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const textToRead = `${title}. ${content}`;
      const res = await fetch("/api/text-to-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToRead,
          language: "en-IN",
          speaker: "meera",
        }),
      });

      const data = await res.json();

      if (data.audio_base64) {
        // Create audio from base64
        const audioSrc = `data:audio/wav;base64,${data.audio_base64}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          console.error("Audio playback error");
        };

        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <article className="group relative bg-white p-8 rounded-2xl border border-transparent hover:border-primary/20 transition-all shadow-sm hover:shadow-xl">
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl font-bold text-charcoal leading-tight">
          {title}
        </h3>
        <p className="text-charcoal/60 line-clamp-2 leading-relaxed">
          {content}
        </p>

        <div className="flex items-center gap-4 mt-2">
          <div className="sutra-line flex-1" />
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
              isGovIn
                ? "bg-primary/10 border-primary/20"
                : "bg-charcoal/5 border-charcoal/10"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase ${
                isGovIn ? "text-primary" : "text-charcoal/50"
              }`}
            >
              {isGovIn ? "Sutra Citation" : "Source"}
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                isGovIn ? "text-primary" : "text-charcoal/50"
              }`}
            >
              [{citationIndex}] {domain}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4">
          {/* Listen Button */}
          <button
            onClick={handleListen}
            disabled={isLoadingAudio}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isPlaying
                ? "bg-primary text-background-dark"
                : isLoadingAudio
                ? "bg-charcoal/5 text-charcoal/30 cursor-wait"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            title={isPlaying ? "Stop listening" : "Listen to this Sutra"}
          >
            <span className="material-symbols-outlined text-sm">
              {isPlaying ? "stop" : isLoadingAudio ? "hourglass_top" : "volume_up"}
            </span>
            {isPlaying ? "Stop" : isLoadingAudio ? "Loading..." : "Listen"}
          </button>

          {/* Deep Dive Link */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Deep Dive{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}
