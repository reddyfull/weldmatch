import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWelderProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { ExternalJobCard } from './ExternalJobCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  Search,
  RefreshCw,
  Loader2,
  Briefcase,
  Clock,
} from 'lucide-react';

interface ExternalJob {
  id: string;
  external_id: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  salary_display: string | null;
  employment_type: string | null;
  posted_at: string | null;
  apply_link: string;
  source: string | null;
  description_snippet: string | null;
  // From interaction
  match_score?: number | null;
  match_reason?: string | null;
  status?: string;
  interaction_id?: string;
}

export function ExternalJobsList() {
  const { user } = useAuth();
  const { data: welderProfile } = useWelderProfile();
  const { toast } = useToast();
  
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, [welderProfile?.id]);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from('external_jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_at', { ascending: false })
        .limit(100);

      const { data: jobsData, error: jobsError } = await query;

      if (jobsError) throw jobsError;

      // If logged in, fetch interactions
      let interactions: Record<string, any> = {};
      if (welderProfile?.id) {
        const { data: interactionsData } = await supabase
          .from('welder_job_interactions')
          .select('*')
          .eq('welder_id', welderProfile.id);

        if (interactionsData) {
          interactions = interactionsData.reduce((acc, int) => {
            acc[int.external_job_id] = int;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combine jobs with interactions
      const combinedJobs = (jobsData || []).map(job => ({
        ...job,
        match_score: interactions[job.id]?.match_score,
        match_reason: interactions[job.id]?.match_reason,
        status: interactions[job.id]?.status || 'new',
        interaction_id: interactions[job.id]?.id,
      }));

      setJobs(combinedJobs);
    } catch (error) {
      console.error('Error fetching external jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load external jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('aggregate-external-jobs');
      if (error) throw error;
      
      await fetchJobs();
      toast({
        title: 'Jobs Refreshed',
        description: 'External jobs have been updated',
      });
    } catch (error) {
      console.error('Error refreshing jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh jobs',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user || !welderProfile) {
      toast({
        title: 'Login Required',
        description: 'Please log in to save jobs',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('welder_job_interactions')
        .upsert({
          welder_id: welderProfile.id,
          external_job_id: jobId,
          status: 'saved',
          saved_at: new Date().toISOString(),
        }, { onConflict: 'welder_id,external_job_id' });

      if (error) throw error;

      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'saved' } : job
      ));

      toast({
        title: 'Job Saved',
        description: 'Job added to your saved list',
      });
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job',
        variant: 'destructive',
      });
    }
  };

  const handleApplyClick = async (job: ExternalJob) => {
    // Open apply link in new tab
    window.open(job.apply_link, '_blank');

    // Log the click if logged in
    if (user && welderProfile) {
      try {
        await supabase
          .from('welder_job_interactions')
          .upsert({
            welder_id: welderProfile.id,
            external_job_id: job.id,
            status: 'clicked_apply',
            clicked_apply_at: new Date().toISOString(),
          }, { onConflict: 'welder_id,external_job_id' });
      } catch (error) {
        console.error('Error logging apply click:', error);
      }
    }
  };

  const handleMarkApplied = async (jobId: string, notes?: string) => {
    if (!user || !welderProfile) return;

    try {
      const { error } = await supabase
        .from('welder_job_interactions')
        .upsert({
          welder_id: welderProfile.id,
          external_job_id: jobId,
          status: 'applied',
          marked_applied_at: new Date().toISOString(),
          notes: notes || null,
        }, { onConflict: 'welder_id,external_job_id' });

      if (error) throw error;

      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'applied' } : job
      ));

      toast({
        title: 'Application Tracked',
        description: 'Good luck with your application!',
      });
    } catch (error) {
      console.error('Error marking as applied:', error);
      toast({
        title: 'Error',
        description: 'Failed to track application',
        variant: 'destructive',
      });
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = job.title.toLowerCase().includes(query);
      const matchesCompany = job.company.toLowerCase().includes(query);
      const matchesLocation = job.location?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesCompany && !matchesLocation) return false;
    }

    if (locationFilter) {
      const loc = (job.location || '').toLowerCase();
      if (!loc.includes(locationFilter.toLowerCase())) return false;
    }

    if (sourceFilter && sourceFilter !== 'all') {
      if (job.source !== sourceFilter) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-medium">External Job Opportunities</span>
          <Badge variant="secondary" className="ml-2">
            {filteredJobs.length} jobs
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        Jobs from Indeed, LinkedIn, Glassdoor & more • Updated daily at 5:00 AM EST
      </p>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Input
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Indeed">Indeed</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Glassdoor">Glassdoor</SelectItem>
                <SelectItem value="ZipRecruiter">ZipRecruiter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium text-lg mb-2">No external jobs found</h3>
            <p className="text-muted-foreground mb-4">
              {jobs.length === 0 
                ? 'External jobs are updated daily. Click refresh to check for new listings.'
                : 'Try adjusting your search or filters'}
            </p>
            {jobs.length === 0 && (
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fetching Jobs...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Fetch External Jobs
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map(job => (
            <ExternalJobCard
              key={job.id}
              job={job}
              isLoggedIn={!!user}
              onSave={() => handleSaveJob(job.id)}
              onApplyClick={() => handleApplyClick(job)}
              onMarkApplied={(notes) => handleMarkApplied(job.id, notes)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
