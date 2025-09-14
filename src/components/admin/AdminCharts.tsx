import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const revenueData = [
  { date: '01/01', revenue: 1200 },
  { date: '02/01', revenue: 1500 },
  { date: '03/01', revenue: 1800 },
  { date: '04/01', revenue: 1400 },
  { date: '05/01', revenue: 2100 },
  { date: '06/01', revenue: 1900 },
  { date: '07/01', revenue: 2400 },
];

const clientsData = [
  { date: '01/01', clients: 12 },
  { date: '02/01', clients: 15 },
  { date: '03/01', clients: 18 },
  { date: '04/01', clients: 14 },
  { date: '05/01', clients: 21 },
  { date: '06/01', clients: 19 },
  { date: '07/01', clients: 24 },
];

export const AdminCharts = () => {
  const workloadStatus = "normal"; // "low", "normal", "high", "critical"
  const currentMonthRevenue = 12400;
  const projectedRevenue = 18600;

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-success/10 text-success border-success/20';
      case 'normal': return 'bg-info/10 text-info border-info/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getWorkloadLabel = (status: string) => {
    switch (status) {
      case 'low': return 'Charge Faible';
      case 'normal': return 'Charge Normale';
      case 'high': return 'Charge Élevée';
      case 'critical': return 'Charge Critique';
      default: return 'Indéterminé';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Revenus sur 30 jours
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              +24% vs mois dernier
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value) => [`${value}€`, 'Revenus']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Nouveaux Clients sur 30 jours
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              +12% vs mois dernier
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientsData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value) => [`${value}`, 'Nouveaux clients']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="clients" 
                fill="hsl(var(--secondary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Indicateur de Charge de Travail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut actuel:</span>
            <Badge className={getWorkloadColor(workloadStatus)}>
              {getWorkloadLabel(workloadStatus)}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Agents en attente: 3</div>
            <div className="text-sm text-muted-foreground">Agents en cours: 8</div>
            <div className="text-sm text-muted-foreground">Délai moyen actuel: 48h</div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Prévision Revenus Fin de Mois</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenus actuels:</span>
              <span className="font-semibold">{currentMonthRevenue.toLocaleString()}€</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Projection fin de mois:</span>
              <span className="font-semibold text-primary">{projectedRevenue.toLocaleString()}€</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Croissance estimée:</span>
              <Badge className="bg-success/10 text-success border-success/20">
                +{Math.round(((projectedRevenue - currentMonthRevenue) / currentMonthRevenue) * 100)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};