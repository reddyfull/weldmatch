import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationNotificationRequest {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  welderName: string;
  matchScore: number;
  yearsExperience: number;
  certCount: number;
  weldProcesses: string[];
  coverMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-application-notification: Request received");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      applicationId,
      jobId,
      jobTitle,
      welderName,
      matchScore,
      yearsExperience,
      certCount,
      weldProcesses,
      coverMessage,
    }: ApplicationNotificationRequest = await req.json();

    console.log("Processing notification for application:", applicationId);

    // Get job and employer info
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("employer_id, city, state")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      console.error("Failed to fetch job:", jobError);
      throw new Error("Job not found");
    }

    // Get employer profile
    const { data: employer, error: employerError } = await supabase
      .from("employer_profiles")
      .select("user_id, company_name")
      .eq("id", job.employer_id)
      .single();

    if (employerError || !employer) {
      console.error("Failed to fetch employer:", employerError);
      throw new Error("Employer not found");
    }

    // Get employer's email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(employer.user_id);

    if (authError || !authUser?.user?.email) {
      console.error("Failed to fetch employer email:", authError);
      throw new Error("Employer email not found");
    }

    const employerEmail = authUser.user.email;
    const companyName = employer.company_name;
    const jobLocation = [job.city, job.state].filter(Boolean).join(", ") || "Remote";

    // Determine match score color
    const getScoreColor = (score: number) => {
      if (score >= 80) return "#22c55e"; // green
      if (score >= 60) return "#eab308"; // yellow
      return "#ef4444"; // red
    };

    const getScoreLabel = (score: number) => {
      if (score >= 80) return "Strong Match";
      if (score >= 60) return "Good Match";
      return "Possible Match";
    };

    const scoreColor = getScoreColor(matchScore);
    const scoreLabel = getScoreLabel(matchScore);

    // Build processes list
    const processesHtml = weldProcesses.length > 0
      ? weldProcesses.map(p => `<span style="display: inline-block; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px;">${p}</span>`).join("")
      : "<span style='color: #6b7280;'>Not specified</span>";

    // Send email
    const emailResponse = await resend.emails.send({
      from: "WeldMatch <notifications@resend.dev>",
      to: [employerEmail],
      subject: `New Application: ${welderName} applied for ${jobTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 20px;">🔥</span>
                </div>
                <span style="font-size: 24px; font-weight: bold; color: #1f2937;">Weld<span style="color: #f97316;">Match</span></span>
              </div>
            </div>

            <!-- Main Card -->
            <div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
              
              <!-- Header Banner -->
              <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; text-align: center;">
                <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 600;">New Application Received!</h1>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                
                <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                  Hi there! A new candidate has applied for your job posting.
                </p>

                <!-- Job Info -->
                <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
                  <p style="margin: 0 0 8px; color: #1f2937; font-size: 18px; font-weight: 600;">${jobTitle}</p>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">📍 ${jobLocation}</p>
                </div>

                <!-- Candidate Card -->
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="width: 48px; height: 48px; background: #f97316; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                      <span style="color: white; font-size: 20px; font-weight: 600;">${welderName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${welderName}</p>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">Welder Candidate</p>
                    </div>
                  </div>

                  <!-- Match Score -->
                  <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 16px;">
                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px;">MATCH SCORE</p>
                    <p style="margin: 0; font-size: 36px; font-weight: 700; color: ${scoreColor};">${matchScore}%</p>
                    <p style="margin: 4px 0 0; color: ${scoreColor}; font-size: 14px; font-weight: 500;">${scoreLabel}</p>
                  </div>

                  <!-- Stats -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="text-align: center; padding: 12px; background: #f9fafb; border-radius: 6px;">
                      <p style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">${yearsExperience}</p>
                      <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Years Experience</p>
                    </div>
                    <div style="text-align: center; padding: 12px; background: #f9fafb; border-radius: 6px;">
                      <p style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">${certCount}</p>
                      <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Certifications</p>
                    </div>
                  </div>

                  <!-- Weld Processes -->
                  <div style="margin-bottom: ${coverMessage ? '16px' : '0'};">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Weld Processes</p>
                    <div>${processesHtml}</div>
                  </div>

                  ${coverMessage ? `
                  <!-- Cover Message -->
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Cover Message</p>
                    <p style="margin: 0; color: #374151; font-size: 14px; font-style: italic;">"${coverMessage}"</p>
                  </div>
                  ` : ''}
                </div>

                <!-- CTA Button -->
                <div style="text-align: center;">
                  <a href="https://weldmatch.lovable.app/employer/candidates" 
                     style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Review Application
                  </a>
                </div>

              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0 0 8px;">This email was sent by WeldMatch</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} WeldMatch. All rights reserved.</p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-application-notification:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
