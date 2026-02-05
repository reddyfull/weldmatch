import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect signed-in users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Don't render landing page for signed-in users during redirect
  if (loading || user) {
    return null;
  }

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
