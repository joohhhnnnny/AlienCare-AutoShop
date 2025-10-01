<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/test-api', function () {
    return view('api-test');
})->name('test-api');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/inventory', function () {
        return Inertia::render('Inventory');
    })->name('inventory');

    Route::get('/api-test', function () {
        return Inertia::render('ApiTest');
    })->name('api-test');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
