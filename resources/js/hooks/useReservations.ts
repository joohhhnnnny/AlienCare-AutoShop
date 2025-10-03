/**
 * React hooks for reservation data management
 */

import { PaginatedResponse } from '@/lib/api';
import { NewMultipleReservation, NewReservation, ReservationAction, ReservationFilters, reservationService } from '@/services/reservationService';
import { Reservation } from '@/types/inventory';
import { dispatchReservationUpdate } from '@/utils/inventoryEvents';
import { useCallback, useEffect, useState } from 'react';

// Hook for reservations with pagination and filtering
export function useReservations(initialFilters: ReservationFilters = {}) {
    const [data, setData] = useState<PaginatedResponse<Reservation> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ReservationFilters>(initialFilters);

    const fetchReservations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await reservationService.getReservations(filters);
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch reservations');
            console.error('Error fetching reservations:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    // Set up real-time event listeners for reservation updates
    useEffect(() => {
        const handleReservationUpdate = () => {
            fetchReservations();
        };

        // Listen for reservation update events
        window.addEventListener('reservation-updated', handleReservationUpdate);

        return () => {
            window.removeEventListener('reservation-updated', handleReservationUpdate);
        };
    }, [fetchReservations]);

    const updateFilters = useCallback((newFilters: Partial<ReservationFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const createReservation = useCallback(async (reservation: NewReservation) => {
        try {
            const response = await reservationService.createReservation(reservation);

            // Immediate refresh
            await fetchReservations();

            // Dispatch event for real-time updates
            dispatchReservationUpdate('new', 'created', {
                item_id: reservation.item_id,
                quantity: reservation.quantity,
                job_order_number: reservation.job_order_number
            });

            // Additional refresh after a short delay to ensure consistency
            setTimeout(() => {
                fetchReservations();
            }, 500);

            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create reservation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [fetchReservations]);

    const createMultipleReservations = useCallback(async (reservation: NewMultipleReservation) => {
        try {
            const response = await reservationService.createMultipleReservations(reservation);

            // Immediate refresh
            await fetchReservations();

            // Dispatch event for real-time updates
            dispatchReservationUpdate('multiple', 'created', {
                items: reservation.items,
                job_order_number: reservation.job_order_number
            });

            // Additional refresh after a short delay to ensure consistency
            setTimeout(() => {
                fetchReservations();
            }, 500);

            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create multiple reservations';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [fetchReservations]);

    const approveReservation = useCallback(async (id: number, action: ReservationAction) => {
        try {
            const response = await reservationService.approveReservation(id, action);
            await fetchReservations(); // Refresh data

            // Dispatch event for real-time updates
            dispatchReservationUpdate(id.toString(), 'approved', action);

            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to approve reservation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [fetchReservations]);

    const rejectReservation = useCallback(async (id: number, action: ReservationAction) => {
        try {
            const response = await reservationService.rejectReservation(id, action);
            await fetchReservations(); // Refresh data

            // Dispatch event for real-time updates
            dispatchReservationUpdate(id.toString(), 'rejected', action);

            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to reject reservation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [fetchReservations]);

    const completeReservation = useCallback(async (id: number, action: ReservationAction) => {
        try {
            const response = await reservationService.completeReservation(id, action);
            await fetchReservations(); // Refresh data

            // Dispatch event for real-time updates
            dispatchReservationUpdate(id.toString(), 'completed', action);

            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to complete reservation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [fetchReservations]);

    const cancelReservation = useCallback(async (id: number, action: ReservationAction) => {
        try {
            const response = await reservationService.cancelReservation(id, action);
            await fetchReservations(); // Refresh data

            // Dispatch event for real-time updates
            dispatchReservationUpdate(id.toString(), 'cancelled', action);

            return { success: true, data: response.data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel reservation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [fetchReservations]);

    return {
        data,
        loading,
        error,
        filters,
        updateFilters,
        refresh: fetchReservations,
        createReservation,
        createMultipleReservations,
        approveReservation,
        rejectReservation,
        completeReservation,
        cancelReservation,
        clearError: () => setError(null),
    };
}

// Hook for single reservation
export function useReservation(id: number | null) {
    const [data, setData] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReservation = useCallback(async () => {
        if (!id) {
            setData(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await reservationService.getReservation(id);
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch reservation');
            console.error('Error fetching reservation:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchReservation();
    }, [fetchReservation]);

    return {
        data,
        loading,
        error,
        refresh: fetchReservation,
        clearError: () => setError(null),
    };
}

// Hook for active reservations summary
export function useReservationsSummary() {
    const [data, setData] = useState<{
        total_active: number;
        pending_approvals: number;
        expiring_soon: number;
        by_status: Record<string, number>;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await reservationService.getActiveReservationsSummary();
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch summary');
            console.error('Error fetching summary:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return {
        data,
        loading,
        error,
        refresh: fetchSummary,
        clearError: () => setError(null),
    };
}
