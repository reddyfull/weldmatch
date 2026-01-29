import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Briefcase,
  Eye,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile, useUserProfile } from "@/hooks/useUserProfile";
import { ProfileStrength } from "@/components/welder/ProfileStrength";

export default function WelderDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Track when initial data load completes
  useEffect(() => {
    if (!welderLoading) {
      setHasInitialLoad(true);
    }
  }, [welderLoading]);

  useEffect(() => {
    // Only redirect after initial load completes AND profile is confirmed null
    if (hasInitialLoad && !welderProfile && user && !welderLoading) {
      navigate("/welder/profile/setup");
    }
  }, [welderProfile, welderLoading, user, navigate, hasInitialLoad]);

  const isLoading = authLoading || profileLoading || welderLoading;

  if (isLoading) {
    return (
      <DashboardLayout userType="welder">
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

  const profileCompletion = welderProfile?.profile_completion || 0;
  const incompleteItems = [];
  if (!welderProfile?.city) incompleteItems.push("Add your location");
  if (!welderProfile?.weld_processes?.length) incompleteItems.push("Add weld processes");
  if (!welderProfile?.weld_positions?.length) incompleteItems.push("Add weld positions");
  if (!welderProfile?.bio) incompleteItems.push("Write a bio");
  if (!welderProfile?.desired_salary_min) incompleteItems.push("Set salary preferences");

  return (
    <DashboardLayout userType="welder">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name || "Welder"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your job search
          </p>
        </div>

        {/* External Jobs Promotion Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">100+ External Jobs Available!</h3>
                    <Badge className="bg-accent text-accent-foreground text-xs">New</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Browse welding jobs from Indeed, LinkedIn & more — all in one place
                  </p>
                </div>
              </div>
              <Button variant="hero" asChild className="shrink-0">
                <Link to="/welder/jobs?tab=external">
                  Browse External Jobs
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
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
                  <p className="text-sm text-muted-foreground">Profile Views</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applications Sent</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Total</p>
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
                  <Briefcase className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Job Matches</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">New this week</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* AI Profile Strength */}
          <ProfileStrength />

          {/* Recommended Jobs */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Recommended Jobs
              </CardTitle>
              <CardDescription>
                Jobs that match your skills and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Complete your profile to see job recommendations
                </p>
                <Button variant="hero" asChild>
                  <Link to="/welder/jobs">Browse All Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Applications
            </CardTitle>
            <CardDescription>
              Track the status of your job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't applied to any jobs yet
              </p>
              <Button variant="outline" asChild>
                <Link to="/welder/jobs">Find Jobs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
