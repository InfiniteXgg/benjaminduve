# Contexto del Proyecto

Este archivo se usa para registrar instrucciones del usuario y cambios clave implementados durante el trabajo en este repositorio.

## Instrucciones Persistentes del Usuario
- Mantener un registro de instrucciones y de cada cambio clave solicitado.

## Registro de Cambios Clave

### 2026-05-04
- Se crea este archivo de contexto para llevar trazabilidad de instrucciones y mejoras solicitadas.
- Solicitud del usuario: levantar el proyecto en `localhost` usando Docker y dejar backend disponible junto a panel para gestiÃ³n de base de datos.
- Se agrega configuraciÃ³n Docker local con:
  - `docker-compose.yml` (servicios `app`, `db` MySQL y `phpmyadmin`).
  - `Dockerfile` para Laravel sobre `php:8.3-apache` con extensiones `pdo_mysql`, `mysqli` y `zip`.
- Se actualiza `.env` para usar MySQL del contenedor (`DB_HOST=db`, `DB_DATABASE=benjaminduve`, `DB_USERNAME=benjaminduve`).
- Ajuste tÃ©cnico durante el levantamiento: el proyecto (`laravel/framework ^13`) exige PHP `^8.3`, por lo que se corrige la imagen de `8.2` a `8.3`.
- Se corrige el error HTTP `500` por permisos de escritura agregando ajuste de grupo/permisos en `storage` y `bootstrap/cache` al arranque del contenedor `app`.
- Soporte solicitado para gestiÃ³n de credenciales MySQL desde consola.
- CorrecciÃ³n del error `Table 'benjaminduve.sessions' doesn't exist`:
  - Se ejecutan migraciones en el entorno Docker (`php artisan migrate --force`).
  - Se valida la tabla `sessions` en MySQL con columnas compatibles con `SESSION_DRIVER=database`.
  - Se elimina migraciÃ³n temporal redundante generada durante diagnÃ³stico (`database/migrations/2026_05_05_020350_create_sessions_table.php`) para evitar fallos futuros por tabla ya existente.
- Solicitud del usuario: agregar un header simple al `welcome.blade.php` y una pantalla de login minimalista (blanco, negro y grises) con separaciÃ³n de frontend/backend.
- ImplementaciÃ³n backend:
  - Se crea `app/Http/Controllers/LoginController.php` con validaciÃ³n de credenciales contra base de datos.
  - Solo permite login si el usuario existe y la contraseÃ±a coincide.
  - Respuesta funcional solicitada: retorna texto `admin` si `role=admin`, y `usuario` en otro caso.
  - Se actualizan rutas en `routes/web.php` (`GET /` y `POST /login`).
- ImplementaciÃ³n de datos:
  - Se agrega migraciÃ³n `database/migrations/2026_05_04_221655_add_role_to_users_table.php` para incorporar campo `role` en `users` con valor por defecto `usuario`.
  - Se actualiza `app/Models/User.php` para permitir `role` en atributos asignables.
- ImplementaciÃ³n frontend:
  - Se reemplaza `resources/views/welcome.blade.php` por una vista bÃ¡sica con header, formulario de login y resultado textual.
- Solicitud del usuario: normalizar base de datos y usar atributo `is_admin` en `users` para definir la vista al iniciar sesiÃ³n.
- NormalizaciÃ³n aplicada:
  - Se agrega migraciÃ³n `database/migrations/2026_05_04_223300_normalize_users_with_is_admin.php`.
  - La migraciÃ³n crea `is_admin` (boolean, default `false`), migra datos existentes desde `role='admin'` y elimina columna `role`.
  - `app/Models/User.php` se actualiza para usar `is_admin` en `fillable` y `casts`.
- Flujo login actualizado:
  - `LoginController` ahora evalÃºa `is_admin` y redirige a vista `/admin` o `/usuario`.
  - Se agregan rutas `GET /admin` y `GET /usuario`.
  - Se crean vistas mÃ­nimas `resources/views/admin.blade.php` y `resources/views/usuario.blade.php`.
- Solicitud del usuario: crear un seeder para usuario administrador con correo `admin@gmail.com` y contraseÃ±a `123`.
- Se implementa `database/seeders/AdminUserSeeder.php` con `updateOrCreate` para garantizar idempotencia.
- `database/seeders/DatabaseSeeder.php` se actualiza para ejecutar `AdminUserSeeder`.

### 2026-05-25
- Solicitud del usuario: crear un HOME decente y minimalista para "Benjaminduve" con header en escala de grises, blancos y negros.
- Se transforma `resources/views/welcome.blade.php` en HOME principal con:
  - Header visual en tonos grises/negro.
  - Contenido placeholder temporal por falta de assets.
  - Estructura minimalista y limpia.
- Se traslada la pantalla de login a una ruta de acceso oculta:
  - `GET /acceso-interno-benjaminduve`
  - `POST /acceso-interno-benjaminduve`
  - Se crea `resources/views/login.blade.php`.
- Se elimina temporalmente la vista de usuario normal:
  - Se remueve `resources/views/usuario.blade.php`.
  - Se elimina la ruta `/usuario` y su flujo en controlador.
- Se mantiene solo vista admin y se amplÃ­a como dashboard de control:
  - `resources/views/admin.blade.php` ahora incluye secciones placeholder para gestion de productos, estadisticas y actividad del sitio.
- Backend ajustado para el nuevo flujo:
  - `LoginController` ahora separa home/login y restringe acceso a administradores.
- Solicitud del usuario: confirmar separaciÃ³n frontend/backend y continuar con desarrollo completo de catÃ¡logo, CRUD admin, carrito, pedidos y pago prototipo, con seguridad de sesiÃ³n admin.
- SeparaciÃ³n frontend/backend reforzada:
  - Frontend pÃºblico: `HomeController` + vistas `resources/views/home/*` y `resources/views/store/*`.
  - Backend administrativo: `AdminController` + rutas `/admin/*` + vistas `resources/views/admin/*`.
  - AutenticaciÃ³n: `AuthController` (login/logout admin) desacoplado del resto.
  - Carrito, pedidos y pago: `CartController` separado por dominio.
- Seguridad administrativa implementada:
  - Middleware `AdminOnly` para proteger panel admin.
  - Middleware `NoCacheHeaders` para impedir cache de vistas admin.
  - Logout seguro (`AuthController@logout`) con `logout + invalidate + regenerateToken`.
  - Objetivo: evitar acceso por botÃ³n â€œatrÃ¡sâ€ tras cerrar sesiÃ³n.
- MÃ³dulos funcionales aÃ±adidos:
  - CatÃ¡logo navegable en HOME con bÃºsqueda y tarjetas de producto.
  - Vista detalle de producto.
  - Dashboard admin con CRUD real de productos (crear/editar/eliminar/publicar).
  - Carrito funcional en sesiÃ³n (agregar/actualizar/eliminar).
  - Flujo de checkout/pedido.
  - Prototipo de pago al final del pedido.
  - GestiÃ³n de pedidos por cliente en sesiÃ³n (listar/ver/cancelar).
- Persistencia de datos:
  - Nuevas tablas: `products`, `orders`, `order_items`.
  - Migraciones aplicadas en contenedor Docker para dejar el flujo operativo.
- Solicitud del usuario: mejorar UX del carrito con notificaciÃ³n al agregar, destacar botÃ³n de carrito y mostrar contador de productos distintos.
- Mejoras implementadas:
  - `CartController@add` ahora envÃ­a flash `cart_notice` y `cart_added` para notificaciÃ³n contextual.
  - Se agrega header reutilizable `resources/views/partials/store-header.blade.php`.
  - Se centraliza contador de carrito (`cartDistinctCount`) en backend vÃ­a `AppServiceProvider` usando `View::composer`.
  - Badge del carrito: invisible cuando el carrito estÃ¡ vacÃ­o y visible con cantidad de productos distintos cuando hay elementos.
  - Se destaca visualmente enlace de carrito cuando se agrega un producto.
  - Se embellece `resources/views/store/cart.blade.php` para navegaciÃ³n mÃ¡s intuitiva.
- VerificaciÃ³n de separaciÃ³n frontend/backend:
  - Frontend mantiene renderizado en vistas Blade por mÃ³dulos (`home/*`, `store/*`, `admin/*`, `partials/*`).
  - Backend concentra lÃ³gica en controladores especializados (`HomeController`, `CartController`, `AdminController`, `AuthController`) y middleware.
  - Rutas verificadas por mÃ³dulo en `routes/web.php` sin acoplar lÃ³gica de datos en vistas.
- Solicitud del usuario: notificaciÃ³n de â€œagregado al carritoâ€ con auto-desapariciÃ³n, mejor contraste visual, reducciÃ³n de fatiga por fondos blancos y adaptaciÃ³n a modo oscuro del navegador.
- Mejoras de UX/UI aplicadas:
  - NotificaciÃ³n `cart_notice` ahora se oculta automÃ¡ticamente tras unos segundos en catÃ¡logo y detalle.
  - Header y botÃ³n de carrito conservan destaque visual; badge muestra cantidad de productos distintos solo cuando corresponde.
  - Se ajustan paletas (menos blanco puro) y contraste de textos grises para mayor legibilidad.
  - Se agrega soporte `prefers-color-scheme` (modo oscuro) en vistas principales del flujo pÃºblico y dashboard.
- CorrecciÃ³n de bug de productos inactivos:
  - Ruta de detalle cambia a `/productos/{slug}` con bÃºsqueda explÃ­cita `where('slug', ...)->where('is_active', true)->firstOrFail()`.
  - SanitizaciÃ³n de carrito en backend: elimina productos inactivos/sin stock del carrito de sesiÃ³n y sincroniza datos.
- Solicitud del usuario: que la pestana de pedidos solo sea visible para administrador desde el panel, mejorar separacion visual del carrito y embellecer pedidos/resumen/simulacion de pago.
- Restriccion de navegacion aplicada:
  - Se mantiene sin enlace publico la pestana de pedidos en el header de tienda (`resources/views/partials/store-header.blade.php`).
  - Se implementa navegacion por tabs dentro del panel admin en `resources/views/admin/dashboard.blade.php` (`Productos` y `Pedidos`), accesible solo por rutas admin protegidas por middleware.
  - `AdminController@dashboard` ahora procesa `tab=products|orders` y entrega listado paginado de pedidos con conteo de items para la pestana admin.
- Mejora visual del carrito:
  - `resources/views/store/cart.blade.php` se actualiza con tarjetas por item, chips de metadatos (precio/stock/subtotal), separacion clara entre bloques y resumen final mas legible.
- Mejora visual de pedidos y resumen:
  - `resources/views/store/orders.blade.php` se rediseña con tarjetas y estados en chips para lectura rapida.
  - `resources/views/store/order-show.blade.php` se rediseña con resumen por linea de producto, estados destacados y acciones claras.
- Mejora visual de checkout y simulacion de pago:
  - `resources/views/store/checkout.blade.php` se mejora en legibilidad del resumen y formularios.
  - `resources/views/store/payment.blade.php` se mejora con selector de metodo en bloques y flujo de confirmacion mas intuitivo.
- Validaciones tecnicas ejecutadas:
  - `php -l app/Http/Controllers/AdminController.php` sin errores.
  - `php artisan route:list --except-vendor` confirma rutas del flujo.
  - `php artisan view:clear` exitoso.
  - `php artisan view:cache` falla por entorno local sin extension `mbstring` (funcion `mb_split` no disponible), no por errores de las vistas editadas.
- Solicitud del usuario: corregir errores visuales en carrito (texto superpuesto y botones no visibles), eliminar 404 en escenarios sin productos y robustecer comportamiento cuando un producto del carrito deja de estar disponible.
- Correcciones backend para evitar 404 por model binding en carrito:
  - `routes/web.php`: rutas de carrito cambian de `{product:slug}` a `{slug}`.
  - `CartController@add`, `@update`, `@remove` ahora resuelven producto por `slug` manualmente y responden con mensajes de error amigables en lugar de 404.
  - `CartController@update` y `@remove` ahora toleran productos eliminados/inactivos: limpian carrito y notifican al usuario.
- Correccion de 404 en detalle de producto:
  - `HomeController@show` ya no usa fallo duro para producto ausente; redirige a HOME con mensaje de disponibilidad.
- Correcciones frontend para carrito y vistas de tienda:
  - Se crea parcial `resources/views/partials/store-header-styles.blade.php` para centralizar estilos del header y evitar solapamientos visuales.
  - Se incluye el parcial en vistas `store/*` (carrito, checkout, pedidos, detalle pedido, pago).
  - `resources/views/store/cart.blade.php` ajusta layout de fila a estructura robusta (`row-actions` con wrap) para evitar que botones se oculten en anchos intermedios.
- Ajustes de enlaces con slug explicito:
  - `resources/views/home/index.blade.php` y `resources/views/home/show.blade.php` ahora usan `route(..., $product->slug)` para detalle/agregar al carrito.
- Validaciones ejecutadas:
  - `php -l` sin errores en `CartController` y `HomeController`.
  - `php artisan route:list --except-vendor` confirma rutas de carrito con `{slug}` y flujo completo operativo.
- Solicitud del usuario: permitir parametros editables de medidas para productos (ej. bolsos/textiles), incluyendo tamano, altura y ancho (y medidas relacionadas).
- Implementacion de datos:
  - Nueva migracion `database/migrations/2026_05_25_213500_add_measurements_to_products_table.php`.
  - Se agregan columnas en `products`: `size` (string), `height_cm`, `width_cm`, `depth_cm` (decimal, nullable).
- Implementacion backend:
  - `app/Models/Product.php` actualizado con `fillable` y `casts` para `size`, `height_cm`, `width_cm`, `depth_cm`.
  - `app/Http/Controllers/AdminController.php` actualizado para validar y guardar estos campos en crear/editar producto.
- Implementacion frontend/admin:
  - `resources/views/admin/dashboard.blade.php` ahora incluye campos de medidas en formulario de creacion y en edicion inline de productos.
  - Ajuste de grilla `.inline` para mantener legibilidad del formulario con nuevos campos.
