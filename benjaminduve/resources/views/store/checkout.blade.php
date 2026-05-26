<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout | Benjaminduve</title>
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
        .group { margin-bottom: 10px; }
        label { display: block; margin-bottom: 6px; font-size: 14px; }
        input { width: 100%; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); padding: 10px; }
        button, a { border: 0; text-decoration: none; background: var(--button-bg); color: var(--button-text); padding: 10px 12px; cursor: pointer; display: inline-block; border-radius: 8px; }
        a.alt { background: var(--button-alt); color: #f5f5f5; }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .muted { color: var(--muted); font-size: 13px; font-weight: 500; }
        @media (max-width: 640px) {
            .row { flex-direction: column; }
        }
    </style>
</head>
<body>
    @include('partials.store-header', ['cartActive' => true])
    <main>
        <section class="box">
            <h2 style="margin-top: 0;">Resumen del pedido</h2>
            <div class="rows">
                @foreach ($items as $item)
                    <div class="row">
                        <strong>{{ $item['name'] }} x {{ $item['quantity'] }}</strong>
                        <span class="muted">${{ number_format((float) $item['price'] * (int) $item['quantity'], 0, ',', '.') }}</span>
                    </div>
                @endforeach
            </div>
            <p style="margin-bottom: 0; margin-top: 12px;"><strong>Total: ${{ number_format($total, 0, ',', '.') }}</strong></p>
        </section>

        <section class="box">
            <h2 style="margin-top: 0;">Datos del cliente</h2>
            <form method="POST" action="{{ route('checkout.submit') }}">
                @csrf
                <div class="group">
                    <label for="customer_name">Nombre completo</label>
                    <input id="customer_name" type="text" name="customer_name" value="{{ old('customer_name') }}" required>
                </div>
                <div class="group">
                    <label for="customer_email">Correo</label>
                    <input id="customer_email" type="email" name="customer_email" value="{{ old('customer_email') }}" required>
                </div>
                <div class="actions">
                    <button type="submit">Generar pedido y continuar a pago</button>
                    <a class="alt" href="{{ route('cart.index') }}">Volver al carrito</a>
                </div>
            </form>
        </section>
    </main>
</body>
</html>
