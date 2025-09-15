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
import { Clock, Euro, MoreHorizontal, Package, Truck, CheckCircle, CircleDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Commande {
  id: string;
  client_nom: string;
  heure_commande: string;
  items_commandes: string[];
  montant_total: number;
  statut: string;
}

interface ModernCommandeCardProps {
  commande: Commande;
  onUpdate: () => void;
}

const statusConfig = {
  recue: { 
    label: "Reçue", 
    variant: "secondary" as const, 
    bg: "bg-muted", 
    icon: CircleDot,
    color: "text-muted-foreground",
    nextStatus: "preparation" as const,
    nextLabel: "Commencer la préparation"
  },
  preparation: { 
    label: "En préparation", 
    variant: "default" as const, 
    bg: "bg-warning/10", 
    icon: Package,
    color: "text-warning",
    nextStatus: "prete" as const,
    nextLabel: "Marquer comme prête"
  },
  prete: { 
    label: "Prête", 
    variant: "default" as const, 
    bg: "bg-primary/10", 
    icon: CheckCircle,
    color: "text-primary",
    nextStatus: "livree" as const,
    nextLabel: "Marquer comme livrée"
  },
  livree: { 
    label: "Livrée", 
    variant: "default" as const, 
    bg: "bg-success/10", 
    icon: Truck,
    color: "text-success"
  },
};

export function ModernCommandeCard({ commande, onUpdate }: ModernCommandeCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Debug: vérifier si le composant se charge
  console.log('🔍 ModernCommandeCard rendered with:', { 
    id: commande.id, 
    statut: commande.statut, 
    client: commande.client_nom 
  });

  const updateStatus = async (newStatus: string) => {
    console.log('🔄 updateStatus called with:', { newStatus, commandeId: commande.id, currentStatus: commande.statut });
    setIsUpdating(true);
    
    try {
      console.log('🔍 About to update order in database...');
      
      const { data, error } = await supabase
        .from('ai_commandes')
        .update({ statut: newStatus })
        .eq('id', commande.id)
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

  const config = statusConfig[commande.statut as keyof typeof statusConfig] || statusConfig.recue;
  const StatusIcon = config.icon;
  const hasNextStatus = 'nextStatus' in config;

  return (
    <Card className="card-modern hover:scale-[1.01] transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {commande.client_nom}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{commande.heure_commande}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-success/10 text-success border-success/30 font-semibold"
              >
                <Euro className="h-3 w-3 mr-1" />
                {commande.montant_total.toFixed(2)}€
              </Badge>
              
              {hasNextStatus && 'nextStatus' in config ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Status button clicked!', { 
                      currentStatus: commande.statut, 
                      nextStatus: config.nextStatus,
                      commandeId: commande.id,
                      event: 'button_click'
                    });
                    updateStatus(config.nextStatus);
                  }}
                  className={`${config.bg} ${config.color} border-0 font-medium px-3 py-1 flex items-center gap-1 hover:opacity-80 cursor-pointer`}
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
            </div>
          </div>

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
            <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg z-50">
              {hasNextStatus && 'nextStatus' in config && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Dropdown item clicked!', { 
                      nextStatus: config.nextStatus,
                      commandeId: commande.id,
                      event: 'dropdown_click'
                    });
                    updateStatus(config.nextStatus);
                  }}
                  className="flex items-center gap-2 text-primary hover:text-primary"
                >
                  <CheckCircle className="h-4 w-4" />
                  {config.nextLabel}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Articles commandés:</p>
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            {commande.items_commandes.map((item, index) => (
              <p key={index} className="text-sm text-foreground">
                • {item}
              </p>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {hasNextStatus && 'nextStatus' in config && (
          <div className="pt-4 border-t border-border/50">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Main button clicked!', { 
                  nextStatus: config.nextStatus,
                  commandeId: commande.id,
                  event: 'main_button_click'
                });
                updateStatus(config.nextStatus);
              }}
              disabled={isUpdating}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium btn-glow"
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Mise à jour...
                </div>
              ) : (
                config.nextLabel
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}