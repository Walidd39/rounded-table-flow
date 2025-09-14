import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/components/restaurant/DashboardStats";
import { ReservationCard } from "@/components/restaurant/ReservationCard";
import { CommandeCard } from "@/components/restaurant/CommandeCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";

interface Reservation {
  id: string;
  client_nom: string;
  client_telephone?: string;
  date_reservation: string;
  heure_reservation: string;
  nombre_personnes: number;
  statut: string;
}

interface Commande {
  id: string;
  client_nom: string;
  heure_commande: string;
  items_commandes: string[];
  montant_total: number;
  statut: string;
}

interface CommandeRaw {
  id: string;
  client_nom: string;
  heure_commande: string;
  items_commandes: any;
  montant_total: number;
  statut: string;
}

interface Stats {
  reservations_today: number;
  commandes_today: number;
  ca_today: number;
  ca_month: number;
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [stats, setStats] = useState<Stats>({
    reservations_today: 0,
    commandes_today: 0,
    ca_today: 0,
    ca_month: 0
  });
  const [loading, setLoading] = useState(true);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's reservations
      const today = new Date().toISOString().split('T')[0];
      const { data: reservationsData } = await supabase
        .from('ai_reservations')
        .select('*')
        .eq('restaurant_id', user.id)
        .eq('date_reservation', today)
        .order('heure_reservation');

      // Fetch today's orders
      const { data: commandesRawData } = await supabase
        .from('ai_commandes')
        .select('*')
        .eq('restaurant_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .order('heure_commande');

      // Transform raw data to proper format
      const commandesData: Commande[] = commandesRawData?.map((cmd: CommandeRaw) => ({
        ...cmd,
        items_commandes: Array.isArray(cmd.items_commandes) ? cmd.items_commandes : []
      })) || [];

      // Calculate stats
      const reservationsToday = reservationsData?.length || 0;
      const commandesToday = commandesData?.length || 0;
      const caToday = commandesData?.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0) || 0;

      // Fetch monthly revenue
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: monthlyOrders } = await supabase
        .from('ai_commandes')
        .select('montant_total')
        .eq('restaurant_id', user.id)
        .gte('created_at', startOfMonth);

      const caMonth = monthlyOrders?.reduce((sum, cmd) => sum + parseFloat(cmd.montant_total.toString()), 0) || 0;

      setReservations(reservationsData || []);
      setCommandes(commandesData);
      setStats({
        reservations_today: reservationsToday,
        commandes_today: commandesToday,
        ca_today: caToday,
        ca_month: caMonth
      });

    } catch (error: any) {
      toast.error("Erreur lors du chargement des données");
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [user.id]);

  const handleRefresh = () => {
    toast.info("Actualisation des données...");
    fetchData();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Restaurant</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {reservations.length + commandes.length} notifications
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Réservations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Réservations du jour</span>
              <Badge variant="secondary">{reservations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des réservations...
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune réservation pour aujourd'hui
              </div>
            ) : (
              reservations.map((reservation) => (
                <ReservationCard 
                  key={reservation.id} 
                  reservation={reservation} 
                  onUpdate={fetchData}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Commandes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Commandes du jour</span>
              <Badge variant="secondary">{commandes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des commandes...
              </div>
            ) : commandes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune commande pour aujourd'hui
              </div>
            ) : (
              commandes.map((commande) => (
                <CommandeCard 
                  key={commande.id} 
                  commande={commande} 
                  onUpdate={fetchData}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}