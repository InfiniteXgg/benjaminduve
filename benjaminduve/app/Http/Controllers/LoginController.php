<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function show()
    {
        return view('welcome');
    }

    public function adminView()
    {
        return view('admin');
    }

    public function userView()
    {
        return view('usuario');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return back()
                ->withErrors(['email' => 'Credenciales invalidas.'])
                ->withInput($request->only('email'));
        }

        if ($user->is_admin) {
            return redirect()->route('view.admin');
        }

        return redirect()->route('view.user');
    }
}
