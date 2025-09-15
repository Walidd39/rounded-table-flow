import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Users, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReservationsTableProps {
  searchQuery: string;
}

interface Reservation {
  id: string;
  client_nom: string;
  client_telephone?: string;
  date_reservation: string;
  heure_reservation: string;
  nombre_personnes: number;
  statut: string;
}

const statusConfig = {
  confirmee: { 
    label: "Confirmée", 
    variant: "default" as const, 
    icon: Clock,
    color: "text-primary",
    nextStatus: "arrivee" as const
  },
  arrivee: { 
    label: "Arrivée", 
    variant: "default" as const, 
    icon: CheckCircle,
    color: "text-success" 
  },
  annulee: { 
    label: "Annulée", 
    variant: "destructive" as const, 
    icon: XCircle,
    color: "text-destructive" 
  },
};

const ReservationsTable = ({ searchQuery }: ReservationsTableProps) => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchReservations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_reservations')
        .select('*')
        .eq('restaurant_id', user.id)
        .order('date_reservation', { ascending: false });

      if (error) {
        console.error('Error fetching reservations:', error);
        toast.error("Erreur lors du chargement des réservations");
        return;
      }

      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reservationId: string, newStatus: string) => {
    setUpdating(reservationId);
    
    try {
      const { error } = await supabase
        .from('ai_reservations')
        .update({ statut: newStatus })
        .eq('id', reservationId);

      if (error) {
        console.error('Error updating status:', error);
        toast.error("Erreur lors de la mise à jour du statut");
        return;
      }

      toast.success(`Statut mis à jour: ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`);
      fetchReservations(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(null);
    }
  };

  const callClient = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  useEffect(() => {
    fetchReservations();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReservations, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const filteredReservations = reservations.filter(reservation =>
    reservation.client_nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reservation.client_telephone && reservation.client_telephone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (statut: string) => {
    const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.confirmee;
    const StatusIcon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="card-modern">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <span>Réservations</span>
          <Badge variant="secondary">{filteredReservations.length}</Badge>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchReservations}
          className="bg-card/50 backdrop-blur-sm border-border/50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Chargement des réservations...</span>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Aucune réservation ne correspond à votre recherche' : 'Aucune réservation trouvée'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Personnes</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => {
                const config = statusConfig[reservation.statut as keyof typeof statusConfig] || statusConfig.confirmee;
                const canUpdateToArrivee = reservation.statut === 'confirmee';
                
                return (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.client_nom}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{new Date(reservation.date_reservation).toLocaleDateString('fr-FR')}</span>
                        <span className="text-sm text-muted-foreground">{reservation.heure_reservation}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.nombre_personnes}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reservation.client_telephone ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => callClient(reservation.client_telephone!)}
                          className="h-8 p-2 hover:bg-accent/50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(reservation.statut)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canUpdateToArrivee && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(reservation.id, 'arrivee')}
                            disabled={updating === reservation.id}
                            className="h-8"
                          >
                            {updating === reservation.id ? (
                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>Marquer arrivée</>
                            )}
                          </Button>
                        )}
                        {reservation.statut !== 'annulee' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatus(reservation.id, 'annulee')}
                            disabled={updating === reservation.id}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            {updating === reservation.id ? (
                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>Annuler</>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export { ReservationsTable };