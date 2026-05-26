<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('q')->toString();

        $products = Product::query()
            ->where('is_active', true)
            ->when($search, function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', '%' . $search . '%')
                        ->orWhere('description', 'like', '%' . $search . '%');
                });
            })
            ->latest()
            ->paginate(9)
            ->withQueryString();

        return view('home.index', [
            'products' => $products,
            'search' => $search,
        ]);
    }

    public function show(string $slug)
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            return redirect()->route('home')
                ->withErrors(['quantity' => 'Ese producto no esta disponible en este momento.']);
        }

        return view('home.show', [
            'product' => $product,
        ]);
    }
}
