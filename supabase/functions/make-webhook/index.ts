import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MAKE-WEBHOOK-RECEIVER] ${step}${detailsStr}`);
};

interface MakeWebhookData {
  type_demande?: string; // 'reservation' ou 'commande' 
  client_nom: string;
  client_telephone?: string;
  // Pour les réservations
  date_reservation?: string;
  heure_reservation?: string;
  nombre_personnes?: number;
  // Pour les commandes  
  items_commandes?: any[];
  montant_total?: number;
  heure_commande?: string;
  // ID du restaurant
  restaurant_id: string;
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

    const makeData: MakeWebhookData = await req.json();
    logStep("Received data from Make", { 
      type: makeData.type_demande,
      client: makeData.client_nom 
    });

    // Traiter les réservations
    if (makeData.type_demande === "reservation") {
      const { error: reservationError } = await supabaseClient
        .from('ai_reservations')
        .insert({
          restaurant_id: makeData.restaurant_id,
          client_nom: makeData.client_nom,
          client_telephone: makeData.client_telephone,
          date_reservation: makeData.date_reservation,
          heure_reservation: makeData.heure_reservation,
          nombre_personnes: makeData.nombre_personnes,
          statut: 'confirmee',
          confirmation: true
        });

      if (reservationError) {
        logStep("ERROR: Failed to insert reservation", { error: reservationError });
        throw new Error(`Failed to create reservation: ${reservationError.message}`);
      }

      logStep("Reservation created successfully", {
        client: makeData.client_nom,
        date: makeData.date_reservation,
        heure: makeData.heure_reservation
      });
    }

    // Traiter les commandes
    if (makeData.type_demande === "commande") {
      const { error: commandeError } = await supabaseClient
        .from('ai_commandes')
        .insert({
          restaurant_id: makeData.restaurant_id,
          client_nom: makeData.client_nom,
          items_commandes: makeData.items_commandes || [],
          montant_total: makeData.montant_total || 0,
          heure_commande: makeData.heure_commande,
          statut: 'recue'
        });

      if (commandeError) {
        logStep("ERROR: Failed to insert commande", { error: commandeError });
        throw new Error(`Failed to create commande: ${commandeError.message}`);
      }

      logStep("Commande created successfully", {
        client: makeData.client_nom,
        montant: makeData.montant_total,
        heure: makeData.heure_commande
      });
    }

    // Log the webhook call for tracking
    await supabaseClient
      .from('webhook_logs')
      .insert({
        webhook_type: 'make_receiver',
        data_type: makeData.type_demande,
        status: 'success'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${makeData.type_demande} created successfully`,
        data: {
          type: makeData.type_demande,
          client: makeData.client_nom
        }
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    logStep("ERROR in make-webhook-receiver", { message: error.message });
    
    // Log the error in database
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabaseClient
        .from('webhook_logs')
        .insert({
          webhook_type: 'make_receiver',
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