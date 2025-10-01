# Real-time Audit Log System

This document describes the implementation of the dynamic and real-time audit log panel in the inventory management system.

## Overview

The audit log system has been enhanced to provide real-time tracking of all inventory transactions and changes. It integrates with the existing Laravel backend and provides a seamless user experience with live updates.

## Features

### 🔄 Real-time Updates
- **Event-driven architecture**: Uses a custom event dispatcher to broadcast inventory changes
- **Auto-refresh**: Automatically updates when real-time mode is enabled
- **Background polling**: Falls back to periodic polling every 30 seconds
- **Visual indicators**: Shows real-time status and last update timestamp

### 📊 Comprehensive Data Sources
- **Stock Transactions**: All procurement, sales, returns, damages, and adjustments
- **Archive Records**: Complete audit trail from the Laravel Archive model
- **Combined View**: Merges transactions and archives for complete visibility
- **Enhanced Statistics**: Real-time calculation of transaction counts and user activity

### 🔍 Advanced Filtering
- **Text Search**: Search by item ID, job order number, notes, or reason
- **Transaction Type Filter**: Filter by CONSUME, RESTOCK, RESERVE, RETURN, ADJUST, DAMAGE
- **User Filter**: Filter by user who performed the action
- **Date Range Filter**: Quick filters for today, this week, this month, or all time
- **Real-time Filter Updates**: Filters apply immediately without page refresh

### 📈 Live Statistics Dashboard
- **Total Transactions**: Real-time count of all audit records
- **Today's Activity**: Live count of transactions in the last 24 hours
- **Active Users**: Number of unique users with recent activity
- **Data Integrity**: Compliance indicator (always 100% due to immutable audit log)
- **Transaction Type Breakdown**: Real-time counts by transaction type
- **Activity Timeline**: Recent activity statistics for last 24 hours, week, and month

## Technical Implementation

### Architecture Components

#### 1. **AuditService** (`/services/auditService.ts`)
```typescript
class AuditService {
  // Fetches audit logs from /api/archives endpoint
  async getAuditLogs(filters: AuditLogFilters): Promise<ApiResponse<PaginatedResponse<AuditLog>>>
  
  // Fetches stock transactions from /api/transactions endpoint  
  async getAuditTransactions(filters): Promise<ApiResponse<PaginatedResponse<StockTransaction>>>
  
  // Combines data from both sources for complete audit view
  async getCombinedAuditData(filters): Promise<{transactions, archives, stats}>
}
```

#### 2. **useAuditLog Hook** (`/hooks/useAuditLog.ts`)
```typescript
export function useAuditLog(initialFilters): UseAuditLogReturn {
  // State management for audit data
  // Real-time event handling
  // Auto-refresh functionality
  // Filter management
  // Error handling
}
```

#### 3. **Event Dispatcher** (`/utils/inventoryEvents.ts`)
```typescript
class InventoryEventDispatcher {
  dispatch(type: InventoryEventType, data?: any): void
  listen(type: InventoryEventType, callback): cleanup function
  listenMultiple(types, callback): cleanup function
}
```

#### 4. **Enhanced UI Components**
- **Real-time Toggle**: Switch to enable/disable real-time updates
- **Refresh Button**: Manual refresh with loading state
- **Live Statistics Cards**: Real-time metrics display
- **Advanced Filters**: Multiple filter options with instant application
- **Demo Component**: Interactive demonstrations of real-time functionality

### Backend Integration

The system integrates with existing Laravel API endpoints:

```php
// Stock transactions for audit display
GET /api/transactions
  ?item_id=ITEM001
  ?transaction_type=procurement
  ?start_date=2023-01-01
  ?end_date=2023-12-31
  ?per_page=50

// Archive records for complete audit trail  
GET /api/archives
  ?entity_type=inventory
  ?action=update
  ?start_date=2023-01-01
  ?end_date=2023-12-31
  ?per_page=50
```

### Data Flow

1. **User Action**: User performs inventory operation (add stock, create reservation, etc.)
2. **Backend Processing**: Laravel processes the request and stores data
3. **Event Dispatch**: Frontend hook dispatches custom event
4. **Real-time Update**: Audit log hook receives event and refreshes data
5. **UI Update**: Component re-renders with new data automatically

### Event Types

```typescript
type InventoryEventType = 
  | 'inventory-updated'    // Item created, updated, or deleted
  | 'reservation-updated'  // Reservation status changes
  | 'stock-transaction'    // Stock movements (in/out)
  | 'audit-log-updated'    // General audit log refresh trigger
```

