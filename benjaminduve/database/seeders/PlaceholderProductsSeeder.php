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
            ['name' => 'CHAQUETA 1', 'description' => 'Chaqueta placeholder de corte clasico para pruebas de catalogo.', 'size' => 'M', 'height_cm' => null, 'width_cm' => null, 'depth_cm' => null, 'price' => 39990, 'stock' => 12, 'tone' => '#2f2f2f'],
            ['name' => 'CHAQUETA 2', 'description' => 'Chaqueta placeholder de textura sobria para pruebas de catalogo.', 'size' => 'L', 'height_cm' => null, 'width_cm' => null, 'depth_cm' => null, 'price' => 42990, 'stock' => 10, 'tone' => '#444444'],
            ['name' => 'BOLSO 1', 'description' => 'Bolso placeholder amplio para pruebas de catalogo.', 'size' => '', 'height_cm' => 30, 'width_cm' => 42, 'depth_cm' => 14, 'price' => 28990, 'stock' => 18, 'tone' => '#1f1f1f'],
            ['name' => 'BOLSO 2', 'description' => 'Bolso placeholder compacto para pruebas de catalogo.', 'size' => '', 'height_cm' => 28, 'width_cm' => 38, 'depth_cm' => 12, 'price' => 25990, 'stock' => 16, 'tone' => '#555555'],
            ['name' => 'BOLSO 3', 'description' => 'Bolso placeholder estructurado para pruebas de catalogo.', 'size' => '', 'height_cm' => 34, 'width_cm' => 44, 'depth_cm' => 15, 'price' => 31990, 'stock' => 14, 'tone' => '#333333'],
        ];

        foreach ($products as $item) {
            $measurements = $this->resolveMeasurements($item);

            $product = Product::updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                [
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'size' => $measurements['size'],
                    'height_cm' => $measurements['height_cm'],
                    'width_cm' => $measurements['width_cm'],
                    'depth_cm' => $measurements['depth_cm'],
                    'price' => $item['price'],
                    'stock' => $item['stock'],
                    'is_active' => true,
                ]
            );

            $product->images()->delete();
            foreach ($this->placeholderImages($item) as $index => $image) {
                $product->images()->create([
                    'url' => $image,
                    'alt' => $item['name'] . ' foto ' . ($index + 1),
                    'sort_order' => $index,
                ]);
            }
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

    private function placeholderImages(array $item): array
    {
        return [
            $this->svgDataUri($item['name'], $item['tone'], 'FRONTAL'),
            $this->svgDataUri($item['name'], $item['tone'], 'DETALLE'),
        ];
    }

    private function svgDataUri(string $name, string $tone, string $label): string
    {
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100">
  <rect width="900" height="1100" fill="#151515"/>
  <rect x="90" y="110" width="720" height="880" rx="42" fill="$tone"/>
  <rect x="145" y="165" width="610" height="770" rx="32" fill="none" stroke="#f4f4f4" stroke-width="10" opacity=".28"/>
  <text x="450" y="505" text-anchor="middle" font-family="Arial, sans-serif" font-size="74" font-weight="700" fill="#f4f4f4">$name</text>
  <text x="450" y="590" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" letter-spacing="10" fill="#d7d7d7">$label</text>
</svg>
SVG;

        return 'data:image/svg+xml;utf8,' . rawurlencode($svg);
    }
}
