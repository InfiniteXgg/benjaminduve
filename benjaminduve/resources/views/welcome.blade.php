<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benjaminduve</title>
    <style>
        :root {
            --bg: #ececec;
            --surface: #ffffff;
            --surface-soft: #f7f7f7;
            --text: #101010;
            --muted: #6b6b6b;
            --border: #d8d8d8;
            --dark: #1a1a1a;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
        }

        header {
            background: linear-gradient(90deg, #111111 0%, #2a2a2a 100%);
            color: #fff;
            border-bottom: 1px solid #000;
            padding: 18px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .brand {
            margin: 0;
            font-size: 22px;
            letter-spacing: 0.4px;
        }

        .tagline {
            margin: 0;
            font-size: 13px;
            color: #cfcfcf;
        }

        main {
            max-width: 980px;
            margin: 48px auto;
            padding: 0 18px;
        }

        .hero {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
        }

        .hero-head {
            padding: 28px;
            background: var(--surface-soft);
            border-bottom: 1px solid var(--border);
        }

        .hero h2 {
            margin: 0;
            font-size: 28px;
        }

        .hero p {
            margin: 10px 0 0;
            color: var(--muted);
            line-height: 1.5;
        }

        .placeholder-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
            padding: 20px;
        }

        .placeholder-card {
            border: 1px solid var(--border);
            background: #fff;
            border-radius: 10px;
            padding: 16px;
            min-height: 110px;
        }

        .placeholder-card h3 {
            margin: 0 0 8px;
            font-size: 16px;
        }

        .placeholder-card p {
            margin: 0;
            font-size: 14px;
            color: var(--muted);
            line-height: 1.4;
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
    <header>
        <h1 class="brand">Benjaminduve</h1>
        <p class="tagline">Catalogo en construccion</p>
    </header>

    <main>
        <section class="hero">
            <div class="hero-head">
                <h2>HOME</h2>
                <p>
                    Placeholder: aqui ira la presentacion principal del sitio, con imagenes,
                    productos destacados, promociones y contenido visual oficial.
                </p>
            </div>

            <div class="placeholder-grid">
                <article class="placeholder-card">
                    <h3>Modulo de productos</h3>
                    <p>Espacio reservado para cards de productos y filtros.</p>
                </article>
                <article class="placeholder-card">
                    <h3>Novedades</h3>
                    <p>Seccion temporal para anuncios y contenido editorial.</p>
                </article>
                <article class="placeholder-card">
                    <h3>Assets pendientes</h3>
                    <p>
                        Aun no hay assets oficiales. Este bloque es solo referencia
                        visual minimalista.
                    </p>
                </article>
            </div>
        </section>
    </main>

    <a class="hidden-link" href="{{ route('login.form') }}" tabindex="-1" aria-hidden="true">acceso</a>
</body>
</html>
