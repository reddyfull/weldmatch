import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  certificationId: string;
  newStatus: "verified" | "invalid" | "pending" | "expired";
  certType: string;
  certName?: string;
}

const STATUS_MESSAGES = {
  verified: {
    subject: "Your Certification Has Been Verified! ✅",
    heading: "Great News!",
    message: "Your welding certification has been successfully verified by our team.",
    color: "#22c55e",
  },
  invalid: {
    subject: "Certification Review Update",
    heading: "Certification Update Required",
    message: "After review, we were unable to verify your certification. Please upload a clearer image or contact support for assistance.",
    color: "#ef4444",
  },
  pending: {
    subject: "Certification Under Review",
    heading: "Review in Progress",
    message: "Your certification is currently being reviewed by our team. We'll notify you once the review is complete.",
    color: "#f59e0b",
  },
  expired: {
    subject: "Certification Expired Notice",
    heading: "Certification Expired",
    message: "Your welding certification has expired. Please upload a renewed certification to maintain your verified status.",
    color: "#f97316",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-cert-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { certificationId, newStatus, certType, certName }: NotificationRequest = await req.json();

    console.log(`Processing notification for certification ${certificationId}, status: ${newStatus}`);

    // Get certification with welder info
    const { data: cert, error: certError } = await supabase
      .from("certifications")
      .select(`
        id,
        cert_type,
        cert_name,
        welder_id,
        welder_profiles!inner (
          user_id,
          profiles:user_id (
            full_name
          )
        )
      `)
      .eq("id", certificationId)
      .single();

    if (certError || !cert) {
      console.error("Error fetching certification:", certError);
      throw new Error("Certification not found");
    }

    console.log("Certification found:", cert);

    // Get user email from auth.users - handle array response from join
    const welderProfile = Array.isArray(cert.welder_profiles) 
      ? cert.welder_profiles[0] 
      : cert.welder_profiles;
    
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      welderProfile.user_id
    );

    if (userError || !userData?.user?.email) {
      console.error("Error fetching user email:", userError);
      throw new Error("User email not found");
    }

    const userEmail = userData.user.email;
    const profiles = Array.isArray(welderProfile.profiles) 
      ? welderProfile.profiles[0] 
      : welderProfile.profiles;
    const userName = profiles?.full_name || "Welder";
    const certDisplayName = certName || cert.cert_name || certType || cert.cert_type;
    const statusConfig = STATUS_MESSAGES[newStatus];

    console.log(`Sending email to ${userEmail} for ${certDisplayName}`);

    // Use Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "WeldMatch <onboarding@resend.dev>",
        to: [userEmail],
        subject: statusConfig.subject,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background-color: #1e3a5f; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 24px;">🔥 WeldMatch</h1>
                </div>
                
                <!-- Status Badge -->
                <div style="background-color: ${statusConfig.color}; padding: 16px; text-align: center;">
                  <h2 style="margin: 0; color: white; font-size: 20px;">${statusConfig.heading}</h2>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="margin: 0 0 16px; font-size: 16px; color: #374151;">
                    Hi ${userName},
                  </p>
                  <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                    ${statusConfig.message}
                  </p>
                  
                  <!-- Certification Info Box -->
                  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 500;">
                      CERTIFICATION DETAILS
                    </p>
                    <p style="margin: 0; font-size: 18px; color: #1f2937; font-weight: 600;">
                      ${certDisplayName}
                    </p>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">
                      Status: <span style="color: ${statusConfig.color}; font-weight: 600;">${newStatus.toUpperCase()}</span>
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="https://weldmatch.lovable.app/welder/documents" 
                       style="display: inline-block; background-color: #1e3a5f; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View My Certifications
                    </a>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    This is an automated message from WeldMatch.
                  </p>
                  <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                    © 2026 WeldMatch. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-cert-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);