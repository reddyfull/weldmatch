import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS, PlanKey } from "@/lib/stripe";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function Pricing() {
  const navigate = useNavigate();
  const { user, profile, subscription } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const isEmployer = profile?.user_type === "employer";
  const currentPlan = subscription?.plan || "free_trial";

  const handleSelectPlan = async (planKey: PlanKey) => {
    if (!user) {
      navigate("/register/employer");
      return;
    }

    if (!isEmployer) {
      toast({
        title: "Welder Accounts",
        description: "WeldMatch is always free for welders!",
      });
      return;
    }

    const plan = STRIPE_PLANS[planKey];
    if (!plan.priceId) {
      // Free trial - just navigate to dashboard
      navigate("/employer/dashboard");
      return;
    }

    if (currentPlan === planKey) {
      toast({
        title: "Current Plan",
        description: "You're already subscribed to this plan.",
      });
      return;
    }

    setLoadingPlan(planKey);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: plan.priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan("pro");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const planOrder: PlanKey[] = ["free_trial", "pro", "enterprise"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, <span className="text-accent">Transparent</span> Pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              For welders, WeldMatch is always free. For employers, choose the plan that fits your hiring needs.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {planOrder.map((planKey) => {
              const plan = STRIPE_PLANS[planKey];
              const isCurrentPlan = isEmployer && currentPlan === planKey;
              const isPro = planKey === "pro";
              const isLoading = loadingPlan === planKey;
              const hasSubscription = subscription?.subscribed && (currentPlan === "pro" || currentPlan === "enterprise");

              return (
                <div
                  key={planKey}
                  className={`relative p-8 rounded-2xl bg-card border-2 transition-all duration-300 ${
                    isCurrentPlan 
                      ? "border-success shadow-xl ring-2 ring-success/20" 
                      : isPro 
                        ? "border-accent shadow-xl scale-105" 
                        : "border-border"
                  }`}
                >
                  {/* Badges */}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 rounded-full bg-success text-white text-sm font-semibold shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Your Plan
                      </span>
                    </div>
                  )}
                  {!isCurrentPlan && isPro && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 rounded-full bg-accent text-white text-sm font-semibold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-success" />
                        </div>
                        <span className="text-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan && hasSubscription ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Manage Subscription"
                      )}
                    </Button>
                  ) : isCurrentPlan && !hasSubscription ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={isPro ? "hero" : "outline"}
                      className="w-full"
                      size="lg"
                      onClick={() => handleSelectPlan(planKey)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {planKey === "free_trial" ? "Start Free Trial" : "Get Started"}
                          {isPro && <ArrowRight className="w-4 h-4 ml-1" />}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-2">
                  Is WeldMatch really free for welders?
                </h3>
                <p className="text-muted-foreground">
                  Yes! WeldMatch is 100% free for welders. Create your profile, upload certifications, and apply to jobs without any cost.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-2">
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely. You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-2">
                  What happens after the free trial?
                </h3>
                <p className="text-muted-foreground">
                  After your 14-day free trial ends, you'll need to upgrade to Professional or Enterprise to continue posting jobs and viewing candidates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
