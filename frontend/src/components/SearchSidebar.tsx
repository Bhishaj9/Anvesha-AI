import Link from "next/link";

export default function SearchSidebar() {
  return (
    <aside className="w-16 lg:w-64 flex-shrink-0 border-r border-primary/10 bg-white flex flex-col h-full">
      <div className="p-4 lg:p-6 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-background-dark">A</span>
          </div>
          <div className="hidden lg:block overflow-hidden">
            <h1 className="text-charcoal font-bold text-lg leading-tight">
              Anvesha AI
            </h1>
            <p className="text-primary text-xs font-medium uppercase tracking-widest">
              Sovereign
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 lg:px-4 space-y-2 mt-4">
        <a
          className="flex items-center gap-4 px-3 py-3 rounded-xl bg-primary/10 text-primary"
          href="#"
        >
          <span className="material-symbols-outlined">history</span>
          <span className="hidden lg:block font-medium">Search History</span>
        </a>
        <a
          className="flex items-center gap-4 px-3 py-3 rounded-xl text-charcoal/60 hover:bg-charcoal/5 transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">bookmarks</span>
          <span className="hidden lg:block font-medium">Saved Sutras</span>
        </a>
        <a
          className="flex items-center gap-4 px-3 py-3 rounded-xl text-charcoal/60 hover:bg-charcoal/5 transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">description</span>
          <span className="hidden lg:block font-medium">Document Intelligence</span>
        </a>
      </nav>

      <div className="p-4 border-t border-primary/10">
        <div className="flex items-center gap-3 p-2">
          <div className="h-8 w-8 rounded-full bg-charcoal/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-charcoal/50 text-sm">person</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-charcoal">Dharma Practitioner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