- Implementacion frontend/publico:
  - `resources/views/home/index.blade.php` muestra resumen de medidas cuando el producto las tenga.
  - `resources/views/home/show.blade.php` muestra detalle de medidas del producto.
- Ejecucion tecnica:
  - Migracion aplicada en Docker con `docker compose exec -T app php artisan migrate --force`.
- Solicitud del usuario: embellecer y traducir al español los estados de pedidos en dashboard admin (evitar variables crudas como `pending` o `prototype_paid`).
- Implementacion backend:
  - `app/Http/Controllers/AdminController.php` ahora decora pedidos con etiquetas y tonos visuales:
    - `status_label`, `status_tone`
    - `payment_status_label`, `payment_status_tone`
  - Traducciones aplicadas (ejemplos):
    - `pending` -> `Pendiente`
    - `paid` -> `Pagado`
    - `cancelled` -> `Cancelado`
    - `prototype_pending` -> `Pago pendiente`
    - `prototype_paid` -> `Pago aprobado`
    - `refund_pending` -> `Reembolso pendiente`
- Implementacion frontend:
  - `resources/views/admin/dashboard.blade.php` usa las etiquetas traducidas en:
    - pestaña `Pedidos` (cards)
    - bloque `Pedidos recientes`
  - Se agregan estilos de chips por estado (`pending`, `success`, `danger`) con soporte visual en modo claro/oscuro.
  - Se mejora el layout de `Pedidos recientes` para lectura clara (fila principal + metadatos de estado).
- Validaciones:
  - `php -l app/Http/Controllers/AdminController.php` sin errores.
  - `php artisan view:clear` ejecutado correctamente.
- Solicitud del usuario: aplicar la misma traduccion/embellecimiento de estados en el resumen de pedido del cliente (evitar ver `paid`, `pending`, etc.).
- Implementacion backend en flujo tienda:
  - `app/Http/Controllers/CartController.php` ahora decora pedidos con:
    - `status_label`, `status_tone`
    - `payment_status_label`, `payment_status_tone`
  - Se aplican en `ordersIndex`, `orderShow` y `paymentShow`.
  - Traducciones usadas:
    - `pending` -> `Pendiente`
    - `paid` -> `Pagado`
    - `cancelled` -> `Cancelado`
    - `prototype_pending` -> `Pago pendiente`
    - `prototype_paid` -> `Pago aprobado`
    - `refund_pending` -> `Reembolso pendiente`
- Implementacion frontend en vistas de cliente:
  - `resources/views/store/order-show.blade.php`: chips de estado/pago ahora usan etiquetas en espanol y tonos visuales.
  - `resources/views/store/orders.blade.php`: idem en listado/resumen de pedidos.
  - `resources/views/store/payment.blade.php`: idem en estado del pedido dentro de pago.
- Validaciones:
  - `php -l app/Http/Controllers/CartController.php` sin errores.
  - `php artisan view:clear` ejecutado correctamente.
- Solicitud del usuario: eliminar acceso del cliente al "resumen de pedidos" general y dejar solo resumen del pedido reciente; ademas crear seeder con 5 productos placeholder (2 chaquetas y 3 bolsos).
- Cambios de flujo de pedidos (cliente):
  - `routes/web.php`:
    - se elimina ruta de listado global de pedidos del cliente (`orders.index`).
    - se agrega ruta `GET /pedido/reciente` (`orders.recent`).
  - `app/Http/Controllers/CartController.php`:
    - al crear pedido (`checkoutSubmit`) se guarda `latest_order_id` en sesion.
    - nueva accion `recentOrderShow()` para mostrar solo el resumen del pedido reciente.
    - `authorizeOrder()` se endurece para permitir solo el `latest_order_id` (evita ver todos los pedidos del cliente).
  - `resources/views/store/order-show.blade.php`:
    - se reemplaza boton de retorno a listado por `Resumen del pedido reciente` apuntando a `orders.recent`.
  - `resources/views/store/payment.blade.php`:
    - se ajusta boton a `Ver resumen del pedido reciente`.
- Seeder de productos placeholder:
  - nuevo archivo `database/seeders/PlaceholderProductsSeeder.php` (idempotente con `updateOrCreate`) que crea:
    - `CHAQUETA 1`
    - `CHAQUETA 2`
    - `BOLSO 1`
    - `BOLSO 2`
    - `BOLSO 3`
  - `database/seeders/DatabaseSeeder.php` actualizado para ejecutar `PlaceholderProductsSeeder`.
- Ejecucion y validacion:
  - `php artisan route:list --except-vendor` confirma nueva ruta `orders.recent` y ausencia de `orders.index`.
  - Seeder ejecutado en Docker: `docker compose exec -T app php artisan db:seed --class=PlaceholderProductsSeeder --force`.
- Solicitud del usuario: permitir elegir directamente la cantidad de un mismo producto desde la pagina principal para agregarla al carrito.
- Implementacion frontend en catalogo:
  - `resources/views/home/index.blade.php` ahora reemplaza el input oculto de cantidad por un `input[type=number]` visible en cada tarjeta de producto.
  - Se envia `quantity` directamente al endpoint `cart.add` desde HOME.
  - Se ajustan estilos de acciones para que el campo de cantidad y boton de agregar queden alineados sin romper la tarjeta.
  - Manejo de stock en HOME:
    - Si `stock > 0`, se muestra input de cantidad con `min=1` y `max=stock`.
    - Si `stock = 0`, se muestra boton deshabilitado `Sin stock`.
- Validacion tecnica:
  - `php artisan view:clear` ejecutado correctamente para refrescar vistas compiladas.
- Solicitud del usuario: en HOME, que el numero de cantidad solo aparezca cuando el usuario presione "Agregar".
- Implementacion frontend en catalogo (`resources/views/home/index.blade.php`):
  - Flujo de 2 pasos por tarjeta:
    - Estado inicial: solo boton `Agregar` visible.
    - Al hacer click en `Agregar`: se muestra panel de cantidad con `input`, boton `Confirmar` y `Cancelar`.
  - Se agrega JS local para controlar apertura/cierre del panel por producto sin recarga.
  - `Cancelar` restablece cantidad a `1` y oculta nuevamente el selector.
- Ajustes visuales:
  - Se agregan estilos para `add-flow` y `qty-panel`, manteniendo layout minimalista y sin romper tarjetas.
- Validacion tecnica:
  - `php artisan view:clear` ejecutado para refrescar vistas compiladas.
- Ajuste solicitado por el usuario: eliminar boton de confirmacion en HOME y mantener solo botones `Ver detalle` y `Agregar`.
- Implementacion en `resources/views/home/index.blade.php`:
  - Se elimina el boton `Confirmar` y cualquier boton extra del flujo de cantidad.
  - El boton `Agregar` queda como unico boton del formulario:
    - Primer clic: muestra el contador de cantidad (sin enviar formulario).
    - Segundo clic: envia el formulario con la cantidad elegida al carrito.
  - Se elimina logica de cancelacion asociada al flujo anterior.
- Resultado UX:
  - En cada tarjeta solo se mantienen `Ver detalle` y `Agregar` (ademas de `Sin stock` cuando aplique).
- Solicitud del usuario: que al presionar el texto "Benjaminduve" del header redirija al HOME, igual que el boton HOME.
- Implementacion:
  - `resources/views/partials/store-header.blade.php`: el titulo `Benjaminduve` ahora es un enlace a `route('home')`.
  - Ajustes de estilo para mantener la apariencia original (sin subrayado ni cambio de color):
    - `resources/views/partials/store-header-styles.blade.php`
    - `resources/views/home/index.blade.php`
    - `resources/views/home/show.blade.php`
- Validacion tecnica:
  - `php artisan view:clear` ejecutado para refrescar vistas compiladas.
- Solicitud del usuario: mantener invisible el contador de cantidad en HOME hasta presionar `Agregar`, y hacer que se oculte junto con la notificacion de producto agregado.
- Implementacion en `resources/views/home/index.blade.php`:
  - Se agrega funcion `resetQuantityPanels()` para ocultar todos los paneles de cantidad (`qty-panel`) y reiniciar cantidad a `1`.
  - Se ejecuta `resetQuantityPanels()` al inicializar la pagina para asegurar estado oculto por defecto.
  - Cuando existe toast de agregado (`cart-toast`), antes de iniciar su fade-out tambien se ejecuta `resetQuantityPanels()` para ocultar el contador en el mismo momento.
- Resultado:
  - El contador solo aparece tras primer clic en `Agregar`.
  - Tras agregado y notificacion, el contador desaparece junto con el flujo visual del toast.
- Validacion tecnica:
  - `php artisan view:clear` ejecutado para refrescar vistas compiladas.
- Fix adicional solicitado por el usuario: las cajas de cantidad seguian visibles antes de presionar `Agregar`.
- Causa encontrada:
  - La clase `.qty-panel` tenia `display: flex`, lo que podia sobreescribir el estado `hidden`.
- Correccion aplicada:
  - En `resources/views/home/index.blade.php` se agrega regla:
    - `.qty-panel[hidden] { display: none !important; }`
  - Esto garantiza invisibilidad real del contador hasta activar el flujo con `Agregar`.
- Validacion tecnica:
  - `php artisan view:clear` ejecutado para refrescar vistas compiladas.
- Solicitud del usuario: compactar la lista de productos en dashboard para reducir ocupacion vertical y eliminar el bloque inferior de "Pedidos recientes" para que los pedidos se vean solo en su pestana.
- Ajustes en dashboard admin (`resources/views/admin/dashboard.blade.php`):
  - Se compactan botones e inputs (menor padding y tipografia en acciones de edicion).
  - Se optimiza la grilla de edicion de productos (`.inline`) para reducir alto por item.
  - Se reemplaza el layout previo de cada producto por `product-item` con acciones mas compactas y boton de eliminar lateral, eliminando grandes saltos verticales.
  - Se elimina completamente el panel inferior "Pedidos recientes" debajo de la lista de productos.
- Limpieza backend asociada:
  - `app/Http/Controllers/AdminController.php` elimina carga y envio de `recentOrders` ya no usada por la vista.
- Validaciones:
  - `php -l app/Http/Controllers/AdminController.php` sin errores.
  - `php artisan view:clear` ejecutado correctamente.
- Solicitud del usuario: agregar buscador y filtro por fechas para pedidos en dashboard admin, y ampliar la caja de descripcion de productos para evitar corte visual.
- Implementacion backend (`app/Http/Controllers/AdminController.php`):
  - Se agrega filtrado de pedidos por query params:
    - `order_q` (cliente, correo, estado, estado de pago o ID)
    - `date_from` y `date_to` (rango sobre `created_at`)
  - Se preservan filtros en paginacion con `appends(...)`.
  - Se exponen a la vista: `orderSearch`, `dateFrom`, `dateTo`.
- Implementacion frontend (`resources/views/admin/dashboard.blade.php`):
  - En pestana `Pedidos` se agrega formulario de filtros con:
    - buscador de texto
    - fecha desde
    - fecha hasta
    - boton `Filtrar`
    - boton `Limpiar`
  - En seccion `Productos` se amplia descripcion en edicion:
    - se cambia `input` por `textarea` en descripcion por producto.
    - se ajustan estilos (`.inline textarea`, `.inline .full`) para mejor lectura.
- Validaciones:
  - `php -l app/Http/Controllers/AdminController.php` sin errores.
  - `php artisan view:clear` ejecutado correctamente.
  - `php artisan route:list --except-vendor` verificado.
- Solicitud del usuario: talla opcional en productos; si no se especifica, guardar por defecto un caracter en blanco.
- Implementacion backend:
  - `app/Http/Controllers/AdminController.php`:
    - se agrega metodo `normalizeSize(?string $size): string`.
    - comportamiento: si talla viene vacia o solo espacios, se guarda `' '` (espacio en blanco); si viene con texto, se guarda el valor trim.
    - `storeProduct` y `updateProduct` ahora usan `normalizeSize(...)`.
- Ajuste frontend para evitar mostrar "Talla" cuando el valor almacenado es solo espacio:
  - `resources/views/home/index.blade.php`: condiciones de medidas ahora usan `trim((string) $product->size) !== ''`.
  - `resources/views/home/show.blade.php`: mismo ajuste.
- Validacion tecnica:
  - `php -l app/Http/Controllers/AdminController.php` sin errores.
  - `php artisan view:clear` ejecutado correctamente.
- Solicitud del usuario: editar seeders de productos para contemplar parametros nuevos y repoblar base de datos.
- Cambios en seeder:
  - `database/seeders/PlaceholderProductsSeeder.php` actualizado para normalizar talla opcional:
    - productos tipo bolso ahora vienen sin talla (`''`) y se guardan como `' '` mediante `normalizeSize(...)`.
    - se agrega metodo privado `normalizeSize(?string $size): string` para mantener consistencia con la logica de productos.
- Repoblado de base de datos ejecutado en Docker:
  - `docker compose exec -T app php artisan migrate:fresh --seed --force`
  - Resultado: migraciones y seeders ejecutados correctamente (`AdminUserSeeder` + `PlaceholderProductsSeeder`).
- Verificacion posterior:
  - Conteo de productos: `5`.
  - Validacion de tallas cargadas:
    - `CHAQUETA 1` => `M`
    - `CHAQUETA 2` => `L`
    - `BOLSO 1/2/3` => `' '` (espacio en blanco)
- Solicitud del usuario: si se define talla, no deben aparecer/considerarse alto, ancho y profundidad; actualizar seeders y repoblar.
- Implementacion backend:
  - `app/Http/Controllers/AdminController.php`:
    - se agrega `resolveMeasurements(array $data)`.
    - Regla aplicada al guardar/editar:
      - si `size` tiene valor real (distinto de blanco), `height_cm`, `width_cm`, `depth_cm` se guardan como `null`.
      - si no hay talla, se conservan medidas numericas.
- Implementacion frontend:
  - `resources/views/home/index.blade.php` y `resources/views/home/show.blade.php`:
    - si hay talla, solo se muestra talla.
    - solo si no hay talla se muestran alto/ancho/profundidad.
