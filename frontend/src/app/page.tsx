import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PhilosophySection from "@/components/PhilosophySection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light text-charcoal">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <PhilosophySection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
