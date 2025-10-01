# Inventory Management System - Laravel Backend

## Overview

This is a comprehensive inventory management system designed for auto repair shops, built with Laravel. It provides real-time stock tracking, reservation management, automated reporting, and audit logging.

## Features

### Core Functionality
- ✅ **Stock Level Management** - Real-time stock tracking with automatic alerts
- ✅ **Reservation System** - Reserve parts for job orders with approval workflow
- ✅ **Transaction Logging** - Complete audit trail of all stock movements
- ✅ **Automated Reporting** - Daily, monthly, and reconciliation reports
- ✅ **Low Stock Alerts** - Automatic notifications when stock falls below reorder levels
- ✅ **POS Integration** - Automatic stock deduction on sales
- ✅ **Procurement Tracking** - Log stock additions from suppliers
- ✅ **Return/Damage Processing** - Handle returns and damaged inventory

### Technical Features
- Event-driven architecture with Laravel Events & Listeners
- Queue-based job processing for reports
- Database transactions for data consistency
- RESTful API with comprehensive endpoints
- Factory and seeder support for testing
- Automated maintenance commands

## Database Schema

### Core Tables
1. **inventories** - Main inventory items with stock levels
2. **reservations** - Part reservations for job orders
3. **stock_transactions** - All stock movement transactions
4. **reports** - Generated reports and analytics
5. **archives** - Audit log for all changes

## API Endpoints

### Inventory Management
```
GET    /api/inventory              - List inventory items
POST   /api/inventory              - Create new inventory item
GET    /api/inventory/{itemId}/stock-status - Check stock status
POST   /api/inventory/add-stock    - Add stock (procurement)
POST   /api/inventory/deduct-stock - Deduct stock (sales)
POST   /api/inventory/log-return-damage - Log returns/damage
GET    /api/inventory/alerts/low-stock - Get low stock alerts
```

### Reservation Management
```
GET    /api/reservations           - List reservations
POST   /api/reservations/reserve   - Create new reservation
PUT    /api/reservations/{id}/approve - Approve reservation
PUT    /api/reservations/{id}/reject  - Reject reservation
PUT    /api/reservations/{id}/complete - Complete reservation
PUT    /api/reservations/{id}/cancel  - Cancel reservation
```

### Reports & Analytics
```
GET    /api/reports                - Get reports
POST   /api/reports/daily-usage    - Generate daily usage report
POST   /api/reports/monthly-procurement - Generate monthly procurement report
POST   /api/reports/reconciliation - Generate reconciliation report
GET    /api/reports/analytics/dashboard - Get dashboard analytics
```

### Transactions & Audit
```
GET    /api/transactions           - List stock transactions
GET    /api/archives              - List audit logs
```

## Installation & Setup

### 1. Database Migration
```bash
# Run migrations in order
php artisan migrate

# Or run specific migrations
php artisan migrate --path=/database/migrations/2024_10_01_000001_create_inventories_table.php
php artisan migrate --path=/database/migrations/2024_10_01_000002_create_reports_table.php
php artisan migrate --path=/database/migrations/2024_10_01_000003_create_archives_table.php
php artisan migrate --path=/database/migrations/2024_10_01_000004_create_reservations_table.php
php artisan migrate --path=/database/migrations/2024_10_01_000005_create_stock_transactions_table.php
```

### 2. Seed Sample Data
```bash
# Seed with sample inventory data
php artisan db:seed --class=InventorySeeder

# Or seed everything
php artisan db:seed
```

### 3. Queue Configuration
Set up queues for background job processing:
```bash
# Run queue worker
php artisan queue:work
```

### 4. Schedule Configuration
Add to `app/Console/Kernel.php`:
```php
protected function schedule(Schedule $schedule)
{
    // Run daily maintenance at 2 AM
    $schedule->command('inventory:maintenance --type=all')
             ->daily()
             ->at('02:00');
    
    // Generate daily reports at 6 AM
    $schedule->command('inventory:maintenance --type=reports')
             ->daily()
             ->at('06:00');
    
    // Check for low stock alerts every hour during business hours
    $schedule->command('inventory:maintenance --type=alerts')
             ->hourly()
             ->between('8:00', '18:00');
}
```

## Usage Examples

### Check Stock Status
```bash
curl -X GET "http://your-app.com/api/inventory/BRK-PAD-001/stock-status?quantity=5"
```

### Add Stock (Procurement)
```bash
curl -X POST "http://your-app.com/api/inventory/add-stock" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "BRK-PAD-001",
    "quantity": 20,
    "reference_number": "PO-2024-1001",
    "notes": "Monthly restock from supplier"
  }'
```

