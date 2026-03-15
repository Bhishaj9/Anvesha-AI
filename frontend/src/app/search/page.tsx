"use client";

import { useState, useCallback } from "react";
import SearchSidebar from "@/components/SearchSidebar";
import SearchBar from "@/components/SearchBar";
import SutraCard from "@/components/SutraCard";
import SuggestionPills from "@/components/SuggestionPills";
import ReactMarkdown from "react-markdown";

interface SearchResult {
  title: string;
  content: string;
  url: string;
}

interface SearchResponse {
  sutra?: {
    summary: string;
    citations: any[];
  };
  raw_results?: SearchResult[];
  results?: SearchResult[]; // fallback
  error?: string;
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultCount, setResultCount] = useState(0);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSummary(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data: SearchResponse = await res.json();

      if (data.error) {
        setError(data.error);
        setResults([]);
        setSummary(null);
        setResultCount(0);
      } else {
        const searchResults = data.raw_results || data.results || [];
        setResults(searchResults);
        
        let parsedSummary = data.sutra?.summary || null;
        if (parsedSummary) {
          try {
            // If the backend returned a JSON string in summary, parse it
            const parsed = JSON.parse(parsedSummary);
            if (parsed && parsed.summary) {
              parsedSummary = parsed.summary;
            }
          } catch (e) {
            // It's a standard string, keep it as is
          }
        }
        
        setSummary(parsedSummary);
        setResultCount(searchResults.length);
      }
    } catch (err) {
      setError("Failed to connect to the search service. Please try again.");
      setResults([]);
      setSummary(null);
      setResultCount(0);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const govInCount = results.filter((r) => r.url?.includes(".gov.in")).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-charcoal">
      <SearchSidebar />

      <main className="flex-1 flex flex-col min-w-0 relative overflow-y-auto">
        {/* Search Header */}
        <header className="sticky top-0 z-10 p-6 md:px-12 flex flex-col items-center bg-background-light/80 backdrop-blur-md">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
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
                Searching the sutras...
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
          {!isLoading && summary && (
            <div className="bg-white p-8 rounded-2xl border border-primary/20 shadow-sm mb-8">
              <h3 className="text-2xl font-bold text-charcoal mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                AI Synthesis
              </h3>
              <div className="prose prose-charcoal prose-headings:font-bold max-w-none text-charcoal/80 leading-relaxed marker:text-primary">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading &&
            results.map((result, index) => (
              <SutraCard
                key={`${result.url}-${index}`}
                title={result.title}
                content={result.content}
                url={result.url}
                citationIndex={index + 1}
              />
            ))}
        </section>

        {/* Suggestion Pills */}
        {!isLoading && (
          <SuggestionPills onSuggestionClick={handleSearch} />
        )}
      </main>
    </div>
  );
}
