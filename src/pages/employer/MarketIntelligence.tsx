import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  DollarSign, 
  MapPin, 
  Award,
  BarChart3,
  Target,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Users,
  Building,
  Flame
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { getMarketIntelligence, MarketIntelligenceResponse } from "@/lib/ai-phase2";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { WELD_PROCESSES_FULL, CERTIFICATIONS_LIST, INDUSTRY_PREFERENCES } from "@/constants/aiFeatureOptions";
import { supabase } from "@/integrations/supabase/client";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

export default function EmployerMarketIntelligence() {
  const { user } = useAuth();
  const { data: employerProfile } = useEmployerProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCached, setIsLoadingCached] = useState(true);
  const [intelligence, setIntelligence] = useState<MarketIntelligenceResponse | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    state: employerProfile?.state || "",
    city: employerProfile?.city || "",
    industries: employerProfile?.industry ? [employerProfile.industry] : [],
    processes: [] as string[],
    certifications: [] as string[],
    experienceLevel: 'all' as 'entry' | 'mid' | 'senior' | 'all',
  });

  const updateFilter = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayFilter = (field: 'industries' | 'processes' | 'certifications', item: string) => {
    const current = filters[field];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    updateFilter(field, updated);
  };

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      if (!employerProfile?.id) {
        setIsLoadingCached(false);
        return;
      }

      try {
        // Check for cached employer market intelligence using user_id match
        const { data: cached, error } = await supabase
          .from('market_intelligence_results')
          .select('*')
          .eq('welder_id', employerProfile.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading cached intelligence:', error);
        } else if (cached?.result_data) {
          const resultData = cached.result_data as any;
          setIntelligence(resultData);
          setLastGeneratedAt(cached.updated_at);
          console.log('Loaded cached employer market intelligence');
        }
      } catch (err) {
        console.error('Failed to load cached data:', err);
      } finally {
        setIsLoadingCached(false);
      }
    };

    loadCachedData();
  }, [employerProfile?.id]);

  const fetchIntelligence = async () => {
    setIsLoading(true);
    try {
      const response = await getMarketIntelligence({
        requestType: 'comprehensive',
        userType: 'employer',
        userId: user?.id,
        state: filters.state,
        city: filters.city,
        industries: filters.industries,
        processes: filters.processes,
        certifications: filters.certifications,
        experienceLevel: filters.experienceLevel,
      });

      if (response.success) {
        setIntelligence(response);
        setLastGeneratedAt(new Date().toISOString());

        // Cache to database
        if (employerProfile?.id) {
          const { error: upsertError } = await supabase
            .from('market_intelligence_results')
            .upsert({
              welder_id: employerProfile.id,
              result_data: response as any,
              request_context: {
                userType: 'employer',
                location: { city: filters.city, state: filters.state },
                filters: {
                  industries: filters.industries,
                  processes: filters.processes,
                  certifications: filters.certifications,
                  experienceLevel: filters.experienceLevel,
                },
              },
              profile_snapshot: {
                company_name: employerProfile.company_name,
                industry: employerProfile.industry,
                city: employerProfile.city,
                state: employerProfile.state,
              },
              updated_at: new Date().toISOString(),
            }, { onConflict: 'welder_id' });

          if (upsertError) {
            console.error('Failed to cache intelligence:', upsertError);
          }
        }

        toast({
          title: "Market Data Updated",
          description: "Fresh hiring intelligence loaded.",
        });
      } else {
        throw new Error("Failed to fetch intelligence");
      }
    } catch (error) {
      console.error("Market intelligence error:", error);
      toast({
        title: "Error",
        description: "Failed to load market data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isLoadingCached) {
    return (
      <DashboardLayout userType="employer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <WeldingLoadingAnimation message={isLoadingCached ? "Loading cached data..." : "Analyzing hiring market data..."} />
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout userType="employer">
        <div className="flex items-center justify-center min-h-[60vh]">
          <WeldingLoadingAnimation message="Analyzing hiring market data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="employer">
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hiring Intelligence</h1>
              <p className="text-sm text-muted-foreground">Salary benchmarks & talent market insights</p>
            </div>
          </div>
          <Button onClick={fetchIntelligence} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {intelligence ? 'Refresh Data' : 'Load Intelligence'}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={filters.state} onValueChange={(v) => updateFilter('state', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={filters.city}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={filters.experienceLevel} onValueChange={(v: any) => updateFilter('experienceLevel', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="entry">Entry (0-2 yrs)</SelectItem>
                    <SelectItem value="mid">Mid (3-7 yrs)</SelectItem>
                    <SelectItem value="senior">Senior (8+ yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="mb-2 block text-sm">Required Processes</Label>
                <div className="flex flex-wrap gap-1.5">
                  {WELD_PROCESSES_FULL.map((process) => (
                    <Badge
                      key={process.id}
                      variant={filters.processes.includes(process.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayFilter('processes', process.id)}
                    >
                      {process.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-sm">Required Certifications</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CERTIFICATIONS_LIST.slice(0, 6).map((cert) => (
                    <Badge
                      key={cert.id}
                      variant={filters.certifications.includes(cert.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayFilter('certifications', cert.id)}
                    >
                      {cert.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!intelligence ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Loaded</h3>
              <p className="text-muted-foreground mb-4">
                Click "Load Intelligence" to fetch current hiring market data.
              </p>
              <Button onClick={fetchIntelligence}>
                <Sparkles className="w-4 h-4 mr-2" />
                Load Hiring Intelligence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
              <TabsTrigger value="talent">Talent Pool</TabsTrigger>
              <TabsTrigger value="competition">Competition</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Market Demand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        intelligence.intelligence.marketOverview.demandLevel === 'Hot' ? 'bg-red-500' :
                        intelligence.intelligence.marketOverview.demandLevel === 'Strong' ? 'bg-orange-500' :
                        'bg-yellow-500'
                      } text-white`}>
                        {intelligence.intelligence.marketOverview.demandLevel === 'Hot' && <Flame className="w-3 h-3 mr-1" />}
                        {intelligence.intelligence.marketOverview.demandLevel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Median Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold">{intelligence.intelligence.salaryIntelligence.medianHourly}</span>
                      <span className="text-muted-foreground">/hr</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Rate Range</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      ${intelligence.intelligence.salaryIntelligence.range.low} - ${intelligence.intelligence.salaryIntelligence.range.high}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">YoY Change</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {intelligence.intelligence.salaryIntelligence.trendDirection === 'up' ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : intelligence.intelligence.salaryIntelligence.trendDirection === 'down' ? (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      ) : (
                        <Minus className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="text-lg font-semibold">
                        {intelligence.intelligence.salaryIntelligence.yearOverYearChange}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Market Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{intelligence.intelligence.marketOverview.marketSummary}</p>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Key Market Drivers</h4>
                    <div className="flex flex-wrap gap-2">
                      {intelligence.intelligence.marketOverview.keyDrivers.map((driver, i) => (
                        <Badge key={i} variant="secondary">{driver}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {intelligence.intelligence.marketAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-accent" />
                      Hiring Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {intelligence.intelligence.marketAlerts.map((alert, i) => (
                      <div key={i} className={`p-3 rounded-lg border-l-4 ${
                        alert.type === 'opportunity' ? 'border-l-green-500 bg-green-50' :
                        alert.type === 'warning' ? 'border-l-red-500 bg-red-50' :
                        'border-l-blue-500 bg-blue-50'
                      }`}>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="compensation" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rates by Experience</CardTitle>
                    <CardDescription>What to offer at each level</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(intelligence.intelligence.salaryIntelligence?.byExperience || []).map((level: any, i) => {
                      const hourlyMid = typeof level.hourlyLow === 'number' && typeof level.hourlyHigh === 'number'
                        ? Math.round((level.hourlyLow + level.hourlyHigh) / 2)
                        : (typeof level.median === 'number' ? level.median : 0);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{level.level}</span>
                            <span className="text-accent font-semibold">${hourlyMid}/hr</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={((hourlyMid - 20) / 60) * 100} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground w-24">
                              ${typeof level.hourlyLow === 'number' ? level.hourlyLow : level.range?.low || 'N/A'} - ${typeof level.hourlyHigh === 'number' ? level.hourlyHigh : level.range?.high || 'N/A'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certification Premiums</CardTitle>
                    <CardDescription>Additional pay for certified welders</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(intelligence.intelligence.salaryIntelligence?.byCertification || []).map((cert: any, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-accent" />
                          <span>{cert.certification}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-green-600 font-semibold">
                            +${typeof cert.salaryPremium === 'number' ? Math.round(cert.salaryPremium / 2080) : (cert.premium || 0)}/hr
                          </span>
                          <p className="text-xs text-muted-foreground">{cert.demandLevel || 'High demand'}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Industry Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(intelligence.intelligence.salaryIntelligence?.byIndustry || []).map((ind: any, i) => (
                      <div key={i} className="p-3 rounded-lg border text-center">
                        <p className="font-medium">{ind.industry}</p>
                        <p className="text-2xl font-bold text-accent">
                          ${typeof ind.medianHourly === 'number' ? ind.medianHourly : (ind.median || 'N/A')}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          {typeof ind.premiumPercent === 'number' && ind.premiumPercent > 0 && <TrendingUp className="w-3 h-3 text-green-500" />}
                          {typeof ind.premiumPercent === 'number' && ind.premiumPercent < 0 && <TrendingDown className="w-3 h-3 text-red-500" />}
                          {typeof ind.premiumPercent === 'number' 
                            ? (ind.premiumPercent > 0 ? `+${ind.premiumPercent}%` : `${ind.premiumPercent}%`)
                            : (ind.trend === 'up' ? 'Rising' : ind.trend === 'down' ? 'Falling' : 'Stable')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="talent" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-accent" />
                      In-Demand Skills
                    </CardTitle>
                    <CardDescription>Most sought-after skills in the market</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {intelligence.intelligence.demandAnalysis.hotSkills.map((skill, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{skill.skill}</span>
                          <span className="text-accent">{skill.premiumPotential} premium</span>
                        </div>
                        <Progress value={skill.demandScore} className="h-2" />
                        <p className="text-xs text-muted-foreground">{skill.growthRate} growth</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      Talent Hotspots
                    </CardTitle>
                    <CardDescription>Where to find skilled welders</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {intelligence.intelligence.demandAnalysis.hotLocations.map((loc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{loc.location}</p>
                          <p className="text-xs text-muted-foreground">Cost of Living: {loc.costOfLiving}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${loc.averagePay}/hr avg</p>
                          <Progress value={loc.demandScore} className="h-1 w-16" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="competition" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Industry Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {intelligence.intelligence.industryInsights.map((insight, i) => (
                    <div key={i} className="p-4 rounded-lg border">
                      <h4 className="font-semibold text-lg">{insight.industry}</h4>
                      <p className="text-muted-foreground mt-1">{insight.overview}</p>
                      <div className="mt-3">
                        <p className="text-sm"><span className="font-medium">Outlook:</span> {insight.outlook}</p>
                        {insight.topEmployers.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Top Employers: </span>
                            <span className="text-sm text-muted-foreground">{insight.topEmployers.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-accent/5 border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Hiring Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {intelligence.intelligence.personalizedInsights.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          item.priority === 'high' ? 'bg-red-500' :
                          item.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">{item.impact}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
