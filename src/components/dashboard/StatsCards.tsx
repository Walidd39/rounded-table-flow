import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";

const StatsCards = () => {
  const stats = [
    {
      title: "Réservations Aujourd'hui",
      value: "12",
      change: "+3",
      changeType: "increase",
      icon: Calendar,
      color: "text-primary",
    },
    {
      title: "Commandes en Cours",
      value: "8",
      change: "+2",
      changeType: "increase",
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Couverts ce Soir",
      value: "48",
      change: "+12",
      changeType: "increase",
      icon: Users,
      color: "text-success",
    },
    {
      title: "CA Estimé Aujourd'hui",
      value: "1,240€",
      change: "+18%",
      changeType: "increase",
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
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
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}
                >
                  {stat.change}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Par rapport à hier
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export { StatsCards };