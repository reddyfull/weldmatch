import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Users, ShieldCheck, Zap } from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Pre-Verified Candidates",
    description: "Every welder's certifications are verified before they can apply. No more chasing documentation.",
  },
  {
    icon: Zap,
    title: "Skills-Based Filtering",
    description: "Filter by exact weld processes, positions, and cert types. Find exactly who you need.",
  },
  {
    icon: Users,
    title: "Qualified Applicants Only",
    description: "Our matching ensures you only see candidates who meet your minimum requirements.",
  },
];

export function ForEmployersSection() {
  return (
    <section className="py-20 bg-primary metal-gradient">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Visual */}
          <div className="order-2 lg:order-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              {/* Dashboard Preview */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Active Job Postings</h4>
                  <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">3 Active</span>
                </div>
                
                {/* Job Cards */}
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">Pipe Welder - 6G Certified</p>
                      <span className="text-accent text-sm font-semibold">12 Applicants</span>
                    </div>
                    <p className="text-white/60 text-sm">Houston, TX • $40-55/hr</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">Structural Welder - AWS D1.1</p>
                      <span className="text-accent text-sm font-semibold">8 Applicants</span>
                    </div>
                    <p className="text-white/60 text-sm">Dallas, TX • $35-45/hr</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">TIG Welder - Aerospace</p>
                      <span className="text-accent text-sm font-semibold">5 Applicants</span>
                    </div>
                    <p className="text-white/60 text-sm">Phoenix, AZ • $55-70/hr</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-accent">25</p>
                  <p className="text-white/60 text-xs">New This Week</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-success">18</p>
                  <p className="text-white/60 text-xs">Verified</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-white">92%</p>
                  <p className="text-white/60 text-xs">Avg Match</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold mb-6">
              For Employers
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Hire <span className="text-accent">Qualified Welders</span> Faster
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Stop sifting through unqualified resumes. WeldMatch pre-verifies every candidate 
              so you can focus on finding the right fit for your team.
            </p>

            {/* Benefits */}
            <div className="space-y-6 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{benefit.title}</h4>
                    <p className="text-white/60 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register/employer">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
