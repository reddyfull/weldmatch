import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Award,
  Save,
  RefreshCw,
  FileDown,
  File
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile } from "@/hooks/useUserProfile";
import { useGeneratedResume, useSaveResume } from "@/hooks/useGeneratedResume";
import { generateResume, WorkExperience, ResumeResponse } from "@/lib/ai-phase2";
import { exportResumePDF, exportResumeWord, exportResumeTxt } from "@/lib/resumeExport";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { WELD_PROCESSES_FULL, WELD_POSITIONS_FULL, CERTIFICATIONS_LIST, INDUSTRY_PREFERENCES } from "@/constants/aiFeatureOptions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  yearsExperience: number;
  currentTitle: string;
  processes: string[];
  certifications: string[];
  positions: string[];
  industries: string[];
  workHistory: WorkExperience[];
  keyAchievements: string[];
  skills: string[];
  formatStyle: 'professional' | 'modern' | 'technical' | 'simple';
  targetJob: string;
  targetIndustry: string;
}

const initialWorkExperience: WorkExperience = {
  company: "",
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  responsibilities: [""],
  achievements: [],
};

export default function ResumeBuilder() {
  const { user } = useAuth();
  const { data: welderProfile } = useWelderProfile();
  const { data: savedResume, isLoading: isLoadingSaved } = useGeneratedResume();
  const saveResume = useSaveResume();
  
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<ResumeResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: user?.email || "",
    phone: "",
    location: welderProfile?.city && welderProfile?.state 
      ? `${welderProfile.city}, ${welderProfile.state}` 
      : "",
    linkedIn: "",
    yearsExperience: welderProfile?.years_experience || 0,
    currentTitle: "Welder",
    processes: welderProfile?.weld_processes || [],
    certifications: [],
    positions: welderProfile?.weld_positions || [],
    industries: [],
    workHistory: [{ ...initialWorkExperience }],
    keyAchievements: [],
    skills: [],
    formatStyle: 'professional',
    targetJob: "",
    targetIndustry: "",
  });

  // Load saved resume on mount
  useEffect(() => {
    if (savedResume && !hasLoadedSaved && !generatedResume) {
      setGeneratedResume(savedResume.resume_data);
      if (savedResume.form_data) {
        setFormData(savedResume.form_data as FormData);
      }
      setHasLoadedSaved(true);
    }
  }, [savedResume, hasLoadedSaved, generatedResume]);

  const totalSteps = 4;

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof FormData, item: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateFormData(field, updated);
  };

  const addWorkExperience = () => {
    updateFormData('workHistory', [...formData.workHistory, { ...initialWorkExperience }]);
  };

  const removeWorkExperience = (index: number) => {
    if (formData.workHistory.length > 1) {
      updateFormData('workHistory', formData.workHistory.filter((_, i) => i !== index));
    }
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...formData.workHistory];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData('workHistory', updated);
  };

  const addResponsibility = (expIndex: number) => {
    const updated = [...formData.workHistory];
    updated[expIndex].responsibilities.push("");
    updateFormData('workHistory', updated);
  };

  const updateResponsibility = (expIndex: number, respIndex: number, value: string) => {
    const updated = [...formData.workHistory];
    updated[expIndex].responsibilities[respIndex] = value;
    updateFormData('workHistory', updated);
  };

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    const updated = [...formData.workHistory];
    if (updated[expIndex].responsibilities.length > 1) {
      updated[expIndex].responsibilities = updated[expIndex].responsibilities.filter((_, i) => i !== respIndex);
      updateFormData('workHistory', updated);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await generateResume({
        ...formData,
        welderId: welderProfile?.id,
      });

      if (response.success) {
        // Transform n8n response to expected format if needed
        const transformedResponse = transformN8nResponse(response, formData);
        setGeneratedResume(transformedResponse);
        toast({
          title: "Resume Generated!",
          description: transformedResponse.atsScore ? `ATS Score: ${transformedResponse.atsScore}%` : "Your resume is ready!",
        });
      } else {
        throw new Error("Failed to generate resume");
      }
    } catch (error) {
      console.error("Resume generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Transform n8n response to match expected ResumeResponse format
  const transformN8nResponse = (response: any, formData: FormData): ResumeResponse => {
    const resume = response.resume || {};
    const profile = response.profile || {};
    
    // Build formatted text from components if not provided
    let formattedText = resume.formattedText || "";
    
    if (!formattedText) {
      const sections: string[] = [];
      
      // Header
      const name = profile.name || formData.name || "";
      const email = profile.email || formData.email || "";
      const phone = profile.phone || formData.phone || "";
      const location = profile.location || formData.location || "";
      
      sections.push(name.toUpperCase());
      sections.push([email, phone, location].filter(Boolean).join(" | "));
      sections.push("");
      
      // Professional Summary
      if (resume.professionalSummary || profile.summary) {
        sections.push("PROFESSIONAL SUMMARY");
        sections.push("-".repeat(50));
        sections.push(resume.professionalSummary || profile.summary || "");
        sections.push("");
      }
      
      // Core Competencies
      if (resume.coreCompetencies?.length > 0) {
        sections.push("CORE COMPETENCIES");
        sections.push("-".repeat(50));
        sections.push(resume.coreCompetencies.join(" • "));
        sections.push("");
      }
      
      // Certifications
      if (resume.certifications?.length > 0) {
        sections.push("CERTIFICATIONS");
        sections.push("-".repeat(50));
        resume.certifications.forEach((cert: any) => {
          if (typeof cert === "string") {
            sections.push(`• ${cert}`);
          } else {
            sections.push(`• ${cert.title || cert.name}${cert.issuer ? ` - ${cert.issuer}` : ""}${cert.positions ? ` (${cert.positions})` : ""}`);
          }
        });
        sections.push("");
      }
      
      // Technical Skills
      if (resume.technicalSkills && Object.keys(resume.technicalSkills).length > 0) {
        sections.push("TECHNICAL SKILLS");
        sections.push("-".repeat(50));
        Object.entries(resume.technicalSkills).forEach(([key, value]) => {
          if (value) {
            sections.push(`${key}: ${Array.isArray(value) ? (value as string[]).join(", ") : value}`);
          }
        });
        sections.push("");
      } else if (profile.processes?.length > 0 || profile.positions?.length > 0) {
        sections.push("TECHNICAL SKILLS");
        sections.push("-".repeat(50));
        if (profile.processes?.length > 0) {
          sections.push(`Welding Processes: ${profile.processes.join(", ")}`);
        }
        if (profile.positions?.length > 0) {
          sections.push(`Positions: ${profile.positions.join(", ")}`);
        }
        sections.push("");
      }
      
      // Work Experience
      const workHistory = resume.workExperience?.length > 0 ? resume.workExperience : profile.workHistory;
      if (workHistory?.length > 0) {
        sections.push("PROFESSIONAL EXPERIENCE");
        sections.push("-".repeat(50));
        workHistory.forEach((job: any) => {
          if (job.company || job.title) {
            sections.push(`${job.title || job.position || "Position"} | ${job.company || "Company"}`);
            if (job.location) sections.push(job.location);
            if (job.startDate || job.endDate) {
              sections.push(`${job.startDate || ""} - ${job.current ? "Present" : (job.endDate || "")}`);
            }
            if (job.responsibilities?.length > 0) {
              job.responsibilities.forEach((resp: string) => {
                if (resp) sections.push(`  • ${resp}`);
              });
            }
            sections.push("");
          }
        });
      }
      
      // Education
      if (resume.education?.length > 0) {
        sections.push("EDUCATION");
        sections.push("-".repeat(50));
        resume.education.forEach((edu: any) => {
          sections.push(`${edu.degree || edu.program} - ${edu.institution || edu.school}`);
          if (edu.location) sections.push(edu.location);
          if (edu.graduation || edu.year) sections.push(edu.graduation || edu.year);
          sections.push("");
        });
      }
      
      formattedText = sections.join("\n");
    }
    
    // Return normalized response
    return {
      success: true,
      resume: {
        header: {
          name: profile.name || formData.name,
          email: profile.email || formData.email,
          phone: profile.phone || formData.phone,
          location: profile.location || formData.location,
          linkedIn: formData.linkedIn,
        },
        summary: resume.professionalSummary || profile.summary || "",
        certifications: {
          title: "Certifications",
          items: (resume.certifications || []).map((c: any) => 
            typeof c === "string" ? c : `${c.title || c.name}${c.issuer ? ` - ${c.issuer}` : ""}`
          ),
        },
        experience: (resume.workExperience || profile.workHistory || []).map((job: any) => ({
          company: job.company || "",
          title: job.title || job.position || "",
          location: job.location || "",
          dates: `${job.startDate || ""} - ${job.current ? "Present" : (job.endDate || "")}`,
          bullets: job.responsibilities || [],
        })),
        skills: {
          processes: profile.processes || formData.processes || [],
          positions: profile.positions || formData.positions || [],
          additional: profile.skills || [],
        },
        education: (resume.education || []).map((edu: any) => ({
          school: edu.institution || edu.school || "",
          degree: edu.degree || edu.program || "",
          year: edu.graduation || edu.year || "",
        })),
        formattedText,
        jsonStructure: resume,
      },
      atsScore: response.atsScore || 75, // Default score if not provided
      suggestions: response.suggestions || [],
      generatedAt: response.generatedAt || new Date().toISOString(),
    };
  };

  const copyToClipboard = async () => {
    if (generatedResume?.resume.formattedText) {
      await navigator.clipboard.writeText(generatedResume.resume.formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard!" });
    }
  };

  const handleSaveResume = async () => {
    if (!generatedResume) return;
    
    setIsSaving(true);
    try {
      await saveResume.mutateAsync({
        resumeData: generatedResume,
        formData: formData,
        atsScore: generatedResume.atsScore || 75,
        suggestions: generatedResume.suggestions || [],
        formatStyle: formData.formatStyle,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedResume) return;
    try {
      await exportResumePDF(generatedResume, formData.name || "Resume");
      toast({ title: "PDF Downloaded!" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({ title: "Error", description: "Failed to export PDF", variant: "destructive" });
    }
  };

  const handleDownloadWord = async () => {
    if (!generatedResume) return;
    try {
      await exportResumeWord(generatedResume, formData.name || "Resume");
      toast({ title: "Word Document Downloaded!" });
    } catch (error) {
      console.error("Word export error:", error);
      toast({ title: "Error", description: "Failed to export Word document", variant: "destructive" });
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedResume) return;
    exportResumeTxt(generatedResume, formData.name || "Resume");
    toast({ title: "Text File Downloaded!" });
  };

  if (isGenerating) {
    return (
      <DashboardLayout userType="welder">
        <div className="flex items-center justify-center min-h-[60vh]">
          <WeldingLoadingAnimation message="Building your professional resume..." />
        </div>
      </DashboardLayout>
    );
  }

  // Show loading while checking for saved resume
  if (isLoadingSaved && !hasLoadedSaved) {
    return (
      <DashboardLayout userType="welder">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your resume...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (generatedResume) {
    const lastUpdated = savedResume?.updated_at 
      ? new Date(savedResume.updated_at).toLocaleDateString()
      : null;
      
    return (
      <DashboardLayout userType="welder">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Your Resume is Ready!</h1>
                <p className="text-sm text-muted-foreground">
                  {lastUpdated ? `Last saved: ${lastUpdated}` : "Review and download your professional resume"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setGeneratedResume(null)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ATS Score & Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    ATS Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-accent mb-2">
                      {generatedResume.atsScore}%
                    </div>
                    <Progress value={generatedResume.atsScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {generatedResume.atsScore >= 80 ? "Excellent! Your resume is ATS-optimized." :
                       generatedResume.atsScore >= 60 ? "Good score. Consider the suggestions below." :
                       "Review suggestions to improve your ATS score."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleSaveResume}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? "Saving..." : "Save Resume"}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuItem onClick={handleDownloadPDF}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Download as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadWord}>
                        <File className="w-4 h-4 mr-2" />
                        Download as Word
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadTxt}>
                        <FileText className="w-4 h-4 mr-2" />
                        Download as TXT
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button variant="ghost" className="w-full" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                </CardContent>
              </Card>

              {generatedResume.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" />
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {generatedResume.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resume Preview */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Resume Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] border rounded-lg p-6 bg-white">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                      {generatedResume.resume.formattedText}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Resume Builder</h1>
            <p className="text-sm text-muted-foreground">Create an ATS-optimized professional resume</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        placeholder="Houston, TX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedIn">LinkedIn (Optional)</Label>
                      <Input
                        id="linkedIn"
                        value={formData.linkedIn}
                        onChange={(e) => updateFormData('linkedIn', e.target.value)}
                        placeholder="linkedin.com/in/johnsmith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentTitle">Current Title</Label>
                      <Input
                        id="currentTitle"
                        value={formData.currentTitle}
                        onChange={(e) => updateFormData('currentTitle', e.target.value)}
                        placeholder="Senior Pipe Welder"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        min={0}
                        value={formData.yearsExperience}
                        onChange={(e) => updateFormData('yearsExperience', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formatStyle">Resume Style</Label>
                      <Select
                        value={formData.formatStyle}
                        onValueChange={(value: any) => updateFormData('formatStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="simple">Simple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Skills & Certifications</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Welding Processes</Label>
                      <div className="flex flex-wrap gap-2">
                        {WELD_PROCESSES_FULL.map((process) => (
                          <Badge
                            key={process.id}
                            variant={formData.processes.includes(process.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleArrayItem('processes', process.id)}
                          >
                            {process.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Welding Positions</Label>
                      <div className="flex flex-wrap gap-2">
                        {WELD_POSITIONS_FULL.map((pos) => (
                          <Badge
                            key={pos.id}
                            variant={formData.positions.includes(pos.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleArrayItem('positions', pos.id)}
                          >
                            {pos.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Certifications</Label>
                      <div className="flex flex-wrap gap-2">
                        {CERTIFICATIONS_LIST.map((cert) => (
                          <Badge
                            key={cert.id}
                            variant={formData.certifications.includes(cert.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleArrayItem('certifications', cert.id)}
                          >
                            {cert.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Industries</Label>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRY_PREFERENCES.map((ind) => (
                          <Badge
                            key={ind.id}
                            variant={formData.industries.includes(ind.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleArrayItem('industries', ind.id)}
                          >
                            {ind.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Work Experience</h2>
                  <Button variant="outline" size="sm" onClick={addWorkExperience}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                </div>

                <div className="space-y-6">
                  {formData.workHistory.map((exp, expIndex) => (
                    <Card key={expIndex} className="border-2">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Experience #{expIndex + 1}</h3>
                          {formData.workHistory.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeWorkExperience(expIndex)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateWorkExperience(expIndex, 'company', e.target.value)}
                              placeholder="ABC Welding Co."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input
                              value={exp.title}
                              onChange={(e) => updateWorkExperience(expIndex, 'title', e.target.value)}
                              placeholder="Pipe Welder"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                              value={exp.location}
                              onChange={(e) => updateWorkExperience(expIndex, 'location', e.target.value)}
                              placeholder="Houston, TX"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-2">
                              <Label>Start Date</Label>
                              <Input
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => updateWorkExperience(expIndex, 'startDate', e.target.value)}
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>End Date</Label>
                              <Input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) => updateWorkExperience(expIndex, 'endDate', e.target.value)}
                                disabled={exp.current}
                                placeholder={exp.current ? "Present" : ""}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Responsibilities</Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addResponsibility(expIndex)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          {exp.responsibilities.map((resp, respIndex) => (
                            <div key={respIndex} className="flex gap-2">
                              <Input
                                value={resp}
                                onChange={(e) => updateResponsibility(expIndex, respIndex, e.target.value)}
                                placeholder="Describe your responsibility..."
                              />
                              {exp.responsibilities.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeResponsibility(expIndex, respIndex)}
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Target Position (Optional)</h2>
                <p className="text-sm text-muted-foreground">
                  Provide target job details to optimize your resume for specific positions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetJob">Target Job Title</Label>
                    <Input
                      id="targetJob"
                      value={formData.targetJob}
                      onChange={(e) => updateFormData('targetJob', e.target.value)}
                      placeholder="Pipeline Welder"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetIndustry">Target Industry</Label>
                    <Select
                      value={formData.targetIndustry}
                      onValueChange={(value) => updateFormData('targetIndustry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_PREFERENCES.map((ind) => (
                          <SelectItem key={ind.id} value={ind.id}>
                            {ind.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      Ready to Generate
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your resume will be optimized for ATS systems and tailored for welding industry positions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button onClick={() => setStep(s => s + 1)}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={!formData.name || !formData.email}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Resume
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
