import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS, PlanKey } from "@/lib/stripe";

const planOrder: PlanKey[] = ["free_trial", "pro", "enterprise"];

export function PricingPreviewSection() {
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

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, <span className="text-accent">Transparent</span> Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            For welders, it's always free. For employers, choose the plan that fits your hiring needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {planOrder.map((planKey) => {
            const plan = STRIPE_PLANS[planKey];
            const isCurrentPlan = isEmployer && currentPlan === planKey;
            const isPro = planKey === "pro";
            const isLoading = loadingPlan === planKey;

            return (
              <div
                key={planKey}
                className={`relative p-8 rounded-2xl bg-card border-2 ${
                  isCurrentPlan
                    ? "border-success shadow-xl"
                    : isPro
                      ? "border-accent shadow-xl scale-105"
                      : "border-border"
                } transition-all duration-300`}
              >
                {/* Badges */}
                {isCurrentPlan ? (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-success text-white text-sm font-semibold shadow-lg">
                      Your Plan
                    </span>
                  </div>
                ) : isPro ? (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-accent text-white text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                ) : null}

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

                {/* CTA */}
                {isCurrentPlan ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : user && isEmployer ? (
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
                ) : (
                  <Button
                    variant={isPro ? "hero" : "outline"}
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link to="/register/employer">
                      {planKey === "enterprise" ? "Contact Sales" : plan.name === "Free Trial" ? "Start Free Trial" : "Get Started"}
                      {isPro && <ArrowRight className="w-4 h-4 ml-1" />}
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:underline"
          >
            View full pricing details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
