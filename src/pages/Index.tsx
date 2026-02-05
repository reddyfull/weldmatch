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
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect signed-in users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Show loading skeleton instead of blank white screen
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b border-border">
          <div className="container mx-auto px-4 h-full flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
        <div className="h-[80vh] flex items-center justify-center">
          <div className="space-y-4 text-center">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
            <div className="flex gap-4 justify-center mt-8">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render landing page for signed-in users during redirect
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ValuePropsSection />
      <HowItWorksSection />
      
      {/* Eagerly loaded smaller sections */}
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
