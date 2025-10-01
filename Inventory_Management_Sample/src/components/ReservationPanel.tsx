import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Plus, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import { mockReservations, mockParts } from "../data/mockData";
import { Reservation } from "../types/inventory";

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
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'PARTIAL':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-blue-500">Active</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-orange-500">Partial</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
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
          <h1>Part Reservations</h1>
          <p className="text-muted-foreground">
            Manage job order reservations and consumption tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="part">Part</Label>
                <Select value={newReservation.partId} onValueChange={(value) => 
                  setNewReservation(prev => ({ ...prev, partId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a part" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockParts.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.partNumber} - {part.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jobOrder">Job Order ID</Label>
                <Input 
                  id="jobOrder"
                  value={newReservation.jobOrderId}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, jobOrderId: e.target.value }))}
                  placeholder="JO-2024-001"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity"
                  type="number"
                  value={newReservation.quantity}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="1"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="requestedBy">Requested By</Label>
                <Input 
                  id="requestedBy"
                  value={newReservation.requestedBy}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, requestedBy: e.target.value }))}
                  placeholder="Mechanic name"
                />
              </div>
              <Button onClick={handleCreateReservation} className="w-full">
                Create Reservation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Reservations</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-blue-500">{activeReservations.length}</div>
            <p className="text-xs text-muted-foreground">
              Parts currently reserved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Reserved Value</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalReservedValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total reserved inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-500">
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

      <Card>
        <CardHeader>
          <CardTitle>Reservation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Order</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Consumed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => {
                  const part = mockParts.find(p => p.id === reservation.partId);
                  return (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.jobOrderId}</TableCell>
                      <TableCell>{part?.partNumber}</TableCell>
                      <TableCell>{part?.description}</TableCell>
                      <TableCell>{reservation.quantityReserved}</TableCell>
                      <TableCell>{reservation.quantityConsumed}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(reservation.status)}
                          {getStatusBadge(reservation.status)}
                        </div>
                      </TableCell>
                      <TableCell>{reservation.requestedBy}</TableCell>
                      <TableCell>{reservation.createdAt.toLocaleDateString()}</TableCell>
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