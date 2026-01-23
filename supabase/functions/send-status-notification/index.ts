import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ApplicationStatus = "new" | "reviewing" | "interview" | "offer" | "hired" | "rejected";

interface StatusNotificationRequest {
  applicationId: string;
  newStatus: ApplicationStatus;
  rejectionReason?: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, { 
  subject: string; 
  headline: string; 
  color: string;
  icon: string;
  message: string;
}> = {
  new: {
    subject: "Application Received",
    headline: "Your Application Was Received!",
    color: "#3b82f6",
    icon: "📩",
    message: "Thank you for applying! The employer has received your application and will review it soon.",
  },
  reviewing: {
    subject: "Application Under Review",
    headline: "Your Application Is Being Reviewed!",
    color: "#8b5cf6",
    icon: "👀",
    message: "Great news! The employer is actively reviewing your application. They'll be in touch soon with next steps.",
  },
  interview: {
    subject: "Interview Scheduled!",
    headline: "Congratulations! You've Been Selected for an Interview!",
    color: "#22c55e",
    icon: "🎉",
    message: "The employer was impressed with your application and would like to schedule an interview. They will reach out to you shortly with details.",
  },
  offer: {
    subject: "Job Offer Received!",
    headline: "Congratulations! You've Received a Job Offer!",
    color: "#f97316",
    icon: "🏆",
    message: "Amazing news! The employer has extended a job offer to you. They will be in contact with the details of the offer.",
  },
  hired: {
    subject: "Welcome to the Team!",
    headline: "Congratulations! You're Hired!",
    color: "#22c55e",
    icon: "🎊",
    message: "You've been officially hired! The employer will be in touch with onboarding details and next steps.",
  },
  rejected: {
    subject: "Application Update",
    headline: "Application Status Update",
    color: "#6b7280",
    icon: "📋",
    message: "Thank you for your interest. Unfortunately, the employer has decided to move forward with other candidates at this time.",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-status-notification: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, newStatus, rejectionReason }: StatusNotificationRequest = await req.json();

    console.log("Processing status notification:", applicationId, "->", newStatus);

    // Get application with job details
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("job_id, welder_id")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("Failed to fetch application:", appError);
      throw new Error("Application not found");
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("title, employer_id, city, state")
      .eq("id", application.job_id)
      .single();

    if (jobError || !job) {
      console.error("Failed to fetch job:", jobError);
      throw new Error("Job not found");
    }

    // Get employer company name
    const { data: employer, error: employerError } = await supabase
      .from("employer_profiles")
      .select("company_name")
      .eq("id", job.employer_id)
      .single();

    if (employerError || !employer) {
      console.error("Failed to fetch employer:", employerError);
      throw new Error("Employer not found");
    }

    // Get welder profile and user info
    const { data: welderProfile, error: welderError } = await supabase
      .from("welder_profiles")
      .select("user_id")
      .eq("id", application.welder_id)
      .single();

    if (welderError || !welderProfile) {
      console.error("Failed to fetch welder profile:", welderError);
      throw new Error("Welder profile not found");
    }

    // Get welder's name from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", welderProfile.user_id)
      .single();

    if (profileError) {
      console.error("Failed to fetch profile:", profileError);
    }

    // Get welder's email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(welderProfile.user_id);

    if (authError || !authUser?.user?.email) {
      console.error("Failed to fetch welder email:", authError);
      throw new Error("Welder email not found");
    }

    const welderEmail = authUser.user.email;
    const welderName = profile?.full_name || "Welder";
    const companyName = employer.company_name;
    const jobTitle = job.title;
    const jobLocation = [job.city, job.state].filter(Boolean).join(", ") || "Remote";

    const config = STATUS_CONFIG[newStatus];

    // Build rejection reason section if applicable
    const rejectionSection = newStatus === "rejected" && rejectionReason ? `
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 8px; color: #991b1b; font-weight: 600; font-size: 14px;">Feedback from Employer:</p>
        <p style="margin: 0; color: #7f1d1d; font-size: 14px;">${rejectionReason}</p>
      </div>
    ` : '';

    // Build encouraging message for rejection
    const encouragementSection = newStatus === "rejected" ? `
      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="margin: 0; color: #166534; font-size: 14px;">
          <strong>Don't give up!</strong> Keep your profile updated and continue applying to other opportunities. 
          New jobs are posted regularly, and your skills are valuable.
        </p>
      </div>
    ` : '';

    // Send email
    const emailResponse = await resend.emails.send({
      from: "WeldMatch <notifications@resend.dev>",
      to: [welderEmail],
      subject: `${config.subject} - ${jobTitle} at ${companyName}`,
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
              
              <!-- Status Banner -->
              <div style="background: ${config.color}; padding: 24px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">${config.icon}</div>
                <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 600;">${config.headline}</h1>
              </div>

              <!-- Content -->
              <div style="padding: 32px;">
                
                <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                  Hi ${welderName},
                </p>

                <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                  ${config.message}
                </p>

                <!-- Job Info -->
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
                  <p style="margin: 0 0 12px; color: #1f2937; font-size: 18px; font-weight: 600;">${jobTitle}</p>
                  
                  <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                    <div>
                      <p style="margin: 0 0 2px; color: #6b7280; font-size: 12px;">Company</p>
                      <p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 500;">${companyName}</p>
                    </div>
                    <div>
                      <p style="margin: 0 0 2px; color: #6b7280; font-size: 12px;">Location</p>
                      <p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 500;">📍 ${jobLocation}</p>
                    </div>
                  </div>
                </div>

                ${rejectionSection}
                ${encouragementSection}

                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://weldmatch.lovable.app/welder/applications" 
                     style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    View My Applications
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
    console.error("Error in send-status-notification:", errorMessage);
    
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
