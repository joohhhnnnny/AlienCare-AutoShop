import { AlertTriangle, CheckCircle, Clock, Package, Plus, RefreshCw, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { useInventoryItems } from "../../hooks/useInventory";
import { useReservations } from "../../hooks/useReservations";
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
  // Real backend data hooks
  const {
    data: reservationsData,
    loading: reservationsLoading,
    error: reservationsError,
    createReservation,
    createMultipleReservations,
    approveReservation,
    rejectReservation,
    completeReservation,
    cancelReservation,
    updateFilters
  } = useReservations();

  const { data: inventoryData, loading: inventoryLoading } = useInventoryItems();

  // Local state for UI
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reservationItems, setReservationItems] = useState<Array<{ item_id: string; quantity: number | string }>>([
    { item_id: '', quantity: 1 }
  ]);
  const [reservationDetails, setReservationDetails] = useState({
    job_order_number: '',
    requested_by: '',
    notes: ''
  });

  // Extract data from responses with proper type checking
  const reservations = Array.isArray(reservationsData?.data) ? reservationsData.data : [];
  const inventoryItems = Array.isArray(inventoryData?.data?.data) ? inventoryData.data.data : [];
  const loading = reservationsLoading || inventoryLoading;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500 text-white">Approved</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

    const resetReservationForm = () => {
    setReservationItems([{ item_id: '', quantity: 1 }]);
    setReservationDetails({ job_order_number: '', requested_by: '', notes: '' });
  };

  const handleCreateReservation = async () => {
    try {
      setActionLoading('create');

      // Validate and convert items to proper format
      const validItems = reservationItems
        .filter(item => item.item_id && (typeof item.quantity === 'number' ? item.quantity > 0 : Number(item.quantity) > 0))
        .map(item => ({
          item_id: item.item_id,
          quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity)
        }));

      console.log('Valid items for creation:', validItems);

      if (validItems.length === 0) {
        alert('Please add at least one valid item');
        return;
      }

      if (validItems.length === 1) {
        // Create single reservation
        await createReservation({
          item_id: validItems[0].item_id,
          quantity: validItems[0].quantity,
          job_order_number: reservationDetails.job_order_number,
          requested_by: reservationDetails.requested_by,
          notes: reservationDetails.notes
        });
      } else {
        // Create multiple reservations
        await createMultipleReservations({
          job_order_number: reservationDetails.job_order_number,
          requested_by: reservationDetails.requested_by,
          notes: reservationDetails.notes,
          items: validItems
        });
      }

      // Reset form
      resetReservationForm();
      setIsDialogOpen(false);
      alert('Reservation(s) created successfully');
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const addReservationItem = () => {
    console.log('Adding new reservation item');
    setReservationItems(prev => {
      const newItems = [...prev, { item_id: '', quantity: 1 }];
      console.log('New reservation items:', newItems);
      return newItems;
    });
  };

  const removeReservationItem = (index: number) => {
    console.log('Removing reservation item at index:', index);
    if (reservationItems.length > 1) {
      setReservationItems(prev => {
        const newItems = prev.filter((_, i) => i !== index);
        console.log('Items after removal:', newItems);
        return newItems;
      });
    } else {
      console.log('Cannot remove - only one item left');
    }
  };

  const updateReservationItem = (index: number, field: 'item_id' | 'quantity', value: string | number) => {
    console.log('Updating reservation item:', { index, field, value, type: typeof value });
    setReservationItems(prev => {
      const newItems = prev.map((item, i) => {
        if (i === index) {
          if (field === 'quantity') {
            // Handle quantity field properly - allow empty string or convert to number
            return { ...item, quantity: value };
          } else {
            // Handle item_id field
            return { ...item, item_id: String(value) };
          }
        }
        return item;
      });
      console.log('Items after update:', newItems);
      return newItems;
    });
  };  const handleApproveReservation = async (reservationId: number) => {
    try {
      setActionLoading(`approve-${reservationId}`);
      await approveReservation(reservationId, { approved_by: 'Current User' });
      alert('Reservation approved successfully');
    } catch (error) {
      alert('Failed to approve reservation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectReservation = async (reservationId: number) => {
    try {
      setActionLoading(`reject-${reservationId}`);
      await rejectReservation(reservationId, {
        approved_by: 'Current User',
        notes: 'Rejected by user'
      });
      alert('Reservation rejected successfully');
    } catch (error) {
      alert('Failed to reject reservation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteReservation = async (reservationId: number) => {
    try {
      setActionLoading(`complete-${reservationId}`);
      await completeReservation(reservationId, {
        completed_by: 'Current User'
      });
      alert('Reservation completed successfully');
    } catch (error) {
      alert('Failed to complete reservation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    try {
      setActionLoading(`cancel-${reservationId}`);
      await cancelReservation(reservationId, {
        cancelled_by: 'Current User',
        reason: 'Cancelled by user'
      });
      alert('Reservation cancelled successfully');
    } catch (error) {
      alert('Failed to cancel reservation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  // Filter reservations by status
  const activeReservations = reservations.filter((r: Reservation) =>
    r.status === 'pending' || r.status === 'approved'
  );
  const completedReservations = reservations.filter((r: Reservation) =>
    r.status === 'completed'
  );

  // Calculate total reserved value
  const totalReservedValue = activeReservations.reduce((sum: number, reservation: Reservation) => {
    const item = inventoryItems.find(item => item.item_id === reservation.item_id);
    return sum + (item ? item.unit_price * reservation.quantity : 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>Loading reservations...</p>
        </div>
      </div>
    );
  }

  if (reservationsError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Reservations</h3>
          <p className="text-muted-foreground mb-4">{reservationsError}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Part Reservations</h1>
          <p className="text-muted-foreground">
            Manage job order reservations and consumption tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetReservationForm();
            setActionLoading(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Reservation</DialogTitle>
            </DialogHeader>

            {/* Show loading indicator when data is still loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading inventory items...</span>
              </div>
            )}

            {/* Show content when data is loaded */}
            {!loading && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jobOrder" className="text-foreground">Job Order Number *</Label>
                  <Input
                    id="jobOrder"
                    value={reservationDetails.job_order_number}
                    onChange={(e) => setReservationDetails(prev => ({ ...prev, job_order_number: e.target.value }))}
                    placeholder="JO-2024-001"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="requestedBy" className="text-foreground">Requested By *</Label>
                  <Input
                    id="requestedBy"
                    value={reservationDetails.requested_by}
                    onChange={(e) => setReservationDetails(prev => ({ ...prev, requested_by: e.target.value }))}
                    placeholder="Technician Name"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="text-foreground">Notes</Label>
                  <Input
                    id="notes"
                    value={reservationDetails.notes}
                    onChange={(e) => setReservationDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes (optional)"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground">Items to Reserve *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addReservationItem}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {reservationItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-end p-3 border rounded-lg bg-muted/20">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Part</Label>
                          <Select
                            value={item.item_id}
                            onValueChange={(value) => updateReservationItem(index, 'item_id', value)}
                          >
                            <SelectTrigger className="h-8 bg-input border-border text-foreground">
                              <SelectValue placeholder="Select part" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border max-h-64 overflow-y-auto">
                              {(() => {
                                if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
                                  return <SelectItem value="" disabled>No items available</SelectItem>;
                                }

                                return inventoryItems.map((inventoryItem, itemIndex) => {
                                  if (!inventoryItem || !inventoryItem.item_id) {
                                    return null;
                                  }
                                  return (
                                    <SelectItem key={inventoryItem.item_id} value={inventoryItem.item_id}>
                                      {inventoryItem.item_id} - {inventoryItem.item_name} (Stock: {inventoryItem.stock})
                                    </SelectItem>
                                  );
                                }).filter(Boolean);
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label className="text-xs text-muted-foreground">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity === '' ? '' : String(item.quantity)}
                            onChange={(e) => {
                              console.log('Quantity input change:', e.target.value);
                              const value = e.target.value;
                              // Allow empty string during editing
                              if (value === '') {
                                updateReservationItem(index, 'quantity', '');
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue) && numValue > 0) {
                                  updateReservationItem(index, 'quantity', numValue);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              // Set minimum value of 1 when field loses focus if empty or invalid
                              const value = e.target.value;
                              if (value === '' || isNaN(parseInt(value)) || parseInt(value) < 1) {
                                updateReservationItem(index, 'quantity', 1);
                              }
                            }}
                            className="h-8 bg-input border-border text-foreground"
                          />
                        </div>
                        {reservationItems.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeReservationItem(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCreateReservation}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={actionLoading === 'create'}
                >
                  {actionLoading === 'create' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    `Create Reservation${reservationItems.filter(item => item.item_id).length > 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            )}
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
              {completedReservations.filter((r: Reservation) =>
                new Date(r.updated_at).toDateString() === new Date().toDateString()
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
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/50">
                  <TableHead className="text-foreground font-semibold w-[120px]">Job Order</TableHead>
                  <TableHead className="text-foreground font-semibold w-[130px]">Part Number</TableHead>
                  <TableHead className="text-foreground font-semibold min-w-[200px]">Description</TableHead>
                  <TableHead className="text-foreground font-semibold w-[80px] text-center">Reserved</TableHead>
                  <TableHead className="text-foreground font-semibold w-[80px] text-center">Consumed</TableHead>
                  <TableHead className="text-foreground font-semibold w-[100px] text-center">Status</TableHead>
                  <TableHead className="text-foreground font-semibold w-[120px]">Requested By</TableHead>
                  <TableHead className="text-foreground font-semibold w-[100px] text-center">Created</TableHead>
                  <TableHead className="text-foreground font-semibold w-[180px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation: Reservation) => {
                  const item = inventoryItems.find(item => item.item_id === reservation.item_id);
                  return (
                    <TableRow key={reservation.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-foreground px-4 py-3">
                        {reservation.job_order_number}
                      </TableCell>
                      <TableCell className="text-foreground px-4 py-3 font-mono text-sm">
                        {reservation.item_id}
                      </TableCell>
                      <TableCell className="text-foreground px-4 py-3">
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate">{item?.item_name || 'Unknown Item'}</div>
                          {item?.description && (
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground px-4 py-3 text-center font-semibold">
                        {reservation.quantity}
                      </TableCell>
                      <TableCell className="text-foreground px-4 py-3 text-center">
                        {reservation.actual_quantity || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(reservation.status)}
                          {getStatusBadge(reservation.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground px-4 py-3">
                        <div className="font-medium">{reservation.requested_by}</div>
                      </TableCell>
                      <TableCell className="text-foreground px-4 py-3 text-center text-sm">
                        {new Date(reservation.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2 min-h-[36px]">
                          {reservation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => handleApproveReservation(reservation.id)}
                                disabled={actionLoading === `approve-${reservation.id}`}
                              >
                                {actionLoading === `approve-${reservation.id}` ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectReservation(reservation.id)}
                                disabled={actionLoading === `reject-${reservation.id}`}
                                className="h-8 px-3 text-xs font-medium"
                              >
                                {actionLoading === `reject-${reservation.id}` ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Reject'
                                )}
                              </Button>
                            </>
                          )}
                          {reservation.status === 'approved' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteReservation(reservation.id)}
                                disabled={actionLoading === `complete-${reservation.id}`}
                                className="h-8 px-3 text-xs font-medium"
                              >
                                {actionLoading === `complete-${reservation.id}` ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Complete'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelReservation(reservation.id)}
                                disabled={actionLoading === `cancel-${reservation.id}`}
                                className="h-8 px-3 text-xs font-medium"
                              >
                                {actionLoading === `cancel-${reservation.id}` ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Cancel'
                                )}
                              </Button>
                            </>
                          )}
                          {(reservation.status === 'completed' || reservation.status === 'rejected' || reservation.status === 'cancelled') && (
                            <span className="text-xs text-muted-foreground italic">
                              No actions available
                            </span>
                          )}
                        </div>
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
