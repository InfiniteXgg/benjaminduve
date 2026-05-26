<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PlaceholderProductsSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $products = [
            ['name' => 'CHAQUETA 1', 'size' => 'M', 'height_cm' => null, 'width_cm' => null, 'depth_cm' => null, 'price' => 39990, 'stock' => 12],
            ['name' => 'CHAQUETA 2', 'size' => 'L', 'height_cm' => null, 'width_cm' => null, 'depth_cm' => null, 'price' => 42990, 'stock' => 10],
            ['name' => 'BOLSO 1', 'size' => '', 'height_cm' => 30, 'width_cm' => 42, 'depth_cm' => 14, 'price' => 28990, 'stock' => 18],
            ['name' => 'BOLSO 2', 'size' => '', 'height_cm' => 28, 'width_cm' => 38, 'depth_cm' => 12, 'price' => 25990, 'stock' => 16],
            ['name' => 'BOLSO 3', 'size' => '', 'height_cm' => 34, 'width_cm' => 44, 'depth_cm' => 15, 'price' => 31990, 'stock' => 14],
        ];

        foreach ($products as $item) {
            $measurements = $this->resolveMeasurements($item);

            Product::updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'name' => $item['name'],
                    'description' => 'Producto placeholder para pruebas de catalogo.',
                    'size' => $measurements['size'],
                    'height_cm' => $measurements['height_cm'],
                    'width_cm' => $measurements['width_cm'],
                    'depth_cm' => $measurements['depth_cm'],
                    'price' => $item['price'],
                    'stock' => $item['stock'],
                    'is_active' => true,
                ]
            );
        }
    }

    private function normalizeSize(?string $size): string
    {
        $size = trim((string) $size);

        return $size === '' ? ' ' : $size;
    }

    private function resolveMeasurements(array $item): array
    {
        $size = $this->normalizeSize($item['size'] ?? null);
        $hasSize = trim($size) !== '';

        return [
            'size' => $size,
            'height_cm' => $hasSize ? null : ($item['height_cm'] ?? null),
            'width_cm' => $hasSize ? null : ($item['width_cm'] ?? null),
            'depth_cm' => $hasSize ? null : ($item['depth_cm'] ?? null),
        ];
    }
}
