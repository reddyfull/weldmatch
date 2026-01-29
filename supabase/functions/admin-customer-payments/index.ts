import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CUSTOMER-PAYMENTS] ${step}${detailsStr}`);
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
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { data: isAdmin, error: adminError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (adminError || !isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }
    logStep("Admin verified");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { customer_id, limit = 20 } = await req.json();
    if (!customer_id) throw new Error("customer_id is required");

    logStep("Fetching payments for customer", { customer_id });

    // Fetch payment intents for customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer_id,
      limit: Math.min(limit, 100),
    });

    // Fetch invoices for customer
    const invoices = await stripe.invoices.list({
      customer: customer_id,
      limit: Math.min(limit, 100),
    });

    // Fetch subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer_id,
      limit: 10,
    });

    // Get customer details
    const customer = await stripe.customers.retrieve(customer_id);

    const payments = paymentIntents.data.map((pi: Stripe.PaymentIntent) => ({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      created: pi.created,
      description: pi.description,
      payment_method_types: pi.payment_method_types,
      metadata: pi.metadata,
      refunded: pi.amount !== pi.amount_received && pi.status === 'succeeded',
      refund_amount: pi.amount - (pi.amount_received || 0),
    }));

    const invoiceData = invoices.data.map((inv: Stripe.Invoice) => ({
      id: inv.id,
      number: inv.number,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      period_start: inv.period_start,
      period_end: inv.period_end,
      hosted_invoice_url: inv.hosted_invoice_url,
      pdf: inv.invoice_pdf,
    }));

    const subscriptionData = subscriptions.data.map((sub: Stripe.Subscription) => ({
      id: sub.id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at,
      plan: {
        id: sub.items.data[0]?.price?.id,
        amount: sub.items.data[0]?.price?.unit_amount,
        interval: sub.items.data[0]?.price?.recurring?.interval,
        product: sub.items.data[0]?.price?.product,
      },
    }));

    logStep("Data fetched", { 
      payments: payments.length, 
      invoices: invoiceData.length,
      subscriptions: subscriptionData.length 
    });

    return new Response(JSON.stringify({
      customer: 'deleted' in customer ? null : {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: customer.created,
        balance: customer.balance,
      },
      payments,
      invoices: invoiceData,
      subscriptions: subscriptionData,
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
