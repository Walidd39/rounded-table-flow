import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const STRIPE_PRICE_IDS = {
  basic: "price_1S5QntKDjMnqbmvOwEyBFoQM",
  pro: "price_1S5QoTKDjMnqbmvOTOTJGdn9", 
  premium: "price_1S5QpCKDjMnqbmvOJtfLP075"
};

const getPlanFromPriceId = (priceId: string): string => {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) return plan;
  }
  return 'basic';
};

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    logStep("ERROR: Missing environment variables");
    return new Response("Missing configuration", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("ERROR: Webhook signature verification failed", { error: err });
      return new Response(`Webhook signature verification failed: ${err}`, { status: 400 });
    }

    // Handle successful subscription creation
    if (event.type === "customer.subscription.created" || event.type === "invoice.payment_succeeded") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription event", { subscriptionId: subscription.id });

      // Get customer information
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (!customer || customer.deleted) {
        logStep("ERROR: Customer not found or deleted");
        return new Response("Customer not found", { status: 400 });
      }

      const customerEmail = (customer as Stripe.Customer).email;
      if (!customerEmail) {
        logStep("ERROR: Customer email not found");
        return new Response("Customer email not found", { status: 400 });
      }

      // Get user from email
      const { data: profiles, error: profileError } = await supabaseClient
        .from('profiles')
        .select('user_id, display_name, restaurant_name, restaurant_phone, restaurant_address, cuisine_type')
        .eq('display_name', customerEmail)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        logStep("ERROR: User profile not found", { email: customerEmail, error: profileError });
        return new Response("User profile not found", { status: 400 });
      }

      const profile = profiles[0];
      const userId = profile.user_id;

      // Get subscription plan
      const priceId = subscription.items.data[0].price.id;
      const subscriptionTier = getPlanFromPriceId(priceId);
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();

      logStep("Subscription details", {
        userId,
        customerEmail,
        subscriptionTier,
        priceId,
        subscriptionEnd
      });

      // Update or create subscriber record
      const { error: subscriberError } = await supabaseClient
        .from('subscribers')
        .upsert({
          user_id: userId,
          stripe_customer_id: customer.id,
          subscription_tier: subscriptionTier,
          subscription_status: 'active',
          subscription_end_date: subscriptionEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (subscriberError) {
        logStep("ERROR: Failed to update subscriber", { error: subscriberError });
        return new Response("Failed to update subscriber", { status: 500 });
      }

      // Create entry in vocal_agents table for the admin interface
      const { error: agentError } = await supabaseClient
        .from('vocal_agents')
        .insert({
          restaurant_id: userId,
          restaurant_name: profile.restaurant_name || `Restaurant de ${customerEmail}`,
          cuisine_type: profile.cuisine_type || 'Non spécifié',
          restaurant_phone: profile.restaurant_phone,
          restaurant_address: profile.restaurant_address,
          status: 'waiting',
          priority: subscriptionTier === 'premium' ? 'urgent' : 'normal',
          promised_delivery_date: new Date(Date.now() + (subscriptionTier === 'premium' ? 24 : 72) * 60 * 60 * 1000).toISOString()
        });

      if (agentError) {
        logStep("WARNING: Failed to create vocal agent entry", { error: agentError });
        // Don't fail the whole process for this
      } else {
        logStep("Created vocal agent entry successfully");
      }

      // Send welcome notification
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          title: "Bienvenue !",
          message: `🎉 Merci pour votre souscription ${subscriptionTier} ! Votre agent vocal sera créé et livré dans ${subscriptionTier === 'premium' ? '24h' : '72h'}. Nous vous tiendrons informé de l'avancement.`,
          type: 'success'
        });

      if (notificationError) {
        logStep("WARNING: Failed to create notification", { error: notificationError });
      }

      logStep("Successfully processed subscription", {
        userId,
        subscriptionTier,
        subscriptionId: subscription.id
      });

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      const { error: updateError } = await supabaseClient
        .from('subscribers')
        .update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_customer_id', subscription.customer);

      if (updateError) {
        logStep("ERROR: Failed to update cancelled subscription", { error: updateError });
      } else {
        logStep("Updated cancelled subscription", { customerId: subscription.customer });
      }
    }

    // Handle other events
    logStep("Webhook processed", { eventType: event.type });
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});