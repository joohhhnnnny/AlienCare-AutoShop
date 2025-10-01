<?php

namespace App\Listeners;

use App\Events\StockUpdated;
use App\Models\Archive;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class LogStockTransaction implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(StockUpdated $event): void
    {
        try {
            Archive::create([
                'entity_type' => 'inventory',
                'entity_id' => $event->inventory->inventory_id,
                'action' => $event->action,
                'old_data' => [
                    'previous_stock' => $event->inventory->getOriginal('stock') ?? 0
                ],
                'new_data' => [
                    'current_stock' => $event->inventory->stock,
                    'item_id' => $event->inventory->item_id,
                    'item_name' => $event->inventory->item_name,
                    'category' => $event->inventory->category
                ],
                'user_id' => auth()->id() ?? null,
                'notes' => "Stock {$event->action} operation",
                'archived_date' => $event->timestamp
            ]);

            Log::info("Stock updated for item {$event->inventory->item_id}", [
                'action' => $event->action,
                'new_stock' => $event->inventory->stock,
                'timestamp' => $event->timestamp
            ]);

            // Check for low stock and fire alert if needed
            if ($event->inventory->isLowStock()) {
                Log::info("Low stock detected for {$event->inventory->item_id}, firing alert event");
                event(new \App\Events\LowStockAlert($event->inventory));
            }

        } catch (\Exception $e) {
            Log::error("Failed to log stock transaction: " . $e->getMessage(), [
                'inventory_id' => $event->inventory->inventory_id,
                'action' => $event->action
            ]);
        }
    }
}
