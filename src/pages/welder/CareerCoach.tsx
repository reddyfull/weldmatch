import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Target,
  TrendingUp,
  Award,
  DollarSign,
  MapPin,
  Briefcase,
  Clock,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Loader2,
  Flame,
  Zap,
  GraduationCap,
  Calendar,
  ArrowRight,
  CheckCircle,
  Star,
  AlertCircle,
  Building2,
  Globe,
  Lightbulb,
  Heart,
  Trophy,
  Rocket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useWelderProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { getCareerAdvice } from '@/lib/weldmatch-ai';

// Actual API response type based on the n8n workflow
interface CareerCoachResult {
  success: boolean;
  welderId: string;
  welderName: string;
  focusArea: string;
  careerLevel: string;
  marketPosition: {
    summary: string;
    strengths: string[];
    opportunities: string[];
    competitiveRanking: string;
  };
  salaryGuidance: {
    currentMarketRange: { min: number; max: number; median: number };
    yourEstimatedValue: number;
    potentialWithUpgrades: number;
    negotiationTips: string[];
    highPayingPaths: Array<{
      path: string;
      salaryRange: string;
      requirements: string;
    }>;
  };
  certificationPlan: Array<{
    certification: string;
    priority: string;
    reason: string;
    salaryImpact: string;
    timeToComplete: string;
    estimatedCost: string;
    whereToGet: string;
  }>;
  skillsRoadmap: Array<{
    skill: string;
    currentDemand: string;
    futureOutlook: string;
    howToLearn: string;
    timeInvestment: string;
  }>;
  careerPaths: Array<{
    path: string;
    description: string;
    salaryRange: string;
    requirements: string[];
    timeframe: string;
    suitability: string;
  }>;
  weeklyActionPlan: {
    thisWeek: string[];
    thisMonth: string[];
    next3Months: string[];
  };
  marketInsights: {
    hotIndustries: string[];
    growingRegions: string[];
    emergingTechnologies: string[];
    industryTrends: string[];
  };
  personalMessage: string;
  generatedAt: string;
}

