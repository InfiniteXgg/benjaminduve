<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminApiController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', $credentials['email'])->first();

        if (!$user || !$user->is_admin || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciales invalidas o acceso no autorizado.',
            ], 401);
        }

        $token = $user->createToken('admin-spa')->plainTextToken;

        return response()->json([
            'message' => 'Sesion iniciada correctamente.',
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesion cerrada correctamente.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->requireAdmin($request);
        if (!$user) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return response()->json([
            'user' => $this->userPayload($user),
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return response()->json([
            'product_count' => Product::count(),
            'active_product_count' => Product::where('is_active', true)->count(),
            'order_count' => Order::count(),
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $search = trim((string) $request->query('q', ''));

        $query = Product::query();
        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhere('size', 'like', '%' . $search . '%');
            });
        }

        $products = $query->latest()->paginate(12);

        return response()->json([
            'data' => $products->map(fn (Product $product) => $this->productPayload($product))->values(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'size' => ['nullable', 'string', 'max:120'],
            'height_cm' => ['nullable', 'numeric', 'min:0'],
            'width_cm' => ['nullable', 'numeric', 'min:0'],
            'depth_cm' => ['nullable', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $measurements = $this->resolveMeasurements($data);

        $product = Product::create([
            'name' => $data['name'],
            'slug' => $this->buildUniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'size' => $measurements['size'],
            'height_cm' => $measurements['height_cm'],
            'width_cm' => $measurements['width_cm'],
            'depth_cm' => $measurements['depth_cm'],
            'price' => $data['price'],
            'stock' => $data['stock'],
            'is_active' => (bool) ($data['is_active'] ?? false),
        ]);

        return response()->json([
            'message' => 'Producto creado correctamente.',
            'data' => $this->productPayload($product),
        ], 201);
    }

    public function updateProduct(Request $request, Product $product): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'size' => ['nullable', 'string', 'max:120'],
            'height_cm' => ['nullable', 'numeric', 'min:0'],
            'width_cm' => ['nullable', 'numeric', 'min:0'],
            'depth_cm' => ['nullable', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product->id),
            ],
        ]);

        $measurements = $this->resolveMeasurements($data);

        $product->update([
            'name' => $data['name'],
            'slug' => Str::slug($data['slug']),
            'description' => $data['description'] ?? null,
            'size' => $measurements['size'],
            'height_cm' => $measurements['height_cm'],
            'width_cm' => $measurements['width_cm'],
            'depth_cm' => $measurements['depth_cm'],
            'price' => $data['price'],
            'stock' => $data['stock'],
            'is_active' => (bool) ($data['is_active'] ?? false),
        ]);

        return response()->json([
            'message' => 'Producto actualizado.',
            'data' => $this->productPayload($product->fresh()),
        ]);
    }

    public function deleteProduct(Request $request, Product $product): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $product->delete();

        return response()->json([
            'message' => 'Producto eliminado.',
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $search = trim((string) $request->query('q', ''));
        $dateFrom = (string) $request->query('date_from', '');
        $dateTo = (string) $request->query('date_to', '');

        $query = Order::query()->withCount('items');

        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('customer_name', 'like', '%' . $search . '%')
                    ->orWhere('customer_email', 'like', '%' . $search . '%')
                    ->orWhere('status', 'like', '%' . $search . '%')
                    ->orWhere('payment_status', 'like', '%' . $search . '%')
                    ->orWhere('payment_method', 'like', '%' . $search . '%')
                    ->orWhere('admin_review_status', 'like', '%' . $search . '%');
                if (ctype_digit($search)) {
                    $subQuery->orWhere('id', (int) $search);
                }
            });
        }

        if ($dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $orders = $query->latest()->paginate(12);

        $decorated = $orders->getCollection()->map(function (Order $order) {
            return $this->orderPayload($order);
        })->values();

        return response()->json([
            'data' => $decorated,
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function acceptOrder(Request $request, Order $order): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($order->admin_review_status !== 'pending') {
            return response()->json(['message' => 'Este pedido ya fue revisado.'], 422);
        }
        if (!in_array($order->payment_status, ['prototype_submitted', 'prototype_pending'], true)) {
            return response()->json(['message' => 'Este pedido aun no tiene pago enviado por el cliente.'], 422);
        }

        $order->update([
            'status' => 'paid',
            'payment_status' => 'prototype_paid',
            'admin_review_status' => 'accepted',
        ]);

        return response()->json([
            'message' => 'Pedido aceptado por administracion.',
            'data' => $this->orderPayload($order->fresh()),
        ]);
    }

    public function rejectOrder(Request $request, Order $order): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($order->admin_review_status !== 'pending') {
            return response()->json(['message' => 'Este pedido ya fue revisado.'], 422);
        }
        if (!in_array($order->payment_status, ['prototype_submitted', 'prototype_pending'], true)) {
            return response()->json(['message' => 'Este pedido aun no tiene pago enviado por el cliente.'], 422);
        }

        DB::transaction(function () use ($order): void {
            $order->load('items.product');

            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock', $item->quantity);
                }
            }

            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'prototype_rejected',
                'admin_review_status' => 'rejected',
            ]);
        });

        return response()->json([
            'message' => 'Pedido rechazado por administracion.',
            'data' => $this->orderPayload($order->fresh()),
        ]);
    }

    private function requireAdmin(Request $request): ?User
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user || !$user->is_admin) {
            return null;
        }

        return $user;
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_admin' => (bool) $user->is_admin,
        ];
    }

    private function productPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'description' => $product->description,
            'size' => $product->size,
            'height_cm' => $product->height_cm,
            'width_cm' => $product->width_cm,
            'depth_cm' => $product->depth_cm,
            'price' => (float) $product->price,
            'stock' => (int) $product->stock,
            'is_active' => (bool) $product->is_active,
        ];
    }

    private function orderPayload(Order $order): array
    {
        return [
            'id' => $order->id,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'status' => $order->status,
            'status_label' => $this->orderStatusLabel((string) $order->status),
            'payment_status' => $order->payment_status,
            'payment_status_label' => $this->paymentStatusLabel((string) $order->payment_status),
            'payment_method' => $order->payment_method,
            'payment_method_label' => $this->paymentMethodLabel($order->payment_method),
            'admin_review_status' => $order->admin_review_status,
            'review_status_label' => $this->reviewStatusLabel((string) $order->admin_review_status),
            'total' => (float) $order->total,
            'items_count' => (int) ($order->items_count ?? 0),
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }

    private function buildUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function normalizeSize(?string $size): string
    {
        $size = trim((string) $size);

        return $size === '' ? ' ' : $size;
    }

    private function resolveMeasurements(array $data): array
    {
        $size = $this->normalizeSize($data['size'] ?? null);
        $hasSize = trim($size) !== '';

        return [
            'size' => $size,
            'height_cm' => $hasSize ? null : ($data['height_cm'] ?? null),
            'width_cm' => $hasSize ? null : ($data['width_cm'] ?? null),
            'depth_cm' => $hasSize ? null : ($data['depth_cm'] ?? null),
        ];
    }

    private function orderStatusLabel(string $status): string
    {
        return match ($status) {
            'pending' => 'Pendiente',
            'paid' => 'Pagado',
            'cancelled' => 'Cancelado',
            default => ucfirst(str_replace('_', ' ', $status)),
        };
    }

    private function paymentStatusLabel(string $status): string
    {
        return match ($status) {
            'prototype_pending' => 'Pago pendiente',
            'prototype_submitted' => 'Pago en revision',
            'prototype_paid' => 'Pago aprobado',
            'prototype_rejected' => 'Pago rechazado',
            'refund_pending' => 'Reembolso pendiente',
            default => ucfirst(str_replace('_', ' ', $status)),
        };
    }

    private function paymentMethodLabel(?string $method): string
    {
        return match ($method) {
            'gateway_pending' => 'Pasarela externa',
            'prototype_card' => 'Tarjeta',
            'prototype_transfer' => 'Transferencia',
            'prototype_cash' => 'Efectivo',
            default => 'No definido',
        };
    }

    private function reviewStatusLabel(string $status): string
    {
        return match ($status) {
            'accepted' => 'Aceptado',
            'rejected' => 'Rechazado',
            default => 'Pendiente',
        };
    }
}
