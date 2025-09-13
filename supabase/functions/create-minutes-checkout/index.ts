import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MINUTES-CHECKOUT] ${step}${detailsStr}`);
};

const STRIPE_MINUTES_PRICE_IDS = {
  S: "price_minutes_s_100",  // À remplacer par les vrais IDs Stripe
  M: "price_minutes_m_250",  
  L: "price_minutes_l_750",  
  XL: "price_minutes_xl_1500"
};

const PACK_DETAILS = {
  S: { minutes: 100, price: 19 },
  M: { minutes: 250, price: 49 },
  L: { minutes: 750, price: 149 },
  XL: { minutes: 1500, price: 299 }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Parse request body first
    const body = await req.json();
    const { packType, userId } = body;
    logStep("Request body parsed", { packType, userId });

    if (!packType || !PACK_DETAILS[packType as keyof typeof PACK_DETAILS]) {
      throw new Error("Invalid pack type selected");
    }

    const packDetails = PACK_DETAILS[packType as keyof typeof PACK_DETAILS];
    logStep("Pack selected", { packType, packDetails });

    // Get user from Authorization header using ANON key for JWT validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verify user authentication
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      logStep("Auth error", { error: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    let customerId;
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing customer found", { customerId });
      } else {
        logStep("No existing customer found");
      }
    } catch (stripeError) {
      logStep("Error finding customer", { error: stripeError });
      // Continue without customer ID
    }

    const origin = req.headers.get("origin") || "https://cb9c56c0-bbe1-421a-ba2a-b581cf1bc264.sandbox.lovable.dev";
    logStep("Creating checkout session", { origin });
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Pack ${packType} - ${packDetails.minutes} minutes`,
              description: `${packDetails.minutes} minutes d'appels IA pour votre restaurant`,
            },
            unit_amount: packDetails.price * 100, // Prix en centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        user_id: userId,
        pack_type: packType,
        minutes: packDetails.minutes.toString()
      }
    });

    logStep("Checkout session created successfully", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    logStep("ERROR in create-minutes-checkout", { 
      message: errorMessage, 
      stack: errorStack,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.name : 'Unknown error type'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});