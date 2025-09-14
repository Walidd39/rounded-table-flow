import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookData {
  type_demande1?: string;
  type_demande2?: string;
  restaurant_id: string;
  Nom: string;
  Telephone?: string;
  Date?: string;
  Heure?: string;
  Nombre_personnes?: string;
  confirmation?: boolean;
  Choix_menu?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const data: WebhookData = await req.json();
    console.log('Received webhook data:', data);

    // Traitement RÉSERVATIONS
    if (data.type_demande1 === "reservation") {
      const reservationData = {
        restaurant_id: data.restaurant_id,
        client_nom: data.Nom,
        client_telephone: data.Telephone,
        date_reservation: data.Date,
        heure_reservation: data.Heure,
        nombre_personnes: parseInt(data.Nombre_personnes || '1'),
        confirmation: data.confirmation || true,
        statut: 'confirmee'
      };

      const { error: reservationError } = await supabase
        .from('ai_reservations')
        .insert([reservationData]);

      if (reservationError) {
        console.error('Error inserting reservation:', reservationError);
        throw new Error(`Reservation insert failed: ${reservationError.message}`);
      }

      console.log('Reservation inserted successfully');
    }

    // Traitement COMMANDES
    if (data.type_demande2 === "commande") {
      // Calculer montant total
      let montantTotal = 0;
      
      if (data.Choix_menu && data.Choix_menu.length > 0) {
        for (const plat of data.Choix_menu) {
          const { data: prixData, error: prixError } = await supabase
            .from('menus_prix')
            .select('prix')
            .eq('restaurant_id', data.restaurant_id)
            .eq('nom_plat', plat)
            .maybeSingle();

          if (!prixError && prixData?.prix) {
            montantTotal += parseFloat(prixData.prix.toString());
          }
        }
      }

      const commandeData = {
        restaurant_id: data.restaurant_id,
        client_nom: data.Nom,
        heure_commande: data.Heure,
        items_commandes: data.Choix_menu || [],
        montant_total: montantTotal,
        statut: 'recue'
      };

      const { error: commandeError } = await supabase
        .from('ai_commandes')
        .insert([commandeData]);

      if (commandeError) {
        console.error('Error inserting order:', commandeError);
        throw new Error(`Order insert failed: ${commandeError.message}`);
      }

      console.log('Order inserted successfully');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});