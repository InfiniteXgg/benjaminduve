<?php

namespace Database\Seeders;

use App\Models\HeroCarouselSlide;
use Illuminate\Database\Seeder;

class HeroCarouselSlidesSeeder extends Seeder
{
    public function run(): void
    {
        $slides = [
            [
                'eyebrow' => 'NUEVA COLECCION',
                'title' => 'Invierno 2026',
                'cta' => 'Ver catalogo',
                'image' => '/bolsonegro.jpeg',
                'sort_order' => 0,
            ],
            [
                'eyebrow' => 'HECHO A MANO',
                'title' => 'Bolsos & Mochilas',
                'cta' => 'Descubrir',
                'image' => '/bolsomulti.jpeg',
                'sort_order' => 1,
            ],
            [
                'eyebrow' => 'EDICION LIMITADA',
                'title' => 'Calidad Artesanal',
                'cta' => 'Explorar',
                'image' => '/bolsorosa.jpeg',
                'sort_order' => 2,
            ],
        ];

        foreach ($slides as $slide) {
            HeroCarouselSlide::updateOrCreate(
                ['sort_order' => $slide['sort_order']],
                array_merge($slide, ['is_active' => true])
            );
        }
    }
}
