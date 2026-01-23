import { supabase } from '@/integrations/supabase/client';

// Proxy all n8n calls through Supabase Edge Function for security
async function callN8n(endpoint: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { endpoint, payload },
  });

  if (error) {
    console.error('n8n proxy error:', error);
    throw new Error(error.message || 'n8n request failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

// Verify certification with AI
export async function verifyCertification(data: {
  certificationId: string;
  welderId: string;
  imageUrl: string;
  certType: 'AWS' | 'ASME' | 'API' | 'NCCER' | 'CWI' | 'OTHER';
}) {
  return callN8n('/verify-certification', data);
}

// Parse resume with AI
export async function parseResume(data: {
  welderId: string;
  resumeUrl?: string;
  resumeText?: string;
}) {
  return callN8n('/parse-resume', data);
}

// Calculate job match score
export async function calculateMatchScore(data: {
  jobId: string;
  welderId: string;
  jobData?: Record<string, unknown>;
  welderData?: Record<string, unknown>;
}) {
  return callN8n('/job-match', data);
}

// Send email via n8n
export async function sendEmail(data: {
  templateId: string;
  to: string;
  data: Record<string, unknown>;
}) {
  return callN8n('/send-email', data);
}
