import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ValuePropsSection } from "@/components/landing/ValuePropsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ForWeldersSection } from "@/components/landing/ForWeldersSection";
import { ForEmployersSection } from "@/components/landing/ForEmployersSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingPreviewSection } from "@/components/landing/PricingPreviewSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ValuePropsSection />
      <HowItWorksSection />
      <ForWeldersSection />
      <ForEmployersSection />
      <TestimonialsSection />
      <PricingPreviewSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
