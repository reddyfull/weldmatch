import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useApplyToJob } from '@/hooks/useApplyToJob';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Award,
  CheckCircle,
  Building,
  Filter,
  Loader2,
  Send,
  Star,
  HelpCircle,
  Globe,
} from 'lucide-react';
import { WELD_PROCESSES, WELD_POSITIONS } from '@/constants/welderOptions';
import { SkillsGapModal } from '@/components/welder/SkillsGapModal';
import { ExternalJobsList } from '@/components/welder/ExternalJobsList';

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
  created_at: string | null;
  employer_profiles: {
    id: string;
    company_name: string;
    logo_url: string | null;
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

export default function WelderJobs() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { apply, applying } = useApplyToJob();

  // Tab state
  const [activeTab, setActiveTab] = useState('weldmatch');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [welderProfile, setWelderProfile] = useState<WelderProfile | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [processFilter, setProcessFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [coverMessage, setCoverMessage] = useState('');

  // Skills Gap Modal
  const [skillsGapModalOpen, setSkillsGapModalOpen] = useState(false);
  const [skillsGapJob, setSkillsGapJob] = useState<Job | null>(null);
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch active jobs with employer info
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          employer_profiles (
            id,
            company_name,
            logo_url,
            user_id,
            profiles:user_id (
              full_name,
              phone
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs((jobsData as Job[]) || []);

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

      // Fetch existing applications
      if (welderData) {
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select('job_id')
          .eq('welder_id', welderData.id);

        if (!appsError && appsData) {
          setAppliedJobIds(new Set(appsData.map(a => a.job_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate match score locally for display
  const calculateMatchScore = (job: Job): number => {
    if (!welderProfile) return 0;

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
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatPay = (job: Job) => {
    if (job.pay_type === 'doe') return 'DOE';
    if (!job.pay_min && !job.pay_max) return 'Not specified';
    
    const suffix = PAY_TYPE_LABELS[job.pay_type || 'hourly'];
    if (job.pay_min && job.pay_max) {
      return `$${job.pay_min.toLocaleString()} - $${job.pay_max.toLocaleString()}${suffix}`;
    }
    if (job.pay_min) return `$${job.pay_min.toLocaleString()}+${suffix}`;
    if (job.pay_max) return `Up to $${job.pay_max.toLocaleString()}${suffix}`;
    return 'Not specified';
  };

  const formatLocation = (job: Job) => {
    if (job.city && job.state) return `${job.city}, ${job.state}`;
    return job.city || job.state || 'Location not specified';
  };

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.employer_profiles?.company_name.toLowerCase().includes(query);
        const matchesLocation = formatLocation(job).toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesLocation) return false;
      }

      // Location filter
      if (locationFilter) {
        const loc = formatLocation(job).toLowerCase();
        if (!loc.includes(locationFilter.toLowerCase())) return false;
      }

      // Process filter
      if (processFilter && processFilter !== 'all') {
        if (!job.required_processes?.includes(processFilter)) return false;
      }

      // Job type filter
      if (jobTypeFilter && jobTypeFilter !== 'all') {
        if (job.job_type !== jobTypeFilter) return false;
      }

      return true;
    });
  }, [jobs, searchQuery, locationFilter, processFilter, jobTypeFilter]);

  const handleOpenApply = (job: Job) => {
    setSelectedJob(job);
    setCoverMessage('');
    setApplyDialogOpen(true);
  };

  const handleOpenSkillsGap = (job: Job) => {
    setSkillsGapJob(job);
    setSkillsGapModalOpen(true);
  };

  const handleApplyFromModal = () => {
    if (skillsGapJob) {
      setSkillsGapModalOpen(false);
      handleOpenApply(skillsGapJob);
    }
  };

  const handleApply = async () => {
    if (!selectedJob || !welderProfile) return;

    const employerProfile = selectedJob.employer_profiles;
    const profiles = Array.isArray(employerProfile?.profiles) 
      ? employerProfile.profiles[0] 
      : employerProfile?.profiles;

    const result = await apply({
      jobId: selectedJob.id,
      welderId: welderProfile.id,
      coverMessage: coverMessage || undefined,
      jobData: {
        title: selectedJob.title,
        requiredCerts: selectedJob.required_certs || [],
        requiredProcesses: selectedJob.required_processes || [],
        requiredPositions: selectedJob.required_positions || [],
        experienceMin: selectedJob.experience_min || 0,
        location: formatLocation(selectedJob),
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
    });

    if (result.success) {
      setApplyDialogOpen(false);
      setAppliedJobIds(prev => new Set([...prev, selectedJob.id]));
    }
  };

  if (loading) {
    return (
      <DashboardLayout userType="welder">
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Job Search
          </h1>
          <p className="text-muted-foreground mt-1">
            Find welding jobs that match your skills and certifications
          </p>
        </div>

        {/* Tabs for WeldMatch Jobs vs External Jobs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="weldmatch" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              WeldMatch Jobs
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              External Jobs
            </TabsTrigger>
          </TabsList>

          {/* WeldMatch Jobs Tab */}
          <TabsContent value="weldmatch" className="mt-6 space-y-6">

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, companies, or locations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={processFilter} onValueChange={setProcessFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Weld Process" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Processes</SelectItem>
                  {WELD_PROCESSES.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full_time">Full-Time</SelectItem>
                  <SelectItem value="part_time">Part-Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="per_diem">Per Diem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>
          {welderProfile && (
            <Badge variant="outline" className="gap-1">
              <Star className="h-3 w-3" />
              Match scores based on your profile
            </Badge>
          )}
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium text-lg mb-2">No jobs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => {
              const matchScore = calculateMatchScore(job);
              const hasApplied = appliedJobIds.has(job.id);

              return (
                <Card key={job.id} className="flex flex-col hover:shadow-md transition-shadow group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link to={`/welder/jobs/${job.id}`}>
                          <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
                            {job.title}
                          </CardTitle>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {job.employer_profiles?.company_name || 'Company'}
                        </p>
                      </div>
                      {welderProfile && (
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`shrink-0 ${getMatchColor(matchScore)}`}>
                            {matchScore}% Match
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleOpenSkillsGap(job);
                            }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <HelpCircle className="h-3 w-3" />
                            See Why
                          </button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-2 text-sm flex-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{formatLocation(job)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4 shrink-0" />
                        <span>{formatPay(job)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{JOB_TYPE_LABELS[job.job_type]}</span>
                      </div>
                      {job.experience_min && job.experience_min > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4 shrink-0" />
                          <span>{job.experience_min}+ years experience</span>
                        </div>
                      )}
                    </div>

                    {/* Requirements */}
                    <div className="mt-4 space-y-2">
                      {job.required_processes && job.required_processes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.required_processes.slice(0, 3).map((proc) => (
                            <Badge key={proc} variant="secondary" className="text-xs">
                              {proc}
                            </Badge>
                          ))}
                          {job.required_processes.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{job.required_processes.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      {job.required_certs && job.required_certs.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.required_certs.slice(0, 2).map((cert) => (
                            <Badge key={cert} variant="outline" className="text-xs">
                              <Award className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/welder/jobs/${job.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {hasApplied ? (
                        <Button disabled variant="secondary" className="flex-1">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Applied
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenApply(job);
                          }}
                          className="flex-1"
                          disabled={!welderProfile}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

          {/* Apply Dialog */}
          <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
                <DialogDescription>
                  at {selectedJob?.employer_profiles?.company_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {welderProfile && selectedJob && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Your Match Score</span>
                    <Badge className={getMatchColor(calculateMatchScore(selectedJob))}>
                      {calculateMatchScore(selectedJob)}%
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

          {/* Skills Gap Modal */}
          {skillsGapJob && welderProfile && (
            <SkillsGapModal
              isOpen={skillsGapModalOpen}
              onClose={() => setSkillsGapModalOpen(false)}
              jobId={skillsGapJob.id}
              jobTitle={skillsGapJob.title}
              companyName={skillsGapJob.employer_profiles?.company_name || 'Company'}
              jobData={{
                processes: skillsGapJob.required_processes || [],
                positions: skillsGapJob.required_positions || [],
                certifications: skillsGapJob.required_certs || [],
                experienceMin: skillsGapJob.experience_min || 0,
                location: formatLocation(skillsGapJob),
                salaryMin: skillsGapJob.pay_min,
                salaryMax: skillsGapJob.pay_max,
                description: skillsGapJob.description,
              }}
              welderData={{
                id: welderProfile.user_id,
                name: profile?.full_name || 'Welder',
                experience: welderProfile.years_experience || 0,
                processes: welderProfile.weld_processes || [],
                positions: welderProfile.weld_positions || [],
                certifications: welderProfile.certifications
                  ?.filter(c => c.verification_status === 'verified')
                  .map(c => c.cert_type) || [],
                location: `${welderProfile.city || ''}, ${welderProfile.state || ''}`.trim(),
              }}
              onApply={handleApplyFromModal}
              currentMatchScore={calculateMatchScore(skillsGapJob)}
            />
          )}
          </TabsContent>

          {/* External Jobs Tab */}
          <TabsContent value="external" className="mt-6">
            <ExternalJobsList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}