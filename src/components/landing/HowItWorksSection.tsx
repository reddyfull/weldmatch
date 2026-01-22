import { UserPlus, Upload, Search, Handshake } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up and tell us about your welding experience, certifications, and career goals.",
  },
  {
    number: "02",
    icon: Upload,
    title: "Verify Your Certs",
    description: "Upload your certifications for verification. Verified badges make you stand out to employers.",
  },
  {
    number: "03",
    icon: Search,
    title: "Match with Jobs",
    description: "Our algorithm finds jobs that match your skills, location preferences, and pay expectations.",
  },
  {
    number: "04",
    icon: Handshake,
    title: "Get Hired",
    description: "Apply with one click. Your verified profile speaks for itself. Land your next great opportunity.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It <span className="text-accent">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From sign-up to hired in four simple steps. We've streamlined the process so you can focus on what matters.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-border" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Step Card */}
                <div className="text-center">
                  {/* Step Number & Icon */}
                  <div className="relative inline-flex flex-col items-center">
                    <span className="text-5xl font-bold text-accent/20 mb-2">{step.number}</span>
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg relative z-10">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mt-6 mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow (mobile/tablet) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <div className="w-0.5 h-8 bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
