// src/lib/careerAI.ts
// WeldMatch AI Career Features - API integration with n8n workflows

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// PROFILE OPTIMIZER TYPES
// ============================================================================

export interface ProfileOptimizationRequest {
  welderId: string;
  profile: {
    full_name: string;
    email: string;
    phone: string | null;
    city: string | null;
    state: string | null;
    years_experience: number;
    bio: string | null;
    weld_processes: string[];
    weld_positions: string[];
  };
  certifications: Array<{
    cert_type: string;
    cert_number: string | null;
    status: string;
    issue_date: string | null;
    expiry_date: string | null;
  }>;
  workHistory: Array<{
    company: string;
    title: string;
    duration: string;
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
}

// ============================================================================
// SKILLS GAP ANALYZER TYPES
// ============================================================================

export interface SkillsGapRequest {
  welderId: string;
  jobId: string;
  welderName: string;
  welderExperience: number;
  welderProcesses: string[];
  welderPositions: string[];
  welderCertifications: string[];
  welderLocation: string;
  jobTitle: string;
  companyName: string;
  jobProcesses: string[];
  jobPositions: string[];
  jobCertifications: string[];
  jobExperienceMin: number;
  jobLocation: string;
  jobSalaryMin: number | null;
  jobSalaryMax: number | null;
  jobDescription: string | null;
}

export interface SkillsGapResult {
  success: boolean;
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
}

// ============================================================================
// JOB MATCH SCANNER TYPES
// ============================================================================

export interface JobMatchScanRequest {
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobProcesses: string[];
  jobPositions: string[];
  jobCertifications: string[];
  jobExperienceMin: number;
  jobLocation: string;
  jobSalaryMin: number | null;
  jobSalaryMax: number | null;
  jobDescription: string | null;
  urgency: 'urgent' | 'normal';
  candidates: Array<{
    id: string;
    name: string;
    yearsExperience: number;
    weldProcesses: string[];
    weldPositions: string[];
    certifications: string[];
    location: string;
  }>;
  notifyTopMatches: number;
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
  summary: {
    totalCandidates: number;
    excellentMatches: number;
    strongMatches: number;
    goodMatches: number;
    averageScore: number;
    hiringOutlook: string;
  };
}

// ============================================================================
// CAREER COACH TYPES
// ============================================================================

export interface CareerAdviceRequest {
  welderId: string;
  fullName: string;
  yearsExperience: number;
  weldProcesses: string[];
  weldPositions: string[];
  certifications: string[];
  location: string;
  currentSalary: number | null;
  desiredSalary: number | null;
  careerGoals: string | null;
  willingToRelocate: boolean;
  willingToTravel: boolean;
  recentJobsCount: number;
  averageJobSalary: number;
  topDemandedSkills: string[];
  topDemandedCerts: string[];
  hotLocations: string[];
  focusArea: 'general' | 'salary' | 'certifications' | 'relocation' | 'specialization';
}

export interface CareerCoachResult {
  success: boolean;
  welderId: string;
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
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

async function callCareerAI<T, P extends object>(endpoint: string, payload: P): Promise<T> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { endpoint, payload }
  });
  
  if (error) {
    console.error(`Career AI call to ${endpoint} failed:`, error);
    throw new Error(error.message || 'Career AI request failed');
  }
  
  if (data?.error) {
    console.error(`Career AI returned error:`, data.error);
    throw new Error(data.error);
  }
  
  return data as T;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Analyze and optimize a welder's profile
 * Returns improvement suggestions, score, and actionable recommendations
 */
export async function optimizeProfile(
  request: ProfileOptimizationRequest
): Promise<ProfileOptimizationResult> {
  console.log('Optimizing profile for welder:', request.welderId);
  return callCareerAI<ProfileOptimizationResult, ProfileOptimizationRequest>(
    '/optimize-profile',
    request
  );
}

/**
 * Analyze skill gaps between a welder and a specific job
 * Returns detailed gap analysis and improvement path
 */
export async function analyzeSkillsGap(
  request: SkillsGapRequest
): Promise<SkillsGapResult> {
  console.log('Analyzing skills gap for welder:', request.welderId, 'job:', request.jobId);
  return callCareerAI<SkillsGapResult, SkillsGapRequest>(
    '/analyze-skills-gap',
    request
  );
}

/**
 * Scan for matching candidates when a new job is posted
 * Returns ranked list of matching welders with personalized alerts
 */
export async function scanJobMatches(
  request: JobMatchScanRequest
): Promise<JobMatchScanResult> {
  console.log('Scanning job matches for job:', request.jobId);
  return callCareerAI<JobMatchScanResult, JobMatchScanRequest>(
    '/scan-job-matches',
    request
  );
}

/**
 * Get personalized career advice for a welder
 * Returns comprehensive career coaching with action plans
 */
export async function getCareerAdvice(
  request: CareerAdviceRequest
): Promise<CareerCoachResult> {
  console.log('Getting career advice for welder:', request.welderId);
  return callCareerAI<CareerCoachResult, CareerAdviceRequest>(
    '/career-advice',
    request
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getMatchCategoryColor(category: string): string {
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

export function getProfileStrengthColor(strength: string): string {
  switch (strength) {
    case 'excellent':
      return 'text-green-600';
    case 'strong':
      return 'text-blue-600';
    case 'moderate':
      return 'text-yellow-600';
    case 'weak':
      return 'text-red-600';
    default:
      return 'text-muted-foreground';
  }
}

export function getGapSeverityColor(severity: string): string {
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
