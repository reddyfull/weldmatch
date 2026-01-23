import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useApplyToJob } from '@/hooks/useApplyToJob';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Award,
  CheckCircle,
  Building,
  Globe,
  Phone,
  Calendar,
  Users,
  Loader2,
  Send,
  Star,
  Flame,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { WELD_PROCESSES } from '@/constants/welderOptions';

interface Job {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  state: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: 'hourly' | 'salary' | 'doe' | null;
  job_type: 'full_time' | 'part_time' | 'contract' | 'per_diem';
  experience_min: number | null;
  required_certs: string[] | null;
  required_processes: string[] | null;
  required_positions: string[] | null;
  benefits: string[] | null;
  start_date: string | null;
  created_at: string | null;
  employer_profiles: {
    id: string;
    company_name: string;
    logo_url: string | null;
    description: string | null;
    industry: string | null;
    company_size: string | null;
    website: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    user_id: string;
    profiles: {
      full_name: string | null;
      phone: string | null;
    } | null;
  } | null;
}

interface WelderProfile {
  id: string;
  user_id: string;
  years_experience: number | null;
  weld_processes: string[] | null;
  weld_positions: string[] | null;
  city: string | null;
  state: string | null;
  certifications: {
    cert_type: string;
    verification_status: string | null;
  }[];
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  per_diem: 'Per Diem',
};

const PAY_TYPE_LABELS: Record<string, string> = {
  hourly: '/hr',
  salary: '/year',
  doe: '',
};

