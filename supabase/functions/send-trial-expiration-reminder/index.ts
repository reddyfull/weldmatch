import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-EXPIRATION-REMINDER] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  logStep("Function invoked", { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 3 days from now (start and end of that day)
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    // Set to start of day
    const startOfDay = new Date(threeDaysFromNow);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    // Set to end of day
    const endOfDay = new Date(threeDaysFromNow);
    endOfDay.setUTCHours(23, 59, 59, 999);

    logStep("Checking for trials expiring", { 
      startOfDay: startOfDay.toISOString(), 
      endOfDay: endOfDay.toISOString() 
    });

    // Find employers with trials expiring in 3 days
    const { data: expiringTrials, error: queryError } = await supabase
      .from("employer_profiles")
      .select("id, user_id, company_name, trial_ends_at")
      .eq("subscription_status", "trial")
      .gte("trial_ends_at", startOfDay.toISOString())
      .lte("trial_ends_at", endOfDay.toISOString());

    if (queryError) {
      logStep("ERROR querying expiring trials", { error: queryError.message });
      throw new Error(`Failed to query expiring trials: ${queryError.message}`);
    }

    logStep("Found expiring trials", { count: expiringTrials?.length || 0 });

    if (!expiringTrials || expiringTrials.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No trials expiring in 3 days", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResults: { email: string; success: boolean; error?: string }[] = [];

    for (const employer of expiringTrials) {
      try {
        // Get employer's email from auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(employer.user_id);

        if (authError || !authUser?.user?.email) {
          logStep("Failed to get employer email", { userId: employer.user_id, error: authError?.message });
          emailResults.push({ email: "unknown", success: false, error: "Email not found" });
          continue;
        }

        // Get employer's name from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", employer.user_id)
          .single();

        const employerEmail = authUser.user.email;
        const employerName = profile?.full_name || "there";
        const companyName = employer.company_name;
        const trialEndsAt = new Date(employer.trial_ends_at);
        const formattedDate = trialEndsAt.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        logStep("Sending reminder email", { email: employerEmail, company: companyName });

        // Send the reminder email
        const emailResponse = await resend.emails.send({
          from: "WeldMatch <notifications@resend.dev>",
          to: [employerEmail],
          subject: `⏰ Your WeldMatch Trial Ends in 3 Days!`,
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
                  <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 8px;">⏰</div>
                    <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 600;">Your Trial Ends Soon!</h1>
                  </div>

                  <!-- Content -->
                  <div style="padding: 32px;">
                    
                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                      Hi ${employerName},
                    </p>

                    <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                      Your free trial for <strong>${companyName}</strong> on WeldMatch will expire in <strong>3 days</strong> on <strong>${formattedDate}</strong>.
                    </p>

                    <!-- Countdown Box -->
                    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                      <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Time Remaining</p>
                      <p style="margin: 0; color: #78350f; font-size: 36px; font-weight: bold;">3 Days</p>
                    </div>

                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px;">
                      Don't lose access to these powerful features:
                    </p>

                    <!-- Features List -->
                    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="color: #22c55e; font-size: 18px;">✓</span>
                        <span style="color: #374151; font-size: 14px;">Unlimited job postings</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="color: #22c55e; font-size: 18px;">✓</span>
                        <span style="color: #374151; font-size: 14px;">Unlimited candidate profile views</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="color: #22c55e; font-size: 18px;">✓</span>
                        <span style="color: #374151; font-size: 14px;">Advanced AI matching algorithm</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="color: #22c55e; font-size: 18px;">✓</span>
                        <span style="color: #374151; font-size: 14px;">Priority support</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="color: #22c55e; font-size: 18px;">✓</span>
                        <span style="color: #374151; font-size: 14px;">Candidate shortlists & custom branding</span>
                      </div>
                    </div>

                    <!-- Pricing Highlight -->
                    <div style="background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                      <p style="margin: 0 0 8px; color: rgba(255,255,255,0.9); font-size: 14px;">Professional Plan</p>
                      <p style="margin: 0 0 4px; color: white; font-size: 32px; font-weight: bold;">$49.99<span style="font-size: 16px; font-weight: normal;">/month</span></p>
                      <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 12px;">Cancel anytime</p>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin-top: 24px;">
                      <a href="https://weldmatch.lovable.app/pricing" 
                         style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Upgrade Now
                      </a>
                    </div>

                    <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                      Have questions? Just reply to this email and we'll help you out!
                    </p>

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

        logStep("Email sent successfully", { emailId: emailResponse.data?.id, to: employerEmail });
        emailResults.push({ email: employerEmail, success: true });

      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
        logStep("Failed to send email", { error: errorMessage });
        emailResults.push({ email: "unknown", success: false, error: errorMessage });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    const failureCount = emailResults.filter(r => !r.success).length;

    logStep("Completed sending reminder emails", { successCount, failureCount });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${successCount} reminder emails`, 
        emailsSent: successCount,
        failures: failureCount,
        details: emailResults
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR in function", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
