/**
 * Event dispatcher for real-time inventory updates
 * This utility provides a simple way to dispatch and listen for inventory events
 * across the application for real-time updates
 */

type InventoryEventType =
  | 'inventory-updated'
  | 'reservation-updated'
  | 'stock-transaction'
  | 'audit-log-updated';

interface InventoryEventData {
  type: InventoryEventType;
  data?: any;
  timestamp: Date;
}

class InventoryEventDispatcher {
  // Dispatch an inventory event
  dispatch(type: InventoryEventType, data?: any) {
    const event = new CustomEvent(type, {
      detail: {
        type,
        data,
        timestamp: new Date()
      }
    });

    window.dispatchEvent(event);

    // Also dispatch a generic inventory update event
    if (type !== 'audit-log-updated') {
      const auditEvent = new CustomEvent('audit-log-updated', {
        detail: {
          type: 'audit-log-updated',
          data: { source: type, ...data },
          timestamp: new Date()
        }
      });

      // Slight delay to ensure the main operation has completed
      setTimeout(() => {
        window.dispatchEvent(auditEvent);
      }, 500);
    }
  }

  // Listen for inventory events
  listen(type: InventoryEventType, callback: (data: InventoryEventData) => void) {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener(type, handler as EventListener);

    // Return cleanup function
    return () => {
      window.removeEventListener(type, handler as EventListener);
    };
  }

  // Listen for multiple event types
  listenMultiple(types: InventoryEventType[], callback: (data: InventoryEventData) => void) {
    const cleanupFunctions = types.map(type => this.listen(type, callback));

    // Return cleanup function that removes all listeners
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }
}

export const inventoryEvents = new InventoryEventDispatcher();

// Convenience functions for common events
export const dispatchInventoryUpdate = (itemId: string, operation: string, data?: any) => {
  inventoryEvents.dispatch('inventory-updated', { itemId, operation, ...data });
};

export const dispatchReservationUpdate = (reservationId: string, status: string, data?: any) => {
  inventoryEvents.dispatch('reservation-updated', { reservationId, status, ...data });
};

export const dispatchStockTransaction = (itemId: string, transactionType: string, quantity: number, data?: any) => {
  inventoryEvents.dispatch('stock-transaction', { itemId, transactionType, quantity, ...data });
};
