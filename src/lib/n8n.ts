// src/lib/n8n.ts
// WeldMatch n8n API integration for Lovable
// This file handles all communication with n8n workflows via Supabase Edge Functions

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type CertType = 'AWS' | 'ASME' | 'API' | 'NCCER' | 'CWI' | 'OTHER';

export interface CertVerificationRequest {
  certificationId: string;
  welderId: string;
  imageUrl: string;
  certType: CertType;
  profileName?: string; // For name matching fraud detection
}

export interface CertExtractionData {
  isValidCertificate: boolean;
  certificationNumber: string | null;
  holderName: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  issuingOrganization: string | null;
  weldProcesses: string[];
  weldPositions: string[];
  materials: string[];
  confidence: number;
  warnings: string[];
}

export interface CertVerificationData {
  verificationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS' | 'INVALID';
  statusReason: string;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  skillsSummary: string;
  verificationScore: number;
}

export interface NameMatchResult {
  matches: boolean;
  confidence: number;
  certificateName: string;
  profileName: string;
  explanation: string;
}

export interface CertVerificationResponse {
  success: boolean;
  certificationId: string;
  welderId: string;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS' | 'INVALID';
  extraction: CertExtractionData;
  verification: CertVerificationData;
  confidence: number;
  needsHumanReview: boolean;
  processedAt: string;
  nameMatch?: NameMatchResult; // Name matching fraud detection result
  error?: string;
}

export interface ResumeParseRequest {
  welderId: string;
  resumeUrl?: string;
  resumeText?: string;
}

export interface ProfileSuggestions {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  yearsExperience: number;
  weldProcesses: string[];
  weldPositions: string[];
}

export interface CertificationSuggestion {
  name: string;
  certType: CertType;
}

export interface WorkHistoryItem {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface ResumeParseResponse {
  success: boolean;
  welderId: string;
  profileSuggestions: ProfileSuggestions;
  certificationSuggestions: CertificationSuggestion[];
  workHistory: WorkHistoryItem[];
  extractedSkills: {
    weldProcesses: string[];
    weldPositions: string[];
    materials: string[];
  };
  confidence: number;
  processedAt: string;
  error?: string;
}

export interface JobData {
  title: string;
  description?: string;
  requiredCerts: string[];
  requiredProcesses: string[];
  requiredPositions: string[];
  experienceMin: number;
  location: string;
  payMin?: number;
  payMax?: number;
}

export interface WelderData {
  name: string;
  yearsExperience: number;
  weldProcesses: string[];
  weldPositions: string[];
  certifications: string[];
  location: string;
}

export interface JobMatchRequest {
  jobId: string;
  welderId: string;
  jobData?: JobData;
  welderData?: WelderData;
}

export interface MatchResult {
  candidateId: string;
  candidateName: string;
  overallScore: number;
  matchReason: string;
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'POSSIBLE_MATCH' | 'WEAK_MATCH';
  rank: number;
  jobId: string;
}

export interface JobMatchResponse {
  success: boolean;
  jobId: string;
  jobTitle: string;
  matches: MatchResult[];
  summary: {
    totalScored: number;
    strongMatches: number;
    averageScore: number;
  };
  processedAt: string;
  error?: string;
}

export type EmailTemplateId = 
  | 'WELCOME_WELDER'
  | 'WELCOME_EMPLOYER'
  | 'CERT_VERIFIED'
  | 'CERT_REJECTED'
  | 'NEW_APPLICATION'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED'
  | 'JOB_MATCH_ALERT'
  | 'PASSWORD_RESET'
  | 'SUBSCRIPTION_CONFIRMED';

export interface EmailRequest {
  templateId: EmailTemplateId;
  to: string;
  data: Record<string, unknown>;
}

export interface EmailResponse {
  success: boolean;
  emailId?: string;
  to: string;
  templateId: string;
  sentAt?: string;
  error?: string;
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Call n8n workflow via Supabase Edge Function
 * This keeps the API key secret on the server side
 */
async function callN8n<T, P extends object>(endpoint: string, payload: P): Promise<T> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { endpoint, payload }
  });
  
  if (error) {
    console.error(`n8n call to ${endpoint} failed:`, error);
    throw new Error(error.message || 'n8n request failed');
  }
  
  // Check if n8n returned an error
  if (data?.error) {
    console.error(`n8n returned error:`, data.error);
    throw new Error(data.error);
  }
  
  return data as T;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Verify a certification document using AI
 * Uses GPT-4o Vision to extract data, Claude to verify
 */
