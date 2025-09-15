import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardStats } from "@/components/restaurant/DashboardStats";
import { ModernReservationCard } from "@/components/restaurant/ModernReservationCard";
import { ModernCommandeCard } from "@/components/restaurant/ModernCommandeCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bell, ArrowLeft, Book } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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

  // Update individual reservation status
  const updateReservationStatus = (reservationId: string, newStatus: string) => {
    setReservations(prev => 
      prev.map(reservation => 
        reservation.id === reservationId 
          ? { ...reservation, statut: newStatus }
          : reservation
      )
    );
  };

  // Update individual order status
  const updateCommandeStatus = (commandeId: string, newStatus: string) => {
    setCommandes(prev => 
      prev.map(commande => 
        commande.id === commandeId 
          ? { ...commande, statut: newStatus }
          : commande
      )
    );
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
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard Restaurant</h1>
                <p className="text-muted-foreground">
                  Gérez vos réservations et commandes IA en temps réel
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/menu-management')}
                className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
              >
                <Book className="h-4 w-4" />
                Gestion du Menu
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border-border/50 px-4 py-2">
              <Bell className="h-4 w-4" />
              {reservations.length + commandes.length} notifications
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-accent/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Réservations Section */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-xl">
                <span>Réservations du jour</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 font-semibold px-3">
                  {reservations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Chargement des réservations...</span>
                  </div>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Aucune réservation pour aujourd'hui</p>
                </div>
              ) : (
                reservations.map((reservation) => (
                  <ModernReservationCard 
                    key={reservation.id} 
                    reservation={reservation} 
                    onUpdate={updateReservationStatus}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Commandes Section */}
          <Card className="card-modern">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-xl">
                <span>Commandes du jour</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 font-semibold px-3">
                  {commandes.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Chargement des commandes...</span>
                  </div>
                </div>
              ) : commandes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Aucune commande pour aujourd'hui</p>
                </div>
              ) : (
                commandes.map((commande) => (
                  <ModernCommandeCard 
                    key={commande.id} 
                    commande={commande} 
                    onUpdate={updateCommandeStatus}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}