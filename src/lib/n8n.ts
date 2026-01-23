import { supabase } from '@/integrations/supabase/client';

// Types
export interface CertVerificationRequest {
  certificationId: string;
  welderId: string;
  imageUrl: string;
  certType: 'AWS' | 'ASME' | 'API' | 'NCCER' | 'CWI' | 'OTHER';
}

export interface CertVerificationResponse {
  success: boolean;
  certificationId: string;
  welderId: string;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'SUSPICIOUS' | 'INVALID';
  extraction: {
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
  };
  verification: {
    verificationStatus: string;
    statusReason: string;
    isExpired: boolean;
    daysUntilExpiry: number | null;
    skillsSummary: string;
    verificationScore: number;
  };
  confidence: number;
  needsHumanReview: boolean;
  processedAt: string;
}

export interface ResumeParseRequest {
  welderId: string;
  resumeUrl?: string;
  resumeText?: string;
}

export interface ResumeParseResponse {
  success: boolean;
  welderId: string;
  profileSuggestions: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    yearsExperience: number;
    weldProcesses: string[];
    weldPositions: string[];
  };
  certificationSuggestions: Array<{
    name: string;
    certType: string;
  }>;
  workHistory: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
  }>;
  extractedSkills: {
    weldProcesses: string[];
    weldPositions: string[];
    materials: string[];
  };
  confidence: number;
  processedAt: string;
}

export interface JobMatchRequest {
  jobId: string;
  welderId: string;
  jobData?: {
    title: string;
    requiredCerts: string[];
    requiredProcesses: string[];
    requiredPositions: string[];
    experienceMin: number;
    location: string;
  };
  welderData?: {
    name: string;
    yearsExperience: number;
    weldProcesses: string[];
    weldPositions: string[];
    certifications: string[];
    location: string;
  };
}

export interface JobMatchResponse {
  success: boolean;
  jobId: string;
  matches: Array<{
    welderId: string;
    overallScore: number;
    breakdown: {
      certScore: number;
      skillsScore: number;
      experienceScore: number;
      locationScore: number;
    };
    matchDetails: string;
  }>;
  processedAt: string;
}

export interface EmailRequest {
  templateId: string;
  to: string;
  data: Record<string, unknown>;
}

export interface EmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

// Helper function to call n8n via Edge Function
async function callN8n<T, P extends object>(endpoint: string, payload: P): Promise<T> {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { endpoint, payload }
  });
  
  if (error) {
    console.error('n8n call failed:', error);
    throw new Error(error.message || 'n8n request failed');
  }
  
  if (data?.error) {
    throw new Error(data.error);
  }
  
  return data as T;
}

// Verify certification with AI
export async function verifyCertification(
  request: CertVerificationRequest
): Promise<CertVerificationResponse> {
  return callN8n<CertVerificationResponse, CertVerificationRequest>('/verify-certification', request);
}

// Parse resume with AI
export async function parseResume(
  request: ResumeParseRequest
): Promise<ResumeParseResponse> {
  return callN8n<ResumeParseResponse, ResumeParseRequest>('/parse-resume', request);
}

// Calculate job match scores
export async function matchCandidates(
  request: JobMatchRequest
): Promise<JobMatchResponse> {
  return callN8n<JobMatchResponse, JobMatchRequest>('/match-candidates', request);
}

// Send email notification
export async function sendEmail(
  request: EmailRequest
): Promise<EmailResponse> {
  return callN8n<EmailResponse, EmailRequest>('/send-email', request);
}
