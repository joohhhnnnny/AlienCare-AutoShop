/**
 * React hooks for inventory data management
 * Provides reactive data fetching with loading states and error handling
 */

import { ApiResponse, PaginatedResponse } from '@/lib/api';
import { InventoryFilters, inventoryService, NewInventoryItem, StockOperation } from '@/services/inventoryService';
import { DashboardAnalytics, InventoryItem, StockTransaction } from '@/types/inventory';
import { useCallback, useEffect, useState } from 'react';

// Hook for inventory items with pagination and filtering
export function useInventoryItems(initialFilters: InventoryFilters = {}) {
    const [data, setData] = useState<ApiResponse<PaginatedResponse<InventoryItem>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<InventoryFilters>(initialFilters);

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryService.getInventoryItems(filters);
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const updateFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const addStock = useCallback(async (operation: StockOperation) => {
        try {
            await inventoryService.addStock(operation);
            await fetchInventory(); // Refresh data
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add stock');
            return false;
        }
    }, [fetchInventory]);

    const deductStock = useCallback(async (operation: StockOperation) => {
        try {
            await inventoryService.deductStock(operation);
            await fetchInventory(); // Refresh data
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to deduct stock');
            return false;
        }
    }, [fetchInventory]);

    const createItem = useCallback(async (item: NewInventoryItem) => {
        try {
            await inventoryService.createInventoryItem(item);
            await fetchInventory(); // Refresh data
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create item');
            return false;
        }
    }, [fetchInventory]);

    return {
        data,
        loading,
        error,
        filters,
        updateFilters,
        refresh: fetchInventory,
        addStock,
        deductStock,
        createItem,
        clearError: () => setError(null),
    };
}

// Hook for single inventory item
export function useInventoryItem(itemId: string | null) {
    const [data, setData] = useState<InventoryItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchItem = useCallback(async () => {
        if (!itemId) {
            setData(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await inventoryService.getInventoryItem(itemId);
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch item');
            console.error('Error fetching item:', err);
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    return {
        data,
        loading,
        error,
        refresh: fetchItem,
        clearError: () => setError(null),
    };
}

// Hook for low stock alerts
export function useLowStockAlerts() {
    const [data, setData] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryService.getLowStockAlerts();
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    return {
        data,
        loading,
        error,
        refresh: fetchAlerts,
        clearError: () => setError(null),
    };
}

// Hook for dashboard analytics
export function useDashboardAnalytics() {
    const [data, setData] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryService.getDashboardAnalytics();
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return {
        data,
        loading,
        error,
        refresh: fetchAnalytics,
        clearError: () => setError(null),
    };
}

// Hook for stock transactions
export function useStockTransactions(filters: {
    item_id?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
    page?: number;
} = {}) {
    const [data, setData] = useState<PaginatedResponse<StockTransaction> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryService.getStockTransactions(filters);
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return {
        data,
        loading,
        error,
        refresh: fetchTransactions,
        clearError: () => setError(null),
    };
}

// Hook for stock status check
export function useStockCheck() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkStock = useCallback(async (itemId: string, quantity: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await inventoryService.checkStockStatus(itemId, quantity);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to check stock');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        checkStock,
        loading,
        error,
        clearError: () => setError(null),
    };
}
