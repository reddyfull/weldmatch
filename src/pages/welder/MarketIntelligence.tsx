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
  CheckCircle,
  Clock,
  Flame,
  Database
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile } from "@/hooks/useUserProfile";
import { getMarketIntelligence, MarketIntelligenceResponse } from "@/lib/ai-phase2";
import { toast } from "@/hooks/use-toast";
import { WeldingLoadingAnimation } from "@/components/ai/WeldingLoadingAnimation";
import { WELD_PROCESSES_FULL, CERTIFICATIONS_LIST, INDUSTRY_PREFERENCES } from "@/constants/aiFeatureOptions";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

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

function DemandBadge({ level, trend }: { level: string; trend: string }) {
  const getColor = () => {
    switch (level.toLowerCase()) {
      case 'hot': return 'bg-red-500';
      case 'strong': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      case 'cooling': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const TrendIcon = trend === 'Increasing' ? TrendingUp : trend === 'Decreasing' ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${getColor()} text-white`}>
        {level === 'Hot' && <Flame className="w-3 h-3 mr-1" />}
        {level}
      </Badge>
      <span className="flex items-center text-sm text-muted-foreground">
        <TrendIcon className="w-4 h-4 mr-1" />
        {trend}
      </span>
    </div>
  );
}

function SalaryGauge({ current, market }: { current?: number; market?: { low: number; median: number; high: number } }) {
  // Defensive check for undefined market data
  if (!market || typeof market.low !== 'number' || typeof market.median !== 'number' || typeof market.high !== 'number') {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        Salary data not available
      </div>
    );
  }

  const percentage = current 
    ? Math.min(100, Math.max(0, ((current - market.low) / (market.high - market.low)) * 100))
    : 50;

  const getPosition = () => {
    if (!current) return 'unknown';
    if (current < market.low) return 'below';
    if (current < market.median) return 'below-median';
    if (current < market.high) return 'above-median';
    return 'top';
  };

  const position = getPosition();

  return (
    <div className="space-y-2">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between text-xs">
          <span>${market.low.toLocaleString()}</span>
          <span className="font-medium">${market.median.toLocaleString()}</span>
          <span>${market.high.toLocaleString()}</span>
        </div>
        <div className="relative h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
          {current && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md"
              style={{ left: `calc(${percentage}% - 8px)` }}
            />
          )}
        </div>
      </div>
      {current && (
        <p className="text-sm text-center">
          Your salary: <span className="font-semibold">${current.toLocaleString()}</span>
          {position === 'below' && <span className="text-red-500 ml-1">(Below market)</span>}
          {position === 'below-median' && <span className="text-yellow-600 ml-1">(Below median)</span>}
          {position === 'above-median' && <span className="text-green-600 ml-1">(Above median)</span>}
          {position === 'top' && <span className="text-green-500 ml-1">(Top earner!)</span>}
        </p>
      )}
    </div>
  );
}

export default function MarketIntelligence() {
  const { user } = useAuth();
  const { data: welderProfile } = useWelderProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCached, setIsLoadingCached] = useState(true);
  const [intelligence, setIntelligence] = useState<MarketIntelligenceResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const [filters, setFilters] = useState({
    state: welderProfile?.state || "",
    city: welderProfile?.city || "",
    industries: [] as string[],
    processes: welderProfile?.weld_processes || [],
    certifications: [] as string[],
    experienceLevel: 'all' as 'entry' | 'mid' | 'senior' | 'all',
    currentSalary: undefined as number | undefined,
    yearsExperience: welderProfile?.years_experience || 0,
  });

  // Load cached data from database on mount
  useEffect(() => {
    const loadCachedData = async () => {
      if (!welderProfile?.id) {
        setIsLoadingCached(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('market_intelligence_results')
          .select('*')
          .eq('welder_id', welderProfile.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.result_data) {
          setIntelligence(data.result_data as unknown as MarketIntelligenceResponse);
          setLastUpdated(data.updated_at);
          setIsCached(true);
          
          // Restore filters from request_context if available
          if (data.request_context) {
            const ctx = data.request_context as any;
            setFilters(prev => ({
              ...prev,
              state: ctx.state || prev.state,
              city: ctx.city || prev.city,
              industries: ctx.industries || prev.industries,
              processes: ctx.processes || prev.processes,
              certifications: ctx.certifications || prev.certifications,
              experienceLevel: ctx.experienceLevel || prev.experienceLevel,
              currentSalary: ctx.currentSalary || prev.currentSalary,
            }));
          }
        }
      } catch (error) {
        console.error("Error loading cached market intelligence:", error);
      } finally {
        setIsLoadingCached(false);
      }
    };

    loadCachedData();
  }, [welderProfile?.id]);

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

  const saveToDatabase = async (response: MarketIntelligenceResponse) => {
    if (!welderProfile?.id) return;

    const requestContext = {
      state: filters.state,
      city: filters.city,
      industries: filters.industries,
      processes: filters.processes,
      certifications: filters.certifications,
      experienceLevel: filters.experienceLevel,
      currentSalary: filters.currentSalary,
    };

    try {
      const { error } = await supabase
        .from('market_intelligence_results')
        .upsert([{
          welder_id: welderProfile.id,
          result_data: JSON.parse(JSON.stringify(response)),
          request_context: JSON.parse(JSON.stringify(requestContext)),
          profile_snapshot: JSON.parse(JSON.stringify({
            state: welderProfile.state,
            city: welderProfile.city,
            processes: welderProfile.weld_processes,
            years_experience: welderProfile.years_experience,
          })),
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'welder_id',
        });

      if (error) throw error;
      setLastUpdated(new Date().toISOString());
      setIsCached(true);
    } catch (error) {
      console.error("Error saving market intelligence:", error);
    }
  };

  const fetchIntelligence = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const response = await getMarketIntelligence({
        requestType: 'comprehensive',
        userType: 'welder',
        userId: user?.id,
        state: filters.state,
        city: filters.city,
        industries: filters.industries,
        processes: filters.processes,
        certifications: filters.certifications,
        experienceLevel: filters.experienceLevel,
        currentSalary: filters.currentSalary,
        yearsExperience: filters.yearsExperience,
        userCertifications: filters.certifications,
      });

      if (response.success) {
        setIntelligence(response);
        await saveToDatabase(response);
        toast({
          title: forceRefresh ? "Market Data Refreshed" : "Market Data Loaded",
          description: "Fresh intelligence from the market.",
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
      <DashboardLayout userType="welder">
        <div className="flex items-center justify-center min-h-[60vh]">
          <WeldingLoadingAnimation message={isLoadingCached ? "Loading cached data..." : "Analyzing market data..."} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Market Intelligence</h1>
              <p className="text-sm text-muted-foreground">Salary benchmarks, demand analysis & career insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isCached && lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Database className="w-3.5 h-3.5" />
                <span>Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</span>
              </div>
            )}
            <Button onClick={() => fetchIntelligence(true)} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {intelligence ? 'Refresh Data' : 'Load Intelligence'}
            </Button>
          </div>
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
              <div className="space-y-2">
                <Label>Your Current Salary ($)</Label>
                <Input
                  type="number"
                  value={filters.currentSalary || ''}
                  onChange={(e) => updateFilter('currentSalary', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Annual salary"
                />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="mb-2 block text-sm">Industries</Label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRY_PREFERENCES.slice(0, 6).map((ind) => (
                    <Badge
                      key={ind.id}
                      variant={filters.industries.includes(ind.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayFilter('industries', ind.id)}
                    >
                      {ind.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-sm">Processes</Label>
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
            </div>
          </CardContent>
        </Card>

        {!intelligence ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Loaded</h3>
              <p className="text-muted-foreground mb-4">
                Click "Load Intelligence" to fetch current market data based on your filters.
              </p>
              <Button onClick={() => fetchIntelligence(false)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Load Market Intelligence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="salary">Salary</TabsTrigger>
              <TabsTrigger value="demand">Demand</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="insights">Your Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Market Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Market Demand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DemandBadge 
                      level={intelligence.intelligence.marketOverview.demandLevel}
                      trend={intelligence.intelligence.marketOverview.demandTrend}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Median Hourly Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className="text-3xl font-bold">{intelligence.intelligence.salaryIntelligence.medianHourly}</span>
                      <span className="text-muted-foreground">/hr</span>
                    </div>
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
                      <span className="text-xl font-semibold">
                        {intelligence.intelligence.salaryIntelligence.yearOverYearChange}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Market Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{intelligence.intelligence.marketOverview?.marketSummary}</p>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Key Drivers</h4>
                    <div className="flex flex-wrap gap-2">
                      {(intelligence.intelligence.marketOverview?.keyDrivers || []).map((driver, i) => (
                        <Badge key={i} variant="secondary">{driver}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Alerts */}
              {(intelligence.intelligence.marketAlerts?.length || 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-accent" />
                      Market Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(intelligence.intelligence.marketAlerts || []).map((alert, i) => (
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

            <TabsContent value="salary" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Market Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <SalaryGauge 
                    current={filters.currentSalary}
                    market={intelligence.intelligence.salaryIntelligence.range}
                  />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Salary by Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(intelligence.intelligence.salaryIntelligence?.byExperience || []).map((level, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{level.level}</span>
                        <div className="text-right">
                          <span className="font-semibold">${typeof level.median === 'number' ? level.median.toLocaleString() : level.median}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            (${typeof level.range?.low === 'number' ? level.range.low.toLocaleString() : level.range?.low || 'N/A'} - ${typeof level.range?.high === 'number' ? level.range.high.toLocaleString() : level.range?.high || 'N/A'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Salary by Industry</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(intelligence.intelligence.salaryIntelligence?.byIndustry || []).map((ind, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{ind.industry}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">${typeof ind.median === 'number' ? ind.median.toLocaleString() : ind.median}</span>
                          {ind.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                          {ind.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="demand" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-accent" />
                      Hot Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(intelligence.intelligence.demandAnalysis?.hotSkills || []).map((skill, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{skill.skill}</span>
                          <span className="text-accent">{skill.premiumPotential}</span>
                        </div>
                        <Progress value={skill.demandScore || 0} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Hot Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(intelligence.intelligence.demandAnalysis?.hotIndustries || []).map((ind, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{ind.industry}</p>
                          <p className="text-xs text-muted-foreground">{ind.openPositions} open positions</p>
                        </div>
                        <Badge variant={ind.demandLevel === 'High' ? 'default' : 'secondary'}>
                          {ind.demandLevel}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      Hot Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(intelligence.intelligence.demandAnalysis?.hotLocations || []).map((loc, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{loc.location}</p>
                          <p className="text-xs text-muted-foreground">CoL: {loc.costOfLiving}</p>
                        </div>
                        <span className="font-semibold text-green-600">${loc.averagePay}/hr</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {(intelligence.intelligence.demandAnalysis?.emergingOpportunities?.length || 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Emerging Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(intelligence.intelligence.demandAnalysis?.emergingOpportunities || []).map((opp, i) => (
                        <Badge key={i} variant="outline" className="px-3 py-1">
                          <Sparkles className="w-3 h-3 mr-1 text-accent" />
                          {opp}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="certifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    Certification ROI Analysis
                  </CardTitle>
                  <CardDescription>Investment vs. return for welding certifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Certification</th>
                          <th className="text-right py-3 px-2">Cost</th>
                          <th className="text-right py-3 px-2">Time</th>
                          <th className="text-right py-3 px-2">Salary Increase</th>
                          <th className="text-right py-3 px-2">ROI</th>
                          <th className="text-center py-3 px-2">Demand</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(intelligence.intelligence.certificationROI || []).map((cert, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-2 font-medium">{cert.certification}</td>
                            <td className="py-3 px-2 text-right">${typeof cert.cost === 'number' ? cert.cost.toLocaleString() : cert.cost}</td>
                            <td className="py-3 px-2 text-right">{cert.timeToComplete}</td>
                            <td className="py-3 px-2 text-right text-green-600">+${typeof cert.salaryIncrease === 'number' ? cert.salaryIncrease.toLocaleString() : cert.salaryIncrease}</td>
                            <td className="py-3 px-2 text-right font-semibold">{cert.roi}</td>
                            <td className="py-3 px-2 text-center">
                              <Badge variant={cert.demandLevel === 'High' ? 'default' : 'secondary'}>
                                {cert.demandLevel}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-accent" />
                      Your Market Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>{intelligence.intelligence.personalizedInsights.marketPosition}</p>
                    <div>
                      <h4 className="font-medium mb-2">Salary Assessment</h4>
                      <p className="text-muted-foreground">{intelligence.intelligence.personalizedInsights.salaryAssessment}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Opportunities for You</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(intelligence.intelligence.personalizedInsights?.topOpportunities || []).map((opp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {(intelligence.intelligence.personalizedInsights?.skillGaps?.length || 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills to Develop</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {(intelligence.intelligence.personalizedInsights?.skillGaps || []).map((gap, i) => (
                        <Badge key={i} variant="outline" className="text-orange-600 border-orange-300">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(intelligence.intelligence.personalizedInsights?.actionItems || []).map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          item.priority === 'high' ? 'bg-red-500' :
                          item.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">{item.impact}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {item.timeframe}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
