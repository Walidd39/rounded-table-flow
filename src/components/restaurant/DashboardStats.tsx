import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ShoppingBag, Euro, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    reservations_today: number;
    commandes_today: number;
    ca_today: number;
    ca_month: number;
  };
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="shadow-soft hover:shadow-medium transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <StatCard 
        title="Réservations aujourd'hui" 
        value={stats.reservations_today.toString()} 
        icon={Calendar}
        color="text-primary"
      />
      <StatCard 
        title="Commandes aujourd'hui" 
        value={stats.commandes_today.toString()} 
        icon={ShoppingBag}
        color="text-warning"
      />
      <StatCard 
        title="CA du jour" 
        value={`${stats.ca_today.toFixed(2)}€`} 
        icon={Euro}
        color="text-success"
      />
      <StatCard 
        title="CA du mois" 
        value={`${stats.ca_month.toFixed(2)}€`} 
        icon={TrendingUp}
        color="text-primary"
      />
    </div>
  );
}