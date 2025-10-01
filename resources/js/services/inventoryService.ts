/**
 * Inventory API Service
 * Handles all inventory-related API calls to Laravel backend
 */

import { api, ApiResponse, PaginatedResponse } from '@/lib/api';
import { DashboardAnalytics, InventoryItem, StockTransaction } from '@/types/inventory';

export interface InventoryFilters {
    search?: string;
    category?: string;
    low_stock?: boolean;
    per_page?: number;
    page?: number;
}

export interface StockOperation {
    item_id: string;
    quantity: number;
    reference_number?: string;
    notes?: string;
}

export interface NewInventoryItem {
    item_id: string;
    item_name: string;
    description: string;
    category: string;
    stock: number;
    reorder_level: number;
    unit_price: number;
    supplier: string;
    location: string;
}

class InventoryService {
    // Get all inventory items with pagination and filters
    async getInventoryItems(filters: InventoryFilters = {}): Promise<ApiResponse<PaginatedResponse<InventoryItem>>> {
        const params: Record<string, string | number> = {};

        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.low_stock) params.low_stock = 'true';
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.page) params.page = filters.page;

        return api.get<ApiResponse<PaginatedResponse<InventoryItem>>>('/inventory', params);
    }

    // Get single inventory item
    async getInventoryItem(itemId: string): Promise<ApiResponse<InventoryItem>> {
        return api.get<ApiResponse<InventoryItem>>(`/inventory/${itemId}`);
    }

    // Create new inventory item
    async createInventoryItem(item: NewInventoryItem): Promise<ApiResponse<InventoryItem>> {
        return api.post<ApiResponse<InventoryItem>>('/inventory', item);
    }

    // Update inventory item
    async updateInventoryItem(itemId: string, item: Partial<NewInventoryItem>): Promise<ApiResponse<InventoryItem>> {
        return api.put<ApiResponse<InventoryItem>>(`/inventory/${itemId}`, item);
    }

    // Delete inventory item
    async deleteInventoryItem(itemId: string): Promise<ApiResponse<{ message: string }>> {
        return api.delete<ApiResponse<{ message: string }>>(`/inventory/${itemId}`);
    }

    // Check stock status for quantity
    async checkStockStatus(itemId: string, quantity: number): Promise<ApiResponse<{ available: boolean; current_stock: number }>> {
        return api.get<ApiResponse<{ available: boolean; current_stock: number }>>(
            `/inventory/${itemId}/stock-status`,
            { quantity: quantity.toString() }
        );
    }

    // Add stock (procurement)
    async addStock(operation: StockOperation): Promise<ApiResponse<{ message: string; transaction: StockTransaction }>> {
        return api.post<ApiResponse<{ message: string; transaction: StockTransaction }>>('/inventory/add-stock', operation);
    }

    // Deduct stock (sales)
    async deductStock(operation: StockOperation): Promise<ApiResponse<{ message: string; transaction: StockTransaction }>> {
        return api.post<ApiResponse<{ message: string; transaction: StockTransaction }>>('/inventory/deduct-stock', operation);
    }

    // Log return/damage
    async logReturnDamage(operation: StockOperation & { type: 'return' | 'damage' }): Promise<ApiResponse<{ message: string; transaction: StockTransaction }>> {
        return api.post<ApiResponse<{ message: string; transaction: StockTransaction }>>('/inventory/log-return-damage', operation);
    }

    // Get low stock alerts
    async getLowStockAlerts(): Promise<ApiResponse<InventoryItem[]>> {
        return api.get<ApiResponse<InventoryItem[]>>('/inventory/alerts/low-stock');
    }

    // Get dashboard analytics
    async getDashboardAnalytics(): Promise<ApiResponse<DashboardAnalytics>> {
        return api.get<ApiResponse<DashboardAnalytics>>('/reports/analytics/dashboard');
    }

    // Get stock transactions with filters
    async getStockTransactions(filters: {
        item_id?: string;
        transaction_type?: string;
        start_date?: string;
        end_date?: string;
        per_page?: number;
        page?: number;
    } = {}): Promise<PaginatedResponse<StockTransaction>> {
        const params: Record<string, string | number> = {};

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                params[key] = String(value);
            }
        });

        return api.get<PaginatedResponse<StockTransaction>>('/transactions', params);
    }
}

export const inventoryService = new InventoryService();
