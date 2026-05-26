<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'customer_name',
        'customer_email',
        'billing_document_type',
        'billing_tax_id',
        'billing_address',
        'billing_city',
        'billing_contact_phone',
        'billing_notes',
        'public_token',
        'status',
        'payment_status',
        'payment_method',
        'admin_review_status',
        'payment_reference',
        'payment_meta',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'payment_meta' => 'array',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
