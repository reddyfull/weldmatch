import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { ScoreCircle, StatCard } from "@/components/ai/ScoreCircle";
import { checkSafetyCompliance, SafetyComplianceResponse, getSeverityColor, getRiskColor, getPriorityColor } from "@/lib/ai-features";
import { WORK_TYPES, WORK_LOCATIONS, INDUSTRIES, CHECKLIST_TYPES, SAFETY_FOCUS_AREAS, SAFETY_STANDARDS } from "@/constants/aiFeatureOptions";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import {
  Shield,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyMonitor() {
  const { data: employerProfile } = useEmployerProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SafetyComplianceResponse | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    violations: true,
    compliant: false,
    recommendations: true,
    training: false,
  });

  // Form state
  const [workType, setWorkType] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [checklistType, setChecklistType] = useState<"comprehensive" | "quick" | "ppe-only">("comprehensive");
  const [focusAreas, setFocusAreas] = useState<string[]>(["ppe", "fire_safety", "ventilation", "electrical"]);
  const [standards, setStandards] = useState<string[]>(["OSHA"]);

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
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area)
        ? prev.filter((a) => a !== area)
        : [...prev, area]
    );
  };

  const toggleStandard = (std: string) => {
    setStandards((prev) =>
      prev.includes(std)
        ? prev.filter((s) => s !== std)
        : [...prev, std]
    );
  };

  const handleInspect = async () => {
    if (!imageBase64 || !workType || !location || !industry) {
      toast({
        title: "Missing Information",
        description: "Please upload an image and fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await checkSafetyCompliance({
        imageBase64,
        workType,
        location,
        industry,
        checklistType,
        focusAreas: focusAreas as ("ppe" | "fire_safety" | "ventilation" | "electrical" | "housekeeping" | "cylinders" | "welding_screens" | "emergency")[],
        standards,
        employerId: employerProfile?.id,
      });

      if (response.success) {
        setResults(response);
        setShowResults(true);
      } else {
        throw new Error("Inspection failed");
      }
    } catch (error) {
      console.error("Safety inspection error:", error);
      toast({
        title: "Inspection Failed",
        description: "Unable to complete safety inspection. Please try again.",
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

  const getComplianceBadge = (level: string) => {
    switch (level) {
      case "compliant":
        return <Badge className="bg-green-500">✅ Compliant</Badge>;
      case "minor_issues":
        return <Badge className="bg-yellow-500">⚠️ Minor Issues</Badge>;
      case "major_issues":
        return <Badge className="bg-orange-500">🔶 Major Issues</Badge>;
      case "critical_violations":
        return <Badge className="bg-red-500">🚨 Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "imminent_danger":
        return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case "major":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "minor":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <DashboardLayout userType="employer">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Safety Compliance Monitor</h1>
              <p className="text-muted-foreground">
                Instant job site safety inspection with AI
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
                message="Inspecting job site safety..."
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
              <CardTitle className="text-lg">Upload Site Photo</CardTitle>
              <CardDescription>
                Take or upload a photo of your work area
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
                      alt="Site preview"
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

          {/* Inspection Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inspection Settings</CardTitle>
              <CardDescription>
                Configure the safety inspection parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Work Type</Label>
                  <Select value={workType} onValueChange={setWorkType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_LOCATIONS.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Inspection Type</Label>
                <Select value={checklistType} onValueChange={(v) => setChecklistType(v as typeof checklistType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHECKLIST_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Focus Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {SAFETY_FOCUS_AREAS.map((area) => (
                    <Badge
                      key={area.id}
                      variant={focusAreas.includes(area.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFocusArea(area.id)}
                    >
                      {area.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Standards</Label>
                <div className="flex flex-wrap gap-2">
                  {SAFETY_STANDARDS.map((std) => (
                    <Badge
                      key={std.id}
                      variant={standards.includes(std.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleStandard(std.id)}
                    >
                      {std.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleInspect}
                  disabled={!imageBase64 || !workType || !location || !industry}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Run Safety Inspection
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
                🚨 Safety Inspection Report
              </DialogTitle>
            </DialogHeader>

            {results && (
              <ScrollArea className="max-h-[calc(90vh-100px)]">
                <div className="space-y-6 p-1">
                  {/* Overview */}
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    <ScoreCircle
                      score={results.inspection.overallComplianceScore}
                      label="Compliance Score"
                      size="lg"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard
                        label="Compliance Level"
                        value={results.inspection.complianceLevel.replace(/_/g, " ")}
                        variant={
                          results.inspection.complianceLevel === "compliant"
                            ? "success"
                            : results.inspection.complianceLevel === "minor_issues"
                            ? "warning"
                            : "danger"
                        }
                      />
                      <StatCard
                        label="Risk Level"
                        value={results.inspection.riskAssessment.overallRisk.toUpperCase()}
                        variant={
                          results.inspection.riskAssessment.overallRisk === "low"
                            ? "success"
                            : results.inspection.riskAssessment.overallRisk === "medium"
                            ? "warning"
                            : "danger"
                        }
                      />
                      <StatCard
                        label="Violations"
                        value={results.statistics.totalViolations}
                        variant={results.statistics.totalViolations === 0 ? "success" : "danger"}
                      />
                      <StatCard
                        label="Immediate Action"
                        value={results.inspection.immediateActionRequired ? "⚠️ YES" : "✅ NO"}
                        variant={results.inspection.immediateActionRequired ? "danger" : "success"}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm">{results.inspection.summary}</p>
                    </CardContent>
                  </Card>

                  {/* Category Scores */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Category Scores</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(results.inspection.categoryScores).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                            <span className={cn(
                              value >= 80 ? "text-green-600" :
                              value >= 60 ? "text-yellow-600" : "text-red-600"
                            )}>
                              {value}%
                            </span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Violations */}
                  {results.inspection.violations.length > 0 && (
                    <Card>
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSection("violations")}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            Violations ({results.inspection.violations.length})
                          </CardTitle>
                          {expandedSections.violations ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.violations && (
                        <CardContent className="space-y-3">
                          {results.inspection.violations.map((violation) => (
                            <div
                              key={violation.id}
                              className={cn(
                                "p-4 rounded-lg border",
                                getSeverityColor(violation.severity)
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {getSeverityIcon(violation.severity)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {violation.severity.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {violation.category}
                                    </span>
                                  </div>
                                  <h4 className="font-medium">{violation.description}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Location: {violation.location}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Standard: {violation.oshaStandard}
                                  </p>
                                  <div className="mt-3 p-2 bg-background rounded">
                                    <p className="text-sm">
                                      <strong>Action:</strong> {violation.correctiveAction}
                                    </p>
                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>Time: {violation.timeToCorrect}</span>
                                      <span>Cost: {violation.estimatedCost}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Compliant Items */}
                  {results.inspection.compliantItems.length > 0 && (
                    <Card>
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSection("compliant")}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Compliant Items ({results.inspection.compliantItems.length})
                          </CardTitle>
                          {expandedSections.compliant ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.compliant && (
                        <CardContent>
                          <ul className="space-y-2">
                            {results.inspection.compliantItems.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium">{item.category}:</span>{" "}
                                  {item.observation}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Recommendations */}
                  {results.inspection.recommendations.length > 0 && (
                    <Card>
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSection("recommendations")}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Recommendations</CardTitle>
                          {expandedSections.recommendations ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.recommendations && (
                        <CardContent className="space-y-3">
                          {results.inspection.recommendations.map((rec, i) => (
                            <div
                              key={i}
                              className={cn(
                                "p-3 rounded-lg",
                                getPriorityColor(rec.priority)
                              )}
                            >
                              <Badge variant="outline" className="mb-1 text-xs">
                                {rec.priority.toUpperCase()}
                              </Badge>
                              <h4 className="font-medium text-sm">{rec.action}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Benefit: {rec.benefit}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Estimated Cost: {rec.estimatedCost}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Training Needs */}
                  {results.inspection.trainingNeeds.length > 0 && (
                    <Card>
                      <CardHeader
                        className="cursor-pointer"
                        onClick={() => toggleSection("training")}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Training Needs</CardTitle>
                          {expandedSections.training ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </CardHeader>
                      {expandedSections.training && (
                        <CardContent>
                          <ul className="space-y-2">
                            {results.inspection.trainingNeeds.map((need, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <FileText className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                {need}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF Report
                    </Button>
                    <Button onClick={() => {
                      setShowResults(false);
                      handleReset();
                    }}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Inspection
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
