import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeUpdateProps {
  onNewReservation?: (reservation: any) => void;
  onNewCommande?: (commande: any) => void;
  onReservationUpdate?: (reservation: any) => void;
  onCommandeUpdate?: (commande: any) => void;
}

export function useRealtimeUpdates({
  onNewReservation,
  onNewCommande,
  onReservationUpdate,
  onCommandeUpdate
}: RealtimeUpdateProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime updates for user:', user.id);

    // Écouter les nouvelles réservations pour CET utilisateur uniquement
    const reservationChannel = supabase
      .channel(`reservations_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_reservations',
          filter: `restaurant_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New reservation received:', payload.new);
          onNewReservation?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_reservations',
          filter: `restaurant_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Reservation updated:', payload.new);
          onReservationUpdate?.(payload.new);
        }
      )
      .subscribe();

    // Écouter les nouvelles commandes pour CET utilisateur uniquement
    const commandeChannel = supabase
      .channel(`commandes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_commandes',
          filter: `restaurant_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New commande received:', payload.new);
          onNewCommande?.(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_commandes',
          filter: `restaurant_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Commande updated:', payload.new);
          onCommandeUpdate?.(payload.new);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions for user:', user.id);
      reservationChannel.unsubscribe();
      commandeChannel.unsubscribe();
    };
  }, [user?.id, onNewReservation, onNewCommande, onReservationUpdate, onCommandeUpdate]);
}