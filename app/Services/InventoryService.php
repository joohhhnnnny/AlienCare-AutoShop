<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\StockTransaction;
use App\Models\Reservation;
use App\Models\Report;
use App\Events\StockUpdated;
use App\Events\LowStockAlert;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryService
{
    /**
     * Check stock levels and return status.
     */
    public function checkStockStatus(string $itemId, int $requestedQuantity = 1): array
    {
        $inventory = Inventory::where('item_id', $itemId)->first();

        if (!$inventory) {
            throw new \Exception("Item not found: {$itemId}");
        }

        $availableStock = $inventory->available_stock;
        $status = $inventory->getStockStatus($requestedQuantity);

        return [
            'item_id' => $inventory->item_id,
            'item_name' => $inventory->item_name,
            'current_stock' => $inventory->stock,
            'available_stock' => $availableStock,
            'reserved_stock' => $inventory->stock - $availableStock,
            'requested_quantity' => $requestedQuantity,
            'status' => $status,
            'is_low_stock' => $inventory->isLowStock(),
            'reorder_level' => $inventory->reorder_level,
            'supplier' => $inventory->supplier,
            'unit_price' => $inventory->unit_price
        ];
    }

    /**
     * Process stock adjustment with full transaction logging.
     */
    public function adjustStock(
        string $itemId,
        int $quantity,
        string $transactionType,
        string $referenceNumber = null,
        string $notes = null,
        string $createdBy = 'System'
    ): array {
        return DB::transaction(function () use ($itemId, $quantity, $transactionType, $referenceNumber, $notes, $createdBy) {
            $inventory = Inventory::where('item_id', $itemId)->lockForUpdate()->first();

            if (!$inventory) {
                throw new \Exception("Item not found: {$itemId}");
            }

            // Validate stock levels for outgoing transactions
            if ($quantity < 0 && $inventory->stock < abs($quantity)) {
                throw new \Exception("Insufficient stock. Available: {$inventory->stock}, Requested: " . abs($quantity));
            }

            $previousStock = $inventory->stock;
            $newStock = $previousStock + $quantity;

            // Update inventory
            $inventory->update(['stock' => $newStock]);

            // Log transaction
            $transaction = StockTransaction::create([
                'item_id' => $itemId,
                'transaction_type' => $transactionType,
                'quantity' => $quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference_number' => $referenceNumber,
                'notes' => $notes,
                'created_by' => $createdBy
            ]);

            // Fire events
            event(new StockUpdated($inventory, $transactionType));

            // Check for low stock alerts
            if ($inventory->isLowStock() && in_array($transactionType, ['sale', 'damage', 'reservation'])) {
                event(new LowStockAlert($inventory));
            }

            return [
                'inventory' => $inventory->fresh(),
                'transaction' => $transaction,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'quantity_changed' => $quantity
            ];
        });
    }

    /**
     * Get inventory summary with key metrics.
     */
    public function getInventorySummary(): array
    {
        $totalItems = Inventory::active()->count();
        $totalValue = Inventory::active()->sum(DB::raw('stock * unit_price'));
        $lowStockItems = Inventory::lowStock()->active()->count();
        $outOfStockItems = Inventory::where('stock', 0)->active()->count();

        $categoryBreakdown = Inventory::active()
            ->select('category', DB::raw('COUNT(*) as item_count'), DB::raw('SUM(stock * unit_price) as total_value'))
            ->groupBy('category')
            ->orderBy('total_value', 'desc')
            ->get();

        $topValueItems = Inventory::active()
            ->select('item_id', 'item_name', 'category', 'stock', 'unit_price', DB::raw('stock * unit_price as total_value'))
            ->orderBy('total_value', 'desc')
            ->limit(10)
            ->get();

        return [
            'overview' => [
                'total_items' => $totalItems,
                'total_inventory_value' => $totalValue,
                'low_stock_items' => $lowStockItems,
                'out_of_stock_items' => $outOfStockItems,
                'stock_accuracy' => $this->calculateStockAccuracy()
            ],
            'category_breakdown' => $categoryBreakdown,
            'top_value_items' => $topValueItems,
            'alerts' => [
                'critical_items' => Inventory::where('stock', 0)->active()->count(),
                'low_stock_items' => $lowStockItems,
                'pending_reservations' => Reservation::pending()->count()
            ]
        ];
    }

    /**
     * Generate comprehensive usage analytics.
     */
    public function getUsageAnalytics(Carbon $startDate, Carbon $endDate): array
    {
        $transactions = StockTransaction::whereBetween('created_at', [$startDate, $endDate])
            ->with('inventory')
            ->get();

        // Group by transaction type
        $transactionSummary = $transactions->groupBy('transaction_type')->map(function ($typeTransactions, $type) {
            $totalQuantity = $typeTransactions->sum(function ($transaction) {
                return abs($transaction->quantity);
            });

            $totalValue = $typeTransactions->sum(function ($transaction) {
                return abs($transaction->quantity) * $transaction->inventory->unit_price;
            });

            return [
                'transaction_count' => $typeTransactions->count(),
                'total_quantity' => $totalQuantity,
                'total_value' => $totalValue,
                'average_transaction_value' => $typeTransactions->count() > 0 ? $totalValue / $typeTransactions->count() : 0
            ];
        });

        // Top moving items
        $itemMovement = $transactions->groupBy('item_id')->map(function ($itemTransactions, $itemId) {
            $item = $itemTransactions->first()->inventory;
            $totalOut = $itemTransactions->where('quantity', '<', 0)->sum(function ($t) { return abs($t->quantity); });
            $totalIn = $itemTransactions->where('quantity', '>', 0)->sum('quantity');

            return [
                'item_id' => $itemId,
                'item_name' => $item->item_name,
                'category' => $item->category,
                'total_in' => $totalIn,
                'total_out' => $totalOut,
                'net_movement' => $totalIn - $totalOut,
                'turnover_rate' => $item->stock > 0 ? $totalOut / $item->stock : 0,
                'transaction_count' => $itemTransactions->count()
            ];
        })->sortByDesc('total_out')->take(20);

        // Category performance
        $categoryPerformance = $transactions->groupBy('inventory.category')->map(function ($categoryTransactions, $category) {
            $outgoingTransactions = $categoryTransactions->where('quantity', '<', 0);
            $totalOut = $outgoingTransactions->sum(function ($t) { return abs($t->quantity); });

            $totalValue = $outgoingTransactions->sum(function ($transaction) {
                return abs($transaction->quantity) * $transaction->inventory->unit_price;
            });

            return [
                'category' => $category,
                'items_sold' => $totalOut,
                'revenue' => $totalValue,
                'transaction_count' => $outgoingTransactions->count(),
                'average_transaction_value' => $outgoingTransactions->count() > 0 ? $totalValue / $outgoingTransactions->count() : 0
            ];
        })->sortByDesc('revenue');

        return [
            'period' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'days' => $startDate->diffInDays($endDate) + 1
            ],
            'transaction_summary' => $transactionSummary,
            'top_moving_items' => $itemMovement->values(),
            'category_performance' => $categoryPerformance->values(),
            'daily_summary' => $this->getDailySummary($startDate, $endDate)
        ];
    }

    /**
     * Calculate stock accuracy percentage.
     */
    private function calculateStockAccuracy(): float
    {
        // This is a simplified calculation
        // In a real system, you'd compare against cycle count data
        $totalItems = Inventory::active()->count();
        $accurateItems = $totalItems; // Assuming all are accurate for now

        return $totalItems > 0 ? ($accurateItems / $totalItems) * 100 : 100;
    }

    /**
     * Get daily transaction summary for a date range.
     */
    private function getDailySummary(Carbon $startDate, Carbon $endDate): array
    {
        $dailyData = [];
        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            $dayTransactions = StockTransaction::whereDate('created_at', $currentDate)
                ->with('inventory')
                ->get();

            $sales = $dayTransactions->where('transaction_type', 'sale');
            $procurement = $dayTransactions->where('transaction_type', 'procurement');

            $dailyData[] = [
                'date' => $currentDate->format('Y-m-d'),
                'sales_count' => $sales->count(),
                'sales_value' => $sales->sum(function ($t) {
                    return abs($t->quantity) * $t->inventory->unit_price;
                }),
                'procurement_count' => $procurement->count(),
                'procurement_value' => $procurement->sum(function ($t) {
                    return $t->quantity * $t->inventory->unit_price;
                }),
                'total_transactions' => $dayTransactions->count()
            ];

            $currentDate->addDay();
        }

        return $dailyData;
    }

    /**
     * Forecast demand for an item based on historical data.
     */
    public function forecastDemand(string $itemId, int $forecastDays = 30): array
    {
        $inventory = Inventory::where('item_id', $itemId)->first();

        if (!$inventory) {
            throw new \Exception("Item not found: {$itemId}");
        }

        // Get historical sales data (last 90 days)
        $historicalSales = StockTransaction::where('item_id', $itemId)
            ->where('transaction_type', 'sale')
            ->where('created_at', '>=', now()->subDays(90))
            ->get();

        if ($historicalSales->isEmpty()) {
            return [
                'item_id' => $itemId,
                'forecast_period_days' => $forecastDays,
                'predicted_demand' => 0,
                'confidence_level' => 0,
                'recommendation' => 'No historical data available',
                'reorder_suggestion' => 'Monitor for initial sales pattern'
            ];
        }

        // Simple moving average calculation
        $totalSold = $historicalSales->sum(function ($transaction) {
            return abs($transaction->quantity);
        });

        $dailyAverage = $totalSold / 90;
        $predictedDemand = $dailyAverage * $forecastDays;

        // Calculate confidence based on data consistency
        $confidenceLevel = min(100, ($historicalSales->count() / 30) * 100);

        // Generate recommendation
        $currentStock = $inventory->stock;
        $availableStock = $inventory->available_stock;

        $recommendation = 'Monitor stock levels';
        $reorderSuggestion = 'Maintain current levels';

        if ($predictedDemand > $availableStock) {
            $shortfall = $predictedDemand - $availableStock;
            $recommendation = "Reorder recommended: {$shortfall} units needed";
            $reorderSuggestion = "Order " . ceil($shortfall * 1.2) . " units (20% buffer)";
        }

        return [
            'item_id' => $itemId,
            'item_name' => $inventory->item_name,
            'current_stock' => $currentStock,
            'available_stock' => $availableStock,
            'forecast_period_days' => $forecastDays,
            'historical_daily_average' => round($dailyAverage, 2),
            'predicted_demand' => round($predictedDemand),
            'confidence_level' => round($confidenceLevel),
            'recommendation' => $recommendation,
            'reorder_suggestion' => $reorderSuggestion,
            'reorder_level' => $inventory->reorder_level,
            'historical_transactions' => $historicalSales->count()
        ];
    }
}
