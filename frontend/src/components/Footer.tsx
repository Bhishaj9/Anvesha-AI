export default function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-background-light px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-black text-background-dark">A</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-charcoal">
              Anvesha AI
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-charcoal/60">
            <a className="hover:text-primary transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Documentation
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Contact
            </a>
          </div>
        </div>
        <div className="mt-12 text-center text-sm text-charcoal/40">
          © 2024 Anvesha AI. Sovereign intelligence for a new era.
        </div>
      </div>
    </footer>
  );
}
