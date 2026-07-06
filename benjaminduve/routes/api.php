<?php

use App\Http\Controllers\Api\AdminApiController;
use App\Http\Controllers\Api\StoreApiController;
use Illuminate\Support\Facades\Route;

Route::get('/products', [StoreApiController::class, 'products']);
Route::get('/products/{slug}', [StoreApiController::class, 'productShow']);

Route::post('/orders', [StoreApiController::class, 'createOrder'])->middleware('throttle:60,1');
Route::post('/orders/{order}/payment', [StoreApiController::class, 'submitPayment'])->middleware('throttle:60,1');
Route::post('/orders/{order}/cancel', [StoreApiController::class, 'cancelOrder'])->middleware('throttle:60,1');

Route::middleware('throttle:40,1')->group(function () {
    Route::get('/orders/{order}/summary', [StoreApiController::class, 'orderSummary']);
});

Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminApiController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AdminApiController::class, 'me']);
        Route::post('/logout', [AdminApiController::class, 'logout']);
        Route::get('/summary', [AdminApiController::class, 'summary']);

        Route::get('/products', [AdminApiController::class, 'products']);
        Route::post('/products', [AdminApiController::class, 'storeProduct']);
        Route::put('/products/{id}', [AdminApiController::class, 'updateProduct']);
        Route::delete('/products/{id}', [AdminApiController::class, 'deleteProduct']);
        Route::delete('/products/{id}/images/{image}', [AdminApiController::class, 'deleteProductImage']);

        Route::get('/orders', [AdminApiController::class, 'orders']);
        Route::post('/orders/{order}/accept', [AdminApiController::class, 'acceptOrder']);
        Route::post('/orders/{order}/reject', [AdminApiController::class, 'rejectOrder']);
        Route::delete('/orders/{order}', [AdminApiController::class, 'deleteOrder']);
    });
});
