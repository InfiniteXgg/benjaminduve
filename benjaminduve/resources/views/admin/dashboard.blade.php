<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Admin | Benjaminduve</title>
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
            --header-start: #101010;
            --header-end: #2a2a2a;
        }
        * { box-sizing: border-box; }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #171717;
                --surface: #222222;
                --surface-soft: #2a2a2a;
                --text: #eeeeee;
                --muted: #cdcdcd;
                --border: #3f3f3f;
                --dark: #f2f2f2;
                --header-start: #090909;
                --header-end: #1f1f1f;
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
            padding: 16px 22px;
        }
        .header-wrap {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .admin-brand {
            display: inline-flex;
            align-items: center;
            color: #fff;
            line-height: 0;
        }
        .admin-brand svg {
            display: block;
            width: 122px;
            height: 44px;
        }
        .admin-brand-text {
            font-size: 14px;
            font-weight: 600;
            margin-left: 2px;
        }
        .tab-link {
            border: 1px solid #7a7a7a;
            color: #fff;
            text-decoration: none;
            padding: 7px 10px;
            font-size: 13px;
        }
        .tab-link.active {
            border-color: #fff;
            box-shadow: inset 0 0 0 1px #fff;
        }
        header form button {
            border: 1px solid #8b8b8b;
            background: transparent;
            color: #fff;
            padding: 8px 10px;
            cursor: pointer;
        }
        main {
            max-width: 1200px;
            margin: 22px auto;
            padding: 0 18px;
            display: grid;
            grid-template-columns: 1.2fr 1.8fr;
            gap: 14px;
        }
        .panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            overflow: hidden;
        }
        .panel-head {
            background: var(--surface-soft);
            border-bottom: 1px solid var(--border);
            padding: 13px 14px;
            font-weight: 700;
        }
        .panel-body { padding: 14px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 12px;
        }
        .stat {
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 10px;
        }
        .stat .label { font-size: 12px; color: var(--muted); }
        .stat .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
        .group { margin-bottom: 10px; }
        label { display: block; font-size: 13px; margin-bottom: 4px; }
        input, textarea {
            width: 100%;
            border: 1px solid var(--border);
            padding: 9px;
            font-size: 14px;
            background: var(--surface);
            color: var(--text);
        }
        textarea { min-height: 90px; resize: vertical; }
        .check { display: flex; align-items: center; gap: 8px; }
        .check input { width: auto; }
        button, .btn {
            border: 0;
            background: var(--dark);
            color: var(--surface);
            padding: 7px 10px;
            font-size: 12px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .btn.alt { background: #5c5c5c; color: #f5f5f5; }
        .note { color: var(--muted); font-size: 13px; font-weight: 500; }
        .inline {
            display: grid;
            grid-template-columns:
                minmax(220px, 2fr)
                minmax(180px, 1.6fr)
                minmax(90px, 0.8fr)
                minmax(90px, 0.8fr)
                minmax(90px, 0.8fr)
                minmax(90px, 0.8fr)
                minmax(90px, 0.8fr)
                minmax(90px, 0.8fr)
                auto
                auto;
            gap: 5px;
            align-items: center;
        }
        .inline input { padding: 6px; font-size: 11px; }
        .inline textarea {
            padding: 6px;
            font-size: 11px;
            min-height: 56px;
            resize: vertical;
        }
        .inline .check { margin: 0; }
        .inline .field-name,
        .inline .field-slug {
            min-width: 0;
        }
        .inline .full { grid-column: 1 / -1; }
        .inline .field-save {
            white-space: nowrap;
        }
        .alerts { margin-bottom: 10px; }
        .alert { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 10px; margin-bottom: 6px; }
        .recent li { padding: 7px 0; border-bottom: 1px solid var(--border); }
        .recent li:last-child { border-bottom: 0; }
        .section-card {
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--surface-soft);
            padding: 12px;
            margin-bottom: 10px;
        }
        .order-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 10px;
        }
        .order-card {
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px;
            background: var(--surface);
        }
        .order-card p {
            margin: 0 0 6px;
            font-size: 13px;
            color: var(--muted);
            font-weight: 500;
        }
        .order-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 8px;
        }
        .order-actions button {
            padding: 6px 9px;
            font-size: 11px;
        }
        .order-actions .btn-alt {
            background: #5c5c5c;
            color: #f5f5f5;
        }
        .status-chip {
            display: inline-block;
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 3px 8px;
            font-size: 11px;
            margin-right: 6px;
        }
        .status-chip.pending {
            background: rgba(128, 128, 128, 0.12);
        }
        .status-chip.success {
            border-color: #2f8a3e;
            color: #1f6e2f;
            background: rgba(47, 138, 62, 0.12);
        }
        .status-chip.danger {
            border-color: #9d3b3b;
            color: #8a2d2d;
            background: rgba(157, 59, 59, 0.12);
        }
        @media (prefers-color-scheme: dark) {
            .status-chip.success {
                color: #9ae1a7;
                border-color: #5ea56a;
                background: rgba(70, 145, 82, 0.24);
            }
            .status-chip.danger {
                color: #f2b0b0;
                border-color: #a95d5d;
                background: rgba(169, 93, 93, 0.24);
            }
        }
        .recent-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .recent-meta {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 4px;
        }
        .product-item {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 6px;
            align-items: start;
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
        }
        .product-item:last-of-type {
            border-bottom: 0;
        }
        .product-delete {
            margin: 0;
        }
        .product-delete .btn {
            padding: 6px 9px;
        }
        .order-filters {
            display: grid;
            grid-template-columns: 1.4fr 1fr 1fr auto auto;
            gap: 8px;
            margin-bottom: 10px;
            align-items: end;
        }
        .order-filters input {
            padding: 8px;
            font-size: 12px;
        }
        .order-filters .small-btn {
            padding: 8px 9px;
            font-size: 12px;
            white-space: nowrap;
        }
        .product-filters {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 8px;
            margin-bottom: 10px;
            align-items: end;
        }
        .product-filters input {
            padding: 8px;
            font-size: 12px;
        }
        .product-filters .small-btn {
            padding: 8px 9px;
            font-size: 12px;
            white-space: nowrap;
        }
        @media (max-width: 980px) {
            main { grid-template-columns: 1fr; }
            .stats { grid-template-columns: 1fr; }
            .inline { grid-template-columns: 1fr; }
            .inline .full { grid-column: 1 / -1; }
            .product-item { grid-template-columns: 1fr; }
            .order-filters { grid-template-columns: 1fr; }
            .product-filters { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-wrap">
            <div class="header-left">
                <span class="admin-brand" aria-label="Benjaminduve Panel administrativo" title="Panel administrativo">
                    <svg viewBox="0 0 320 120" aria-hidden="true" focusable="false" width="122" height="44">
                        <rect x="0" y="0" width="320" height="120" fill="none"></rect>
                        <path d="M28 60c0-23 15-38 44-38h22v76H72c-29 0-44-15-44-38Z" fill="none" stroke="currentColor" stroke-width="10"></path>
                        <path d="M128 22h64v76h-64z" fill="none" stroke="currentColor" stroke-width="10"></path>
                        <path d="M160 22c16 0 16 76 0 76s-16-76 0-76Z" fill="currentColor"></path>
                        <path d="M226 22h22c29 0 44 15 44 38s-15 38-44 38h-22z" fill="none" stroke="currentColor" stroke-width="10"></path>
                        <path d="M8 60c0-13 4-23 11-31M312 60c0-13-4-23-11-31M8 60c0 13 4 23 11 31M312 60c0 13-4 23-11 31" fill="none" stroke="currentColor" stroke-width="6"></path>
                        <text x="160" y="114" text-anchor="middle" font-size="20" letter-spacing="2" fill="currentColor">BENJAMIN DUVE</text>
                    </svg>
                </span>
                <span class="admin-brand-text">Panel administrativo</span>
                <a class="tab-link {{ $tab === 'products' ? 'active' : '' }}" href="{{ route('admin.dashboard', ['tab' => 'products']) }}">Productos</a>
                <a class="tab-link {{ $tab === 'orders' ? 'active' : '' }}" href="{{ route('admin.dashboard', ['tab' => 'orders']) }}">Pedidos</a>
            </div>
            <form method="POST" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit">Cerrar sesion</button>
            </form>
        </div>
    </header>

    <main>
        <section class="panel">
            <div class="panel-head">Control general</div>
            <div class="panel-body">
                <div class="stats">
                    <div class="stat">
                        <div class="label">Productos totales</div>
                        <div class="value">{{ $productCount }}</div>
                    </div>
                    <div class="stat">
                        <div class="label">Productos activos</div>
                        <div class="value">{{ $activeProductCount }}</div>
                    </div>
                    <div class="stat">
                        <div class="label">Pedidos</div>
                        <div class="value">{{ $orderCount }}</div>
                    </div>
                </div>

                @if ($tab === 'products')
                    <p class="note">Aqui se pueden agregar, editar o eliminar productos. Todo se reflejara en el HOME y catalogo.</p>

                    <form method="POST" action="{{ route('admin.products.store') }}">
                        @csrf
                        <div class="group">
                            <label for="name">Nombre</label>
                            <input id="name" type="text" name="name" required>
                        </div>
                        <div class="group">
                            <label for="description">Descripcion</label>
                            <textarea id="description" name="description"></textarea>
                        </div>
                        <div class="group">
                            <label for="size">Tamano</label>
                            <input id="size" type="text" name="size" placeholder="Ej: S, M, L o Unico">
                        </div>
                        <div class="group">
                            <label for="height_cm">Altura (cm)</label>
                            <input id="height_cm" type="number" step="0.01" min="0" name="height_cm">
                        </div>
                        <div class="group">
                            <label for="width_cm">Ancho (cm)</label>
                            <input id="width_cm" type="number" step="0.01" min="0" name="width_cm">
                        </div>
                        <div class="group">
                            <label for="depth_cm">Profundidad (cm)</label>
                            <input id="depth_cm" type="number" step="0.01" min="0" name="depth_cm">
                        </div>
                        <div class="group">
                            <label for="price">Precio</label>
                            <input id="price" type="number" step="0.01" min="0" name="price" required>
                        </div>
                        <div class="group">
                            <label for="stock">Stock</label>
                            <input id="stock" type="number" min="0" name="stock" required>
                        </div>
                        <div class="group check">
                            <input id="is_active" type="checkbox" name="is_active" value="1" checked>
                            <label for="is_active">Publicado en catalogo</label>
                        </div>
                        <button type="submit">Crear producto</button>
                    </form>
                @else
                    <form class="order-filters" method="GET" action="{{ route('admin.dashboard') }}">
                        <input type="hidden" name="tab" value="orders">
                        <input type="text" name="order_q" value="{{ $orderSearch }}" placeholder="Buscar por cliente, correo, estado o ID">
                        <input type="date" name="date_from" value="{{ $dateFrom }}">
                        <input type="date" name="date_to" value="{{ $dateTo }}">
                        <button class="small-btn" type="submit">Filtrar</button>
                        <a class="btn alt small-btn" href="{{ route('admin.dashboard', ['tab' => 'orders']) }}">Limpiar</a>
                    </form>
                    <div class="section-card">
                        <p class="note">La pestana de pedidos solo esta disponible para administrador desde este panel.</p>
                        <p class="note">Aqui puedes revisar estados de pago y resumen general de cada compra.</p>
                    </div>
                    <div class="order-grid">
                        @forelse($orders as $order)
                            <article class="order-card">
                                <p><strong>Pedido #{{ $order->id }}</strong></p>
                                <p>{{ $order->customer_name }} ({{ $order->customer_email }})</p>
                                <p>
                                    <span class="status-chip {{ $order->review_status_tone }}">Revision: {{ $order->review_status_label }}</span>
                                    <span class="status-chip {{ $order->status_tone }}">{{ $order->status_label }}</span>
                                    <span class="status-chip {{ $order->payment_status_tone }}">{{ $order->payment_status_label }}</span>
                                </p>
                                <p>Items: {{ $order->items_count }}</p>
                                <p>Metodo de pago: {{ $order->payment_method_label }}</p>
                                <p>Total: ${{ number_format((float) $order->total, 0, ',', '.') }}</p>
                                <p>Fecha: {{ $order->created_at?->format('d/m/Y H:i') }}</p>
                                <div class="order-actions">
                                    @if($order->admin_review_status === 'pending' && $order->payment_status === 'prototype_submitted')
                                        <form method="POST" action="{{ route('admin.orders.accept', $order) }}">
                                            @csrf
                                            <button type="submit">Aceptar</button>
                                        </form>
                                        <form method="POST" action="{{ route('admin.orders.reject', $order) }}">
                                            @csrf
                                            <button class="btn-alt" type="submit">Rechazar</button>
                                        </form>
                                    @elseif($order->admin_review_status === 'pending')
                                        <span class="note">Esperando pago enviado por cliente</span>
                                    @else
                                        <span class="note">Decision ya registrada</span>
                                    @endif
                                </div>
                            </article>
                        @empty
                            <p class="note">Sin pedidos registrados por ahora.</p>
                        @endforelse
                    </div>
                    <div style="margin-top: 10px;">
                        {{ $orders->appends(['tab' => 'orders'])->links() }}
                    </div>
                @endif
            </div>
        </section>

        <section style="display: grid; gap: 14px;">
            <div class="alerts">
                @if (session('status'))
                    <div class="alert" data-auto-dismiss="2600">{{ session('status') }}</div>
                @endif
                @if ($errors->any())
                    <div class="alert" data-auto-dismiss="2600">{{ $errors->first() }}</div>
                @endif
            </div>

            @if ($tab === 'products')
                <article class="panel">
                    <div class="panel-head">Productos (editar / eliminar)</div>
                    <div class="panel-body">
                        <form class="product-filters" method="GET" action="{{ route('admin.dashboard') }}">
                            <input type="hidden" name="tab" value="products">
                            <input type="text" name="product_q" value="{{ $productSearch }}" placeholder="Buscar por nombre, descripcion o talla">
                            <button class="small-btn" type="submit">Buscar</button>
                            <a class="btn alt small-btn" href="{{ route('admin.dashboard', ['tab' => 'products']) }}">Limpiar</a>
                        </form>

                        @forelse($products as $product)
                            <div class="product-item">
                                <form class="inline" method="POST" action="{{ route('admin.products.update', $product) }}">
                                    @csrf
                                    @method('PUT')
                                    <input class="field-name" type="text" name="name" value="{{ $product->name }}" required>
                                    <input class="field-slug" type="text" name="slug" value="{{ $product->slug }}" required>
                                    <input type="text" name="size" value="{{ $product->size }}" placeholder="Tamano">
                                    <input type="number" step="0.01" min="0" name="height_cm" value="{{ $product->height_cm }}" placeholder="Altura cm">
                                    <input type="number" step="0.01" min="0" name="width_cm" value="{{ $product->width_cm }}" placeholder="Ancho cm">
                                    <input type="number" step="0.01" min="0" name="depth_cm" value="{{ $product->depth_cm }}" placeholder="Profundidad cm">
                                    <input type="number" step="0.01" min="0" name="price" value="{{ $product->price }}" required>
                                    <input type="number" min="0" name="stock" value="{{ $product->stock }}" required>
                                    <label class="check">
                                        <input type="checkbox" name="is_active" value="1" {{ $product->is_active ? 'checked' : '' }}>
                                        Activo
                                    </label>
                                    <textarea class="full" name="description" placeholder="Descripcion">{{ $product->description }}</textarea>
                                    <button class="field-save" type="submit">Guardar</button>
                                </form>
                                <form class="product-delete" method="POST" action="{{ route('admin.products.delete', $product) }}">
                                    @csrf
                                    @method('DELETE')
                                    <button class="btn alt" type="submit">Eliminar</button>
                                </form>
                            </div>
                        @empty
                            <p class="note">No hay productos cargados.</p>
                        @endforelse

                        <div style="margin-top: 10px;">{{ $products->appends(['tab' => 'products', 'product_q' => $productSearch])->links() }}</div>
                    </div>
                </article>
            @endif
        </section>
    </main>
    @include('partials.auto-dismiss-notices')
</body>
</html>
