<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedidos | Benjaminduve</title>
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
        main { max-width: 960px; margin: 24px auto; padding: 0 18px; }
        .box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
        .muted { color: var(--muted); font-size: 13px; font-weight: 500; }
        .list {
            display: grid;
            gap: 10px;
            margin-top: 12px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            align-items: center;
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--surface-soft);
            padding: 12px;
        }
        .chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
        .chip {
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 3px 8px;
            font-size: 11px;
            color: var(--muted);
            background: var(--surface);
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
        a {
            border: 0;
            background: var(--button-bg);
            color: var(--button-text);
            text-decoration: none;
            padding: 8px 10px;
            border-radius: 8px;
        }
        .top { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
        .top a.alt { background: var(--button-alt); color: #f5f5f5; }
        @media (max-width: 700px) {
            .row { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>
    @include('partials.store-header')
    <main>
        <div class="top">
            <h2 style="margin: 0;">Resumen de pedidos</h2>
            <a class="alt" href="{{ route('home') }}">Volver al catalogo</a>
        </div>

        <section class="box">
            @if($customerEmail)
                <p class="muted">Correo asociado a esta sesion: {{ $customerEmail }}</p>
            @endif

            @if($orders->count() === 0)
                <p class="muted">Aun no tienes pedidos registrados en esta sesion.</p>
            @else
                <div class="list">
                    @foreach($orders as $order)
                        <article class="row">
                            <div>
                                <strong>Pedido #{{ $order->id }}</strong>
                                <div class="chips">
                                    <span class="chip {{ $order->status_tone }}">Estado: {{ $order->status_label }}</span>
                                    <span class="chip {{ $order->payment_status_tone }}">Pago: {{ $order->payment_status_label }}</span>
                                    <span class="chip">Total: ${{ number_format((float) $order->total, 0, ',', '.') }}</span>
                                </div>
                            </div>
                            <a href="{{ route('orders.show', $order) }}">Ver detalle</a>
                        </article>
                    @endforeach
                </div>
            @endif
        </section>
    </main>
</body>
</html>
