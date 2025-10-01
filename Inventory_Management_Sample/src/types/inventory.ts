export interface Part {
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

export interface StockTransaction {
  id: string;
  partId: string;
  type: 'RESERVE' | 'CONSUME' | 'RETURN' | 'ADJUST' | 'RESTOCK';
  quantity: number;
  jobOrderId?: string;
  mechanic?: string;
  reason?: string;
  timestamp: Date;
  performedBy: string;
}

export interface Reservation {
  id: string;
  partId: string;
  jobOrderId: string;
  quantityReserved: number;
  quantityConsumed: number;
  status: 'ACTIVE' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LowStockAlert {
  id: string;
  partId: string;
  currentStock: number;
  threshold: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface UsageReport {
  partId: string;
  partNumber: string;
  description: string;
  consumed: number;
  reserved: number;
  returned: number;
  cost: number;
}