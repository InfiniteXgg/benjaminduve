<?php

namespace App\Providers;

use App\Contracts\PaymentGatewayInterface;
use App\Services\PlaceholderPaymentGateway;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, PlaceholderPaymentGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::composer('*', function ($view) {
            $cart = session('cart', []);

            $view->with('cartDistinctCount', count($cart));
        });
    }
}
