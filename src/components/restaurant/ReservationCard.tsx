import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface ReservationCardProps {
  reservation: Reservation;
  onUpdate: () => void;
}

const statusConfig = {
  confirmee: { label: "Confirmée", variant: "default" as const, color: "bg-blue-500" },
  annulee: { label: "Annulée", variant: "destructive" as const, color: "bg-red-500" },
  arrivee: { label: "Arrivée", variant: "secondary" as const, color: "bg-green-500" },
};

export function ReservationCard({ reservation, onUpdate }: ReservationCardProps) {
  const handleCallClient = () => {
    if (reservation.client_telephone) {
      window.location.href = `tel:${reservation.client_telephone}`;
    }
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('ai_reservations')
      .update({ statut: newStatus })
      .eq('id', reservation.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      toast.success("Statut mis à jour avec succès");
      onUpdate();
    }
  };

  const config = statusConfig[reservation.statut as keyof typeof statusConfig] || statusConfig.confirmee;

  return (
    <Card className={`shadow-soft hover:shadow-medium transition-shadow duration-200 border-l-4`} 
          style={{ borderLeftColor: config.color.replace('bg-', '#') }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{reservation.client_nom}</h3>
            {reservation.client_telephone && (
              <p className="text-muted-foreground text-sm">{reservation.client_telephone}</p>
            )}
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{reservation.heure_reservation}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{reservation.nombre_personnes} pers.</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {reservation.client_telephone && (
            <Button size="sm" variant="outline" onClick={handleCallClient}>
              <Phone className="h-4 w-4 mr-1" />
              Appeler
            </Button>
          )}
          
          {reservation.statut === 'confirmee' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => updateStatus('arrivee')}>
                Marquer arrivée
              </Button>
              <Button size="sm" variant="destructive" onClick={() => updateStatus('annulee')}>
                Annuler
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}