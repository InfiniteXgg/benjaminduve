<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Rules\ValidRut;
use App\Services\StockAlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StoreApiController extends Controller
{
    public function __construct(private StockAlertService $stockAlerts) {}

    public function products(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        $products = Product::query()
            ->with('images')
            ->where('is_active', true)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', '%' . $search . '%')
                        ->orWhere('description', 'like', '%' . $search . '%');
                });
            })
            ->latest()
            ->paginate(9);

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

    public function productShow(string $slug): JsonResponse
    {
        $product = Product::query()
            ->with('images')
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Ese producto no esta disponible en este momento.',
            ], 404);
        }

        return response()->json([
            'data' => $this->productPayload($product),
        ]);
    }

    public function createOrder(Request $request): JsonResponse
    {
        $data = $request->validate(
            [
                'customer_name' => ['required', 'string', 'min:3', 'max:255'],
                'customer_email' => ['required', 'email:rfc,dns', 'max:255'],
                'billing_document_type' => ['required', 'in:boleta_electronica'],
                'billing_tax_id' => ['required', 'string', new ValidRut],
                'billing_address' => ['required', 'string', 'min:6', 'max:255'],
                'billing_city' => ['required', 'string', 'min:2', 'max:120'],
                'billing_contact_phone' => ['nullable', 'string', 'max:40', 'regex:/^[0-9+\-\s()]{6,40}$/'],
                'billing_notes' => ['nullable', 'string', 'max:1000'],
                'items' => ['required', 'array', 'min:1', 'max:50'],
                'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
                'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
            ],
            [
                'required' => 'El campo :attribute es obligatorio.',
                'email' => 'El campo :attribute debe tener un correo valido.',
                'min' => 'El campo :attribute no cumple el minimo requerido.',
                'max' => 'El campo :attribute supera el maximo permitido.',
                'regex' => 'El formato de :attribute es invalido.',
                'distinct' => 'No repitas el mismo producto en multiples lineas.',
                'exists' => 'Uno de los productos seleccionados no existe.',
                'in' => 'El valor seleccionado para :attribute es invalido.',
                'array' => 'El campo :attribute debe ser una lista valida.',
            ],
            [
                'customer_name' => 'nombre del cliente',
                'customer_email' => 'correo del cliente',
                'billing_document_type' => 'tipo de documento',
                'billing_tax_id' => 'RUT/documento',
                'billing_address' => 'direccion',
                'billing_city' => 'ciudad/comuna',
                'billing_contact_phone' => 'telefono de contacto',
                'items' => 'productos',
                'items.*.product_id' => 'producto',
                'items.*.quantity' => 'cantidad',
            ]
        );

        $itemsByProductId = collect($data['items'])
            ->groupBy('product_id')
            ->map(function ($rows) {
                return (int) collect($rows)->sum('quantity');
            });

        $order = DB::transaction(function () use ($data, $itemsByProductId) {
            $products = Product::query()
                ->whereIn('id', $itemsByProductId->keys()->all())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $total = 0;
            $orderItems = [];

            foreach ($itemsByProductId as $productId => $quantity) {
                /** @var Product|null $product */
                $product = $products->get((int) $productId);

                if (!$product || !$product->is_active) {
                    abort(422, 'Uno de los productos no esta disponible.');
                }

                if ($product->stock < $quantity) {
                    abort(422, 'Stock insuficiente para "' . $product->name . '".');
                }

                $subtotal = (float) $product->price * $quantity;
                $total += $subtotal;

                $orderItems[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                ];
            }

            $order = Order::create([
                'customer_name' => trim((string) $data['customer_name']),
                'customer_email' => strtolower(trim((string) $data['customer_email'])),
                'billing_document_type' => $data['billing_document_type'],
                'billing_tax_id' => trim((string) $data['billing_tax_id']),
                'billing_address' => trim((string) $data['billing_address']),
                'billing_city' => trim((string) $data['billing_city']),
                'billing_contact_phone' => isset($data['billing_contact_phone']) ? trim((string) $data['billing_contact_phone']) : null,
                'billing_notes' => isset($data['billing_notes']) ? trim((string) $data['billing_notes']) : null,
                'status' => 'pending',
                'payment_status' => 'prototype_pending',
                'admin_review_status' => 'pending',
                'public_token' => $this->generateOrderPublicToken(),
                'total' => $total,
            ]);

            foreach ($orderItems as $row) {
                /** @var Product $product */
                $product = $row['product'];
                $quantity = $row['quantity'];
                $subtotal = $row['subtotal'];

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'unit_price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                $previousStock = (int) $product->stock;
                $product->decrement('stock', $quantity);
                $this->stockAlerts->notifyAdminsIfNeeded($product->fresh(), $previousStock);
            }

            return $order->load('items');
        });

        return response()->json([
            'message' => 'Pedido generado correctamente.',
            'data' => $this->orderPayload($order),
        ], 201);
    }

    public function orderSummary(Request $request, Order $order): JsonResponse
    {
        if (!$this->orderTokenMatches($request, $order)) {
            return response()->json(['message' => 'Token de pedido invalido.'], 403);
        }

        return response()->json([
            'data' => $this->orderPayload($order->load('items')),
        ]);
    }

    public function submitPayment(Request $request, Order $order): JsonResponse
    {
        if (!$this->orderTokenMatches($request, $order)) {
            return response()->json(['message' => 'Token de pedido invalido.'], 403);
        }

        $payload = $request->validate(
            [
                'order_token' => ['required', 'string', 'size:48'],
                'payment_method' => ['required', 'in:gateway_pending'],
                'method_details' => ['nullable', 'array'],
            ],
            [
                'required' => 'Falta informacion obligatoria para procesar el pago.',
                'size' => 'El token del pedido tiene un formato invalido.',
                'in' => 'El metodo de pago seleccionado es invalido.',
                'array' => 'El detalle del metodo de pago no tiene un formato valido.',
            ]
        );

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'No se puede pagar un pedido cancelado.'], 422);
        }

        if ($order->payment_status === 'prototype_rejected' || $order->admin_review_status === 'rejected') {
            return response()->json(['message' => 'El pago fue rechazado. Debes iniciar una nueva compra.'], 422);
        }

        if ($order->payment_status !== 'prototype_pending' || $order->admin_review_status !== 'pending') {
            return response()->json(['message' => 'Este pedido ya fue enviado a revision o ya tiene decision.'], 422);
        }

        $paymentMeta = $this->validateAndNormalizePaymentDetails(
            $payload['payment_method'],
            (array) ($payload['method_details'] ?? [])
        );

        DB::transaction(function () use ($order, $payload, $paymentMeta): void {
            /** @var Order $lockedOrder */
            $lockedOrder = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($lockedOrder->status === 'cancelled') {
                abort(422, 'No se puede pagar un pedido cancelado.');
            }

            if ($lockedOrder->payment_status !== 'prototype_pending' || $lockedOrder->admin_review_status !== 'pending') {
                abort(422, 'Este pedido ya fue enviado a revision o ya tiene decision.');
            }

            $lockedOrder->update([
                'status' => 'pending',
                'payment_status' => 'prototype_submitted',
                'payment_method' => $payload['payment_method'],
                'payment_reference' => $this->buildPaymentReference($payload['payment_method']),
                'payment_meta' => $paymentMeta,
            ]);
        });

        return response()->json([
            'message' => 'Pago enviado. Queda en revision hasta confirmacion del administrador.',
            'data' => $this->orderPayload($order->fresh()->load('items')),
        ]);
    }

    public function cancelOrder(Request $request, Order $order): JsonResponse
    {
        if (!$this->orderTokenMatches($request, $order)) {
            return response()->json(['message' => 'Token de pedido invalido.'], 403);
        }

        if ($order->status === 'cancelled') {
            return response()->json([
                'message' => 'El pedido ya estaba cancelado.',
                'data' => $this->orderPayload($order->load('items')),
            ]);
        }

        if ($order->payment_status !== 'prototype_pending' || $order->admin_review_status !== 'pending') {
            return response()->json([
                'message' => 'No se puede cancelar un pedido que ya fue enviado a revision o ya fue decidido.',
            ], 422);
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

        return response()->json([
            'message' => 'Pedido cancelado correctamente.',
            'data' => $this->orderPayload($order->fresh()->load('items')),
        ]);
    }

    private function productPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'slug' => $product->slug,
            'name' => $product->name,
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
        ];
    }

    private function orderPayload(Order $order): array
    {
        $order->loadMissing('items');

        return [
            'id' => $order->id,
            'public_token' => $order->public_token,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'status' => $order->status,
            'status_label' => $this->orderStatusLabel((string) $order->status),
            'payment_status' => $order->payment_status,
            'payment_status_label' => $this->paymentStatusLabel((string) $order->payment_status),
            'payment_method' => $order->payment_method,
            'payment_method_label' => $this->paymentMethodLabel($order->payment_method),
            'payment_detail_summary' => $this->paymentDetailSummary($order),
            'admin_review_status' => $order->admin_review_status,
            'admin_review_label' => $this->reviewStatusLabel((string) $order->admin_review_status),
            'can_print_receipt' => $this->canPrintReceipt($order),
            'should_reset_checkout_data' => $this->shouldResetCheckoutData($order),
            'payment_reference' => $order->payment_reference,
            'billing' => [
                'document_type' => $order->billing_document_type,
                'document_type_label' => $this->billingDocumentTypeLabel($order->billing_document_type),
                'tax_id' => $order->billing_tax_id,
                'address' => $order->billing_address,
                'city' => $order->billing_city,
                'contact_phone' => $order->billing_contact_phone,
                'notes' => $order->billing_notes,
            ],
            'electronic_receipt' => [
                'number' => $this->receiptNumber($order),
                'issued_at' => $order->created_at?->toIso8601String(),
            ],
            'total' => (float) $order->total,
            'created_at' => $order->created_at?->toIso8601String(),
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => (float) $item->subtotal,
                ];
            })->values(),
        ];
    }

    private function orderTokenMatches(Request $request, Order $order): bool
    {
        $token = (string) ($request->input('order_token', $request->query('order_token', '')));

        return $token !== '' && hash_equals((string) $order->public_token, $token);
    }

    private function generateOrderPublicToken(): string
    {
        do {
            $token = Str::random(48);
        } while (Order::where('public_token', $token)->exists());

        return $token;
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

    private function billingDocumentTypeLabel(?string $documentType): string
    {
        return match ($documentType) {
            'boleta_electronica' => 'Boleta electronica',
            default => 'Documento',
        };
    }

    private function receiptNumber(Order $order): string
    {
        $date = $order->created_at?->format('Ymd') ?? date('Ymd');

        return 'BOL-' . $date . '-' . str_pad((string) $order->id, 6, '0', STR_PAD_LEFT);
    }

    private function buildPaymentReference(string $paymentMethod): string
    {
        $prefix = match ($paymentMethod) {
            'gateway_pending' => 'GWY',
            'prototype_card' => 'CARD',
            'prototype_transfer' => 'TRF',
            'prototype_cash' => 'CASH',
            default => 'PAY',
        };

        return $prefix . '-' . strtoupper(Str::random(8));
    }

    /**
     * @throws ValidationException
     */
    private function validateAndNormalizePaymentDetails(string $paymentMethod, array $details): array
    {
        $rules = match ($paymentMethod) {
            'gateway_pending' => [],
            'prototype_card' => [
                'card_holder' => ['required', 'string', 'max:120'],
                'card_number' => ['required', 'string', 'regex:/^\d{13,19}$/'],
                'card_expiry' => ['required', 'string', 'regex:/^(0[1-9]|1[0-2])\/\d{2}$/'],
                'card_cvv' => ['required', 'string', 'regex:/^\d{3,4}$/'],
            ],
            'prototype_transfer' => [
                'bank_name' => ['required', 'string', 'max:120'],
                'account_holder' => ['required', 'string', 'max:120'],
                'transfer_reference' => ['required', 'string', 'max:120'],
            ],
            'prototype_cash' => [
                'payer_name' => ['required', 'string', 'max:120'],
                'payer_document' => ['nullable', 'string', 'max:40'],
            ],
            default => [],
        };

        $validated = Validator::make($details, $rules)->validate();

        return match ($paymentMethod) {
            'gateway_pending' => [],
            'prototype_card' => [
                'card_holder' => $validated['card_holder'],
                'card_last4' => substr((string) $validated['card_number'], -4),
                'card_expiry' => $validated['card_expiry'],
            ],
            'prototype_transfer' => [
                'bank_name' => $validated['bank_name'],
                'account_holder' => $validated['account_holder'],
                'transfer_reference' => $validated['transfer_reference'],
            ],
            'prototype_cash' => [
                'payer_name' => $validated['payer_name'],
                'payer_document' => $validated['payer_document'] ?? null,
            ],
            default => [],
        };
    }

    private function paymentDetailSummary(Order $order): array
    {
        $meta = (array) ($order->payment_meta ?? []);

        return match ($order->payment_method) {
            'gateway_pending' => [
                'Canal' => 'Pendiente de integracion de API de pago',
            ],
            'prototype_card' => [
                'Titular' => $meta['card_holder'] ?? '-',
                'Tarjeta' => isset($meta['card_last4']) ? '**** **** **** ' . $meta['card_last4'] : '-',
                'Vencimiento' => $meta['card_expiry'] ?? '-',
            ],
            'prototype_transfer' => [
                'Banco' => $meta['bank_name'] ?? '-',
                'Titular' => $meta['account_holder'] ?? '-',
                'Referencia' => $meta['transfer_reference'] ?? '-',
            ],
            'prototype_cash' => [
                'Pagador' => $meta['payer_name'] ?? '-',
                'Documento' => $meta['payer_document'] ?? '-',
            ],
            default => [],
        };
    }

    private function canPrintReceipt(Order $order): bool
    {
        return $order->status === 'paid'
            && $order->admin_review_status === 'accepted'
            && $order->payment_status === 'prototype_paid';
    }

    private function shouldResetCheckoutData(Order $order): bool
    {
        return $order->admin_review_status === 'rejected'
            || $order->payment_status === 'prototype_rejected';
    }
}
