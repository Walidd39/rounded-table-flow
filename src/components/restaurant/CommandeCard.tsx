import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Euro } from "lucide-react";
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

interface CommandeCardProps {
  commande: Commande;
  onUpdate: () => void;
}

const statusConfig = {
  recue: { label: "Reçue", variant: "default" as const, color: "bg-blue-500" },
  en_preparation: { label: "En préparation", variant: "secondary" as const, color: "bg-yellow-500" },
  prete: { label: "Prête", variant: "default" as const, color: "bg-green-500" },
  livree: { label: "Livrée", variant: "secondary" as const, color: "bg-gray-500" },
};

export function CommandeCard({ commande, onUpdate }: CommandeCardProps) {
  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('ai_commandes')
      .update({ statut: newStatus })
      .eq('id', commande.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      toast.success("Statut mis à jour avec succès");
      onUpdate();
    }
  };

  const config = statusConfig[commande.statut as keyof typeof statusConfig] || statusConfig.recue;

  const getNextStatus = () => {
    switch (commande.statut) {
      case 'recue':
        return 'en_preparation';
      case 'en_preparation':
        return 'prete';
      case 'prete':
        return 'livree';
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();

  return (
    <Card className={`shadow-soft hover:shadow-medium transition-shadow duration-200 border-l-4`}
          style={{ borderLeftColor: config.color.replace('bg-', '#') }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{commande.client_nom}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{commande.heure_commande}</span>
            </div>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {commande.items_commandes.map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 font-bold text-green-600">
            <Euro className="h-4 w-4" />
            <span>{commande.montant_total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            Détails
          </Button>
          
          {nextStatus && (
            <Button 
              size="sm" 
              onClick={() => updateStatus(nextStatus)}
              variant={nextStatus === 'livree' ? 'default' : 'secondary'}
            >
              {nextStatus === 'en_preparation' && 'Commencer préparation'}
              {nextStatus === 'prete' && 'Marquer prête'}
              {nextStatus === 'livree' && 'Marquer livrée'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}