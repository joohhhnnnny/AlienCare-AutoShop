<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AlertController extends Controller
{
    /**
     * Get all alerts with pagination and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Alert::query()->with('inventory');

            // Filter by acknowledgment status
            if ($request->has('acknowledged')) {
                $acknowledged = filter_var($request->acknowledged, FILTER_VALIDATE_BOOLEAN);
                $query->where('acknowledged', $acknowledged);
            }

            // Filter by urgency
            if ($request->has('urgency')) {
                $query->where('urgency', $request->urgency);
            }

            // Filter by alert type
            if ($request->has('alert_type')) {
                $query->where('alert_type', $request->alert_type);
            }

            // Sort by creation date (newest first)
            $query->orderBy('created_at', 'desc');

            $alerts = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $alerts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch alerts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate low stock alerts based on current inventory levels.
     */
    public function generateLowStockAlerts(): JsonResponse
    {
        try {
            $lowStockItems = Inventory::lowStock()->active()->get();
            $alertsCreated = 0;

            foreach ($lowStockItems as $item) {
                // Check if alert already exists for this item
                $existingAlert = Alert::where('item_id', $item->item_id)
                                   ->where('alert_type', 'low_stock')
                                   ->where('acknowledged', false)
                                   ->first();

                if (!$existingAlert) {
                    // Determine urgency based on stock level
                    $urgency = $this->determineUrgency($item->stock, $item->reorder_level);

                    Alert::create([
                        'item_id' => $item->item_id,
                        'item_name' => $item->item_name,
                        'current_stock' => $item->stock,
                        'reorder_level' => $item->reorder_level,
                        'category' => $item->category,
                        'supplier' => $item->supplier,
                        'urgency' => $urgency,
                        'alert_type' => 'low_stock',
                        'message' => $this->generateAlertMessage($item, $urgency)
                    ]);

                    $alertsCreated++;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'alerts_created' => $alertsCreated,
                    'total_low_stock_items' => $lowStockItems->count()
                ],
                'message' => "Generated $alertsCreated new alerts"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate alerts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get alert statistics and summary.
     */
    public function getAlertStatistics(): JsonResponse
    {
        try {
            $stats = [
                'total_alerts' => Alert::count(),
                'unacknowledged_alerts' => Alert::unacknowledged()->count(),
                'acknowledged_alerts' => Alert::acknowledged()->count(),
                'critical_alerts' => Alert::critical()->unacknowledged()->count(),
                'high_priority_alerts' => Alert::high()->unacknowledged()->count(),
                'alerts_by_urgency' => [
                    'critical' => Alert::byUrgency('critical')->unacknowledged()->count(),
                    'high' => Alert::byUrgency('high')->unacknowledged()->count(),
                    'medium' => Alert::byUrgency('medium')->unacknowledged()->count(),
                    'low' => Alert::byUrgency('low')->unacknowledged()->count()
                ],
                'alerts_by_type' => Alert::unacknowledged()
                    ->selectRaw('alert_type, count(*) as count')
                    ->groupBy('alert_type')
                    ->pluck('count', 'alert_type')
                    ->toArray(),
                'recent_alerts' => Alert::unacknowledged()
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->with('inventory')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get alert statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Acknowledge a specific alert.
     */
    public function acknowledge(Request $request, $id): JsonResponse
    {
        try {
            $alert = Alert::findOrFail($id);

            $acknowledgedBy = Auth::check() ? Auth::user()->name : 'System';
            $alert->acknowledge($acknowledgedBy);

            return response()->json([
                'success' => true,
                'data' => $alert->fresh(),
                'message' => 'Alert acknowledged successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to acknowledge alert: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk acknowledge multiple alerts.
     */
    public function bulkAcknowledge(Request $request): JsonResponse
    {
        try {
            $alertIds = $request->alert_ids;
            $acknowledgedBy = Auth::check() ? Auth::user()->name : 'System';

            $updated = Alert::whereIn('id', $alertIds)
                          ->where('acknowledged', false)
                          ->update([
                              'acknowledged' => true,
                              'acknowledged_by' => $acknowledgedBy,
                              'acknowledged_at' => now()
                          ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'acknowledged_count' => $updated
                ],
                'message' => "Acknowledged $updated alerts"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk acknowledge alerts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete acknowledged alerts older than specified days.
     */
    public function cleanup(Request $request): JsonResponse
    {
        try {
            $days = $request->get('days', 30);
            $cutoffDate = now()->subDays($days);

            $deleted = Alert::acknowledged()
                          ->where('acknowledged_at', '<', $cutoffDate)
                          ->delete();

            return response()->json([
                'success' => true,
                'data' => [
                    'deleted_count' => $deleted
                ],
                'message' => "Cleaned up $deleted old acknowledged alerts"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cleanup alerts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Determine urgency level based on stock levels.
     */
    private function determineUrgency($currentStock, $reorderLevel): string
    {
        if ($currentStock == 0) {
            return 'critical';
        } elseif ($currentStock <= $reorderLevel * 0.5) {
            return 'high';
        } elseif ($currentStock <= $reorderLevel * 0.75) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Generate appropriate alert message.
     */
    private function generateAlertMessage($item, $urgency): string
    {
        switch ($urgency) {
            case 'critical':
                return "CRITICAL: {$item->item_name} is out of stock! Immediate restocking required.";
            case 'high':
                return "HIGH PRIORITY: {$item->item_name} stock is critically low ({$item->stock} units remaining).";
            case 'medium':
                return "MEDIUM: {$item->item_name} stock is below recommended levels ({$item->stock} units remaining).";
            default:
                return "LOW: {$item->item_name} is approaching reorder level ({$item->stock} units remaining).";
        }
    }
}
