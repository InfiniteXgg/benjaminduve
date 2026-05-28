<?php

namespace App\Services;

use App\Mail\LowStockAlertMail;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class StockAlertService
{
    public function threshold(): int
    {
        return max(0, (int) config('inventory.low_stock_threshold', 5));
    }

    public function isLowStock(Product $product): bool
    {
        if (!$product->is_active) {
            return false;
        }

        return (int) $product->stock <= $this->threshold();
    }

    public function lowStockProducts(): Collection
    {
        return Product::query()
            ->where('is_active', true)
            ->where('stock', '<=', $this->threshold())
            ->orderBy('stock')
            ->orderBy('name')
            ->get();
    }

    public function stockStatus(Product $product): ?string
    {
        if (!$this->isLowStock($product)) {
            return null;
        }

        return (int) $product->stock === 0 ? 'out_of_stock' : 'low_stock';
    }

    public function notifyAdminsIfNeeded(Product $product, ?int $previousStock = null): void
    {
        $product->refresh();

        if (!$this->isLowStock($product)) {
            Cache::forget($this->cacheKey($product->id));

            return;
        }

        if ($previousStock !== null && (int) $product->stock >= $previousStock) {
            return;
        }

        $cacheKey = $this->cacheKey($product->id);
        $lastNotifiedStock = Cache::get($cacheKey);

        if ($lastNotifiedStock !== null && (int) $product->stock >= (int) $lastNotifiedStock) {
            return;
        }

        $adminEmails = User::query()
            ->where('is_admin', true)
            ->pluck('email')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($adminEmails === []) {
            return;
        }

        Mail::to($adminEmails)->send(new LowStockAlertMail($product, $this->threshold()));

        Cache::put($cacheKey, (int) $product->stock, now()->addDays(30));
    }

    public function productAlertPayload(Product $product): array
    {
        $status = $this->stockStatus($product);

        return [
            'is_low_stock' => $status !== null,
            'stock_status' => $status,
            'stock_status_label' => match ($status) {
                'out_of_stock' => 'Agotado',
                'low_stock' => 'Stock bajo',
                default => null,
            },
        ];
    }

    private function cacheKey(int $productId): string
    {
        return "stock_low_alert:{$productId}";
    }
}
