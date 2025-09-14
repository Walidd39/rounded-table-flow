import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { AgentsQueue } from "@/components/admin/AgentsQueue";
import { ClientsManagement } from "@/components/admin/ClientsManagement";
import { Settings, Users, Clock, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.user_role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        toast.error("Accès refusé - Privilèges administrateur requis");
      }
    };

    checkAdminRole();
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Accès Refusé</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas les privilèges administrateur nécessaires pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification des privilèges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">
              Interface Administrateur - Agents Vocaux IA
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Administrateur: {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              File d'Attente
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
              <AdminStatsCards />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Graphiques et Indicateurs</h2>
              <AdminCharts />
            </div>
          </TabsContent>

          <TabsContent value="queue">
            <AgentsQueue />
          </TabsContent>

          <TabsContent value="clients">
            <ClientsManagement />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Administrateur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configuration et paramètres avancés à venir...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;