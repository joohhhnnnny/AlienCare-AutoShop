<?php

use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'database' => 'connected',
        'timestamp' => now()->toISOString()
    ]);
});

// Inventory Management Routes
Route::prefix('inventory')->group(function () {

    // Basic CRUD operations
    Route::get('/', [InventoryController::class, 'index']);
    Route::post('/', [InventoryController::class, 'store']);
    Route::get('/{id}', [InventoryController::class, 'show']);
    Route::put('/{id}', [InventoryController::class, 'update']);
    Route::delete('/{id}', [InventoryController::class, 'destroy']);

    // Core Process Routes
    Route::get('/{itemId}/stock-status', [InventoryController::class, 'checkStockLevels']);
    Route::post('/add-stock', [InventoryController::class, 'addStock']);
    Route::post('/deduct-stock', [InventoryController::class, 'deductStock']);
    Route::post('/log-return-damage', [InventoryController::class, 'logReturnDamage']);
    Route::get('/alerts/low-stock', [InventoryController::class, 'generateLowStockAlerts']);
});

// Reservation Management Routes
Route::prefix('reservations')->group(function () {

    // Basic CRUD operations
    Route::get('/', [ReservationController::class, 'index']);
    Route::get('/summary', [ReservationController::class, 'getActiveReservationsSummary']);
    Route::get('/{id}', [ReservationController::class, 'show']);

    // Core Process Routes
    Route::post('/reserve', [ReservationController::class, 'reservePartsForJob']);
    Route::post('/reserve-multiple', [ReservationController::class, 'reserveMultiplePartsForJob']);
    Route::put('/{id}/approve', [ReservationController::class, 'approveReservation']);
    Route::put('/{id}/reject', [ReservationController::class, 'rejectReservation']);
    Route::put('/{id}/complete', [ReservationController::class, 'completeReservation']);
    Route::put('/{id}/cancel', [ReservationController::class, 'cancelReservation']);
});

// Reports & Analytics Routes
Route::prefix('reports')->group(function () {

    // Get reports
    Route::get('/', [ReportController::class, 'getReports']);
    Route::get('/{id}', [ReportController::class, 'show']);

    // Generate reports
    Route::post('/daily-usage', [ReportController::class, 'generateDailyUsageReport']);
    Route::post('/monthly-procurement', [ReportController::class, 'generateMonthlyProcurementReport']);
    Route::post('/reconciliation', [ReportController::class, 'generateReconciliationReport']);

    // Dashboard analytics
    Route::get('/analytics/dashboard', [ReportController::class, 'getDashboardAnalytics']);
    Route::get('/analytics/usage', [ReportController::class, 'getUsageAnalytics']);
    Route::get('/analytics/procurement', [ReportController::class, 'getProcurementAnalytics']);
});

// Alert Management Routes
Route::prefix('alerts')->group(function () {
    // Get all alerts with filtering
    Route::get('/', [AlertController::class, 'index']);

    // Get alert statistics and summary
    Route::get('/statistics', [AlertController::class, 'getAlertStatistics']);

    // Generate low stock alerts
    Route::post('/generate-low-stock', [AlertController::class, 'generateLowStockAlerts']);

    // Acknowledge specific alert (using PUT since API client doesn't have PATCH)
    Route::put('/{id}/acknowledge', [AlertController::class, 'acknowledge']);

    // Bulk acknowledge alerts
    Route::post('/bulk-acknowledge', [AlertController::class, 'bulkAcknowledge']);

    // Cleanup old acknowledged alerts
    Route::delete('/cleanup', [AlertController::class, 'cleanup']);
});

// Stock Transaction Routes (for historical data and auditing)
Route::prefix('transactions')->group(function () {
    Route::get('/', function (Request $request) {
        $query = \App\Models\StockTransaction::with('inventory');

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('transaction_type')) {
            $query->where('transaction_type', $request->transaction_type);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }

        $transactions = $query->orderBy('created_at', 'desc')
                             ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    });

    Route::get('/{id}', function ($id) {
        $transaction = \App\Models\StockTransaction::with('inventory')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction
        ]);
    });
});

// Archive/Audit Routes
Route::prefix('archives')->group(function () {
    Route::get('/', function (Request $request) {
        $query = \App\Models\Archive::query();

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        if ($request->has('entity_id')) {
            $query->where('entity_id', $request->entity_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('archived_date', [$request->start_date, $request->end_date]);
        }

        $archives = $query->orderBy('archived_date', 'desc')
                         ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $archives
        ]);
    });

    Route::get('/{id}', function ($id) {
        $archive = \App\Models\Archive::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $archive
        ]);
    });
});

// Health Check Route
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'Inventory API is healthy',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});
