import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/w0oo5ci4at3cpe0a6nhqkccdpqs9a6sl";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MAKE-WEBHOOK] ${step}${detailsStr}`);
};

interface WebhookData {
  type: 'reservation' | 'commande' | 'user_activity' | 'subscription' | 'minutes_usage';
  data: any;
  user_id?: string;
  timestamp?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const webhookData: WebhookData = await req.json();
    logStep("Received webhook data", { type: webhookData.type });

    // Enrich data with timestamp if not provided
    if (!webhookData.timestamp) {
      webhookData.timestamp = new Date().toISOString();
    }

    // Get additional user information if user_id is provided
    let enrichedData = { ...webhookData };
    
    if (webhookData.user_id) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('display_name, minutes_restantes')
        .eq('user_id', webhookData.user_id)
        .single();

      if (profile) {
        enrichedData.user_profile = profile;
      }

      // Get subscriber info
      const { data: subscriber } = await supabaseClient
        .from('subscribers')
        .select('tier, status')
        .eq('user_id', webhookData.user_id)
        .single();

      if (subscriber) {
        enrichedData.subscription = subscriber;
      }
    }

    // Send to Make webhook
    const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(enrichedData),
    });

    if (!makeResponse.ok) {
      const errorText = await makeResponse.text();
      logStep("ERROR: Failed to send to Make", { 
        status: makeResponse.status, 
        error: errorText 
      });
      throw new Error(`Make webhook failed: ${makeResponse.status} - ${errorText}`);
    }

    logStep("Successfully sent to Make", { 
      type: webhookData.type,
      status: makeResponse.status 
    });

    // Log the webhook call in database for tracking
    await supabaseClient
      .from('webhook_logs')
      .insert({
        webhook_type: 'make',
        data_type: webhookData.type,
        user_id: webhookData.user_id,
        status: 'success',
        response_status: makeResponse.status
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Data sent to Make successfully",
        type: webhookData.type
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    logStep("ERROR in make-webhook", { message: error.message });
    
    // Try to log the error in database
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabaseClient
        .from('webhook_logs')
        .insert({
          webhook_type: 'make',
          status: 'error',
          error_message: error.message
        });
    } catch (dbError) {
      logStep("Failed to log error to database", { error: dbError });
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);