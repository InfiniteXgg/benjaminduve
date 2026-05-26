<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $product->name }} | Benjaminduve</title>
    <style>
        :root {
            color-scheme: light dark;
            --bg: #e7e7e4;
            --surface: #f5f5f2;
            --text: #171717;
            --muted: #4d4d4d;
            --border: #c7c7c2;
            --header-start: #141414;
            --header-end: #2f2f2f;
            --button-bg: #232323;
            --button-text: #f5f5f2;
            --button-alt: #4d4d4d;
            --toast-bg: #111111;
            --toast-text: #f7f7f7;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #171717;
                --surface: #222222;
                --text: #eeeeee;
                --muted: #cdcdcd;
                --border: #3f3f3f;
                --header-start: #090909;
                --header-end: #1f1f1f;
                --button-bg: #f2f2f2;
                --button-text: #171717;
                --button-alt: #5f5f5f;
                --toast-bg: #f2f2f2;
                --toast-text: #171717;
            }
        }

        body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
        }
        header {
            background: linear-gradient(90deg, var(--header-start) 0%, var(--header-end) 100%);
            color: #fff;
            border-bottom: 1px solid #000;
            padding: 16px 20px;
        }
        .header-wrap {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
        }
        .header-title {
            margin: 0;
            line-height: 0;
        }
        .header-title a {
            color: inherit;
            text-decoration: none;
        }
        .brand-logo {
            display: inline-flex;
            align-items: center;
            color: #fff;
        }
        .brand-logo svg {
            display: block;
            width: 130px;
            height: 48px;
        }
        .header-actions {
            display: flex;
            gap: 8px;
        }
        .header-actions a {
            color: #fff;
            text-decoration: none;
            border: 1px solid #5c5c5c;
            padding: 8px 10px;
            font-size: 13px;
            position: relative;
        }
        .header-actions a.active-cart {
            border-color: #fff;
            box-shadow: inset 0 0 0 1px #fff;
        }
        .header-actions .instagram-btn {
            width: 35px;
            height: 35px;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .cart-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            min-width: 18px;
            height: 18px;
            border-radius: 999px;
            background: #fff;
            color: #111;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
        }
        main {
            max-width: 900px;
            margin: 24px auto;
            padding: 0 18px;
        }
        .box {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 18px;
        }
        .placeholder {
            height: 240px;
            border: 1px dashed var(--border);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.04);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--muted);
            margin-bottom: 14px;
        }
        .price {
            font-size: 24px;
            font-weight: 700;
            margin: 8px 0;
        }
        .muted {
            color: var(--muted);
            font-weight: 500;
        }
        .actions {
            margin-top: 16px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .actions a,
        .actions button {
            border: 0;
            text-decoration: none;
            background: var(--button-bg);
            color: var(--button-text);
            padding: 10px 12px;
            cursor: pointer;
        }
        .actions a.alt {
            background: var(--button-alt);
            color: #f5f5f5;
        }
        input[type="number"] {
            width: 90px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            padding: 9px;
        }
        .toast {
            background: var(--toast-bg);
            color: var(--toast-text);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 12px;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .toast.hide {
            opacity: 0;
            transform: translateY(-6px);
        }
    </style>
</head>
<body>
    @include('partials.store-header', ['cartActive' => session('cart_added') ? true : false])
    <main>
        @if (session('status'))
            <section class="toast" data-auto-dismiss="2600">{{ session('status') }}</section>
        @endif

        @if ($errors->any())
            <section class="toast" data-auto-dismiss="2600">{{ $errors->first() }}</section>
        @endif

        @if (session('cart_notice'))
            <section id="cart-toast" class="toast">{{ session('cart_notice') }}</section>
        @endif

        <article class="box">
            <div class="placeholder">Placeholder de imagen de producto</div>
            <h1>{{ $product->name }}</h1>
            <p class="price">${{ number_format((float) $product->price, 0, ',', '.') }}</p>
            <p class="muted">{{ $product->description ?: 'Sin descripcion disponible.' }}</p>
            @if(trim((string) $product->size) !== '' || $product->height_cm || $product->width_cm || $product->depth_cm)
                <p class="muted">
                    Medidas:
                    @if(trim((string) $product->size) !== '')
                        Talla {{ $product->size }}
                    @else
                        @if($product->height_cm)
                            Alto {{ rtrim(rtrim((string) $product->height_cm, '0'), '.') }} cm
                        @endif
                        @if($product->width_cm)
                            | Ancho {{ rtrim(rtrim((string) $product->width_cm, '0'), '.') }} cm
                        @endif
                        @if($product->depth_cm)
                            | Profundidad {{ rtrim(rtrim((string) $product->depth_cm, '0'), '.') }} cm
                        @endif
                    @endif
                </p>
            @endif
            <p class="muted">Stock disponible: {{ $product->stock }}</p>

            <div class="actions">
                <a class="alt" href="{{ route('home') }}">Volver al catalogo</a>
                <form method="POST" action="{{ route('cart.add', $product->slug) }}">
                    @csrf
                    <input type="number" name="quantity" value="1" min="1">
                    <button type="submit">Agregar al carrito</button>
                </form>
            </div>
        </article>
    </main>
    <script>
        (() => {
            const toast = document.getElementById('cart-toast');
            if (!toast) return;
            window.setTimeout(() => {
                toast.classList.add('hide');
                window.setTimeout(() => toast.remove(), 320);
            }, 2600);
        })();
    </script>
    @include('partials.auto-dismiss-notices')
</body>
</html>
