<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\StockTransaction;
use App\Events\StockUpdated;
use App\Events\LowStockAlert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    /**
     * Display a listing of inventory items.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Inventory::active();

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by low stock
        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        // Search by item name or ID
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                  ->orWhere('item_id', 'like', "%{$search}%");
            });
        }

        $inventories = $query->with(['reservations', 'stockTransactions'])
                            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $inventories
        ]);
    }

    /**
     * Store a newly created inventory item.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|string|unique:inventories,item_id',
            'item_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'stock' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $inventory = Inventory::create($request->all());

            // Log initial stock if any
            if ($inventory->stock > 0) {
                StockTransaction::create([
                    'item_id' => $inventory->item_id,
                    'transaction_type' => 'procurement',
                    'quantity' => $inventory->stock,
                    'previous_stock' => 0,
                    'new_stock' => $inventory->stock,
                    'reference_number' => 'INITIAL_STOCK',
                    'notes' => 'Initial stock entry',
                    'created_by' => Auth::check() ? Auth::user()->name : 'System'
                ]);
            }

            event(new StockUpdated($inventory, 'created'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $inventory,
                'message' => 'Inventory item created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check stock levels for a specific part.
     */
    public function checkStockLevels(string $itemId, Request $request): JsonResponse
    {
        $requestedQuantity = $request->get('quantity', 1);

        $inventory = Inventory::where('item_id', $itemId)->first();

        if (!$inventory) {
            return response()->json([
                'success' => false,
                'message' => 'Item not found'
            ], 404);
        }

        $status = $inventory->getStockStatus($requestedQuantity);
        $availableStock = $inventory->available_stock;

        return response()->json([
            'success' => true,
            'data' => [
                'item_id' => $inventory->item_id,
                'item_name' => $inventory->item_name,
                'current_stock' => $inventory->stock,
                'available_stock' => $availableStock,
                'requested_quantity' => $requestedQuantity,
                'status' => $status,
                'is_low_stock' => $inventory->isLowStock(),
                'reorder_level' => $inventory->reorder_level
            ]
        ]);
    }

    /**
     * Add new stock (Procurement).
     */
    public function addStock(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|string|exists:inventories,item_id',
            'quantity' => 'required|integer|min:1',
            'reference_number' => 'nullable|string',
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
            $previousStock = $inventory->stock;
            $newStock = $previousStock + $request->quantity;

            // Update inventory
            $inventory->update(['stock' => $newStock]);

            // Log transaction
            StockTransaction::create([
                'item_id' => $request->item_id,
                'transaction_type' => 'procurement',
                'quantity' => $request->quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference_number' => $request->reference_number,
                'notes' => $request->notes,
                'created_by' => Auth::check() ? Auth::user()->name : 'System'
            ]);

            event(new StockUpdated($inventory, 'procurement'));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'item_id' => $inventory->item_id,
                    'previous_stock' => $previousStock,
                    'added_quantity' => $request->quantity,
                    'new_stock' => $newStock
                ],
                'message' => 'Stock added successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to add stock: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deduct stock for sales (POS integration).
     */
    public function deductStock(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|string|exists:inventories,item_id',
            'quantity' => 'required|integer|min:1',
            'reference_number' => 'required|string',
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

            if ($inventory->available_stock < $request->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient stock available'
                ], 400);
            }

            $previousStock = $inventory->stock;
            $newStock = $previousStock - $request->quantity;

            // Update inventory
            $inventory->update(['stock' => $newStock]);

            // Log transaction
            StockTransaction::create([
                'item_id' => $request->item_id,
                'transaction_type' => 'sale',
                'quantity' => -$request->quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference_number' => $request->reference_number,
                'notes' => $request->notes,
                'created_by' => Auth::check() ? Auth::user()->name : 'System'
            ]);

            event(new StockUpdated($inventory, 'sale'));

            // Check for low stock
            if ($inventory->isLowStock()) {
                event(new LowStockAlert($inventory));
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'item_id' => $inventory->item_id,
                    'previous_stock' => $previousStock,
                    'deducted_quantity' => $request->quantity,
                    'new_stock' => $newStock,
                    'is_low_stock' => $inventory->isLowStock()
                ],
                'message' => 'Stock deducted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to deduct stock: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Log return or damage.
     */
    public function logReturnDamage(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|string|exists:inventories,item_id',
            'quantity' => 'required|integer|min:1',
            'type' => 'required|in:return,damage',
            'reference_number' => 'nullable|string',
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

            $inventory = Inventory::where('item_id', $request->item_id)->first();
            $previousStock = $inventory->stock;

            // For returns, add back to stock; for damage, don't add back
            $quantityChange = $request->type === 'return' ? $request->quantity : 0;
            $newStock = $previousStock + $quantityChange;

            // Update inventory
            $inventory->update(['stock' => $newStock]);

            // Log transaction
            StockTransaction::create([
                'item_id' => $request->item_id,
                'transaction_type' => $request->type,
                'quantity' => $request->type === 'return' ? $request->quantity : -$request->quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference_number' => $request->reference_number,
                'notes' => $request->notes,
                'created_by' => Auth::check() ? Auth::user()->name : 'System'
            ]);

            event(new StockUpdated($inventory, $request->type));

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'item_id' => $inventory->item_id,
                    'type' => $request->type,
                    'quantity' => $request->quantity,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock
                ],
                'message' => ucfirst($request->type) . ' logged successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Failed to log ' . $request->type . ': ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate low-stock alerts.
     */
    public function generateLowStockAlerts(): JsonResponse
    {
        $lowStockItems = Inventory::lowStock()->active()->get();

        $alerts = $lowStockItems->map(function ($item) {
            return [
                'item_id' => $item->item_id,
                'item_name' => $item->item_name,
                'current_stock' => $item->stock,
                'reorder_level' => $item->reorder_level,
                'category' => $item->category,
                'supplier' => $item->supplier,
                'urgency' => $item->stock == 0 ? 'critical' : 'warning'
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'alert_count' => $alerts->count(),
                'alerts' => $alerts
            ]
        ]);
    }
}
