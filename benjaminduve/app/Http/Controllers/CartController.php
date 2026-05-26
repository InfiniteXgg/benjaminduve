<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CartController extends Controller
{
    public function index()
    {
        $items = $this->getCartItems();

        return view('store.cart', [
            'items' => $items,
            'total' => $this->cartTotal($items),
        ]);
    }

    public function add(Request $request, string $slug)
    {
        $product = Product::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            return redirect()->route('home')
                ->withErrors(['quantity' => 'El producto no esta disponible.']);
        }

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $cart = session('cart', []);
        $currentQty = $cart[$product->id]['quantity'] ?? 0;
        $requestedQty = $currentQty + $data['quantity'];

        if ($requestedQty > $product->stock) {
            return back()->withErrors([
                'quantity' => 'Stock insuficiente. Solo hay ' . $product->stock . ' unidad(es) disponibles para "' . $product->name . '".',
            ]);
        }

        $cart[$product->id] = [
            'id' => $product->id,
            'slug' => $product->slug,
            'name' => $product->name,
            'price' => (float) $product->price,
            'quantity' => $requestedQty,
            'stock' => $product->stock,
        ];

        session(['cart' => $cart]);

        return back()
            ->with('status', 'Producto agregado al carrito.')
            ->with('cart_notice', '"' . $product->name . '" agregado al carrito.')
            ->with('cart_added', true);
    }

    public function update(Request $request, string $slug)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $cart = session('cart', []);
        $product = Product::query()->where('slug', $slug)->first();

        $productId = null;
        if ($product && isset($cart[$product->id])) {
            $productId = $product->id;
        } else {
            foreach ($cart as $cartProductId => $item) {
                if (($item['slug'] ?? null) === $slug) {
                    $productId = (int) $cartProductId;
                    break;
                }
            }
        }

        if ($productId === null || !isset($cart[$productId])) {
            return back()->withErrors(['quantity' => 'El producto no existe en el carrito.']);
        }

        if (!$product || !$product->is_active || $product->stock <= 0) {
            unset($cart[$productId]);
            session(['cart' => $cart]);
            return back()->withErrors(['quantity' => 'El producto ya no esta disponible y fue retirado del carrito.']);
        }

        if ($data['quantity'] > $product->stock) {
            return back()->withErrors([
                'quantity' => 'Stock insuficiente. Solo hay ' . $product->stock . ' unidad(es) disponibles para "' . $product->name . '".',
            ]);
        }

        $cart[$product->id] = [
            'id' => $product->id,
            'slug' => $product->slug,
            'name' => $product->name,
            'price' => (float) $product->price,
            'quantity' => $data['quantity'],
            'stock' => $product->stock,
        ];

        if ($productId !== $product->id) {
            unset($cart[$productId]);
        }

        session(['cart' => $cart]);

        return back()->with('status', 'Carrito actualizado.');
    }

    public function remove(string $slug)
    {
        $cart = session('cart', []);

        $removed = false;
        $product = Product::query()->where('slug', $slug)->first();

        if ($product && isset($cart[$product->id])) {
            unset($cart[$product->id]);
            $removed = true;
        }

        foreach ($cart as $cartProductId => $item) {
            if (($item['slug'] ?? null) === $slug) {
                unset($cart[$cartProductId]);
                $removed = true;
            }
        }

        session(['cart' => $cart]);

        if (!$removed) {
            return back()->withErrors(['quantity' => 'El producto ya no estaba en el carrito.']);
        }

        return back()->with('status', 'Producto eliminado del carrito.');
    }

    public function checkoutForm()
    {
        $items = $this->getCartItems();

        if (empty($items)) {
            return redirect()->route('cart.index')
                ->withErrors(['quantity' => 'Tu carrito esta vacio.']);
        }

        return view('store.checkout', [
            'items' => $items,
            'total' => $this->cartTotal($items),
        ]);
    }

    public function checkoutSubmit(Request $request)
    {
        $items = $this->getCartItems();

        if (empty($items)) {
            return redirect()->route('cart.index')
                ->withErrors(['quantity' => 'No hay productos para procesar.']);
        }

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
        ]);

        $order = DB::transaction(function () use ($items, $data) {
            $total = $this->cartTotal($items);

            $order = Order::create([
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'status' => 'pending',
                'payment_status' => 'prototype_pending',
                'admin_review_status' => 'pending',
                'total' => $total,
            ]);

            foreach ($items as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['id']);

                if (!$product->is_active || $product->stock < $item['quantity']) {
                    abort(422, 'Un producto no tiene stock suficiente.');
                }

                $subtotal = $item['price'] * $item['quantity'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'subtotal' => $subtotal,
                ]);

                $product->decrement('stock', $item['quantity']);
            }

            return $order;
        });

        $orderIds = session('customer_order_ids', []);
        $orderIds[] = $order->id;

        session([
            'customer_order_ids' => array_values(array_unique($orderIds)),
            'customer_email' => $data['customer_email'],
            'latest_order_id' => $order->id,
        ]);
        session()->forget('cart');

        return redirect()->route('payment.show', $order)
            ->with('status', 'Pedido generado. Completa el pago prototipo.');
    }

    public function paymentShow(Order $order)
    {
        $this->authorizeOrder($order);
        $this->decorateOrder($order);

        if ($order->payment_status !== 'prototype_pending' || $order->admin_review_status !== 'pending') {
            return redirect()->route('orders.show', $order)
                ->with('status', 'Este pedido ya fue enviado a revision o ya tiene decision.');
        }

        return view('store.payment', [
            'order' => $order->load('items'),
        ]);
    }

    public function paymentProcess(Request $request, Order $order)
    {
        $this->authorizeOrder($order);

        $request->validate([
            'payment_method' => ['required', 'in:prototype_card,prototype_transfer,prototype_cash'],
        ]);

        if ($order->status === 'cancelled') {
            return redirect()->route('orders.show', $order)
                ->withErrors(['quantity' => 'No se puede pagar un pedido cancelado.']);
        }

        if ($order->payment_status !== 'prototype_pending' || $order->admin_review_status !== 'pending') {
            return redirect()->route('orders.show', $order)
                ->withErrors(['quantity' => 'Este pedido ya fue enviado a revision o ya tiene decision.']);
        }

        $order->update([
            'status' => 'pending',
            'payment_status' => 'prototype_submitted',
            'payment_method' => $request->input('payment_method'),
            'payment_reference' => 'PAY-' . strtoupper(Str::random(10)),
        ]);

        return redirect()->route('orders.show', $order)
            ->with('status', 'Pago enviado. Queda en revision hasta confirmacion del administrador.');
    }

    public function orderShow(Order $order)
    {
        $this->authorizeOrder($order);
        $this->decorateOrder($order);

        return view('store.order-show', [
            'order' => $order->load('items'),
        ]);
    }

    public function cancelOrder(Order $order)
    {
        $this->authorizeOrder($order);

        if ($order->status === 'cancelled') {
            return redirect()->route('orders.show', $order)->with('status', 'El pedido ya estaba cancelado.');
        }

        DB::transaction(function () use ($order) {
            $order->load('items.product');

            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock', $item->quantity);
                }
            }

            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'refund_pending',
            ]);
        });

        return redirect()->route('orders.show', $order)->with('status', 'Pedido cancelado correctamente.');
    }

    private function getCartItems(): array
    {
        $cart = session('cart', []);

        if (empty($cart)) {
            return [];
        }

        $productIds = array_map('intval', array_keys($cart));
        $products = Product::query()
            ->whereIn('id', $productIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $sanitizedCart = [];

        foreach ($cart as $productId => $item) {
            $productId = (int) $productId;

            if (!$products->has($productId)) {
                continue;
            }

            $product = $products->get($productId);
            $quantity = (int) $item['quantity'];

            if ($product->stock <= 0 || $quantity <= 0) {
                continue;
            }

            if ($quantity > $product->stock) {
                $quantity = $product->stock;
            }

            $sanitizedCart[$product->id] = [
                'id' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'price' => (float) $product->price,
                'quantity' => $quantity,
                'stock' => $product->stock,
            ];
        }

        session(['cart' => $sanitizedCart]);

        return array_values($sanitizedCart);
    }

    private function cartTotal(array $items): float
    {
        return array_reduce($items, function ($carry, $item) {
            return $carry + ((float) $item['price'] * (int) $item['quantity']);
        }, 0.0);
    }

    private function authorizeOrder(Order $order): void
    {
        $latestOrderId = (int) session('latest_order_id', 0);
        abort_unless($latestOrderId > 0 && $order->id === $latestOrderId, 403);
    }

    private function decorateOrder(Order $order): void
    {
        $order->status_label = $this->orderStatusLabel((string) $order->status);
        $order->status_tone = $this->orderStatusTone((string) $order->status);
        $order->payment_status_label = $this->paymentStatusLabel((string) $order->payment_status);
        $order->payment_status_tone = $this->paymentStatusTone((string) $order->payment_status);
        $order->payment_method_label = $this->paymentMethodLabel($order->payment_method);
        $order->review_status_label = $this->reviewStatusLabel((string) $order->admin_review_status);
        $order->review_status_tone = $this->reviewStatusTone((string) $order->admin_review_status);
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
