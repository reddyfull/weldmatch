import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { ScoreCircle, StatCard } from "@/components/ai/ScoreCircle";
import { analyzeWeldQuality, WeldQualityResponse, getGradeColor, getSeverityColor, getPriorityColor } from "@/lib/ai-features";
import { WELD_TYPES, WELD_MATERIALS, WELD_PROCESSES_FULL, WELD_POSITIONS_FULL, WELD_STANDARDS, WELD_PURPOSES } from "@/constants/aiFeatureOptions";
import { useWelderProfile } from "@/hooks/useUserProfile";
import {
  Camera,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WeldAnalyzer() {
  const { data: welderProfile } = useWelderProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<WeldQualityResponse | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    defects: true,
    positive: true,
    tips: true,
    technical: false,
    compliance: false,
  });

  // Form state
  const [weldType, setWeldType] = useState("");
  const [material, setMaterial] = useState("");
  const [process, setProcess] = useState("");
  const [position, setPosition] = useState("");
  const [standard, setStandard] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Extract base64 without the data URL prefix
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageBase64 || !weldType || !material || !process || !position || !standard || !purpose) {
      toast({
        title: "Missing Information",
        description: "Please upload an image and fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeWeldQuality({
        imageBase64,
        weldType,
        material,
        process,
        position,
        standard,
        purpose,
        welderId: welderProfile?.id,
      });

      if (response.success) {
        setResults(response);
        setShowResults(true);
      } else {
        throw new Error("Analysis failed");
      }
    } catch (error) {
      console.error("Weld analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the weld. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setResults(null);
    setShowResults(false);
    setWeldType("");
    setMaterial("");
    setProcess("");
    setPosition("");
    setStandard("");
    setPurpose("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <DashboardLayout userType="welder">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Search className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Weld Quality Analyzer</h1>
              <p className="text-muted-foreground">
                Get instant feedback on your welds with AI-powered analysis
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>

        {isAnalyzing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-8">
              <WeldingLoadingAnimation
                message="Analyzing your weld..."
                variant="spark"
                size="lg"
              />
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Weld Photo</CardTitle>
              <CardDescription>
                Drop an image or click to upload (Max 10MB, JPG/PNG/WebP)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  imagePreview
                    ? "border-accent bg-accent/5"
                    : "border-muted-foreground/25 hover:border-accent hover:bg-accent/5"
                )}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Weld preview"
                      className="max-h-64 mx-auto rounded-lg object-contain"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Drop image here</p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="w-3 h-3" />
                      JPG, PNG, WebP • Max 10MB
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weld Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weld Details</CardTitle>
              <CardDescription>
                Provide details about your weld for accurate analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Weld Type</Label>
                  <Select value={weldType} onValueChange={setWeldType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weld type" />
                    </SelectTrigger>
                    <SelectContent>
                      {WELD_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {WELD_MATERIALS.map((mat) => (
                        <SelectItem key={mat.id} value={mat.id}>
                          {mat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Process</Label>
                    <Select value={process} onValueChange={setProcess}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {WELD_PROCESSES_FULL.map((proc) => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {WELD_POSITIONS_FULL.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Standard</Label>
                  <Select value={standard} onValueChange={setStandard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {WELD_STANDARDS.map((std) => (
                        <SelectItem key={std.id} value={std.id}>
                          {std.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {WELD_PURPOSES.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!imageBase64 || !weldType || !material || !process || !position || !standard || !purpose}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Analyze My Weld
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Dialog */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                📊 Weld Analysis Results
              </DialogTitle>
            </DialogHeader>

            {results && (
              <ScrollArea className="max-h-[calc(90vh-100px)]">
                <div className="space-y-6 p-1">
                  {/* Score Overview */}
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    <ScoreCircle
                      score={results.analysis.overallScore}
                      label="Overall Score"
                      size="lg"
                      showGrade
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard
                        label="Visual Inspection"
                        value={results.analysis.passesVisualInspection ? "✅ Pass" : "❌ Fail"}
                        variant={results.analysis.passesVisualInspection ? "success" : "danger"}
                      />
                      <StatCard
                        label="Cert Ready"
                        value={results.analysis.certificationReady ? "✅ Yes" : "❌ No"}
                        variant={results.analysis.certificationReady ? "success" : "warning"}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm">{results.analysis.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Detected Defects */}
                  {results.analysis.detectedDefects.length > 0 && (
                    <Card>
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSection("defects")}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            Detected Defects ({results.analysis.detectedDefects.length})
                          </CardTitle>
                          {expandedSections.defects ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.defects && (
                        <CardContent className="space-y-3">
                          {results.analysis.detectedDefects.map((defect, i) => (
                            <div
                              key={i}
                              className={cn(
                                "p-3 rounded-lg border",
                                getSeverityColor(defect.severity)
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <Badge variant="outline" className="mb-1">
                                    {defect.severity.toUpperCase()}
                                  </Badge>
                                  <h4 className="font-medium">{defect.type}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Location: {defect.location}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm mt-2">{defect.description}</p>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Positive Aspects */}
                  {results.analysis.positiveAspects.length > 0 && (
                    <Card>
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSection("positive")}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Positive Aspects
                          </CardTitle>
                          {expandedSections.positive ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.positive && (
                        <CardContent>
                          <ul className="space-y-2">
                            {results.analysis.positiveAspects.map((aspect, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                {aspect}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Improvement Tips */}
                  {results.analysis.improvementTips.length > 0 && (
                    <Card>
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSection("tips")}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                            Improvement Tips
                          </CardTitle>
                          {expandedSections.tips ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.tips && (
                        <CardContent className="space-y-3">
                          {results.analysis.improvementTips.map((tip, i) => (
                            <div
                              key={i}
                              className={cn(
                                "p-3 rounded-lg",
                                getPriorityColor(tip.priority)
                              )}
                            >
                              <Badge variant="outline" className="mb-1">
                                {tip.priority.toUpperCase()} PRIORITY
                              </Badge>
                              <h4 className="font-medium text-sm">{tip.issue}</h4>
                              <p className="text-sm mt-1 text-foreground/80">
                                → {tip.recommendation}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Technical Details */}
                  <Card>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleSection("technical")}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Technical Details</CardTitle>
                        {expandedSections.technical ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections.technical && (
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Penetration:</span>
                            <p className="font-medium">{results.analysis.technicalDetails.estimatedPenetration}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Profile:</span>
                            <p className="font-medium">{results.analysis.technicalDetails.profileAssessment}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Heat Input:</span>
                            <p className="font-medium">{results.analysis.technicalDetails.heatInputAssessment}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Travel Speed:</span>
                            <p className="font-medium">{results.analysis.technicalDetails.travelSpeedAssessment}</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Code Compliance */}
                  <Card>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleSection("compliance")}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {results.analysis.codeCompliance.wouldPass ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          Code Compliance ({results.analysis.codeCompliance.standard})
                        </CardTitle>
                        {expandedSections.compliance ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections.compliance && (
                      <CardContent>
                        <div className="space-y-2">
                          <div className={cn(
                            "p-2 rounded-lg text-center font-medium",
                            results.analysis.codeCompliance.wouldPass
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          )}>
                            {results.analysis.codeCompliance.wouldPass
                              ? "✅ Would likely pass inspection"
                              : "❌ May not pass inspection"}
                          </div>
                          {results.analysis.codeCompliance.concerns.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-2">Concerns:</p>
                              <ul className="space-y-1">
                                {results.analysis.codeCompliance.concerns.map((concern, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowResults(false)}>
                      <Download className="w-4 h-4 mr-2" />
                      Save to Portfolio
                    </Button>
                    <Button onClick={() => {
                      setShowResults(false);
                      handleReset();
                    }}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Analyze Another
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
