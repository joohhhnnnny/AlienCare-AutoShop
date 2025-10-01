<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Inventory;
use App\Models\StockTransaction;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Generate daily usage report.
     */
    public function generateDailyUsageReport(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $reportDate = Carbon::parse($date);

        try {
            // Get all transactions for the specified date
            $transactions = StockTransaction::whereDate('created_at', $reportDate)
                                          ->with('inventory')
                                          ->get();

            // Group by transaction type and item
            $summary = $transactions->groupBy('transaction_type')->map(function ($typeTransactions, $type) {
                return $typeTransactions->groupBy('item_id')->map(function ($itemTransactions, $itemId) {
                    $item = $itemTransactions->first()->inventory;
                    $totalQuantity = $itemTransactions->sum('quantity');

                    return [
                        'item_id' => $itemId,
                        'item_name' => $item->item_name,
                        'category' => $item->category,
                        'total_quantity' => abs($totalQuantity),
                        'unit_price' => $item->unit_price,
                        'total_value' => abs($totalQuantity) * $item->unit_price,
                        'transaction_count' => $itemTransactions->count()
                    ];
                })->values();
            });

            // Calculate totals
            $totalSales = $summary->get('sale', collect())->sum('total_value');
            $totalProcurement = $summary->get('procurement', collect())->sum('total_value');
            $totalReturns = $summary->get('return', collect())->sum('total_value');

            $reportData = [
                'date' => $reportDate->format('Y-m-d'),
                'summary_by_type' => $summary,
                'totals' => [
                    'total_sales' => $totalSales,
                    'total_procurement' => $totalProcurement,
                    'total_returns' => $totalReturns,
                    'net_movement' => $totalProcurement - $totalSales + $totalReturns
                ],
                'transaction_count' => $transactions->count()
            ];

            // Save report
            $report = Report::create([
                'report_type' => 'daily_usage',
                'generated_date' => now(),
                'report_date' => $reportDate,
                'data_summary' => $reportData,
                'generated_by' => Auth::check() ? Auth::user()->name : 'System'
            ]);

            return response()->json([
                'success' => true,
                'data' => $report,
                'message' => 'Daily usage report generated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate daily usage report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate monthly procurement report.
     */
    public function generateMonthlyProcurementReport(Request $request): JsonResponse
    {
        $month = $request->get('month', now()->format('Y-m'));
        $startDate = Carbon::parse($month . '-01')->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        try {
            // Get procurement transactions for the month
            $procurementTransactions = StockTransaction::where('transaction_type', 'procurement')
                                                     ->whereBetween('created_at', [$startDate, $endDate])
                                                     ->with('inventory')
                                                     ->get();

            // Group by item and calculate totals
            $procurementSummary = $procurementTransactions->groupBy('item_id')->map(function ($transactions, $itemId) {
                $item = $transactions->first()->inventory;
                $totalQuantity = $transactions->sum('quantity');
                $totalValue = $totalQuantity * $item->unit_price;

                return [
                    'item_id' => $itemId,
                    'item_name' => $item->item_name,
                    'category' => $item->category,
                    'supplier' => $item->supplier,
                    'total_quantity' => $totalQuantity,
                    'unit_price' => $item->unit_price,
                    'total_value' => $totalValue,
                    'procurement_count' => $transactions->count(),
                    'average_quantity_per_procurement' => $totalQuantity / $transactions->count()
                ];
            })->values();

            // Calculate category-wise summary
            $categoryWise = $procurementSummary->groupBy('category')->map(function ($items, $category) {
                return [
                    'category' => $category,
                    'total_items' => $items->count(),
                    'total_quantity' => $items->sum('total_quantity'),
                    'total_value' => $items->sum('total_value'),
                    'items' => $items->values()
                ];
            })->values();

            // Calculate trends (compare with previous month)
            $prevStartDate = $startDate->copy()->subMonth();
            $prevEndDate = $prevStartDate->copy()->endOfMonth();

            $prevMonthValue = StockTransaction::where('transaction_type', 'procurement')
                                            ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
                                            ->with('inventory')
                                            ->get()
                                            ->sum(function ($transaction) {
                                                return $transaction->quantity * $transaction->inventory->unit_price;
                                            });

            $currentMonthValue = $procurementSummary->sum('total_value');
            $trend = $prevMonthValue > 0 ? (($currentMonthValue - $prevMonthValue) / $prevMonthValue) * 100 : 0;

            $reportData = [
                'month' => $startDate->format('Y-m'),
                'procurement_summary' => $procurementSummary,
                'category_wise_summary' => $categoryWise,
                'totals' => [
                    'total_procurement_value' => $currentMonthValue,
                    'total_items_procured' => $procurementSummary->sum('total_quantity'),
                    'unique_items' => $procurementSummary->count(),
                    'total_transactions' => $procurementTransactions->count()
                ],
                'trends' => [
                    'previous_month_value' => $prevMonthValue,
                    'current_month_value' => $currentMonthValue,
                    'percentage_change' => round($trend, 2)
                ]
            ];

            // Save report
            $report = Report::create([
                'report_type' => 'monthly_procurement',
                'generated_date' => now(),
                'report_date' => $startDate,
                'data_summary' => $reportData,
                'generated_by' => Auth::check() ? Auth::user()->name : 'System'
            ]);

            return response()->json([
                'success' => true,
                'data' => $report,
                'message' => 'Monthly procurement report generated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate monthly procurement report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate end-of-day reconciliation report.
     */
    public function generateReconciliationReport(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $reportDate = Carbon::parse($date);

        try {
            // Get all inventory items with their transactions for the day
            $inventoryItems = Inventory::with(['stockTransactions' => function ($query) use ($reportDate) {
                $query->whereDate('created_at', $reportDate);
            }])->get();

            $reconciliationData = $inventoryItems->map(function ($item) use ($reportDate) {
                $dayTransactions = $item->stockTransactions;

                // Calculate opening stock (stock at beginning of day)
                $openingStock = $item->stock;
                if ($dayTransactions->count() > 0) {
                    $firstTransaction = $dayTransactions->sortBy('created_at')->first();
                    $openingStock = $firstTransaction->previous_stock;
                }

                $incomingStock = $dayTransactions->where('quantity', '>', 0)->sum('quantity');
                $outgoingStock = abs($dayTransactions->where('quantity', '<', 0)->sum('quantity'));
                $calculatedClosingStock = $openingStock + $incomingStock - $outgoingStock;
                $actualStock = $item->stock;
                $variance = $actualStock - $calculatedClosingStock;

                return [
                    'item_id' => $item->item_id,
                    'item_name' => $item->item_name,
                    'category' => $item->category,
                    'opening_stock' => $openingStock,
                    'incoming_stock' => $incomingStock,
                    'outgoing_stock' => $outgoingStock,
                    'calculated_closing_stock' => $calculatedClosingStock,
                    'actual_stock' => $actualStock,
                    'variance' => $variance,
                    'variance_value' => $variance * $item->unit_price,
                    'transaction_count' => $dayTransactions->count(),
                    'has_discrepancy' => $variance != 0
                ];
            });

            $discrepancies = $reconciliationData->where('has_discrepancy', true);
            $totalVarianceValue = $reconciliationData->sum('variance_value');

            $reportData = [
                'date' => $reportDate->format('Y-m-d'),
                'reconciliation_details' => $reconciliationData->values(),
                'summary' => [
                    'total_items_checked' => $reconciliationData->count(),
                    'items_with_discrepancies' => $discrepancies->count(),
                    'total_variance_value' => $totalVarianceValue,
                    'accuracy_percentage' => round((($reconciliationData->count() - $discrepancies->count()) / $reconciliationData->count()) * 100, 2)
                ],
                'discrepancies' => $discrepancies->values()
            ];

            // Save report
            $report = Report::create([
                'report_type' => 'reconciliation',
                'generated_date' => now(),
                'report_date' => $reportDate,
                'data_summary' => $reportData,
                'generated_by' => Auth::check() ? Auth::user()->name : 'System'
            ]);

            return response()->json([
                'success' => true,
                'data' => $report,
                'message' => 'Reconciliation report generated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate reconciliation report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get reports by type and date range.
     */
    public function getReports(Request $request): JsonResponse
    {
        $query = Report::query();

        if ($request->has('report_type')) {
            $query->where('report_type', $request->report_type);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('report_date', [$request->start_date, $request->end_date]);
        }

        $reports = $query->orderBy('generated_date', 'desc')
                        ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    /**
     * Get dashboard analytics.
     */
    public function getDashboardAnalytics(): JsonResponse
    {
        try {
            // Total inventory items
            $totalItems = Inventory::active()->count();

            // Total inventory value
            $totalValue = Inventory::active()->sum(DB::raw('stock * unit_price'));

            // Low stock count
            $lowStockCount = Inventory::lowStock()->active()->count();

            // Active reservations count
            $activeReservations = Reservation::whereIn('status', ['pending', 'approved'])->count();

            // Recent transactions (last 10)
            $recentTransactions = StockTransaction::with('inventory')
                                                ->orderBy('created_at', 'desc')
                                                ->limit(10)
                                                ->get()
                                                ->map(function ($transaction) {
                                                    return [
                                                        'id' => $transaction->id,
                                                        'item_id' => $transaction->item_id,
                                                        'transaction_type' => $transaction->transaction_type,
                                                        'quantity' => $transaction->quantity,
                                                        'balance_after' => $transaction->balance_after,
                                                        'reference_number' => $transaction->reference_number,
                                                        'notes' => $transaction->notes,
                                                        'created_at' => $transaction->created_at,
                                                        'updated_at' => $transaction->updated_at,
                                                        'inventory_item' => $transaction->inventory ? [
                                                            'id' => $transaction->inventory->id,
                                                            'item_id' => $transaction->inventory->item_id,
                                                            'item_name' => $transaction->inventory->item_name,
                                                            'category' => $transaction->inventory->category,
                                                        ] : null
                                                    ];
                                                });

            // Top categories by count and value
            $topCategories = Inventory::active()
                                   ->select('category',
                                           DB::raw('COUNT(*) as count'),
                                           DB::raw('SUM(stock * unit_price) as value'))
                                   ->groupBy('category')
                                   ->orderBy('value', 'desc')
                                   ->limit(5)
                                   ->get()
                                   ->map(function ($category) {
                                       return [
                                           'category' => $category->category,
                                           'count' => $category->count,
                                           'value' => $category->value
                                       ];
                                   });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_items' => $totalItems,
                    'total_value' => $totalValue,
                    'low_stock_count' => $lowStockCount,
                    'active_reservations' => $activeReservations,
                    'recent_transactions' => $recentTransactions,
                    'top_categories' => $topCategories
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get dashboard analytics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get usage analytics for specified date range.
     */
    public function getUsageAnalytics(Request $request): JsonResponse
    {
        try {
            $startDate = Carbon::parse($request->get('start_date', now()->subDays(30)->format('Y-m-d')));
            $endDate = Carbon::parse($request->get('end_date', now()->format('Y-m-d')));

            // Get sales/usage transactions within date range
            $usageTransactions = StockTransaction::where('transaction_type', 'sale')
                                               ->whereBetween('created_at', [$startDate, $endDate])
                                               ->with('inventory')
                                               ->get();

            // Group by item and calculate usage stats
            $usageByItem = $usageTransactions->groupBy('item_id')->map(function ($transactions, $itemId) {
                $item = $transactions->first()->inventory;
                $totalQuantity = $transactions->sum(function($t) { return abs($t->quantity); });
                $totalCost = $totalQuantity * $item->unit_price;

                return [
                    'item_id' => $itemId,
                    'item_name' => $item->item_name,
                    'part_number' => $item->item_id,
                    'description' => $item->description,
                    'category' => $item->category,
                    'consumed' => $totalQuantity,
                    'cost' => $totalCost,
                    'unit_price' => $item->unit_price,
                    'transaction_count' => $transactions->count()
                ];
            })->values();

            // Get category breakdown
            $categoryBreakdown = $usageByItem->groupBy('category')->map(function ($items, $category) {
                return [
                    'category' => $category,
                    'consumed' => $items->sum('consumed'),
                    'cost' => $items->sum('cost'),
                    'item_count' => $items->count()
                ];
            })->values();

            // Calculate summary metrics
            $totalConsumed = $usageByItem->sum('consumed');
            $totalCost = $usageByItem->sum('cost');
            $mostUsedItem = $usageByItem->sortByDesc('consumed')->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d')
                    ],
                    'summary' => [
                        'total_consumed' => $totalConsumed,
                        'total_cost' => $totalCost,
                        'unique_items_used' => $usageByItem->count(),
                        'most_used_item' => $mostUsedItem ? [
                            'part_number' => $mostUsedItem['part_number'],
                            'item_name' => $mostUsedItem['item_name'],
                            'consumed' => $mostUsedItem['consumed']
                        ] : null,
                        'active_categories' => $categoryBreakdown->where('consumed', '>', 0)->count()
                    ],
                    'usage_by_item' => $usageByItem,
                    'category_breakdown' => $categoryBreakdown,
                    'top_consumed_items' => $usageByItem->sortByDesc('consumed')->take(10)->values()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get usage analytics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get procurement analytics for specified date range.
     */
    public function getProcurementAnalytics(Request $request): JsonResponse
    {
        try {
            $startDate = Carbon::parse($request->get('start_date', now()->subDays(30)->format('Y-m-d')));
            $endDate = Carbon::parse($request->get('end_date', now()->format('Y-m-d')));

            // Get procurement transactions within date range
            $procurementTransactions = StockTransaction::where('transaction_type', 'procurement')
                                                     ->whereBetween('created_at', [$startDate, $endDate])
                                                     ->with('inventory')
                                                     ->get();

            // Group by item and calculate procurement stats
            $procurementByItem = $procurementTransactions->groupBy('item_id')->map(function ($transactions, $itemId) {
                $item = $transactions->first()->inventory;
                $totalQuantity = $transactions->sum('quantity');
                $totalCost = $totalQuantity * $item->unit_price;

                return [
                    'item_id' => $itemId,
                    'item_name' => $item->item_name,
                    'part_number' => $item->item_id,
                    'description' => $item->description,
                    'category' => $item->category,
                    'supplier' => $item->supplier,
                    'quantity_procured' => $totalQuantity,
                    'cost' => $totalCost,
                    'unit_price' => $item->unit_price,
                    'procurement_count' => $transactions->count(),
                    'average_procurement_size' => $totalQuantity / $transactions->count()
                ];
            })->values();

            // Get supplier breakdown
            $supplierBreakdown = $procurementByItem->groupBy('supplier')->map(function ($items, $supplier) {
                return [
                    'supplier' => $supplier ?: 'Unknown',
                    'total_quantity' => $items->sum('quantity_procured'),
                    'total_cost' => $items->sum('cost'),
                    'item_count' => $items->count(),
                    'procurement_count' => $items->sum('procurement_count')
                ];
            })->values();

            // Calculate summary metrics
            $totalProcured = $procurementByItem->sum('quantity_procured');
            $totalCost = $procurementByItem->sum('cost');
            $topSupplier = $supplierBreakdown->sortByDesc('total_cost')->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d')
                    ],
                    'summary' => [
                        'total_procured' => $totalProcured,
                        'total_cost' => $totalCost,
                        'unique_items_procured' => $procurementByItem->count(),
                        'total_procurement_orders' => $procurementTransactions->count(),
                        'top_supplier' => $topSupplier ? [
                            'name' => $topSupplier['supplier'],
                            'total_cost' => $topSupplier['total_cost'],
                            'item_count' => $topSupplier['item_count']
                        ] : null,
                        'supplier_count' => $supplierBreakdown->count()
                    ],
                    'procurement_by_item' => $procurementByItem,
                    'supplier_breakdown' => $supplierBreakdown,
                    'top_procurement_items' => $procurementByItem->sortByDesc('quantity_procured')->take(10)->values()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get procurement analytics: ' . $e->getMessage()
            ], 500);
        }
    }
}
