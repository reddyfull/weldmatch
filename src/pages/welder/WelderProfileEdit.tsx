import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Flame, MapPin, Wrench, Target, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Award 
} from "lucide-react";
import { useWelderProfile, useUpdateWelderProfile, useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { WELD_PROCESSES, WELD_POSITIONS } from "@/constants/welderOptions";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { CertificationUpload } from "@/components/CertificationUpload";
import { CertificationsList } from "@/components/CertificationsList";
import { SensitiveDataSection } from "@/components/welder/SensitiveDataSection";

export default function WelderProfileEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();
  const updateProfile = useUpdateWelderProfile();

  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form fields
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryType, setSalaryType] = useState<"hourly" | "annual">("hourly");
  const [willingToTravel, setWillingToTravel] = useState(false);
  const [bio, setBio] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // Populate form when data loads
  useEffect(() => {
    if (welderProfile) {
      setCity(welderProfile.city || "");
      setState(welderProfile.state || "");
      setZipCode(welderProfile.zip_code || "");
      setYearsExperience(welderProfile.years_experience?.toString() || "");
      setSelectedProcesses(welderProfile.weld_processes || []);
      setSelectedPositions(welderProfile.weld_positions || []);
      setSalaryMin(welderProfile.desired_salary_min?.toString() || "");
      setSalaryMax(welderProfile.desired_salary_max?.toString() || "");
      setSalaryType(welderProfile.salary_type || "hourly");
      setWillingToTravel(welderProfile.willing_to_travel || false);
      setBio(welderProfile.bio || "");
      setIsAvailable(welderProfile.is_available ?? true);
    }
  }, [welderProfile]);

  const toggleProcess = (processId: string) => {
    setHasChanges(true);
    setSelectedProcesses(prev =>
      prev.includes(processId)
        ? prev.filter(p => p !== processId)
        : [...prev, processId]
    );
  };

  const togglePosition = (position: string) => {
    setHasChanges(true);
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const handleFieldChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setHasChanges(true);
    setter(value);
  };

  // Calculate profile completion
  const calculateCompletion = () => {
    let completed = 0;
    const total = 7;

    if (city && state) completed++;
    if (selectedProcesses.length > 0) completed++;
    if (selectedPositions.length > 0) completed++;
    if (yearsExperience) completed++;
    if (salaryMin || salaryMax) completed++;
    if (bio) completed++;
    if (zipCode) completed++;

    return Math.round((completed / total) * 100);
  };

  const handleSave = async () => {
    setError(null);

    if (!city || !state) {
      setError("City and State are required");
      return;
    }

    if (selectedProcesses.length === 0) {
      setError("Please select at least one weld process");
      return;
    }

    if (selectedPositions.length === 0) {
      setError("Please select at least one weld position");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        city,
        state,
        zip_code: zipCode || null,
        years_experience: yearsExperience ? parseInt(yearsExperience) : 0,
        weld_processes: selectedProcesses,
        weld_positions: selectedPositions,
        desired_salary_min: salaryMin ? parseFloat(salaryMin) : null,
        desired_salary_max: salaryMax ? parseFloat(salaryMax) : null,
        salary_type: salaryType,
        willing_to_travel: willingToTravel,
        bio: bio || null,
        is_available: isAvailable,
        profile_completion: calculateCompletion(),
      });

      await queryClient.invalidateQueries({ queryKey: ["welder_profile", user?.id] });

      toast({
        title: "Profile Updated!",
        description: "Your changes have been saved successfully.",
      });
      setHasChanges(false);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    }
  };

  const isLoading = profileLoading || welderLoading;
  const completion = calculateCompletion();

  if (isLoading) {
    return (
      <DashboardLayout userType="welder">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!welderProfile) {
    return (
      <DashboardLayout userType="welder">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No profile found. Please complete your profile setup first.</p>
              <Button onClick={() => navigate("/welder/profile/setup")}>
                Complete Setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/welder/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
              <p className="text-muted-foreground">Update your skills and preferences</p>
            </div>
          </div>
          <Button
            variant="hero"
            onClick={handleSave}
            disabled={updateProfile.isPending || !hasChanges}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Profile Completion Card */}
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {completion === 100 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Flame className="w-5 h-5 text-accent" />
                )}
                <span className="font-medium">Profile Completion</span>
              </div>
              <span className="text-2xl font-bold text-accent">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            {completion < 100 && (
              <p className="text-sm text-muted-foreground mt-2">
                Complete your profile to improve visibility to employers
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Location & Experience Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <CardTitle>Location & Experience</CardTitle>
            </div>
            <CardDescription>Where are you based and how experienced are you?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Houston"
                  value={city}
                  onChange={(e) => handleFieldChange(setCity, e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  value={state}
                  onChange={(e) => handleFieldChange(setState, e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="77001"
                  value={zipCode}
                  onChange={(e) => handleFieldChange(setZipCode, e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                max="50"
                placeholder="5"
                className="max-w-xs"
                value={yearsExperience}
                onChange={(e) => handleFieldChange(setYearsExperience, e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-accent" />
              <CardTitle>Skills</CardTitle>
            </div>
            <CardDescription>What welding processes and positions can you work?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Weld Processes *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {WELD_PROCESSES.map((process) => (
                  <div
                    key={process.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProcesses.includes(process.id)
                        ? "bg-accent/10 border-accent"
                        : "bg-card border-border hover:border-accent/50"
                    }`}
                    onClick={() => toggleProcess(process.id)}
                  >
                    <Checkbox
                      id={process.id}
                      checked={selectedProcesses.includes(process.id)}
                      onCheckedChange={() => toggleProcess(process.id)}
                      className="mr-3"
                    />
                    <div>
                      <Label htmlFor={process.id} className="cursor-pointer font-medium">
                        {process.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{process.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Weld Positions *</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {WELD_POSITIONS.map((position) => (
                  <button
                    key={position}
                    type="button"
                    className={`p-3 rounded-lg border text-center font-medium transition-colors ${
                      selectedPositions.includes(position)
                        ? "bg-accent text-white border-accent"
                        : "bg-card border-border hover:border-accent/50"
                    }`}
                    onClick={() => togglePosition(position)}
                  >
                    {position}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <CardTitle>Certifications</CardTitle>
            </div>
            <CardDescription>Upload and manage your welding certifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CertificationsList 
              welderId={welderProfile.id} 
              onCertificationsChange={() => {
                // Could refresh profile completion here if needed
              }}
            />
            <div className="border-t pt-6">
              <CertificationUpload 
                welderId={welderProfile.id}
                onSuccess={() => {
                  toast({
                    title: "Certification Added",
                    description: "Your certification has been uploaded and is being verified.",
                  });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>What are you looking for in your next role?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Desired Pay Range</Label>
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  type="number"
                  placeholder="Min"
                  value={salaryMin}
                  onChange={(e) => handleFieldChange(setSalaryMin, e.target.value)}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={salaryMax}
                  onChange={(e) => handleFieldChange(setSalaryMax, e.target.value)}
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={salaryType === "hourly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFieldChange(setSalaryType, "hourly")}
                >
                  Per Hour
                </Button>
                <Button
                  type="button"
                  variant={salaryType === "annual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFieldChange(setSalaryType, "annual")}
                >
                  Per Year
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border max-w-md">
              <div>
                <Label htmlFor="travel">Willing to Travel</Label>
                <p className="text-sm text-muted-foreground">Open to jobs that require travel</p>
              </div>
              <Switch
                id="travel"
                checked={willingToTravel}
                onCheckedChange={(checked) => handleFieldChange(setWillingToTravel, checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border max-w-md">
              <div>
                <Label htmlFor="available">Available for Work</Label>
                <p className="text-sm text-muted-foreground">Show profile to employers</p>
              </div>
              <Switch
                id="available"
                checked={isAvailable}
                onCheckedChange={(checked) => handleFieldChange(setIsAvailable, checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                placeholder="Tell employers about your experience, specialties, and what you're looking for..."
                className="min-h-[120px]"
                value={bio}
                onChange={(e) => handleFieldChange(setBio, e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Save Button */}
        <div className="flex justify-end pb-8">
          <Button
            variant="hero"
            size="lg"
            onClick={handleSave}
            disabled={updateProfile.isPending || !hasChanges}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