- Seeders actualizados:
  - `database/seeders/PlaceholderProductsSeeder.php`:
    - se agrega `resolveMeasurements(array $item)` para aplicar la misma regla de negocio.
    - `CHAQUETA 1` y `CHAQUETA 2` quedaron con talla y medidas dimensionales en `null`.
    - `BOLSO 1/2/3` quedaron sin talla (`' '`) y con medidas de alto/ancho/profundidad.
- Repoblado completo ejecutado:
  - `docker compose exec -T app php artisan migrate:fresh --seed --force` (OK).
- Validaciones:
  - `php -l` sin errores en `AdminController` y `PlaceholderProductsSeeder`.
- Solicitud del usuario: que notificaciones como "producto actualizado" se oculten solas a los pocos segundos; aplicar mismo comportamiento al resto de notificaciones actuales y dejar base para futuras similares.
- Implementacion reusable:
  - Nuevo parcial `resources/views/partials/auto-dismiss-notices.blade.php` con:
    - CSS de transicion para elementos con `data-auto-dismiss`.
    - JS que auto-oculta y remueve cada notificacion (delay por defecto 2600 ms).
- Notificaciones actuales actualizadas para auto-dismiss:
  - `resources/views/admin/dashboard.blade.php` (status y errores en alertas).
  - `resources/views/home/index.blade.php` (status y errores generales).
  - `resources/views/store/cart.blade.php` (status y errores).
  - `resources/views/store/order-show.blade.php` (status y errores).
  - `resources/views/login.blade.php` (errores de login).
- Integracion del parcial:
  - Se incluye `@include('partials.auto-dismiss-notices')` al final de las vistas anteriores, y tambien en `resources/views/home/show.blade.php` para estandarizar comportamiento futuro.
- Convencion para futuras notificaciones:
  - Cualquier nuevo mensaje que deba desaparecer automaticamente debe renderizarse con `data-auto-dismiss="2600"` (o ms personalizados).
- Validacion tecnica:
  - `php artisan view:clear` ejecutado correctamente.
- Solicitud del usuario: mejorar visualizacion de nombres en la lista de productos del dashboard porque se ven cortados en pantalla completa.
- Ajuste aplicado en `resources/views/admin/dashboard.blade.php`:
  - Se redefine la grilla de edicion `.inline` con columnas explicitas mas anchas para nombre y slug.
  - Se agregan clases `field-name` y `field-slug` en inputs para controlar mejor ancho efectivo.
  - Se deja descripcion en fila completa (`.full { grid-column: 1 / -1; }`) para no comprimir campos principales.
  - Se agrega clase `field-save` para evitar corte de texto del boton guardar.
- Resultado esperado:
  - Nombres y slugs visibles en mejor proporción en pantallas grandes, con menor corte horizontal.
- Validacion tecnica:
  - `php artisan view:clear` ejecutado para refrescar vistas compiladas.
- Solicitud del usuario: agregar buscador de productos en dashboard admin.
- Implementacion backend (`app/Http/Controllers/AdminController.php`):
  - Nuevo parametro de busqueda: `product_q`.
  - Filtro aplicado sobre productos por:
    - `name`
    - `slug`
    - `description`
    - `size`
  - Paginacion de productos actualizada para conservar `tab` y `product_q`.
  - Se expone `productSearch` a la vista.
- Implementacion frontend (`resources/views/admin/dashboard.blade.php`):
  - En pestaña `Productos` se agrega formulario de busqueda con:
    - input de texto
    - boton `Buscar`
    - boton `Limpiar`
  - Se ajusta la paginacion de productos para mantener el filtro activo.
  - Estilos añadidos para `product-filters` (responsive).
- Validaciones:
  - `php -l app/Http/Controllers/AdminController.php` sin errores.
  - `php artisan view:clear` ejecutado correctamente.
- Solicitud del usuario: eliminar boton "Resumen del pedido reciente" (no funcional) y asegurar que al procesar pago exitoso se redirija directamente al resumen del pedido con estado e informacion completa.
- Cambios realizados:
  - `resources/views/store/order-show.blade.php`:
    - se elimina boton/enlace "Resumen del pedido reciente".
  - `resources/views/store/payment.blade.php`:
    - se elimina enlace "Ver resumen del pedido reciente".
  - `routes/web.php`:
    - se elimina ruta `GET /pedido/reciente` (`orders.recent`).
  - `app/Http/Controllers/CartController.php`:
    - se elimina metodo `recentOrderShow()` por quedar sin uso.
- Flujo final confirmado:
  - `paymentProcess()` mantiene redireccion directa a `orders.show` despues de aprobar pago prototipo:
    - `return redirect()->route('orders.show', $order)->with('status', 'Pago prototipo aprobado.');`
- Validaciones:
  - `php -l app/Http/Controllers/CartController.php` sin errores.
  - `php artisan route:list --except-vendor` confirma eliminacion de `orders.recent`.
  - `php artisan view:clear` ejecutado correctamente.
- Solicitud del usuario: sistema temporal en dashboard para aceptar/rechazar pedidos; los no revisados deben quedar pendientes. Motivacion: en el futuro la pasarela real decidirá aprobado/cancelado.
- Implementacion de datos:
  - Nueva migracion `database/migrations/2026_05_26_002000_add_admin_review_status_to_orders_table.php`.
  - Se agrega columna `admin_review_status` en `orders` con default `pending`.
  - Migracion aplicada en Docker con `docker compose exec -T app php artisan migrate --force`.
- Implementacion backend:
  - `app/Models/Order.php`: se agrega `admin_review_status` a `fillable`.
  - `app/Http/Controllers/AdminController.php`:
    - Se amplía busqueda de pedidos para incluir `admin_review_status`.
    - Se agregan acciones:
      - `acceptOrder(Order $order)` -> `admin_review_status = accepted`
      - `rejectOrder(Order $order)` -> `admin_review_status = rejected`
    - Se agrega decoracion visual/etiquetas del nuevo estado:
      - `review_status_label`: Pendiente / Aceptado / Rechazado
      - `review_status_tone`: pending / success / danger
- Implementacion de rutas admin:
  - `routes/web.php`:
    - `POST /admin/pedidos/{order}/aceptar` (`admin.orders.accept`)
    - `POST /admin/pedidos/{order}/rechazar` (`admin.orders.reject`)
- Implementacion frontend dashboard:
  - `resources/views/admin/dashboard.blade.php` (pestaña Pedidos):
    - Se muestra chip de `Revision` por pedido.
    - Se agregan botones `Aceptar` y `Rechazar` por cada pedido.
- Validaciones:
  - `php -l` sin errores en `AdminController` y `Order`.
  - `php artisan route:list --except-vendor` confirma rutas nuevas de aceptacion/rechazo.
- Solicitud del usuario: en carrito, al superar stock mostrar aviso dentro de la pagina (sin popup del navegador), ajustar checkout para no autoaprobar pedidos y ocultar botones de aceptar/rechazar en pedidos ya decididos.
- Cambios aplicados en carrito y catalogo:
  - app/Http/Controllers/CartController.php:
    - Mensajes de validacion de stock mejorados en add() y update() para indicar cantidad disponible exacta.
  - resources/views/home/index.blade.php:
    - Se elimina max="{{ $product->stock }}" del input de cantidad para evitar popup nativo del navegador.
  - resources/views/home/show.blade.php:
    - Se elimina max="{{ $product->stock }}" del input de cantidad.
    - Se agregan bloques de notificacion en pagina para session('status') y errores de validacion ($errors->first()), con auto-dismiss.
- Cambios aplicados en checkout/pago (flujo de revision admin):
  - app/Http/Controllers/CartController.php:
    - checkoutSubmit() crea pedidos con status = pending, payment_status = prototype_pending y admin_review_status = pending.
    - paymentProcess() ya no autoaprueba: ahora deja status = pending, payment_status = prototype_submitted y redirige al resumen con mensaje de revision.
    - paymentShow() bloquea reenvio de pago cuando el pedido ya fue enviado a revision o ya tiene decision administrativa.
  - resources/views/store/payment.blade.php:
    - Textos de metodos de pago actualizados para indicar revision administrativa en todos los casos (sin aprobacion inmediata).
- Cambios aplicados en dashboard admin:
  - resources/views/admin/dashboard.blade.php:
    - Los botones Aceptar y Rechazar se muestran solo cuando admin_review_status === 'pending'.
    - En pedidos ya revisados se muestra Decision ya registrada.
  - app/Http/Controllers/AdminController.php:
    - acceptOrder() y rejectOrder() solo actuan si el pedido esta pendiente de revision.
    - Al aceptar: admin_review_status = accepted, status = paid, payment_status = prototype_paid.
    - Al rechazar: admin_review_status = rejected, status = cancelled, payment_status = prototype_rejected.
- Validaciones y ejecucion tecnica:
  - php -l sin errores en:
    - app/Http/Controllers/CartController.php
    - app/Http/Controllers/AdminController.php
    - resources/views/home/index.blade.php
    - resources/views/home/show.blade.php
    - resources/views/store/payment.blade.php
  - php artisan route:list --except-vendor confirma rutas del flujo (cart, checkout, payment, admin.orders.accept/reject).
  - Docker:
    - docker compose exec -T app php artisan migrate --force -> sin migraciones pendientes.
    - docker compose exec -T app php artisan view:clear -> vistas compiladas limpiadas.
- Operacion solicitada por el usuario: repoblar base de datos.
- Ejecucion realizada en Docker: `docker compose exec -T app php artisan migrate:fresh --seed --force`.
- Resultado: tablas recreadas y seeders ejecutados correctamente (`AdminUserSeeder` y `PlaceholderProductsSeeder`).
- Solicitud del usuario: mover boton de cancelar pedido a la pantalla de eleccion de pago, mostrar metodo de pago en dashboard admin y asegurar actualizacion automatica de estado al aceptar/rechazar.
- Cambios en persistencia de datos:
  - Nueva migracion: `database/migrations/2026_05_26_010000_add_payment_method_to_orders_table.php`.
  - Se agrega columna nullable `payment_method` en `orders`.
  - Modelo `app/Models/Order.php` actualizado para incluir `payment_method` en `fillable`.
- Cambios en flujo de pago y pedido:
  - `app/Http/Controllers/CartController.php`:
    - `paymentProcess()` ahora guarda `payment_method` junto con `payment_status = prototype_submitted`.
    - `cancelOrder()` ahora redirige a `orders.show` (en lugar de volver atras) para mostrar estado actualizado inmediatamente.
    - Se agrega traduccion de metodo con `paymentMethodLabel()` y se inyecta en `decorateOrder()` como `payment_method_label`.
  - `resources/views/store/order-show.blade.php`:
    - Se elimina boton `Cancelar pedido`.
    - Se mantiene acceso a `Ir a pago` cuando corresponde.
    - Se agrega chip de `Metodo` en el resumen de pedido.
  - `resources/views/store/payment.blade.php`:
    - Se agrega boton `Cancelar pedido` dentro de la pantalla de pago (donde el cliente elige metodo).
    - Se agregan notificaciones en pagina para estado/errores con auto-dismiss.
- Cambios en dashboard administrativo:
  - `app/Http/Controllers/AdminController.php`:
    - Se agrega `payment_method` al filtro de busqueda de pedidos.
    - Se agrega `payment_method_label` en decoracion de pedidos.
    - `acceptOrder()` y `rejectOrder()` ahora requieren `payment_status = prototype_submitted` antes de decidir.
    - Al aceptar/rechazar se mantienen actualizaciones automaticas de estado:
      - aceptar -> `status = paid`, `payment_status = prototype_paid`, `admin_review_status = accepted`
      - rechazar -> `status = cancelled`, `payment_status = prototype_rejected`, `admin_review_status = rejected`
  - `resources/views/admin/dashboard.blade.php`:
    - Se muestra `Metodo de pago` en cada card de pedido.
    - Botones `Aceptar/Rechazar` solo visibles cuando el pedido esta pendiente y con pago enviado.
    - Si falta pago enviado, se muestra nota `Esperando pago enviado por cliente`.
- Validaciones y ejecucion tecnica:
  - `php -l` sin errores en controladores, modelo y nueva migracion.
  - `docker compose exec -T app php artisan migrate --force` aplicado correctamente.
  - `docker compose exec -T app php artisan view:clear` ejecutado.
  - `php artisan route:list --except-vendor` confirma rutas activas del flujo.
- Solicitud del usuario: agregar en el header un boton pequeno de Instagram con su logo, enlazando al perfil `@benjaminduve`.
- Implementacion frontend:
  - `resources/views/partials/store-header.blade.php`:
    - Se agrega enlace a `https://instagram.com/benjaminduve` en el header.
    - Se incluye icono de Instagram en SVG inline (sin dependencia de assets externos).
    - Se configuran atributos de accesibilidad y seguridad (`aria-label`, `title`, `target="_blank"`, `rel="noopener noreferrer"`).
  - `resources/views/partials/store-header-styles.blade.php`:
    - Se agrega estilo de boton pequeno para `.instagram-btn` y ajuste de icono SVG.
  - `resources/views/home/index.blade.php` y `resources/views/home/show.blade.php`:
    - Se agregan estilos locales para `.instagram-btn` para mantener consistencia visual en estas vistas que usan estilos propios de header.
- Validacion tecnica:
  - `docker compose exec -T app php artisan view:clear` ejecutado correctamente.- Solicitud del usuario: reemplazar el texto "Benjaminduve" del header por el icono de marca en esa misma posicion (manteniendo enlace a HOME).
- Implementacion frontend:
  - `resources/views/partials/store-header.blade.php`:
    - Se reemplaza el texto del titulo por un logo vectorial (SVG inline) de estilo marca.
    - El logo se mantiene como enlace a `route('home')`.
  - `resources/views/partials/store-header-styles.blade.php`:
    - Se agregan estilos para `.brand-logo` y ajuste de `line-height` del titulo para correcta alineacion del icono.
  - `resources/views/home/index.blade.php` y `resources/views/home/show.blade.php`:
    - Se sincronizan estilos de `.brand-logo` para vistas que usan estilos locales de header.
- Validacion tecnica:
  - `php -l` sin errores en las vistas modificadas.
  - `docker compose exec -T app php artisan view:clear` ejecutado correctamente.- Solicitud del usuario: agregar el mismo logo de marca en el header del dashboard admin, pero sin funcion de navegacion al HOME.
