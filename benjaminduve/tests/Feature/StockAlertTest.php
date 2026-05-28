<?php

namespace Tests\Feature;

use App\Mail\LowStockAlertMail;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StockAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_summary_includes_low_stock_products(): void
    {
        Product::query()->create([
            'name' => 'Producto critico',
            'slug' => 'producto-critico',
            'description' => 'Test',
            'price' => 1000,
            'stock' => 2,
            'is_active' => true,
        ]);

        Product::query()->create([
            'name' => 'Producto normal',
            'slug' => 'producto-normal',
            'description' => 'Test',
            'price' => 1000,
            'stock' => 20,
            'is_active' => true,
        ]);

        $admin = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('secret'),
            'is_admin' => true,
        ]);

        $token = $admin->createToken('admin-spa')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/admin/summary');

        $response
            ->assertOk()
            ->assertJsonPath('low_stock_count', 1)
            ->assertJsonPath('low_stock_products.0.slug', 'producto-critico')
            ->assertJsonPath('low_stock_products.0.stock_status', 'low_stock');
    }

    public function test_stock_alert_service_sends_email_when_stock_becomes_low(): void
    {
        Mail::fake();
        Cache::flush();

        User::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('secret'),
            'is_admin' => true,
        ]);

        $product = Product::query()->create([
            'name' => 'Chaqueta alerta',
            'slug' => 'chaqueta-alerta',
            'description' => 'Test',
            'price' => 1000,
            'stock' => 4,
            'is_active' => true,
        ]);

        app(\App\Services\StockAlertService::class)->notifyAdminsIfNeeded($product, 6);

        Mail::assertSent(LowStockAlertMail::class, function (LowStockAlertMail $mail) {
            return $mail->product->slug === 'chaqueta-alerta'
                && (int) $mail->product->stock === 4;
        });
    }
}
