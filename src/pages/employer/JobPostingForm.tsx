import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Award, 
  Wrench, 
  Save, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Calendar,
  Gift,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { WELD_PROCESSES, WELD_POSITIONS } from "@/constants/welderOptions";
import { generateJobDescription, GeneratedJobDescription } from "@/lib/n8n";
import { AIJobDescriptionModal } from "@/components/employer/AIJobDescriptionModal";

const CERT_OPTIONS = [
  { id: "AWS D1.1", label: "AWS D1.1 - Structural Steel" },
  { id: "AWS D1.5", label: "AWS D1.5 - Bridge Welding" },
  { id: "ASME IX", label: "ASME Section IX" },
  { id: "API 1104", label: "API 1104 - Pipeline" },
  { id: "API 650", label: "API 650 - Storage Tanks" },
  { id: "CWI", label: "CWI - Certified Welding Inspector" },
  { id: "NCCER", label: "NCCER Certification" },
];

const BENEFIT_OPTIONS = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "401(k)",
  "Paid Time Off",
  "Per Diem",
  "Travel Allowance",
  "Tool Allowance",
  "Overtime Available",
  "Signing Bonus",
];

const JOB_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "per_diem", label: "Per Diem" },
] as const;

const PAY_TYPES = [
  { value: "hourly", label: "Per Hour" },
  { value: "salary", label: "Salary" },
  { value: "doe", label: "DOE (Depends on Experience)" },
] as const;

