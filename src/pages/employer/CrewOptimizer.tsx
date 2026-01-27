import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { ScoreCircle, StatCard } from "@/components/ai/ScoreCircle";
import { optimizeCrew, CrewOptimizerResponse, CrewOptimizerWelder, getRiskColor } from "@/lib/ai-features";
import { PROJECT_TYPES, SHIFT_PATTERNS, BUDGET_TYPES, TEAM_BALANCING, WELD_PROCESSES_FULL, CERTIFICATIONS_LIST, WELD_POSITIONS_FULL } from "@/constants/aiFeatureOptions";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Star,
  TrendingUp,
  Download,
  Send,
  RotateCcw,
  Sparkles,
  MapPin,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CrewOptimizer() {
  const { data: employerProfile } = useEmployerProfile();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<CrewOptimizerResponse | null>(null);

  // Project Details
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [location, setLocation] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState<"total" | "weekly" | "per_welder">("total");
  const [shiftPattern, setShiftPattern] = useState<"day" | "night" | "rotating">("day");
  const [overtimeAllowed, setOvertimeAllowed] = useState(true);

  // Requirements
  const [totalWelders, setTotalWelders] = useState("");
  const [leadWeldersNeeded, setLeadWeldersNeeded] = useState("");
  const [experienceMin, setExperienceMin] = useState("");
  const [processesNeeded, setProcessesNeeded] = useState<string[]>([]);
  const [certsRequired, setCertsRequired] = useState<string[]>([]);
  const [positionsNeeded, setPositionsNeeded] = useState<string[]>([]);
  const [teamBalancing, setTeamBalancing] = useState<"skills" | "experience" | "mixed">("mixed");

  // Available Welders
  const [selectedWelders, setSelectedWelders] = useState<string[]>([]);

  // Fetch available candidates (welders who have applied)
  const { data: availableWelders = [], isLoading: loadingWelders } = useQuery({
    queryKey: ["employer_candidates_for_crew", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return [];

      // Get applications for this employer's jobs
      const { data: applications, error } = await supabase
        .from("applications")
        .select(`
          welder_id,
          welder_profiles!inner(
            id,
            user_id,
            years_experience,
            weld_processes,
            weld_positions,
            city,
            state,
            desired_salary_min
          )
        `)
        .eq("status", "reviewing")
        .limit(50);

      if (error) throw error;

      // Get profile names
      const welderIds = [...new Set(applications?.map((a: { welder_profiles: { user_id: string } }) => a.welder_profiles.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", welderIds);

      const profileMap = new Map(profiles?.map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]) || []);

      // Get certifications
      const welderProfileIds = [...new Set(applications?.map((a: { welder_profiles: { id: string } }) => a.welder_profiles.id) || [])];
      const { data: certs } = await supabase
        .from("certifications")
        .select("welder_id, cert_type")
        .in("welder_id", welderProfileIds)
        .eq("verification_status", "verified");

      const certMap = new Map<string, string[]>();
      certs?.forEach((c: { welder_id: string; cert_type: string }) => {
        if (!certMap.has(c.welder_id)) {
          certMap.set(c.welder_id, []);
        }
        certMap.get(c.welder_id)?.push(c.cert_type);
      });

      // Map to CrewOptimizerWelder format
      return applications?.map((app: { welder_profiles: { id: string; user_id: string; years_experience: number | null; weld_processes: string[] | null; weld_positions: string[] | null; city: string | null; state: string | null; desired_salary_min: number | null } }) => ({
        id: app.welder_profiles.id,
        name: profileMap.get(app.welder_profiles.user_id) || "Unknown",
        processes: app.welder_profiles.weld_processes || [],
        certs: certMap.get(app.welder_profiles.id) || [],
        positions: app.welder_profiles.weld_positions || [],
        experience: app.welder_profiles.years_experience || 0,
        hourlyRate: app.welder_profiles.desired_salary_min || 25,
        location: app.welder_profiles.city && app.welder_profiles.state
          ? `${app.welder_profiles.city}, ${app.welder_profiles.state}`
          : undefined,
      })) || [];
    },
    enabled: !!employerProfile?.id,
  });

  const toggleProcess = (process: string) => {
    setProcessesNeeded((prev) =>
      prev.includes(process) ? prev.filter((p) => p !== process) : [...prev, process]
    );
  };

  const toggleCert = (cert: string) => {
    setCertsRequired((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const togglePosition = (pos: string) => {
    setPositionsNeeded((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const toggleWelder = (welderId: string) => {
    setSelectedWelders((prev) =>
      prev.includes(welderId)
        ? prev.filter((w) => w !== welderId)
        : [...prev, welderId]
    );
  };

  const selectAllWelders = () => {
    if (selectedWelders.length === availableWelders.length) {
      setSelectedWelders([]);
    } else {
      setSelectedWelders(availableWelders.map((w: CrewOptimizerWelder) => w.id));
    }
  };

  const handleOptimize = async () => {
    if (!projectName || !projectType || !location || !totalWelders || selectedWelders.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in project details and select welders",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const selectedWelderData = availableWelders.filter((w: CrewOptimizerWelder) =>
        selectedWelders.includes(w.id)
      );

      const response = await optimizeCrew({
        projectName,
        projectType,
        location,
        durationWeeks: parseInt(durationWeeks) || 8,
        budget: budget ? parseFloat(budget) : undefined,
        budgetType,
        shiftPattern,
        overtimeAllowed,
        totalWelders: parseInt(totalWelders),
        leadWeldersNeeded: parseInt(leadWeldersNeeded) || 1,
        processesNeeded,
        certsRequired,
        positionsNeeded,
        experienceMin: parseInt(experienceMin) || 0,
        teamBalancing,
        availableWelders: selectedWelderData,
        employerId: employerProfile?.id,
      });

      if (response.success) {
        setResults(response);
      } else {
        throw new Error("Optimization failed");
      }
    } catch (error) {
      console.error("Crew optimization error:", error);
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize crew. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
  };

  if (isOptimizing) {
    return (
      <DashboardLayout userType="employer">
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <WeldingLoadingAnimation
            message="Optimizing crew selection..."
            variant="spark"
            size="lg"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="employer">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Crew Optimizer</h1>
              <p className="text-muted-foreground">
                Build the perfect welding team for your project
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by AI
          </Badge>
        </div>

        {!results ? (
          <div className="space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Step 1: Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Refinery Maintenance Project"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project Type</Label>
                    <Select value={projectType} onValueChange={setProjectType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Houston, TX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (weeks)</Label>
                    <Input
                      type="number"
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(e.target.value)}
                      placeholder="8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Pattern</Label>
                    <Select value={shiftPattern} onValueChange={(v) => setShiftPattern(v as typeof shiftPattern)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFT_PATTERNS.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Budget</Label>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget Type</Label>
                    <Select value={budgetType} onValueChange={(v) => setBudgetType(v as typeof budgetType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={overtimeAllowed}
                    onCheckedChange={setOvertimeAllowed}
                  />
                  <Label>Overtime Allowed</Label>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Step 2: Welding Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Total Welders Needed</Label>
                    <Input
                      type="number"
                      value={totalWelders}
                      onChange={(e) => setTotalWelders(e.target.value)}
                      placeholder="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Welders</Label>
                    <Input
                      type="number"
                      value={leadWeldersNeeded}
                      onChange={(e) => setLeadWeldersNeeded(e.target.value)}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Experience (years)</Label>
                    <Input
                      type="number"
                      value={experienceMin}
                      onChange={(e) => setExperienceMin(e.target.value)}
                      placeholder="3"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Required Processes</Label>
                  <div className="flex flex-wrap gap-2">
                    {WELD_PROCESSES_FULL.map((p) => (
                      <Badge
                        key={p.id}
                        variant={processesNeeded.includes(p.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleProcess(p.id)}
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Required Certifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS_LIST.map((c) => (
                      <Badge
                        key={c.id}
                        variant={certsRequired.includes(c.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCert(c.id)}
                      >
                        {c.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Team Balancing</Label>
                  <Select value={teamBalancing} onValueChange={(v) => setTeamBalancing(v as typeof teamBalancing)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_BALANCING.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Available Welders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Step 3: Select Available Welders
                </CardTitle>
                <CardDescription>
                  Select from your candidate pool
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingWelders ? (
                  <div className="flex items-center justify-center py-8">
                    <WeldingLoadingAnimation message="Loading candidates..." size="sm" />
                  </div>
                ) : availableWelders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No candidates available</p>
                    <p className="text-sm">Review applications to add candidates to your pool</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedWelders.length === availableWelders.length}
                          onCheckedChange={selectAllWelders}
                        />
                        <span className="text-sm">
                          Select All ({availableWelders.length} welders)
                        </span>
                      </div>
                      <Badge variant="outline">
                        {selectedWelders.length} selected
                      </Badge>
                    </div>

                    <ScrollArea className="h-64 border rounded-lg p-3">
                      <div className="space-y-2">
                        {availableWelders.map((welder: CrewOptimizerWelder) => (
                          <div
                            key={welder.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedWelders.includes(welder.id)
                                ? "bg-accent/10 border-accent"
                                : "hover:bg-muted"
                            )}
                            onClick={() => toggleWelder(welder.id)}
                          >
                            <Checkbox
                              checked={selectedWelders.includes(welder.id)}
                              onCheckedChange={() => toggleWelder(welder.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{welder.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {welder.experience}yr exp • {welder.processes.join(", ") || "No processes listed"}
                              </div>
                              {welder.location && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {welder.location}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${welder.hourlyRate}/hr</div>
                              {welder.certs.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {welder.certs.slice(0, 2).map((c) => (
                                    <Badge key={c} variant="outline" className="text-xs">
                                      {c}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleOptimize}
                    disabled={selectedWelders.length === 0 || !projectName || !totalWelders}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Optimize Crew
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard
                label="Team Synergy"
                value={`${results.optimization.crewSummary.teamSynergyScore}%`}
                variant="info"
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <StatCard
                label="Budget Status"
                value={results.optimization.costProjection.withinBudget ? "✅ Under" : "⚠️ Over"}
                variant={results.optimization.costProjection.withinBudget ? "success" : "warning"}
                icon={<DollarSign className="w-5 h-5" />}
              />
              <StatCard
                label="Risk Level"
                value={results.optimization.riskAnalysis.overallRisk.toUpperCase()}
                variant={
                  results.optimization.riskAnalysis.overallRisk === "low"
                    ? "success"
                    : results.optimization.riskAnalysis.overallRisk === "medium"
                    ? "warning"
                    : "danger"
                }
                icon={<AlertTriangle className="w-5 h-5" />}
              />
              <StatCard
                label="Crew Size"
                value={results.optimization.crewSummary.totalSelected}
                variant="info"
                icon={<Users className="w-5 h-5" />}
              />
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm">{results.optimization.summary}</p>
              </CardContent>
            </Card>

            {/* Recommended Crew */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Recommended Crew
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.optimization.recommendedCrew.map((member) => (
                    <div
                      key={member.welderId}
                      className={cn(
                        "flex items-start gap-4 p-4 border rounded-lg",
                        member.role === "lead" && "bg-yellow-50 dark:bg-yellow-950 border-yellow-200"
                      )}
                    >
                      <div className="shrink-0">
                        <ScoreCircle score={member.matchScore} size="sm" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {member.role === "lead" && <Star className="w-4 h-4 text-yellow-600" />}
                          <span className="font-medium">{member.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {member.selectionReason}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {member.primaryTasks.map((task, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {task}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Shift: {member.assignedShift}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  Cost Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Weekly Labor</div>
                    <div className="text-xl font-bold">
                      ${results.optimization.costProjection.estimatedWeeklyLabor.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Labor</div>
                    <div className="text-xl font-bold">
                      ${results.optimization.costProjection.estimatedTotalLabor.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Est. Overtime</div>
                    <div className="text-xl font-bold">
                      ${results.optimization.costProjection.estimatedOvertime.toLocaleString()}
                    </div>
                  </div>
                  <div className={cn(
                    "text-center p-4 rounded-lg",
                    results.optimization.costProjection.withinBudget
                      ? "bg-green-50 dark:bg-green-950"
                      : "bg-red-50 dark:bg-red-950"
                  )}>
                    <div className="text-sm text-muted-foreground">Variance</div>
                    <div className={cn(
                      "text-xl font-bold",
                      results.optimization.costProjection.budgetVariance > 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}>
                      {results.optimization.costProjection.budgetVariance > 0 ? "+" : ""}
                      ${Math.abs(results.optimization.costProjection.budgetVariance).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risks */}
            {results.optimization.riskAnalysis.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Risks & Mitigations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.optimization.riskAnalysis.risks.map((risk, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "mb-2",
                                risk.severity === "high"
                                  ? "border-red-500 text-red-600"
                                  : risk.severity === "medium"
                                  ? "border-yellow-500 text-yellow-600"
                                  : "border-green-500 text-green-600"
                              )}
                            >
                              {risk.severity.toUpperCase()}
                            </Badge>
                            <h4 className="font-medium">{risk.type}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {risk.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded">
                          <p className="text-sm">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Crew List
              </Button>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Send Offers
              </Button>
              <Button onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                New Optimization
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
