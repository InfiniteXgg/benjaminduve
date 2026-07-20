<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeroCarouselSlide;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Services\StockAlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminApiController extends Controller
{
    public function __construct(private StockAlertService $stockAlerts) {}

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

        $lowStockProducts = $this->stockAlerts->lowStockProducts();

        return response()->json([
            'product_count' => Product::count(),
            'active_product_count' => Product::where('is_active', true)->count(),
            'order_count' => Order::count(),
            'low_stock_threshold' => $this->stockAlerts->threshold(),
            'low_stock_count' => $lowStockProducts->count(),
            'low_stock_products' => $lowStockProducts
                ->map(fn (Product $product) => $this->lowStockProductPayload($product))
                ->values(),
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $search = trim((string) $request->query('q', ''));

        $query = Product::query()->with('images');
        if ($search !== '') {
            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhere('size', 'like', '%' . $search . '%');
            });
        }

        $perPage = min(100, max(1, (int) $request->query('per_page', 12)));
        $products = $query->latest()->paginate($perPage);

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

        $data = $request->validate($this->productValidationRules(), $this->productValidationMessages());

        $measurements = $this->resolveMeasurements($data);

        $product = Product::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ? Str::slug($data['slug']) : $this->buildUniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'size' => $measurements['size'],
            'height_cm' => $measurements['height_cm'],
            'width_cm' => $measurements['width_cm'],
            'depth_cm' => $measurements['depth_cm'],
            'price' => $data['price'],
            'stock' => $data['stock'],
            'is_active' => (bool) ($data['is_active'] ?? false),
        ]);

        $this->stockAlerts->notifyAdminsIfNeeded($product);
        $this->syncProductImages($product, $data['images'] ?? []);

        return response()->json([
            'message' => 'Producto creado correctamente.',
            'data' => $this->productPayload($product->fresh()->load('images')),
        ], 201);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $product = Product::findOrFail($id);

        $data = $request->validate(array_merge($this->productValidationRules($product->id), [
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product->id),
            ],
        ]), $this->productValidationMessages());

        $measurements = $this->resolveMeasurements($data);
        $previousStock = (int) $product->stock;

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

        $this->stockAlerts->notifyAdminsIfNeeded($product->fresh(), $previousStock);
        $this->syncProductImages($product, $data['images'] ?? []);

        return response()->json([
            'message' => 'Producto actualizado.',
            'data' => $this->productPayload($product->fresh()->load('images')),
        ]);
    }

    public function deleteProduct(Request $request, int $id): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $product = Product::findOrFail($id);

        $product->delete();

        return response()->json([
            'message' => 'Producto eliminado.',
        ]);
    }

    public function deleteProductImage(Request $request, int $id, ProductImage $image): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $product = Product::findOrFail($id);

        if ((int) $image->product_id !== (int) $product->id) {
            return response()->json([
                'message' => 'La imagen no pertenece a este producto.',
            ], 404);
        }

        $image->delete();

        return response()->json([
            'message' => 'Imagen eliminada correctamente.',
        ]);
    }

    public function heroSlides(Request $request): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $slides = HeroCarouselSlide::query()
            ->with('product')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $slides->map(fn (HeroCarouselSlide $slide) => $this->heroSlidePayload($slide))->values(),
        ]);
    }

    public function storeHeroSlide(Request $request): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate($this->heroSlideValidationRules(), $this->heroSlideValidationMessages());

        $slide = HeroCarouselSlide::create([
            'eyebrow' => trim((string) $data['eyebrow']),
            'title' => trim((string) $data['title']),
            'cta' => trim((string) $data['cta']),
            'image' => trim((string) $data['image']),
            'image_width' => $data['image_width'] ?? null,
            'image_height' => $data['image_height'] ?? null,
            'crop_focus_x' => (float) ($data['crop_focus_x'] ?? 0.5),
            'crop_focus_y' => (float) ($data['crop_focus_y'] ?? 0.5),
            'crop_zoom' => (float) ($data['crop_zoom'] ?? 1),
            'product_id' => $data['product_id'] ?? null,
            'sort_order' => (int) ($data['sort_order'] ?? HeroCarouselSlide::max('sort_order') + 1),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return response()->json([
            'message' => 'Slide creado correctamente.',
            'data' => $this->heroSlidePayload($slide),
        ], 201);
    }

    public function updateHeroSlide(Request $request, HeroCarouselSlide $slide): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $data = $request->validate($this->heroSlideValidationRules(), $this->heroSlideValidationMessages());

        $slide->update([
            'eyebrow' => trim((string) $data['eyebrow']),
            'title' => trim((string) $data['title']),
            'cta' => trim((string) $data['cta']),
            'image' => trim((string) $data['image']),
            'image_width' => $data['image_width'] ?? null,
            'image_height' => $data['image_height'] ?? null,
            'crop_focus_x' => (float) ($data['crop_focus_x'] ?? 0.5),
            'crop_focus_y' => (float) ($data['crop_focus_y'] ?? 0.5),
            'crop_zoom' => (float) ($data['crop_zoom'] ?? 1),
            'product_id' => $data['product_id'] ?? null,
            'sort_order' => (int) ($data['sort_order'] ?? $slide->sort_order),
            'is_active' => (bool) ($data['is_active'] ?? false),
        ]);

        return response()->json([
            'message' => 'Slide actualizado.',
            'data' => $this->heroSlidePayload($slide->fresh()),
        ]);
    }

    public function deleteHeroSlide(Request $request, HeroCarouselSlide $slide): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $slide->delete();

        return response()->json([
            'message' => 'Slide eliminado.',
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

        $query = Order::query()->with('items.product')->withCount('items');

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

        DB::transaction(function () use ($order): void {
            $order->update([
                'status' => 'paid',
                'payment_status' => 'prototype_paid',
                'admin_review_status' => 'accepted',
            ]);
        });

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

    public function deleteOrder(Request $request, Order $order): JsonResponse
    {
        if (!$this->requireAdmin($request)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $restoreStock = $request->query('restore_stock') === '1';

        DB::transaction(function () use ($order, $restoreStock): void {
            $order->load('items.product');

            if ($restoreStock && $order->status === 'paid') {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->increment('stock', $item->quantity);
                    }
                }
            }

            $order->delete();
        });

        return response()->json([
            'message' => 'Pedido eliminado correctamente.',
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

    private function productValidationRules(?int $ignoreId = null): array
    {
        $nameRule = Rule::unique('products', 'name');
        $slugRule = Rule::unique('products', 'slug');
        if ($ignoreId !== null) {
            $nameRule = $nameRule->ignore($ignoreId);
            $slugRule = $slugRule->ignore($ignoreId);
        }

        return [
            'name' => array_merge(['required', 'string', 'max:255'], [$nameRule]),
            'slug' => array_merge(['nullable', 'string', 'max:255'], [$slugRule]),
            'description' => ['nullable', 'string'],
            'size' => ['nullable', 'string', 'max:120'],
            'height_cm' => ['nullable', 'numeric', 'min:0'],
            'width_cm' => ['nullable', 'numeric', 'min:0'],
            'depth_cm' => ['nullable', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'images' => ['nullable', 'array', 'max:8'],
            'images.*.url' => ['required_with:images', 'string', 'max:2500000'],
            'images.*.alt' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function productValidationMessages(): array
    {
        return [
            'name.required' => 'El nombre del producto es obligatorio.',
            'name.unique' => 'Este nombre de producto ya está siendo utilizado.',
            'slug.unique' => 'Este ID ya está siendo utilizado.',
            'price.required' => 'El precio es obligatorio.',
            'stock.required' => 'El stock es obligatorio.',
            'images.max' => 'Puedes guardar hasta 8 fotos por producto.',
            'images.*.url.max' => 'Una de las fotos es demasiado pesada. Prueba con una imagen mas liviana.',
            'images.*.url.required_with' => 'Cada foto necesita una fuente de imagen valida.',
        ];
    }

    private function heroSlideValidationRules(): array
    {
        return [
            'eyebrow' => ['required', 'string', 'max:80'],
            'title' => ['required', 'string', 'max:120'],
            'cta' => ['required', 'string', 'max:80'],
            'image' => [
                'required',
                'string',
                'max:2500000',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$this->isSupportedImageSource((string) $value)) {
                        $fail('La foto debe ser una imagen cargada desde el equipo o un asset local del sitio.');
                    }
                },
            ],
            'image_width' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'image_height' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'crop_focus_x' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'crop_focus_y' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'crop_zoom' => ['nullable', 'numeric', 'min:1', 'max:3'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    private function heroSlideValidationMessages(): array
    {
        return [
            'eyebrow.required' => 'La etiqueta superior del slide es obligatoria.',
            'title.required' => 'El titulo del slide es obligatorio.',
            'cta.required' => 'El texto del boton del slide es obligatorio.',
            'image.required' => 'La foto del slide es obligatoria.',
            'image.max' => 'La foto del slide es demasiado pesada. Prueba con una imagen mas liviana.',
            'product_id.exists' => 'El producto ligado al slide no existe.',
        ];
    }

    private function productPayload(Product $product): array
    {
        return array_merge([
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
            'images' => $product->images
                ->map(fn ($image) => [
                    'id' => $image->id,
                    'url' => $image->url,
                    'alt' => $image->alt ?: $product->name,
                ])
                ->values(),
        ], $this->stockAlerts->productAlertPayload($product));
    }

    private function syncProductImages(Product $product, array $images): void
    {
        $sanitized = collect($images)
            ->map(function ($image) use ($product) {
                $url = trim((string) ($image['url'] ?? ''));
                if ($url === '' || !$this->isSupportedImageSource($url)) {
                    return null;
                }

                return [
                    'url' => $url,
                    'alt' => trim((string) ($image['alt'] ?? '')) ?: $product->name,
                ];
            })
            ->filter()
            ->take(8)
            ->values();

        $product->images()->delete();

        foreach ($sanitized as $index => $image) {
            $product->images()->create([
                'url' => $image['url'],
                'alt' => $image['alt'],
                'sort_order' => $index,
            ]);
        }
    }

    private function isSupportedImageSource(string $url): bool
    {
        return str_starts_with($url, 'data:image/')
            || preg_match('/^\/[A-Za-z0-9_\-\/.]+\.(jpe?g|png|webp|gif|svg)$/i', $url) === 1;
    }

    private function heroSlidePayload(HeroCarouselSlide $slide): array
    {
        return [
            'id' => $slide->id,
            'eyebrow' => $slide->eyebrow,
            'title' => $slide->title,
            'cta' => $slide->cta,
            'image' => $slide->image,
            'image_width' => $slide->image_width,
            'image_height' => $slide->image_height,
            'crop_focus_x' => (float) ($slide->crop_focus_x ?? 0.5),
            'crop_focus_y' => (float) ($slide->crop_focus_y ?? 0.5),
            'crop_zoom' => (float) ($slide->crop_zoom ?? 1),
            'product_id' => $slide->product_id,
            'product_name' => $slide->product?->name,
            'sort_order' => (int) $slide->sort_order,
            'is_active' => (bool) $slide->is_active,
        ];
    }

    private function lowStockProductPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'stock' => (int) $product->stock,
            'stock_status' => $this->stockAlerts->stockStatus($product),
            'stock_status_label' => match ($this->stockAlerts->stockStatus($product)) {
                'out_of_stock' => 'Agotado',
                'low_stock' => 'Stock bajo',
                default => null,
            },
        ];
    }

    private function orderPayload(Order $order): array
    {
        $items = [];
        if ($order->items) {
            foreach ($order->items as $item) {
                $items[] = [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'quantity' => (int) $item->quantity,
                    'subtotal' => (float) $item->subtotal,
                ];
            }
        }

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
            'items' => $items,
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