## Usage Guide

### Enabling Real-time Mode

1. Navigate to the Audit Log tab in the inventory management system
2. Toggle the "Real-time" switch in the top-right corner
3. The system will now automatically refresh when changes occur
4. A green Wi-Fi icon indicates real-time mode is active

### Using the Demo

1. Enable real-time mode
2. Use the demo buttons to simulate inventory operations:
   - **Simulate Stock Operations**: Demonstrates procurement and consumption
   - **Simulate Reservation Flow**: Shows reservation lifecycle
   - **Simulate Mixed Operations**: Multiple concurrent operations
3. Watch the audit log update in real-time as operations are simulated

### Filtering Data

- **Search Box**: Enter item ID, job order, or notes to filter records
- **Transaction Type**: Select specific transaction types to view
- **User Filter**: Filter by user who performed the action
- **Date Buttons**: Quick filter for recent activity periods

### Understanding the Data

#### Transaction Display
- **Timestamp**: When the operation occurred
- **Transaction ID**: Unique identifier for tracking
- **Type**: Color-coded badges for different operation types
- **Item ID**: The inventory item affected
- **Quantity**: Amount changed (+ for increases, - for decreases)
- **Job Order**: Associated work order if applicable
- **Performed By**: User who initiated the action
- **Reason/Notes**: Additional context or reason for the change

#### Statistics Cards
- **Total Transactions**: Cumulative count of all audit records
- **Today's Activity**: Actions performed in the last 24 hours
- **Active Users**: Number of unique users with recent activity
- **Data Integrity**: Always 100% due to immutable audit design

## Performance Considerations

### Optimization Features
- **Pagination**: Large datasets are paginated to maintain performance
- **Debounced Filtering**: Search input is debounced to reduce API calls
- **Smart Polling**: Real-time updates use intelligent polling intervals
- **Event Cleanup**: Proper cleanup of event listeners to prevent memory leaks
- **Error Recovery**: Automatic retry mechanisms for failed requests

### Scalability
- **Backend Caching**: Laravel can implement caching for frequently accessed audit data
- **Database Indexing**: Indexes on timestamps and entity IDs for fast queries
- **Pagination**: Configurable page sizes to balance performance and usability
- **Event Batching**: Multiple rapid events are batched to reduce server load

## Browser Compatibility

The real-time audit log system is compatible with:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features
- **CustomEvent API**: For event dispatching
- **Fetch API**: For backend communication
- **ES6 Modules**: For modern JavaScript features
- **CSS Grid/Flexbox**: For responsive layout

## Troubleshooting

### Common Issues

#### Real-time Updates Not Working
1. Check if real-time mode is enabled (green Wi-Fi icon)
2. Verify browser console for JavaScript errors
3. Ensure backend API endpoints are accessible
4. Check network connectivity

#### Performance Issues
1. Reduce page size in filters (default: 50 records)
2. Use date filters to limit data range
3. Clear browser cache if necessary
4. Check for console errors indicating failed requests

#### Data Not Loading
1. Verify backend API is running
2. Check authentication status
3. Review browser network tab for failed requests
4. Ensure proper CORS configuration

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
// Enable verbose logging for audit system
localStorage.setItem('audit-debug', 'true');
```

## Future Enhancements

### Planned Features
- **WebSocket Integration**: Replace polling with real WebSocket connections
- **Export Functionality**: Download audit logs as CSV/PDF
- **Advanced Analytics**: Trend analysis and reporting
- **User Activity Heatmaps**: Visual representation of user actions
- **Automated Alerts**: Notifications for suspicious activities
- **Audit Trail Integrity**: Cryptographic verification of audit records

### Integration Opportunities
- **Mobile Application**: Real-time notifications on mobile devices
- **Third-party Systems**: Integration with ERP systems
- **Compliance Reporting**: Automated regulatory compliance reports
- **Machine Learning**: Anomaly detection in transaction patterns

## Security Considerations

### Data Protection
- **Read-only Access**: Audit logs are immutable and read-only
- **User Authentication**: All access requires proper authentication
- **Data Encryption**: Sensitive data is encrypted in transit and at rest
- **Audit Trail**: Complete trail of who accessed what and when

### Privacy Compliance
- **Data Minimization**: Only necessary data is collected and displayed
- **Retention Policies**: Configurable data retention periods
- **Access Controls**: Role-based access to audit information
- **Anonymization**: Option to anonymize user data for compliance

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Author**: AI Assistant  
**Status**: Production Ready
