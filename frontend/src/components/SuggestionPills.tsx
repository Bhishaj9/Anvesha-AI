"use client";

interface SuggestionPillsProps {
  onSuggestionClick: (query: string) => void;
}

const suggestions = [
  "Interpret Ahimsa in Policy",
  "Arthashastra Tax Code",
  "Justice Systems Comparison",
  "Ethics of Intelligence",
  "Digital India Initiatives",
  "RTI Act Overview",
];

export default function SuggestionPills({ onSuggestionClick }: SuggestionPillsProps) {
  return (
    <div className="max-w-4xl mx-auto w-full px-6 pb-12 flex flex-wrap gap-2 justify-center">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSuggestionClick(suggestion)}
          className="px-4 py-2 rounded-full border border-primary/20 text-xs font-medium text-charcoal/50 hover:bg-primary/10 hover:text-primary transition-all"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
