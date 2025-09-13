import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-MINUTES-WEBHOOK] ${step}${detailsStr}`);
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing completed checkout", { sessionId: session.id });

      const rechargeId = session.metadata?.recharge_id;
      const userId = session.metadata?.user_id;
      const packType = session.metadata?.pack_type;
      const minutes = parseInt(session.metadata?.minutes || "0");

      if (!rechargeId || !userId || !packType || !minutes) {
        logStep("ERROR: Missing metadata in session", { metadata: session.metadata });
        return new Response("Missing required metadata", { status: 400 });
      }

      // Update recharge status to completed
      const { error: updateError } = await supabaseClient
        .from('recharges')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', rechargeId);

      if (updateError) {
        logStep("ERROR: Failed to update recharge status", { error: updateError });
        return new Response("Failed to update recharge", { status: 500 });
      }

      // Add minutes to user profile using the database function
      const { error: addMinutesError } = await supabaseClient
        .rpc('add_minutes_to_user', {
          user_id_param: userId,
          minutes_to_add: minutes
        });

      if (addMinutesError) {
        logStep("ERROR: Failed to add minutes to user", { error: addMinutesError });
        return new Response("Failed to add minutes", { status: 500 });
      }

      // Add notification for successful recharge
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          title: "Recharge effectuée !",
          message: `🔋 Votre recharge de ${minutes} minutes a été effectuée avec succès ! Vos minutes sont maintenant disponibles.`,
          type: 'success'
        });

      if (notificationError) {
        logStep("WARNING: Failed to create notification", { error: notificationError });
        // Don't fail the whole process for notification error
      }

      logStep("Successfully processed payment", {
        rechargeId,
        userId,
        packType,
        minutes
      });

      // TODO: Send email confirmation here if needed
      // You can add email sending logic using Resend or similar service
      
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const rechargeId = session.metadata?.recharge_id;

      if (rechargeId) {
        // Update recharge status to failed
        const { error: updateError } = await supabaseClient
          .from('recharges')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', rechargeId);

        if (updateError) {
          logStep("ERROR: Failed to update failed recharge", { error: updateError });
        } else {
          logStep("Updated recharge status to failed", { rechargeId });
        }
      }
    }

    // Handle other event types as needed
    logStep("Webhook processed", { eventType: event.type });
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-minutes-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});