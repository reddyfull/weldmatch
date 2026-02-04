import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Target, Award } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-welding.jpg";
import { SparkParticles, WeldingArc } from "./SparkParticles";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Professional welder at work"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        <div className="absolute inset-0 pattern-industrial" />
      </div>

      {/* Floating Spark Particles */}
      <SparkParticles count={25} className="z-[5]" />
      
      {/* Welding Arc Effects */}
      <WeldingArc className="bottom-20 right-[15%] hidden lg:block" />
      <WeldingArc className="bottom-32 right-[25%] hidden lg:block" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent mb-6 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Verification-First Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Find Your Next{" "}
            <span className="text-accent">Welding Career</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
            The premier job board exclusively for certified welders. 
            Connect with top employers who value verified skills and real experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
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

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-white font-semibold">5,000+</p>
                <p className="text-white/60 text-sm">Verified Welders</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-white font-semibold">1,200+</p>
                <p className="text-white/60 text-sm">Active Jobs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-white font-semibold">850+</p>
                <p className="text-white/60 text-sm">Companies Trust Us</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Spark Elements */}
      <div className="absolute bottom-20 right-20 w-3 h-3 rounded-full bg-accent animate-spark hidden lg:block" />
      <div className="absolute bottom-32 right-40 w-2 h-2 rounded-full bg-warning animate-spark hidden lg:block" style={{ animationDelay: "0.3s" }} />
      <div className="absolute bottom-16 right-60 w-2 h-2 rounded-full bg-accent animate-spark hidden lg:block" style={{ animationDelay: "0.6s" }} />
    </section>
  );
}
