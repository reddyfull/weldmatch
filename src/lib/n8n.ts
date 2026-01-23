const N8N_BASE_URL = 'https://reddyfull.app.n8n.cloud/webhook';

const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY;

// Helper function with authentication
async function callN8n(endpoint: string, data: any) {
  const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': N8N_API_KEY,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'n8n request failed');
  }

  return response.json();
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
  jobData?: any;
  welderData?: any;
}) {
  return callN8n('/job-match', data);
}

// Send email via n8n
export async function sendEmail(data: {
  templateId: string;
  to: string;
  data: Record<string, any>;
}) {
  return callN8n('/send-email', data);
}
