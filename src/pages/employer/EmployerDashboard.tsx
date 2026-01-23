import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Users,
  FileText,
  PlusCircle,
  Clock,
  CheckCircle,
  Eye,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile, useUserProfile } from "@/hooks/useUserProfile";

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: employerProfile, isLoading: employerLoading } = useEmployerProfile();
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Track when initial data load completes
  useEffect(() => {
    if (!employerLoading) {
      setHasInitialLoad(true);
    }
  }, [employerLoading]);

  useEffect(() => {
    // Only redirect after initial load completes AND profile is confirmed null
    if (hasInitialLoad && !employerProfile && user && !employerLoading) {
      navigate("/employer/profile/setup");
    }
  }, [employerProfile, employerLoading, user, navigate, hasInitialLoad]);

  const isLoading = authLoading || profileLoading || employerLoading;

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

  const getSubscriptionBadge = () => {
    switch (employerProfile?.subscription_status) {
      case "trial":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Free Trial</Badge>;
      case "active":
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Active</Badge>;
      case "past_due":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Past Due</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const trialDaysRemaining = employerProfile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(employerProfile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 14;

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

        {/* Subscription Status */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Subscription Status</h3>
                    {getSubscriptionBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {employerProfile?.subscription_status === "trial"
                      ? `${trialDaysRemaining} days remaining in your free trial`
                      : `Plan: ${employerProfile?.subscription_plan?.replace("_", " ")}`
                    }
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/employer/settings">Manage Subscription</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold">0</p>
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
                  <p className="text-2xl font-bold">0</p>
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
                  <p className="text-2xl font-bold">0</p>
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
                  <p className="text-2xl font-bold">0</p>
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
                <Link to="/employer/profile/edit">
                  <AlertCircle className="w-6 h-6 mb-2" />
                  <span>Edit Profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
