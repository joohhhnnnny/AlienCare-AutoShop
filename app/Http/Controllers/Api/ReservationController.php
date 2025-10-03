<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Inventory;
use App\Models\StockTransaction;
use App\Events\ReservationUpdated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReservationController extends Controller
{
    /**
     * Display a listing of reservations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Reservation::with('inventory');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by job order
        if ($request->has('job_order')) {
            $query->where('job_order_number', $request->job_order);
        }

        // Filter by item
        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        // Order by priority: pending first (most urgent), then by date
        $reservations = $query->orderByRaw("
                CASE status
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'completed' THEN 3
                    WHEN 'cancelled' THEN 4
                    WHEN 'rejected' THEN 5
                    ELSE 6
                END, requested_date DESC
            ")
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $reservations
        ]);
    }

    /**
     * Display the specified reservation.
     */
    public function show(int $id): JsonResponse
    {
        $reservation = Reservation::with('inventory')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $reservation
        ]);
    }

    /**
     * Reserve parts for job order.
     */
    public function reservePartsForJob(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|exists:inventories,item_id',
            'quantity' => 'required|integer|min:1|max:100',
            'job_order_number' => 'required|string',
            'requested_by' => 'required|string',
            'expires_at' => 'nullable|date|after:now',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $inventory = Inventory::where('item_id', $request->item_id)->first();

            if (!$inventory) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item not found'
                ], 404);
            }

            // Enhanced stock validation
            if ($inventory->stock <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Item '{$inventory->item_name}' is out of stock"
                ], 400);
            }

            if ($inventory->stock < $request->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot reserve {$request->quantity} items of '{$inventory->item_name}' (only {$inventory->stock} in stock)"
                ], 400);
            }

            // Check available stock (considering existing approved reservations)
            if ($inventory->available_stock < $request->quantity) {
                $reservedStock = $inventory->stock - $inventory->available_stock;
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient available stock for '{$inventory->item_name}'. Total stock: {$inventory->stock}, Already reserved: {$reservedStock}, Available: {$inventory->available_stock}"
                ], 400);
            }

            // Create reservation
            $reservation = Reservation::create([
                'item_id' => $request->item_id,
                'quantity' => $request->quantity,
                'job_order_number' => $request->job_order_number,
                'requested_by' => $request->requested_by,
                'requested_date' => now(),
                'expires_at' => $request->expires_at ?? now()->addDays(7),
                'notes' => $request->notes,
            ]);

            // Log transaction
            StockTransaction::create([
                'item_id' => $request->item_id,
                'transaction_type' => 'reservation',
                'quantity' => -$request->quantity,
                'previous_stock' => $inventory->stock,
                'new_stock' => $inventory->stock, // Stock doesn't change on reservation
                'reference_number' => $request->job_order_number,
                'notes' => "Reserved for job order: {$request->job_order_number}",
                'created_by' => $request->requested_by
            ]);

            event(new ReservationUpdated($reservation, 'created'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $reservation->load('inventory'),
                'message' => 'Parts reserved successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve reservation.
     */
    public function approveReservation(int $reservationId, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'approved_by' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $reservation = Reservation::with('inventory')->findOrFail($reservationId);

            if ($reservation->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending reservations can be approved'
                ], 400);
            }

            // Check if reservation is expired
            if ($reservation->isExpired()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reservation has expired'
                ], 400);
            }

            // Check stock availability again
            $inventory = $reservation->inventory;
            if (!$inventory) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            // Check if we still have enough stock
            if ($inventory->stock < $reservation->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => "Insufficient stock available. Current stock: {$inventory->stock}, Required: {$reservation->quantity}"
                ], 400);
            }

            // Deduct stock from inventory
            $previousStock = $inventory->stock;
            $newStock = $previousStock - $reservation->quantity;

            $inventory->update([
                'stock' => $newStock
            ]);

            // Update reservation
            $reservation->update([
                'status' => 'approved',
                'approved_by' => $request->approved_by,
                'approved_date' => now(),
                'notes' => $request->notes ?? $reservation->notes,
            ]);

            // Create stock transaction record for the deduction
            StockTransaction::create([
                'item_id' => $reservation->item_id,
                'transaction_type' => 'reservation',
                'quantity' => -$reservation->quantity, // Negative for stock deduction
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference_number' => $reservation->job_order_number,
                'notes' => "Stock deducted for approved reservation (Job Order: {$reservation->job_order_number})",
                'created_by' => $request->approved_by
            ]);

            event(new ReservationUpdated($reservation, 'approved'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $reservation->load('inventory'),
                'message' => 'Reservation approved successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject reservation.
     */
    public function rejectReservation(int $reservationId, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'approved_by' => 'required|string',
            'notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $reservation = Reservation::findOrFail($reservationId);

            if ($reservation->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending reservations can be rejected'
                ], 400);
            }

            // Update reservation
            $reservation->update([
                'status' => 'rejected',
                'approved_by' => $request->approved_by,
                'approved_date' => now(),
                'notes' => $request->notes,
            ]);

            event(new ReservationUpdated($reservation, 'rejected'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $reservation->load('inventory'),
                'message' => 'Reservation rejected successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete reservation (fulfill the reservation).
     */
    public function completeReservation(int $reservationId, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'completed_by' => 'required|string',
            'actual_quantity' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $reservation = Reservation::with('inventory')->findOrFail($reservationId);

            if ($reservation->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only approved reservations can be completed'
                ], 400);
            }

            $actualQuantity = $request->actual_quantity ?? $reservation->quantity;
            $inventory = $reservation->inventory;

            if (!$inventory) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inventory item not found'
                ], 404);
            }

            // Note: Stock was already deducted when reservation was approved
            // Completing just changes the status to indicate the parts were actually used

            // Update reservation
            $reservation->update([
                'status' => 'completed',
                'notes' => $request->notes ?? $reservation->notes,
            ]);

            // Log transaction for completion (no stock change since it was already deducted on approval)
            StockTransaction::create([
                'item_id' => $reservation->item_id,
                'transaction_type' => 'reservation',
                'quantity' => 0, // No stock change on completion
                'previous_stock' => $inventory->stock,
                'new_stock' => $inventory->stock,
                'reference_number' => $reservation->job_order_number,
                'notes' => "Completed approved reservation (Job Order: {$reservation->job_order_number}) - stock was already deducted on approval",
                'created_by' => $request->completed_by
            ]);

            event(new ReservationUpdated($reservation, 'completed'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'reservation' => $reservation->load('inventory'),
                    'stock_deducted' => 0, // Stock was already deducted on approval
                    'new_stock_level' => $inventory->stock
                ],
                'message' => 'Reservation completed successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to complete reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel reservation.
     */
    public function cancelReservation(int $reservationId, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cancelled_by' => 'required|string',
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $reservation = Reservation::findOrFail($reservationId);

            if (!in_array($reservation->status, ['pending', 'approved'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending or approved reservations can be cancelled'
                ], 400);
            }

            $inventory = $reservation->inventory;
            $stockRestored = 0;

            // If reservation was approved, restore the stock
            if ($reservation->status === 'approved') {
                $previousStock = $inventory->stock;
                $newStock = $previousStock + $reservation->quantity;

                $inventory->update(['stock' => $newStock]);
                $stockRestored = $reservation->quantity;

                // Log the stock restoration
                StockTransaction::create([
                    'item_id' => $reservation->item_id,
                    'transaction_type' => 'return',
                    'quantity' => $reservation->quantity,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'reference_number' => $reservation->job_order_number,
                    'notes' => "Stock restored from cancelled approved reservation (Job Order: {$reservation->job_order_number})",
                    'created_by' => $request->cancelled_by
                ]);
            }

            // Update reservation
            $reservation->update([
                'status' => 'cancelled',
                'notes' => $request->reason,
            ]);

            event(new ReservationUpdated($reservation, 'cancelled'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'reservation' => $reservation->load('inventory'),
                    'stock_restored' => $stockRestored
                ],
                'message' => 'Reservation cancelled successfully' . ($stockRestored > 0 ? " and {$stockRestored} units restored to stock" : '')
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active reservations summary for dashboard.
     */
    public function getActiveReservationsSummary(): JsonResponse
    {
        try {
            $totalActive = Reservation::whereIn('status', ['pending', 'approved'])
                ->count();

            $pendingApprovals = Reservation::where('status', 'pending')
                ->count();

            $expiringSoon = Reservation::where('status', 'approved')
                ->where('expires_at', '<=', now()->addDays(3))
                ->count();

            $byStatus = Reservation::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_active' => $totalActive,
                    'pending_approvals' => $pendingApprovals,
                    'expiring_soon' => $expiringSoon,
                    'by_status' => $byStatus
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reserve multiple parts for a single job order.
     */
    public function reserveMultiplePartsForJob(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'job_order_number' => 'required|string',
            'requested_by' => 'required|string',
            'expires_at' => 'nullable|date|after:now',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventories,item_id',
            'items.*.quantity' => 'required|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $reservations = [];
            $stockErrors = [];

            // First, check stock availability for all items
            foreach ($request->items as $item) {
                $inventory = Inventory::where('item_id', $item['item_id'])->first();

                if (!$inventory) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Inventory item not found: ' . $item['item_id']
                    ], 404);
                }

                // Enhanced stock validation
                if ($inventory->stock <= 0) {
                    $stockErrors[] = "'{$inventory->item_name}' is out of stock";
                    continue;
                }

                if ($inventory->stock < $item['quantity']) {
                    $stockErrors[] = "Cannot reserve {$item['quantity']} items of '{$inventory->item_name}' (only {$inventory->stock} in stock)";
                    continue;
                }

                // Check available stock (considering existing approved reservations)
                if ($inventory->available_stock < $item['quantity']) {
                    $reservedStock = $inventory->stock - $inventory->available_stock;
                    $stockErrors[] = "Insufficient available stock for '{$inventory->item_name}'. Available: {$inventory->available_stock}, Requested: {$item['quantity']}";
                    continue;
                }
            }

            // If any items have stock issues, return detailed errors
            if (!empty($stockErrors)) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Stock validation failed: ' . implode(' | ', $stockErrors)
                ], 400);
            }

            // Create reservations for all items
            foreach ($request->items as $item) {
                $inventory = Inventory::where('item_id', $item['item_id'])->first();

                $reservation = Reservation::create([
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'job_order_number' => $request->job_order_number,
                    'requested_by' => $request->requested_by,
                    'requested_date' => now(),
                    'expires_at' => $request->expires_at ?? now()->addDays(7),
                    'notes' => $request->notes,
                    'status' => 'pending'
                ]);

                // Log transaction
                StockTransaction::create([
                    'item_id' => $item['item_id'],
                    'transaction_type' => 'reservation',
                    'quantity' => -$item['quantity'],
                    'previous_stock' => $inventory->stock,
                    'new_stock' => $inventory->stock, // Stock doesn't change on reservation
                    'reference_number' => $request->job_order_number,
                    'notes' => "Reserved for job order: {$request->job_order_number}",
                    'created_by' => $request->requested_by
                ]);

                $reservation->load('inventory');
                $reservations[] = $reservation;

                event(new ReservationUpdated($reservation, 'created'));
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $reservations,
                'message' => 'Multiple parts reserved successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create multiple reservations: ' . $e->getMessage()
            ], 500);
        }
    }
}
