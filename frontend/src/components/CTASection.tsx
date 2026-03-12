import Link from "next/link";

export default function CTASection() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-charcoal p-12 lg:p-20 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <h2 className="text-3xl font-black text-white md:text-5xl">
            Ready to unlock sovereign intelligence?
          </h2>
          <p className="max-w-2xl text-lg text-slate-300">
            Join the leading organizations leveraging India&apos;s most advanced
            reasoning engine for a smarter, more secure future.
          </p>
          <Link
            href="/search"
            className="rounded-lg bg-primary px-10 py-4 text-lg font-bold text-background-dark transition-all hover:scale-105 active:scale-95"
          >
            Explore Now
          </Link>
        </div>
      </div>
    </section>
  );
}
