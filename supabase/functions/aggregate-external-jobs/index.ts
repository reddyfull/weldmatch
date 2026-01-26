import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: In this project, N8N_WEBHOOK_URL is also used by the generic n8n-proxy function
// as a BASE URL (e.g. "https://.../webhook"). This function needs the specific webhook
// path for the external job aggregator.
const N8N_WEBHOOK_URL_RAW =
  Deno.env.get('N8N_WEBHOOK_URL') || 'https://reddyfull.app.n8n.cloud/webhook/aggregate-jobs';

const N8N_API_KEY = Deno.env.get('N8N_API_KEY') || null;

// If the workflow is exposed by a webhook, different environments commonly use:
// - /webhook/<path>
// - /webhook-test/<path>
// Some setups also use the workflow id as the webhook path.
const N8N_WORKFLOW_ID = 'ssbR8pvbABSybNxl';

function normalizeUrl(raw: string) {
  return raw.trim().replace(/\/$/, '');
}

function buildCandidateWebhookUrls(raw: string): string[] {
  const base = normalizeUrl(raw);
  const urls = new Set<string>();

  const add = (u: string) => {
    const nu = normalizeUrl(u);
    if (nu) urls.add(nu);
  };

  // Always try the raw secret value first.
  add(base);

  const alreadySpecific = base.includes('aggregate-jobs') || base.includes(N8N_WORKFLOW_ID);

  if (!alreadySpecific) {
    add(`${base}/aggregate-jobs`);
    add(`${base}/${N8N_WORKFLOW_ID}`);
  }

  // If the secret is just the domain (e.g. https://<host>), also try adding /webhook + /webhook-test.
  if (!base.includes('/webhook')) {
    add(`${base}/webhook/aggregate-jobs`);
    add(`${base}/webhook/${N8N_WORKFLOW_ID}`);
    add(`${base}/webhook-test/aggregate-jobs`);
    add(`${base}/webhook-test/${N8N_WORKFLOW_ID}`);
  }

  // If this looks like a "webhook" base, also try the test webhook variant.
  if (base.includes('/webhook') && !base.includes('/webhook-test')) {
    const testBase = base.replace('/webhook', '/webhook-test');
    add(testBase);
    if (!alreadySpecific) {
      add(`${testBase}/aggregate-jobs`);
      add(`${testBase}/${N8N_WORKFLOW_ID}`);
    }
  }

  return Array.from(urls);
}

const N8N_CANDIDATE_URLS = buildCandidateWebhookUrls(N8N_WEBHOOK_URL_RAW);

async function postToN8n(payload: Record<string, unknown>) {
  let lastStatus: number | null = null;
  let lastBody: string | null = null;

  for (const url of N8N_CANDIDATE_URLS) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-Api-Key': N8N_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { res, url };
    }

    lastStatus = res.status;
    try {
      lastBody = await res.text();
    } catch {
      lastBody = null;
    }

    // If the URL exists but fails for another reason (401/403/500), stop trying.
    if (res.status !== 404) {
      console.error(`[aggregate-external-jobs] n8n webhook failed ${res.status} at ${url}:`, lastBody);
      break;
    }
  }

  return { res: null as Response | null, url: null as string | null, lastStatus, lastBody };
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

        const { res: response, url: usedUrl, lastStatus, lastBody } = await postToN8n(requestBody);

        if (!response) {
          console.error(
            `[aggregate-external-jobs] n8n webhook failed (lastStatus=${lastStatus ?? 'unknown'}) triedUrls=${N8N_CANDIDATE_URLS.length}`,
          );
          if (lastStatus === 404) {
            console.error('[aggregate-external-jobs] Last 404 body:', lastBody);
          }
          continue;
        }

        if (usedUrl) {
          console.log('[aggregate-external-jobs] n8n webhook OK:', usedUrl);
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
