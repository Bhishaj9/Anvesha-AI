import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-20 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Sovereign Indian LLM
            </div>
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-charcoal md:text-6xl lg:text-7xl">
              The Sutra of{" "}
              <span className="text-primary">Information</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-charcoal/80 md:text-xl">
              Experience sovereign Indian LLMs designed for professional
              insight, deep reasoning, and cultural precision.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/search"
                className="flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-base font-bold text-background-dark transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95"
              >
                Explore Now
              </Link>
              <button className="flex items-center justify-center rounded-lg border-2 border-charcoal/10 bg-transparent px-8 py-4 text-base font-bold text-charcoal hover:bg-charcoal/5 transition-all">
                Watch Demo
              </button>
            </div>
          </div>

          <div className="relative aspect-square lg:aspect-video rounded-2xl overflow-hidden shadow-2xl border border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Abstract geometric patterns representing neural networks and sovereign Indian AI"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_6OvMz2fD13HUs1okW8JEeIMt8E-GMbTNmvfYbMco_7Zc07J3UvDNI5_KlQ23hvpim5SnIP_KxBsssF9lKdBIG91e-IldHIU_XSXHvD4_1BacJ97hkgXIU-8h0laSeE4rmIzT60GmuOhxfwoplZWcJ5FHqM1yp0rc-o1j7Ha8lkC8fYG_rUTJH2hsByJpRLwWXcL3gRAVRr9azRRgpLJp6C6t0XyTyq4ajH6CoPWhu6jR0DY8M28VgZuWNQemnx-Tpn7F0kBaNVGp"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
