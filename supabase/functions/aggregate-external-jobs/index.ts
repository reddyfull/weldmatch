import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The n8n webhook URL for the "WeldMatch - External Job Aggregator" workflow.
// The user confirmed the correct path is /webhook/aggregate-jobs, so we construct
// the full URL from the n8n cloud domain stored in N8N_WEBHOOK_URL (base URL).
const N8N_BASE_URL_RAW = Deno.env.get('N8N_WEBHOOK_URL') || '';
const N8N_API_KEY = Deno.env.get('N8N_API_KEY') || null;

// Normalises and constructs the final webhook URL that hits /webhook/aggregate-jobs.
function buildWebhookUrl(): string {
  const base = N8N_BASE_URL_RAW.trim().replace(/\/$/, '');

  // If already a full aggregate-jobs URL, use it directly.
  if (base.includes('aggregate-jobs')) {
    return base;
  }

  // If it ends with /webhook or /webhook-test, just append the path.
  if (base.endsWith('/webhook') || base.endsWith('/webhook-test')) {
    return `${base}/aggregate-jobs`;
  }

  // If it contains /webhook somewhere in the middle, assume it's a different endpoint
  // configured for something else – still try /webhook/aggregate-jobs on the host.
  if (base.includes('/webhook')) {
    const hostMatch = base.match(/^(https?:\/\/[^\/]+)/);
    if (hostMatch) {
      return `${hostMatch[1]}/webhook/aggregate-jobs`;
    }
  }

  // Otherwise, treat the whole thing as the host and append /webhook/aggregate-jobs.
  return `${base}/webhook/aggregate-jobs`;
}

const N8N_WEBHOOK_URL = buildWebhookUrl();
console.log('[aggregate-external-jobs] Using n8n webhook URL:', N8N_WEBHOOK_URL);

async function postToN8n(payload: Record<string, unknown>) {
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(N8N_API_KEY ? { 'X-Api-Key': N8N_API_KEY } : {}),
    },
    body: JSON.stringify(payload),
  });

  return res;
}

const SEARCH_QUERIES = [
  { query: 'welder', location: 'United States' },
  { query: 'pipeline welder', location: 'Texas' },
  { query: 'structural welder', location: 'United States' },
  { query: 'tig welder', location: 'California' },
  { query: 'mig welder', location: 'United States' },
];

interface ExternalJob {
  externalId: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  isRemote?: boolean;
  description?: string;
  descriptionSnippet?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  salaryDisplay?: string;
  applyLink?: string;
  sourceJobUrl?: string;
  applyIsDirect?: boolean;
  source?: string;
  sourceLink?: string;
  postedAt?: string;
  expiresAt?: string;
  requiresExperience?: number;
  requiredSkills?: string[];
  detectedProcesses?: string[];
  detectedCerts?: string[];
  requiredEducation?: string;
  searchQuery?: string;
  // AI Match Scoring fields
  matchScore?: number;
  matchReason?: string;
  missingSkills?: string[];
}

interface WelderProfileForMatching {
  name: string;
  yearsExperience: number;
  weldingProcesses: string[];
  certifications: string[];
  preferredLocation: string;
  willingToRelocate: boolean;
  preferredSalary?: number;
  salaryPeriod?: string;
  industries?: string[];
  shiftPreference?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[aggregate-external-jobs] Starting job aggregation...');

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for manual triggers
    let manualQuery = null;
    let manualLocation = null;
    let welderId: string | null = null;
    let welderProfile: WelderProfileForMatching | null = null;

    try {
      const body = await req.json();
      manualQuery = body.query;
      manualLocation = body.location;
      welderId = body.welderId || null;
      
      // If welderId provided, fetch their profile for match scoring
      if (welderId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', welderId)
          .single();

        const { data: welderData } = await supabase
          .from('welder_profiles')
          .select('*')
          .eq('user_id', welderId)
          .single();

        const { data: certs } = await supabase
          .from('certifications')
          .select('cert_type')
          .eq('welder_id', welderData?.id)
          .eq('verification_status', 'verified');

        if (welderData) {
          welderProfile = {
            name: profile?.full_name || 'Welder',
            yearsExperience: welderData.years_experience || 0,
            weldingProcesses: welderData.weld_processes || [],
            certifications: certs?.map(c => c.cert_type) || [],
            preferredLocation: `${welderData.city || ''}, ${welderData.state || ''}`.trim() || 'United States',
            willingToRelocate: welderData.willing_to_travel || false,
            preferredSalary: welderData.desired_salary_min || undefined,
            salaryPeriod: welderData.salary_type || 'hourly',
          };
          console.log('[aggregate-external-jobs] Fetched welder profile for match scoring:', welderProfile.name);
        }
      }
    } catch {
      // No body provided, use default queries
    }

    const searchQueries = manualQuery 
      ? [{ query: manualQuery, location: manualLocation || 'United States' }]
      : SEARCH_QUERIES;

    // Create log entry
    const { data: logEntry, error: logError } = await supabase
      .from('job_aggregator_logs')
      .insert({
        run_type: manualQuery ? 'manual' : 'scheduled',
        search_query: searchQueries.map(q => q.query).join(', '),
        location: searchQueries.map(q => q.location).join(', '),
        status: 'running'
      })
      .select()
      .single();

