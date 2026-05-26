<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carrito | Benjaminduve</title>
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
            --button-alt: #585858;
            --notice-bg: #111111;
            --notice-text: #f7f7f7;
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
                --notice-bg: #f2f2f2;
                --notice-text: #171717;
            }
        }
        body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: var(--bg); color: var(--text); }
        main { max-width: 1020px; margin: 24px auto; padding: 0 18px; }
        .box { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
        .top-actions { display: flex; gap: 8px; margin-bottom: 12px; }
        .notice {
            margin-bottom: 10px;
            background: var(--notice-bg);
            color: var(--notice-text);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 11px 13px;
        }
        .muted { color: var(--muted); font-size: 13px; font-weight: 500; }
        .cart-list {
            display: grid;
            gap: 12px;
            margin-top: 14px;
        }
        .row {
            display: grid;
            grid-template-columns: 1.4fr auto;
            gap: 12px;
            align-items: center;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--surface-soft);
            padding: 14px;
        }
        .row-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }
        .name { display: flex; flex-direction: column; gap: 4px; }
        .name strong { font-size: 16px; }
        .meta-line { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 3px 8px;
            font-size: 12px;
            color: var(--muted);
            background: var(--surface);
        }
        .actions { display: flex; gap: 8px; align-items: center; }
        input[type="number"] {
            width: 86px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--surface);
            color: var(--text);
            padding: 8px;
        }
        button, a.btn {
            border: 0;
            background: var(--button-bg);
            color: var(--button-text);
            padding: 9px 12px;
            text-decoration: none;
            cursor: pointer;
            border-radius: 8px;
        }
        a.alt { background: var(--button-alt); color: #f5f5f5; }
        .resume {
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            background: var(--surface-soft);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px;
        }
        .resume strong { font-size: 18px; }
        @media (max-width: 820px) {
            .row { grid-template-columns: 1fr; }
            .row-actions { justify-content: flex-start; }
        }
    </style>
</head>
<body>
    @include('partials.store-header', ['cartActive' => true])
    <main>
        <div class="top-actions">
            <a class="btn alt" href="{{ route('home') }}">Seguir comprando</a>
        </div>

        @if (session('status'))
            <div class="notice" data-auto-dismiss="2600">{{ session('status') }}</div>
        @endif
        @if ($errors->any())
            <div class="notice" data-auto-dismiss="2600">{{ $errors->first() }}</div>
        @endif

        <section class="box">
            <h1>Carrito</h1>

            @if (count($items) === 0)
                <p class="muted">No hay productos en el carrito.</p>
            @else
                <div class="cart-list">
                    @foreach ($items as $item)
                        <article class="row">
                            <div class="name">
                                <strong>{{ $item['name'] }}</strong>
                                <div class="meta-line">
                                    <span class="chip">Precio: ${{ number_format((float) $item['price'], 0, ',', '.') }}</span>
                                    <span class="chip">Stock: {{ $item['stock'] }}</span>
                                    <span class="chip">Subtotal: ${{ number_format((float) $item['price'] * (int) $item['quantity'], 0, ',', '.') }}</span>
                                </div>
                            </div>
                            <div class="row-actions">
                                <form class="actions" method="POST" action="{{ route('cart.update', $item['slug']) }}">
                                    @csrf
                                    @method('PATCH')
                                    <input type="number" name="quantity" value="{{ $item['quantity'] }}" min="1">
                                    <button type="submit">Actualizar</button>
                                </form>
                                <form method="POST" action="{{ route('cart.remove', $item['slug']) }}">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit">Quitar</button>
                                </form>
                            </div>
                        </article>
                    @endforeach
                </div>
                <div class="resume">
                    <strong>Total: ${{ number_format($total, 0, ',', '.') }}</strong>
                    <a class="btn" href="{{ route('checkout.form') }}">Continuar con pedido</a>
                </div>
            @endif
        </section>
    </main>
    @include('partials.auto-dismiss-notices')
</body>
</html>
