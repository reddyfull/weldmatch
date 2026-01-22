import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-primary metal-gradient relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 pattern-industrial opacity-30" />
      
      {/* Decorative Sparks */}
      <div className="absolute top-10 right-[20%] w-2 h-2 rounded-full bg-accent animate-spark" />
      <div className="absolute top-20 right-[30%] w-3 h-3 rounded-full bg-warning animate-spark" style={{ animationDelay: "0.4s" }} />
      <div className="absolute bottom-20 left-[25%] w-2 h-2 rounded-full bg-accent animate-spark" style={{ animationDelay: "0.8s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-8 animate-pulse-glow">
            <Flame className="w-10 h-10 text-accent" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Ignite Your{" "}
            <span className="text-accent">Welding Career</span>?
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-white/70 mb-10">
            Join thousands of verified welders and top employers on the platform built for the trade.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register/welder">
                I'm a Welder
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/register/employer">
                I'm Hiring Welders
              </Link>
            </Button>
          </div>

          {/* Trust Note */}
          <p className="mt-8 text-white/50 text-sm">
            Free for welders • 14-day free trial for employers • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
