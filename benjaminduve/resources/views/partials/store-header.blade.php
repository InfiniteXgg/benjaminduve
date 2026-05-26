<header>
    <div class="header-wrap">
        <h1 class="header-title">
            <a href="{{ route('home') }}" class="brand-logo" aria-label="Benjaminduve Home" title="Benjaminduve">
                <svg viewBox="0 0 320 120" aria-hidden="true" focusable="false" width="130" height="48">
                    <rect x="0" y="0" width="320" height="120" fill="none"></rect>
                    <path d="M28 60c0-23 15-38 44-38h22v76H72c-29 0-44-15-44-38Z" fill="none" stroke="currentColor" stroke-width="10"></path>
                    <path d="M128 22h64v76h-64z" fill="none" stroke="currentColor" stroke-width="10"></path>
                    <path d="M160 22c16 0 16 76 0 76s-16-76 0-76Z" fill="currentColor"></path>
                    <path d="M226 22h22c29 0 44 15 44 38s-15 38-44 38h-22z" fill="none" stroke="currentColor" stroke-width="10"></path>
                    <path d="M8 60c0-13 4-23 11-31M312 60c0-13-4-23-11-31M8 60c0 13 4 23 11 31M312 60c0 13-4 23-11 31" fill="none" stroke="currentColor" stroke-width="6"></path>
                    <text x="160" y="114" text-anchor="middle" font-size="20" letter-spacing="2" fill="currentColor">BENJAMIN DUVE</text>
                </svg>
            </a>
        </h1>
        <nav class="header-actions">
            <a href="{{ route('home') }}" class="{{ ($homeActive ?? false) ? 'active' : '' }}">HOME</a>
            @php
                $highlightCart = ($cartActive ?? false) || session('cart_added');
            @endphp
            <a href="{{ route('cart.index') }}" class="cart-link {{ $highlightCart ? 'active-cart' : '' }}">
                Carrito
                @if (($cartDistinctCount ?? 0) > 0)
                    <span class="cart-badge">{{ $cartDistinctCount }}</span>
                @endif
            </a>
            <a
                href="https://instagram.com/benjaminduve"
                class="instagram-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Benjaminduve"
                title="@benjaminduve"
            >
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                >
                    <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                    <circle cx="12" cy="12" r="4.1"></circle>
                    <circle cx="17.6" cy="6.4" r="1.1"></circle>
                </svg>
            </a>
        </nav>
    </div>
</header>
