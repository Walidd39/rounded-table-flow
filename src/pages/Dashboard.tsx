import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Search, Filter, ChefHat, Book, BarChart3, Sparkles } from "lucide-react";
import { ReservationsTable } from "@/components/dashboard/ReservationsTable";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("reservations");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  const getPlanDisplayName = (tier: string | null) => {
    switch (tier) {
      case 'basic': return 'Plan Basic';
      case 'pro': return 'Plan Pro';
      case 'premium': return 'Plan Premium';
      default: return 'Aucun plan';
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Bienvenue sur votre tableau de bord AI Restaurant
              </p>
            </div>
          </div>
          
          <Badge 
            variant={subscription.subscribed ? "default" : "secondary"} 
            className="px-3 py-1 font-medium"
          >
            {getPlanDisplayName(subscription.subscription_tier)}
          </Badge>
        </div>

        {/* Restaurant AI Features */}
        <Card className="card-modern glow-primary">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="gradient-primary bg-clip-text text-transparent font-bold">
                Agents Vocaux IA Restaurant
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              Système complet de réception et traitement automatisé des réservations et commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link to="/restaurant-dashboard">
                <Card className="group hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer border border-primary/20 hover:border-primary/40">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <ChefHat className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          Dashboard Restaurant
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Gérer les réservations et commandes IA
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/menu-management">
                <Card className="group hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer border border-primary/20 hover:border-primary/40">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Book className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          Gestion du Menu
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Configurer les plats et prix
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <StatsCards />

        {/* Main Dashboard */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-fit grid-cols-2 bg-card/50 backdrop-blur-sm border border-border/50">
                <TabsTrigger 
                  value="reservations" 
                  className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Réservations</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="orders" 
                  className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>Commandes</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-card/50 backdrop-blur-sm border-border/50"
                  />
                </div>
                <Button variant="outline" size="sm" className="bg-card/50 backdrop-blur-sm border-border/50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>

            <TabsContent value="reservations" className="space-y-6">
              <ReservationsTable searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <OrdersTable searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;