export async function verifyCertification(
  request: CertVerificationRequest
): Promise<CertVerificationResponse> {
  console.log('Verifying certification:', request.certificationId);
  return callN8n<CertVerificationResponse, CertVerificationRequest>('/verify-certification', request);
}

/**
 * Parse a resume using AI
 * Extracts profile info, certifications, work history
 */
export async function parseResume(
  request: ResumeParseRequest
): Promise<ResumeParseResponse> {
  console.log('Parsing resume for welder:', request.welderId);
  return callN8n<ResumeParseResponse, ResumeParseRequest>('/parse-resume', request);
}

/**
 * Calculate match score between job and welder(s)
 * Uses Claude to analyze compatibility
 */
export async function matchCandidates(
  request: JobMatchRequest
): Promise<JobMatchResponse> {
  console.log('Matching candidates for job:', request.jobId);
  return callN8n<JobMatchResponse, JobMatchRequest>('/match-candidates', request);
}

/**
 * Send a transactional email via n8n + Resend
 */
export async function sendEmail(
  request: EmailRequest
): Promise<EmailResponse> {
  console.log('Sending email:', request.templateId, 'to:', request.to);
  return callN8n<EmailResponse, EmailRequest>('/send-email', request);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Send welcome email to new welder
 */
export async function sendWelderWelcomeEmail(email: string, name: string) {
  return sendEmail({
    templateId: 'WELCOME_WELDER',
    to: email,
    data: { recipientName: name }
  });
}

/**
 * Send welcome email to new employer
 */
export async function sendEmployerWelcomeEmail(email: string, name: string) {
  return sendEmail({
    templateId: 'WELCOME_EMPLOYER',
    to: email,
    data: { recipientName: name }
  });
}

/**
 * Notify employer of new application
 */
export async function notifyNewApplication(
  employerEmail: string,
  employerName: string,
  jobTitle: string,
  welderName: string,
  matchScore: number,
  yearsExperience: number,
  certCount: number,
  applicationId: string
) {
  return sendEmail({
    templateId: 'NEW_APPLICATION',
    to: employerEmail,
    data: {
      recipientName: employerName,
      jobTitle,
      welderName,
      matchScore,
      yearsExperience,
      certCount,
      applicationId
    }
  });
}

/**
 * Notify welder that their certification was verified
 */
export async function notifyCertVerified(
  welderEmail: string,
  welderName: string,
  certType: string,
  certNumber: string,
  expiryDate: string
) {
  return sendEmail({
    templateId: 'CERT_VERIFIED',
    to: welderEmail,
    data: {
      recipientName: welderName,
      certType,
      certNumber,
      expiryDate
    }
  });
}

/**
 * Notify welder of application status change
 */
export async function notifyApplicationStatus(
  welderEmail: string,
  welderName: string,
  jobTitle: string,
  companyName: string,
  accepted: boolean,
  nextSteps?: string
) {
  return sendEmail({
    templateId: accepted ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
    to: welderEmail,
    data: {
      recipientName: welderName,
      jobTitle,
      companyName,
      nextSteps
    }
  });
}

/**
 * Send job match alert to welder
 */
export async function sendJobMatchAlert(
  welderEmail: string,
  welderName: string,
  jobId: string,
  jobTitle: string,
  companyName: string,
  location: string,
  payRange: string,
  matchScore: number
) {
  return sendEmail({
    templateId: 'JOB_MATCH_ALERT',
    to: welderEmail,
    data: {
      recipientName: welderName,
      jobId,
      jobTitle,
      companyName,
      location,
      payRange,
      matchScore
    }
  });
}
