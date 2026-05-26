<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->away((string) config('app.frontend_url', 'http://localhost:5173'));
});

Route::fallback(function () {
    return response()->json([
        'message' => 'Ruta web no disponible. Usa el frontend React en http://localhost:5173.',
    ], 404);
});
