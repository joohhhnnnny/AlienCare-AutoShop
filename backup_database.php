<?php

/**
 * Complete SQLite Database Backup Script
 * This script backs up all data from your SQLite database to JSON files
 */

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Starting complete database backup...\n";

// Create backup directory
$backupDir = 'database_backup_' . date('Y-m-d_H-i-s');
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
}

// Get all table names
$tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");

echo "Found " . count($tables) . " tables to backup:\n";

$backupSummary = [];

foreach ($tables as $table) {
    $tableName = $table->name;
    echo "Backing up table: {$tableName}...";

    try {
        // Get table data
        $data = DB::table($tableName)->get();
        $recordCount = $data->count();

        // Save to JSON file
        $filename = "{$backupDir}/{$tableName}.json";
        file_put_contents($filename, $data->toJson(JSON_PRETTY_PRINT));

        // Get table structure
        $structure = DB::select("PRAGMA table_info({$tableName})");
        $structureFilename = "{$backupDir}/{$tableName}_structure.json";
        file_put_contents($structureFilename, json_encode($structure, JSON_PRETTY_PRINT));

        $backupSummary[$tableName] = [
            'records' => $recordCount,
            'data_file' => $filename,
            'structure_file' => $structureFilename,
            'status' => 'success'
        ];

        echo " ✓ {$recordCount} records\n";

    } catch (Exception $e) {
        echo " ✗ Error: " . $e->getMessage() . "\n";
        $backupSummary[$tableName] = [
            'records' => 0,
            'status' => 'error',
            'error' => $e->getMessage()
        ];
    }
}

// Create backup summary
$summaryData = [
    'backup_date' => date('Y-m-d H:i:s'),
    'backup_directory' => $backupDir,
    'total_tables' => count($tables),
    'total_records' => array_sum(array_column($backupSummary, 'records')),
    'tables' => $backupSummary
];

file_put_contents("{$backupDir}/backup_summary.json", json_encode($summaryData, JSON_PRETTY_PRINT));

// Create SQL dump as well
echo "\nCreating SQL dump...\n";
try {
    $sqlDump = '';

    foreach ($tables as $table) {
        $tableName = $table->name;

        // Get CREATE TABLE statement
        $createTable = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name='{$tableName}'");
        if (!empty($createTable)) {
            $sqlDump .= "-- Table: {$tableName}\n";
            $sqlDump .= $createTable[0]->sql . ";\n\n";

            // Get INSERT statements
            $records = DB::table($tableName)->get();
            foreach ($records as $record) {
                $columns = array_keys((array)$record);
                $values = array_values((array)$record);

                // Escape values
                $escapedValues = array_map(function($value) {
                    if (is_null($value)) {
                        return 'NULL';
                    } elseif (is_string($value)) {
                        return "'" . str_replace("'", "''", $value) . "'";
                    } else {
                        return $value;
                    }
                }, $values);

                $sqlDump .= "INSERT INTO `{$tableName}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $escapedValues) . ");\n";
            }
            $sqlDump .= "\n";
        }
    }

    file_put_contents("{$backupDir}/complete_database_dump.sql", $sqlDump);
    echo "SQL dump created: {$backupDir}/complete_database_dump.sql\n";

} catch (Exception $e) {
    echo "Error creating SQL dump: " . $e->getMessage() . "\n";
}

echo "\n=== BACKUP COMPLETE ===\n";
echo "Backup directory: {$backupDir}\n";
echo "Total tables backed up: " . count($backupSummary) . "\n";
echo "Total records backed up: " . $summaryData['total_records'] . "\n";
echo "\nFiles created:\n";
echo "- backup_summary.json (backup overview)\n";
echo "- complete_database_dump.sql (SQL dump)\n";
echo "- [table_name].json (data for each table)\n";
echo "- [table_name]_structure.json (structure for each table)\n";

echo "\nYou can now safely switch to MySQL!\n";
