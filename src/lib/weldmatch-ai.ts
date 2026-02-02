// src/lib/weldmatch-ai.ts
// WeldMatch AI Career Services - Lovable Integration

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// n8n ENDPOINT CONFIGURATION
// ============================================================================

const N8N_ENDPOINTS = {
  // NEW AI Career Agents
  OPTIMIZE_PROFILE: '/optimize-profile',
  ANALYZE_SKILLS_GAP: '/analyze-skills-gap',
  SCAN_JOB_MATCHES: '/scan-job-matches',
  CAREER_ADVICE: '/career-advice',
  
  // Existing Workflows
  VERIFY_CERTIFICATION: '/verify-certification',
  PARSE_RESUME: '/parse-resume',
  MATCH_CANDIDATES: '/match-candidates',
  SCORE_CANDIDATES: '/score-candidates',
  SEND_EMAIL: '/send-email',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Profile Optimizer Types
export interface ProfileOptimizationRequest {
  welderId: string;
  profile: {
    full_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    years_experience?: number;
    bio?: string;
    weld_processes?: string[];
    weld_positions?: string[];
  };
  certifications?: Array<{
    cert_type: string;
    cert_number?: string;
    status: string;
    issue_date?: string;
    expiry_date?: string;
  }>;
  workHistory?: Array<{
    company: string;
    title: string;
    duration?: string;
  }>;
}

export interface ProfileOptimizationResult {
  success: boolean;
  welderId: string;
  completenessScore: number;
  analysis: {
    overallScore: number;
    profileStrength: 'weak' | 'moderate' | 'strong' | 'excellent';
    summary: string;
    criticalImprovements: Array<{
      action: string;
      impact: 'high' | 'medium';
      reason: string;
    }>;
    certificationAdvice: {
      currentValue: string;
      recommendedCerts: string[];
      reason: string;
    };
    skillsAdvice: {
      strongSkills: string[];
      missingSkills: string[];
      inDemandSkills: string[];
    };
    bioSuggestion: string;
    estimatedJobMatches: {
      current: string;
      afterImprovements: string;
    };
    topPriority: string;
  };
  missingFields: Array<{ name: string; weight: number }>;
  processedAt: string;
}

// Skills Gap Analyzer Types
export interface SkillsGapRequest {
  welderId: string;
  jobId: string;
  welderName: string;
  welderExperience: number;
  welderProcesses: string[];
  welderPositions: string[];
  welderCertifications: string[];
  welderLocation?: string;
  jobTitle: string;
  companyName: string;
  jobProcesses: string[];
  jobPositions: string[];
  jobCertifications: string[];
  jobExperienceMin: number;
  jobLocation?: string;
  jobSalaryMin?: number;
  jobSalaryMax?: number;
  jobDescription?: string;
}

export interface SkillsGapResult {
  success: boolean;
  welderId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  matchCategory: 'EXCELLENT_MATCH' | 'STRONG_MATCH' | 'GOOD_MATCH' | 'PARTIAL_MATCH' | 'NEEDS_DEVELOPMENT';
  canApply: boolean;
  summary: string;
  qualifiedAreas: Array<{
    requirement: string;
    welderHas: string;
    status: 'exceeds' | 'meets';
  }>;
  gaps: Array<{
    requirement: string;
    importance: 'required' | 'preferred';
    currentLevel: string;
    gapSeverity: 'critical' | 'moderate' | 'minor';
    howToClose: string;
    timeToAchieve: string;
    estimatedCost: string;
  }>;
  applicationStrategy: {
    shouldApply: boolean;
    confidence: 'high' | 'medium' | 'low';
    approachAdvice: string;
    highlightInResume: string[];
    addressInCoverLetter: string[];
    prepareForInterview: string[];
  };
  improvementPath: {
    quickWins: string[];
    shortTerm: Array<{ action: string; timeline: string }>;
    longTerm: Array<{ action: string; timeline: string }>;
  };
  similarJobsAdvice: string;
  analyzedAt: string;
}

// Job Match Scanner Types
export interface JobMatchScanRequest {
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobProcesses: string[];
  jobPositions: string[];
  jobCertifications: string[];
  jobExperienceMin: number;
  jobLocation?: string;
  jobSalaryMin?: number;
  jobSalaryMax?: number;
  jobDescription?: string;
  urgency?: 'urgent' | 'normal';
  candidates: Array<{
    id: string;
    name: string;
    yearsExperience: number;
    weldProcesses: string[];
    weldPositions: string[];
    certifications: string[];
    location?: string;
  }>;
  notifyTopMatches?: number;
}

export interface JobMatchScanResult {
  success: boolean;
  jobId: string;
  jobTitle: string;
  companyName: string;
  matches: Array<{
    rank: number;
    candidateId: string;
    candidateName: string;
    overallScore: number;
    category: 'EXCELLENT' | 'STRONG' | 'GOOD' | 'POTENTIAL' | 'DEVELOP';
    breakdown: {
      certifications: { score: number; matched: string[]; missing: string[] };
      skills: { score: number; matched: string[]; missing: string[] };
      experience: { score: number; detail: string };
      positions: { score: number; matched: string[]; missing: string[] };
      location: { score: number; detail: string };
    };
    whyGoodFit: string;
    gapsToImprove: Array<{ gap: string; suggestion: string }>;
    personalizedAlert: {
      subject: string;
      message: string;
    };
  }>;
  topMatchesToNotify?: Array<any>;
  summary: {
    totalCandidates: number;
    excellentMatches: number;
    strongMatches: number;
    goodMatches: number;
    averageScore: number;
    hiringOutlook: string;
  };
  scannedAt: string;
}

// Career Coach Types
export interface CareerAdviceRequest {
  welderId: string;
  fullName: string;
  yearsExperience: number;
  weldProcesses: string[];
  weldPositions: string[];
  certifications: string[];
  location?: string;
  currentSalary?: number;
  desiredSalary?: number;
  careerGoals?: string;
  willingToRelocate?: boolean;
  willingToTravel?: boolean;
  // Market context
  recentJobsCount?: number;
  averageJobSalary?: number;
  topDemandedSkills?: string[];
  topDemandedCerts?: string[];
  hotLocations?: string[];
  focusArea?: 'general' | 'salary' | 'certifications' | 'relocation' | 'specialization';
}

export interface CareerAdviceResult {
  success: boolean;
  welderId: string;
  welderName: string;
  focusArea: string;
  careerAssessment: {
    currentLevel: 'entry' | 'intermediate' | 'experienced' | 'expert' | 'master';
    marketPosition: string;
    earningPotential: string;
    careerTrajectory: string;
  };
  salaryInsights: {
    currentMarketRange: { min: number; max: number; median: number };
    yourEstimatedValue: number;
    potentialWithUpgrades: number;
    topPayingSpecializations: Array<{ name: string; salaryRange: string }>;
  };
  certificationRoadmap: Array<{
    certification: string;
    priority: 'immediate' | 'short-term' | 'long-term';
    reason: string;
    expectedROI: string;
    timeToComplete: string;
    estimatedCost: string;
  }>;
  skillDevelopment: Array<{
    skill: string;
    currentDemand: 'high' | 'medium' | 'low';
    futureOutlook: string;
    howToLearn: string;
  }>;
  careerPaths: Array<{
    path: string;
    description: string;
    requirements: string[];
    salaryRange: string;
    timeframe: string;
  }>;
  actionPlan: {
    thisWeek: string[];
    thisMonth: string[];
    thisQuarter: string[];
    thisYear: string[];
  };
  marketOpportunities: {
    hotIndustries: string[];
    growingRegions: string[];
    emergingTechnologies: string[];
  };
  motivationalNote: string;
  generatedAt: string;
}

// ============================================================================
// API CALL HELPER
// ============================================================================

async function callN8nEndpoint<T>(endpoint: string, payload: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { endpoint, payload }
  });

  if (error) {
    console.error(`n8n API Error (${endpoint}):`, error);
    throw new Error(error.message || 'Failed to call n8n endpoint');
  }

  return data as T;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Analyze and optimize a welder's profile
 * Returns AI-powered suggestions to improve job matches
 */
