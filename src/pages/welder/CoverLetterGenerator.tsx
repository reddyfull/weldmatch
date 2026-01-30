import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Sparkles, 
  Download, 
  Copy, 
  Check,
  FileText,
  Briefcase,
  User,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile } from "@/hooks/useUserProfile";
import { generateCoverLetter, CoverLetterResponse } from "@/lib/ai-phase2";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { WELD_PROCESSES_FULL, CERTIFICATIONS_LIST } from "@/constants/aiFeatureOptions";

interface FormData {
  // Personal
  name: string;
  email: string;
  phone: string;
  location: string;
  yearsExperience: number;
  currentTitle: string;
  processes: string[];
  certifications: string[];
  keyAchievements: string[];
  
  // Job
  jobTitle: string;
  company: string;
  companyDescription: string;
  jobDescription: string;
  jobLocation: string;
  recruiterName: string;
  
  // Options
  tone: 'professional' | 'enthusiastic' | 'confident' | 'humble';
  length: 'brief' | 'standard' | 'detailed';
}

export default function CoverLetterGenerator() {
  const { user } = useAuth();
  const { data: welderProfile } = useWelderProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<CoverLetterResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: user?.email || "",
    phone: "",
    location: welderProfile?.city && welderProfile?.state 
      ? `${welderProfile.city}, ${welderProfile.state}` 
      : "",
    yearsExperience: welderProfile?.years_experience || 0,
    currentTitle: "Welder",
    processes: welderProfile?.weld_processes || [],
    certifications: [],
    keyAchievements: [],
    jobTitle: "",
    company: "",
    companyDescription: "",
    jobDescription: "",
    jobLocation: "",
    recruiterName: "",
    tone: 'professional',
    length: 'standard',
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'processes' | 'certifications', item: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateFormData(field, updated);
  };

  const handleGenerate = async () => {
    if (!formData.name || !formData.jobTitle || !formData.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name, job title, and company name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateCoverLetter({
        ...formData,
        welderId: welderProfile?.id,
      });

      if (response.success) {
        setGeneratedLetter(response);
        toast({
          title: "Cover Letter Generated!",
          description: "Your personalized cover letter is ready.",
        });
      } else {
        throw new Error("Failed to generate cover letter");
      }
    } catch (error) {
      console.error("Cover letter generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedLetter?.coverLetter.formattedLetter) {
      await navigator.clipboard.writeText(generatedLetter.coverLetter.formattedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard!" });
    }
  };

  const downloadAsTxt = () => {
    if (generatedLetter?.coverLetter.formattedLetter) {
      const blob = new Blob([generatedLetter.coverLetter.formattedLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CoverLetter_${formData.company.replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isGenerating) {
    return (
      <DashboardLayout userType="welder">
        <div className="flex items-center justify-center min-h-[60vh]">
          <WeldingLoadingAnimation message="Crafting your personalized cover letter..." />
        </div>
      </DashboardLayout>
    );
  }

  if (generatedLetter) {
    return (
      <DashboardLayout userType="welder">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Your Cover Letter is Ready!</h1>
                <p className="text-sm text-muted-foreground">
                  For: {formData.jobTitle} at {formData.company}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setGeneratedLetter(null)}>
              Create Another
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Actions & Highlights */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={downloadAsTxt}>
                    <Download className="w-4 h-4 mr-2" />
                    Download as TXT
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Keywords Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {generatedLetter.coverLetter.keywordsUsed.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strength Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {generatedLetter.coverLetter.strengthHighlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Letter Preview */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Cover Letter Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] border rounded-lg p-6 bg-white">
                    <pre className="whitespace-pre-wrap font-serif text-sm text-gray-800 leading-relaxed">
                      {generatedLetter.coverLetter.formattedLetter}
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
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Cover Letter Generator</h1>
            <p className="text-sm text-muted-foreground">Create job-specific cover letters in seconds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Title</Label>
                  <Input
                    value={formData.currentTitle}
                    onChange={(e) => updateFormData('currentTitle', e.target.value)}
                    placeholder="Pipe Welder"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.yearsExperience}
                  onChange={(e) => updateFormData('yearsExperience', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Your Welding Processes</Label>
                <div className="flex flex-wrap gap-1.5">
                  {WELD_PROCESSES_FULL.map((process) => (
                    <Badge
                      key={process.id}
                      variant={formData.processes.includes(process.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem('processes', process.id)}
                    >
                      {process.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your Certifications</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CERTIFICATIONS_LIST.map((cert) => (
                    <Badge
                      key={cert.id}
                      variant={formData.certifications.includes(cert.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem('certifications', cert.id)}
                    >
                      {cert.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Target Job
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Title *</Label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => updateFormData('jobTitle', e.target.value)}
                  placeholder="Pipeline Welder"
                />
              </div>

              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  placeholder="ABC Energy Corp"
                />
              </div>

              <div className="space-y-2">
                <Label>Job Location</Label>
                <Input
                  value={formData.jobLocation}
                  onChange={(e) => updateFormData('jobLocation', e.target.value)}
                  placeholder="Houston, TX"
                />
              </div>

              <div className="space-y-2">
                <Label>Hiring Manager Name (Optional)</Label>
                <Input
                  value={formData.recruiterName}
                  onChange={(e) => updateFormData('recruiterName', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <Label>Job Description (Paste for better personalization)</Label>
                <Textarea
                  value={formData.jobDescription}
                  onChange={(e) => updateFormData('jobDescription', e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Letter Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Tone</Label>
                <RadioGroup
                  value={formData.tone}
                  onValueChange={(value: any) => updateFormData('tone', value)}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { value: 'professional', label: 'Professional' },
                    { value: 'enthusiastic', label: 'Enthusiastic' },
                    { value: 'confident', label: 'Confident' },
                    { value: 'humble', label: 'Humble' },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Length</Label>
                <RadioGroup
                  value={formData.length}
                  onValueChange={(value: any) => updateFormData('length', value)}
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { value: 'brief', label: 'Brief' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'detailed', label: 'Detailed' },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`length-${option.value}`} />
                      <Label htmlFor={`length-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleGenerate}
            disabled={!formData.name || !formData.jobTitle || !formData.company}
            className="px-8"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Cover Letter
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
