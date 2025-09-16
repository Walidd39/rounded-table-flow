import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Clock, Euro, Search, RefreshCw, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

interface Commande {
  id: string;
  client_nom: string;
  heure_commande: string;
  items_commandes: any; // JSON type from database
  montant_total: number;
  statut: string;
  created_at: string;
}

export default function Orders() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  // Configuration des mises à jour temps réel
  useRealtimeUpdates({
    onNewCommande: (newCommande) => {
      toast.success(`Nouvelle commande de ${newCommande.client_nom}!`);
      setCommandes(prev => [newCommande, ...prev]);
    },
    onCommandeUpdate: (updatedCommande) => {
      setCommandes(prev => 
        prev.map(commande => 
          commande.id === updatedCommande.id 
            ? updatedCommande
            : commande
        )
      );
    }
  });

  const fetchCommandes = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_commandes')
        .select('*')
        .eq('restaurant_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error("Erreur lors du chargement des commandes");
        return;
      }

      setCommandes(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchCommandes();
    }
  }, [user?.id]);

  const filteredCommandes = commandes.filter(commande => {
    const itemsArray = Array.isArray(commande.items_commandes) ? commande.items_commandes : [];
    return commande.client_nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      itemsArray.some((item: string) => 
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recue':
        return <Badge variant="secondary">Reçue</Badge>;
      case 'preparation':
        return <Badge variant="default" className="bg-warning/10 text-warning border-warning/30">En préparation</Badge>;
      case 'prete':
        return <Badge variant="default" className="bg-primary/10 text-primary border-primary/30">Prête</Badge>;
      case 'livree':
        return <Badge variant="default" className="bg-success/10 text-success border-success/30">Livrée</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez toutes vos commandes restaurant
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchCommandes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredCommandes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Aucune commande ne correspond à votre recherche." : "Vous n'avez pas encore de commandes."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCommandes.map((commande) => (
              <Card key={commande.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{commande.client_nom}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{commande.heure_commande}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-semibold">
                            <Euro className="h-3 w-3 mr-1" />
                            {commande.montant_total.toFixed(2)}€
                          </Badge>
                          {getStatusBadge(commande.statut)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Articles commandés:</p>
                      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                        {Array.isArray(commande.items_commandes) ? commande.items_commandes.map((item: string, index: number) => (
                          <p key={index} className="text-sm text-foreground flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            {item}
                          </p>
                        )) : (
                          <p className="text-sm text-muted-foreground">Aucun article</p>
                        )}
                      </div>
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