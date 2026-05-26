<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('123'),
                'is_admin' => true,
            ]
        );
        User::updateOrCreate(
            ['email' => 'user@gmail.com'],
            [
                'name' => 'Usuario',
                'password' => Hash::make('123'),
                'is_admin' => false,
            ]
        );
    }
}
