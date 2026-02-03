import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWelderProfile, useUserProfile, useUpdateWelderProfile } from "@/hooks/useUserProfile";
import { useCheckUsername, useClaimUsername, useProfileAnalytics } from "@/hooks/usePublicProfile";
import {
  User,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  Briefcase,
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  Mail,
  Phone,
  Share2,
  Globe,
  Instagram,
  Linkedin,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Custom debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { data: welderProfile, isLoading: isLoadingProfile } = useWelderProfile();
  const updateProfile = useUpdateWelderProfile();
  const checkUsername = useCheckUsername();
  const claimUsername = useClaimUsername();
  const { data: analytics } = useProfileAnalytics();

  // Form state
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Profile settings
  const [lookingForWork, setLookingForWork] = useState(false);
  const [openToOpportunities, setOpenToOpportunities] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(true);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [travelScope, setTravelScope] = useState("");
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [minimumHourlyRate, setMinimumHourlyRate] = useState("");
  const [rateNegotiable, setRateNegotiable] = useState(true);

  const debouncedUsername = useDebounceValue(username, 500);

  // Load initial values from profile
  useEffect(() => {
    if (welderProfile) {
      setUsername((welderProfile as any).username || "");
      setLookingForWork((welderProfile as any).looking_for_work || false);
      setOpenToOpportunities((welderProfile as any).open_to_opportunities ?? true);
      setProfileVisibility((welderProfile as any).profile_visibility || "public");
      setProfessionalTitle((welderProfile as any).professional_title || "");
      setTagline((welderProfile as any).tagline || "");
      setShowPhone((welderProfile as any).show_phone || false);
      setShowEmail((welderProfile as any).show_email ?? true);
      setLinkedinUrl((welderProfile as any).linkedin_url || "");
      setInstagramUrl((welderProfile as any).instagram_url || "");
      setTravelScope((welderProfile as any).travel_scope || "");
      setWillingToRelocate((welderProfile as any).willing_to_relocate || false);
      setWorkTypes((welderProfile as any).work_types || []);
      setMinimumHourlyRate((welderProfile as any).minimum_hourly_rate?.toString() || "");
      setRateNegotiable((welderProfile as any).rate_negotiable ?? true);
    }
  }, [welderProfile]);

  // Check username availability
  useEffect(() => {
    const currentUsername = (welderProfile as any)?.username;
    
    if (!debouncedUsername || debouncedUsername === currentUsername) {
      setUsernameStatus("idle");
      setUsernameError(null);
      return;
    }

    // Validate format before calling API
    if (debouncedUsername.length < 3) {
      setUsernameStatus("unavailable");
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    if (debouncedUsername.startsWith("-") || debouncedUsername.endsWith("-")) {
      setUsernameStatus("unavailable");
      setUsernameError("Username cannot start or end with a hyphen");
      return;
    }

    setUsernameStatus("checking");
    checkUsername.mutate(debouncedUsername, {
      onSuccess: (result) => {
        if (result.available) {
          setUsernameStatus("available");
          setUsernameError(null);
        } else {
          setUsernameStatus("unavailable");
          setUsernameError(result.reason || "Username not available");
        }
      },
      onError: (err) => {
        console.error("Username check error:", err);
        setUsernameStatus("unavailable");
        setUsernameError("Error checking username");
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUsername, welderProfile?.id]);

  const handleClaimUsername = async () => {
    if (usernameStatus !== "available") return;

    try {
      await claimUsername.mutateAsync(username);
      toast.success("Username claimed successfully!");
      setUsernameStatus("idle");
    } catch (error: any) {
      toast.error(error.message || "Failed to claim username");
    }
  };

  const handleSaveSettings = async () => {
    if (!welderProfile?.id) return;

    setIsSaving(true);
    try {
      const updates: any = {
        looking_for_work: lookingForWork,
        open_to_opportunities: openToOpportunities,
        profile_visibility: profileVisibility,
        professional_title: professionalTitle || null,
        tagline: tagline || null,
        show_phone: showPhone,
        show_email: showEmail,
        linkedin_url: linkedinUrl || null,
        instagram_url: instagramUrl || null,
        travel_scope: travelScope || null,
        willing_to_relocate: willingToRelocate,
        work_types: workTypes,
        minimum_hourly_rate: minimumHourlyRate ? parseFloat(minimumHourlyRate) : null,
        rate_negotiable: rateNegotiable,
      };

      const { error } = await supabase
        .from("welder_profiles")
        .update(updates)
        .eq("id", welderProfile.id);

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyProfileUrl = () => {
    const currentUsername = (welderProfile as any)?.username;
    if (!currentUsername) {
      toast.error("Claim a username first");
      return;
    }
    const url = `${window.location.origin}/w/${currentUsername}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile URL copied to clipboard!");
  };

  const handleViewProfile = () => {
    const currentUsername = (welderProfile as any)?.username;
    if (!currentUsername) {
      toast.error("Claim a username first");
      return;
    }
    window.open(`/w/${currentUsername}`, "_blank");
  };

  const profileUrl = (welderProfile as any)?.username 
    ? `${window.location.origin}/w/${(welderProfile as any).username}`
    : null;

  const workTypeOptions = [
    { id: "full_time", label: "Full-Time" },
    { id: "part_time", label: "Part-Time" },
    { id: "contract", label: "Contract" },
    { id: "travel", label: "Travel/Per Diem" },
  ];

  if (isLoadingProfile) {
    return (
      <DashboardLayout userType="welder">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Public Profile Settings</h1>
            <p className="text-muted-foreground">Manage your shareable portfolio page</p>
          </div>
          {profileUrl && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyProfileUrl}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button size="sm" onClick={handleViewProfile}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="url" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="url">
              <LinkIcon className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="visibility">
              <Eye className="w-4 h-4 mr-2" />
              Visibility
            </TabsTrigger>
            <TabsTrigger value="details">
              <User className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile URL</CardTitle>
                <CardDescription>
                  Claim a custom URL for your public portfolio page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                    weldmatch.app/w/
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="your-username"
                      className="rounded-l-none pr-10"
                      maxLength={30}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {usernameStatus === "available" && (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                      {usernameStatus === "unavailable" && (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {usernameStatus === "available" && (
                    <Button onClick={handleClaimUsername} disabled={claimUsername.isPending}>
                      {claimUsername.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Claim"
                      )}
                    </Button>
                  )}
                </div>

                {usernameError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {usernameError}
                  </p>
                )}

                {(welderProfile as any)?.username && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-2">Your current profile URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded text-sm">
                        {profileUrl}
                      </code>
                      <Button variant="ghost" size="icon" onClick={handleCopyProfileUrl}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleViewProfile}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p><strong>Username rules:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>3-30 characters</li>
                    <li>Lowercase letters, numbers, and hyphens only</li>
                    <li>Cannot start or end with a hyphen</li>
                    <li>Must be unique</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visibility Tab */}
          <TabsContent value="visibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Status</CardTitle>
                <CardDescription>
                  Let employers know your availability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Looking for Work</p>
                      <p className="text-sm text-muted-foreground">
                        Show a prominent green badge on your profile
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={lookingForWork}
                    onCheckedChange={setLookingForWork}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Open to Opportunities</p>
                      <p className="text-sm text-muted-foreground">
                        Show a subtle badge indicating you're open to new roles
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={openToOpportunities}
                    onCheckedChange={setOpenToOpportunities}
                    disabled={lookingForWork}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control who can see your profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      profileVisibility === "public" ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setProfileVisibility("public")}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-success" />
                      <span className="font-medium">Public</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Anyone with the link can view your profile
                    </p>
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      profileVisibility === "private" ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setProfileVisibility("private")}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Private</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Only you can view your profile
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-medium">Contact Information Visibility</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>Show email address</span>
                    </div>
                    <Switch checked={showEmail} onCheckedChange={setShowEmail} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>Show phone number</span>
                    </div>
                    <Switch checked={showPhone} onCheckedChange={setShowPhone} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>
                  Customize how you appear on your public profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input
                    id="title"
                    value={professionalTitle}
                    onChange={(e) => setProfessionalTitle(e.target.value)}
                    placeholder="e.g., Senior Pipeline Welder"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g., 6G certified with 12 years of pipeline experience"
                    maxLength={200}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability & Preferences</CardTitle>
                <CardDescription>
                  Help employers understand what you're looking for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Work Type Preferences</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {workTypeOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={workTypes.includes(option.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setWorkTypes([...workTypes, option.id]);
                            } else {
                              setWorkTypes(workTypes.filter((t) => t !== option.id));
                            }
                          }}
                        />
                        <Label htmlFor={option.id} className="font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travelScope">Travel Willingness</Label>
                  <Select value={travelScope} onValueChange={setTravelScope}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select travel preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local only (within 50 miles)</SelectItem>
                      <SelectItem value="regional">Regional (within state)</SelectItem>
                      <SelectItem value="nationwide">Nationwide</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Open to Relocation</p>
                    <p className="text-sm text-muted-foreground">
                      Willing to move for the right opportunity
                    </p>
                  </div>
                  <Switch checked={willingToRelocate} onCheckedChange={setWillingToRelocate} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate">Minimum Hourly Rate ($)</Label>
                    <Input
                      id="rate"
                      type="number"
                      value={minimumHourlyRate}
                      onChange={(e) => setMinimumHourlyRate(e.target.value)}
                      placeholder="e.g., 45"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-8">
                    <Label htmlFor="negotiable" className="font-normal">
                      Rate is negotiable
                    </Label>
                    <Switch
                      id="negotiable"
                      checked={rateNegotiable}
                      onCheckedChange={setRateNegotiable}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                  Add links to your professional social profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="linkedin"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics?.totalViews || 0}</p>
                      <p className="text-sm text-muted-foreground">Profile Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <Download className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics?.resumeDownloads || 0}</p>
                      <p className="text-sm text-muted-foreground">Resume Downloads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics?.contactClicks || 0}</p>
                      <p className="text-sm text-muted-foreground">Contact Clicks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Views Over Time</CardTitle>
                <CardDescription>Profile views in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.viewsByDay && Object.keys(analytics.viewsByDay).length > 0 ? (
                  <div className="h-48 flex items-end gap-1">
                    {Object.entries(analytics.viewsByDay).map(([day, count]) => {
                      const maxCount = Math.max(...Object.values(analytics.viewsByDay));
                      const height = maxCount > 0 ? ((count as number) / maxCount) * 100 : 0;
                      return (
                        <div
                          key={day}
                          className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day}: ${count} views`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No view data yet</p>
                      <p className="text-sm">Share your profile to start tracking views</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!(welderProfile as any)?.username && (
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium">Claim Your Profile URL</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        You need to claim a username before you can share your profile and track analytics.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          const tabsList = document.querySelector('[role="tablist"]');
                          const urlTab = tabsList?.querySelector('[value="url"]') as HTMLButtonElement;
                          urlTab?.click();
                        }}
                      >
                        Go to URL Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
