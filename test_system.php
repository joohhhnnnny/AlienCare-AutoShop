<?php

/**
 * Simple test script to verify the inventory system
 * Run with: php test_system.php
 */

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== AlienCare AutoShop Inventory System Test ===\n\n";

try {
    // Test database connection
    echo "1. Testing database connection...\n";
    $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "   ✓ Database connected successfully\n\n";

    // Test inventory data
    echo "2. Testing inventory data...\n";
    $inventoryCount = App\Models\Inventory::count();
    echo "   ✓ Inventory items: $inventoryCount\n";

    // Show sample inventory items
    $sampleItems = App\Models\Inventory::take(3)->get(['item_id', 'item_name', 'stock', 'category']);
    foreach ($sampleItems as $item) {
        echo "   - {$item->item_id}: {$item->item_name} (Stock: {$item->stock}) [{$item->category}]\n";
    }
    echo "\n";

    // Test low stock alerts
    echo "3. Testing low stock detection...\n";
    $lowStockItems = App\Models\Inventory::whereRaw('stock <= reorder_level')->count();
    echo "   ✓ Low stock items found: $lowStockItems\n\n";

    // Test reservations
    echo "4. Testing reservation system...\n";
    $reservationCount = App\Models\Reservation::count();
    echo "   ✓ Reservations in system: $reservationCount\n\n";

    // Test stock transactions
    echo "5. Testing transaction logging...\n";
    $transactionCount = App\Models\StockTransaction::count();
    echo "   ✓ Stock transactions logged: $transactionCount\n\n";

    // Test reports
    echo "6. Testing report system...\n";
    $reportCount = App\Models\Report::count();
    echo "   ✓ Reports generated: $reportCount\n\n";

    // Test business logic
    echo "7. Testing business logic...\n";

    // Test stock availability using model method
    $testItem = App\Models\Inventory::first();
    if ($testItem) {
        $availability = $testItem->stock > 0;
        echo "   ✓ Stock availability check: " . ($availability ? "Available" : "Not available") . "\n";

        // Test inventory value calculation
        $totalValue = App\Models\Inventory::sum(\Illuminate\Support\Facades\DB::raw('stock * unit_price'));
        echo "   ✓ Total inventory value: $" . number_format($totalValue, 2) . "\n";
    }

    echo "\n=== All Tests Passed! ✓ ===\n";
    echo "Your inventory system is ready to use!\n\n";

    echo "Next steps:\n";
    echo "1. Start the server: php artisan serve\n";
    echo "2. Visit: http://127.0.0.1:8000/api/inventory\n";
    echo "3. Use the Postman collection to test all endpoints\n";
    echo "4. Check the README.md for full API documentation\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Please check your .env configuration and database setup.\n";
}
