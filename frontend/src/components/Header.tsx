import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-light/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-xl font-black text-background-dark">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-charcoal">
            Anvesha AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#philosophy">
            Philosophy
          </a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Intelligence
          </a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Citations
          </a>
          <a className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Multimodal
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="hidden sm:flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-background-dark transition-all hover:brightness-110 active:scale-95"
          >
            Explore Now
          </Link>
          <button className="md:hidden p-2 text-charcoal" aria-label="Menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}
