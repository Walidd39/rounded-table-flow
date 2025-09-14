import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Clock,
  Search,
  Eye,
  Edit,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ClientsManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscribers(
            subscription_tier,
            subscription_status,
            subscription_end_date,
            stripe_customer_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const filteredClients = clients?.filter(client => {
    const matchesSearch = !searchQuery || 
      client.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const clientPlan = Array.isArray(client.subscribers) && client.subscribers.length > 0 
      ? client.subscribers[0].subscription_tier || 'free' 
      : 'free';
    const matchesPlan = planFilter === 'all' || clientPlan === planFilter;
    
    return matchesSearch && matchesPlan;
  });

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-primary/10 text-primary border-primary/20';
      case 'pro': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'basic': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche et Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par restaurant ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="free">Gratuit</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>
            Gestion des Clients ({filteredClients?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients?.map((client) => {
                const plan = Array.isArray(client.subscribers) && client.subscribers.length > 0 
                  ? client.subscribers[0].subscription_tier || 'free' 
                  : 'free';
                
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {client.restaurant_name || 'Restaurant non renseigné'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.cuisine_type || 'Type de cuisine non renseigné'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Minutes restantes: {client.minutes_restantes}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{client.display_name}</span>
                        </div>
                        {client.restaurant_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{client.restaurant_phone}</span>
                          </div>
                        )}
                        {client.restaurant_address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {client.restaurant_address}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={getPlanColor(plan)} variant="secondary">
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-success">Actif</span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{formatDate(client.created_at)}</div>
                        {Array.isArray(client.subscribers) && client.subscribers.length > 0 && client.subscribers[0].created_at && (
                          <div className="text-xs text-muted-foreground">
                            Plan depuis {formatDate(client.subscribers[0].created_at)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedClient(client)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Fiche Client - {client.restaurant_name || client.display_name}
                              </DialogTitle>
                              <DialogDescription>
                                Informations détaillées du client et historique
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedClient && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm">Informations Contact</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <Button 
                                          variant="link" 
                                          className="p-0 h-auto text-primary"
                                          onClick={() => window.open(`mailto:${selectedClient.display_name}`)}
                                        >
                                          {selectedClient.display_name}
                                        </Button>
                                      </div>
                                      
                                      {selectedClient.restaurant_phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <Button 
                                            variant="link" 
                                            className="p-0 h-auto text-primary"
                                            onClick={() => window.open(`tel:${selectedClient.restaurant_phone}`)}
                                          >
                                            {selectedClient.restaurant_phone}
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {selectedClient.restaurant_address && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">{selectedClient.restaurant_address}</span>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm">Abonnement</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Plan:</span>
                                        <Badge className={getPlanColor(plan)} variant="secondary">
                                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                                        </Badge>
                                      </div>
                                      
                                      {Array.isArray(selectedClient.subscribers) && 
                                       selectedClient.subscribers.length > 0 && 
                                       selectedClient.subscribers[0].subscription_end_date && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-muted-foreground">Fin d'abonnement:</span>
                                          <span className="text-sm">
                                            {formatDate(selectedClient.subscribers[0].subscription_end_date)}
                                          </span>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Minutes restantes:</span>
                                        <span className="text-sm font-medium">
                                          {selectedClient.minutes_restantes}
                                        </span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                <div className="space-y-4">
                                  <h3 className="text-sm font-medium">Historique des Recharges</h3>
                                  <p className="text-sm text-muted-foreground">Aucune recharge effectuée</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${client.display_name}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        
                        {client.restaurant_phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${client.restaurant_phone}`)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredClients?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client trouvé avec les filtres sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};