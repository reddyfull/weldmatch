import { useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Users,
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  Eye,
  TrendingUp,
  Sparkles,
  Zap,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile, useUserProfile } from "@/hooks/useUserProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPaidPlan, getPlanDisplayName } from "@/lib/stripe";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, subscription } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: employerProfile, isLoading: employerLoading } = useEmployerProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch real-time stats with parallel queries
  const { data: stats } = useQuery({
    queryKey: ["employer_stats", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return { activeJobs: 0, applications: 0, interviews: 0, hires: 0 };

      // First get job IDs (required for subsequent queries)
      const { data: jobIds } = await supabase
        .from("jobs")
        .select("id")
        .eq("employer_id", employerProfile.id);

      const jobIdList = jobIds?.map(j => j.id) || [];

      // If no jobs, return early
      if (jobIdList.length === 0) {
        return { activeJobs: 0, applications: 0, interviews: 0, hires: 0 };
      }

      // Start of month for hires filter
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Run ALL counts in parallel using Promise.all
      const [activeJobsResult, totalAppsResult, interviewsResult, hiresResult] = await Promise.all([
        supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("employer_id", employerProfile.id)
          .eq("status", "active"),
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .in("job_id", jobIdList),
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .in("job_id", jobIdList)
          .eq("status", "interview"),
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .in("job_id", jobIdList)
          .eq("status", "hired")
          .gte("updated_at", startOfMonth.toISOString())
      ]);

      return {
        activeJobs: activeJobsResult.count || 0,
        applications: totalAppsResult.count || 0,
        interviews: interviewsResult.count || 0,
        hires: hiresResult.count || 0,
      };
    },
    enabled: !!employerProfile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const isLoading = authLoading || profileLoading || employerLoading;

  // Memoize trial calculations
  const trialInfo = useMemo(() => {
    const trialDaysRemaining = employerProfile?.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(employerProfile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 14;
    
    return {
      trialDaysRemaining,
      trialProgress: ((14 - trialDaysRemaining) / 14) * 100,
      isTrialExpiringSoon: trialDaysRemaining <= 3,
      isTrialExpired: trialDaysRemaining === 0,
    };
  }, [employerProfile?.trial_ends_at]);

  const hasPaidSubscription = isPaidPlan(subscription.plan) && subscription.subscribed;
  const isOnTrial = !hasPaidSubscription;

  // Memoize the subscription badge function
  const getSubscriptionBadge = useCallback(() => {
    if (hasPaidSubscription) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success">
          <Sparkles className="w-3 h-3 mr-1" />
          {getPlanDisplayName(subscription.plan)}
        </Badge>
      );
    }
    if (trialInfo.isTrialExpired) {
      return <Badge variant="destructive">Trial Expired</Badge>;
    }
    if (trialInfo.isTrialExpiringSoon) {
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {trialInfo.trialDaysRemaining} days left
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
        <Clock className="w-3 h-3 mr-1" />
        Free Trial
      </Badge>
    );
  }, [hasPaidSubscription, subscription.plan, trialInfo]);

  if (isLoading) {
    return (
      <DashboardLayout userType="employer">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="employer">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {employerProfile?.company_name || "Employer"}!
            </h1>
            <p className="text-muted-foreground">
              Manage your job postings and find qualified welders
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/employer/jobs/new">
              <PlusCircle className="w-4 h-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Trial Banner - Only shown for free trial users */}
        {isOnTrial && (
          <div className={`relative overflow-hidden rounded-xl border-2 ${
            trialInfo.isTrialExpired 
              ? "bg-destructive/5 border-destructive" 
              : trialInfo.isTrialExpiringSoon 
                ? "bg-gradient-to-r from-destructive/10 via-warning/10 to-destructive/10 border-destructive/50" 
                : "bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 border-accent/30"
          }`}>
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            
            <div className="relative p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    trialInfo.isTrialExpired 
                      ? "bg-destructive/20" 
                      : trialInfo.isTrialExpiringSoon 
                        ? "bg-warning/20" 
                        : "bg-accent/20"
                  }`}>
                    {trialInfo.isTrialExpired ? (
                      <AlertTriangle className="w-7 h-7 text-destructive" />
                    ) : trialInfo.isTrialExpiringSoon ? (
                      <Zap className="w-7 h-7 text-warning animate-pulse" />
                    ) : (
                      <Clock className="w-7 h-7 text-accent" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold">
                        {trialInfo.isTrialExpired 
                          ? "Your Free Trial Has Expired" 
                          : trialInfo.isTrialExpiringSoon 
                            ? `Only ${trialInfo.trialDaysRemaining} Day${trialInfo.trialDaysRemaining !== 1 ? 's' : ''} Left!` 
                            : "Free Trial Active"
                        }
                      </h3>
                      {getSubscriptionBadge()}
                    </div>
                    <p className="text-muted-foreground">
                      {trialInfo.isTrialExpired 
                        ? "Upgrade now to continue posting jobs and connecting with qualified welders."
                        : trialInfo.isTrialExpiringSoon 
                          ? "Upgrade to Professional or Enterprise to unlock unlimited access before your trial ends."
                          : `You have ${trialInfo.trialDaysRemaining} days remaining to explore all features. Upgrade anytime to unlock unlimited access.`
                      }
                    </p>
                    
                    {/* Progress bar */}
                    {!trialInfo.isTrialExpired && (
                      <div className="max-w-md">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Day {14 - trialInfo.trialDaysRemaining} of 14</span>
                          <span>{trialInfo.trialDaysRemaining} days remaining</span>
                        </div>
                        <Progress 
                          value={trialInfo.trialProgress} 
                          className={`h-2 ${trialInfo.isTrialExpiringSoon ? "[&>div]:bg-destructive" : "[&>div]:bg-accent"}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 lg:shrink-0">
                  <Button 
                    variant={trialInfo.isTrialExpired || trialInfo.isTrialExpiringSoon ? "hero" : "default"}
                    size="lg"
                    asChild
                  >
                    <Link to="/pricing">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {trialInfo.isTrialExpired ? "Upgrade Now" : "View Plans"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  {!trialInfo.isTrialExpired && (
                    <Button variant="ghost" size="lg" asChild>
                      <Link to="/employer/settings">
                        Manage Subscription
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Subscription Badge - Shown for paid users */}
        {hasPaidSubscription && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-success/5 border border-success/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{getPlanDisplayName(subscription.plan)}</span>
                  <Badge variant="outline" className="bg-success/10 text-success border-success text-xs">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.subscriptionEnd 
                    ? `Renews ${new Date(subscription.subscriptionEnd).toLocaleDateString()}`
                    : "Full access to all features"
                  }
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/employer/settings">Manage</Link>
            </Button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold">{stats?.activeJobs ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Posted</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applications</p>
                  <p className="text-2xl font-bold">{stats?.applications ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total received</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interviews</p>
                  <p className="text-2xl font-bold">{stats?.interviews ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hires</p>
                  <p className="text-2xl font-bold">{stats?.hires ?? 0}</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Your Job Postings
              </CardTitle>
              <CardDescription>
                Manage your active job listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  You haven't posted any jobs yet
                </p>
                <Button variant="hero" asChild>
                  <Link to="/employer/jobs/new">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Post Your First Job
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Applications
              </CardTitle>
              <CardDescription>
                Review candidates who applied to your jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  No applications received yet
                </p>
                <Button variant="outline" asChild>
                  <Link to="/employer/candidates">Search Candidates</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/employer/jobs/new">
                  <PlusCircle className="w-6 h-6 mb-2" />
                  <span>Post a Job</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/employer/candidates">
                  <Users className="w-6 h-6 mb-2" />
                  <span>Search Candidates</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/employer/jobs">
                  <Eye className="w-6 h-6 mb-2" />
                  <span>View All Jobs</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link to="/employer/settings">
                  <Sparkles className="w-6 h-6 mb-2" />
                  <span>Upgrade Plan</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
