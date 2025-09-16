import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Phone, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

interface Reservation {
  id: string;
  client_nom: string;
  client_telephone?: string;
  date_reservation: string;
  heure_reservation: string;
  nombre_personnes: number;
  statut: string;
  created_at: string;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  // Configuration des mises à jour temps réel
  useRealtimeUpdates({
    onNewReservation: (newReservation) => {
      toast.success(`Nouvelle réservation de ${newReservation.client_nom}!`);
      setReservations(prev => [newReservation, ...prev]);
    },
    onReservationUpdate: (updatedReservation) => {
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === updatedReservation.id 
            ? updatedReservation
            : reservation
        )
      );
    }
  });

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_reservations')
        .select('*')
        .eq('restaurant_id', user?.id)
        .order('date_reservation', { ascending: false });

      if (error) {
        console.error('Error fetching reservations:', error);
        toast.error("Erreur lors du chargement des réservations");
        return;
      }

      setReservations(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReservations();
    }
  }, [user?.id]);

  const filteredReservations = reservations.filter(reservation =>
    reservation.client_nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reservation.client_telephone && reservation.client_telephone.includes(searchQuery))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmee':
        return <Badge variant="default" className="bg-success/10 text-success border-success/30">Confirmée</Badge>;
      case 'arrivee':
        return <Badge variant="default" className="bg-primary/10 text-primary border-primary/30">Arrivée</Badge>;
      case 'annulee':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Réservations</h1>
          <p className="text-muted-foreground">
            Gérez toutes vos réservations restaurant
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchReservations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredReservations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Aucune réservation ne correspond à votre recherche." : "Vous n'avez pas encore de réservations."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold">{reservation.client_nom}</h3>
                        {getStatusBadge(reservation.statut)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.heure_reservation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.nombre_personnes} personne{reservation.nombre_personnes > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {reservation.client_telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.client_telephone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}