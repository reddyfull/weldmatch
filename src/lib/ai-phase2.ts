// src/lib/ai-phase2.ts
// WeldMatch Phase 2 AI Features - n8n Integration
// All features connect to n8n workflows via direct webhook calls

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES - Chat Assistant
// ============================================================================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
  userContext?: {
    profile?: WelderProfile | EmployerProfile;
  };
  userId?: string;
  userType: 'welder' | 'employer';
  sessionId?: string;
}

export interface FeatureTrigger {
  feature: string;
  path: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  conversationHistory: Message[];
  sessionId: string;
  featureTriggers?: FeatureTrigger[];
  metadata: {
    model: string;
    tokensUsed: number;
    timestamp: string;
  };
}

// ============================================================================
// TYPES - Resume Builder
// ============================================================================

export interface WorkExperience {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  responsibilities: string[];
  achievements?: string[];
}

export interface ResumeRequest {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  yearsExperience: number;
  currentTitle: string;
  processes: string[];
  certifications: string[];
  positions: string[];
  industries: string[];
  workHistory: WorkExperience[];
  keyAchievements?: string[];
  skills?: string[];
  formatStyle?: 'professional' | 'modern' | 'technical' | 'simple';
  targetJob?: string;
  targetIndustry?: string;
  welderId?: string;
}

export interface ResumeHeader {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
}

export interface CertSection {
  title: string;
  items: string[];
}

export interface ExperienceSection {
  company: string;
  title: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface SkillsSection {
  processes: string[];
  positions: string[];
  additional: string[];
}

export interface EducationSection {
  school: string;
  degree: string;
  year: string;
}

export interface ResumeResponse {
  success: boolean;
  resume: {
    header: ResumeHeader;
    summary: string;
    certifications: CertSection;
    experience: ExperienceSection[];
    skills: SkillsSection;
    education?: EducationSection[];
    formattedText: string;
    jsonStructure: object;
  };
  atsScore: number;
  suggestions: string[];
  generatedAt: string;
}

// ============================================================================
// TYPES - Cover Letter Generator
// ============================================================================

export interface CoverLetterRequest {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  yearsExperience: number;
  currentTitle: string;
  processes: string[];
  certifications: string[];
  positions?: string[];
  industries?: string[];
  keyAchievements?: string[];
  skills?: string[];
  jobTitle: string;
  company: string;
  companyDescription?: string;
  jobDescription?: string;
  requirements?: string[];
  jobLocation?: string;
  recruiterName?: string;
  source?: string;
  tone?: 'professional' | 'enthusiastic' | 'confident' | 'humble';
  length?: 'brief' | 'standard' | 'detailed';
  emphasis?: string[];
  includeAvailability?: boolean;
  includeSalaryExpectation?: boolean;
  salaryExpectation?: number;
  welderId?: string;
}

export interface LetterHeader {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  date: string;
}

export interface BodyParagraph {
  topic: string;
  content: string;
}

export interface LetterSignature {
  closing: string;
  name: string;
}

export interface CoverLetterResponse {
  success: boolean;
  coverLetter: {
    header: LetterHeader;
    salutation: string;
    openingParagraph: string;
    bodyParagraphs: BodyParagraph[];
    closingParagraph: string;
    signature: LetterSignature;
    formattedLetter: string;
    keywordsUsed: string[];
    strengthHighlights: string[];
  };
  generatedAt: string;
}

// ============================================================================
// TYPES - Candidate Outreach
// ============================================================================

export interface OutreachRequest {
  candidateName: string;
  candidateTitle?: string;
  candidateExperience?: number;
  candidateLocation?: string;
  candidateCerts?: string[];
  candidateProcesses?: string[];
  currentEmployer?: string;
  matchScore?: number;
  strengths?: string[];
  profileHighlights?: string[];
  jobTitle: string;
  company: string;
  jobLocation?: string;
  salary?: string;
  benefits?: string[];
  requirements?: string[];
  perks?: string[];
  urgency?: 'urgent' | 'normal' | 'passive';
  recruiterName: string;
  recruiterTitle?: string;
  recruiterPhone?: string;
  recruiterEmail?: string;
  channel: 'email' | 'linkedin' | 'text' | 'inmail';
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'urgent';
  length?: 'brief' | 'standard' | 'detailed';
  includeCompensation?: boolean;
  personalization?: 'low' | 'medium' | 'high';
  generateVariants?: number;
  followUpSequence?: boolean;
  employerId?: string;
}

export interface MessageVariant {
  id: number;
  fullMessage: string;
  tone: string;
}

export interface FollowUp {
  day: number;
  subject: string;
  message: string;
}

export interface OutreachResponse {
  success: boolean;
  outreach: {
    channel: string;
    subject?: string;
    greeting: string;
    hook: string;
    body: string;
    callToAction: string;
    signature: string;
    fullMessage: string;
    personalizationPoints: string[];
    toneAnalysis: string;
    variants?: MessageVariant[];
    followUpMessages?: FollowUp[];
  };
  candidate: {
    name: string;
    title?: string;
    experience?: number;
  };
  job: {
    title: string;
    company: string;
    location?: string;
  };
  generatedAt: string;
}

// ============================================================================
// TYPES - Market Intelligence
// ============================================================================

export interface MarketIntelligenceRequest {
  requestType?: 'comprehensive' | 'salary' | 'demand' | 'skills' | 'trends';
  userType: 'welder' | 'employer';
  userId?: string;
  city?: string;
  state?: string;
  region?: string;
  country?: string;
  radius?: number;
  industries?: string[];
  processes?: string[];
  certifications?: string[];
  positions?: string[];
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'all';
  employmentType?: 'full-time' | 'contract' | 'travel' | 'all';
  currentSalary?: number;
  currentTitle?: string;
  yearsExperience?: number;
  userCertifications?: string[];
  careerGoals?: string;
  timeRange?: '1month' | '3months' | '6months' | '1year';
}

export interface SalaryByLevel {
  level: string;
  median: number;
  range: { low: number; high: number };
}

export interface SalaryByIndustry {
  industry: string;
  median: number;
  trend: string;
}

export interface SalaryByCert {
  certification: string;
  premium: number;
  medianWithCert: number;
}

export interface HotSkill {
  skill: string;
  demandScore: number;
  growthRate: string;
  premiumPotential: string;
}

export interface HotIndustry {
  industry: string;
  demandLevel: string;
  openPositions: number;
  growthTrend: string;
}

export interface HotLocation {
  location: string;
  demandScore: number;
  averagePay: number;
  costOfLiving: string;
}

export interface CertROI {
  certification: string;
  cost: number;
  timeToComplete: string;
  salaryIncrease: number;
  roi: string;
  demandLevel: string;
}

export interface IndustryInsight {
  industry: string;
  overview: string;
  outlook: string;
  topEmployers: string[];
}

export interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  timeframe: string;
}

