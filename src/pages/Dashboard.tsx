import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Calendar, Clock, Users, UtensilsCrossed, Phone, Search, Filter, Settings, User, CreditCard, Zap } from "lucide-react";
import { ReservationsTable } from "@/components/dashboard/ReservationsTable";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("reservations");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  // Debug: vérifier si le composant se charge
  console.log("Dashboard chargé !", { user, subscription });

  const getPlanDisplayName = (tier: string | null) => {
    switch (tier) {
      case 'basic': return 'Plan Basic';
      case 'pro': return 'Plan Pro';
      case 'premium': return 'Plan Premium';
      default: return 'Aucun plan';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UtensilsCrossed className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">mind.line</h1>
              </div>
              <Badge 
                variant={subscription.subscribed ? "default" : "secondary"} 
                className="px-3 py-1"
              >
                {getPlanDisplayName(subscription.subscription_tier)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('Navigating to /minutes');
                  navigate('/minutes');
                }}
                className="relative bg-red-100 border-2 border-red-500"
                title="Mes Minutes"
              >
                <Zap className="h-5 w-5 text-red-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/account')}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{user?.email}</span>
              </Button>
              
              {!subscription.subscribed && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/pricing')}
                  className="flex items-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Choisir un plan</span>
                </Button>
              )}
              
              <Settings 
                className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" 
                onClick={() => navigate('/account')}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <StatsCards />

        {/* Main Dashboard */}
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-fit grid-cols-2 bg-muted/50">
                <TabsTrigger value="reservations" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Réservations</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center space-x-2">
                  <UtensilsCrossed className="h-4 w-4" />
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
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
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
    </div>
  );
};

export default Dashboard;