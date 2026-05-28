<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Alerta de stock</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.5;">
    <h2 style="margin-bottom: 8px;">Alerta de stock en Benjaminduve</h2>

    <p>
        El producto <strong>{{ $product->name }}</strong>
        @if((int) $product->stock === 0)
            se ha <strong>agotado</strong>.
        @else
            esta por agotarse: quedan <strong>{{ $product->stock }}</strong> unidad(es).
        @endif
    </p>

    <ul>
        <li>Producto: {{ $product->name }}</li>
        <li>Slug: {{ $product->slug }}</li>
        <li>Stock actual: {{ $product->stock }}</li>
        <li>Umbral configurado: {{ $threshold }} unidad(es) o menos</li>
        <li>Precio: ${{ number_format((float) $product->price, 0, ',', '.') }}</li>
    </ul>

    <p style="color: #555;">
        Revisa el panel administrativo para reponer stock o desactivar el producto si corresponde.
    </p>
</body>
</html>
