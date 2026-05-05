<?php

use App\Http\Controllers\LoginController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LoginController::class, 'show'])->name('login.form');
Route::post('/login', [LoginController::class, 'login'])->name('login.submit');
Route::get('/admin', [LoginController::class, 'adminView'])->name('view.admin');
Route::get('/usuario', [LoginController::class, 'userView'])->name('view.user');
