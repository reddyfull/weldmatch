import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Flame, MapPin, Wrench, Target, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, Link2, CheckCircle2, XCircle } from "lucide-react";
import { useCreateWelderProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ResumeUpload } from "@/components/ResumeUpload";
import { ProfileSuggestions } from "@/lib/n8n";

const WELD_PROCESSES = [
  { id: "SMAW", label: "SMAW (Stick)", description: "Shielded Metal Arc Welding" },
  { id: "GMAW", label: "GMAW (MIG)", description: "Gas Metal Arc Welding" },
  { id: "GTAW", label: "GTAW (TIG)", description: "Gas Tungsten Arc Welding" },
  { id: "FCAW", label: "FCAW", description: "Flux-Cored Arc Welding" },
  { id: "SAW", label: "SAW", description: "Submerged Arc Welding" },
];

const WELD_POSITIONS = ["1G", "2G", "3G", "4G", "5G", "6G"];

export default function WelderProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createProfile = useCreateWelderProfile();
  
  // Fetch existing profile to pre-fill form if returning to setup
  const { data: existingProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["welder_profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("welder_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1 fields - initialize from existing profile if available
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameDebounce, setUsernameDebounce] = useState<NodeJS.Timeout | null>(null);
  
  // Step 2 fields
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  
  // Step 3 fields
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryType, setSalaryType] = useState<"hourly" | "annual">("hourly");
  const [willingToTravel, setWillingToTravel] = useState(false);
  const [bio, setBio] = useState("");
  
  // Temp welder ID for resume upload (will be replaced with real ID after profile creation)
  const [tempWelderId] = useState(() => crypto.randomUUID());
  
  // Pre-fill form from existing profile
  useEffect(() => {
    if (existingProfile) {
      if (existingProfile.city) setCity(existingProfile.city);
      if (existingProfile.state) setState(existingProfile.state);
      if (existingProfile.zip_code) setZipCode(existingProfile.zip_code);
      if (existingProfile.years_experience) setYearsExperience(existingProfile.years_experience.toString());
      if (existingProfile.weld_processes?.length) setSelectedProcesses(existingProfile.weld_processes);
      if (existingProfile.weld_positions?.length) setSelectedPositions(existingProfile.weld_positions);
      if (existingProfile.desired_salary_min) setSalaryMin(existingProfile.desired_salary_min.toString());
      if (existingProfile.desired_salary_max) setSalaryMax(existingProfile.desired_salary_max.toString());
      if (existingProfile.salary_type) setSalaryType(existingProfile.salary_type);
      if (existingProfile.willing_to_travel) setWillingToTravel(existingProfile.willing_to_travel);
      if (existingProfile.bio) setBio(existingProfile.bio);
      if (existingProfile.username) {
        setUsername(existingProfile.username);
        setUsernameStatus("available");
      }
    }
  }, [existingProfile]);

  // Check username availability
  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    try {
      const { data, error } = await supabase.rpc("check_username_available", {
        p_username: value,
      });

      if (error) throw error;

      const result = data as { available: boolean; reason?: string };
      
      // If the username belongs to the current user, it's available
      if (existingProfile?.username === value) {
        setUsernameStatus("available");
      } else {
        setUsernameStatus(result.available ? "available" : "taken");
      }
    } catch (err) {
      console.error("Username check failed:", err);
      setUsernameStatus("idle");
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(sanitized);
    setUsernameStatus("idle");

    // Clear existing debounce
    if (usernameDebounce) {
      clearTimeout(usernameDebounce);
    }

    // Set new debounce for availability check
    if (sanitized.length >= 3) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
      setUsernameDebounce(timeout);
    }
  };

  // Handler for when resume suggestions are ready
  const handleResumeSuggestions = (suggestions: ProfileSuggestions) => {
    if (suggestions.city) setCity(suggestions.city);
    if (suggestions.state) setState(suggestions.state);
    if (suggestions.yearsExperience) setYearsExperience(suggestions.yearsExperience.toString());
    if (suggestions.weldProcesses?.length) {
      setSelectedProcesses(prev => {
        const merged = new Set([...prev, ...suggestions.weldProcesses]);
        return Array.from(merged);
      });
    }
    if (suggestions.weldPositions?.length) {
      setSelectedPositions(prev => {
        const merged = new Set([...prev, ...suggestions.weldPositions]);
        return Array.from(merged);
      });
    }
    
    toast({
      title: "Resume Data Applied",
      description: "We've pre-filled your profile with information from your resume. Review and adjust as needed.",
    });
  };

  const validateStep1 = () => {
    if (!city || !state) {
      setError("Please enter your city and state");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedProcesses.length === 0) {
      setError("Please select at least one weld process");
      return false;
    }
    if (selectedPositions.length === 0) {
      setError("Please select at least one weld position");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const toggleProcess = (processId: string) => {
    setSelectedProcesses(prev => 
      prev.includes(processId) 
        ? prev.filter(p => p !== processId)
        : [...prev, processId]
    );
  };

  const togglePosition = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    
    try {
      await createProfile.mutateAsync({
        city,
        state,
        zip_code: zipCode,
        years_experience: yearsExperience ? parseInt(yearsExperience) : 0,
        weld_processes: selectedProcesses,
        weld_positions: selectedPositions,
        desired_salary_min: salaryMin ? parseFloat(salaryMin) : null,
        desired_salary_max: salaryMax ? parseFloat(salaryMax) : null,
        salary_type: salaryType,
        willing_to_travel: willingToTravel,
        bio: bio || null,
        is_available: true,
        profile_setup_complete: true,
        username: username || null,
      });

      // Refetch to ensure fresh data before navigating (prevents race condition)
      await queryClient.refetchQueries({ queryKey: ["welder_profile", user?.id] });

      toast({
        title: "Profile Created!",
        description: "Your welder profile is now live. Start browsing jobs!",
      });
      navigate("/welder/dashboard");
    } catch (err) {
      console.error("Create welder profile failed", err);
      const msg =
        typeof err === "object" && err && "message" in err
          ? String((err as any).message)
          : "Failed to create profile. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary-dark flex items-center justify-center p-4 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <Card className="w-full max-w-lg relative z-10 shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center shadow-lg">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">
              Weld<span className="text-accent">Match</span>
            </span>
          </div>
          <div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Help employers find you by adding your skills and preferences
            </CardDescription>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step ? "bg-success text-white" :
                  s === step ? "bg-accent text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-8 h-1 mx-1 rounded ${
                    s < step ? "bg-success" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            {step === 1 && <><MapPin className="w-4 h-4" /> Location & Experience</>}
            {step === 2 && <><Wrench className="w-4 h-4" /> Skills & Certifications</>}
            {step === 3 && <><Target className="w-4 h-4" /> Preferences</>}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Location & Experience */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Resume Upload Section */}
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <ResumeUpload 
                  welderId={tempWelderId}
                  onSuggestionsReady={handleResumeSuggestions}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Houston"
                    className="h-12"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    placeholder="TX"
                    className="h-12"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="77001"
                  className="h-12"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years of Welding Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="5"
                  className="h-12"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
              </div>

              {/* Public Profile URL */}
              <div className="space-y-2">
                <Label htmlFor="username">Your Public Profile URL</Label>
                <p className="text-xs text-muted-foreground">
                  Claim a unique URL for your public portfolio (optional)
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center h-12 px-3 bg-muted rounded-l-md border border-r-0 text-sm text-muted-foreground">
                    <Link2 className="w-4 h-4 mr-1" />
                    weldmatch.com/w/
                  </div>
                  <div className="relative flex-1">
                    <Input
                      id="username"
                      placeholder="yourname"
                      className="h-12 rounded-l-none pr-10"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {usernameStatus === "available" && (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                      {usernameStatus === "taken" && (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </div>
                </div>
                {usernameStatus === "available" && username.length >= 3 && (
                  <p className="text-xs text-success">Username is available!</p>
                )}
                {usernameStatus === "taken" && (
                  <p className="text-xs text-destructive">This username is already taken</p>
                )}
                {username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-muted-foreground">Username must be at least 3 characters</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Weld Processes *</Label>
                <p className="text-sm text-muted-foreground">Select all processes you're proficient in</p>
                <div className="space-y-2">
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
                <p className="text-sm text-muted-foreground">Select all positions you can weld</p>
                <div className="grid grid-cols-3 gap-2">
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
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Desired Pay Range</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="h-12"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                    />
                  </div>
                  <span className="text-muted-foreground">to</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Max"
                      className="h-12"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={salaryType === "hourly" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalaryType("hourly")}
                  >
                    Per Hour
                  </Button>
                  <Button
                    type="button"
                    variant={salaryType === "annual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSalaryType("annual")}
                  >
                    Per Year
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label htmlFor="travel">Willing to Travel</Label>
                  <p className="text-sm text-muted-foreground">Open to jobs that require travel</p>
                </div>
                <Switch
                  id="travel"
                  checked={willingToTravel}
                  onCheckedChange={setWillingToTravel}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell employers about your experience, specialties, and what you're looking for..."
                  className="min-h-[100px]"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12"
                onClick={handleBack}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                variant="hero"
                className="flex-1 h-12"
                onClick={handleNext}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="hero"
                className="flex-1 h-12"
                onClick={handleSubmit}
                disabled={createProfile.isPending}
              >
                {createProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
