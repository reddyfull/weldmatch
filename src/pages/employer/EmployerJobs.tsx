import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Briefcase,
  MapPin,
  Clock,
  Users,
  Eye,
  MoreVertical,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Trash2,
  Edit,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployerProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

type JobStatus = "draft" | "active" | "paused" | "filled" | "expired";
type JobType = "full_time" | "part_time" | "contract" | "per_diem";

interface Job {
  id: string;
  title: string;
  city: string | null;
  state: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: string | null;
  job_type: JobType;
  status: JobStatus;
  applications_count: number;
  views_count: number;
  created_at: string;
  expires_at: string | null;
  required_processes: string[];
  required_positions: string[];
}

const STATUS_CONFIG: Record<JobStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: { label: "Draft", variant: "secondary", icon: <Edit className="w-3 h-3" /> },
  active: { label: "Active", variant: "default", icon: <Play className="w-3 h-3" /> },
  paused: { label: "Paused", variant: "outline", icon: <Pause className="w-3 h-3" /> },
  filled: { label: "Filled", variant: "default", icon: <CheckCircle className="w-3 h-3" /> },
  expired: { label: "Expired", variant: "destructive", icon: <Clock className="w-3 h-3" /> },
};

const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  per_diem: "Per Diem",
};

export default function EmployerJobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { data: employerProfile, isLoading: employerLoading } = useEmployerProfile();
  const { toast } = useToast();
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "all">("all");

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["employer_jobs", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return [];
      
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", employerProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!employerProfile?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer_jobs"] });
      toast({ title: "Job status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer_jobs"] });
      toast({ title: "Job deleted successfully" });
      setDeleteJobId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete job", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!employerLoading && !employerProfile && user) {
      navigate("/employer/profile/setup");
    }
  }, [employerProfile, employerLoading, user, navigate]);

  const isLoading = authLoading || employerLoading || jobsLoading;

  const formatPay = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    const payType = type === "hourly" ? "/hr" : "/yr";
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}${payType}`;
    if (min) return `$${min.toLocaleString()}+${payType}`;
    return `Up to $${max?.toLocaleString()}${payType}`;
  };

  const filteredJobs = jobs?.filter(job => 
    statusFilter === "all" ? true : job.status === statusFilter
  ) || [];

  // Count jobs by status
  const statusCounts = jobs?.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <DashboardLayout userType="employer">
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
    <DashboardLayout userType="employer">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Jobs</h1>
            <p className="text-muted-foreground">
              Manage your job postings and view applicants
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/employer/jobs/new">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "all" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">All Jobs</p>
                  <p className="text-2xl font-bold">{jobs?.length || 0}</p>
                </div>
                <Briefcase className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "active" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("active")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.active || 0}</p>
                </div>
                <Play className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "draft" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("draft")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-muted-foreground">{statusCounts.draft || 0}</p>
                </div>
                <Edit className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "filled" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("filled")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Filled</p>
                  <p className="text-2xl font-bold text-primary">{statusCounts.filled || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === "all" ? "No jobs posted yet" : `No ${statusFilter} jobs`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === "all" 
                  ? "Create your first job posting to start receiving applications"
                  : "Try a different filter to see more jobs"
                }
              </p>
              {statusFilter === "all" && (
                <Button variant="hero" asChild>
                  <Link to="/employer/jobs/new">Post Your First Job</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const statusConfig = STATUS_CONFIG[job.status];
              const pay = formatPay(job.pay_min, job.pay_max, job.pay_type);

              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Job Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          {job.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.city}, {job.state}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {JOB_TYPE_LABELS[job.job_type]}
                          </span>
                          {pay && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {pay}
                            </span>
                          )}
                        </div>

                        {/* Skills Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {job.required_processes?.slice(0, 3).map((process) => (
                            <Badge key={process} variant="secondary" className="text-xs">
                              {process}
                            </Badge>
                          ))}
                          {job.required_positions?.slice(0, 2).map((position) => (
                            <Badge key={position} variant="outline" className="text-xs">
                              {position}
                            </Badge>
                          ))}
                          {(job.required_processes?.length || 0) + (job.required_positions?.length || 0) > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{(job.required_processes?.length || 0) + (job.required_positions?.length || 0) - 5} more
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span className="font-medium text-foreground">{job.applications_count}</span> applicants
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium text-foreground">{job.views_count}</span> views
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {job.applications_count > 0 && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/employer/jobs/${job.id}/applicants`}>
                              View Applicants
                            </Link>
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/employer/jobs/${job.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Job
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {job.status === "draft" && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: "active" })}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Publish Job
                              </DropdownMenuItem>
                            )}
                            
                            {job.status === "active" && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: "paused" })}
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                Pause Job
                              </DropdownMenuItem>
                            )}
                            
                            {job.status === "paused" && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: "active" })}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Resume Job
                              </DropdownMenuItem>
                            )}
                            
                            {(job.status === "active" || job.status === "paused") && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: "filled" })}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Filled
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteJobId(job.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the job posting 
                and all associated applications.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteJobId && deleteJobMutation.mutate(deleteJobId)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
