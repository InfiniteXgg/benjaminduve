<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_email_and_password_with_current_password(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('old-secret'),
            'is_admin' => true,
        ]);

        $token = $admin->createToken('admin-spa')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/admin/account', [
            'email' => 'nuevo@test.com',
            'current_password' => 'old-secret',
            'password' => 'new-secret',
            'password_confirmation' => 'new-secret',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.email', 'nuevo@test.com');

        $admin->refresh();

        $this->assertSame('nuevo@test.com', $admin->email);
        $this->assertTrue(Hash::check('new-secret', $admin->password));
    }

    public function test_admin_account_update_requires_current_password(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => Hash::make('old-secret'),
            'is_admin' => true,
        ]);

        $token = $admin->createToken('admin-spa')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/admin/account', [
            'email' => 'nuevo@test.com',
            'current_password' => 'wrong-secret',
        ]);

        $response->assertStatus(422);

        $this->assertSame('admin@test.com', $admin->refresh()->email);
    }
}