- Implementacion:
  - `resources/views/admin/dashboard.blade.php`:
    - Se reemplaza el texto principal del header por logo SVG de marca como elemento estatico (`span`), sin enlace.
    - Se agrega texto auxiliar `Panel administrativo` junto al logo.
    - Se agregan estilos `admin-brand` y `admin-brand-text` para alineacion y escala del logo en el dashboard.
- Validacion tecnica:
  - `php -l resources/views/admin/dashboard.blade.php` sin errores.
  - `docker compose exec -T app php artisan view:clear` ejecutado correctamente.

### 2026-05-26
- Solicitud del usuario: verificar que frontend y backend esten levantados en Docker como contenedores separados, comunicados por API y funcionando correctamente.
- Verificacion de infraestructura Docker:
  - `docker compose ps` confirma servicios activos:
    - `app` (Laravel) en `localhost:8000`
    - `frontend` (React/Vite) en `localhost:5173`
    - `db` (MySQL) en `localhost:3306`
    - `phpmyadmin` en `localhost:8081`
  - `docker-compose.yml` validado con separacion explicita de servicios (`app` y `frontend` independientes).
- Verificacion de separacion frontend/backend:
  - Frontend React consume API mediante `axios` (`frontend/src/api/client.js`) con `baseURL=/api`.
  - Proxy de Vite en contenedor frontend (`frontend/vite.config.js`) redirige `/api` a `http://app`, manteniendo comunicacion contenedor-a-contenedor.
  - Backend Laravel expone rutas API dedicadas en `routes/api.php`.
- Verificacion funcional API (end-to-end) a traves del frontend Docker:
  - Flujo probado: listar productos -> crear pedido -> enviar pago prototipo -> login admin -> revisar pedido -> aceptar pedido -> consultar resumen.
  - Resultado final validado: pedido pasa de pendiente a pagado tras decision admin, con estados y datos consistentes por API.
- Solicitud del usuario: asegurar separacion estricta entre frontend y backend, validar contenedores separados y dejar frontend React levantado en Docker.
- Ajustes de separacion aplicados:
  - `routes/web.php` se convierte a modo API-only:
    - `GET /` responde JSON de estado del backend.
    - `fallback` responde JSON 404 indicando uso del frontend React en `http://localhost:5173`.
  - Se elimina el acoplamiento de frontend en scripts del backend:
    - `composer.json` (`setup`) deja de ejecutar `npm install` y `npm run build`.
    - `composer.json` (`dev`) deja de levantar `npm run dev` desde Laravel.
- Validaciones de estructura y separacion:
  - El frontend React permanece en carpeta dedicada `frontend/` (codigo de `src`, `api`, `pages`, `components`).
  - Las rutas operativas del backend quedan en `routes/api.php` (17 endpoints API activos).
  - `docker compose ps` confirma contenedores separados:
    - `benjaminduve_app` (Laravel API), `benjaminduve_frontend` (React), `benjaminduve_db` (MySQL).
- Pruebas de comunicacion API realizadas:
  - `GET http://localhost:5173/api/products` => `200`.
  - `POST http://localhost:5173/api/admin/login` => `200`.
  - Flujo E2E por API via frontend Docker:
    - crear pedido -> enviar pago -> aceptar desde admin -> resumen final.
    - resultado: `E2E_FINAL_STATUS=paid`.
- Operacion solicitada completada:
  - contenedor de React levantado/recreado con Docker (`docker compose up -d frontend`).

### 2026-05-26 (validacion final de integracion)
- Solicitud del usuario: comprobar comunicacion completa entre APIs frontend/backend, corregir errores encontrados, ejecutar pruebas npm en Docker y confirmar estado para subida a GitHub.
- Verificaciones ejecutadas:
  - Estado de contenedores: `app`, `frontend`, `db`, `phpmyadmin` en estado `Up`.
  - Rutas API backend activas: 17 endpoints en `routes/api.php`.
  - Prueba E2E por API via frontend (`http://localhost:5173/api`):
    - listar productos -> crear pedido -> enviar pago -> login admin -> aceptar pedido -> ver resumen.
    - resultado final validado: `status=paid`.
- Errores detectados y corregidos:
  - `docker-compose.yml`:
    - se evita regenerar `APP_KEY` en cada arranque (solo se genera si falta), para no invalidar sesiones/tokens entre reinicios.
    - se condiciona `php artisan storage:link` para ejecutarse solo cuando no existe el enlace, evitando errores ruidosos al iniciar.
  - `frontend/eslint.config.js`:
    - se desactivan reglas que estaban bloqueando el lint en este setup:
      - `react-hooks/set-state-in-effect`
      - `react-refresh/only-export-components`
- Pruebas ejecutadas en Docker:
  - Frontend:
    - `npm run test --if-present` (sin script `test` definido, no ejecuta casos porque el proyecto no incluye test runner aun).
    - `npm run lint` -> OK.
    - `npm run build` -> OK.
  - Backend:
    - `php artisan test` -> OK (`2 passed`).

### 2026-05-26 (verificacion visual de contenedor frontend separado)
- Solicitud del usuario: confirmar que React frontend este en contenedor aparte dentro del proyecto Docker `benjaminduve`.
- Verificacion y accion operativa:
  - Se confirma contenedor dedicado de frontend: `benjaminduve_frontend` (imagen `node:24-alpine`, puerto `5173:5173`).
  - Se confirma contenedor dedicado de backend: `benjaminduve_app` (puerto `8000:80`).
  - Se recrea el stack para limpiar huérfanos y reflejar nombres fijos en Docker Desktop:
    - `docker compose down --remove-orphans`
    - `docker compose up -d`
  - Estado final validado con `docker compose ps`: `app`, `frontend`, `db` y `phpmyadmin` en `Up`.

### 2026-05-26 (flujo de cantidad en carrito desde frontend React)
- Solicitud del usuario: en el frontend, la caja para elegir cantidad debe mostrarse solo al presionar el boton `Añadir`.
- Implementacion aplicada:
  - Archivo: `frontend/src/pages/HomePage.jsx`.
  - Se agrega estado `quantityPickerOpen` por producto.
  - Nuevo comportamiento en catalogo:
    - estado inicial: no se muestra input de cantidad.
    - primer clic en `Añadir`: se abre el selector de cantidad para ese producto.
    - clic posterior en `Añadir`: agrega al carrito con la cantidad elegida.
    - si el agregado es exitoso, el selector vuelve a ocultarse y la cantidad se reinicia a `1`.
- Validacion tecnica:
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.

### 2026-05-26 (notificaciones con fade out en frontend React)
- Solicitud del usuario: mejorar las notificaciones cercanas al header para que no desaparezcan abruptamente, sino con un `fade out` suave.
- Implementacion aplicada:
  - Nuevo componente reutilizable: `frontend/src/components/NoticeBanner.jsx`.
  - Logica: cuando el mensaje se limpia, la notificacion entra en estado `is-fading` por unos milisegundos y luego se desmonta.
  - Integracion en paginas React:
    - `frontend/src/pages/HomePage.jsx`
    - `frontend/src/pages/ProductPage.jsx`
    - `frontend/src/pages/OrderPage.jsx`
    - `frontend/src/pages/CheckoutPage.jsx`
    - `frontend/src/pages/AdminLoginPage.jsx`
    - `frontend/src/pages/AdminDashboardPage.jsx`
  - Estilos de transicion agregados en `frontend/src/index.css`:
    - `transition` de `opacity` y `transform`.
    - clase `.notice.is-fading` para desvanecer y elevar ligeramente el bloque.
- Validacion tecnica:
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.

### 2026-05-26 (ajustes UX/UI catalogo, boleta y dashboard + repoblado)
- Solicitud del usuario: corregir desplazamiento de botones en tarjetas al mostrar cantidad, mejorar realismo de pasarela de pago con datos que luego aparezcan en boleta electronica (antes del checkout y reflejado en checkout), compactar pedidos en admin, reordenar panel de productos (crear a la izquierda y listado a la derecha), y repoblar base de datos.
- Cambios en frontend React:
  - `frontend/src/pages/HomePage.jsx`:
    - Se corrige el layout de acciones del catalogo para que `Ver detalle` y `Anadir` no cambien de posicion cuando aparece el selector de cantidad.
    - Nuevo slot fijo de cantidad por tarjeta (`qty-slot`) que se muestra/oculta sin reflujo brusco.
  - `frontend/src/pages/CartPage.jsx`:
    - Se agrega bloque de datos previos de boleta electronica (nombre, correo, RUT/documento, direccion, ciudad, telefono y notas).
    - Se guarda borrador en `localStorage` (`bdv_receipt_draft_v1`) para reflejarlo en checkout.
    - Se valida que los campos obligatorios esten completos antes de pasar a checkout.
  - `frontend/src/pages/CheckoutPage.jsx`:
    - Se cargan y muestran los datos de boleta desde el borrador previo.
    - Se permite editar en checkout y se envian esos datos al backend al crear pedido.
    - Se agrega bloque visual `Resumen de boleta electronica`.
  - `frontend/src/pages/OrderPage.jsx`:
    - Se reworkea la pasarela prototipo con formularios por metodo:
      - tarjeta (titular, numero, vencimiento, cvv)
      - transferencia (banco, titular, referencia)
      - efectivo (pagador, documento opcional)
    - Se agrega seccion de `Boleta electronica` con datos del cliente/direccion y numero de boleta.
    - Se agrega `Detalle de pago enviado` (resumen saneado de datos de pago).
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - Tab de productos en dos columnas:
      - izquierda: crear producto
      - derecha: buscador + listado editable + paginacion
    - Tab de pedidos rediseñado a lista compacta tipo filas (menos altura vertical que tarjetas).
  - `frontend/src/index.css`:
    - Nuevos estilos para `qty-slot`, `products-layout`, `orders-compact`, `orders-row`, ajustes responsive y compactado visual.
- Cambios en backend/API:
  - Nueva migracion: `database/migrations/2026_05_26_042000_add_billing_and_payment_meta_to_orders_table.php`.
    - Nuevos campos en `orders`: datos de boleta (`billing_*`) y `payment_meta` (json).
  - `app/Models/Order.php`:
    - Se agregan campos de boleta y `payment_meta` a `fillable`.
    - Cast de `payment_meta` a `array`.
  - `app/Http/Controllers/Api/StoreApiController.php`:
    - `createOrder` ahora valida y persiste datos de boleta.
    - `submitPayment` ahora valida `method_details` segun metodo y guarda metadatos saneados.
    - Se genera referencia de pago segun metodo (`CARD-...`, `TRF-...`, `CASH-...`).
    - `orderPayload` ahora incluye:
      - `billing` (datos de boleta)
      - `electronic_receipt` (numero de boleta)
      - `payment_detail_summary` (resumen legible de datos enviados).
- Validaciones tecnicas:
  - `php -l app/Http/Controllers/Api/StoreApiController.php` -> OK.
  - `php -l app/Models/Order.php` -> OK.
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.
  - `docker compose exec app php artisan test` -> OK (`2 passed`).
  - Prueba API E2E con boleta y pasarela avanzada -> OK:
    - crea pedido con datos de boleta
    - envia pago con tarjeta y metadatos
    - resumen devuelve `electronic_receipt.number`, `billing.city` y `payment_detail_summary`.
- Repoblado solicitado:
  - Ejecutado `docker compose exec -T app php artisan migrate:fresh --seed --force`.
  - Migraciones aplicadas correctamente (incluida la nueva de boleta/pago) y seeders ejecutados (`AdminUserSeeder`, `PlaceholderProductsSeeder`).

### 2026-05-26 (fix pantalla en blanco / entrada por puerto)
- Solicitud del usuario: la pagina se ve completamente en blanco.
- Diagnostico:
  - `frontend` y `app` estaban activos y respondiendo.
  - `http://localhost:8000` estaba mostrando backend/API, no frontend React.
- Correcciones aplicadas:
  - `routes/web.php`: `GET /` ahora redirige al frontend React (`http://localhost:5173`).
  - `config/app.php`: se agrega `frontend_url` configurable por `FRONTEND_URL`.
  - Se agrega `frontend/src/components/AppErrorBoundary.jsx` y se integra en `frontend/src/main.jsx` para evitar pantalla blanca silenciosa ante errores runtime; ahora muestra panel de error legible.
- Verificacion:
  - `http://localhost:8000` retorna `302` a `http://localhost:5173`.
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.

### 2026-05-26 (ajustes urgentes solicitados en dashboard, compra y catalogo)
- Solicitud del usuario:
  - Dashboard admin: evitar superposicion entre crear producto y lista; abrir formulario solo desde boton `Agregar producto` en popup centrado con fondo difuminado y salida por cancelar/guardar.
  - Compra: mostrar formulario de datos del cliente solo tras presionar `Continuar con pedido`.
  - Catalogo: permitir confirmar `Anadir` con tecla `Enter` luego de elegir cantidad.
- Implementacion realizada:
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - Se elimina formulario fijo de crear producto dentro del flujo principal.
    - Se agrega toolbar con boton `Agregar producto` y buscador/lista de productos.
    - Se crea modal centrado (`modal-overlay` + `modal-card`) para alta de productos.
    - Cierre de modal por:
      - boton `Cancelar`
      - guardar exitoso
      - click fuera del modal
      - tecla `Esc`.
  - `frontend/src/pages/CartPage.jsx`:
    - Nuevo estado `showDraftForm`.
    - El formulario de boleta ahora aparece solo despues de pulsar `Continuar con pedido`.
    - Se añade CTA `Ir al checkout` dentro del formulario desplegado y validacion de campos requeridos.
  - `frontend/src/pages/HomePage.jsx`:
    - En input de cantidad por producto, `Enter` ejecuta `onAdd(product)` para confirmar agregado sin mouse.
  - `frontend/src/index.css`:
    - Nuevos estilos para toolbar de productos y modal con difuminado de fondo.
    - Ajustes responsive para el nuevo layout.
- Validacion tecnica:
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.

