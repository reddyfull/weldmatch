import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-LIST-CUSTOMERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (adminError || !isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }
    logStep("Admin verified", { userId: user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { limit = 20, starting_after, email } = await req.json().catch(() => ({}));

    // Build query params
    const queryParams: Stripe.CustomerListParams = {
      limit: Math.min(limit, 100),
    };

    if (starting_after) {
      queryParams.starting_after = starting_after;
    }
    if (email) {
      queryParams.email = email;
    }

    logStep("Fetching customers", queryParams);

    const customers = await stripe.customers.list(queryParams);

    // Get subscription status for each customer
    const customersWithSubs = await Promise.all(
      customers.data.map(async (customer: Stripe.Customer) => {
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 1,
        });

        const activeSub = subscriptions.data.find((s: Stripe.Subscription) => s.status === 'active' || s.status === 'trialing');

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          created: customer.created,
          subscription: activeSub ? {
            id: activeSub.id,
            status: activeSub.status,
            plan: activeSub.items.data[0]?.price?.id,
            current_period_end: activeSub.current_period_end,
          } : null,
          balance: customer.balance,
          currency: customer.currency,
        };
      })
    );

    logStep("Customers fetched", { count: customersWithSubs.length });

    return new Response(JSON.stringify({
      customers: customersWithSubs,
      has_more: customers.has_more,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});
