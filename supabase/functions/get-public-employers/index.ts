import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (resets on function cold start)
// For production, use Redis or a database table
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetTime - now };
}

function getClientIdentifier(req: Request): string {
  // Use forwarded IP if available, otherwise fall back to a hash of headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  
  return cfConnectingIp || realIp || forwardedFor?.split(",")[0]?.trim() || "anonymous";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const clientId = getClientIdentifier(req);
    const rateCheck = checkRateLimit(clientId);

    // Add rate limit headers
    const rateLimitHeaders = {
      ...corsHeaders,
      "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
      "X-RateLimit-Remaining": rateCheck.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(rateCheck.resetIn / 1000).toString(),
    };

    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for ${clientId}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { ...rateLimitHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const url = new URL(req.url);
    const employerId = url.searchParams.get("id");
    const employerIds = url.searchParams.get("ids"); // Comma-separated for batch
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50); // Max 50
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const baseQuery = supabase
      .from("employer_profiles_public")
      .select("id, company_name, logo_url, city, state, industry, company_size, description, website");

    let data;
    let error;

    if (employerId) {
      // Single employer lookup
      const result = await baseQuery.eq("id", employerId).single();
      data = result.data;
      error = result.error;
    } else if (employerIds) {
      // Batch lookup (limit to 20 IDs max to prevent abuse)
      const ids = employerIds.split(",").slice(0, 20);
      const result = await baseQuery.in("id", ids);
      data = result.data;
      error = result.error;
    } else {
      // List with pagination
      const result = await baseQuery.range(offset, offset + limit - 1);
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch employer data" }),
        { 
          status: 500, 
          headers: { ...rateLimitHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Served employer data for ${clientId}, remaining: ${rateCheck.remaining}`);

    return new Response(
      JSON.stringify({ data }),
      { 
        status: 200, 
        headers: { ...rateLimitHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