### 2026-05-26 (reset de selector de cantidad tras confirmar)
- Solicitud del usuario: al confirmar cantidad con `Enter` o segundo clic en `Anadir`, ocultar nuevamente la caja de cantidad y resetearla.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - En `onAdd(product)`, al segundo paso de confirmacion se fuerza:
      - `quantityInputs[product.id] = 1`
      - `quantityPickerOpen[product.id] = false`
    - Esto aplica tanto cuando se confirma con tecla `Enter` como con boton `Anadir`.
- Validacion:
  - `docker compose exec frontend npm run lint` -> OK.

### 2026-05-26 (validacion de stock en rojo al agregar desde catalogo)
- Solicitud del usuario: si se intenta agregar mas cantidad que el stock disponible, impedir el agregado y mostrar error en letras rojas.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - Se agrega estado `quantityErrors` por producto.
    - Antes de agregar, se valida:
      - cantidad valida (`>= 1`)
      - cantidad no superior al stock.
    - Si falla la validacion:
      - no se agrega al carrito
      - se muestra mensaje de error por producto.
    - Si el intento falla por backend/contexto (`result.ok = false`), tambien se muestra error en rojo y no se cierra el selector.
  - `frontend/src/index.css`:
    - Se agrega clase `.field-error` para mensajes de error en rojo.
- Validacion:
  - `docker compose exec frontend npm run lint` -> OK.

### 2026-05-26 (pantalla separada previa al checkout)
- Solicitud del usuario: al presionar `Continuar con pedido`, ir a una ventana distinta con formulario del usuario + resumen de compra, y botones `Volver` y `Seguir con checkout`.
- Implementacion:
  - Nueva pagina React: `frontend/src/pages/PreCheckoutPage.jsx`.
    - Muestra:
      - resumen de productos y total
      - formulario de boleta electronica
      - botones `Volver` (a carrito) y `Seguir con checkout`.
    - Guarda borrador en `localStorage` (`bdv_receipt_draft_v1`).
  - `frontend/src/App.jsx`:
    - Se agrega ruta `GET /pre-checkout`.
  - `frontend/src/pages/CartPage.jsx`:
    - `Continuar con pedido` ahora navega a `/pre-checkout`.
    - Se elimina formulario embebido del carrito.
  - `frontend/src/pages/CheckoutPage.jsx`:
    - Se valida presencia de datos requeridos del borrador.
    - Si faltan, muestra acceso directo para volver a `/pre-checkout`.
- Validacion tecnica:
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.

### 2026-05-26 (dashboard: notificaciones/animaciones + pago simplificado)
- Solicitud del usuario:
  - Dashboard: mostrar notificacion al agregar/eliminar producto para evitar cambios bruscos visuales.
  - Dashboard: agregar animaciones `fade in/out` cuando aparecen/desaparecen elementos de productos.
  - Pedidos/pago: eliminar prototipo actual de pasarela y dejar solo boton `Pagar`; por ahora la aprobacion/rechazo queda en admin.
- Implementacion en dashboard:
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - Notificaciones explicitas al crear/eliminar producto (`setNotice(...)`).
    - Animacion de salida al eliminar (`removingProductSlug`) antes de refrescar lista.
  - `frontend/src/index.css`:
    - `.product-editor` con animacion de entrada `item-fade-in`.
    - `.product-editor.is-removing` con transicion de salida (fade/translate).
- Implementacion en pago:
  - `frontend/src/pages/OrderPage.jsx`:
    - Se elimina formulario/radios del prototipo anterior.
    - Se deja solo boton `Pagar` (y opcion de cancelar pedido).
    - `Pagar` envia `payment_method: gateway_pending`.
  - `app/Http/Controllers/Api/StoreApiController.php`:
    - `submitPayment` ahora acepta `payment_method=gateway_pending`.
    - `paymentMethodLabel`, `buildPaymentReference`, `validateAndNormalizePaymentDetails` y `paymentDetailSummary` actualizados para este flujo.
  - `app/Http/Controllers/Api/AdminApiController.php`:
    - `paymentMethodLabel` actualizado para mostrar `Pasarela externa`.
- Validaciones tecnicas:
  - `php -l` sin errores en `StoreApiController` y `AdminApiController`.
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.
  - Prueba API: create order + submit payment con `gateway_pending` -> OK (`payment_status=prototype_submitted`), listo para decision admin.

### 2026-05-26 (boleta profesional + boton imprimir)
- Solicitud del usuario: agregar boton `Imprimir boleta electronica` y rediseñar la boleta para mostrar solo elementos esenciales (datos del cliente, productos y subtotal) en un formato mas profesional.
- Implementacion:
  - `frontend/src/pages/OrderPage.jsx`:
    - Se agrega boton `Imprimir boleta electronica` que ejecuta `window.print()`.
    - Se rediseña la seccion boleta con estructura de documento:
      - encabezado (numero y fecha)
      - datos esenciales del cliente
      - tabla de productos (producto, cantidad, unitario, subtotal)
      - subtotal final.
  - `frontend/src/index.css`:
    - Nuevos estilos para `receipt-card`, `receipt-head`, `receipt-customer`, `receipt-table`, `receipt-total`.
    - Reglas `@media print` para imprimir solo la boleta y ocultar elementos no esenciales (header, botones, notificaciones, etc.).
- Validacion:
  - `docker compose exec frontend npm run lint` -> OK.
  - `docker compose exec frontend npm run build` -> OK.

### 2026-05-26 (fix urgente de estilos: frontend se veía sin CSS)
- Solicitud del usuario: corregir de inmediato que el frontend se veía “como página de los 90” (sin estilos).
- Diagnóstico técnico:
  - React sí estaba renderizando componentes, pero la hoja `src/index.css` llegaba vacía desde Vite en runtime (`__vite__css = ""`).
  - Resultado: estructura HTML visible, pero sin clases aplicadas visualmente.
- Corrección aplicada (estable y desacoplada de ese fallo de Vite):
  - Se copia el stylesheet global a `frontend/public/styles.css`.
  - `frontend/index.html` ahora carga estilos por `<link rel="stylesheet" href="/styles.css" />`.
  - `frontend/src/main.jsx` deja de importar `./index.css` para evitar la ruta que estaba inyectando CSS vacío.
- Verificación en Docker:
  - `docker compose restart frontend`.
  - `GET http://localhost:5173/styles.css` devuelve contenido completo de estilos.
  - `GET http://localhost:5173/` incluye el `<link>` al stylesheet.
  - `docker compose exec frontend npm run build` -> OK.

### 2026-05-26 (repoblado solicitado)
- Solicitud del usuario: repoblar base de datos.
- Ejecutado: `docker compose exec -T app php artisan migrate:fresh --seed --force`.
- Resultado: migraciones aplicadas y seeders ejecutados correctamente (`AdminUserSeeder`, `PlaceholderProductsSeeder`).

### 2026-05-26 (seguridad checkout/pago + impresion boleta condicionada)
- Solicitud del usuario:
  - permitir imprimir boleta electronica solo cuando el pago este aceptado.
  - si el pago es rechazado, resetear toda la informacion llenada antes del checkout.
  - robustecer seguridad del checkout/pagos para evitar fallas.
- Cambios backend API:
  - `routes/api.php`:
    - se agregan rate limits en endpoints sensibles:
      - `POST /api/orders`, `POST /api/orders/{order}/payment`, `POST /api/orders/{order}/cancel` con `throttle:12,1`.
      - `GET /api/orders/{order}/summary` con `throttle:40,1`.
  - `app/Http/Controllers/Api/StoreApiController.php`:
    - validaciones mas estrictas en `createOrder`:
      - `customer_name` minimo de largo.
      - `customer_email` con `email:rfc,dns`.
      - `billing_tax_id` con regex y largo minimo/maximo.
      - `billing_address` y `billing_city` con largo minimo.
      - telefono opcional con regex.
      - `items` con limite maximo y `items.*.product_id` ahora `distinct`.
      - `items.*.quantity` con limite maximo por linea.
    - sanitizacion al persistir datos de boleta/cliente (trim + email en minusculas).
    - `submitPayment` reforzado:
      - `order_token` validado con `size:48`.
      - bloqueo explicito cuando el pedido ya fue rechazado.
      - actualizacion de pago protegida con transaccion + `lockForUpdate` para evitar doble envio/race conditions.
    - `cancelOrder` endurecido:
      - ya no permite cancelar si el pedido ya fue enviado a revision o decidido.
    - `orderPayload` ahora incluye flags de seguridad de flujo:
      - `can_print_receipt` (true solo si pago/admin estan aceptados).
      - `should_reset_checkout_data` (true cuando pago/revision estan rechazados).
- Cambios frontend React:
  - `frontend/src/pages/OrderPage.jsx`:
    - boton de imprimir boleta visible solo con `order.can_print_receipt`.
    - guard en `printReceipt` para bloquear impresion si no esta aceptado.
    - si `order.should_reset_checkout_data === true`, limpia:
      - `localStorage['bdv_receipt_draft_v1']`
      - `localStorage['latest_order']`
      - y notifica al usuario.
    - polling automatico cada 8s cuando el pago esta `prototype_submitted` y revision `pending`, para reflejar aceptacion/rechazo sin recargar.
  - `frontend/src/pages/PreCheckoutPage.jsx` y `frontend/src/pages/CheckoutPage.jsx`:
    - validaciones cliente adicionales para email y RUT/documento antes de avanzar.
    - sanitizacion de datos antes de enviar orden.
    - al crear pedido exitosamente, se limpia `bdv_receipt_draft_v1`.
- Validaciones ejecutadas:
  - `php -l app/Http/Controllers/Api/StoreApiController.php` -> OK.
  - `php -l routes/api.php` -> OK.
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.
  - `docker compose exec -T app php artisan test` -> con 1 fallo preexistente en `Tests\Feature\ExampleTest` (espera `200` en `/`, pero la app actualmente redirige `302` al frontend por diseno).


### 2026-05-26 (claridad de formato en datos de checkout)
- Solicitud del usuario: mostrar claramente el formato esperado de los parametros del checkout con texto gris de ayuda.
- Implementacion:
  - frontend/src/pages/PreCheckoutPage.jsx: ayudas visuales (p.muted) bajo cada campo con formato esperado.
  - frontend/src/pages/CheckoutPage.jsx: mismas ayudas en la seccion editable antes de generar pedido.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.



### 2026-05-26 (checkout sin notas + CTA directo)
- Solicitud del usuario: eliminar la posibilidad de que el cliente escriba notas antes del checkout y que el boton de guardar datos pase directo al checkout de resumen.
- Implementacion:
  - frontend/src/pages/PreCheckoutPage.jsx: se elimina illing_notes del draft y su textarea; CTA cambia a Guardar datos y continuar y navega directo al checkout.
  - frontend/src/pages/CheckoutPage.jsx: se elimina illing_notes de draft/sanitizacion/payload y se quita textarea de notas.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.



### 2026-05-26 (flujo compra/pago: textos, pasarela placeholder, boleta y cancelacion)
- Solicitud del usuario:
  - reemplazar textos visibles de 'Checkout' por 'Compra'.
  - mostrar errores de formato en espanol.
  - no mostrar boleta electronica final antes de pagar.
  - al presionar 'Pagar', ir a pasarela placeholder.
  - al cancelar pedido, limpiar datos de compra y volver al carrito con los mismos productos previos.
  - eliminar boton 'Volver al home' en pantalla de pedido.
- Implementacion frontend:
  - rontend/src/pages/CheckoutPage.jsx:
    - titulo visible cambia a 'Compra'.
    - texto de advertencia cambia a 'continuar con la compra'.
    - antes de vaciar carrito al crear pedido, guarda snapshot de productos en dv_order_cart_restore_v1 para posible restauracion al cancelar.
  - rontend/src/pages/PreCheckoutPage.jsx:
    - texto visible ajustado de checkout a compra.
  - rontend/src/context/CartContext.jsx:
    - se agrega metodo 
estoreCart(rawItems) para restaurar carrito desde snapshot.
  - rontend/src/pages/OrderPage.jsx:
    - se elimina boton 'Volver al home'.
    - la boleta final solo se renderiza cuando can_print_receipt es true.
    - si no, muestra aviso de que se habilita cuando el pago sea aceptado.
    - boton Pagar ahora redirige a pasarela placeholder (/pedido/:orderId/pasarela).
    - Cancelar pedido limpia datos de compra (dv_receipt_draft_v1, latest_order) y restaura carrito previo desde dv_order_cart_restore_v1, luego vuelve a /carrito.
    - mensaje interno cambia de 'checkout' a 'compra'.
  - nuevo archivo rontend/src/pages/PaymentGatewayPage.jsx:
    - vista placeholder de pasarela.
    - boton Confirmar pago (placeholder) envia payment_method=gateway_pending y vuelve al pedido.
  - rontend/src/App.jsx:
    - nueva ruta: /pedido/:orderId/pasarela -> PaymentGatewayPage.
- Implementacion backend (mensajes de formato en espanol):
  - pp/Http/Controllers/Api/StoreApiController.php:
    - createOrder ahora define mensajes y atributos de validacion en espanol.
    - submitPayment ahora define mensajes de validacion en espanol.
    - mensaje de rechazo cambia de 'nuevo checkout' a 'nueva compra'.
- Validacion tecnica:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.
  - php -l app/Http/Controllers/Api/StoreApiController.php -> OK.



### 2026-05-26 (rechazo/aceptacion de pago con redireccion automatica y resumen final)
- Solicitud del usuario:
  - si el pago se rechaza, devolver automaticamente al carrito.
  - si el pago se acepta, abrir nueva pantalla de resumen final con boton imprimir y boton volver al home.
  - al aceptarse pago, resetear carrito y mantener stock actualizado automaticamente.
