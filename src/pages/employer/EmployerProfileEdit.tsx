import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building2, MapPin, Globe, Users, Save, ArrowLeft, Loader2, AlertCircle, 
  CheckCircle2, Upload, Camera, X
} from "lucide-react";
import { useEmployerProfile, useUpdateEmployerProfile, useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "200+", label: "200+ employees" },
];

const INDUSTRIES = [
  "Oil & Gas",
  "Construction",
  "Manufacturing",
  "Shipbuilding",
  "Aerospace",
  "Automotive",
  "Pipeline",
  "Structural Steel",
  "Power Generation",
  "Other",
];

export default function EmployerProfileEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: employerProfile, isLoading: employerLoading } = useEmployerProfile();
  const updateProfile = useUpdateEmployerProfile();

  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState<string>("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Populate form when data loads
  useEffect(() => {
    if (employerProfile) {
      setCompanyName(employerProfile.company_name || "");
      setPhone(employerProfile.phone || "");
      setAddressLine1(employerProfile.address_line1 || "");
      setCity(employerProfile.city || "");
      setState(employerProfile.state || "");
      setZipCode(employerProfile.zip_code || "");
      setIndustry(employerProfile.industry || "");
      setCompanySize(employerProfile.company_size || "");
      setWebsite(employerProfile.website || "");
      setDescription(employerProfile.description || "");
      setLogoUrl(employerProfile.logo_url || null);
    }
  }, [employerProfile]);

  const handleFieldChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setHasChanges(true);
    setter(value);
  };

  // Calculate profile completion
  const calculateCompletion = () => {
    let completed = 0;
    const total = 8;

    if (companyName) completed++;
    if (city && state) completed++;
    if (industry) completed++;
    if (companySize) completed++;
    if (phone) completed++;
    if (website) completed++;
    if (description) completed++;
    if (logoUrl) completed++;

    return Math.round((completed / total) * 100);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingLogo(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("company-logos").remove([oldPath]);
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      setLogoUrl(urlData.publicUrl);
      setHasChanges(true);

      toast({
        title: "Logo uploaded!",
        description: "Don't forget to save your changes.",
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl || !user?.id) return;

    try {
      const path = `${user.id}/logo.${logoUrl.split(".").pop()}`;
      await supabase.storage.from("company-logos").remove([path]);
      setLogoUrl(null);
      setHasChanges(true);
    } catch (err) {
      console.error("Remove logo error:", err);
    }
  };

  const handleSave = async () => {
    setError(null);

    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        company_name: companyName,
        phone: phone || null,
        address_line1: addressLine1 || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        industry: industry || null,
        company_size: companySize as "1-10" | "11-50" | "51-200" | "200+" | null,
        website: website || null,
        description: description || null,
        logo_url: logoUrl,
      });

      await queryClient.invalidateQueries({ queryKey: ["employer_profile", user?.id] });

      toast({
        title: "Profile Updated!",
        description: "Your company profile has been saved.",
      });
      setHasChanges(false);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    }
  };

  const isLoading = profileLoading || employerLoading;
  const completion = calculateCompletion();

  if (isLoading) {
    return (
      <DashboardLayout userType="employer">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employerProfile) {
    return (
      <DashboardLayout userType="employer">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No profile found. Please complete your profile setup first.</p>
              <Button onClick={() => navigate("/employer/profile/setup")}>
                Complete Setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="employer">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/employer/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Company Profile</h1>
              <p className="text-muted-foreground">Update your company information</p>
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
                  <Building2 className="w-5 h-5 text-accent" />
                )}
                <span className="font-medium">Profile Completion</span>
              </div>
              <span className="text-2xl font-bold text-accent">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            {completion < 100 && (
              <p className="text-sm text-muted-foreground mt-2">
                Complete your profile to attract more qualified welders
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

        {/* Logo Upload Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-accent" />
              <CardTitle>Company Logo</CardTitle>
            </div>
            <CardDescription>Upload your company logo to stand out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-border">
                  <AvatarImage src={logoUrl || undefined} alt={companyName} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {companyName.slice(0, 2).toUpperCase() || "CO"}
                  </AvatarFallback>
                </Avatar>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 5MB. Recommended: 400x400px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Info Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>Basic information about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Welding Co."
                  value={companyName}
                  onChange={(e) => handleFieldChange(setCompanyName, e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => handleFieldChange(setPhone, e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={industry}
                  onValueChange={(value) => handleFieldChange(setIndustry, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select
                  value={companySize}
                  onValueChange={(value) => handleFieldChange(setCompanySize, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://www.yourcompany.com"
                  className="pl-10"
                  value={website}
                  onChange={(e) => handleFieldChange(setWebsite, e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <CardTitle>Location</CardTitle>
            </div>
            <CardDescription>Where is your company headquartered?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Street Address</Label>
              <Input
                id="addressLine1"
                placeholder="123 Industrial Blvd"
                value={addressLine1}
                onChange={(e) => handleFieldChange(setAddressLine1, e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Houston"
                  value={city}
                  onChange={(e) => handleFieldChange(setCity, e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
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
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <CardTitle>About Your Company</CardTitle>
            </div>
            <CardDescription>Tell welders what makes your company great</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your company, culture, projects, and what makes you a great employer..."
                className="min-h-[150px]"
                value={description}
                onChange={(e) => handleFieldChange(setDescription, e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 characters
              </p>
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
