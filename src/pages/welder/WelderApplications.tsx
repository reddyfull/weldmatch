import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Building,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWelderProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";

type ApplicationStatus = "new" | "reviewing" | "interview" | "offer" | "hired" | "rejected";

interface ApplicationWithJob {
  id: string;
  status: ApplicationStatus;
  match_score: number | null;
  cover_message: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  job: {
    id: string;
    title: string;
    city: string | null;
    state: string | null;
    pay_min: number | null;
    pay_max: number | null;
    pay_type: string | null;
    job_type: string;
    employer: {
      company_name: string;
      logo_url: string | null;
    };
  };
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  new: { label: "Submitted", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
  reviewing: { label: "Under Review", variant: "default", icon: <AlertCircle className="w-3 h-3" /> },
  interview: { label: "Interview", variant: "default", icon: <Calendar className="w-3 h-3" /> },
  offer: { label: "Offer", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  hired: { label: "Hired", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { label: "Not Selected", variant: "destructive", icon: <XCircle className="w-3 h-3" /> },
};

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  per_diem: "Per Diem",
};

export default function WelderApplications() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: welderProfile, isLoading: welderLoading } = useWelderProfile();
  const queryClient = useQueryClient();

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["welder_applications", welderProfile?.id],
    queryFn: async () => {
      if (!welderProfile?.id) return [];
      
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          match_score,
          cover_message,
          created_at,
          updated_at,
          rejection_reason,
          job:jobs (
            id,
            title,
            city,
            state,
            pay_min,
            pay_max,
            pay_type,
            job_type,
            employer:employer_profiles_public (
              company_name,
              logo_url
            )
          )
        `)
        .eq("welder_id", welderProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ApplicationWithJob[];
    },
    enabled: !!welderProfile?.id,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!welderLoading && !welderProfile && user) {
      navigate("/welder/profile/setup");
    }
  }, [welderProfile, welderLoading, user, navigate]);

  // Real-time subscription for application status updates
  useEffect(() => {
    if (!welderProfile?.id) return;

    const channel = supabase
      .channel('welder-applications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `welder_id=eq.${welderProfile.id}`,
        },
        (payload) => {
          console.log('Application update received:', payload);
          // Invalidate the query to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ["welder_applications", welderProfile.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [welderProfile?.id, queryClient]);

  const isLoading = authLoading || welderLoading || applicationsLoading;

  const formatPay = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    const payType = type === "hourly" ? "/hr" : "/yr";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}${payType}`;
    if (min) return `$${min.toLocaleString()}+${payType}`;
    return `Up to $${max?.toLocaleString()}${payType}`;
  };

  // Group applications by status for summary
  const statusCounts = applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <DashboardLayout userType="welder">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="welder">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your job applications
          </p>
        </div>

        {/* Status Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{applications?.length || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-primary">
                    {(statusCounts.new || 0) + (statusCounts.reviewing || 0)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interviews</p>
                  <p className="text-2xl font-bold text-accent">
                    {statusCounts.interview || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offers</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(statusCounts.offer || 0) + (statusCounts.hired || 0)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        {!applications || applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4">
                Start applying to jobs to track your applications here
              </p>
              <Button variant="hero" asChild>
                <Link to="/welder/jobs">Browse Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const statusConfig = STATUS_CONFIG[application.status];
              const pay = formatPay(
                application.job.pay_min,
                application.job.pay_max,
                application.job.pay_type
              );

              return (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Company Logo */}
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {application.job.employer?.logo_url ? (
                          <img
                            src={application.job.employer.logo_url}
                            alt={application.job.employer.company_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Job Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold truncate">
                            {application.job.title}
                          </h3>
                          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                          {application.match_score && (
                            <Badge variant="outline" className="text-primary">
                              {application.match_score}% Match
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted-foreground mb-2">
                          {application.job.employer?.company_name}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {application.job.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {application.job.city}, {application.job.state}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {JOB_TYPE_LABELS[application.job.job_type] || application.job.job_type}
                          </span>
                          {pay && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {pay}
                            </span>
                          )}
                        </div>

                        {/* Rejection Reason */}
                        {application.status === "rejected" && application.rejection_reason && (
                          <div className="mt-3 p-3 bg-destructive/10 rounded-lg text-sm">
                            <p className="text-destructive font-medium">Feedback:</p>
                            <p className="text-muted-foreground">{application.rejection_reason}</p>
                          </div>
                        )}
                      </div>

                      {/* Timeline & Actions */}
                      <div className="flex flex-col items-end gap-2 text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                        </span>
                        {application.updated_at !== application.created_at && (
                          <span className="text-xs text-muted-foreground">
                            Updated {format(new Date(application.updated_at), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
