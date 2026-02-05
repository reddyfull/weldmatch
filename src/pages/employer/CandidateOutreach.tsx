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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Send, 
  Sparkles, 
  Copy, 
  Check,
  User,
  Briefcase,
  Mail,
  Linkedin,
  MessageSquare,
  Clock,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { draftOutreach, OutreachResponse } from "@/lib/ai-phase2";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { WELD_PROCESSES_FULL, CERTIFICATIONS_LIST } from "@/constants/aiFeatureOptions";

interface FormData {
  // Candidate
  candidateName: string;
  candidateTitle: string;
  candidateExperience: number;
  candidateLocation: string;
  candidateCerts: string[];
  candidateProcesses: string[];
  matchScore: number;
  strengths: string[];
  
  // Job
  jobTitle: string;
  company: string;
  jobLocation: string;
  salary: string;
  benefits: string[];
  urgency: 'urgent' | 'normal' | 'passive';
  
  // Recruiter
  recruiterName: string;
  recruiterTitle: string;
  recruiterEmail: string;
  recruiterPhone: string;
  
  // Options
  channel: 'email' | 'linkedin' | 'text' | 'inmail';
  tone: 'professional' | 'casual' | 'enthusiastic' | 'urgent';
  length: 'brief' | 'standard' | 'detailed';
  includeCompensation: boolean;
  personalization: 'low' | 'medium' | 'high';
  generateVariants: number;
  followUpSequence: boolean;
}

const channelIcons = {
  email: Mail,
  linkedin: Linkedin,
  text: MessageSquare,
  inmail: Linkedin,
};

