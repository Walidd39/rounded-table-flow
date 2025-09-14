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
  Mail, 
  Phone, 
  Play, 
  Pause, 
  CheckCircle, 
  MessageCircle,
  Search,
  Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AgentsQueue = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['vocal-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocal_agents')
        .select(`
          *,
          restaurant:profiles!vocal_agents_restaurant_id_fkey(
            display_name,
            restaurant_name,
            restaurant_phone,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('vocal_agents')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocal-agents'] });
      toast.success("Statut mis à jour avec succès");
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'normal': return 'bg-warning/10 text-warning border-warning/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'testing': return 'bg-warning/10 text-warning border-warning/20';
      case 'delivered': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'testing': return 'Tests';
      case 'delivered': return 'Livré';
      default: return status;
    }
  };

  const handleStatusChange = (agentId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === 'in_progress' && !agents?.find(a => a.id === agentId)?.started_at) {
      updates.started_at = new Date().toISOString();
    }
    
    if (newStatus === 'delivered') {
      updates.completed_at = new Date().toISOString();
      updates.priority = 'completed';
    }
    
    updateAgentMutation.mutate({ id: agentId, updates });
  };

  const filteredAgents = agents?.filter(agent => {
    const matchesSearch = !searchQuery || 
      agent.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.restaurant?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesPlan = planFilter === 'all';
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par restaurant ou propriétaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="waiting">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="testing">Tests</SelectItem>
                <SelectItem value="delivered">Livré</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
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
          <CardTitle>File d'Attente des Agents ({filteredAgents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Temps écoulé</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents?.map((agent) => {
                const createdDate = new Date(agent.created_at);
                const now = new Date();
                const hoursElapsed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
                
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agent.restaurant_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.cuisine_type}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`mailto:${agent.restaurant?.display_name}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {agent.restaurant?.display_name}
                          </a>
                        </div>
                        {agent.restaurant_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a 
                              href={`tel:${agent.restaurant_phone}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {agent.restaurant_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        Free
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={agent.status}
                        onValueChange={(value) => handleStatusChange(agent.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={getStatusColor(agent.status)} variant="secondary">
                            {getStatusLabel(agent.status)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waiting">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="testing">Tests</SelectItem>
                          <SelectItem value="delivered">Livré</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Badge className={getPriorityColor(agent.priority)} variant="secondary">
                        {agent.priority === 'urgent' ? 'Urgent' : 
                         agent.priority === 'completed' ? 'Terminé' : 'Normal'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className={`text-sm ${hoursElapsed > 72 ? 'text-destructive font-medium' : 
                                                 hoursElapsed > 48 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {hoursElapsed}h
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${agent.restaurant?.display_name}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        
                        {agent.restaurant_phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`tel:${agent.restaurant_phone}`)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredAgents?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun agent trouvé avec les filtres sélectionnés
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};