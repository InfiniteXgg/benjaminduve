<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <style>
        :root {
            --bg: #f2f2f2;
            --surface: #ffffff;
            --text: #111111;
            --muted: #666666;
            --border: #d6d6d6;
            --button: #111111;
            --button-text: #ffffff;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
        }

        header {
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 14px 20px;
            font-size: 16px;
            font-weight: 700;
        }

        main {
            max-width: 420px;
            margin: 40px auto;
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 20px;
        }

        h1 {
            margin: 0 0 18px;
            font-size: 18px;
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
            background: #fff;
            color: var(--text);
        }

        button {
            width: 100%;
            padding: 10px;
            border: 0;
            background: var(--button);
            color: var(--button-text);
            cursor: pointer;
        }

        .message {
            margin-top: 14px;
            font-size: 14px;
            color: var(--text);
        }

        .error {
            margin-top: 14px;
            font-size: 14px;
            color: #dc3545
        }
    </style>
</head>
<body>
    <header>
        <center>
            Sistema de acceso: benjaminduve
        <center>
    </header>

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

        @if (session('login_result'))
            <p class="message">{{ session('login_result') }}</p>
        @endif

        @if ($errors->any())
            <p class="error">{{ $errors->first() }}</p>
        @endif
    </main>
</body>
</html>