    if (logError) {
      console.error('[aggregate-external-jobs] Error creating log entry:', logError);
    }

    let totalFetched = 0;
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    // Run each search query
    for (const searchConfig of searchQueries) {
      console.log(`[aggregate-external-jobs] Searching for "${searchConfig.query}" in ${searchConfig.location}`);
      
      try {
        // Build request body - include welderProfile if available for AI scoring
        const requestBody: Record<string, unknown> = {
          query: searchConfig.query,
          location: searchConfig.location,
          datePosted: 'week',
          numPages: 2,
        };

        if (welderProfile) {
          requestBody.welderProfile = welderProfile;
        }

        const response = await postToN8n(requestBody);

        if (!response.ok) {
          console.error(
            `[aggregate-external-jobs] n8n webhook failed ${response.status}:`,
            await response.text().catch(() => 'no body'),
          );
          continue;
        }

        const rawResult = await response.json();
        
        // Handle n8n response - it returns an array with the result object inside
        const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;

        if (!result?.success || !result?.jobs) {
          console.error(`[aggregate-external-jobs] Search failed for ${searchConfig.query}:`, result);
          continue;
        }

        const hasMatchScoring = result.hasMatchScoring === true;
        console.log(`[aggregate-external-jobs] Received ${result.jobs.length} jobs for "${searchConfig.query}" (matchScoring: ${hasMatchScoring})`);
        totalFetched += result.jobs.length;

        // Upsert jobs into database
        for (const job of result.jobs as ExternalJob[]) {
          const jobId = job.externalId;
          const applyUrl = job.applyLink || job.sourceJobUrl;
          
          if (!jobId || !job.title || !job.company || !applyUrl) {
            console.log('[aggregate-external-jobs] Skipping invalid job:', job.title);
            totalSkipped++;
            continue;
          }

          const { data: existingJob } = await supabase
            .from('external_jobs')
            .select('id')
            .eq('external_id', jobId)
            .single();

          const jobData = {
            title: job.title,
            company: job.company,
            company_logo: job.companyLogo || null,
            location: job.location || null,
            city: job.city || null,
            state: job.state || null,
            country: job.country || 'US',
            is_remote: job.isRemote || false,
            description: job.description || null,
            description_snippet: job.descriptionSnippet || job.description?.substring(0, 500) || null,
            employment_type: job.employmentType || null,
            salary_min: job.salaryMin || null,
            salary_max: job.salaryMax || null,
            salary_period: job.salaryPeriod || null,
            salary_display: job.salaryDisplay || null,
            apply_link: applyUrl,
            apply_is_direct: job.applyIsDirect || false,
            source: job.source || null,
            source_link: job.sourceLink || null,
            posted_at: job.postedAt || null,
            expires_at: job.expiresAt || null,
            required_experience_months: job.requiresExperience || null,
            required_skills: job.detectedProcesses || job.requiredSkills || [],
            required_education: job.requiredEducation || null,
            search_query: searchConfig.query,
            fetched_at: new Date().toISOString(),
            is_active: true,
            // AI Match scoring fields (only if scoring was performed)
            ...(hasMatchScoring && {
              match_score: job.matchScore || null,
              match_reason: job.matchReason || null,
              missing_skills: job.missingSkills || [],
            }),
          };

          if (existingJob) {
            // Update existing job
            const { error: updateError } = await supabase
              .from('external_jobs')
              .update({
                ...jobData,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingJob.id);
            
            if (updateError) {
              console.error('[aggregate-external-jobs] Update error:', updateError);
            } else {
              totalUpdated++;
            }
          } else {
            // Insert new job
            const { error: insertError } = await supabase
              .from('external_jobs')
              .insert({
                external_id: jobId,
                ...jobData
              });

            if (insertError) {
              if (insertError.code === '23505') {
                totalSkipped++;
              } else {
                console.error('[aggregate-external-jobs] Insert error:', insertError);
              }
            } else {
              totalAdded++;
            }
          }
        }

        // Small delay between searches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[aggregate-external-jobs] Error processing "${searchConfig.query}":`, error);
      }
    }

    // Mark old jobs as inactive (not seen in 2 weeks)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { error: deactivateError } = await supabase
      .from('external_jobs')
      .update({ is_active: false })
      .lt('fetched_at', twoWeeksAgo);

    if (deactivateError) {
      console.error('[aggregate-external-jobs] Error deactivating old jobs:', deactivateError);
    }

    // Update log entry
    if (logEntry) {
      await supabase
        .from('job_aggregator_logs')
        .update({
          jobs_fetched: totalFetched,
          jobs_added: totalAdded,
          jobs_updated: totalUpdated,
          jobs_skipped: totalSkipped,
          status: 'success',
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    console.log(`[aggregate-external-jobs] Completed. Fetched: ${totalFetched}, Added: ${totalAdded}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        fetched: totalFetched,
        added: totalAdded,
        updated: totalUpdated,
        skipped: totalSkipped,
        hasMatchScoring: !!welderProfile
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[aggregate-external-jobs] Aggregation failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
