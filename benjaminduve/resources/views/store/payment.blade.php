<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pago prototipo | Benjaminduve</title>
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
        main { max-width: 860px; margin: 24px auto; padding: 0 18px; }
        .box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 12px; }
        .rows { display: grid; gap: 8px; }
        .row { border: 1px solid var(--border); border-radius: 10px; background: var(--surface-soft); padding: 10px; display: flex; justify-content: space-between; gap: 10px; }
        .muted { color: var(--muted); font-weight: 500; font-size: 13px; }
        .status-line { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 0; }
        .chip { border: 1px solid var(--border); border-radius: 999px; padding: 3px 8px; font-size: 11px; color: var(--muted); background: var(--surface-soft); }
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
        .methods { display: grid; gap: 8px; margin-bottom: 12px; }
        .method {
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 10px;
            background: var(--surface-soft);
            display: flex;
            gap: 8px;
            align-items: flex-start;
        }
        .method input { margin-top: 2px; }
        .method label { display: block; cursor: pointer; }
        .method strong { display: block; font-size: 14px; margin-bottom: 2px; }
        .method span { color: var(--muted); font-size: 12px; font-weight: 500; }
        button, a { border: 0; text-decoration: none; background: var(--button-bg); color: var(--button-text); padding: 10px 12px; cursor: pointer; display: inline-block; border-radius: 8px; }
        a.alt { background: var(--button-alt); color: #f5f5f5; }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 640px) {
            .row { flex-direction: column; }
        }
    </style>
</head>
<body>
    @include('partials.store-header', ['cartActive' => true])
    <main>
        @if (session('status'))
            <section class="box" data-auto-dismiss="2600">{{ session('status') }}</section>
        @endif
        @if ($errors->any())
            <section class="box" data-auto-dismiss="2600">{{ $errors->first() }}</section>
        @endif

        <section class="box">
            <h2 style="margin-top: 0;">Pedido #{{ $order->id }}</h2>
            <div class="rows">
                @foreach ($order->items as $item)
                    <div class="row">
                        <strong>{{ $item->product_name }} x {{ $item->quantity }}</strong>
                        <span class="muted">${{ number_format((float) $item->subtotal, 0, ',', '.') }}</span>
                    </div>
                @endforeach
            </div>
            <p style="margin: 12px 0 0;"><strong>Total: ${{ number_format((float) $order->total, 0, ',', '.') }}</strong></p>
            <div class="status-line">
                <span class="chip {{ $order->review_status_tone }}">Revision admin: {{ $order->review_status_label }}</span>
                <span class="chip {{ $order->status_tone }}">Estado pedido: {{ $order->status_label }}</span>
                <span class="chip {{ $order->payment_status_tone }}">Estado pago: {{ $order->payment_status_label }}</span>
            </div>
        </section>

        <section class="box">
            <h2 style="margin-top: 0;">Simulacion de pago</h2>
            <p class="muted">Al confirmar, el pedido queda en revision administrativa hasta que se acepte o rechace desde el dashboard.</p>
            <form method="POST" action="{{ route('payment.process', $order) }}">
                @csrf
                <div class="methods">
                    <div class="method">
                        <input id="pay_card" type="radio" name="payment_method" value="prototype_card" checked>
                        <label for="pay_card">
                            <strong>Tarjeta (prototipo)</strong>
                            <span>Se envia a revision administrativa.</span>
                        </label>
                    </div>
                    <div class="method">
                        <input id="pay_transfer" type="radio" name="payment_method" value="prototype_transfer">
                        <label for="pay_transfer">
                            <strong>Transferencia (prototipo)</strong>
                            <span>Se envia a revision administrativa.</span>
                        </label>
                    </div>
                    <div class="method">
                        <input id="pay_cash" type="radio" name="payment_method" value="prototype_cash">
                        <label for="pay_cash">
                            <strong>Efectivo (prototipo)</strong>
                            <span>Se envia a revision administrativa.</span>
                        </label>
                    </div>
                </div>
                <div class="actions">
                    <button type="submit">Confirmar pago</button>
                </div>
            </form>
            <form method="POST" action="{{ route('orders.cancel', $order) }}" style="margin-top: 8px;">
                @csrf
                <div class="actions">
                    <button type="submit">Cancelar pedido</button>
                </div>
            </form>
        </section>
    </main>
    @include('partials.auto-dismiss-notices')
</body>
</html>
