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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { packType, userId } = await req.json();
    if (!packType || !PACK_DETAILS[packType as keyof typeof PACK_DETAILS]) {
      throw new Error("Invalid pack type selected");
    }

    const packDetails = PACK_DETAILS[packType as keyof typeof PACK_DETAILS];
    logStep("Pack selected", { packType, packDetails });

    // Create recharge record in database
    const { data: rechargeData, error: rechargeError } = await supabaseClient
      .from('recharges')
      .insert({
        user_id: userId,
        pack_type: packType,
        minutes: packDetails.minutes,
        prix: packDetails.price,
        status: 'pending'
      })
      .select()
      .single();

    if (rechargeError) throw rechargeError;
    logStep("Recharge record created", { rechargeId: rechargeData.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
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
      success_url: `${origin}/minutes?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/minutes/recharge?payment=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        recharge_id: rechargeData.id,
        user_id: userId,
        pack_type: packType,
        minutes: packDetails.minutes.toString()
      }
    });

    // Update recharge with Stripe session ID
    await supabaseClient
      .from('recharges')
      .update({ stripe_payment_intent_id: session.id })
      .eq('id', rechargeData.id);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-minutes-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});