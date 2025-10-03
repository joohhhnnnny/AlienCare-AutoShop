<?php

/**
 * Import SQLite backup data to MySQL
 */

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Starting data import from SQLite backup to MySQL...\n";

$backupDir = 'database_backup_2025-10-02_12-59-38';

// Tables to import (in order to handle foreign key dependencies)
$tablesToImport = [
    'users',
    'inventories',
    'reservations',
    'stock_transactions',
    'reports',
    'archives',
    'alerts',
    'cache',
    'sessions'
];

$totalImported = 0;

foreach ($tablesToImport as $tableName) {
    $jsonFile = "{$backupDir}/{$tableName}.json";

    if (file_exists($jsonFile)) {
        echo "Importing {$tableName}...";

        try {
            $jsonData = file_get_contents($jsonFile);
            $data = json_decode($jsonData, true);

            if (!empty($data)) {
                // Clear existing data first
                DB::table($tableName)->truncate();

                // Import data in chunks to avoid memory issues
                $chunks = array_chunk($data, 100);
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
        }
    } else {
        echo "Warning: Backup file not found for {$tableName}\n";
    }
}

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

echo "\nMySQL database is now ready with your data!\n";
