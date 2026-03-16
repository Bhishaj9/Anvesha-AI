"use client";

import { useState, useCallback, useRef } from "react";
import SearchSidebar from "@/components/SearchSidebar";
import SearchBar from "@/components/SearchBar";
import SuggestionPills from "@/components/SuggestionPills";
import ReactMarkdown from "react-markdown";
import SourcePanel from "@/components/SourcePanel";

interface SearchResult {
  title: string;
  content: string;
  url: string;
}

interface SearchResponse {
  summary?: string;
  citations?: any[];
  follow_ups?: string[];
  sutra?: {
    summary: string;
    citations: any[];
    follow_ups?: string[];
  };
  raw_results?: SearchResult[];
  results?: SearchResult[]; // fallback
  error?: string;
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    // Cancel any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setAiSummary(null);
    setFollowUps([]);
    
    // Stop any playing audio when a new search starts
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: abortController.signal
      });
      const data: SearchResponse = await res.json();

      if (data.error) {
        setError(data.error);
        setResults([]);
        setAiSummary(null);
        setFollowUps([]);
        setResultCount(0);
      } else {
        const searchResults = data.raw_results || data.results || [];
        setResults(searchResults);
        
        let rawSummary = data.summary || data.sutra?.summary || null;
        let parsedSummary = rawSummary;
        let parsedFollowUps = data.follow_ups || data.sutra?.follow_ups || [];
        
        if (rawSummary) {
          try {
            // If the backend returned a JSON string in summary, parse it
            const parsed = JSON.parse(rawSummary);
            if (parsed && parsed.summary) {
              parsedSummary = parsed.summary;
            }
            if (parsed && Array.isArray(parsed.follow_ups)) {
              parsedFollowUps = parsed.follow_ups;
            } else if (parsed && parsed.sutra && Array.isArray(parsed.sutra.follow_ups)) {
              parsedFollowUps = parsed.sutra.follow_ups;
            }
          } catch (e) {
            // It's a standard string, keep it as is
            parsedSummary = rawSummary;
          }
        }
        
        setAiSummary(parsedSummary);
        setFollowUps(Array.isArray(parsedFollowUps) ? parsedFollowUps : []);
        setResultCount(searchResults.length);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Search aborted");
        return;
      }
      setError("Failed to connect to the search service. Please try again.");
      setResults([]);
      setAiSummary(null);
      setFollowUps([]);
      setResultCount(0);
      console.error("Search error:", err);
    } finally {
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
      }
    }
  }, [isPlaying]);

  const handleStopSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const handleListen = async () => {
    if (!aiSummary) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const textToRead = aiSummary.replace(/[*#`_~>\[\]\(\)]/g, '').replace(/\n+/g, ' ').trim(); // Strip markdown deeply
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
      console.log("Audio API Response:", data.audio_base64 ? `Received base64 audio (length: ${data.audio_base64.length})` : "No audio base64 received");

      if (data.audio_base64) {
        const audioSrc = data.audio_base64.startsWith("data:") 
          ? data.audio_base64 
          : `data:audio/wav;base64,${data.audio_base64}`;
        const audio = new Audio(audioSrc);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = (e) => {
          setIsPlaying(false);
          console.error("Audio playback error:", e);
        };

        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          setIsPlaying(false);
          console.error("Play blocked:", e);
        });
      } else {
        console.error("Audio API returned no audio_base64 field.");
      }
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const govInCount = results.filter((r) => r.url?.includes(".gov.in")).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-charcoal">
      <div 
        className={`transition-all duration-300 ease-in-out h-full ${
          isSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="w-64 h-full">
          <SearchSidebar />
        </div>
      </div>

      <main className="flex-1 flex flex-col min-w-0 relative overflow-y-auto">
        {/* Search Header */}
        <header className="sticky top-0 z-10 p-6 md:px-12 flex items-center gap-4 bg-background-light/80 backdrop-blur-md">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-charcoal/5 transition-colors text-charcoal/60 hover:text-charcoal flex-shrink-0"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex-1 max-w-2xl mx-auto w-full flex justify-center">
            <SearchBar onSearch={handleSearch} onStop={handleStopSearch} isLoading={isLoading} />
          </div>
        </header>

        {/* Results Section */}
        <section className="max-w-4xl mx-auto w-full p-6 md:p-12 space-y-8">
          {hasSearched && !isLoading && !error && (
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-primary/70">
                Top Insights
              </h2>
              <span className="text-xs text-charcoal/40">
                Found {resultCount} relevant citation{resultCount !== 1 ? "s" : ""}
                {govInCount > 0 && (
                  <span className="text-primary ml-1">
                    ({govInCount} .gov.in)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center gap-6 py-20">
              <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-charcoal/50 text-sm font-medium">
                Searching the sutras &amp; Synthesizing Knowledge...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-3xl mb-2 block">error</span>
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-2 text-red-500">
                Please ensure Docker and the backend are running.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && !hasSearched && (
            <div className="flex flex-col items-center gap-6 py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary">
                  auto_awesome
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-charcoal mb-2">
                  Begin your inquiry
                </h3>
                <p className="text-charcoal/50 max-w-md">
                  Ask any question to receive sovereign intelligence with
                  verified .gov.in citations and deep reasoning.
                </p>
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-charcoal/20">
                search_off
              </span>
              <p className="text-charcoal/50">No results found. Try a different query.</p>
            </div>
          )}

          {/* Synthesis Summary */}
          {!isLoading && aiSummary && (
            <div className="bg-white p-8 rounded-2xl border border-primary/20 shadow-sm mb-8">
              <h3 className="text-2xl font-bold text-charcoal mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                AI Synthesis
              </h3>
              <div className="prose prose-primary max-w-none text-charcoal/80 leading-relaxed marker:text-primary">
                <ReactMarkdown>{aiSummary}</ReactMarkdown>
              </div>

              {/* Sources Trigger Button & Listen Button */}
              <div className="mt-8 pt-6 border-t border-charcoal/10 flex items-center justify-between">
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
                  title={isPlaying ? "Stop listening" : "Listen to summary"}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isPlaying ? "stop" : isLoadingAudio ? "hourglass_top" : "volume_up"}
                  </span>
                  {isPlaying ? "Stop" : isLoadingAudio ? "Loading..." : "Listen"}
                </button>

                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline text-sm font-medium text-charcoal/60">
                    Synthesized from verified sources
                  </span>
                  <button
                    onClick={() => setIsPanelOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-charcoal/20 text-charcoal font-semibold text-sm hover:bg-charcoal/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">library_books</span>
                    {resultCount} Sources
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {!isLoading && followUps.length > 0 && (
            <div className="bg-white p-8 rounded-2xl border border-charcoal/10 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">help</span>
                Follow-up Questions
              </h3>
              <div className="flex flex-col gap-3">
                {followUps.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSearch(q)} 
                    className="flex items-center gap-2 text-left px-3 py-2 rounded-xl hover:bg-primary/5 text-primary text-sm font-medium transition-colors group"
                  >
                    <span className="material-symbols-outlined text-xs text-primary/40 group-hover:text-primary">add</span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* We no longer render SutraCards here directly */}
        </section>

        {/* Suggestion Pills */}
        {!isLoading && (
          <SuggestionPills onSuggestionClick={handleSearch} />
        )}
      </main>

      <SourcePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        results={results}
      />
    </div>
  );
}
