import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ValuePropsSection } from "@/components/landing/ValuePropsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ForWeldersSection } from "@/components/landing/ForWeldersSection";
import { ForEmployersSection } from "@/components/landing/ForEmployersSection";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load below-the-fold sections (heavier components)
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const PricingPreviewSection = lazy(() => import("@/components/landing/PricingPreviewSection").then(m => ({ default: m.PricingPreviewSection })));
const CTASection = lazy(() => import("@/components/landing/CTASection").then(m => ({ default: m.CTASection })));

// Loading fallback for lazy sections
const SectionSkeleton = () => (
  <div className="py-16 px-4">
    <div className="max-w-6xl mx-auto space-y-8">
      <Skeleton className="h-10 w-64 mx-auto" />
      <Skeleton className="h-6 w-96 mx-auto" />
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  </div>
);

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
      
      {/* Lazy-loaded heavier sections */}
      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PricingPreviewSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CTASection />
      </Suspense>
      
      <Footer />
    </div>
  );
};

export default Index;
