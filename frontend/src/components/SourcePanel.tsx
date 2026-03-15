import SutraCard from "./SutraCard";

interface SourcePanelProps {
  isOpen: boolean;
  onClose: () => void;
  results: { title: string; content: string; url: string }[];
}

export default function SourcePanel({ isOpen, onClose, results }: SourcePanelProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background-light shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-charcoal/10 bg-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">library_books</span>
            <h2 className="text-xl font-bold text-charcoal">Sources</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {results.length === 0 ? (
            <p className="text-charcoal/50 text-center py-10">No sources available.</p>
          ) : (
            results.map((result, index) => (
              <SutraCard
                key={`${result.url}-${index}`}
                title={result.title}
                content={result.content}
                url={result.url}
                citationIndex={index + 1}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
