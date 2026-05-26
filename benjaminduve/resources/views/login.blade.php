<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso Interno</title>
    <style>
        :root {
            color-scheme: light dark;
            --bg: #e7e7e4;
            --surface: #f5f5f2;
            --text: #171717;
            --muted: #4d4d4d;
            --border: #c7c7c2;
            --dark: #232323;
            --error: #8e1e1e;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #171717;
                --surface: #222222;
                --text: #eeeeee;
                --muted: #cdcdcd;
                --border: #3f3f3f;
                --dark: #f2f2f2;
                --error: #ff8888;
            }
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
            background: linear-gradient(90deg, #121212 0%, #2a2a2a 100%);
            border-bottom: 1px solid #000;
            color: #fff;
            padding: 16px 20px;
            font-weight: 700;
        }

        main {
            max-width: 430px;
            margin: 48px auto;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 22px;
        }

        h1 {
            margin: 0 0 16px;
            font-size: 20px;
        }

        .group {
            margin-bottom: 12px;
        }

        label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
        }

        input {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            font-size: 14px;
        }

        button {
            width: 100%;
            margin-top: 6px;
            padding: 10px;
            border: 0;
            background: var(--dark);
            color: var(--surface);
            cursor: pointer;
        }

        .error {
            margin-top: 12px;
            color: var(--error);
            font-size: 14px;
        }
    </style>
</head>
<body>
    <header>Benjaminduve | Acceso interno</header>

    <main>
        <h1>Login</h1>

        <form method="POST" action="{{ route('login.submit') }}">
            @csrf
            <div class="group">
                <label for="email">Correo</label>
                <input id="email" type="email" name="email" value="{{ old('email') }}" required>
            </div>

            <div class="group">
                <label for="password">Contrasena</label>
                <input id="password" type="password" name="password" required>
            </div>

            <button type="submit">Ingresar</button>
        </form>

        @if ($errors->any())
            <p class="error" data-auto-dismiss="2600">{{ $errors->first() }}</p>
        @endif
    </main>
    @include('partials.auto-dismiss-notices')
</body>
</html>
