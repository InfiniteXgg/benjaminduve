<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeroCarouselSlide extends Model
{
    protected $fillable = [
        'eyebrow',
        'title',
        'cta',
        'image',
        'image_width',
        'image_height',
        'crop_focus_x',
        'crop_focus_y',
        'crop_zoom',
        'product_id',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'image_width' => 'integer',
            'image_height' => 'integer',
            'crop_focus_x' => 'float',
            'crop_focus_y' => 'float',
            'crop_zoom' => 'float',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
