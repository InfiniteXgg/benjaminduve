<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benjaminduve | HOME</title>
    <style>
        :root {
            color-scheme: light dark;
            --bg: #e7e7e4;
            --surface: #f5f5f2;
            --surface-soft: #ecece8;
            --text: #171717;
            --muted: #4d4d4d;
            --border: #c7c7c2;
            --dark: #232323;
            --header-start: #141414;
            --header-end: #2f2f2f;
            --toast-bg: #111111;
            --toast-text: #f7f7f7;
        }

        * { box-sizing: border-box; }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #171717;
                --surface: #222222;
                --surface-soft: #2a2a2a;
                --text: #eeeeee;
                --muted: #cecece;
                --border: #3f3f3f;
                --dark: #f2f2f2;
                --header-start: #090909;
                --header-end: #1f1f1f;
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
            padding: 18px 20px;
        }

        .header-wrap {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
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
            transition: 0.2s ease;
        }

        .header-actions a.active {
            background: rgba(255, 255, 255, 0.14);
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
            background: #f7f7f7;
            color: #111111;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
        }

        main {
            max-width: 1100px;
            margin: 24px auto 40px;
            padding: 0 18px;
        }

        .top {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 16px;
        }

        .toast {
            margin-bottom: 14px;
            background: var(--toast-bg);
            color: var(--toast-text);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
            animation: fadeIn 0.25s ease;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .toast.hide {
            opacity: 0;
            transform: translateY(-6px);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .top h2 {
            margin: 0 0 6px;
            font-size: 26px;
        }

        .top p {
            margin: 0;
            color: var(--muted);
            font-weight: 500;
        }

        .search {
            margin-top: 14px;
            display: flex;
            gap: 8px;
        }

        .search input {
            flex: 1;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            padding: 10px;
        }

        .search button {
            border: 0;
            background: var(--dark);
            color: var(--surface);
            padding: 10px 14px;
            cursor: pointer;
        }

        .catalog {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px;
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .placeholder {
            height: 120px;
            border: 1px dashed #bcbcbc;
            border-radius: 8px;
            background: var(--surface-soft);
            color: var(--muted);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .name {
            margin: 0;
            font-size: 17px;
        }

        .description {
            margin: 0;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.4;
            min-height: 54px;
        }

        .meta {
            margin: 0;
            font-weight: 700;
        }

        .actions {
            margin-top: auto;
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        .actions a,
        .actions button {
            text-decoration: none;
            border: 0;
            background: var(--dark);
            color: var(--surface);
            padding: 8px 10px;
            font-size: 13px;
            cursor: pointer;
        }

        .actions form {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .add-flow {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
        }

        .qty-panel {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: wrap;
        }
        .qty-panel[hidden] {
            display: none !important;
        }

        .actions input[type="number"] {
            width: 72px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            padding: 7px;
        }

        .actions a.alt {
            background: #4d4d4d;
        }

        .actions button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .empty {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 18px;
            color: var(--muted);
        }

        .pagination {
            margin-top: 16px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px;
        }

        .hidden-link {
            position: fixed;
            width: 1px;
            height: 1px;
            overflow: hidden;
            opacity: 0;
            pointer-events: none;
        }
    </style>
</head>
<body>
    @include('partials.store-header', ['homeActive' => true])

    <main>
        @if (session('cart_notice'))
            <section id="cart-toast" class="toast">{{ session('cart_notice') }}</section>
        @endif

        <section class="top">
            <h2>Catálogo</h2>
            <p>Explora los productos de Benjaminduve.</p>

            <form class="search" method="GET" action="{{ route('home') }}">
                <input type="text" name="q" value="{{ $search }}" placeholder="Buscar producto...">
                <button type="submit">Buscar</button>
            </form>
        </section>

        @if (session('status'))
            <section class="top" data-auto-dismiss="2600">{{ session('status') }}</section>
        @endif

        @if ($errors->any())
            <section class="top" data-auto-dismiss="2600">{{ $errors->first() }}</section>
        @endif

        @if ($products->count() > 0)
            <section class="catalog">
                @foreach ($products as $product)
                    <article class="card">
                        <div class="placeholder">Placeholder de imagen</div>
                        <h3 class="name">{{ $product->name }}</h3>
                        <p class="description">{{ $product->description ?: 'Sin descripcion aun.' }}</p>
                        <p class="meta">${{ number_format((float) $product->price, 0, ',', '.') }}</p>
                        @if(trim((string) $product->size) !== '' || $product->height_cm || $product->width_cm || $product->depth_cm)
                            <p class="description">
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
                                        | Prof. {{ rtrim(rtrim((string) $product->depth_cm, '0'), '.') }} cm
                                    @endif
                                @endif
                            </p>
                        @endif
                        <p class="description">Stock: {{ $product->stock }}</p>
                        <div class="actions">
                            <a class="alt" href="{{ route('products.show', $product->slug) }}">Ver detalle</a>
                            @if($product->stock > 0)
                                <form class="add-flow" method="POST" action="{{ route('cart.add', $product->slug) }}">
                                    @csrf
                                    <button type="submit" class="show-qty">Agregar</button>
                                    <div class="qty-panel" hidden>
                                        <input type="number" name="quantity" value="1" min="1">
                                    </div>
                                </form>
                            @else
                                <button type="button" disabled>Sin stock</button>
                            @endif
                        </div>
                    </article>
                @endforeach
            </section>
            <section class="pagination">
                {{ $products->links() }}
            </section>
        @else
            <section class="empty">No hay productos.</section>
        @endif
    </main>

    <a class="hidden-link" href="{{ route('login.form') }}" tabindex="-1" aria-hidden="true">acceso</a>
    <script>
        const resetQuantityPanels = () => {
            document.querySelectorAll('.add-flow').forEach((flow) => {
                const qtyPanel = flow.querySelector('.qty-panel');
                const qtyInput = flow.querySelector('input[name="quantity"]');
                if (qtyPanel) {
                    qtyPanel.hidden = true;
                }
                if (qtyInput) {
                    qtyInput.value = '1';
                }
            });
        };

        (() => {
            const toast = document.getElementById('cart-toast');
            if (!toast) return;
            window.setTimeout(() => {
                resetQuantityPanels();
                toast.classList.add('hide');
                window.setTimeout(() => toast.remove(), 320);
            }, 2600);
        })();

        (() => {
            const flows = document.querySelectorAll('.add-flow');
            resetQuantityPanels();
            flows.forEach((flow) => {
                const openBtn = flow.querySelector('.show-qty');
                const qtyPanel = flow.querySelector('.qty-panel');
                const qtyInput = flow.querySelector('input[name="quantity"]');
                if (!openBtn || !qtyPanel || !qtyInput) return;

                openBtn.addEventListener('click', (event) => {
                    if (!qtyPanel.hidden) {
                        return;
                    }

                    event.preventDefault();
                    qtyPanel.hidden = false;
                    qtyInput.focus();
                    qtyInput.select();
                });
            });
        })();
    </script>
    @include('partials.auto-dismiss-notices')
</body>
</html>
