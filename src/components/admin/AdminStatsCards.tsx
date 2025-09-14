import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Headphones, 
  Timer 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AdminStatsCards = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get new clients today
      const today = new Date().toISOString().split('T')[0];
      const { data: newClientsToday } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Get agents in progress
      const { data: agentsInProgress } = await supabase
        .from('vocal_agents')
        .select('*')
        .in('status', ['waiting', 'in_progress']);

      // Get agents delivered this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: agentsDelivered } = await supabase
        .from('vocal_agents')
        .select('*')
        .eq('status', 'delivered')
        .gte('completed_at', weekAgo.toISOString());

      // Get monthly revenue (approximation from recharges)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { data: monthlyRecharges } = await supabase
        .from('recharges')
        .select('prix')
        .eq('status', 'completed')
        .gte('created_at', thisMonth.toISOString());

      const monthlyRevenue = monthlyRecharges?.reduce((sum, recharge) => 
        sum + parseFloat(recharge.prix.toString()), 0) || 0;

      // Get total minutes consumed
      const { data: totalMinutes } = await supabase
        .from('consommation')
        .select('minutes_utilisees');

      const totalMinutesConsumed = totalMinutes?.reduce((sum, consumption) => 
        sum + consumption.minutes_utilisees, 0) || 0;

      return {
        newClientsToday: newClientsToday?.length || 0,
        agentsInProgress: agentsInProgress?.length || 0,
        agentsDelivered: agentsDelivered?.length || 0,
        monthlyRevenue,
        totalMinutesConsumed,
        averageCreationTime: 48 // Placeholder - à calculer avec de vraies données
      };
    }
  });

  const statsData = [
    {
      title: "Nouveaux Clients Aujourd'hui",
      value: stats?.newClientsToday?.toString() || "0",
      change: "+2",
      changeType: "increase",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Agents en Cours",
      value: stats?.agentsInProgress?.toString() || "0",
      change: "+1",
      changeType: "increase",
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Agents Livrés (7j)",
      value: stats?.agentsDelivered?.toString() || "0",
      change: "+5",
      changeType: "increase",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "Revenus du Mois",
      value: `${stats?.monthlyRevenue?.toFixed(0) || "0"}€`,
      change: "+18%",
      changeType: "increase",
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      title: "Minutes Consommées",
      value: stats?.totalMinutesConsumed?.toLocaleString() || "0",
      change: "2,4€ coût",
      changeType: "info",
      icon: Headphones,
      color: "text-info",
    },
    {
      title: "Temps Moyen Création",
      value: `${stats?.averageCreationTime || 48}h`,
      change: "Obj: 24h",
      changeType: stats && stats.averageCreationTime > 24 ? "decrease" : "increase",
      icon: Timer,
      color: "text-secondary",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <Badge 
                  variant="secondary" 
                  className={`${
                    stat.changeType === 'increase' 
                      ? 'bg-success/10 text-success border-success/20'
                      : stat.changeType === 'decrease'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-info/10 text-info border-info/20'
                  }`}
                >
                  {stat.change}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.changeType === 'info' ? 'Coût estimé' : 'Par rapport à hier'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};