const PROCESS_LABELS: Record<string, string> = Object.fromEntries(
  WELD_PROCESSES.map(p => [p.id, p.label])
);

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { apply, applying } = useApplyToJob();

  const [job, setJob] = useState<Job | null>(null);
  const [welderProfile, setWelderProfile] = useState<WelderProfile | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');

  useEffect(() => {
    if (user && jobId) {
      fetchData();
    }
  }, [user, jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch job with employer info
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          employer_profiles (
            id,
            company_name,
            logo_url,
            description,
            industry,
            company_size,
            website,
            city,
            state,
            phone,
            user_id,
            profiles:user_id (
              full_name,
              phone
            )
          )
        `)
        .eq('id', jobId)
        .eq('status', 'active')
        .single();

      if (jobError) throw jobError;
      setJob(jobData as Job);

      // Fetch welder profile with certifications
      const { data: welderData, error: welderError } = await supabase
        .from('welder_profiles')
        .select(`
          *,
          certifications (
            cert_type,
            verification_status
          )
        `)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (welderError) throw welderError;
      setWelderProfile(welderData as WelderProfile | null);

      // Check if already applied
      if (welderData) {
        const { data: appData } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('welder_id', welderData.id)
          .maybeSingle();

        setHasApplied(!!appData);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
      navigate('/welder/jobs');
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = (): number => {
    if (!welderProfile || !job) return 0;

    let score = 0;
    let maxScore = 0;

    // Experience match (25 points)
    maxScore += 25;
    const expRequired = job.experience_min || 0;
    const expHave = welderProfile.years_experience || 0;
    if (expHave >= expRequired) {
      score += 25;
    } else if (expHave > 0) {
      score += Math.floor((expHave / expRequired) * 25);
    }

    // Process match (25 points)
    const reqProcesses = job.required_processes || [];
    if (reqProcesses.length > 0) {
      maxScore += 25;
      const welderProcesses = welderProfile.weld_processes || [];
      const matchedProcesses = reqProcesses.filter(p => welderProcesses.includes(p));
      score += Math.floor((matchedProcesses.length / reqProcesses.length) * 25);
    }

    // Position match (25 points)
    const reqPositions = job.required_positions || [];
    if (reqPositions.length > 0) {
      maxScore += 25;
      const welderPositions = welderProfile.weld_positions || [];
      const matchedPositions = reqPositions.filter(p => welderPositions.includes(p));
      score += Math.floor((matchedPositions.length / reqPositions.length) * 25);
    }

    // Certification match (25 points)
    const reqCerts = job.required_certs || [];
    if (reqCerts.length > 0) {
      maxScore += 25;
      const welderCerts = welderProfile.certifications
        .filter(c => c.verification_status === 'verified')
        .map(c => c.cert_type);
      const matchedCerts = reqCerts.filter(c => welderCerts.includes(c));
      score += Math.floor((matchedCerts.length / reqCerts.length) * 25);
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-amber-600 bg-amber-100 border-amber-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return 'Strong Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Possible Match';
    return 'Low Match';
  };

  const formatPay = () => {
    if (!job) return '';
    if (job.pay_type === 'doe') return 'DOE (Depends on Experience)';
    if (!job.pay_min && !job.pay_max) return 'Not specified';

    const suffix = PAY_TYPE_LABELS[job.pay_type || 'hourly'];
    if (job.pay_min && job.pay_max) {
      return `$${job.pay_min.toLocaleString()} - $${job.pay_max.toLocaleString()}${suffix}`;
    }
    if (job.pay_min) return `$${job.pay_min.toLocaleString()}+${suffix}`;
    if (job.pay_max) return `Up to $${job.pay_max.toLocaleString()}${suffix}`;
    return 'Not specified';
  };

  const formatLocation = () => {
    if (!job) return '';
    if (job.city && job.state) return `${job.city}, ${job.state}`;
    return job.city || job.state || 'Location not specified';
  };

  const handleApply = async () => {
    if (!job || !welderProfile) return;

    const employerProfile = job.employer_profiles;
    const profiles = Array.isArray(employerProfile?.profiles)
      ? employerProfile.profiles[0]
      : employerProfile?.profiles;

    const result = await apply({
      jobId: job.id,
      welderId: welderProfile.id,
      coverMessage: coverMessage || undefined,
      jobData: {
        title: job.title,
        requiredCerts: job.required_certs || [],
        requiredProcesses: job.required_processes || [],
        requiredPositions: job.required_positions || [],
        experienceMin: job.experience_min || 0,
        location: formatLocation(),
      },
      welderData: {
        name: profile?.full_name || 'Welder',
        yearsExperience: welderProfile.years_experience || 0,
        weldProcesses: welderProfile.weld_processes || [],
        weldPositions: welderProfile.weld_positions || [],
        certifications: welderProfile.certifications
          .filter(c => c.verification_status === 'verified')
          .map(c => c.cert_type),
        location: `${welderProfile.city || ''}, ${welderProfile.state || ''}`.trim(),
      },
      employerEmail: '',
      employerName: profiles?.full_name || employerProfile?.company_name || 'Employer',
    });

    if (result.success) {
      setApplyDialogOpen(false);
      setHasApplied(true);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="welder">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout userType="welder">
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-lg mb-2">Job Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This job may have been removed or is no longer active.
              </p>
              <Button asChild>
                <Link to="/welder/jobs">Browse Other Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const matchScore = calculateMatchScore();
  const employer = job.employer_profiles;

  return (
    <DashboardLayout userType="welder">
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/welder/jobs">
            <ArrowLeft className="h-4 w-4" />
            Back to Job Search
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {employer?.company_name || 'Company'}
                    </p>
                  </div>
                  {welderProfile && (
                    <div className={`px-4 py-2 rounded-lg border ${getMatchColor(matchScore)}`}>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        <span className="text-2xl font-bold">{matchScore}%</span>
                      </div>
                      <p className="text-xs font-medium">{getMatchLabel(matchScore)}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{formatLocation()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Compensation</p>
                      <p className="font-medium">{formatPay()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Job Type</p>
                      <p className="font-medium">{JOB_TYPE_LABELS[job.job_type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="font-medium">
                        {job.experience_min ? `${job.experience_min}+ years` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                {job.description ? (
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Weld Processes */}
                {job.required_processes && job.required_processes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-accent" />
                      Required Weld Processes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {job.required_processes.map((proc) => {
                        const hasSkill = welderProfile?.weld_processes?.includes(proc);
                        return (
                          <Badge
                            key={proc}
                            variant={hasSkill ? 'default' : 'secondary'}
                            className={hasSkill ? 'bg-green-600' : ''}
                          >
                            {hasSkill && <CheckCircle className="h-3 w-3 mr-1" />}
                            {PROCESS_LABELS[proc] || proc}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Weld Positions */}
                {job.required_positions && job.required_positions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Required Weld Positions</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.required_positions.map((pos) => {
                        const hasSkill = welderProfile?.weld_positions?.includes(pos);
                        return (
                          <Badge
                            key={pos}
                            variant={hasSkill ? 'default' : 'secondary'}
                            className={hasSkill ? 'bg-green-600' : ''}
                          >
                            {hasSkill && <CheckCircle className="h-3 w-3 mr-1" />}
                            {pos}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {job.required_certs && job.required_certs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Required Certifications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {job.required_certs.map((cert) => {
                        const hasCert = welderProfile?.certifications?.some(
                          c => c.cert_type === cert && c.verification_status === 'verified'
                        );
                        return (
                          <Badge
                            key={cert}
                            variant="outline"
                            className={hasCert ? 'border-green-500 text-green-700 bg-green-50' : ''}
                          >
                            {hasCert && <CheckCircle className="h-3 w-3 mr-1" />}
                            {cert}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Benefits</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((benefit) => (
                        <Badge key={benefit} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                {hasApplied ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-lg">Application Submitted</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You've already applied to this job
                    </p>
                    <Button asChild variant="outline" className="mt-4 w-full">
                      <Link to="/welder/applications">View My Applications</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => setApplyDialogOpen(true)}
                      className="w-full"
                      size="lg"
                      disabled={!welderProfile}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                    {!welderProfile && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Complete your profile to apply
                      </p>
                    )}
                    {job.start_date && (
                      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Start Date: {format(parseISO(job.start_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Company Card */}
            {employer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About the Company</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employer.logo_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {employer.company_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{employer.company_name}</h4>
                      {employer.industry && (
                        <p className="text-sm text-muted-foreground">{employer.industry}</p>
                      )}
                    </div>
                  </div>

                  {employer.description && (
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {employer.description}
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    {(employer.city || employer.state) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>
                          {employer.city && employer.state
                            ? `${employer.city}, ${employer.state}`
                            : employer.city || employer.state}
                        </span>
                      </div>
                    )}
                    {employer.company_size && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 shrink-0" />
                        <span>{employer.company_size} employees</span>
                      </div>
                    )}
                    {employer.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4 shrink-0" />
                        <a
                          href={employer.website.startsWith('http') ? employer.website : `https://${employer.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {employer.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {employer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{employer.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posted Date */}
            {job.created_at && (
              <p className="text-xs text-muted-foreground text-center">
                Posted {format(parseISO(job.created_at), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Apply Dialog */}
        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply to {job.title}</DialogTitle>
              <DialogDescription>
                at {employer?.company_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {welderProfile && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Your Match Score</span>
                  <Badge className={getMatchColor(matchScore)}>
                    {matchScore}%
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Cover Message (Optional)
                </label>
                <Textarea
                  placeholder="Tell the employer why you're a great fit for this role..."
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  A personalized message can help you stand out from other applicants.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}