export interface MarketAlert {
  type: 'opportunity' | 'trend' | 'warning';
  title: string;
  description: string;
  relevance: string;
}

export interface MarketIntelligenceResponse {
  success: boolean;
  intelligence: {
    marketOverview: {
      demandLevel: string;
      demandTrend: string;
      marketSummary: string;
      keyDrivers: string[];
    };
    salaryIntelligence: {
      medianHourly: number;
      medianAnnual: number;
      range: {
        low: number;
        median: number;
        high: number;
        top10Percent: number;
      };
      byExperience: SalaryByLevel[];
      byIndustry: SalaryByIndustry[];
      byCertification: SalaryByCert[];
      trendDirection: string;
      yearOverYearChange: string;
    };
    demandAnalysis: {
      overallDemand: string;
      hotSkills: HotSkill[];
      hotIndustries: HotIndustry[];
      hotLocations: HotLocation[];
      emergingOpportunities: string[];
    };
    certificationROI: CertROI[];
    industryInsights: IndustryInsight[];
    personalizedInsights: {
      marketPosition: string;
      salaryAssessment: string;
      topOpportunities: string[];
      skillGaps: string[];
      actionItems: ActionItem[];
    };
    marketAlerts: MarketAlert[];
  };
  requestContext: {
    location?: string;
    industries?: string[];
    experienceLevel?: string;
  };
  generatedAt: string;
}

// ============================================================================
// TYPES - Profile Types (simplified for context)
// ============================================================================

export interface WelderProfile {
  yearsExperience?: number;
  certifications?: string[];
  currentTitle?: string;
  weldProcesses?: string[];
  weldPositions?: string[];
  city?: string;
  state?: string;
  bio?: string;
}

export interface EmployerProfile {
  companyName?: string;
  industry?: string;
  companySize?: string;
  city?: string;
  state?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Generic wrapper to call n8n endpoints via the n8n-proxy edge function
 * This avoids CORS issues by routing through Supabase
 */
async function callAIEndpoint<T>(endpoint: string, data: object): Promise<T> {
  try {
    const { data: result, error } = await supabase.functions.invoke('n8n-proxy', {
      body: {
        endpoint: `/${endpoint}`,
        payload: data
      }
    });
    
    if (error) {
      console.error(`AI endpoint ${endpoint} error:`, error);
      throw new Error(`API Error: ${error.message}`);
    }
    
    // n8n often returns responses wrapped in an array - unwrap if needed
    const unwrapped = Array.isArray(result) ? result[0] : result;
    
    return unwrapped as T;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
}

/**
 * AI Chat Assistant
 */
export const aiChat = (data: ChatRequest): Promise<ChatResponse> =>
  callAIEndpoint<ChatResponse>('chat-support', data);

/**
 * AI Resume Builder
 */
export const generateResume = (data: ResumeRequest): Promise<ResumeResponse> =>
  callAIEndpoint<ResumeResponse>('generate-resume', data);

/**
 * AI Cover Letter Generator
 */
export const generateCoverLetter = (data: CoverLetterRequest): Promise<CoverLetterResponse> =>
  callAIEndpoint<CoverLetterResponse>('generate-cover-letter', data);

/**
 * AI Candidate Outreach Drafter
 */
export const draftOutreach = (data: OutreachRequest): Promise<OutreachResponse> =>
  callAIEndpoint<OutreachResponse>('draft-outreach', data);

/**
 * AI Market Intelligence
 */
export const getMarketIntelligence = (data: MarketIntelligenceRequest): Promise<MarketIntelligenceResponse> =>
  callAIEndpoint<MarketIntelligenceResponse>('market-intelligence', data);
