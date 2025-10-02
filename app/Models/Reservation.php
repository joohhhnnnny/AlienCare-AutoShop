<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasFactory;

    // Use 'reservation_id' as the primary key to match the database schema
    protected $primaryKey = 'reservation_id';

    protected $fillable = [
        'item_id',
        'quantity',
        'status',
        'job_order_number',
        'requested_by',
        'approved_by',
        'requested_date',
        'approved_date',
        'expires_at',
        'notes'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'requested_date' => 'datetime',
        'approved_date' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the inventory item for this reservation.
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class, 'item_id', 'item_id');
    }

    /**
     * Scope for pending reservations.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved reservations.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for expired reservations.
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now())
                    ->whereIn('status', ['pending', 'approved']);
    }

    /**
     * Check if reservation is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast() &&
               in_array($this->status, ['pending', 'approved']);
    }
}
