<?php

/**
 * Import SQLite backup data to MySQL (Fixed version)
 */

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Starting data import from SQLite backup to MySQL (with foreign key handling)...\n";

$backupDir = 'database_backup_2025-10-02_12-59-38';

// Disable foreign key checks temporarily
DB::statement('SET FOREIGN_KEY_CHECKS=0;');

// Clear all existing data first
$tablesToClear = [
    'stock_transactions',
    'reservations',
    'inventories',
    'users',
    'reports',
    'archives',
    'alerts',
    'cache',
    'sessions'
];

echo "Clearing existing data...\n";
foreach ($tablesToClear as $table) {
    try {
        DB::table($table)->truncate();
        echo "- Cleared {$table}\n";
    } catch (Exception $e) {
        echo "- Warning: Could not clear {$table}: " . $e->getMessage() . "\n";
    }
}

// Import data in correct order (parent tables first)
$tablesToImport = [
    'users',
    'inventories',      // Must come before reservations and stock_transactions
    'reservations',     // Depends on inventories
    'stock_transactions', // Depends on inventories
    'reports',
    'archives',
    'alerts',
    'cache',
    'sessions'
];

$totalImported = 0;

echo "\nImporting data...\n";
foreach ($tablesToImport as $tableName) {
    $jsonFile = "{$backupDir}/{$tableName}.json";

    if (file_exists($jsonFile)) {
        echo "Importing {$tableName}...";

        try {
            $jsonData = file_get_contents($jsonFile);
            $data = json_decode($jsonData, true);

            if (!empty($data)) {
                // Import data in chunks
                $chunks = array_chunk($data, 50); // Smaller chunks
                $imported = 0;

                foreach ($chunks as $chunk) {
                    DB::table($tableName)->insert($chunk);
                    $imported += count($chunk);
                }

                echo " ✓ {$imported} records imported\n";
                $totalImported += $imported;
            } else {
                echo " ✓ 0 records (table was empty)\n";
            }

        } catch (Exception $e) {
            echo " ✗ Error: " . $e->getMessage() . "\n";
            // Continue with other tables
        }
    } else {
        echo "Warning: Backup file not found for {$tableName}\n";
    }
}

// Re-enable foreign key checks
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "\n=== IMPORT COMPLETE ===\n";
echo "Total records imported: {$totalImported}\n";

// Verify the import
echo "\nVerifying data import:\n";
foreach ($tablesToImport as $tableName) {
    try {
        $count = DB::table($tableName)->count();
        echo "- {$tableName}: {$count} records\n";
    } catch (Exception $e) {
        echo "- {$tableName}: Error counting records\n";
    }
}

echo "\nMySQL database conversion complete!\n";
echo "Your application should now work with MySQL instead of SQLite.\n";