### Reserve Parts for Job
```bash
curl -X POST "http://your-app.com/api/reservations/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "BRK-PAD-001",
    "quantity": 2,
    "job_order_number": "JO-2024-1001",
    "requested_by": "John Mechanic",
    "notes": "Brake service for customer"
  }'
```

### Deduct Stock (POS Integration)
```bash
curl -X POST "http://your-app.com/api/inventory/deduct-stock" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "BRK-PAD-001",
    "quantity": 1,
    "reference_number": "POS-20241001-123",
    "notes": "Point of sale transaction"
  }'
```

## Core Business Processes

### 1. Stock Level Monitoring
- Automatic low stock alerts when stock ≤ reorder level
- Color-coded status: Available, Partial, Backorder
- Real-time available stock calculation (total stock - reserved stock)

### 2. Reservation Workflow
1. **Create Reservation** - Request parts for job order
2. **Approve/Reject** - Manager approval process
3. **Complete Reservation** - Deduct actual stock used
4. **Auto-expire** - Expire old reservations automatically

### 3. Transaction Logging
Every stock movement is logged with:
- Transaction type (procurement, sale, reservation, return, damage)
- Quantity change
- Previous and new stock levels
- Reference number (PO, JO, POS transaction)
- User and timestamp

### 4. Automated Reporting
- **Daily Usage Reports** - Summary of daily transactions
- **Monthly Procurement Reports** - Supplier and category analysis
- **Reconciliation Reports** - Stock accuracy verification
- **Low Stock Alerts** - Automated reorder notifications

## Events & Listeners

### Events
- `StockUpdated` - Fired when inventory stock changes
- `LowStockAlert` - Fired when stock falls below reorder level
- `ReservationUpdated` - Fired on reservation status changes

### Listeners
- `LogStockTransaction` - Archives all stock movements
- `HandleLowStockAlert` - Generates alert reports
- `LogReservationActivity` - Archives reservation changes

## Maintenance Commands

### Daily Maintenance
```bash
# Run all maintenance tasks
php artisan inventory:maintenance --type=all

# Generate reports only
php artisan inventory:maintenance --type=reports

# Check alerts only
php artisan inventory:maintenance --type=alerts

# Cleanup old data only
php artisan inventory:maintenance --type=cleanup
```

## Data Models

### Inventory Model
- Tracks individual parts/items with stock levels
- Relationships to transactions, reservations, and archives
- Built-in methods for stock status checking

### Reservation Model
- Manages part reservations with approval workflow
- Status tracking: pending → approved → completed
- Automatic expiration handling

### StockTransaction Model
- Complete audit trail of all stock movements
- Links to inventory items with before/after stock levels
- Support for different transaction types

### Report Model
- Stores generated reports with structured data
- Support for multiple report types
- JSON data storage for flexible reporting

### Archive Model
- Audit logging for all entity changes
- Stores before/after data for complete audit trail
- Searchable by entity type and date range

## Error Handling

The system includes comprehensive error handling:
- Database transaction rollback on failures
- Detailed error logging
- Validation on all inputs
- Stock availability checks before deduction
- Concurrent access protection with database locks

## Security Considerations

- All stock modifications wrapped in database transactions
- Event-driven audit logging prevents data loss
- Input validation on all API endpoints
- Authorization middleware can be added for role-based access
- Reference number tracking for external system integration

## Performance Optimizations

- Database indexes on frequently queried columns
- Eager loading of relationships to prevent N+1 queries
- Queue-based processing for heavy operations
- Pagination on large datasets
- Optimized queries with proper joins

## Integration Points

The system is designed to integrate with:
- **POS Systems** - Automatic stock deduction on sales
- **Job Order Management** - Reservation linking to work orders
- **Procurement Systems** - Stock addition from suppliers
- **Billing Systems** - Transaction reference tracking
- **External APIs** - RESTful endpoints for all operations

## Testing

### Sample Data
Use the provided seeders to create realistic test data:
```bash
php artisan db:seed --class=InventorySeeder
```

### Factory Support
Create test data using factories:
```php
// Create inventory items
$items = Inventory::factory(50)->create();

// Create reservations
$reservations = Reservation::factory(20)->create();

// Create transactions
$transactions = StockTransaction::factory(100)->create();
```

## Support & Maintenance

The system includes built-in maintenance features:
- Automated cleanup of old data
- Stock accuracy monitoring
- Performance metric calculation
- Health score tracking
- Automated report generation

For questions or issues, refer to the Laravel documentation and the inline code comments throughout the system.