export default function CareerCoach() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CareerCoachResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [checkedActions, setCheckedActions] = useState<Set<string>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch certifications
  useEffect(() => {
    async function fetchCerts() {
      if (!welderProfile?.id) return;
      const { data } = await supabase
        .from('certifications')
        .select('cert_type')
        .eq('welder_id', welderProfile.id)
        .eq('verification_status', 'verified');
      setCertifications(data?.map(c => c.cert_type) || []);
    }
    fetchCerts();
  }, [welderProfile?.id]);

  const getCareerCoaching = useCallback(async () => {
    if (!user?.id || !welderProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch market context data
      const { data: recentJobs } = await supabase
        .from('jobs')
        .select('pay_min, pay_max, required_processes, required_certs, city, state')
        .eq('status', 'active')
        .limit(50);

      const avgSalary = recentJobs?.length 
        ? recentJobs.reduce((sum, j) => sum + ((j.pay_min || 0) + (j.pay_max || 0)) / 2, 0) / recentJobs.length
        : 65000;

      // Aggregate in-demand skills from jobs
      const skillCounts: Record<string, number> = {};
      const certCounts: Record<string, number> = {};
      const locationCounts: Record<string, number> = {};

      recentJobs?.forEach(job => {
        job.required_processes?.forEach((p: string) => {
          skillCounts[p] = (skillCounts[p] || 0) + 1;
        });
        job.required_certs?.forEach((c: string) => {
          certCounts[c] = (certCounts[c] || 0) + 1;
        });
        const loc = `${job.city}, ${job.state}`;
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });

      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill]) => skill);

      const topCerts = Object.entries(certCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cert]) => cert);

      const hotLocations = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([loc]) => loc);

      const response = await getCareerAdvice({
        welderId: user.id,
        fullName: profile?.full_name || '',
        yearsExperience: welderProfile.years_experience || 0,
        weldProcesses: welderProfile.weld_processes || [],
        weldPositions: welderProfile.weld_positions || [],
        certifications,
        location: `${welderProfile.city || ''}, ${welderProfile.state || ''}`,
        currentSalary: welderProfile.desired_salary_min,
        desiredSalary: welderProfile.desired_salary_max,
        careerGoals: welderProfile.bio,
        willingToRelocate: false,
        willingToTravel: welderProfile.willing_to_travel || false,
        recentJobsCount: recentJobs?.length || 0,
        averageJobSalary: avgSalary,
        topDemandedSkills: topSkills,
        topDemandedCerts: topCerts,
        hotLocations,
        focusArea: 'general'
      });

      // The API returns an array, get the first item
      const data = Array.isArray(response) ? response[0] : response;
      setResult(data as CareerCoachResult);
    } catch (err) {
      console.error('Career advice failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to get career advice');
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, welderProfile, certifications]);

  // Auto-load on first visit
  useEffect(() => {
    if (welderProfile && !result && !isLoading) {
      getCareerCoaching();
    }
  }, [welderProfile, result, isLoading, getCareerCoaching]);

  const toggleAction = (action: string) => {
    setCheckedActions(prev => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  const getLevelConfig = (level: string) => {
    const configs: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
      'entry': { color: 'text-blue-600', bg: 'bg-blue-100', icon: <Rocket className="h-4 w-4" />, label: 'Entry Level' },
      'intermediate': { color: 'text-green-600', bg: 'bg-green-100', icon: <TrendingUp className="h-4 w-4" />, label: 'Intermediate' },
      'experienced': { color: 'text-purple-600', bg: 'bg-purple-100', icon: <Award className="h-4 w-4" />, label: 'Experienced' },
      'expert': { color: 'text-orange-600', bg: 'bg-orange-100', icon: <Star className="h-4 w-4" />, label: 'Expert' },
      'master': { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Trophy className="h-4 w-4" />, label: 'Master' },
    };
    return configs[level] || configs['entry'];
  };

  const getPriorityConfig = (priority: string) => {
    if (priority === 'immediate') return { color: 'text-red-700', bg: 'bg-red-100', border: 'border-l-red-500' };
    if (priority === 'soon') return { color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-l-orange-500' };
    return { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-l-blue-500' };
  };

  const getDemandConfig = (demand: string) => {
    if (demand === 'very high' || demand === 'high') return { color: 'text-green-700', bg: 'bg-green-100' };
    if (demand === 'medium') return { color: 'text-yellow-700', bg: 'bg-yellow-100' };
    return { color: 'text-gray-700', bg: 'bg-gray-100' };
  };

  const dataLoading = authLoading || profileLoading || welderLoading;

  if (dataLoading) {
    return (
      <DashboardLayout userType="welder">
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48 lg:col-span-2" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Target className="h-6 w-6 text-white" />
              </div>
              AI Career Coach
            </h1>
            <p className="text-muted-foreground mt-1">
              Your personalized roadmap to welding success
            </p>
          </div>
          <Button
            onClick={getCareerCoaching}
            disabled={isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Analysis
          </Button>
        </div>

        {isLoading && !result ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative p-4 rounded-full bg-primary/10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mt-6">Analyzing Your Career...</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Our AI is reviewing market trends, salary data, and certification paths to create your personalized roadmap.
            </p>
          </div>
        ) : error && !result ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive font-medium mb-4">{error}</p>
              <Button onClick={getCareerCoaching}>Try Again</Button>
            </CardContent>
          </Card>
        ) : result ? (
          <div className="space-y-6">
            {/* Personal Message Banner */}
            <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 p-3 rounded-full bg-primary/20">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Hey {result.welderName.split(' ')[0]}! 👋</h3>
                    <p className="text-muted-foreground leading-relaxed">{result.personalMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Career Level */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Career Level</span>
                    {getLevelConfig(result.careerLevel).icon}
                  </div>
                  <div className="mt-2">
                    <Badge className={`${getLevelConfig(result.careerLevel).bg} ${getLevelConfig(result.careerLevel).color}`}>
                      {getLevelConfig(result.careerLevel).label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Your Value */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your Estimated Value</span>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    ${(result.salaryGuidance.yourEstimatedValue / 1000).toFixed(0)}K
                  </p>
                </CardContent>
              </Card>

              {/* Potential */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Potential with Upgrades</span>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    ${(result.salaryGuidance.potentialWithUpgrades / 1000).toFixed(0)}K
                  </p>
                </CardContent>
              </Card>

              {/* Market Range */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Market Range</span>
                    <Briefcase className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-lg font-semibold mt-2">
                    ${(result.salaryGuidance.currentMarketRange.min / 1000).toFixed(0)}K - ${(result.salaryGuidance.currentMarketRange.max / 1000).toFixed(0)}K
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Market Position */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-green-500" />
                    Your Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.marketPosition.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-orange-500" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.marketPosition.opportunities.map((opportunity, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="certifications" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                <TabsTrigger value="certifications" className="flex items-center gap-1.5 py-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Certifications</span>
                  <span className="sm:hidden">Certs</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center gap-1.5 py-2">
                  <Zap className="h-4 w-4" />
                  <span>Skills</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-1.5 py-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Action Plan</span>
                  <span className="sm:hidden">Actions</span>
                </TabsTrigger>
                <TabsTrigger value="paths" className="flex items-center gap-1.5 py-2">
                  <Rocket className="h-4 w-4" />
                  <span className="hidden sm:inline">Career Paths</span>
                  <span className="sm:hidden">Paths</span>
                </TabsTrigger>
                <TabsTrigger value="market" className="flex items-center gap-1.5 py-2">
                  <Globe className="h-4 w-4" />
                  <span>Market</span>
                </TabsTrigger>
              </TabsList>

              {/* Certifications Tab */}
              <TabsContent value="certifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      Certification Roadmap
                    </CardTitle>
                    <CardDescription>
                      Strategic certifications to boost your career and earnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.certificationPlan.map((cert, index) => {
                        const config = getPriorityConfig(cert.priority);
                        return (
                          <Card key={index} className={`border-l-4 ${config.border}`}>
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="font-semibold">{cert.certification}</h4>
                                    <Badge className={`${config.bg} ${config.color} text-xs`}>
                                      {cert.priority.toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                      {cert.salaryImpact}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{cert.reason}</p>
                                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {cert.timeToComplete}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      {cert.estimatedCost}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {cert.whereToGet}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* High Paying Paths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      High-Paying Specializations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {result.salaryGuidance.highPayingPaths.map((path, i) => (
                        <div key={i} className="p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground">{path.path}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{path.requirements}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-700 shrink-0">
                              {path.salaryRange}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-500" />
                      Skills Development Roadmap
                    </CardTitle>
                    <CardDescription>
                      In-demand skills to learn and master
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.skillsRoadmap.map((skill, index) => {
                        const demandConfig = getDemandConfig(skill.currentDemand);
                        return (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h4 className="font-semibold">{skill.skill}</h4>
                                    <Badge className={`${demandConfig.bg} ${demandConfig.color} text-xs`}>
                                      {skill.currentDemand.toUpperCase()} DEMAND
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    <strong>Future Outlook:</strong> {skill.futureOutlook}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    <strong>How to Learn:</strong> {skill.howToLearn}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {skill.timeInvestment}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Action Plan Tab */}
              <TabsContent value="actions">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* This Week */}
                  <Card className="border-t-4 border-t-red-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Flame className="h-5 w-5 text-red-500" />
                        This Week
                      </CardTitle>
                      <CardDescription>Immediate actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.weeklyActionPlan.thisWeek.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Checkbox
                              checked={checkedActions.has(`week-${i}`)}
                              onCheckedChange={() => toggleAction(`week-${i}`)}
                              className="mt-0.5"
                            />
                            <span className={`text-sm ${checkedActions.has(`week-${i}`) ? 'line-through text-muted-foreground' : ''}`}>
                              {action}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* This Month */}
                  <Card className="border-t-4 border-t-orange-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-5 w-5 text-orange-500" />
                        This Month
                      </CardTitle>
                      <CardDescription>30-day goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.weeklyActionPlan.thisMonth.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Checkbox
                              checked={checkedActions.has(`month-${i}`)}
                              onCheckedChange={() => toggleAction(`month-${i}`)}
                              className="mt-0.5"
                            />
                            <span className={`text-sm ${checkedActions.has(`month-${i}`) ? 'line-through text-muted-foreground' : ''}`}>
                              {action}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Next 3 Months */}
                  <Card className="border-t-4 border-t-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Target className="h-5 w-5 text-blue-500" />
                        Next 3 Months
                      </CardTitle>
                      <CardDescription>Quarterly objectives</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.weeklyActionPlan.next3Months.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Checkbox
                              checked={checkedActions.has(`quarter-${i}`)}
                              onCheckedChange={() => toggleAction(`quarter-${i}`)}
                              className="mt-0.5"
                            />
                            <span className={`text-sm ${checkedActions.has(`quarter-${i}`) ? 'line-through text-muted-foreground' : ''}`}>
                              {action}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Negotiation Tips */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Salary Negotiation Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {result.salaryGuidance.negotiationTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                          <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Career Paths Tab */}
              <TabsContent value="paths">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-indigo-500" />
                      Career Path Options
                    </CardTitle>
                    <CardDescription>
                      Potential career trajectories based on your profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.careerPaths.map((path, index) => (
                        <Card key={index} className="overflow-hidden">
                          <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-lg">{path.path}</h4>
                                <p className="text-sm text-muted-foreground">{path.description}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-700 shrink-0 self-start">
                                {path.salaryRange}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">REQUIREMENTS</p>
                                <div className="flex flex-wrap gap-2">
                                  {path.requirements.map((req, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {req}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-4 pt-2 text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {path.timeframe}
                                </span>
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-sm">
                                  <strong>Fit Analysis:</strong> {path.suitability}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Market Tab */}
              <TabsContent value="market">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Hot Industries */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Flame className="h-5 w-5 text-red-500" />
                        Hot Industries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.marketInsights.hotIndustries.map((industry, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-sm">{industry}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Growing Regions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-5 w-5 text-green-500" />
                        Growing Regions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.marketInsights.growingRegions.map((region, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm">{region}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Emerging Technologies */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-5 w-5 text-purple-500" />
                        Emerging Technologies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.marketInsights.emergingTechnologies.map((tech, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                            <span className="text-sm">{tech}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Industry Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Industry Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.marketInsights.industryTrends.map((trend, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-sm">{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Competitive Ranking */}
                <Card className="mt-4">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Your Competitive Ranking</h4>
                        <p className="text-muted-foreground">{result.marketPosition.competitiveRanking}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
