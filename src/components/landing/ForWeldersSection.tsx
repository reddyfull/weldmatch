import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const benefits = [
  "Free profile with unlimited job applications",
  "Get your certifications verified and stand out",
  "Skills-based matching finds jobs you're qualified for",
  "See salary ranges upfront - no surprises",
  "One-click apply with your verified profile",
  "Track all your applications in one place",
];

export function ForWeldersSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
              For Welders
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Your Skills Deserve{" "}
              <span className="text-accent">Recognition</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Stop applying to jobs where your qualifications get lost in a pile of resumes. 
              WeldMatch puts your verified certifications and proven skills front and center.
            </p>

            {/* Benefits List */}
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button variant="hero" size="lg" asChild>
              <Link to="/register/welder">
                Create Free Profile
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Visual Card */}
          <div className="relative">
            <div className="bg-card rounded-2xl border border-border shadow-xl p-8">
              {/* Mock Profile Card */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  JD
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground">John Doe</h4>
                  <p className="text-muted-foreground">Structural Welder • Houston, TX</p>
                </div>
              </div>

              {/* Verified Certs */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">Verified Certifications</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium border border-success/20">
                    <Check className="w-3.5 h-3.5" />
                    AWS D1.1
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium border border-success/20">
                    <Check className="w-3.5 h-3.5" />
                    ASME IX
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium border border-success/20">
                    <Check className="w-3.5 h-3.5" />
                    API 1104
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">Weld Processes</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">SMAW</span>
                  <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">GMAW</span>
                  <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">GTAW</span>
                  <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">FCAW</span>
                </div>
              </div>

              {/* Match Score */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20">
                <div>
                  <p className="text-sm text-muted-foreground">Match Score</p>
                  <p className="text-lg font-bold text-foreground">Structural Welder at ABC Fab</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-accent flex items-center justify-center">
                  <span className="text-xl font-bold text-accent">94%</span>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