export default function CandidateOutreach() {
  const { user } = useAuth();
  const { data: employerProfile } = useEmployerProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutreach, setGeneratedOutreach] = useState<OutreachResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeVariant, setActiveVariant] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    candidateName: "",
    candidateTitle: "",
    candidateExperience: 0,
    candidateLocation: "",
    candidateCerts: [],
    candidateProcesses: [],
    matchScore: 0,
    strengths: [],
    jobTitle: "",
    company: employerProfile?.company_name || "",
    jobLocation: employerProfile?.city && employerProfile?.state 
      ? `${employerProfile.city}, ${employerProfile.state}` 
      : "",
    salary: "",
    benefits: [],
    urgency: 'normal',
    recruiterName: "",
    recruiterTitle: "",
    recruiterEmail: user?.email || "",
    recruiterPhone: "",
    channel: 'email',
    tone: 'professional',
    length: 'standard',
    includeCompensation: true,
    personalization: 'high',
    generateVariants: 1,
    followUpSequence: false,
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'candidateCerts' | 'candidateProcesses', item: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateFormData(field, updated);
  };

  const handleGenerate = async () => {
    if (!formData.candidateName || !formData.jobTitle || !formData.recruiterName) {
      toast({
        title: "Missing Information",
        description: "Please fill in candidate name, job title, and your name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await draftOutreach({
        ...formData,
        employerId: employerProfile?.id,
      });

      if (response.success) {
        setGeneratedOutreach(response);
        toast({
          title: "Outreach Message Generated!",
          description: `Created ${response.outreach.variants?.length || 1} message variant(s).`,
        });
      } else {
        throw new Error("Failed to generate outreach");
      }
    } catch (error) {
      console.error("Outreach generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate outreach message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  if (isGenerating) {
    return (
      <DashboardLayout userType="employer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <WeldingLoadingAnimation message="Crafting your personalized outreach message..." />
        </div>
      </DashboardLayout>
    );
  }

  if (generatedOutreach) {
    const ChannelIcon = channelIcons[formData.channel];
    const variants = generatedOutreach.outreach.variants || [{ id: 0, fullMessage: generatedOutreach.outreach.fullMessage, tone: formData.tone }];

    return (
      <DashboardLayout userType="employer">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Outreach Ready!</h1>
                <p className="text-sm text-muted-foreground">
                  For: {generatedOutreach.candidate.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setGeneratedOutreach(null)}>
              Create Another
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChannelIcon className="w-5 h-5" />
                    {formData.channel.charAt(0).toUpperCase() + formData.channel.slice(1)} Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedOutreach.outreach.subject && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Subject Line</Label>
                      <p className="text-sm font-medium">{generatedOutreach.outreach.subject}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Tone Analysis</Label>
                    <p className="text-sm">{generatedOutreach.outreach.toneAnalysis}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Personalization Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {generatedOutreach.outreach.personalizationPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {generatedOutreach.outreach.followUpMessages && generatedOutreach.outreach.followUpMessages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Follow-up Sequence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedOutreach.outreach.followUpMessages.map((followUp, i) => (
                      <div key={i} className="border-l-2 border-accent pl-3">
                        <p className="text-xs text-muted-foreground">Day {followUp.day}</p>
                        <p className="text-sm font-medium">{followUp.subject}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 h-7 text-xs"
                          onClick={() => copyToClipboard(followUp.message)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Message Preview */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Message Preview</CardTitle>
                    {variants.length > 1 && (
                      <Tabs value={String(activeVariant)} onValueChange={(v) => setActiveVariant(Number(v))}>
                        <TabsList>
                          {variants.map((_, i) => (
                            <TabsTrigger key={i} value={String(i)}>
                              Variant {i + 1}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ScrollArea className="h-[400px] border rounded-lg p-4 bg-muted/30">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {variants[activeVariant]?.fullMessage || generatedOutreach.outreach.fullMessage}
                      </pre>
                    </ScrollArea>
                    <Button 
                      className="w-full" 
                      onClick={() => copyToClipboard(variants[activeVariant]?.fullMessage || generatedOutreach.outreach.fullMessage)}
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? "Copied!" : "Copy Message"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="employer">
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Candidate Outreach</h1>
            <p className="text-sm text-muted-foreground">Generate personalized recruitment messages</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Candidate Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Candidate Name *</Label>
                  <Input
                    value={formData.candidateName}
                    onChange={(e) => updateFormData('candidateName', e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Title</Label>
                  <Input
                    value={formData.candidateTitle}
                    onChange={(e) => updateFormData('candidateTitle', e.target.value)}
                    placeholder="Pipe Welder"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years Experience</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.candidateExperience}
                    onChange={(e) => updateFormData('candidateExperience', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.candidateLocation}
                    onChange={(e) => updateFormData('candidateLocation', e.target.value)}
                    placeholder="Houston, TX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Their Certifications</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CERTIFICATIONS_LIST.slice(0, 6).map((cert) => (
                    <Badge
                      key={cert.id}
                      variant={formData.candidateCerts.includes(cert.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem('candidateCerts', cert.id)}
                    >
                      {cert.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Their Processes</Label>
                <div className="flex flex-wrap gap-1.5">
                  {WELD_PROCESSES_FULL.map((process) => (
                    <Badge
                      key={process.id}
                      variant={formData.candidateProcesses.includes(process.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem('candidateProcesses', process.id)}
                    >
                      {process.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job & Your Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job & Recruiter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => updateFormData('jobTitle', e.target.value)}
                    placeholder="Pipeline Welder"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => updateFormData('company', e.target.value)}
                    placeholder="ABC Energy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Location</Label>
                  <Input
                    value={formData.jobLocation}
                    onChange={(e) => updateFormData('jobLocation', e.target.value)}
                    placeholder="Houston, TX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary/Rate</Label>
                  <Input
                    value={formData.salary}
                    onChange={(e) => updateFormData('salary', e.target.value)}
                    placeholder="$45-55/hr"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Your Contact Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Your Name *</Label>
                    <Input
                      value={formData.recruiterName}
                      onChange={(e) => updateFormData('recruiterName', e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Title</Label>
                    <Input
                      value={formData.recruiterTitle}
                      onChange={(e) => updateFormData('recruiterTitle', e.target.value)}
                      placeholder="Talent Acquisition"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Message Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label>Channel</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['email', 'linkedin', 'text', 'inmail'] as const).map((channel) => {
                    const Icon = channelIcons[channel];
                    return (
                      <Button
                        key={channel}
                        variant={formData.channel === channel ? "default" : "outline"}
                        size="sm"
                        className="justify-start"
                        onClick={() => updateFormData('channel', channel)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {channel.charAt(0).toUpperCase() + channel.slice(1)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Tone</Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value: any) => updateFormData('tone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Label>Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value: any) => updateFormData('urgency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent - Need ASAP</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="passive">Passive - Building pipeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Include Compensation</Label>
                  <Switch
                    checked={formData.includeCompensation}
                    onCheckedChange={(checked) => updateFormData('includeCompensation', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Generate Follow-ups</Label>
                  <Switch
                    checked={formData.followUpSequence}
                    onCheckedChange={(checked) => updateFormData('followUpSequence', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message Variants</Label>
                  <Select
                    value={String(formData.generateVariants)}
                    onValueChange={(value) => updateFormData('generateVariants', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Variant</SelectItem>
                      <SelectItem value="2">2 Variants</SelectItem>
                      <SelectItem value="3">3 Variants</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleGenerate}
            disabled={!formData.candidateName || !formData.jobTitle || !formData.recruiterName}
            className="px-8"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Outreach Message
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
