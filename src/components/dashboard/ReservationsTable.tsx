import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Users, Clock, CheckCircle, XCircle } from "lucide-react";

interface ReservationsTableProps {
  searchQuery: string;
}

const ReservationsTable = ({ searchQuery }: ReservationsTableProps) => {
  const reservations = [
    {
      id: 1,
      customerName: "Marie Dubois",
      date: "2024-01-09",
      time: "19:30",
      guests: 4,
      phone: "06 12 34 56 78",
      status: "confirmed",
      isNew: true,
    },
    {
      id: 2,
      customerName: "Jean Martin",
      date: "2024-01-09",
      time: "20:00",
      guests: 2,
      phone: "06 98 76 54 32",
      status: "confirmed",
      isNew: false,
    },
    {
      id: 3,
      customerName: "Sophie Laurent",
      date: "2024-01-09",
      time: "20:30",
      guests: 6,
      phone: "06 11 22 33 44",
      status: "pending",
      isNew: true,
    },
    {
      id: 4,
      customerName: "Pierre Durand",
      date: "2024-01-10",
      time: "19:00",
      guests: 3,
      phone: "06 55 66 77 88",
      status: "confirmed",
      isNew: false,
    },
    {
      id: 5,
      customerName: "Amélie Rousseau",
      date: "2024-01-10",
      time: "21:00",
      guests: 2,
      phone: "06 33 44 55 66",
      status: "cancelled",
      isNew: false,
    },
  ];

  const filteredReservations = reservations.filter(reservation =>
    reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reservation.phone.includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmée
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
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
          <span>Réservations</span>
          <Badge variant="secondary">{filteredReservations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Date & Heure</TableHead>
              <TableHead>Personnes</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReservations.map((reservation) => (
              <TableRow 
                key={reservation.id} 
                className={`${
                  reservation.isNew 
                    ? 'bg-accent/50 border-l-4 border-l-primary' 
                    : ''
                }`}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <span>{reservation.customerName}</span>
                    {reservation.isNew && (
                      <Badge variant="default" className="text-xs px-2 py-0">
                        Nouveau
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{reservation.date}</span>
                    <span className="text-sm text-muted-foreground">{reservation.time}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{reservation.guests}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{reservation.phone}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-primary hover:text-primary"
                    >
                      <Phone className="h-3 w-3" />
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

export { ReservationsTable };