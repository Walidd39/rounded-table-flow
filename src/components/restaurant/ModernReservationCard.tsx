import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Clock, Users, MoreHorizontal, Check, X, Clock3 } from "lucide-react";
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

interface ModernReservationCardProps {
  reservation: Reservation;
  onUpdate: () => void;
}

const statusConfig = {
  confirmee: { 
    label: "Confirmée", 
    variant: "default" as const, 
    bg: "bg-primary/10", 
    icon: Clock3,
    color: "text-primary" 
  },
  arrivee: { 
    label: "Arrivée", 
    variant: "default" as const, 
    bg: "bg-success/10", 
    icon: Check,
    color: "text-success" 
  },
  annulee: { 
    label: "Annulée", 
    variant: "destructive" as const, 
    bg: "bg-destructive/10", 
    icon: X,
    color: "text-destructive" 
  },
};

export function ModernReservationCard({ reservation, onUpdate }: ModernReservationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: string) => {
    console.log('🔄 updateStatus called for reservation:', { newStatus, reservationId: reservation.id, currentStatus: reservation.statut });
    setIsUpdating(true);
    
    try {
      console.log('🔍 About to update reservation in database...');
      
      const { data, error } = await supabase
        .from('ai_reservations')
        .update({ statut: newStatus })
        .eq('id', reservation.id)
        .select();

      console.log('📡 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        toast.error(`Erreur lors de la mise à jour du statut: ${error.message}`);
        return;
      }

      console.log('✅ Update successful:', data);
      toast.success(`Statut mis à jour: ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`);
      onUpdate();
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  const callClient = () => {
    if (reservation.client_telephone) {
      window.location.href = `tel:${reservation.client_telephone}`;
    }
  };

  const config = statusConfig[reservation.statut as keyof typeof statusConfig] || statusConfig.confirmee;
  const StatusIcon = config.icon;

  return (
    <Card className="card-modern hover:scale-[1.01] transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {reservation.client_nom}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{reservation.heure_reservation}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{reservation.nombre_personnes} pers.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reservation.statut === 'confirmee' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🖱️ Reservation status button clicked!', { currentStatus: reservation.statut });
                  updateStatus('arrivee');
                }}
                className={`${config.bg} ${config.color} border-0 font-medium px-3 py-1 flex items-center gap-1 hover:opacity-80`}
                disabled={isUpdating}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
                <span className="ml-1 text-xs opacity-70">→</span>
              </Button>
            ) : (
              <Badge 
                variant={config.variant}
                className={`${config.bg} ${config.color} border-0 font-medium px-3 py-1 flex items-center gap-1`}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-accent/50"
                  disabled={isUpdating}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
                {reservation.statut === 'confirmee' && (
                  <DropdownMenuItem 
                    onClick={() => {
                      console.log('🖱️ Reservation dropdown clicked - Arrivée!');
                      updateStatus('arrivee');
                    }}
                    className="flex items-center gap-2 text-success hover:text-success"
                  >
                    <Check className="h-4 w-4" />
                    Marquer comme arrivée
                  </DropdownMenuItem>
                )}
                {reservation.statut !== 'annulee' && (
                  <DropdownMenuItem 
                    onClick={() => {
                      console.log('🖱️ Reservation dropdown clicked - Annulée!');
                      updateStatus('annulee');
                    }}
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    Annuler la réservation
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {reservation.client_telephone && (
          <div className="pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={callClient}
              className="w-full bg-accent/30 hover:bg-accent/50 border-border/50 hover:border-primary/50 transition-all duration-200"
            >
              <Phone className="h-4 w-4 mr-2" />
              Appeler {reservation.client_telephone}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}