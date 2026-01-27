import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Briefcase,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MessageSquare,
  Star,
  MapPin,
  Award,
  Mail,
  Phone,
} from "lucide-react";
import { format } from "date-fns";

type ApplicationStatus = "new" | "reviewing" | "interview" | "offer" | "hired" | "rejected";

interface Application {
  id: string;
  job_id: string;
  welder_id: string;
  status: ApplicationStatus;
  match_score: number | null;
  cover_message: string | null;
  employer_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  job: {
    id: string;
    title: string;
    city: string | null;
    state: string | null;
  };
  welder_profile: {
    id: string;
    user_id: string;
    years_experience: number | null;
    city: string | null;
    state: string | null;
    weld_processes: string[];
    weld_positions: string[];
  };
  profile: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  new: { label: "New", variant: "default", icon: <Star className="h-3 w-3" /> },
  reviewing: { label: "Reviewing", variant: "secondary", icon: <Eye className="h-3 w-3" /> },
  interview: { label: "Interview", variant: "outline", icon: <Calendar className="h-3 w-3" /> },
  offer: { label: "Offer", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  hired: { label: "Hired", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export default function EmployerCandidates() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [employerNotes, setEmployerNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch employer profile
  const { data: employerProfile } = useQuery({
    queryKey: ["employer_profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("employer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch employer's jobs for filter
  const { data: employerJobs } = useQuery({
    queryKey: ["employer_jobs_list", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("employer_id", employerProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!employerProfile?.id,
  });

  // Fetch applications with related data
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["employer_applications", employerProfile?.id],
    queryFn: async () => {
      if (!employerProfile?.id) return [];

      // First get jobs for this employer
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("employer_id", employerProfile.id);
      
      if (jobsError) throw jobsError;
      if (!jobs || jobs.length === 0) return [];

      const jobIds = jobs.map(j => j.id);

      // Then get applications for those jobs
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;
      if (!apps || apps.length === 0) return [];

      // Get job details
      const { data: jobDetails } = await supabase
        .from("jobs")
        .select("id, title, city, state")
        .in("id", jobIds);

      // Get welder profiles
      const welderIds = [...new Set(apps.map(a => a.welder_id))];
      const { data: welderProfiles } = await supabase
        .from("welder_profiles")
        .select("id, user_id, years_experience, city, state, weld_processes, weld_positions")
        .in("id", welderIds);

      // Get user profiles
      const userIds = welderProfiles?.map(w => w.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .in("id", userIds);

      // Combine data
      return apps.map(app => {
        const job = jobDetails?.find(j => j.id === app.job_id);
        const welderProfile = welderProfiles?.find(w => w.id === app.welder_id);
        const userProfile = profiles?.find(p => p.id === welderProfile?.user_id);

        return {
          ...app,
          job: job || { id: app.job_id, title: "Unknown Job", city: null, state: null },
          welder_profile: welderProfile || {
            id: app.welder_id,
            user_id: "",
            years_experience: null,
            city: null,
            state: null,
            weld_processes: [],
            weld_positions: [],
          },
          profile: userProfile || { full_name: "Unknown", phone: null, avatar_url: null },
        } as Application;
      });
    },
    enabled: !!employerProfile?.id,
  });

  // Real-time subscription for new applications
  useEffect(() => {
    if (!employerProfile?.id || !employerJobs?.length) return;

    const jobIds = employerJobs.map(j => j.id);

    const channel = supabase
      .channel('employer-applications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        (payload) => {
          // Check if this application is for one of the employer's jobs
          const newRecord = payload.new as { job_id?: string } | undefined;
          const oldRecord = payload.old as { job_id?: string } | undefined;
          const jobId = newRecord?.job_id || oldRecord?.job_id;
          
          if (jobId && jobIds.includes(jobId)) {
            console.log('Application update received for employer:', payload);
            queryClient.invalidateQueries({ queryKey: ["employer_applications", employerProfile.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employerProfile?.id, employerJobs, queryClient]);

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      applicationId, 
      status, 
      notes, 
      rejectionReason 
    }: { 
      applicationId: string; 
      status: ApplicationStatus; 
      notes?: string;
      rejectionReason?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (notes !== undefined) updateData.employer_notes = notes;
      if (rejectionReason !== undefined) updateData.rejection_reason = rejectionReason;

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) throw error;

      // Send notification to welder for significant status changes
      const notifyStatuses: ApplicationStatus[] = ["reviewing", "interview", "offer", "hired", "rejected"];
      if (notifyStatuses.includes(status)) {
        try {
          await supabase.functions.invoke("send-status-notification", {
            body: {
              applicationId,
              newStatus: status,
              rejectionReason: status === "rejected" ? rejectionReason : undefined,
            },
          });
        } catch (notifyError) {
          console.warn("Failed to send status notification:", notifyError);
          // Don't fail the status update if notification fails
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer_applications"] });
      toast({ title: "Status updated", description: "Application status has been updated successfully. The candidate has been notified." });
      setNotesDialogOpen(false);
      setSelectedApplication(null);
      setEmployerNotes("");
      setRejectionReason("");
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update status. Please try again.", variant: "destructive" });
      console.error("Update error:", error);
    },
  });

  // Redirect if not authenticated or not employer
  if (!authLoading && !user) {
    navigate("/login");
    return null;
  }

  if (!authLoading && profile?.user_type !== "employer") {
    navigate("/");
    return null;
  }

  if (!authLoading && !employerProfile) {
    navigate("/employer/profile/setup");
    return null;
  }

  const handleStatusChange = (application: Application, newStatus: ApplicationStatus) => {
    if (newStatus === "rejected") {
      setSelectedApplication(application);
      setNotesDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ applicationId: application.id, status: newStatus });
    }
  };

  const handleRejectWithReason = () => {
    if (!selectedApplication) return;
    updateStatusMutation.mutate({
      applicationId: selectedApplication.id,
      status: "rejected",
      notes: employerNotes || undefined,
      rejectionReason: rejectionReason || undefined,
    });
  };

  const handleSaveNotes = (application: Application) => {
    updateStatusMutation.mutate({
      applicationId: application.id,
      status: application.status,
      notes: employerNotes,
    });
  };

  const getMatchScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getMatchScoreBg = (score: number | null) => {
    if (!score) return "bg-muted";
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  // Filter applications
  const filteredApplications = applications?.filter(app => {
    const matchesSearch = 
      app.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesJob = jobFilter === "all" || app.job_id === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  }) || [];

  // Calculate stats
  const stats = {
    total: applications?.length || 0,
    new: applications?.filter(a => a.status === "new").length || 0,
    reviewing: applications?.filter(a => a.status === "reviewing").length || 0,
    interview: applications?.filter(a => a.status === "interview").length || 0,
    hired: applications?.filter(a => a.status === "hired").length || 0,
  };

  if (authLoading || applicationsLoading) {
    return (
      <DashboardLayout userType="employer">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="employer">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-muted-foreground">
            Review and manage applications to your job postings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Star className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.new}</p>
                  <p className="text-xs text-muted-foreground">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Eye className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.reviewing}</p>
                  <p className="text-xs text-muted-foreground">Reviewing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.interview}</p>
                  <p className="text-xs text-muted-foreground">Interview</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.hired}</p>
                  <p className="text-xs text-muted-foreground">Hired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {employerJobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Applications ({filteredApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No applications found</h3>
                <p className="text-muted-foreground mt-1">
                  {applications?.length === 0
                    ? "You haven't received any applications yet."
                    : "Try adjusting your filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {application.profile.avatar_url ? (
                                <img
                                  src={application.profile.avatar_url}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-primary">
                                  {application.profile.full_name?.charAt(0) || "?"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{application.profile.full_name || "Unknown"}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {application.welder_profile.city && application.welder_profile.state
                                  ? `${application.welder_profile.city}, ${application.welder_profile.state}`
                                  : "Location not set"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{application.job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {application.job.city}, {application.job.state}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getMatchScoreBg(application.match_score)} ${getMatchScoreColor(application.match_score)}`}
                          >
                            {application.match_score ? `${application.match_score}%` : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span>{application.welder_profile.years_experience || 0} years</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[application.status].variant} className="gap-1">
                            {STATUS_CONFIG[application.status].icon}
                            {STATUS_CONFIG[application.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(application.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setEmployerNotes(application.employer_notes || "");
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {application.profile.phone && (
                                <DropdownMenuItem asChild>
                                  <a href={`tel:${application.profile.phone}`}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Candidate
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(application, "reviewing")}
                                disabled={application.status === "reviewing"}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Mark Reviewing
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(application, "interview")}
                                disabled={application.status === "interview"}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Interview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(application, "offer")}
                                disabled={application.status === "offer"}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Send Offer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(application, "hired")}
                                disabled={application.status === "hired"}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Hired
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(application, "rejected")}
                                disabled={application.status === "rejected"}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Detail Dialog */}
        <Dialog open={!!selectedApplication && !notesDialogOpen} onOpenChange={(open) => !open && setSelectedApplication(null)}>
          <DialogContent className="max-w-2xl">
            {selectedApplication && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {selectedApplication.profile.avatar_url ? (
                        <img
                          src={selectedApplication.profile.avatar_url}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium text-primary">
                          {selectedApplication.profile.full_name?.charAt(0) || "?"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p>{selectedApplication.profile.full_name}</p>
                      <p className="text-sm font-normal text-muted-foreground">
                        Applied for {selectedApplication.job.title}
                      </p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Match Score */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Match Score</p>
                      <p className={`text-3xl font-bold ${getMatchScoreColor(selectedApplication.match_score)}`}>
                        {selectedApplication.match_score ? `${selectedApplication.match_score}%` : "N/A"}
                      </p>
                    </div>
                    <Badge variant={STATUS_CONFIG[selectedApplication.status].variant} className="gap-1">
                      {STATUS_CONFIG[selectedApplication.status].icon}
                      {STATUS_CONFIG[selectedApplication.status].label}
                    </Badge>
                  </div>

                  {/* Candidate Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">{selectedApplication.welder_profile.years_experience || 0} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {selectedApplication.welder_profile.city && selectedApplication.welder_profile.state
                          ? `${selectedApplication.welder_profile.city}, ${selectedApplication.welder_profile.state}`
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weld Processes</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedApplication.welder_profile.weld_processes?.length > 0 ? (
                          selectedApplication.welder_profile.weld_processes.map((process) => (
                            <Badge key={process} variant="secondary" className="text-xs">
                              {process}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">None listed</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Positions</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedApplication.welder_profile.weld_positions?.length > 0 ? (
                          selectedApplication.welder_profile.weld_positions.map((pos) => (
                            <Badge key={pos} variant="secondary" className="text-xs">
                              {pos}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">None listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cover Message */}
                  {selectedApplication.cover_message && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Cover Message</p>
                      <p className="p-3 rounded-lg bg-muted/50 text-sm">
                        {selectedApplication.cover_message}
                      </p>
                    </div>
                  )}

                  {/* Employer Notes */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Your Notes</p>
                    <Textarea
                      placeholder="Add notes about this candidate..."
                      value={employerNotes}
                      onChange={(e) => setEmployerNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApplication(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleSaveNotes(selectedApplication)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Save Notes
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Provide a reason for rejection (optional). This will help the candidate improve.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  placeholder="e.g., Position has been filled, Not enough experience..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Internal Notes (not visible to candidate)</label>
                <Textarea
                  placeholder="Add any internal notes..."
                  value={employerNotes}
                  onChange={(e) => setEmployerNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectWithReason}
                disabled={updateStatusMutation.isPending}
              >
                Reject Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
