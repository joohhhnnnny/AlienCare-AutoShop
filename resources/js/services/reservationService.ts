/**
 * Reservation API Service
 * Handles all reservation-related API calls to Laravel backend
 */

import { api, ApiResponse, PaginatedResponse } from '@/lib/api';
import { Reservation } from '@/types/inventory';

export interface ReservationFilters {
    status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    job_order?: string;
    item_id?: string;
    per_page?: number;
    page?: number;
}

export interface NewReservation {
    item_id: string;
    quantity: number;
    job_order_number: string;
    requested_by: string;
    expires_at?: string;
    notes?: string;
}

export interface ReservationAction {
    approved_by?: string;
    completed_by?: string;
    cancelled_by?: string;
    actual_quantity?: number;
    reason?: string;
    notes?: string;
}

class ReservationService {
    // Get all reservations with pagination and filters
    async getReservations(filters: ReservationFilters = {}): Promise<PaginatedResponse<Reservation>> {
        const params: Record<string, string | number> = {};

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
                params[key] = String(value);
            }
        });

        return api.get<PaginatedResponse<Reservation>>('/reservations', params);
    }

    // Get single reservation
    async getReservation(id: number): Promise<ApiResponse<Reservation>> {
        return api.get<ApiResponse<Reservation>>(`/reservations/${id}`);
    }

    // Create new reservation
    async createReservation(reservation: NewReservation): Promise<ApiResponse<Reservation>> {
        return api.post<ApiResponse<Reservation>>('/reservations/reserve', reservation);
    }

    // Approve reservation
    async approveReservation(id: number, action: ReservationAction): Promise<ApiResponse<Reservation>> {
        return api.put<ApiResponse<Reservation>>(`/reservations/${id}/approve`, action);
    }

    // Reject reservation
    async rejectReservation(id: number, action: ReservationAction): Promise<ApiResponse<Reservation>> {
        return api.put<ApiResponse<Reservation>>(`/reservations/${id}/reject`, action);
    }

    // Complete reservation
    async completeReservation(id: number, action: ReservationAction): Promise<ApiResponse<Reservation>> {
        return api.put<ApiResponse<Reservation>>(`/reservations/${id}/complete`, action);
    }

    // Cancel reservation
    async cancelReservation(id: number, action: ReservationAction): Promise<ApiResponse<Reservation>> {
        return api.put<ApiResponse<Reservation>>(`/reservations/${id}/cancel`, action);
    }

    // Get reservations by job order
    async getReservationsByJobOrder(jobOrderNumber: string): Promise<ApiResponse<Reservation[]>> {
        return api.get<ApiResponse<Reservation[]>>('/reservations', { job_order: jobOrderNumber });
    }

    // Get active reservations summary
    async getActiveReservationsSummary(): Promise<ApiResponse<{
        total_active: number;
        pending_approvals: number;
        expiring_soon: number;
        by_status: Record<string, number>;
    }>> {
        return api.get<ApiResponse<{
            total_active: number;
            pending_approvals: number;
            expiring_soon: number;
            by_status: Record<string, number>;
        }>>('/reservations/summary');
    }
}

export const reservationService = new ReservationService();
