// Updated to match Laravel backend Inventory model
export interface InventoryItem {
  id: number;
  item_id: string;
  item_name: string;
  description: string;
  category: string;
  stock: number;
  reorder_level: number;
  unit_price: number;
  supplier: string;
  location: string;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility
export interface Part extends Omit<InventoryItem, 'id' | 'item_id' | 'item_name' | 'stock' | 'reorder_level' | 'unit_price' | 'created_at' | 'updated_at'> {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  maxCapacity: number;
  unitCost: number;
  supplier: string;
  location: string;
  lastUpdated: Date;
}

// Updated to match Laravel backend StockTransaction model
export interface StockTransaction {
  id: number;
  item_id: string;
  transaction_type: 'procurement' | 'sale' | 'return' | 'damage' | 'adjustment';
  quantity: number;
  balance_after: number;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  inventory_item?: InventoryItem;
}

// Updated to match Laravel backend Reservation model
export interface Reservation {
  id: number;
  item_id: string;
  quantity: number;
  job_order_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  requested_by: string;
  approved_by?: string;
  completed_by?: string;
  cancelled_by?: string;
  actual_quantity?: number;
  expires_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  inventory_item?: InventoryItem;
}

// Updated to match Laravel backend low stock detection
export interface LowStockAlert {
  id: number;
  item_id: string;
  item_name: string;
  current_stock: number;
  reorder_level: number;
  category: string;
  supplier: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  acknowledged?: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

// Updated to match Laravel backend Report model
export interface Report {
  id: number;
  report_type: 'daily_usage' | 'monthly_procurement' | 'reconciliation' | 'low_stock' | 'reservation_summary';
  report_date: string;
  data: any; // JSON data specific to report type
  created_at: string;
  updated_at: string;
}

// Dashboard analytics interface
export interface DashboardAnalytics {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  active_reservations: number;
  recent_transactions: StockTransaction[];
  top_categories: {
    category: string;
    count: number;
    value: number;
  }[];
}

export interface UsageReport {
  partId: string;
  partNumber: string;
  description: string;
  category: string;
  totalConsumed: number;
  totalValue: number;
  averagePerJob: number;
  period: string;
}