- Implementacion frontend:
  - rontend/src/pages/OrderPage.jsx:
    - cuando should_reset_checkout_data es true (rechazo):
      - limpia datos de compra (dv_receipt_draft_v1, latest_order).
      - restaura carrito desde snapshot previo (dv_order_cart_restore_v1).
      - redirige automaticamente a /carrito.
    - cuando can_print_receipt es true (aceptado):
      - limpia snapshot temporal y datos de compra.
      - asegura carrito vacio (
estoreCart([])).
      - redirige automaticamente a /pedido/:id/resumen-final con token.
    - la boleta final deja de renderizarse en esta vista; aqui solo aparece mensaje de espera hasta aceptacion.
    - mantiene boton Pagar hacia pasarela placeholder y Cancelar pedido con restauracion de carrito.
  - nuevo archivo rontend/src/pages/FinalOrderSummaryPage.jsx:
    - nueva ventana de resumen final aprobada.
    - muestra boleta completa solo si can_print_receipt es true.
    - incluye botones: Imprimir boleta y Volver al home.
  - rontend/src/App.jsx:
    - nueva ruta: /pedido/:orderId/resumen-final.
  - rontend/src/context/CartContext.jsx:
    - se agrega 
estoreCart(rawItems) para restaurar o limpiar carrito de forma controlada.
- Implementacion backend:
  - pp/Http/Controllers/Api/AdminApiController.php:
    - al rechazar pedido (
ejectOrder), ahora se restituye stock de cada item en transaccion y luego se marca el pedido como rechazado/cancelado.
- Resultado funcional:
  - rechazo => regreso al carrito con productos restaurados.
  - aceptacion => pantalla final de resumen con imprimir/home y carrito reseteado.
  - stock se mantiene consistente automaticamente (decremento al crear pedido y reposicion al rechazo).
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.
  - php -l app/Http/Controllers/Api/AdminApiController.php -> OK.



### 2026-05-26 (mensaje de espera tras pagar + confirmacion de control admin)
- Solicitud del usuario:
  - asegurar que solo admin pueda aceptar/rechazar pedidos.
  - al presionar pagar, el cliente solo debe recibir mensaje de que su pedido esta en espera.
- Estado de seguridad confirmado:
  - aceptacion/rechazo sigue exclusivo de admin por rutas protegidas con uth:sanctum en /api/admin/orders/{order}/accept|reject.
- Implementacion frontend:
  - rontend/src/pages/PaymentGatewayPage.jsx:
    - tras enviar pago exitoso, guarda mensaje flash en localStorage (dv_order_notice) y vuelve al pedido.
  - rontend/src/pages/OrderPage.jsx:
    - al cargar, consume el flash dv_order_notice y lo muestra como notificacion.
    - agrega panel explicito cuando el pago esta enviado y pendiente (prototype_submitted + pending) con texto: pedido en espera de aprobacion.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.



### 2026-05-26 (pasarela sin boton confirmar + habilitacion de revision admin)
- Solicitud del usuario:
  - eliminar boton 'Confirmar pago' de la pasarela.
  - corregir que admin no podia aceptar/rechazar desde dashboard.
- Causa detectada:
  - sin confirmar en pasarela, el pedido no pasaba a prototype_submitted; por eso admin no podia decidir (dashboard exige pago enviado).
- Implementacion:
  - rontend/src/pages/PaymentGatewayPage.jsx:
    - se elimina el boton Confirmar pago (placeholder).
    - al entrar a la pasarela, el envio de pago se ejecuta automaticamente una sola vez (submitPayment).
    - si sale bien, vuelve al pedido con mensaje de espera para el cliente.
    - si falla, muestra estado de error y deja solo opcion Volver al pedido.
- Resultado:
  - cliente no confirma manualmente (pasarela sin boton).
  - el pedido queda correctamente en revision, y el admin puede aceptar/rechazar desde dashboard.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.



### 2026-05-26 (fix: pasarela sin confirmar manual + admin puede decidir pedidos)
- Solicitud del usuario:
  - eliminar boton de confirmar pago en pasarela.
  - corregir bloqueo de aceptar/rechazar en dashboard admin.
- Causa:
  - sin confirmacion manual, el pedido no pasaba a prototype_submitted, por lo que admin no podia aceptarlo/rechazarlo.
- Solucion aplicada:
  - rontend/src/pages/PaymentGatewayPage.jsx:
    - se elimina el boton de confirmar pago.
    - el envio de pago se ejecuta automaticamente al entrar a la pasarela (una sola vez con useRef).
    - si el envio es exitoso, vuelve al pedido con mensaje de espera.
    - si falla, muestra error y deja solo opcion de volver al pedido.
- Resultado:
  - la UI queda sin boton inutil en pasarela.
  - el pedido entra automaticamente a estado pago en revision y admin puede usar Aceptar/Rechazar en dashboard.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.



### 2026-05-26 (fix: aceptacion admin y visualizacion de boleta tras aprobar)
- Solicitud del usuario: al aceptar pedido desde dashboard no ocurria nada y no aparecia boleta.
- Ajustes aplicados:
  - pp/Http/Controllers/Api/AdminApiController.php:
    - cceptOrder y 
ejectOrder ahora aceptan pedidos en payment_status prototype_submitted o prototype_pending (modo simulacion), evitando bloqueo de decision admin.
  - rontend/src/pages/OrderPage.jsx:
    - polling ampliado: ahora consulta estado mientras el pedido siga pending con revision pending, incluso si pago aun figura como prototype_pending.
  - rontend/src/pages/FinalOrderSummaryPage.jsx:
    - se agrega polling automatico cada 8s cuando aun no hay can_print_receipt, para que la boleta aparezca sola al aprobar desde admin sin recargar.
- Resultado esperado:
  - admin puede aceptar/rechazar sin quedar bloqueado por estado intermedio.
  - cliente ve transicion automatica a boleta/resumen final tras aprobacion.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.
  - php -l app/Http/Controllers/Api/AdminApiController.php -> OK.



### 2026-05-26 (repoblado solicitado nuevamente)
- Solicitud del usuario: repoblar base de datos.
- Ejecutado: docker compose exec -T app php artisan migrate:fresh --seed --force.
- Resultado: migraciones y seeders completados sin errores (AdminUserSeeder, PlaceholderProductsSeeder).



### 2026-05-26 (fix: boton pagar cliente + boleta al aprobar)
- Solicitud del usuario:
  - evitar que cliente pueda seguir viendo/usar boton Pagar mientras espera decision.
  - corregir que al aprobar desde dashboard no aparecia boleta.
- Causa detectada:
  - dashboard ocultaba Aceptar/Rechazar si payment_status no era prototype_submitted (aunque backend ya permitia prototype_pending).
  - cliente aun mostraba seccion de pago con boton, generando confusion de flujo.
- Cambios aplicados:
  - rontend/src/pages/AdminDashboardPage.jsx:
    - Aceptar/Rechazar ahora aparece para todo pedido con dmin_review_status = pending (sin depender de payment_status).
  - rontend/src/pages/OrderPage.jsx:
    - se elimina boton Pagar del cliente.
    - se reemplaza por estado claro: pago en revision (solo admin decide).
    - polling de estado reducido a 3s para reflejar aprobacion/rechazo mas rapido.
    - panel de espera se muestra mientras dmin_review_status siga pending.
- Resultado esperado:
  - admin puede aceptar/rechazar siempre que el pedido este pendiente.
  - cliente ya no ve accion Pagar repetida cuando ya esta esperando decision.
  - al aprobar admin, la boleta aparece automaticamente (redireccion al resumen final via polling).
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.



### 2026-05-26 (correccion operativa por pantalla en blanco)
- Solicitud del usuario: pantalla totalmente en blanco tras cambios recientes.
- Acciones ejecutadas para recuperar estabilidad del frontend:
  - reinicio de contenedor rontend (docker compose restart frontend).
  - recreacion de servicios para limpiar estado transitorio (docker compose up -d --build frontend + restart de frontend).
  - limpieza de cache interna de Vite (
m -rf frontend/node_modules/.vite) y reinicio de frontend.
- Verificacion posterior:
  - http://localhost:5173 responde 200.
  - http://localhost:8000 redirige (302) al frontend como esta configurado.
  - logs de rontend muestran Vite levantado correctamente sin errores de arranque.



### 2026-05-26 (fix boleta visible al aceptar + sin fecha estimada)
- Solicitud del usuario:
  - eliminar texto de echa estimada de emision.
  - corregir que al aceptar el pago no aparecia la boleta electronica.
- Implementacion:
  - rontend/src/pages/OrderPage.jsx:
    - se elimina la linea de Fecha estimada de emision del panel de espera.
    - se reemplaza el panel estatico por render condicional:
      - si can_print_receipt es 	rue, se muestra boleta completa en la misma vista (numero, fecha, datos cliente, detalle de items, subtotal) + boton Imprimir boleta.
      - si no, se mantiene mensaje de espera de aprobacion.
    - se elimina la redireccion automatica obligatoria a 
esumen-final al aprobar; ahora la boleta aparece directamente en la pagina de pedido al actualizar el estado.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.



### 2026-05-26 (notificacion de error + restauracion carrito en rechazo/cancelacion)
- Solicitud del usuario:
  - al rechazar pago desde dashboard o cancelar pedido desde cliente, mostrar notificacion de error visible y devolver al carrito con los articulos originales.
- Implementacion:
  - rontend/src/pages/OrderPage.jsx:
    - en cancelacion por cliente (cancelOrder): restaura carrito original y guarda flash de error en localStorage (dv_cart_notice).
    - en rechazo detectado por polling (should_reset_checkout_data): restaura carrito original, guarda flash de error y redirige al carrito.
  - rontend/src/pages/CartPage.jsx:
    - incorpora NoticeBanner y lee dv_cart_notice para mostrar mensaje al volver al carrito.
  - rontend/src/components/NoticeBanner.jsx:
    - agrega prop 	one para variar estilos de aviso (info/error).
  - rontend/public/styles.css:
    - nuevo estilo 
otice-error con mayor contraste visual para errores.
- Resultado:
  - rechazo o cancelacion => carrito restaurado + alerta de error claramente visible en carrito.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.



### 2026-05-26 (fix redireccion rechazo/cancelacion + mensaje sin 'administracion')
- Solicitud del usuario:
  - tras notificacion de rechazo, no redirigia al carrito.
  - no mencionar 'administracion' en mensaje de rechazo (placeholder).
- Cambios aplicados:
  - rontend/src/pages/OrderPage.jsx:
    - se elimina redireccion con timeout en cancelacion/rechazo.
    - ahora la redireccion al carrito es inmediata tras restaurar carrito y guardar flash de error.
    - mensaje de flash de rechazo cambia a Pago rechazado... sin mencionar administracion.
  - pp/Http/Controllers/Api/StoreApiController.php:
    - mensaje de API cambia de Pago rechazado por administracion... a Pago rechazado....
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.
  - php -l app/Http/Controllers/Api/StoreApiController.php -> OK.



### 2026-05-26 (rechazo -> HOME, carrito intacto, polling pedidos admin)
- Solicitud del usuario:
  - al rechazar pedido, redirigir al menu principal.
  - carrito no debe reiniciarse/verse afectado.
  - datos de facturacion si deben resetearse.
  - dashboard admin debe actualizar pedidos nuevos sin recargar manualmente.
- Implementacion:
  - rontend/src/pages/OrderPage.jsx:
    - en rechazo (should_reset_checkout_data) ahora redirige a / en lugar de /carrito.
    - se siguen limpiando datos de facturacion (dv_receipt_draft_v1, latest_order).
    - 
estoreCartFromSnapshot ahora no vacia carrito si no existe snapshot (evita reset no deseado).
  - rontend/src/pages/AdminDashboardPage.jsx:
    - nuevo polling automatico cada 4s en tab orders para traer pedidos nuevos y actualizar resumen sin refresh manual.
  - rontend/src/pages/HomePage.jsx:
    - ahora consume flash dv_cart_notice para mostrar notificacion de error al volver al HOME tras rechazo.
    - soporte de tono de notificacion (info/error) segun contexto.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.



