import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { ScoreCircle, StatCard } from "@/components/ai/ScoreCircle";
import { predictCareerPath, CareerPathResponse, CareerPath } from "@/lib/ai-features";
import {
  JOB_TITLES,
  EDUCATION_LEVELS,
  TIMELINES,
  SPECIALTIES,
  INDUSTRY_PREFERENCES,
  WELD_PROCESSES_FULL,
  WELD_POSITIONS_FULL,
  CERTIFICATIONS_LIST,
} from "@/constants/aiFeatureOptions";
import { useWelderProfile } from "@/hooks/useUserProfile";
import {
  Rocket,
  TrendingUp,
  MapPin,
  DollarSign,
  Award,
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Download,
  RotateCcw,
  Sparkles,
  Briefcase,
  GraduationCap,
  Flame,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CareerPathPredictor() {
  const { data: welderProfile } = useWelderProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CareerPathResponse | null>(null);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  // Current Profile
  const [currentTitle, setCurrentTitle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState<"hourly" | "annual">("hourly");
  const [location, setLocation] = useState("");
  const [education, setEducation] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Career Goals
  const [targetRole, setTargetRole] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [timeline, setTimeline] = useState("");
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [willingToTravel, setWillingToTravel] = useState(false);
  const [interestedInManagement, setInterestedInManagement] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);

  const toggleArray = (arr: string[], item: string, setter: (arr: string[]) => void) => {
    setter(
      arr.includes(item)
        ? arr.filter((i) => i !== item)
        : [...arr, item]
    );
  };

  const handlePredict = async () => {
    if (!currentTitle || !yearsExperience || !location) {
      toast({
        title: "Missing Information",
        description: "Please fill in your current title, experience, and location",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await predictCareerPath({
        currentTitle,
        yearsExperience: parseInt(yearsExperience),
        currentProcesses: selectedProcesses,
        currentCertifications: selectedCerts,
        currentPositions: selectedPositions,
        currentSalary: currentSalary ? parseFloat(currentSalary) : undefined,
        salaryPeriod,
        location,
        education,
        industries: selectedIndustries,
        targetRole: targetRole || undefined,
        targetSalary: targetSalary ? parseFloat(targetSalary) : undefined,
        timeline,
        willingToRelocate,
        willingToTravel,
        interestedInManagement,
        interestedInSpecialties: selectedSpecialties,
        preferredIndustries,
        welderId: welderProfile?.id,
      });

      if (response.success) {
        setResults(response);
        if (response.prediction.careerPaths.length > 0) {
          setExpandedPath(response.prediction.careerPaths[0].pathName);
        }
      } else {
        throw new Error("Prediction failed");
      }
    } catch (error) {
      console.error("Career prediction error:", error);
      toast({
        title: "Prediction Failed",
        description: "Unable to generate career prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="welder">
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <WeldingLoadingAnimation
            message="Analyzing your career path..."
            variant="flame"
            size="lg"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Career Path Predictor</h1>
              <p className="text-muted-foreground">
                Plan your welding career with AI-powered insights
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>

        {!results ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Current Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Current Profile</CardTitle>
                <CardDescription>Tell us about where you are now</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Title</Label>
                    <Select value={currentTitle} onValueChange={setCurrentTitle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TITLES.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Years Experience</Label>
                    <Input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Current Salary</Label>
                    <Input
                      type="number"
                      value={currentSalary}
                      onChange={(e) => setCurrentSalary(e.target.value)}
                      placeholder="28"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select value={salaryPeriod} onValueChange={(v) => setSalaryPeriod(v as "hourly" | "annual")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Houston, TX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Education</Label>
                    <Select value={education} onValueChange={setEducation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((edu) => (
                          <SelectItem key={edu.id} value={edu.id}>
                            {edu.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Welding Processes</Label>
                  <div className="flex flex-wrap gap-2">
                    {WELD_PROCESSES_FULL.map((p) => (
                      <Badge
                        key={p.id}
                        variant={selectedProcesses.includes(p.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArray(selectedProcesses, p.id, setSelectedProcesses)}
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Certifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS_LIST.map((c) => (
                      <Badge
                        key={c.id}
                        variant={selectedCerts.includes(c.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArray(selectedCerts, c.id, setSelectedCerts)}
                      >
                        {c.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Career Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Career Goals</CardTitle>
                <CardDescription>Tell us where you want to go</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Role (optional)</Label>
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        {JOB_TITLES.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Salary ({salaryPeriod})</Label>
                    <Input
                      type="number"
                      value={targetSalary}
                      onChange={(e) => setTargetSalary(e.target.value)}
                      placeholder="45"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Preferences</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="relocate"
                        checked={willingToRelocate}
                        onCheckedChange={(c) => setWillingToRelocate(c === true)}
                      />
                      <label htmlFor="relocate" className="text-sm">Willing to relocate</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="travel"
                        checked={willingToTravel}
                        onCheckedChange={(c) => setWillingToTravel(c === true)}
                      />
                      <label htmlFor="travel" className="text-sm">Willing to travel for work</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="management"
                        checked={interestedInManagement}
                        onCheckedChange={(c) => setInterestedInManagement(c === true)}
                      />
                      <label htmlFor="management" className="text-sm">Interested in management</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Interested Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <Badge
                        key={s.id}
                        variant={selectedSpecialties.includes(s.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArray(selectedSpecialties, s.id, setSelectedSpecialties)}
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Preferred Industries</Label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_PREFERENCES.map((i) => (
                      <Badge
                        key={i.id}
                        variant={preferredIndustries.includes(i.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArray(preferredIndustries, i.id, setPreferredIndustries)}
                      >
                        {i.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button size="lg" className="w-full" onClick={handlePredict}>
                  <Rocket className="w-4 h-4 mr-2" />
                  Predict My Career Path
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Market Position Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard
                label="Market Value"
                value={results.prediction.profileAssessment.currentMarketValue}
                variant="info"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <StatCard
                label="Market Position"
                value={results.prediction.profileAssessment.competitivePosition}
                variant="success"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <StatCard
                label="Overall Demand"
                value={results.prediction.marketAnalysis.currentDemand.overall.toUpperCase()}
                variant={results.prediction.marketAnalysis.currentDemand.overall === "high" ? "success" : "warning"}
                icon={<Flame className="w-5 h-5" />}
              />
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm">{results.prediction.summary}</p>
              </CardContent>
            </Card>

            {/* Career Paths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Recommended Career Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion
                  type="single"
                  collapsible
                  value={expandedPath || undefined}
                  onValueChange={setExpandedPath}
                >
                  {results.prediction.careerPaths.map((path, i) => (
                    <AccordionItem key={path.pathName} value={path.pathName}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <ScoreCircle score={path.suitabilityScore} size="sm" />
                            <div className="text-left">
                              <div className="font-medium">{path.pathName}</div>
                              <div className="text-sm text-muted-foreground">
                                {path.timeline}
                              </div>
                            </div>
                          </div>
                          <Badge variant={i === 0 ? "default" : "outline"}>
                            {path.suitabilityScore}% Match
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <p className="text-sm">{path.description}</p>

                          {/* Salary Progression */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              Salary Progression
                            </h4>
                            <div className="flex items-center justify-between">
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Now</div>
                                <div className="font-bold">{path.salaryProgression.current}</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Year 1</div>
                                <div className="font-bold">{path.salaryProgression.year1}</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Year 3</div>
                                <div className="font-bold">{path.salaryProgression.year3}</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Year 5</div>
                                <div className="font-bold text-green-600">{path.salaryProgression.year5}</div>
                              </div>
                            </div>
                          </div>

                          {/* Steps */}
                          <div>
                            <h4 className="font-medium mb-3">Required Steps</h4>
                            <div className="space-y-2">
                              {path.requiredSteps.map((step) => (
                                <div key={step.step} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs shrink-0">
                                    {step.step}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{step.action}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Duration: {step.duration} • Cost: {step.cost} • ROI: {step.roi}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Advantages & Risks */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                Advantages
                              </h4>
                              <ul className="space-y-1 text-sm">
                                {path.advantages.map((a, i) => (
                                  <li key={i}>• {a}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2 text-yellow-600">
                                <AlertTriangle className="w-4 h-4" />
                                Risks
                              </h4>
                              <ul className="space-y-1 text-sm">
                                {path.risks.map((r, i) => (
                                  <li key={i}>• {r}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Recommended Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  Recommended Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.prediction.recommendedCertifications.map((cert, i) => (
                    <div key={cert.certification} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold shrink-0">
                        #{cert.priority}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{cert.certification}</h4>
                          <Badge variant={cert.demandTrend === "growing" ? "default" : "outline"}>
                            🔥 {cert.demandTrend}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{cert.reason}</p>
                        <div className="flex flex-wrap gap-4 mt-3 text-xs">
                          <span>💵 Cost: {cert.cost}</span>
                          <span>⏱️ Time: {cert.timeToComplete}</span>
                          <span className="text-green-600">📈 +{cert.expectedSalaryIncrease}</span>
                          <span className="font-medium">ROI: {cert.roi}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Your Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Immediate */}
                  <div>
                    <h4 className="font-medium mb-3 text-red-600">🔥 Immediate (Next 30 Days)</h4>
                    <div className="space-y-2">
                      {results.prediction.actionPlan.immediate.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                          <Checkbox />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{item.action}</div>
                            <div className="text-xs text-muted-foreground">
                              Deadline: {item.deadline} • Impact: {item.impact}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Short Term */}
                  <div>
                    <h4 className="font-medium mb-3 text-yellow-600">📅 Short Term (1-6 Months)</h4>
                    <div className="space-y-2">
                      {results.prediction.actionPlan.shortTerm.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                          <Checkbox />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{item.action}</div>
                            <div className="text-xs text-muted-foreground">
                              Deadline: {item.deadline} • Impact: {item.impact}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Long Term */}
                  <div>
                    <h4 className="font-medium mb-3 text-green-600">🎯 Long Term (6-24 Months)</h4>
                    <div className="space-y-2">
                      {results.prediction.actionPlan.longTerm.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <Checkbox />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{item.action}</div>
                            <div className="text-xs text-muted-foreground">
                              Deadline: {item.deadline} • Impact: {item.impact}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Negotiation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  Salary Negotiation Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Your Fair Market Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.prediction.salaryNegotiationInsights.currentFairValue}
                  </div>
                </div>
                <p className="text-sm">{results.prediction.salaryNegotiationInsights.marketComparison}</p>
                <div>
                  <h4 className="font-medium mb-2">Negotiation Points</h4>
                  <ul className="space-y-1">
                    {results.prediction.salaryNegotiationInsights.negotiationPoints.map((point, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Full Report
              </Button>
              <Button onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Update Goals
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
