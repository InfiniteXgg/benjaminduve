<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido #{{ $order->id }} | Benjaminduve</title>
    @include('partials.store-header-styles')
    <style>
        :root {
            color-scheme: light dark;
            --bg: #e3e3df;
            --surface: #f3f3ef;
            --surface-soft: #ebebe7;
            --text: #171717;
            --muted: #4d4d4d;
            --border: #c8c8c3;
            --header-start: #141414;
            --header-end: #2f2f2f;
            --button-bg: #232323;
            --button-text: #f5f5f2;
            --button-alt: #575757;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #171717;
                --surface: #222222;
                --surface-soft: #2a2a2a;
                --text: #eeeeee;
                --muted: #d1d1d1;
                --border: #3f3f3f;
                --header-start: #090909;
                --header-end: #1f1f1f;
                --button-bg: #f2f2f2;
                --button-text: #171717;
                --button-alt: #5f5f5f;
            }
        }
        body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: var(--bg); color: var(--text); }
        main { max-width: 940px; margin: 24px auto; padding: 0 18px; }
        .box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 12px; }
        .notice { border-radius: 10px; background: var(--surface-soft); border: 1px solid var(--border); padding: 10px; margin-bottom: 8px; }
        .muted { color: var(--muted); font-size: 13px; font-weight: 500; }
        .chips { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 10px; }
        .chip {
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 3px 8px;
            font-size: 11px;
            color: var(--muted);
            background: var(--surface-soft);
        }
        .chip.pending { background: rgba(128, 128, 128, 0.12); }
        .chip.success {
            border-color: #2f8a3e;
            color: #1f6e2f;
            background: rgba(47, 138, 62, 0.12);
        }
        .chip.danger {
            border-color: #9d3b3b;
            color: #8a2d2d;
            background: rgba(157, 59, 59, 0.12);
        }
        @media (prefers-color-scheme: dark) {
            .chip.success {
                color: #9ae1a7;
                border-color: #5ea56a;
                background: rgba(70, 145, 82, 0.24);
            }
            .chip.danger {
                color: #f2b0b0;
                border-color: #a95d5d;
                background: rgba(169, 93, 93, 0.24);
            }
        }
        .rows { display: grid; gap: 8px; }
        .row {
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 10px;
            background: var(--surface-soft);
            display: flex;
            justify-content: space-between;
            gap: 10px;
        }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        a, button {
            border: 0;
            background: var(--button-bg);
            color: var(--button-text);
            text-decoration: none;
            padding: 9px 10px;
            cursor: pointer;
            border-radius: 8px;
        }
        a.alt { background: var(--button-alt); color: #f5f5f5; }
        @media (max-width: 720px) {
            .row { flex-direction: column; }
        }
    </style>
</head>
<body>
    @include('partials.store-header')
    <main>
        @if(session('status'))
            <section class="notice" data-auto-dismiss="2600">{{ session('status') }}</section>
        @endif
        @if($errors->any())
            <section class="notice" data-auto-dismiss="2600">{{ $errors->first() }}</section>
        @endif

        <section class="box">
            <h2 style="margin-top: 0;">Pedido #{{ $order->id }}</h2>
            <div class="chips">
                <span class="chip {{ $order->review_status_tone }}">Revision admin: {{ $order->review_status_label }}</span>
                <span class="chip {{ $order->status_tone }}">Estado: {{ $order->status_label }}</span>
                <span class="chip {{ $order->payment_status_tone }}">Pago: {{ $order->payment_status_label }}</span>
                <span class="chip">Metodo: {{ $order->payment_method_label }}</span>
                <span class="chip">Ref: {{ $order->payment_reference ?? 'Sin referencia' }}</span>
            </div>
            <div class="rows">
                @foreach($order->items as $item)
                    <div class="row">
                        <strong>{{ $item->product_name }} x {{ $item->quantity }}</strong>
                        <span class="muted">${{ number_format((float) $item->subtotal, 0, ',', '.') }}</span>
                    </div>
                @endforeach
            </div>
            <p style="margin-bottom: 0; margin-top: 12px;"><strong>Total: ${{ number_format((float) $order->total, 0, ',', '.') }}</strong></p>
        </section>

        @if($order->payment_status === 'prototype_pending' && $order->status !== 'cancelled' && $order->admin_review_status === 'pending')
            <section class="box actions">
                <a href="{{ route('payment.show', $order) }}">Ir a pago</a>
            </section>
        @endif
    </main>
    @include('partials.auto-dismiss-notices')
</body>
</html>
