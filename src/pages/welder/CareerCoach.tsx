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
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useWelderProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { 
  getCareerAdvice, 
  CareerAdviceResult
} from '@/lib/weldmatch-ai';

export default function CareerCoach() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CareerAdviceResult | null>(null);
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
      if (!user?.id) return;
      const { data } = await supabase
        .from('certifications')
        .select('cert_type')
        .eq('welder_id', user.id)
        .eq('verification_status', 'verified');
      setCertifications(data?.map(c => c.cert_type) || []);
    }
    fetchCerts();
  }, [user?.id]);

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

      setResult(response);
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

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-gray-100 text-gray-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'experienced': return 'bg-green-100 text-green-700';
      case 'expert': return 'bg-purple-100 text-purple-700';
      case 'master': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'text-red-600 bg-red-100';
      case 'short-term': return 'text-yellow-600 bg-yellow-100';
      case 'long-term': return 'text-blue-600 bg-blue-100';
      default: return 'text-muted-foreground bg-muted';
    }
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Your AI Career Coach
            </h1>
            <p className="text-muted-foreground">
              Personalized guidance to accelerate your welding career
            </p>
          </div>
          <Button
            onClick={getCareerCoaching}
            disabled={isLoading}
            variant="outline"
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
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Analyzing your career trajectory...</p>
            <p className="text-muted-foreground">This may take a moment</p>
          </div>
        ) : error && !result ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={getCareerCoaching}>Try Again</Button>
            </CardContent>
          </Card>
        ) : result ? (
          <>
            {/* Career Assessment Header */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Career Level</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getLevelBadgeColor(result.careerAssessment.currentLevel)}>
                          {result.careerAssessment.currentLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm">{result.careerAssessment.marketPosition}</p>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Career Trajectory</p>
                      <p className="text-sm font-medium mt-1">
                        {result.careerAssessment.careerTrajectory}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Salary Insights */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Salary Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative pt-6">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>${(result.salaryInsights.currentMarketRange.min / 1000).toFixed(0)}K</span>
                      <span>${(result.salaryInsights.currentMarketRange.max / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full relative overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                        style={{ 
                          left: '0%',
                          width: '100%'
                        }}
                      />
                    </div>
                    {/* Your Value Marker */}
                    <div 
                      className="absolute -top-1 flex flex-col items-center"
                      style={{ 
                        left: `${Math.min(100, Math.max(0, 
                          ((result.salaryInsights.yourEstimatedValue - result.salaryInsights.currentMarketRange.min) / 
                          (result.salaryInsights.currentMarketRange.max - result.salaryInsights.currentMarketRange.min)) * 100
                        ))}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="w-0.5 h-4 bg-primary" />
                      <Badge className="mt-1 bg-primary text-primary-foreground">
                        Your Value: ${(result.salaryInsights.yourEstimatedValue / 1000).toFixed(0)}K
                      </Badge>
                    </div>
                    {/* Potential Marker */}
                    <div 
                      className="absolute -top-1 flex flex-col items-center"
                      style={{ 
                        left: `${Math.min(100, Math.max(0, 
                          ((result.salaryInsights.potentialWithUpgrades - result.salaryInsights.currentMarketRange.min) / 
                          (result.salaryInsights.currentMarketRange.max - result.salaryInsights.currentMarketRange.min)) * 100
                        ))}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <div className="w-0.5 h-4 bg-green-600" />
                      <Badge variant="outline" className="mt-1 border-green-600 text-green-600">
                        Potential: ${(result.salaryInsights.potentialWithUpgrades / 1000).toFixed(0)}K
                      </Badge>
                    </div>
                  </div>
                  
                  {result.salaryInsights.topPayingSpecializations?.length > 0 && (
                    <div className="pt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Top-Paying Paths:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.salaryInsights.topPayingSpecializations.map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {spec.name}: {spec.salaryRange}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="roadmap" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="roadmap">
                  <Award className="h-4 w-4 mr-2" />
                  Certifications
                </TabsTrigger>
                <TabsTrigger value="actions">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Action Plan
                </TabsTrigger>
                <TabsTrigger value="paths">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Career Paths
                </TabsTrigger>
                <TabsTrigger value="opportunities">
                  <Flame className="h-4 w-4 mr-2" />
                  Opportunities
                </TabsTrigger>
              </TabsList>

              {/* Certification Roadmap */}
              <TabsContent value="roadmap">
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
                    <div className="relative">
                      {/* Timeline */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                      
                      <div className="space-y-6">
                        {result.certificationRoadmap?.map((cert, index) => (
                          <div key={index} className="relative pl-10">
                            {/* Timeline dot */}
                            <div className={`absolute left-2.5 w-4 h-4 rounded-full border-2 ${
                              cert.priority === 'immediate' 
                                ? 'bg-red-500 border-red-600' 
                                : cert.priority === 'short-term'
                                ? 'bg-yellow-500 border-yellow-600'
                                : 'bg-blue-500 border-blue-600'
                            }`} />
                            
                            <Card className="border-l-4" style={{
                              borderLeftColor: cert.priority === 'immediate' 
                                ? 'rgb(239 68 68)' 
                                : cert.priority === 'short-term' 
                                ? 'rgb(234 179 8)'
                                : 'rgb(59 130 246)'
                            }}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium flex items-center gap-2">
                                      {cert.certification}
                                      <Badge className={getPriorityColor(cert.priority)}>
                                        {cert.priority.replace('-', ' ').toUpperCase()}
                                      </Badge>
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {cert.reason}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-green-600 border-green-300">
                                    {cert.expectedROI}
                                  </Badge>
                                </div>
                                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {cert.timeToComplete}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {cert.estimatedCost}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Action Plan */}
              <TabsContent value="actions">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* This Week */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        This Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.actionPlan?.thisWeek?.map((action, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleAction(`week-${i}`)}
                          >
                            <Checkbox 
                              checked={checkedActions.has(`week-${i}`)} 
                              onCheckedChange={() => toggleAction(`week-${i}`)}
                            />
                            <span className={`text-sm ${checkedActions.has(`week-${i}`) ? 'line-through text-muted-foreground' : ''}`}>
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* This Month */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.actionPlan?.thisMonth?.map((action, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleAction(`month-${i}`)}
                          >
                            <Checkbox 
                              checked={checkedActions.has(`month-${i}`)} 
                              onCheckedChange={() => toggleAction(`month-${i}`)}
                            />
                            <span className={`text-sm ${checkedActions.has(`month-${i}`) ? 'line-through text-muted-foreground' : ''}`}>
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* This Quarter */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        This Quarter
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.actionPlan?.thisQuarter?.map((action, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleAction(`quarter-${i}`)}
                          >
                            <Checkbox 
                              checked={checkedActions.has(`quarter-${i}`)} 
                              onCheckedChange={() => toggleAction(`quarter-${i}`)}
                            />
                            <span className={`text-sm ${checkedActions.has(`quarter-${i}`) ? 'line-through text-muted-foreground' : ''}`}>
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* This Year */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        This Year
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.actionPlan?.thisYear?.map((action, i) => (
                          <div 
                            key={i} 
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleAction(`year-${i}`)}
                          >
                            <Checkbox 
                              checked={checkedActions.has(`year-${i}`)} 
                              onCheckedChange={() => toggleAction(`year-${i}`)}
                            />
                            <span className={`text-sm ${checkedActions.has(`year-${i}`) ? 'line-through text-muted-foreground' : ''}`}>
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Career Paths */}
              <TabsContent value="paths">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {result.careerPaths?.map((path, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{path.path}</CardTitle>
                        <CardDescription>{path.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Requirements:</p>
                          <div className="flex flex-wrap gap-1">
                            {path.requirements?.map((req, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Salary Range</p>
                            <p className="font-medium text-green-600">{path.salaryRange}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Timeframe</p>
                            <p className="font-medium">{path.timeframe}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Market Opportunities */}
              <TabsContent value="opportunities">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        Hot Industries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.marketOpportunities?.hotIndustries?.map((industry, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">{industry}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-500" />
                        Growing Regions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.marketOpportunities?.growingRegions?.map((region, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{region}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        Emerging Tech
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.marketOpportunities?.emergingTechnologies?.map((tech, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">{tech}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Motivational Note */}
                {result.motivationalNote && (
                  <Card className="mt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <CardContent className="p-6">
                      <p className="text-lg italic text-center">
                        "{result.motivationalNote}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Get Personalized Career Advice</h3>
              <p className="text-muted-foreground mb-4">
                Our AI will analyze your profile and provide tailored recommendations
              </p>
              <Button onClick={getCareerCoaching} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Career Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
