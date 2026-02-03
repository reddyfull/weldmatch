import { useParams } from "react-router-dom";
import { usePublicProfile, useLogProfileAccess, calculateProfileCompleteness } from "@/hooks/usePublicProfile";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
  HoverScale,
  FadeBlur,
} from "@/components/ui/animated-section";
import {
  MapPin,
  Briefcase,
  Award,
  Download,
  Share2,
  Mail,
  Phone,
  Linkedin,
  Instagram,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Wrench,
  Camera,
  Play,
  ExternalLink,
  Building,
  Truck,
  Globe,
  DollarSign,
  Shield,
  Star,
  Eye,
  Lock,
  Sparkles,
  Users,
  MapPinned,
  Zap,
  Target,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Hero Section Component - Modern glassmorphism design
function HeroSection({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;
  const userProfile = profile.profile;

  return (
    <div className="relative">
      {/* Cover Photo with enhanced gradient overlay */}
      <motion.div 
        className="h-64 sm:h-80 lg:h-96 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={welderProfile.cover_photo_url ? {
          backgroundImage: `url(${welderProfile.cover_photo_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {!welderProfile.cover_photo_url && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />
              </svg>
            </div>
            <motion.div 
              className="absolute right-0 bottom-0 w-96 h-96 opacity-10"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              <Flame className="w-full h-full text-white" />
            </motion.div>
          </div>
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />
      </motion.div>

      {/* Profile Card Overlay */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-32 sm:-mt-40 pb-8">
          <motion.div 
            className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-2xl border p-6 sm:p-8"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar with status indicator */}
              <motion.div 
                className="relative flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Avatar className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-background shadow-2xl ring-4 ring-primary/20">
                  <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name || "Profile"} />
                  <AvatarFallback className="text-3xl sm:text-4xl bg-gradient-to-br from-primary to-accent text-white font-bold">
                    {userProfile.full_name?.split(" ").map((n: string) => n[0]).join("") || "W"}
                  </AvatarFallback>
                </Avatar>
                {welderProfile.is_available && (
                  <motion.div 
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-full border-4 border-background flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7, type: "spring", stiffness: 500 }}
                  >
                    <Zap className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>

              {/* Name and Info */}
              <motion.div 
                className="flex-1 space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {userProfile.full_name || "Welder"}
                    </h1>
                    {welderProfile.looking_for_work && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                      >
                        <Badge className="bg-success hover:bg-success/90 text-white font-semibold px-4 py-1.5 text-sm shadow-lg shadow-success/25">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Looking for Work
                        </Badge>
                      </motion.div>
                    )}
                    {!welderProfile.looking_for_work && welderProfile.open_to_opportunities && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                      >
                        <Badge variant="secondary" className="font-medium px-4 py-1.5">
                          <Target className="w-3 h-3 mr-1" />
                          Open to Opportunities
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  
                  {welderProfile.professional_title && (
                    <p className="text-xl sm:text-2xl text-muted-foreground font-medium">
                      {welderProfile.professional_title}
                    </p>
                  )}

                  {welderProfile.tagline && (
                    <p className="text-muted-foreground mt-2 italic">
                      "{welderProfile.tagline}"
                    </p>
                  )}
                </div>

                <motion.div 
                  className="flex flex-wrap items-center gap-4 text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  {(welderProfile.city || welderProfile.state) && (
                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      {[welderProfile.city, welderProfile.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {welderProfile.years_experience && (
                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      {welderProfile.years_experience}+ Years
                    </span>
                  )}
                  {welderProfile.willing_to_travel && (
                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm">
                      <Truck className="w-4 h-4 text-primary" />
                      {welderProfile.travel_scope || "Open to Travel"}
                    </span>
                  )}
                  {welderProfile.willing_to_relocate && (
                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm">
                      <MapPinned className="w-4 h-4 text-primary" />
                      Will Relocate
                    </span>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Quick Stats Bar Component - Modern card design
function QuickStatsBar({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;
  const certifications = profile.certifications;
  const verifiedCerts = certifications.filter((c: any) => c.verification_status === "verified").length;

  const positions = welderProfile.weld_positions || [];
  const highestPosition = positions.includes("6G") ? "6G" : 
    positions.includes("5G") ? "5G" : 
    positions.includes("4G") ? "4G" : 
    positions[0] || null;

  const stats = [
    {
      value: welderProfile.years_experience || 0,
      label: "Years Experience",
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      value: certifications.length,
      label: `Certifications${verifiedCerts > 0 ? ` (${verifiedCerts} ✓)` : ""}`,
      icon: Award,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      value: highestPosition || "—",
      label: "Highest Position",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      value: welderProfile.profile_views || 0,
      label: "Profile Views",
      icon: Eye,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StaggerItem key={index}>
            <HoverScale>
              <div className="bg-background rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </div>
            </HoverScale>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}

// About Section Component
function AboutSection({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;

  if (!welderProfile.bio && (!welderProfile.highlights || welderProfile.highlights.length === 0)) {
    return null;
  }

  return (
    <AnimatedSection delay={0.1}>
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Star className="w-5 h-5 text-primary" />
            </div>
            About Me
          </h2>
          {welderProfile.bio && (
            <FadeBlur delay={0.2}>
              <p className="text-muted-foreground whitespace-pre-line mb-4 leading-relaxed">
                {welderProfile.bio}
              </p>
            </FadeBlur>
          )}
          {welderProfile.highlights && welderProfile.highlights.length > 0 && (
            <StaggerContainer staggerDelay={0.05}>
              <ul className="space-y-2">
                {welderProfile.highlights.map((highlight: string, index: number) => (
                  <StaggerItem key={index}>
                    <li className="flex items-start gap-3 text-muted-foreground">
                      <div className="p-1 rounded-full bg-success/10 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      </div>
                      <span>{highlight}</span>
                    </li>
                  </StaggerItem>
                ))}
              </ul>
            </StaggerContainer>
          )}
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Certifications Section Component - Enhanced cards
function CertificationsSection({ certifications }: { certifications: any[] }) {
  if (certifications.length === 0) return null;

  return (
    <AnimatedSection delay={0.15} direction="up">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            Certifications & Qualifications
          </h2>
          <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certifications.map((cert) => (
              <StaggerItem key={cert.id}>
                <HoverScale scale={1.02}>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-xl p-4 border transition-all hover:shadow-lg h-full",
                      cert.verification_status === "verified" 
                        ? "bg-gradient-to-br from-success/5 to-success/10 border-success/20"
                        : "bg-muted/30"
                    )}
                  >
                    {cert.verification_status === "verified" && (
                      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                        <div className="absolute top-2 right-[-20px] w-20 text-center text-xs font-bold text-white bg-success py-1 rotate-45 shadow-sm">
                          ✓
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{cert.cert_name || cert.cert_type}</h3>
                        {cert.issuing_body && (
                          <p className="text-sm text-muted-foreground truncate">{cert.issuing_body}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {cert.issue_date && (
                            <span className="bg-muted px-2 py-0.5 rounded-full">
                              Issued {format(new Date(cert.issue_date), "MMM yyyy")}
                            </span>
                          )}
                          {cert.expiry_date && (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full",
                              new Date(cert.expiry_date) < new Date() 
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted"
                            )}>
                              Expires {format(new Date(cert.expiry_date), "MMM yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Skills Section Component - Visual tags
function SkillsSection({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;
  const processes = welderProfile.weld_processes || [];
  const positions = welderProfile.weld_positions || [];

  if (processes.length === 0 && positions.length === 0) return null;

  const processConfig: Record<string, { label: string; color: string }> = {
    SMAW: { label: "Stick (SMAW)", color: "from-red-500 to-orange-500" },
    GMAW: { label: "MIG (GMAW)", color: "from-blue-500 to-cyan-500" },
    GTAW: { label: "TIG (GTAW)", color: "from-purple-500 to-pink-500" },
    FCAW: { label: "Flux Core (FCAW)", color: "from-amber-500 to-yellow-500" },
    SAW: { label: "Submerged Arc (SAW)", color: "from-green-500 to-emerald-500" },
  };

  return (
    <AnimatedSection delay={0.2} direction="up">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wrench className="w-5 h-5 text-blue-500" />
            </div>
            Skills & Qualifications
          </h2>
          <div className="space-y-6">
            {processes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Welding Processes</h3>
                <StaggerContainer staggerDelay={0.05} className="flex flex-wrap gap-2">
                  {processes.map((process: string) => {
                    const config = processConfig[process] || { label: process, color: "from-gray-500 to-gray-600" };
                    return (
                      <StaggerItem key={process}>
                        <HoverScale>
                          <div
                            className={cn(
                              "px-4 py-2 rounded-xl text-white font-medium text-sm shadow-lg cursor-default",
                              `bg-gradient-to-r ${config.color}`
                            )}
                          >
                            <Flame className="w-3 h-3 inline mr-2" />
                            {config.label}
                          </div>
                        </HoverScale>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </div>
            )}
            {positions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Positions Qualified</h3>
                <StaggerContainer staggerDelay={0.06} className="flex flex-wrap gap-2">
                  {positions.sort().map((position: string) => (
                    <StaggerItem key={position}>
                      <HoverScale scale={1.1}>
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg cursor-default",
                            position === "6G" && "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
                            position === "5G" && "bg-gradient-to-br from-primary to-primary/80 text-white",
                            position !== "6G" && position !== "5G" && "bg-gradient-to-br from-muted to-muted-foreground/20 text-foreground border"
                          )}
                        >
                          {position}
                        </div>
                      </HoverScale>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Work Experience Section Component - Timeline
function WorkExperienceSection({ experience }: { experience: any[] }) {
  if (experience.length === 0) return null;

  return (
    <AnimatedSection delay={0.25} direction="up">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Briefcase className="w-5 h-5 text-green-500" />
            </div>
            Work Experience
          </h2>
          <div className="relative space-y-6">
            {/* Timeline line */}
            <motion.div 
              className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-muted to-transparent"
              initial={{ scaleY: 0, originY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            
            <StaggerContainer staggerDelay={0.1}>
              {experience.map((job, index) => (
                <StaggerItem key={job.id}>
                  <div className="relative pl-14">
                    {/* Timeline dot */}
                    <motion.div 
                      className={cn(
                        "absolute left-3 w-5 h-5 rounded-full border-4 border-background shadow-lg",
                        job.is_current 
                          ? "bg-success ring-4 ring-success/20" 
                          : "bg-primary"
                      )}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1, type: "spring", stiffness: 500 }}
                    />
                    
                    <HoverScale scale={1.01}>
                      <div className="bg-muted/30 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{job.job_title}</h3>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building className="w-4 h-4" />
                              <span className="font-medium">{job.company_name}</span>
                              {job.location && (
                                <>
                                  <span className="opacity-50">•</span>
                                  <span>{job.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {job.is_current && (
                            <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                              <Zap className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(job.start_date), "MMM yyyy")} — {" "}
                          {job.is_current ? "Present" : job.end_date ? format(new Date(job.end_date), "MMM yyyy") : "Present"}
                        </div>
                        {job.description && (
                          <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
                        )}
                        {job.highlights && Array.isArray(job.highlights) && job.highlights.length > 0 && (
                          <ul className="space-y-1.5 mt-3 pt-3 border-t border-border/50">
                            {(job.highlights as string[]).map((highlight: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Sparkles className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </HoverScale>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Portfolio Section Component - Gallery Grid
function PortfolioSection({ portfolioItems, workSamples }: { portfolioItems: any[]; workSamples: any[] }) {
  const allItems = [
    ...portfolioItems.map(item => ({ ...item, type: 'portfolio' })),
    ...workSamples.map(item => ({ ...item, type: 'sample', title: item.description || 'Work Sample' })),
  ];

  if (allItems.length === 0) return null;

  return (
    <AnimatedSection delay={0.3} direction="up">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500" />
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-500/10">
              <Camera className="w-5 h-5 text-pink-500" />
            </div>
            Portfolio & Work Samples
          </h2>
          <StaggerContainer staggerDelay={0.06} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {allItems.map((item, index) => (
              <StaggerItem key={item.id || index}>
                <ScaleIn delay={index * 0.03}>
                  <div className="group relative aspect-square rounded-xl overflow-hidden border bg-muted cursor-pointer">
                    {item.image_url || item.file_url ? (
                      <img
                        src={item.image_url || item.file_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : item.video_url ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{item.title}</p>
                        {item.is_featured && (
                          <Badge className="mt-1 bg-accent/80 backdrop-blur-sm text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </ScaleIn>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Equipment Section Component
function EquipmentSection({ equipment }: { equipment: any[] }) {
  if (equipment.length === 0) return null;

  return (
    <AnimatedSection delay={0.35} direction="right">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-slate-500 via-gray-500 to-slate-500" />
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-500/10">
              <Wrench className="w-5 h-5 text-slate-500" />
            </div>
            Equipment & Tools
          </h2>
          <StaggerContainer staggerDelay={0.06} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {equipment.map((item) => (
              <StaggerItem key={item.id}>
                <HoverScale scale={1.02}>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.equipment_type}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {[item.brand, item.model].filter(Boolean).join(" ") || "Various"}
                        {item.owned && " • Owned"}
                      </p>
                    </div>
                    {item.proficiency && (
                      <Badge variant="outline" className="text-xs">
                        {item.proficiency}
                      </Badge>
                    )}
                  </div>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Availability Section Component
function AvailabilitySection({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;

  return (
    <AnimatedSection delay={0.2} direction="right">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500" />
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Calendar className="w-4 h-4 text-violet-500" />
            </div>
            Availability & Preferences
          </h2>
          <div className="space-y-4">
            {welderProfile.work_types && welderProfile.work_types.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Work Type</p>
                <div className="flex flex-wrap gap-2">
                  {welderProfile.work_types.map((type: string) => (
                    <Badge key={type} variant="secondary" className="capitalize">
                      {type.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {welderProfile.available_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Available {new Date(welderProfile.available_date) > new Date() 
                    ? formatDistanceToNow(new Date(welderProfile.available_date), { addSuffix: true })
                    : "now"}
                </span>
              </div>
            )}

            {(welderProfile.minimum_hourly_rate || welderProfile.desired_salary_min) && (
              <motion.div 
                className="p-3 bg-success/5 rounded-lg border border-success/20"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-muted-foreground mb-1">Compensation</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="font-semibold">
                    {welderProfile.minimum_hourly_rate 
                      ? `$${welderProfile.minimum_hourly_rate}/hr`
                      : welderProfile.desired_salary_min 
                        ? `$${(welderProfile.desired_salary_min / 1000).toFixed(0)}k - $${(welderProfile.desired_salary_max / 1000).toFixed(0)}k`
                        : "Negotiable"}
                    {welderProfile.rate_negotiable && (
                      <span className="text-muted-foreground font-normal ml-1">(negotiable)</span>
                    )}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Contact Section Component
function ContactSection({ profile, onContactClick }: { profile: any; onContactClick: () => void }) {
  const welderProfile = profile.welder_profile;
  const userProfile = profile.profile;

  const hasContact = welderProfile.show_email || welderProfile.show_phone || 
    welderProfile.linkedin_url || welderProfile.instagram_url;

  if (!hasContact) return null;

  return (
    <AnimatedSection delay={0.25} direction="right">
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500" />
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Mail className="w-4 h-4 text-cyan-500" />
            </div>
            Contact
          </h2>
          <StaggerContainer staggerDelay={0.08} className="space-y-3">
            {welderProfile.show_email && userProfile.email && (
              <StaggerItem>
                <HoverScale>
                  <a
                    href={`mailto:${userProfile.email}`}
                    onClick={onContactClick}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    <span className="text-sm truncate">{userProfile.email}</span>
                  </a>
                </HoverScale>
              </StaggerItem>
            )}
            {welderProfile.show_phone && userProfile.phone && (
              <StaggerItem>
                <HoverScale>
                  <a
                    href={`tel:${userProfile.phone}`}
                    onClick={onContactClick}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="text-sm">{userProfile.phone}</span>
                  </a>
                </HoverScale>
              </StaggerItem>
            )}
            {welderProfile.linkedin_url && (
              <StaggerItem>
                <HoverScale>
                  <a
                    href={welderProfile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onContactClick}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-[#0077b5]" />
                    <span className="text-sm">LinkedIn Profile</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                </HoverScale>
              </StaggerItem>
            )}
            {welderProfile.instagram_url && (
              <StaggerItem>
                <HoverScale>
                  <a
                    href={welderProfile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onContactClick}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-[#E4405F]" />
                    <span className="text-sm">Instagram</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                </HoverScale>
              </StaggerItem>
            )}
          </StaggerContainer>
        </CardContent>
      </Card>
    </AnimatedSection>
  );
}

// Action Buttons Component
function ActionButtons({ 
  profile, 
  onShare, 
  onDownloadResume 
}: { 
  profile: any; 
  onShare: () => void; 
  onDownloadResume: () => void;
}) {
  return (
    <AnimatedSection delay={0.15} direction="right">
      <div className="space-y-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={onDownloadResume} 
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Resume
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={onShare} 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Profile
          </Button>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// Private Profile Message Component
function PrivateProfileMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
      <Card className="max-w-md mx-4 shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Profile Not Available</h1>
          <p className="text-muted-foreground mb-6">
            This profile is either private or doesn't exist. The welder may have chosen to hide their profile from public view.
          </p>
          <Button onClick={() => window.location.href = "/"} className="w-full">
            Go to WeldMatch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Component
export default function PublicProfile() {
  const { username } = useParams();
  const { data: profile, isLoading, error } = usePublicProfile(username || "");
  const logAccess = useLogProfileAccess();

  // Log profile view
  useEffect(() => {
    if (profile?.welder_profile?.id) {
      logAccess.mutate({
        welderId: profile.welder_profile.id,
        accessType: "view",
      });
    }
  }, [profile?.welder_profile?.id]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.profile.full_name}'s Welder Profile`,
          text: `Check out ${profile?.profile.full_name}'s professional welding profile on WeldMatch`,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
    }

    if (profile) {
      logAccess.mutate({
        welderId: profile.welder_profile.id,
        accessType: "share",
      });
    }
  };

  const handleDownloadResume = () => {
    toast.info("Resume download coming soon!");
    if (profile) {
      logAccess.mutate({
        welderId: profile.welder_profile.id,
        accessType: "resume_download",
      });
    }
  };

  const handleContactClick = () => {
    if (profile) {
      logAccess.mutate({
        welderId: profile.welder_profile.id,
        accessType: "contact_click",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <PrivateProfileMessage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero */}
      <HeroSection profile={profile} />

      {/* Quick Stats */}
      <QuickStatsBar profile={profile} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons - Mobile */}
        <div className="mb-6 sm:hidden">
          <ActionButtons 
            profile={profile} 
            onShare={handleShare} 
            onDownloadResume={handleDownloadResume} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <AboutSection profile={profile} />
            <CertificationsSection certifications={profile.certifications} />
            <SkillsSection profile={profile} />
            <WorkExperienceSection experience={profile.work_experience} />
            <PortfolioSection 
              portfolioItems={profile.portfolio_items} 
              workSamples={profile.work_samples} 
            />
            <EquipmentSection equipment={profile.equipment} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons - Desktop */}
            <div className="hidden sm:block">
              <ActionButtons 
                profile={profile} 
                onShare={handleShare} 
                onDownloadResume={handleDownloadResume} 
              />
            </div>
            <AvailabilitySection profile={profile} />
            <ContactSection profile={profile} onContactClick={handleContactClick} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <a href="/" className="text-primary hover:underline font-semibold">
              WeldMatch
            </a>
            {" "}— Connecting skilled welders with great opportunities
          </p>
        </div>
      </div>
    </div>
  );
}
