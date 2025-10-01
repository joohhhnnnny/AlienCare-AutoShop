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

        $reservations = $query->orderBy('requested_date', 'desc')
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
            'item_id' => 'required|string|exists:inventories,item_id',
            'quantity' => 'required|integer|min:1',
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

            // Check if enough stock is available
            if ($inventory->available_stock < $request->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock available for reservation'
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

            $reservation = Reservation::findOrFail($reservationId);

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
            if ($inventory->available_stock < $reservation->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock available'
                ], 400);
            }

            // Update reservation
            $reservation->update([
                'status' => 'approved',
                'approved_by' => $request->approved_by,
                'approved_date' => now(),
                'notes' => $request->notes ?? $reservation->notes,
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

            $reservation = Reservation::findOrFail($reservationId);

            if ($reservation->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only approved reservations can be completed'
                ], 400);
            }

            $actualQuantity = $request->actual_quantity ?? $reservation->quantity;
            $inventory = $reservation->inventory;

            // Check stock availability
            if ($inventory->stock < $actualQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock to complete reservation'
                ], 400);
            }

            // Deduct stock
            $previousStock = $inventory->stock;
            $newStock = $previousStock - $actualQuantity;
            $inventory->update(['stock' => $newStock]);

            // Update reservation
            $reservation->update([
                'status' => 'completed',
                'notes' => $request->notes ?? $reservation->notes,
            ]);

            // Log transaction
            StockTransaction::create([
                'item_id' => $reservation->item_id,
                'transaction_type' => 'sale', // Completing reservation is like a sale
                'quantity' => -$actualQuantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference_number' => $reservation->job_order_number,
                'notes' => "Completed reservation #{$reservation->reservation_id}",
                'created_by' => $request->completed_by
            ]);

            event(new ReservationUpdated($reservation, 'completed'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'reservation' => $reservation->load('inventory'),
                    'stock_deducted' => $actualQuantity,
                    'new_stock_level' => $newStock
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

            // Update reservation
            $reservation->update([
                'status' => 'cancelled',
                'notes' => $request->reason,
            ]);

            event(new ReservationUpdated($reservation, 'cancelled'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $reservation->load('inventory'),
                'message' => 'Reservation cancelled successfully'
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
                ->where('expected_return_date', '<=', now()->addDays(3))
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
}
