import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle, Package, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface OrdersTableProps {
  searchQuery: string;
}

interface Commande {
  id: string;
  client_nom: string;
  heure_commande: string;
  items_commandes: string[];
  montant_total: number;
  statut: string;
  created_at: string;
}

const statusConfig = {
  recue: { 
    label: "Reçue", 
    variant: "secondary" as const, 
    icon: Package,
    color: "text-muted-foreground",
    nextStatus: "en_preparation" as const
  },
  en_preparation: { 
    label: "En préparation", 
    variant: "default" as const, 
    icon: Clock,
    color: "text-warning",
    nextStatus: "prete" as const
  },
  prete: { 
    label: "Prête", 
    variant: "default" as const, 
    icon: CheckCircle,
    color: "text-primary",
    nextStatus: "livree" as const
  },
  livree: { 
    label: "Livrée", 
    variant: "default" as const, 
    icon: CheckCircle,
    color: "text-success"
  },
};

const OrdersTable = ({ searchQuery }: OrdersTableProps) => {
  const { user } = useAuth();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchCommandes = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_commandes')
        .select('*')
        .eq('restaurant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error("Erreur lors du chargement des commandes");
        return;
      }

      // Transform data to proper format
      const transformedData: Commande[] = data?.map((cmd: any) => ({
        ...cmd,
        items_commandes: Array.isArray(cmd.items_commandes) ? cmd.items_commandes : []
      })) || [];

      setCommandes(transformedData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (commandeId: string, newStatus: string) => {
    setUpdating(commandeId);
    
    try {
      const { error } = await supabase
        .from('ai_commandes')
        .update({ statut: newStatus })
        .eq('id', commandeId);

      if (error) {
        console.error('Error updating status:', error);
        toast.error("Erreur lors de la mise à jour du statut");
        return;
      }

      toast.success(`Statut mis à jour: ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`);
      fetchCommandes(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchCommandes();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCommandes, 30000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const filteredCommandes = commandes.filter(commande =>
    commande.client_nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    commande.items_commandes.some(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getStatusBadge = (statut: string) => {
    const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.recue;
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
          <span>Commandes</span>
          <Badge variant="secondary">{filteredCommandes.length}</Badge>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchCommandes}
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
              <span className="text-muted-foreground">Chargement des commandes...</span>
            </div>
          </div>
        ) : filteredCommandes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Aucune commande ne correspond à votre recherche' : 'Aucune commande trouvée'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommandes.map((commande) => {
                const config = statusConfig[commande.statut as keyof typeof statusConfig] || statusConfig.recue;
                const hasNextStatus = 'nextStatus' in config;
                
                return (
                  <TableRow key={commande.id}>
                    <TableCell className="font-medium">{commande.client_nom}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {commande.items_commandes.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {item}
                          </div>
                        ))}
                        {commande.items_commandes.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{commande.items_commandes.length - 2} autres
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{commande.heure_commande}</TableCell>
                    <TableCell className="font-medium">{commande.montant_total.toFixed(2)}€</TableCell>
                    <TableCell>{getStatusBadge(commande.statut)}</TableCell>
                    <TableCell>
                      {hasNextStatus && 'nextStatus' in config && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(commande.id, config.nextStatus)}
                          disabled={updating === commande.id}
                          className="h-8"
                        >
                          {updating === commande.id ? (
                            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>Passer à "{statusConfig[config.nextStatus]?.label}"</>
                          )}
                        </Button>
                      )}
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

export { OrdersTable };