import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle, Package, AlertCircle } from "lucide-react";

interface OrdersTableProps {
  searchQuery: string;
}

const OrdersTable = ({ searchQuery }: OrdersTableProps) => {
  const orders = [
    {
      id: 1,
      customerName: "Lucas Bernard",
      items: ["Menu Terre et Mer", "Dessert Chocolat", "Café"],
      pickupTime: "12:45",
      status: "preparing",
      isNew: true,
      total: "32.50€",
    },
    {
      id: 2,
      customerName: "Emma Leroy",
      items: ["Salade César", "Tarte Tatin"],
      pickupTime: "13:15",
      status: "ready",
      isNew: false,
      total: "18.90€",
    },
    {
      id: 3,
      customerName: "Thomas Petit",
      items: ["Pizza Margherita", "Tiramisu", "Coca Cola"],
      pickupTime: "13:30",
      status: "preparing",
      isNew: true,
      total: "24.80€",
    },
    {
      id: 4,
      customerName: "Céline Moreau",
      items: ["Plat du Jour", "Vin Blanc"],
      pickupTime: "14:00",
      status: "completed",
      isNew: false,
      total: "26.70€",
    },
    {
      id: 5,
      customerName: "Antoine Garcia",
      items: ["Burger Maison", "Frites", "Bière"],
      pickupTime: "12:30",
      status: "delayed",
      isNew: false,
      total: "19.50€",
    },
  ];

  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            En préparation
          </Badge>
        );
      case "ready":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Prête
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-muted text-muted-foreground border-muted">
            <Package className="h-3 w-3 mr-1" />
            Récupérée
          </Badge>
        );
      case "delayed":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            En retard
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Commandes</span>
          <Badge variant="secondary">{filteredOrders.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Commande</TableHead>
              <TableHead>Heure Récupération</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow 
                key={order.id} 
                className={`${
                  order.isNew 
                    ? 'bg-accent/50 border-l-4 border-l-primary' 
                    : ''
                }`}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <span>{order.customerName}</span>
                    {order.isNew && (
                      <Badge variant="default" className="text-xs px-2 py-0">
                        Nouveau
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="text-sm">
                        • {item}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.pickupTime}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-primary">
                  {order.total}
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {order.status === "preparing" && (
                      <Button size="sm" className="bg-success hover:bg-success/90">
                        Marquer Prête
                      </Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" variant="outline">
                        Récupérée
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Détails
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export { OrdersTable };