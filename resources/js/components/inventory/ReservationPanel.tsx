import { CheckCircle, Clock, Package, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { mockParts, mockReservations } from "../../data/inventory/mockData";
import { Reservation } from "../../types/inventory";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export function ReservationPanel() {
  const [reservations, setReservations] = useState(mockReservations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReservation, setNewReservation] = useState({
    partId: '',
    jobOrderId: '',
    quantity: '',
    requestedBy: ''
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'PARTIAL':
        return <Package className="h-4 w-4 text-primary/70" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-primary/70 text-primary-foreground">Partial</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateReservation = () => {
    if (!newReservation.partId || !newReservation.jobOrderId || !newReservation.quantity || !newReservation.requestedBy) {
      return;
    }

    const reservation: Reservation = {
      id: `r${Date.now()}`,
      partId: newReservation.partId,
      jobOrderId: newReservation.jobOrderId,
      quantityReserved: parseInt(newReservation.quantity),
      quantityConsumed: 0,
      status: 'ACTIVE',
      requestedBy: newReservation.requestedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setReservations(prev => [...prev, reservation]);
    setNewReservation({ partId: '', jobOrderId: '', quantity: '', requestedBy: '' });
    setIsDialogOpen(false);
  };

  const updateReservationStatus = (reservationId: string, newStatus: string) => {
    setReservations(prev => prev.map(reservation =>
      reservation.id === reservationId
        ? { ...reservation, status: newStatus as any, updatedAt: new Date() }
        : reservation
    ));
  };

  const activeReservations = reservations.filter(r => r.status === 'ACTIVE' || r.status === 'PARTIAL');
  const completedReservations = reservations.filter(r => r.status === 'COMPLETED');
  const totalReservedValue = activeReservations.reduce((sum, reservation) => {
    const part = mockParts.find(p => p.id === reservation.partId);
    return sum + (part ? part.unitCost * reservation.quantityReserved : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Part Reservations</h1>
          <p className="text-muted-foreground">
            Manage job order reservations and consumption tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Reservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="part" className="text-foreground">Part</Label>
                <Select value={newReservation.partId} onValueChange={(value) =>
                  setNewReservation(prev => ({ ...prev, partId: value }))
                }>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select a part" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {mockParts.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.partNumber} - {part.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jobOrder" className="text-foreground">Job Order ID</Label>
                <Input
                  id="jobOrder"
                  value={newReservation.jobOrderId}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, jobOrderId: e.target.value }))}
                  placeholder="JO-2024-001"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-foreground">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newReservation.quantity}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="1"
                  min="1"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="requestedBy" className="text-foreground">Requested By</Label>
                <Input
                  id="requestedBy"
                  value={newReservation.requestedBy}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, requestedBy: e.target.value }))}
                  placeholder="Mechanic name"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <Button onClick={handleCreateReservation} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Create Reservation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Reservations</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeReservations.length}</div>
            <p className="text-xs text-muted-foreground">
              Parts currently reserved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Reserved Value</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalReservedValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total reserved inventory value
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {completedReservations.filter(r =>
                r.updatedAt.toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Jobs completed today
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Reservation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Job Order</TableHead>
                  <TableHead className="text-foreground">Part Number</TableHead>
                  <TableHead className="text-foreground">Description</TableHead>
                  <TableHead className="text-foreground">Reserved</TableHead>
                  <TableHead className="text-foreground">Consumed</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Requested By</TableHead>
                  <TableHead className="text-foreground">Created</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => {
                  const part = mockParts.find(p => p.id === reservation.partId);
                  return (
                    <TableRow key={reservation.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{reservation.jobOrderId}</TableCell>
                      <TableCell className="text-foreground">{part?.partNumber}</TableCell>
                      <TableCell className="text-foreground">{part?.description}</TableCell>
                      <TableCell className="text-foreground">{reservation.quantityReserved}</TableCell>
                      <TableCell className="text-foreground">{reservation.quantityConsumed}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(reservation.status)}
                          {getStatusBadge(reservation.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{reservation.requestedBy}</TableCell>
                      <TableCell className="text-foreground">{reservation.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        {reservation.status === 'ACTIVE' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReservationStatus(reservation.id, 'COMPLETED')}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateReservationStatus(reservation.id, 'CANCELLED')}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