export async function optimizeProfile(
  request: ProfileOptimizationRequest
): Promise<ProfileOptimizationResult> {
  return callN8nEndpoint<ProfileOptimizationResult>(
    N8N_ENDPOINTS.OPTIMIZE_PROFILE,
    request
  );
}

/**
 * Analyze skills gap between a welder and a specific job
 * Returns detailed breakdown of qualifications and gaps
 */
export async function analyzeSkillsGap(
  request: SkillsGapRequest
): Promise<SkillsGapResult> {
  return callN8nEndpoint<SkillsGapResult>(
    N8N_ENDPOINTS.ANALYZE_SKILLS_GAP,
    request
  );
}

/**
 * Scan and match candidates for a job posting
 * Call this when a new job is posted to find matching welders
 */
export async function scanJobMatches(
  request: JobMatchScanRequest
): Promise<JobMatchScanResult> {
  return callN8nEndpoint<JobMatchScanResult>(
    N8N_ENDPOINTS.SCAN_JOB_MATCHES,
    request
  );
}

/**
 * Get personalized career coaching advice
 * Returns comprehensive career development plan
 */
export async function getCareerAdvice(
  request: CareerAdviceRequest
): Promise<CareerAdviceResult> {
  return callN8nEndpoint<CareerAdviceResult>(
    N8N_ENDPOINTS.CAREER_ADVICE,
    request
  );
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick profile check - call when welder logs in
 */
export async function quickProfileCheck(welderId: string): Promise<{
  score: number;
  strength: string;
  topPriority: string;
}> {
  // Fetch welder data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', welderId)
    .single();

  const { data: welderProfile } = await supabase
    .from('welder_profiles')
    .select('*')
    .eq('user_id', welderId)
    .single();

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('welder_id', welderId);

  if (!profile || !welderProfile) {
    return { score: 0, strength: 'weak', topPriority: 'Complete your profile' };
  }

  const result = await optimizeProfile({
    welderId,
    profile: {
      full_name: profile.full_name || undefined,
      phone: profile.phone || undefined,
      city: welderProfile.city || undefined,
      state: welderProfile.state || undefined,
      years_experience: welderProfile.years_experience || 0,
      bio: welderProfile.bio || undefined,
      weld_processes: welderProfile.weld_processes || [],
      weld_positions: welderProfile.weld_positions || []
    },
    certifications: certifications?.map(c => ({
      cert_type: c.cert_type,
      cert_number: c.cert_number || undefined,
      status: c.verification_status,
      issue_date: c.issue_date || undefined,
      expiry_date: c.expiry_date || undefined
    })) || []
  });

  return {
    score: result.analysis.overallScore,
    strength: result.analysis.profileStrength,
    topPriority: result.analysis.topPriority
  };
}

/**
 * Get match score for a job quickly
 */
export async function getJobMatchScore(
  welderId: string,
  jobId: string
): Promise<{ score: number; category: string; canApply: boolean }> {
  // Fetch welder data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', welderId)
    .single();

  const { data: welderProfile } = await supabase
    .from('welder_profiles')
    .select('years_experience, weld_processes, weld_positions, city, state')
    .eq('user_id', welderId)
    .single();

  const { data: welderCerts } = await supabase
    .from('certifications')
    .select('cert_type')
    .eq('welder_id', welderId)
    .eq('verification_status', 'verified');

  // Fetch job data with employer profile (use public view for non-owners)
  const { data: job } = await supabase
    .from('jobs')
    .select('*, employer_profiles:employer_profiles_public(company_name)')
    .eq('id', jobId)
    .single();

  if (!profile || !welderProfile || !job) {
    return { score: 0, category: 'NEEDS_DEVELOPMENT', canApply: false };
  }

  const result = await analyzeSkillsGap({
    welderId,
    jobId,
    welderName: profile.full_name || 'Welder',
    welderExperience: welderProfile.years_experience || 0,
    welderProcesses: welderProfile.weld_processes || [],
    welderPositions: welderProfile.weld_positions || [],
    welderCertifications: welderCerts?.map(c => c.cert_type) || [],
    welderLocation: welderProfile.city ? `${welderProfile.city}, ${welderProfile.state}` : undefined,
    jobTitle: job.title,
    companyName: job.employer_profiles?.company_name || 'Company',
    jobProcesses: job.required_processes || [],
    jobPositions: job.required_positions || [],
    jobCertifications: job.required_certs || [],
    jobExperienceMin: job.experience_min || 0,
    jobLocation: job.city ? `${job.city}, ${job.state}` : undefined,
    jobSalaryMin: job.pay_min,
    jobSalaryMax: job.pay_max,
    jobDescription: job.description
  });

  return {
    score: result.matchScore,
    category: result.matchCategory,
    canApply: result.canApply
  };
}

/**
 * Process new job posting - find and notify matching welders
 */
export async function processNewJobPosting(jobId: string): Promise<void> {
  // Fetch job data with employer profile (use public view)
  const { data: job } = await supabase
    .from('jobs')
    .select('*, employer_profiles:employer_profiles_public(company_name)')
    .eq('id', jobId)
    .single();

  if (!job) {
    console.error('Job not found:', jobId);
    return;
  }

  // Fetch active job-seeking welders (those with is_available = true)
  const { data: welderProfiles } = await supabase
    .from('welder_profiles')
    .select(`
      user_id,
      years_experience,
      weld_processes,
      weld_positions,
      city,
      state
    `)
    .eq('is_available', true)
    .limit(50);

  if (!welderProfiles || welderProfiles.length === 0) {
    console.log('No active job seekers found');
    return;
  }

  // Get profile names
  const welderIds = welderProfiles.map(w => w.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', welderIds);

  // Get certifications for each welder
  const { data: allCerts } = await supabase
    .from('certifications')
    .select('welder_id, cert_type')
    .in('welder_id', welderIds)
    .eq('verification_status', 'verified');

  // Build candidates array
  const candidates = welderProfiles.map(w => {
    const profile = profiles?.find(p => p.id === w.user_id);
    return {
      id: w.user_id,
      name: profile?.full_name || 'Welder',
      yearsExperience: w.years_experience || 0,
      weldProcesses: w.weld_processes || [],
      weldPositions: w.weld_positions || [],
      certifications: allCerts?.filter(c => c.welder_id === w.user_id).map(c => c.cert_type) || [],
      location: w.city ? `${w.city}, ${w.state}` : undefined
    };
  });

  // Scan for matches
  const result = await scanJobMatches({
    jobId,
    jobTitle: job.title,
    companyName: job.employer_profiles?.company_name || 'Company',
    jobProcesses: job.required_processes || [],
    jobPositions: job.required_positions || [],
    jobCertifications: job.required_certs || [],
    jobExperienceMin: job.experience_min || 0,
    jobLocation: job.city ? `${job.city}, ${job.state}` : undefined,
    jobSalaryMin: job.pay_min,
    jobSalaryMax: job.pay_max,
    jobDescription: job.description,
    candidates,
    notifyTopMatches: 10
  });

  console.log(`Job ${jobId} processed: ${result.summary.excellentMatches} excellent, ${result.summary.strongMatches} strong matches`);

  // Note: In-app notifications would require a notifications table
  // For now, we log the results - email notifications can be sent via n8n
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color for match score
 */
export function getMatchScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'; // green
  if (score >= 75) return '#3b82f6'; // blue
  if (score >= 60) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Get Tailwind classes for match score
 */
export function getMatchScoreClasses(score: number): string {
  if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  if (score >= 75) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
  if (score >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
  return 'text-red-600 bg-red-100 dark:bg-red-900/30';
}

/**
 * Get badge label for match category
 */
export function getMatchCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'EXCELLENT_MATCH': '🌟 Excellent Match',
    'EXCELLENT': '🌟 Excellent Match',
    'STRONG_MATCH': '💪 Strong Match',
    'STRONG': '💪 Strong Match',
    'GOOD_MATCH': '👍 Good Match',
    'GOOD': '👍 Good Match',
    'PARTIAL_MATCH': '📈 Partial Match',
    'POTENTIAL': '📈 Potential Match',
    'NEEDS_DEVELOPMENT': '🎯 Develop Skills',
    'DEVELOP': '🎯 Develop Skills'
  };
  return labels[category] || category;
}

/**
 * Get Tailwind classes for match category
 */
export function getMatchCategoryClasses(category: string): string {
  switch (category) {
    case 'EXCELLENT_MATCH':
    case 'EXCELLENT':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'STRONG_MATCH':
    case 'STRONG':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'GOOD_MATCH':
    case 'GOOD':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    case 'PARTIAL_MATCH':
    case 'POTENTIAL':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    case 'NEEDS_DEVELOPMENT':
    case 'DEVELOP':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    default:
      return 'text-muted-foreground bg-muted';
  }
}

/**
 * Get profile strength badge info
 */
export function getProfileStrengthBadge(strength: string): {
  label: string;
  color: string;
  icon: string;
  classes: string;
} {
  const badges: Record<string, { label: string; color: string; icon: string; classes: string }> = {
    'weak': { 
      label: 'Needs Work', 
      color: '#ef4444', 
      icon: '⚠️',
      classes: 'text-red-600 bg-red-100 dark:bg-red-900/30'
    },
    'moderate': { 
      label: 'Good Start', 
      color: '#eab308', 
      icon: '📈',
      classes: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
    },
    'strong': { 
      label: 'Strong', 
      color: '#3b82f6', 
      icon: '💪',
      classes: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    },
    'excellent': { 
      label: 'Excellent', 
      color: '#22c55e', 
      icon: '🌟',
      classes: 'text-green-600 bg-green-100 dark:bg-green-900/30'
    }
  };
  return badges[strength] || badges['weak'];
}

/**
 * Get gap severity classes
 */
export function getGapSeverityClasses(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    case 'moderate':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    case 'minor':
      return 'text-muted-foreground bg-muted';
    default:
      return 'text-muted-foreground bg-muted';
  }
}
