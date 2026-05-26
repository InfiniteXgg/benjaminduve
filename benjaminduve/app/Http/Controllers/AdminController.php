<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        $tab = $request->query('tab', 'products');
        $productSearch = trim((string) $request->query('product_q', ''));
        $orderSearch = trim((string) $request->query('order_q', ''));
        $dateFrom = (string) $request->query('date_from', '');
        $dateTo = (string) $request->query('date_to', '');

        $productsQuery = Product::query();
        if ($productSearch !== '') {
            $productsQuery->where(function ($query) use ($productSearch) {
                $query->where('name', 'like', '%' . $productSearch . '%')
                    ->orWhere('slug', 'like', '%' . $productSearch . '%')
                    ->orWhere('description', 'like', '%' . $productSearch . '%')
                    ->orWhere('size', 'like', '%' . $productSearch . '%');
            });
        }

        $products = $productsQuery
            ->latest()
            ->paginate(10, ['*'], 'products_page')
            ->appends([
                'tab' => $tab,
                'product_q' => $productSearch,
            ]);

        $ordersQuery = Order::withCount('items');

        if ($orderSearch !== '') {
            $ordersQuery->where(function ($query) use ($orderSearch) {
                $query->where('customer_name', 'like', '%' . $orderSearch . '%')
                    ->orWhere('customer_email', 'like', '%' . $orderSearch . '%')
                    ->orWhere('status', 'like', '%' . $orderSearch . '%')
                    ->orWhere('payment_status', 'like', '%' . $orderSearch . '%')
                    ->orWhere('payment_method', 'like', '%' . $orderSearch . '%')
                    ->orWhere('admin_review_status', 'like', '%' . $orderSearch . '%');
                if (ctype_digit($orderSearch)) {
                    $query->orWhere('id', (int) $orderSearch);
                }
            });
        }

        if ($dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $ordersQuery->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $ordersQuery->whereDate('created_at', '<=', $dateTo);
        }

        $orders = $ordersQuery
            ->latest()
            ->paginate(12, ['*'], 'orders_page')
            ->appends([
                'tab' => $tab,
                'product_q' => $productSearch,
                'order_q' => $orderSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ]);

        $this->decorateOrders($orders->getCollection());

        return view('admin.dashboard', [
            'tab' => in_array($tab, ['products', 'orders'], true) ? $tab : 'products',
            'productCount' => Product::count(),
            'activeProductCount' => Product::where('is_active', true)->count(),
            'orderCount' => Order::count(),
            'products' => $products,
            'productSearch' => $productSearch,
            'orders' => $orders,
            'orderSearch' => $orderSearch,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    public function storeProduct(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'size' => ['nullable', 'string', 'max:120'],
            'height_cm' => ['nullable', 'numeric', 'min:0'],
            'width_cm' => ['nullable', 'numeric', 'min:0'],
            'depth_cm' => ['nullable', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'in:1'],
        ]);

        $measurements = $this->resolveMeasurements($data);

        Product::create([
            'name' => $data['name'],
            'slug' => $this->buildUniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'size' => $measurements['size'],
            'height_cm' => $measurements['height_cm'],
            'width_cm' => $measurements['width_cm'],
            'depth_cm' => $measurements['depth_cm'],
            'price' => $data['price'],
            'stock' => $data['stock'],
            'is_active' => isset($data['is_active']),
        ]);

        return redirect()->route('admin.dashboard')
            ->with('status', 'Producto creado correctamente.');
    }

    public function updateProduct(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'size' => ['nullable', 'string', 'max:120'],
            'height_cm' => ['nullable', 'numeric', 'min:0'],
            'width_cm' => ['nullable', 'numeric', 'min:0'],
            'depth_cm' => ['nullable', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'in:1'],
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
            'is_active' => isset($data['is_active']),
        ]);

        return redirect()->route('admin.dashboard')
            ->with('status', 'Producto actualizado.');
    }

    public function deleteProduct(Product $product)
    {
        $product->delete();

        return redirect()->route('admin.dashboard')
            ->with('status', 'Producto eliminado.');
    }

    public function acceptOrder(Order $order)
    {
        if ($order->admin_review_status !== 'pending') {
            return back()->withErrors(['quantity' => 'Este pedido ya fue revisado.']);
        }
        if ($order->payment_status !== 'prototype_submitted') {
            return back()->withErrors(['quantity' => 'Este pedido aun no tiene pago enviado por el cliente.']);
        }

        $order->update([
            'status' => 'paid',
            'payment_status' => 'prototype_paid',
            'admin_review_status' => 'accepted',
        ]);

        return back()->with('status', 'Pedido aceptado por administracion.');
    }

    public function rejectOrder(Order $order)
    {
        if ($order->admin_review_status !== 'pending') {
            return back()->withErrors(['quantity' => 'Este pedido ya fue revisado.']);
        }
        if ($order->payment_status !== 'prototype_submitted') {
            return back()->withErrors(['quantity' => 'Este pedido aun no tiene pago enviado por el cliente.']);
        }

        $order->update([
            'status' => 'cancelled',
            'payment_status' => 'prototype_rejected',
            'admin_review_status' => 'rejected',
        ]);

        return back()->with('status', 'Pedido rechazado por administracion.');
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

    private function decorateOrders(Collection $orders): void
    {
        foreach ($orders as $order) {
            $order->status_label = $this->orderStatusLabel((string) $order->status);
            $order->status_tone = $this->orderStatusTone((string) $order->status);
            $order->payment_status_label = $this->paymentStatusLabel((string) $order->payment_status);
            $order->payment_status_tone = $this->paymentStatusTone((string) $order->payment_status);
            $order->payment_method_label = $this->paymentMethodLabel($order->payment_method);
            $order->review_status_label = $this->reviewStatusLabel((string) $order->admin_review_status);
            $order->review_status_tone = $this->reviewStatusTone((string) $order->admin_review_status);
        }
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

    private function orderStatusTone(string $status): string
    {
        return match ($status) {
            'paid' => 'success',
            'cancelled' => 'danger',
            default => 'pending',
        };
    }

    private function paymentStatusTone(string $status): string
    {
        return match ($status) {
            'prototype_paid' => 'success',
            'prototype_rejected' => 'danger',
            'refund_pending' => 'danger',
            default => 'pending',
        };
    }

    private function paymentMethodLabel(?string $method): string
    {
        return match ($method) {
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

    private function reviewStatusTone(string $status): string
    {
        return match ($status) {
            'accepted' => 'success',
            'rejected' => 'danger',
            default => 'pending',
        };
    }
}