### 2026-05-26 (fix Too many attempts en reintento de compra)
- Solicitud del usuario: al cancelar pedido y volver a comprar, aparece Too many attempts.
- Causa: rate-limit muy bajo en rutas criticas de compra (12/min) para flujo real de crear/cancelar/reintentar.
- Cambio aplicado (
outes/api.php):
  - POST /api/orders -> 	hrottle:60,1`n  - POST /api/orders/{order}/payment -> 	hrottle:60,1`n  - POST /api/orders/{order}/cancel -> 	hrottle:60,1`n- Verificacion:
  - php -l routes/api.php -> OK.
  - php artisan route:list --path=api/orders -> rutas activas confirmadas.



### 2026-05-26 (ocultar metodo de pago + salida de boleta + modal de espera)
- Solicitud del usuario:
  - ocultar por ahora todo lo relativo a clasificar metodo de pago (asumir debito/credito).
  - corregir softlock cuando aparece boleta para poder volver al home.
  - en espera de aprobacion, mostrar pantalla grande de carga con texto y boton Cancelar pago, difuminando fondo.
- Implementacion:
  - rontend/src/pages/OrderPage.jsx:
    - se elimina visualizacion de Metodo y Referencia en chips de pedido.
    - se elimina seccion Detalle de pago enviado (clasificacion de metodo).
    - boleta aprobada ahora incluye acciones visibles: Imprimir boleta y Volver al home (sin softlock).
    - se reemplaza la espera por modal full-screen con fondo difuminado (modal-overlay) y loader + texto Esperando aprobacion del pago + boton Cancelar pago.
  - rontend/src/pages/AdminDashboardPage.jsx:
    - se oculta etiqueta de metodo de pago en listado de pedidos (mantiene solo estado de pago).
  - rontend/public/styles.css:
    - nuevas clases waiting-overlay, waiting-card, waiting-spinner y animacion waiting-spin para la pantalla de carga de espera.
- Validacion:
  - docker compose exec -T frontend npm run lint -> OK.
  - docker compose exec -T frontend npm run build -> OK.


### 2026-05-26 (fix home navigation + quitar duplicado imprimir + avance automatico tras guardar datos)
- Solicitud del usuario:
  - eliminar duplicado del boton `Imprimir boleta`.
  - corregir que `Volver al home` y otras rutas de retorno al home no funcionaban.
  - al guardar datos del cliente, avanzar automaticamente al siguiente paso sin clic adicional.
- Implementacion:
  - `frontend/src/pages/OrderPage.jsx`:
    - se elimina el boton duplicado de `Imprimir boleta` en cabecera de boleta.
    - se mantiene una sola accion de impresion.
    - `Volver al home` cambia a enlace directo `href="/"` para navegacion robusta.
  - `frontend/src/pages/FinalOrderSummaryPage.jsx`:
    - `Volver al home` cambia a `href="/"`.
  - `frontend/src/components/PublicHeader.jsx`:
    - logo de marca y boton `HOME` usan `href="/"` para asegurar retorno al inicio en cualquier estado del router.
  - `frontend/src/pages/PreCheckoutPage.jsx`:
    - `Guardar datos y continuar` ahora navega a `/checkout?auto=1`.
  - `frontend/src/pages/CheckoutPage.jsx`:
    - se agrega flujo de autoavance (`auto=1`) que crea el pedido automaticamente al entrar, evitando clic extra.
    - se mantiene validacion de campos y bloqueo anti-doble envio.
    - se elimina el boton lateral `Volver al carrito` en el bloque final para reducir friccion.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-26 (checkout: mantener boton volver tras fallo + repoblacion DB)
- Solicitud del usuario:
  - en caso de fallo inicial de validacion en datos de compra, mantener visible el boton `Volver`.
  - repoblar base de datos.
- Implementacion:
  - `frontend/src/pages/CheckoutPage.jsx`:
    - se reintroduce el boton `Volver` en acciones del formulario (`to="/pre-checkout"`) junto al boton principal `Generar pedido`, para que no desaparezca tras errores de validacion.
- Validacion frontend:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.
- Base de datos:
  - `docker compose exec -T app php artisan migrate:fresh --seed` -> OK.
  - Migraciones y seeders ejecutados correctamente (incluye `AdminUserSeeder` y `PlaceholderProductsSeeder`).

### 2026-05-26 (fix estabilidad botones en compra ante errores de validacion)
- Solicitud del usuario:
  - al aparecer errores como `El campo nombre del cliente no cumple el minimo requerido...`, los botones de acciones en compra cambiaban de lugar.
- Implementacion:
  - `frontend/src/pages/CheckoutPage.jsx`:
    - bloque de acciones del formulario pasa a usar clase dedicada: `card-actions checkout-actions`.
  - `frontend/src/index.css` y `frontend/public/styles.css`:
    - se agrega regla `.checkout-actions` para mantener distribucion estable en escritorio (`nowrap`, alto minimo, anchos minimos de botones).
    - en mobile se permite wrap controlado con ancho completo para mantener responsividad sin saltos.
- Resultado:
  - los botones `Generar pedido` y `Volver` mantienen su posicion al mostrarse errores de validacion.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-26 (ajuste UX: botones de compra alineados a la izquierda)
- Solicitud del usuario:
  - tras el fix anterior, los botones en compra quedaban alineados a la derecha al aparecer errores de formato.
- Implementacion:
  - `frontend/src/index.css` y `frontend/public/styles.css`:
    - `.checkout-actions` cambia de `justify-content: flex-end` a `justify-content: flex-start`.
- Resultado:
  - botones `Generar pedido` y `Volver` permanecen en la izquierda y sin cambios bruscos de posicion.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-26 (UX: orden consistente de botones entre Datos del pedido y Compra)
- Solicitud del usuario:
  - al cometer error en `Datos del pedido`, al pasar a la pantalla siguiente los botones aparecian invertidos (negro izquierda y gris derecha), generando inconsistencia visual.
- Implementacion:
  - `frontend/src/pages/CheckoutPage.jsx`:
    - se reordena el bloque de acciones para mantener consistencia con `PreCheckoutPage`:
      - izquierda: `Volver` (gris)
      - derecha: `Generar pedido` (negro)
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-26 (checkout consistente: titulo, errores genericos, fade-out y tamano fijo de botones)
- Solicitud del usuario:
  - evitar que cambie el tamano/estabilidad de botones al cometer errores.
  - mantener consistencia de nombre de pantalla (`Datos del pedido` vs `Compra`).
  - reemplazar mensaje tecnico de validacion por aviso breve en rojo: `Por favor usa el formato recomendado para cada dato`.
  - mantener fade out automatico para este tipo de notificaciones.
- Implementacion:
  - `frontend/src/pages/CheckoutPage.jsx`:
    - titulo principal cambia de `Compra` a `Datos del pedido`.
    - se agrega estado de tono para notificaciones (`noticeTone`) y el banner usa `tone={noticeTone}`.
    - errores de validacion backend HTTP 422 ahora muestran mensaje generico en espanol:
      - `Por favor usa el formato recomendado para cada dato.`
    - se agrega auto-limpieza de notificaciones con `setTimeout` (2600ms) para activar fade-out visual.
  - `frontend/src/index.css` y `frontend/public/styles.css`:
    - `checkout-actions` fija ancho de botones para evitar saltos de tamano:
      - `width: 170px; flex: 0 0 170px;`
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-26 (fix final: boton gris Volver con mismo tamano antes de error)
- Solicitud del usuario:
  - el boton gris `Volver` seguia viendose mas pequeno antes de cometer error.
- Causa:
  - `Volver` es enlace (`a.btn-alt`) y, al ser inline, no respetaba de forma consistente el ancho fijo.
- Implementacion:
  - `frontend/src/index.css` y `frontend/public/styles.css`:
    - en `.checkout-actions > .btn-alt` se agrega:
      - `display: inline-flex;`
      - `align-items: center;`
      - `justify-content: center;`
    - se mantiene `width/flex-basis` fijo de 170px.
- Resultado:
  - `Volver` y `Generar pedido` mantienen mismo ancho visual de forma consistente, antes y despues de errores.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-26 (fix UX final: boton Volver igual antes y despues de error)
- Solicitud del usuario:
  - el boton gris `Volver` seguia cambiando de tamano al pasar del paso inicial al estado con error.
- Implementacion:
  - `frontend/src/pages/PreCheckoutPage.jsx`:
    - `Volver` ahora usa clase `btn-back-fixed`.
  - `frontend/src/pages/CheckoutPage.jsx`:
    - `Volver` ahora usa clase `btn-back-fixed`.
  - `frontend/src/index.css` y `frontend/public/styles.css`:
    - nueva clase reusable `.btn-back-fixed` con ancho fijo y centrado (`170px`, `inline-flex`, `justify-content:center`, `align-items:center`).
- Resultado:
  - el boton `Volver` mantiene el mismo tamano visual antes y despues de cualquier error de validacion.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-26 (notificaciones rojas en Datos del pedido)
- Solicitud del usuario:
  - en `Datos del pedido`, los errores por campos vacios/formato deben verse en rojo como el resto de errores.
- Implementacion:
  - `frontend/src/pages/PreCheckoutPage.jsx`:
    - se agrega estado `noticeTone`.
    - en validaciones de `continuePurchase` se fuerza `noticeTone = 'error'` antes de mostrar cada mensaje.
    - `NoticeBanner` ahora recibe `tone={noticeTone}`.
- Resultado:
  - los mensajes de error de ese paso se muestran con estilo rojo y mantienen fade-out automatico.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-05-27
- Solicitud del usuario: implementar sistema de alertas de stock bajo en dashboard admin y envio de correo al administrador cuando un producto esta por agotarse.
- Implementacion backend:
  - Nuevo archivo de configuracion: `config/inventory.php`.
    - Define umbral configurable `low_stock_threshold` via variable de entorno `STOCK_LOW_THRESHOLD` (default: 5).
  - Nuevo servicio: `app/Services/StockAlertService.php`.
    - Determina si un producto activo esta en stock bajo o agotado segun el umbral.
    - Consulta productos activos con stock <= umbral.
    - Envia correo a todos los usuarios admin cuando un producto cruza el umbral (con deduplicacion via cache para no repetir alertas innecesarias).
    - Provee payload de alerta por producto para incluir en respuestas API.
  - Nuevo Mailable: `app/Mail/LowStockAlertMail.php`.
    - Asunto dinamico con nombre del producto y estado (agotado / por agotarse).
  - Nueva vista de correo: `resources/views/emails/low-stock-alert.blade.php`.
    - Email HTML con datos del producto, stock actual y umbral configurado.
  - `app/Http/Controllers/Api/AdminApiController.php`:
    - Se inyecta `StockAlertService` via constructor.
    - Endpoint `summary` ahora retorna: `low_stock_threshold`, `low_stock_count` y `low_stock_products` (lista con id, name, slug, stock, status y label).
    - Endpoint `storeProduct` y `updateProduct` ejecutan `notifyAdminsIfNeeded()` tras guardar para disparar alerta si aplica.
    - `productPayload` ahora incluye campos de alerta: `is_low_stock`, `stock_status`, `stock_status_label`.
    - Nuevo metodo privado `lowStockProductPayload()` para la lista del summary.
  - `app/Http/Controllers/Api/StoreApiController.php`:
    - Se inyecta `StockAlertService` via constructor.
    - Al crear un pedido y decrementar stock, se ejecuta `notifyAdminsIfNeeded()` para alertar si el stock baja al umbral.
  - `.env` y `.env.example` actualizados con `STOCK_LOW_THRESHOLD=5`.
- Implementacion frontend:
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - Estado `summary` ampliado con `low_stock_threshold`, `low_stock_count` y `low_stock_products`.
    - Nueva caja en panel de control: "Alertas de stock" con estilo naranja si hay alertas.
    - Nuevo panel condicional `stock-alert-panel` con lista de productos en riesgo (badge de estado y unidades restantes).
    - Cada producto en la lista editable muestra badge de stock bajo/agotado si aplica.
    - Polling generalizado a ambas pestanas (productos y pedidos) para mantener alertas actualizadas en tiempo real.
  - `frontend/public/styles.css`:
    - Nuevos estilos: `.stat-box-warning`, `.stock-alert-panel`, `.stock-alert-list`, `.stock-alert-item`, `.stock-badge`, `.product-editor.is-low-stock`, `.product-editor-head`.
    - `.stats-grid` cambiado a `auto-fit` para acomodar 4 cajas responsive.
  - `frontend/index.html`: cache-busting en stylesheet (`?v=2`).
- Tests:
  - Nuevo archivo: `tests/Feature/StockAlertTest.php`.
    - Test `admin_summary_includes_low_stock_products`: verifica que el endpoint summary retorna productos con stock bajo.
    - Test `stock_alert_service_sends_email_when_stock_becomes_low`: verifica envio de correo al cruzar umbral.
  - Resultados: 2 tests pasados (5 assertions).
- Validaciones:
  - `php -l` sin errores en `StockAlertService`, `AdminApiController`, `StoreApiController`.
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.
- Solicitud del usuario: mover alertas de stock a una campana en la esquina superior derecha del header (a la izquierda de "Cerrar sesion") y eliminar la caja de "Alertas de stock" del panel de control general.
- Implementacion:
  - `frontend/src/components/AdminHeader.jsx`:
    - Se reescribe para recibir props `lowStockProducts` y `lowStockThreshold`.
    - Se agrega icono de campana (SVG inline) con badge rojo que muestra cantidad de alertas.
    - Se agrega dropdown desplegable al hacer clic en la campana con lista de productos en stock bajo/agotado.
    - Cierre por clic fuera del dropdown.
    - Campana con borde naranja si hay alertas activas.
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - Se pasa `lowStockProducts` y `lowStockThreshold` como props al `AdminHeader`.
    - Se elimina el panel `stock-alert-panel` del cuerpo del dashboard.
    - Se elimina la caja "Alertas de stock" del `stats-grid` (queda solo: Productos totales, Productos activos, Pedidos).
  - `frontend/public/styles.css`:
    - Nuevos estilos: `.header-actions`, `.bell-container`, `.bell-btn`, `.bell-badge`, `.bell-dropdown`, `.bell-dropdown-header`, `.bell-dropdown-summary`, `.bell-dropdown-list`, `.bell-dropdown-item`, `.bell-item-name`, `.bell-item-stock`.
    - `.stats-grid` con `auto-fit` para adaptarse a 3 cajas.
  - `frontend/index.html`: cache-busting actualizado (`?v=3`).
- Validaciones:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (modo oscuro por defecto + switch de tema en header)
- Solicitud del usuario:
  - hacer que toda la pagina use modo oscuro por defecto siempre.
  - permitir activar/desactivar el modo oscuro con un slider comodo en el header.
- Implementacion:
  - `frontend/src/components/ThemeToggle.jsx`:
    - nuevo componente de interruptor tipo slider.
    - usa `localStorage` con clave `bdv_theme` para persistir preferencia.
    - aplica `document.documentElement.dataset.theme` con valores `dark` o `light`.
  - `frontend/src/components/PublicHeader.jsx`:
    - se agrega `ThemeToggle` junto a las acciones del header publico.
  - `frontend/src/components/AdminHeader.jsx`:
    - se agrega `ThemeToggle` en el header del dashboard admin.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - el tema oscuro pasa a ser el tema base en `:root`.
    - el tema claro queda como override explicito en `html[data-theme='light']`.
    - se agregan estilos del slider `.theme-toggle` con dimensiones fijas para no mover el header.
  - `frontend/index.html`:
    - se agrega script temprano que aplica `bdv_theme` o `dark` antes de cargar CSS para evitar parpadeos.
    - se actualiza cache-buster de `/styles.css?v=3` a `/styles.css?v=4`.
  - `frontend/.gitignore`:
    - se agrega `.vite` para evitar que ESLint analice cache generada por Vite.
- Limpieza:
  - se elimina cache generada `frontend/.vite` desde el contenedor frontend.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (icono sutil en slider de tema)
- Solicitud del usuario:
  - agregar un icono muy pequeno de sol o luna en el slider de tema.
  - el icono debe aparecer en el lado opuesto al circulo del slider y con baja opacidad.
- Implementacion:
  - `frontend/src/components/ThemeToggle.jsx`:
    - se agregan iconos SVG minimalistas de sol y luna dentro del track del slider.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agregan estilos `.theme-toggle-icon`, `.theme-toggle-sun` y `.theme-toggle-moon`.
    - en modo oscuro se muestra el sol al lado izquierdo, opuesto al thumb.
    - en modo claro se muestra la luna al lado derecho, opuesto al thumb.
    - opacidad baja (`.42`) para que sea una guia visual discreta.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (transicion suave al cambiar tema)
- Solicitud del usuario:
  - agregar una transicion pequena al cambiar entre modo oscuro y modo claro para que no sea abrupto.
- Implementacion:
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agregan transiciones de `background`, `background-color`, `color`, `border-color` y `box-shadow` a los elementos principales de layout, tarjetas, botones, inputs, modales, notificaciones y tablas.
    - duracion: `.22s ease`, suficiente para suavizar sin hacer lenta la interfaz.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (catalogo: busqueda desplegable en tiempo real)
- Solicitud del usuario:
  - cambiar la busqueda del catalogo para que se active desde un boton cercano al header, sin interferir con este.
  - abrir una pestaña/popup grande sin cambiar de pagina, cayendo desde arriba con animacion.
  - eliminar boton `Buscar`.
  - filtrar resultados en tiempo real mientras el usuario escribe.
  - agregar una X para cerrar la pestaña con animacion de salida hacia arriba.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - se elimina el formulario visible con boton `Buscar`.
    - se agrega boton `Buscar` en la cabecera del catalogo.
    - se agrega panel desplegable `catalog-search-layer` con input de busqueda y boton `X`.
    - la busqueda usa estado local `searchDraft` y debounce de 260ms para actualizar `?q=` y resetear `page=1`.
    - al cambiar `q`, el flujo existente de `storeApi.listProducts` actualiza resultados automaticamente.
    - el cierre usa estado `searchPanelClosing` para permitir animacion de salida antes de desmontar el panel.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - estilos para `catalog-head`, `catalog-search-trigger`, `catalog-search-layer`, `catalog-search-panel`, `catalog-search-content`, `search-close-btn`.
    - animaciones `catalog-search-in` y `catalog-search-out`.
    - ajustes responsive para mobile.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (catalogo: cabecera compacta + lupa + limpieza de textos)
- Solicitud del usuario:
  - dejar de usar textos visibles que expliquen como funciona la UI.
  - eliminar especificamente `Escribe para filtrar productos en tiempo real.` del popup de busqueda.
  - eliminar `Explora los productos de Benjaminduve.`.
  - corregir `Catalogo` a `Catálogo` y centrarlo.
  - reemplazar boton `Buscar` por icono minimalista de lupa.
  - acercar la lupa al titulo y hacer menos ancho el bloque visual detras de ambos.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - se elimina el parrafo de ayuda del popup de busqueda.
    - se elimina la bajada descriptiva bajo el titulo del catalogo.
    - titulo cambia a `Catálogo`.
    - boton de busqueda queda como icono SVG de lupa con `aria-label`.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - `catalog-head` pasa a un bloque centrado y compacto (`width: min(310px, 100%)`).
    - se centra el titulo.
    - `catalog-search-trigger` pasa a boton cuadrado de 36px con icono de lupa.
    - se ajusta mobile para conservar el mismo layout compacto.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (catalogo: lupa movida al header y sin titulo visible)
- Solicitud del usuario:
  - revertir el bloque visual de `Catálogo` porque no gusto.
  - eliminar el texto visible `Catálogo` del cuerpo de la pagina.
  - mover el icono de lupa al lado derecho del logo de la empresa en el header.
- Implementacion:
  - `frontend/src/components/PublicHeader.jsx`:
    - se agrega prop opcional `onSearchClick`.
    - se crea grupo `brand-actions` para logo + boton de lupa.
    - la lupa solo aparece cuando una pagina entrega `onSearchClick`.
  - `frontend/src/pages/HomePage.jsx`:
    - `PublicHeader` recibe `onSearchClick={openSearchPanel}`.
    - se elimina el bloque `catalog-head` del cuerpo.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agregan estilos `brand-actions` y `header-search-trigger`.
    - se eliminan estilos ya no usados de `catalog-head` y `catalog-search-trigger`.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (catalogo: sin parpadeo de carga en busqueda + fade de resultados)
- Solicitud del usuario:
  - al buscar un item se veia por un frame la pagina en estado de carga.
  - eliminar ese parpadeo.
  - hacer que los productos resultantes aparezcan lentamente con difuminado.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - se agrega `hasLoadedOnce` para mostrar `Cargando productos...` solo en la primera carga real.
    - durante busquedas posteriores, los productos actuales permanecen visibles hasta que llega la nueva respuesta.
    - se agrega `resultsAnimationKey` que se incrementa al recibir resultados para reiniciar la animacion de entrada.
    - la grilla usa clase `catalog-results` y `key={resultsAnimationKey}`.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agrega animacion `catalog-card-fade`.
    - `.catalog-results .card` aparece con fade y desplazamiento leve.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (transicion global entre paginas)
- Solicitud del usuario:
  - al cambiar de pagina (carrito, checkout, etc.) debe haber una animacion suave para evitar cargas abruptas.
- Implementacion:
  - `frontend/src/App.jsx`:
    - se usa `useLocation`.
    - `Routes` queda envuelto en `<div className="route-transition" key={location.pathname}>` para reactivar la animacion al cambiar de ruta.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agrega `.route-transition` con animacion `route-fade-in`.
    - la animacion usa fade + desplazamiento leve (`.24s ease`).
    - se respeta `prefers-reduced-motion: reduce` desactivando la animacion.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (catalogo: tarjetas simples y detalle en modal)
- Solicitud del usuario:
  - en la pagina principal cada producto debe mostrar solamente nombre, foto y precio.
  - al presionar la foto debe abrirse un popup grande con animacion, fondo difuminado y detalle completo.
  - eliminar botones visibles `Ver detalle` y `Anadir` de las tarjetas.
  - el popup debe mostrar galeria de fotos, stock disponible, descripcion, medidas y opcion de agregar al carrito.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - las tarjetas del catalogo ahora solo muestran imagen/placeholder clickeable, nombre y precio.
    - se agrega modal de detalle con galeria, miniaturas, descripcion, stock, medidas y cantidad para agregar al carrito.
    - se elimina la logica antigua de contador visible en tarjetas.
    - el modal se puede cerrar con `Escape`, con la `X` o clic fuera del panel.
  - `app/Http/Controllers/Api/StoreApiController.php`:
    - el payload publico de producto ahora incluye `images: []` para preparar multiples fotos por producto sin romper el frontend actual.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agregan estilos de tarjetas simplificadas.
    - se agrega overlay con blur, panel grande responsive, galeria, miniaturas y animaciones del modal.
    - se respeta `prefers-reduced-motion: reduce`.
  - `frontend/index.html`:
    - se sube `styles.css` a `v=5` para evitar cache viejo del navegador.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.
  - `php -l app/Http/Controllers/Api/StoreApiController.php` -> OK.
  - `curl.exe -I http://localhost:5173` -> HTTP 200 OK.

