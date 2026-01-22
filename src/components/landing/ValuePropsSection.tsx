import { ShieldCheck, Target, Wrench } from "lucide-react";

const valueProps = [
  {
    icon: ShieldCheck,
    title: "Verified Certifications",
    description:
      "Every welder on our platform has their certifications verified. AWS, ASME, NCCER, API, CWI - all authenticated so employers can hire with confidence.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Target,
    title: "Skills-Based Matching",
    description:
      "Our matching algorithm connects welders with jobs based on specific processes (SMAW, GMAW, GTAW), positions (1G-6G), and experience - not just keywords.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Wrench,
    title: "Industry Expertise",
    description:
      "Built by people who understand the trades. We know the difference between pipe and structural, between shop work and field work. This platform speaks your language.",
    color: "bg-primary/10 text-primary",
  },
];

export function ValuePropsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why <span className="text-accent">WeldMatch</span>?
          </h2>
          <p className="text-lg text-muted-foreground">
            We're not just another job board. We're the platform built specifically for the welding industry.
          </p>
        </div>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-3 gap-8 stagger-children">
          {valueProps.map((prop) => (
            <div
              key={prop.title}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-xl transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-xl ${prop.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <prop.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{prop.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{prop.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
