import { Part, StockTransaction, Reservation, LowStockAlert } from '../types/inventory';

export const mockParts: Part[] = [
  {
    id: 'p001',
    partNumber: 'BRK-PAD-001',
    description: 'Brake Pads - Front Set',
    category: 'Brakes',
    currentStock: 25,
    minThreshold: 10,
    maxCapacity: 50,
    unitCost: 45.99,
    supplier: 'AutoParts Plus',
    location: 'A-1-2',
    lastUpdated: new Date('2024-01-15')
  },
  {
    id: 'p002',
    partNumber: 'OIL-FLT-5W30',
    description: 'Oil Filter - 5W30 Compatible',
    category: 'Engine',
    currentStock: 8,
    minThreshold: 15,
    maxCapacity: 75,
    unitCost: 12.50,
    supplier: 'Engine Masters',
    location: 'B-2-1',
    lastUpdated: new Date('2024-01-14')
  },
  {
    id: 'p003',
    partNumber: 'TIRE-205-65R16',
    description: 'All-Season Tire 205/65R16',
    category: 'Tires',
    currentStock: 32,
    minThreshold: 20,
    maxCapacity: 100,
    unitCost: 89.99,
    supplier: 'Tire World',
    location: 'C-1-1',
    lastUpdated: new Date('2024-01-16')
  },
  {
    id: 'p004',
    partNumber: 'SPARK-PLG-NGK',
    description: 'NGK Spark Plugs (Set of 4)',
    category: 'Engine',
    currentStock: 5,
    minThreshold: 12,
    maxCapacity: 60,
    unitCost: 28.75,
    supplier: 'Engine Masters',
    location: 'B-1-3',
    lastUpdated: new Date('2024-01-13')
  },
  {
    id: 'p005',
    partNumber: 'BAT-12V-75AH',
    description: 'Car Battery 12V 75AH',
    category: 'Electrical',
    currentStock: 2,
    minThreshold: 8,
    maxCapacity: 25,
    unitCost: 125.00,
    supplier: 'Power Solutions',
    location: 'D-1-1',
    lastUpdated: new Date('2024-01-12')
  },
  {
    id: 'p006',
    partNumber: 'TRANS-FLUID-ATF',
    description: 'Automatic Transmission Fluid',
    category: 'Fluids',
    currentStock: 18,
    minThreshold: 10,
    maxCapacity: 40,
    unitCost: 35.50,
    supplier: 'Fluid Dynamics',
    location: 'E-2-2',
    lastUpdated: new Date('2024-01-15')
  }
];

export const mockTransactions: StockTransaction[] = [
  {
    id: 't001',
    partId: 'p001',
    type: 'CONSUME',
    quantity: 2,
    jobOrderId: 'JO-2024-001',
    mechanic: 'John Smith',
    timestamp: new Date('2024-01-16T10:30:00'),
    performedBy: 'John Smith'
  },
  {
    id: 't002',
    partId: 'p002',
    type: 'RESERVE',
    quantity: 3,
    jobOrderId: 'JO-2024-002',
    timestamp: new Date('2024-01-16T09:15:00'),
    performedBy: 'Sarah Johnson'
  },
  {
    id: 't003',
    partId: 'p005',
    type: 'CONSUME',
    quantity: 1,
    jobOrderId: 'JO-2024-003',
    mechanic: 'Mike Wilson',
    timestamp: new Date('2024-01-16T14:20:00'),
    performedBy: 'Mike Wilson'
  },
  {
    id: 't004',
    partId: 'p004',
    type: 'ADJUST',
    quantity: -2,
    reason: 'Damaged during handling',
    timestamp: new Date('2024-01-15T16:45:00'),
    performedBy: 'Inventory Clerk'
  },
  {
    id: 't005',
    partId: 'p003',
    type: 'RESTOCK',
    quantity: 20,
    timestamp: new Date('2024-01-14T08:00:00'),
    performedBy: 'Inventory Manager'
  }
];

export const mockReservations: Reservation[] = [
  {
    id: 'r001',
    partId: 'p001',
    jobOrderId: 'JO-2024-004',
    quantityReserved: 2,
    quantityConsumed: 0,
    status: 'ACTIVE',
    requestedBy: 'Tom Brown',
    createdAt: new Date('2024-01-16T11:00:00'),
    updatedAt: new Date('2024-01-16T11:00:00')
  },
  {
    id: 'r002',
    partId: 'p002',
    jobOrderId: 'JO-2024-002',
    quantityReserved: 3,
    quantityConsumed: 1,
    status: 'PARTIAL',
    requestedBy: 'Sarah Johnson',
    createdAt: new Date('2024-01-16T09:15:00'),
    updatedAt: new Date('2024-01-16T13:30:00')
  },
  {
    id: 'r003',
    partId: 'p006',
    jobOrderId: 'JO-2024-005',
    quantityReserved: 4,
    quantityConsumed: 4,
    status: 'COMPLETED',
    requestedBy: 'Mike Wilson',
    createdAt: new Date('2024-01-15T14:00:00'),
    updatedAt: new Date('2024-01-15T16:30:00')
  }
];

export const mockAlerts: LowStockAlert[] = [
  {
    id: 'a001',
    partId: 'p002',
    currentStock: 8,
    threshold: 15,
    urgency: 'HIGH',
    createdAt: new Date('2024-01-16T08:00:00'),
    acknowledged: false
  },
  {
    id: 'a002',
    partId: 'p004',
    currentStock: 5,
    threshold: 12,
    urgency: 'HIGH',
    createdAt: new Date('2024-01-15T16:50:00'),
    acknowledged: false
  },
  {
    id: 'a003',
    partId: 'p005',
    currentStock: 2,
    threshold: 8,
    urgency: 'CRITICAL',
    createdAt: new Date('2024-01-16T14:25:00'),
    acknowledged: false
  }
];