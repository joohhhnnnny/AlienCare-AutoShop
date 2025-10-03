<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventories';
    // Using default 'id' primary key instead of 'inventory_id'

    protected $fillable = [
        'item_id',
        'item_name',
        'description',
        'category',
        'stock',
        'reorder_level',
        'unit_price',
        'supplier',
        'location',
        'status'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'stock' => 'integer',
        'reorder_level' => 'integer',
    ];

    /**
     * Get the reservations for this inventory item.
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'item_id', 'item_id');
    }

    /**
     * Get the stock transactions for this inventory item.
     */
    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class, 'item_id', 'item_id');
    }

    /**
     * Get the archive entries for this inventory item.
     */
    public function archives(): HasMany
    {
        return $this->hasMany(Archive::class, 'entity_id', 'id')
                    ->where('entity_type', 'inventory');
    }

    /**
     * Check if stock is below reorder level.
     */
    public function isLowStock(): bool
    {
        return $this->stock <= $this->reorder_level;
    }

    /**
     * Get stock status for a given quantity request.
     */
    public function getStockStatus(int $requestedQuantity): string
    {
        if ($this->stock >= $requestedQuantity) {
            return 'Available';
        } elseif ($this->stock > 0) {
            return 'Partial';
        } else {
            return 'Backorder';
        }
    }

    /**
     * Get available stock (total stock minus reserved).
     */
    public function getAvailableStockAttribute(): int
    {
        $reservedStock = $this->reservations()
            ->whereIn('status', ['approved'])
            ->sum('quantity');

        return max(0, $this->stock - $reservedStock);
    }

    /**
     * Get available stock for a specific reservation action.
     * This excludes the current reservation from the calculation to avoid double-counting.
     */
    public function getAvailableStockForReservation(?int $excludeReservationId = null): int
    {
        $query = $this->reservations()->whereIn('status', ['approved']);

        if ($excludeReservationId) {
            $query->where('reservation_id', '!=', $excludeReservationId);
        }

        $reservedStock = $query->sum('quantity');

        return max(0, $this->stock - $reservedStock);
    }

    /**
     * Scope for low stock items.
     */
    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock <= reorder_level');
    }

    /**
     * Scope for active items.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
