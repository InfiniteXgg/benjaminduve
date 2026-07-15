<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroCarouselSlide extends Model
{
    protected $fillable = [
        'eyebrow',
        'title',
        'cta',
        'image',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
