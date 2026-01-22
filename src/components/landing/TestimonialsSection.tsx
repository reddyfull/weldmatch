import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Finally, a job board that understands welding. I uploaded my certs once and now every employer can see I'm the real deal. Got hired within two weeks.",
    author: "Marcus Johnson",
    role: "6G Pipe Welder",
    location: "Houston, TX",
    rating: 5,
  },
  {
    quote:
      "We've cut our hiring time in half. Every candidate that applies has verified certifications, so we can focus on interviews instead of paperwork.",
    author: "Sarah Mitchell",
    role: "HR Director",
    company: "Precision Fabrication Inc.",
    rating: 5,
  },
  {
    quote:
      "The matching system is spot on. It only shows me jobs I'm actually qualified for. No more wasting time on positions that need certs I don't have.",
    author: "David Chen",
    role: "Structural Welder",
    location: "Phoenix, AZ",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by <span className="text-accent">Welders & Employers</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our community has to say.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4 pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground leading-relaxed mb-6">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                    {testimonial.company && `, ${testimonial.company}`}
                    {testimonial.location && ` • ${testimonial.location}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
