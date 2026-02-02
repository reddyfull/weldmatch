import { useParams } from "react-router-dom";
import { usePublicProfile, useLogProfileAccess, calculateProfileCompleteness } from "@/hooks/usePublicProfile";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
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
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Hero Section Component
function HeroSection({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;
  const userProfile = profile.profile;

  return (
    <div className="relative">
      {/* Cover Photo */}
      <div 
        className="h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-primary/90 via-primary to-accent/80 relative overflow-hidden"
        style={welderProfile.cover_photo_url ? {
          backgroundImage: `url(${welderProfile.cover_photo_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {!welderProfile.cover_photo_url && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Flame className="w-64 h-64 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Info Overlay */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 sm:-mt-24 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end">
            {/* Avatar */}
            <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background shadow-xl">
              <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name || "Profile"} />
              <AvatarFallback className="text-3xl sm:text-4xl bg-primary text-primary-foreground">
                {userProfile.full_name?.split(" ").map((n: string) => n[0]).join("") || "W"}
              </AvatarFallback>
            </Avatar>

            {/* Name and Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  {userProfile.full_name || "Welder"}
                </h1>
                {welderProfile.looking_for_work && (
                  <Badge className="bg-success text-success-foreground font-semibold">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Looking for Work
                  </Badge>
                )}
                {!welderProfile.looking_for_work && welderProfile.open_to_opportunities && (
                  <Badge variant="secondary" className="font-medium">
                    Open to Opportunities
                  </Badge>
                )}
              </div>
              
              {welderProfile.professional_title && (
                <p className="text-lg sm:text-xl text-muted-foreground">
                  {welderProfile.professional_title}
                  {welderProfile.years_experience && (
                    <span className="ml-2">• {welderProfile.years_experience}+ Years Experience</span>
                  )}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                {(welderProfile.city || welderProfile.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {[welderProfile.city, welderProfile.state].filter(Boolean).join(", ")}
                  </span>
                )}
                {welderProfile.willing_to_travel && (
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Open to Travel
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Stats Bar Component
function QuickStatsBar({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;
  const certifications = profile.certifications;
  const verifiedCerts = certifications.filter((c: any) => c.verification_status === "verified").length;

  // Find highest position qualified
  const positions = welderProfile.weld_positions || [];
  const highestPosition = positions.includes("6G") ? "6G" : 
    positions.includes("5G") ? "5G" : 
    positions.includes("4G") ? "4G" : 
    positions[0] || null;

  return (
    <div className="bg-muted/30 border-y">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {welderProfile.years_experience || 0}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Years Experience</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {certifications.length}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Certifications {verifiedCerts > 0 && `(${verifiedCerts} Verified)`}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary">
              {highestPosition || "—"}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Highest Position</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary flex items-center justify-center gap-1">
              <Eye className="w-5 h-5" />
              {welderProfile.profile_views || 0}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Profile Views</div>
          </div>
        </div>
      </div>
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
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          About Me
        </h2>
        {welderProfile.bio && (
          <p className="text-muted-foreground whitespace-pre-line mb-4">
            {welderProfile.bio}
          </p>
        )}
        {welderProfile.highlights && welderProfile.highlights.length > 0 && (
          <ul className="space-y-2">
            {welderProfile.highlights.map((highlight: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Certifications Section Component
function CertificationsSection({ certifications }: { certifications: any[] }) {
  if (certifications.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          Certifications & Qualifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{cert.cert_name || cert.cert_type}</h3>
                    {cert.issuing_body && (
                      <p className="text-xs text-muted-foreground">{cert.issuing_body}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {cert.issue_date && (
                  <div className="text-muted-foreground">
                    Issued: {format(new Date(cert.issue_date), "MMM yyyy")}
                  </div>
                )}
                {cert.expiry_date && (
                  <div className="text-muted-foreground">
                    Expires: {format(new Date(cert.expiry_date), "MMM yyyy")}
                  </div>
                )}
              </div>
              <div className="mt-3">
                {cert.verification_status === "verified" ? (
                  <Badge className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : cert.verification_status === "pending" ? (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {cert.verification_status}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skills Section Component
function SkillsSection({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;
  const processes = welderProfile.weld_processes || [];
  const positions = welderProfile.weld_positions || [];

  if (processes.length === 0 && positions.length === 0) return null;

  const processLabels: Record<string, string> = {
    SMAW: "Stick (SMAW)",
    GMAW: "MIG (GMAW)",
    GTAW: "TIG (GTAW)",
    FCAW: "Flux Core (FCAW)",
    SAW: "Submerged Arc (SAW)",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-accent" />
          Skills & Qualifications
        </h2>
        <div className="space-y-4">
          {processes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Welding Processes</h3>
              <div className="flex flex-wrap gap-2">
                {processes.map((process: string) => (
                  <Badge key={process} variant="secondary" className="text-sm">
                    <Flame className="w-3 h-3 mr-1 text-accent" />
                    {processLabels[process] || process}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {positions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Positions Qualified</h3>
              <div className="flex flex-wrap gap-2">
                {positions.sort().map((position: string) => (
                  <Badge 
                    key={position} 
                    className={cn(
                      "text-sm font-mono",
                      position === "6G" && "bg-accent text-accent-foreground",
                      position === "5G" && "bg-primary text-primary-foreground"
                    )}
                  >
                    {position}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Work Experience Section Component
function WorkExperienceSection({ experience }: { experience: any[] }) {
  if (experience.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-accent" />
          Work Experience
        </h2>
        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
          
          {experience.map((job, index) => (
            <div key={job.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                job.is_current ? "bg-success" : "bg-primary"
              )} />
              
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold">{job.job_title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      {job.company_name}
                      {job.location && (
                        <>
                          <span>•</span>
                          {job.location}
                        </>
                      )}
                    </div>
                  </div>
                  {job.is_current && (
                    <Badge className="bg-success/10 text-success">Current</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {format(new Date(job.start_date), "MMM yyyy")} — {" "}
                  {job.is_current ? "Present" : job.end_date ? format(new Date(job.end_date), "MMM yyyy") : "Present"}
                </div>
                {job.description && (
                  <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
                )}
                {job.highlights && Array.isArray(job.highlights) && job.highlights.length > 0 && (
                  <ul className="space-y-1">
                    {(job.highlights as string[]).map((highlight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-accent">•</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Portfolio Section Component
function PortfolioSection({ portfolioItems, workSamples }: { portfolioItems: any[]; workSamples: any[] }) {
  const allItems = [
    ...portfolioItems.map(item => ({ ...item, type: 'portfolio' })),
    ...workSamples.map(item => ({ ...item, type: 'sample', title: item.description || 'Work Sample' })),
  ];

  if (allItems.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-accent" />
          Portfolio & Work Samples
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {allItems.map((item, index) => (
            <div
              key={item.id || index}
              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:shadow-lg transition-shadow"
            >
              {item.image_url || item.file_url ? (
                <img
                  src={item.image_url || item.file_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : item.video_url ? (
                <div className="w-full h-full flex items-center justify-center bg-black/80">
                  <Play className="w-12 h-12 text-white" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  {item.is_featured && (
                    <Badge className="mt-1 bg-accent text-accent-foreground text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Equipment Section Component
interface EquipmentItem {
  id: string;
  equipment_type: string;
  brand: string | null;
  model: string | null;
  owned: boolean;
  proficiency: string;
}

function EquipmentSection({ equipment }: { equipment: EquipmentItem[] }) {
  if (equipment.length === 0) return null;

  const groupedEquipment = equipment.reduce<Record<string, EquipmentItem[]>>((acc, item) => {
    const type = item.equipment_type || "Other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-accent" />
          Equipment & Tools
        </h2>
        <div className="space-y-4">
          {Object.entries(groupedEquipment).map(([type, items]) => (
            <div key={type}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{type}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <Badge key={item.id} variant="outline" className="text-sm">
                    {item.brand && `${item.brand} `}
                    {item.model}
                    {item.owned && (
                      <CheckCircle2 className="w-3 h-3 ml-1 text-success" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Availability Section Component
function AvailabilitySection({ profile }: { profile: any }) {
  const welderProfile = profile.welder_profile;

  const hasAvailabilityInfo = welderProfile.available_date || 
    (welderProfile.work_types && welderProfile.work_types.length > 0) ||
    welderProfile.willing_to_travel ||
    welderProfile.willing_to_relocate ||
    welderProfile.minimum_hourly_rate;

  if (!hasAvailabilityInfo) return null;

  const workTypeLabels: Record<string, string> = {
    full_time: "Full-Time",
    part_time: "Part-Time",
    contract: "Contract",
    travel: "Travel/Per Diem",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          Availability & Preferences
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {welderProfile.available_date && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available</div>
                <div className="font-medium">
                  {new Date(welderProfile.available_date) <= new Date() 
                    ? "Immediately" 
                    : format(new Date(welderProfile.available_date), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          )}
          
          {welderProfile.work_types && welderProfile.work_types.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Work Type</div>
                <div className="font-medium">
                  {welderProfile.work_types.map((t: string) => workTypeLabels[t] || t).join(", ")}
                </div>
              </div>
            </div>
          )}

          {welderProfile.willing_to_travel && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Willing to Travel</div>
                <div className="font-medium">
                  {welderProfile.travel_scope || "Yes"}
                </div>
              </div>
            </div>
          )}

          {welderProfile.willing_to_relocate && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Open to Relocate</div>
                <div className="font-medium">
                  {welderProfile.relocation_preferences?.length > 0
                    ? welderProfile.relocation_preferences.join(", ")
                    : "Yes"}
                </div>
              </div>
            </div>
          )}

          {welderProfile.minimum_hourly_rate && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Minimum Rate</div>
                <div className="font-medium">
                  ${welderProfile.minimum_hourly_rate}/hour
                  {welderProfile.rate_negotiable && (
                    <span className="text-sm text-muted-foreground ml-1">(Negotiable)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Contact Section Component
function ContactSection({ profile, onContactClick }: { profile: any; onContactClick: () => void }) {
  const welderProfile = profile.welder_profile;
  const userProfile = profile.profile;

  return (
    <Card className="border-accent/30">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-accent" />
          Contact
        </h2>
        <div className="space-y-3">
          {welderProfile.show_email && userProfile.email && (
            <a
              href={`mailto:${userProfile.email}`}
              onClick={onContactClick}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span>{userProfile.email}</span>
            </a>
          )}
          {welderProfile.show_phone && userProfile.phone && (
            <a
              href={`tel:${userProfile.phone}`}
              onClick={onContactClick}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span>{userProfile.phone}</span>
            </a>
          )}
          {welderProfile.linkedin_url && (
            <a
              href={welderProfile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onContactClick}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Linkedin className="w-5 h-5 text-[#0077B5]" />
              <span>LinkedIn Profile</span>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
            </a>
          )}
          {welderProfile.instagram_url && (
            <a
              href={welderProfile.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onContactClick}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Instagram className="w-5 h-5 text-[#E4405F]" />
              <span>Instagram</span>
              <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Action Buttons Component
function ActionButtons({ profile, onShare, onDownloadResume }: { 
  profile: any; 
  onShare: () => void;
  onDownloadResume: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={onDownloadResume} variant="default">
        <Download className="w-4 h-4 mr-2" />
        Download Resume
      </Button>
      <Button onClick={onShare} variant="outline">
        <Share2 className="w-4 h-4 mr-2" />
        Share Profile
      </Button>
    </div>
  );
}

// Private Profile Message
function PrivateProfileMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="max-w-md mx-4">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Profile Not Available</h1>
          <p className="text-muted-foreground">
            This profile is private or does not exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Public Profile Page
export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading, error } = usePublicProfile(username || "");
  const logAccess = useLogProfileAccess();
  const [hasLoggedView, setHasLoggedView] = useState(false);

  // Log view on first load
  useEffect(() => {
    if (profile && !hasLoggedView) {
      logAccess.mutate({
        welderId: profile.welder_profile.id,
        accessType: "view",
      });
      setHasLoggedView(true);
    }
  }, [profile, hasLoggedView, logAccess]);

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
    // TODO: Implement resume download
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return <PrivateProfileMessage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <HeroSection profile={profile} />

      {/* Quick Stats */}
      <QuickStatsBar profile={profile} />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a href="/" className="text-primary hover:underline font-medium">
              WeldMatch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
