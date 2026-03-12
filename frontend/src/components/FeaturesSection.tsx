const features = [
  {
    icon: "shield_person",
    title: "Sovereign Intelligence",
    description:
      "Built on Sarvam 105B for high-performance localized reasoning that respects data sovereignty and cultural context.",
  },
  {
    icon: "verified",
    title: "Citations First",
    description:
      "Priority access to .gov.in sources and primary legal documents for verified, trustworthy, and hallucination-free information.",
  },
  {
    icon: "psychology_alt",
    title: "Multimodal Freedom",
    description:
      "Seamlessly interact through Saaras Voice and Sarvam Vision, enabling natural language communication across Indian dialects.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col gap-6 rounded-2xl border border-primary/10 bg-white p-8 transition-all hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-background-dark">
                <span className="material-symbols-outlined text-3xl">
                  {feature.icon}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-xl font-bold text-charcoal">
                  {feature.title}
                </h4>
                <p className="text-charcoal/70">{feature.description}</p>
              </div>
              <div className="mt-auto pt-4 text-primary font-bold text-sm inline-flex items-center gap-2 cursor-pointer">
                Learn more{" "}
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