// Validation schema
const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip_code: z.string().optional(),
  job_type: z.enum(["full_time", "part_time", "contract", "per_diem"]),
  pay_type: z.enum(["hourly", "salary", "doe"]).optional(),
  pay_min: z.number().min(0).optional(),
  pay_max: z.number().min(0).optional(),
  experience_min: z.number().min(0).max(50).optional(),
  positions_needed: z.number().min(1, "At least 1 position required").max(100, "Maximum 100 positions"),
  required_processes: z.array(z.string()),
  required_positions: z.array(z.string()),
  required_certs: z.array(z.string()),
  benefits: z.array(z.string()),
  start_date: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function JobPostingForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: employerProfile, isLoading: profileLoading } = useEmployerProfile();
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // AI Generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<GeneratedJobDescription | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [jobType, setJobType] = useState<"full_time" | "part_time" | "contract" | "per_diem">("full_time");
  const [payType, setPayType] = useState<"hourly" | "salary" | "doe">("hourly");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [experienceMin, setExperienceMin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [positionsNeeded, setPositionsNeeded] = useState("1");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);

  const toggleArrayItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setArr(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // AI Job Description Generation
  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      toast({
        title: "Job Title Required",
        description: "Please enter a job title before generating a description.",
        variant: "destructive",
      });
      return;
    }

    setShowAIModal(true);
    setAiGenerating(true);
    setAiError(null);
    setGeneratedDescription(null);

    try {
      const jobTypeLabel = JOB_TYPES.find(t => t.value === jobType)?.label || "Full Time";
      const location = city && state ? `${city}, ${state}` : city || state || undefined;

      const response = await generateJobDescription({
        jobTitle: title,
        location,
        companyName: employerProfile?.company_name,
        salaryMin: payMin ? parseFloat(payMin) : undefined,
        salaryMax: payMax ? parseFloat(payMax) : undefined,
        salaryPeriod: payType === "hourly" ? "hourly" : payType === "salary" ? "yearly" : undefined,
        weldingProcesses: selectedProcesses.map(p => {
          const process = WELD_PROCESSES.find(wp => wp.id === p);
          return process?.label || p;
        }),
        certifications: selectedCerts,
        yearsExperience: experienceMin ? parseInt(experienceMin) : undefined,
        employmentType: jobTypeLabel,
        benefits: selectedBenefits,
        tone: "professional",
      });

      if (response.success && response.generated) {
        setGeneratedDescription(response.generated);
      } else {
        throw new Error(response.error || "Failed to generate description");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate job description");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseGeneratedDescription = () => {
    if (generatedDescription) {
      setDescription(generatedDescription.fullDescription);
      setShowAIModal(false);
      toast({
        title: "Description Applied",
        description: "AI-generated description has been added to your job posting.",
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      const formData: JobFormData = {
        title,
        description: description || undefined,
        city,
        state,
        zip_code: zipCode || undefined,
        job_type: jobType,
        pay_type: payType,
        pay_min: payMin ? parseFloat(payMin) : undefined,
        pay_max: payMax ? parseFloat(payMax) : undefined,
        experience_min: experienceMin ? parseInt(experienceMin) : undefined,
        positions_needed: positionsNeeded ? parseInt(positionsNeeded) : 1,
        required_processes: selectedProcesses,
        required_positions: selectedPositions,
        required_certs: selectedCerts,
        benefits: selectedBenefits,
        start_date: startDate || undefined,
      };
      
      jobSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (status: "draft" | "active") => {
    if (!validateForm()) return;
    if (!employerProfile) {
      toast({
        title: "Error",
        description: "Employer profile not found",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("jobs").insert({
        employer_id: employerProfile.id,
        title: title.trim(),
        description: description.trim() || null,
        city: city.trim(),
        state: state.trim(),
        zip_code: zipCode.trim() || null,
        job_type: jobType,
        pay_type: payType,
        pay_min: payMin ? parseFloat(payMin) : null,
        pay_max: payMax ? parseFloat(payMax) : null,
        experience_min: experienceMin ? parseInt(experienceMin) : 0,
        positions_needed: positionsNeeded ? parseInt(positionsNeeded) : 1,
        required_processes: selectedProcesses,
        required_positions: selectedPositions,
        required_certs: selectedCerts,
        benefits: selectedBenefits,
        start_date: startDate || null,
        status,
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["employer_jobs"] });

      toast({
        title: status === "active" ? "Job Posted!" : "Draft Saved",
        description: status === "active" 
          ? "Your job is now live and visible to welders."
          : "Your job has been saved as a draft.",
      });

      navigate("/employer/dashboard");
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <DashboardLayout userType="employer">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employerProfile) {
    return (
      <DashboardLayout userType="employer">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Please complete your employer profile first.</p>
              <Button onClick={() => navigate("/employer/profile/setup")}>
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="employer">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employer/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Post a New Job</h1>
            <p className="text-muted-foreground">Find qualified welders for your project</p>
          </div>
        </div>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent" />
              <CardTitle>Job Details</CardTitle>
            </div>
            <CardDescription>Basic information about the position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Pipe Welder, Structural Welder, TIG Welder"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Job Description</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateWithAI}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder="Describe the role, responsibilities, and project details... or use AI to generate"
                className="min-h-[150px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select value={jobType} onValueChange={(v) => setJobType(v as typeof jobType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionsNeeded">Positions Needed *</Label>
                <Input
                  id="positionsNeeded"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="1"
                  value={positionsNeeded}
                  onChange={(e) => setPositionsNeeded(e.target.value)}
                  className={errors.positions_needed ? "border-destructive" : ""}
                />
                {errors.positions_needed && <p className="text-sm text-destructive">{errors.positions_needed}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              <CardTitle>Location</CardTitle>
            </div>
            <CardDescription>Where is this job located?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Houston"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={errors.city ? "border-destructive" : ""}
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="TX"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={errors.state ? "border-destructive" : ""}
                />
                {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="77001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              <CardTitle>Compensation</CardTitle>
            </div>
            <CardDescription>Pay range and type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pay Type</Label>
              <div className="flex gap-2">
                {PAY_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={payType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPayType(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {payType !== "doe" && (
              <div className="flex items-center gap-4 max-w-md">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="payMin">Minimum</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="payMin"
                      type="number"
                      placeholder="0"
                      className="pl-7"
                      value={payMin}
                      onChange={(e) => setPayMin(e.target.value)}
                    />
                  </div>
                </div>
                <span className="text-muted-foreground pt-6">to</span>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="payMax">Maximum</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="payMax"
                      type="number"
                      placeholder="0"
                      className="pl-7"
                      value={payMax}
                      onChange={(e) => setPayMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 max-w-xs">
              <Label htmlFor="experienceMin">Minimum Years Experience</Label>
              <Input
                id="experienceMin"
                type="number"
                min="0"
                max="50"
                placeholder="0"
                value={experienceMin}
                onChange={(e) => setExperienceMin(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-accent" />
              <CardTitle>Requirements</CardTitle>
            </div>
            <CardDescription>Required welding skills and positions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Required Weld Processes</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {WELD_PROCESSES.map((process) => (
                  <div
                    key={process.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProcesses.includes(process.id)
                        ? "bg-accent/10 border-accent"
                        : "bg-card border-border hover:border-accent/50"
                    }`}
                    onClick={() => toggleArrayItem(selectedProcesses, setSelectedProcesses, process.id)}
                  >
                    <Checkbox
                      checked={selectedProcesses.includes(process.id)}
                      onCheckedChange={() => toggleArrayItem(selectedProcesses, setSelectedProcesses, process.id)}
                      className="mr-3"
                    />
                    <div>
                      <span className="font-medium">{process.label}</span>
                      <p className="text-xs text-muted-foreground">{process.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Required Weld Positions</Label>
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
                    onClick={() => toggleArrayItem(selectedPositions, setSelectedPositions, position)}
                  >
                    {position}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <CardTitle>Required Certifications</CardTitle>
            </div>
            <CardDescription>Select certifications candidates must have</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map((cert) => (
                <Badge
                  key={cert.id}
                  variant={selectedCerts.includes(cert.id) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedCerts.includes(cert.id) 
                      ? "bg-accent hover:bg-accent/90" 
                      : "hover:bg-accent/10"
                  }`}
                  onClick={() => toggleArrayItem(selectedCerts, setSelectedCerts, cert.id)}
                >
                  {cert.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-accent" />
              <CardTitle>Benefits</CardTitle>
            </div>
            <CardDescription>What benefits do you offer?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {BENEFIT_OPTIONS.map((benefit) => (
                <Badge
                  key={benefit}
                  variant={selectedBenefits.includes(benefit) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedBenefits.includes(benefit) 
                      ? "bg-success hover:bg-success/90" 
                      : "hover:bg-success/10"
                  }`}
                  onClick={() => toggleArrayItem(selectedBenefits, setSelectedBenefits, benefit)}
                >
                  {benefit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSubmit("draft")}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save as Draft
          </Button>
          <Button
            variant="hero"
            size="lg"
            onClick={() => handleSubmit("active")}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Briefcase className="w-4 h-4 mr-2" />}
            Post Job
          </Button>
        </div>
      </div>

      {/* AI Job Description Modal */}
      <AIJobDescriptionModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        generated={generatedDescription}
        isLoading={aiGenerating}
        error={aiError}
        onUseDescription={handleUseGeneratedDescription}
      />
    </DashboardLayout>
  );
}