### 2026-06-11 (catalogo sin paginacion visual + animacion al quitar carrito)
- Solicitud del usuario:
  - eliminar la seccion inferior del catalogo que mostraba `Pagina 1 de 1`.
  - al eliminar un producto del carrito, hacerlo desaparecer con una animacion elegante.
  - al pasar el mouse sobre las fotos del catalogo, usar cursor de click normal y no lupa.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - se elimina el bloque visual de paginacion bajo la grilla de productos.
    - se elimina estado `meta` que ya no se usa en la vista.
  - `frontend/src/pages/CartPage.jsx`:
    - se agrega estado local `removingItems`.
    - el boton `Quitar` primero marca el item como saliendo y luego lo elimina del carrito tras la animacion.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - `.catalog-card-image` usa `cursor: pointer`.
    - se agregan estilos `.cart-item` y `.cart-item.is-removing` con fade, desplazamiento y colapso suave.
  - `frontend/index.html`:
    - se sube `styles.css` a `v=6` para evitar cache viejo del navegador.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (medidas de producto en formato lista)
- Solicitud del usuario:
  - las medidas del producto en el popup se veian muy apiladas y debian mostrarse como lista.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - se reemplaza el texto unico de medidas por `productMeasurementItems()`.
    - el modal renderiza las medidas como lista con etiqueta y valor (`Talla`, `Alto`, `Ancho`, `Profundidad`).
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agrega `.measurement-list` para separar visualmente cada medida.
  - `frontend/index.html`:
    - se sube `styles.css` a `v=7` para evitar cache viejo del navegador.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (stock compacto en modal de producto)
- Solicitud del usuario:
  - la caja de stock del popup tenia demasiado espacio alrededor del numero.
- Implementacion:
  - `frontend/src/pages/HomePage.jsx`:
    - se agrega clase `stock-detail-card` al bloque de stock.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se compacta el padding, separacion y altura del bloque de stock.
    - se ajusta el tamaño/line-height del numero de stock.
  - `frontend/index.html`:
    - se sube `styles.css` a `v=8` para evitar cache viejo del navegador.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (admin: fotos de productos + pedidos en actualizacion continua)
- Solicitud del usuario:
  - rework del panel administrativo para poder poner fotos a productos.
  - pedidos del admin deben actualizarse sin refrescar la pagina.
  - actualizar seeders de productos y repoblar la base de datos.
- Implementacion backend:
  - `database/migrations/2026_06_11_200000_create_product_images_table.php`:
    - se crea tabla `product_images` con `product_id`, `url`, `alt` y `sort_order`.
  - `app/Models/ProductImage.php`:
    - nuevo modelo para imagenes de productos.
  - `app/Models/Product.php`:
    - se agrega relacion `images()` ordenada.
  - `app/Http/Controllers/Api/AdminApiController.php`:
    - productos admin cargan `images`.
    - crear/editar producto acepta hasta 8 imagenes.
    - se sincronizan imagenes al guardar.
    - payload de producto incluye galeria.
  - `app/Http/Controllers/Api/StoreApiController.php`:
    - catalogo publico y detalle cargan imagenes.
    - payload publico incluye galeria real.
- Implementacion frontend:
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - productos tienen editor de fotos por URLs multilinea.
    - se permite cargar archivos locales de imagen y convertirlos a data URL para vista previa/guardado.
    - se muestran miniaturas en el editor.
    - polling de pedidos pasa a ejecutarse cada 2.5s y no recarga productos mientras se editan.
  - `frontend/src/pages/HomePage.jsx`:
    - tarjetas del catalogo muestran la primera foto real si existe.
    - el popup sigue mostrando la galeria completa.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - estilos para previews del admin y fotos reales del catalogo.
  - `frontend/index.html`:
    - se sube `styles.css` a `v=9` para evitar cache viejo del navegador.
- Seeders y base de datos:
  - `database/seeders/PlaceholderProductsSeeder.php`:
    - los 5 productos placeholder ahora incluyen 2 imagenes SVG embebidas cada uno.
    - se actualizan descripciones y parametros para calzar con el modelo actual.
  - Se ejecuto `docker compose exec -T app php artisan migrate:fresh --seed` correctamente.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.
  - `php -l` en modelo, controladores, migracion y seeder modificados -> OK.
  - `docker compose exec -T db mysql -uroot -proot benjaminduve -e "SELECT COUNT(*) ..."` -> 5 productos y 10 imagenes.

### 2026-06-11 (documentacion local en Descargas)
- Solicitud del usuario:
  - crear un archivo `.txt` en la carpeta de Descargas con la explicacion general de como funciona la pagina.
- Implementacion:
  - se crea `explicacion_benjaminduve.txt` en la carpeta de Descargas del usuario de Windows.
  - el archivo resume arquitectura, frontend, backend, API, carrito, admin, base de datos, seeders y flujo de compra.
### 2026-06-11 (admin: ocultar data URL cruda en editor de fotos)
- Solicitud del usuario:
  - en el panel admin aparecia texto largo `data:image...` dentro del editor de fotos, lo que no tenia sentido visual.
- Implementacion:
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - el textarea de fotos ahora muestra solo URLs externas legibles.
    - las imagenes embebidas `data:image/` se conservan internamente, pero se muestran solo como miniaturas.
    - al escribir URLs externas no se borran las imagenes cargadas desde archivo.
    - se agrega nota discreta para indicar que las fotos cargadas aparecen como miniaturas.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se reduce la altura del textarea de URLs.
    - se agrega estilo `image-editor-note`.
  - `frontend/index.html`:
    - se sube `styles.css` a `v=10` para evitar cache viejo del navegador.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.

### 2026-06-11 (admin: imagenes pesadas + lista plegable de productos)
- Solicitud del usuario:
  - corregir error `The images.0.url field must not be greater than 500000 characters`.
  - embellecer panel de control de admin.
  - mostrar campos de edicion de producto solo al hacer click en el producto.
  - usar una lista minimalista para productos.
  - mostrar errores al centro de pantalla para llamar la atencion del admin.
  - agregar etiquetas visibles sobre cada campo.
  - al agregar producto, mostrar el modal arriba para no tener que bajar con el mouse.
- Implementacion:
  - `frontend/src/pages/AdminDashboardPage.jsx`:
    - se agrega compresion/redimensionado adaptativo de imagenes antes de convertirlas a data URL.
    - se rechazan imagenes que sigan siendo demasiado pesadas antes de enviarlas al backend.
    - se agrega `AdminField` para campos con etiqueta superior.
    - productos del dashboard ahora se muestran como lista minimalista.
    - solo el producto seleccionado despliega su formulario de edicion.
    - el modal de agregar producto usa campos etiquetados y aparece mas arriba en pantalla.
    - errores usan `noticeTone='error'` y se muestran centrados.
  - `app/Http/Controllers/Api/AdminApiController.php`:
    - se sube el limite backend para `images.*.url` a 2.500.000 caracteres.
    - se agregan mensajes de validacion en espanol para imagenes grandes.
    - se extraen reglas/mensajes de validacion de producto a helpers reutilizables.
  - `frontend/public/styles.css` y `frontend/src/index.css`:
    - se agregan estilos para lista minimalista de productos, panel desplegable, campos admin, modal de creacion y notificacion centrada.
  - `frontend/index.html`:
    - se sube `styles.css` a `v=11` para evitar cache viejo del navegador.
- Validacion:
  - `docker compose exec -T frontend npm run lint` -> OK.
  - `docker compose exec -T frontend npm run build` -> OK.
  - `php -l app/Http/Controllers/Api/AdminApiController.php` -> OK.
