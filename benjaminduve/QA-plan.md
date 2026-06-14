# Plan de QA — Benjamin Duve

**Proyecto:** Tienda e-commerce (Laravel API + React SPA)  
**Alcance:** Hero carrusel, paginación, búsqueda, validación RUT, eliminación de imágenes, pasarela de pago placeholder, eliminación Blade legacy  
**Fecha:** 2026-06-13  
**Metodología:** Revisión de código + pruebas manuales recomendadas (build frontend y `route:list` ya verificados)

---

## 1. Hero Carrusel

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|-------------------|
| HC-01 | Renderizado inicial | Abrir `/` | 3 slides visibles en rotación; primer slide activo con título, subtítulo y CTA "Ver catálogo" |
| HC-02 | Autoplay 5s | Observar carrusel sin interactuar | Cambia de slide cada ~5 segundos |
| HC-03 | Pausa hover | Pasar mouse sobre el carrusel | Autoplay se detiene; reanuda al salir el mouse |
| HC-04 | Pausa focus | Tabular hasta el carrusel o sus controles | Autoplay se detiene mientras hay foco interno |
| HC-05 | Flecha anterior | Clic en `‹` | Retrocede al slide previo (circular) |
| HC-06 | Flecha siguiente | Clic en `›` | Avanza al slide siguiente (circular) |
| HC-07 | Dots | Clic en cada dot | Salta al slide correspondiente; dot activo resaltado |
| HC-08 | Teclado | Con foco en carrusel: `ArrowLeft` / `ArrowRight` | Navega slides previo/siguiente |
| HC-09 | CTA catálogo | Clic en "Ver catálogo" | Scroll suave a `#catalogo` |
| HC-10 | Responsive mobile | Viewport < 768px | Altura mobile, tipografía base, controles táctiles ≥ min tap target |
| HC-11 | Responsive desktop | Viewport ≥ 768px | Altura desktop, tipografía hero ampliada, controles más grandes |
| HC-12 | Accesibilidad ARIA | Inspeccionar DOM | `role="region"`, `aria-roledescription="carousel"`, slides inactivos con `aria-hidden="true"`, controles con `aria-label` |
| HC-13 | Reduced motion | Activar `prefers-reduced-motion: reduce` | Transiciones CSS desactivadas (autoplay puede seguir activo — verificar criterio de producto) |

---

## 2. Paginación

### 2.1 Catálogo público (9/página)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|-------------------|
| PG-01 | Sin paginación | Con ≤ 9 productos activos | No se muestran controles de paginación |
| PG-02 | Con paginación | Con ≥ 10 productos activos | Aparece nav "← Anterior / Página X de Y / Siguiente →" |
| PG-03 | Siguiente página | Clic en "Siguiente →" | URL incluye `?page=2`; muestra productos 10–18 |
| PG-04 | Anterior deshabilitado | En página 1 | Botón "Anterior" disabled |
| PG-05 | Última página | En última página | Botón "Siguiente" disabled |
| PG-06 | Búsqueda + paginación | Buscar término con muchos resultados | Paginación refleja resultados filtrados; nueva búsqueda resetea a `page=1` |

### 2.2 Admin productos (12/página)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|-------------------|
| PA-01 | Listado paginado | Login admin → pestaña Productos con > 12 productos | Muestra 12 productos; controles de paginación visibles |
| PA-02 | Navegación | Clic Anterior/Siguiente | `productPage` y listado se actualizan; meta `current_page` / `last_page` correctos |
| PA-03 | Búsqueda | Buscar producto y paginar | Filtro `q` se mantiene al cambiar de página |

### 2.3 Admin pedidos (12/página)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|-------------------|
| PO-01 | Listado paginado | Pestaña Pedidos con > 12 pedidos | Paginación funcional |
| PO-02 | Filtros + paginación | Filtrar por texto/fechas y paginar | Filtros persisten entre páginas |

---

## 3. Búsqueda (overlay)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|-------------------|
| BS-01 | Abrir overlay | Clic en icono búsqueda del header | Panel modal con input autofocus |
| BS-02 | Cierre blur | Escribir y hacer blur fuera del panel | Overlay se cierra (~180 ms) |
| BS-03 | Cierre click fuera | Clic en backdrop oscuro | Overlay se cierra con animación |
| BS-04 | Cierre Escape | Con overlay abierto, presionar `Escape` | Overlay se cierra |
| BS-05 | Debounce búsqueda | Escribir en input | Tras ~260 ms actualiza `?q=` en URL y recarga catálogo |
| BS-06 | Blur a elemento interno | Tabular dentro del panel sin salir | Overlay NO se cierra |

---

## 4. Validación RUT (módulo 11)

### 4.1 Frontend — `PreCheckoutPage` + `validateRut`

| ID | RUT | Esperado |
|----|-----|----------|
| RU-01 | `12.345.678-5` | Válido — permite continuar |
| RU-02 | `11.111.111-1` | Válido |
| RU-03 | `76.086.428-5` | Válido |
| RU-04 | `5.126.663-3` | Válido |
| RU-05 | `12.345.678-0` | Inválido — DV incorrecto; mensaje de error |
| RU-06 | `11.111.111-K` | Inválido — DV incorrecto |
| RU-07 | `123` | Inválido — formato incorrecto |
| RU-08 | `12345678-5` | Válido (sin puntos, si DV correcto) |
| RU-09 | Blur en campo RUT | Al salir del campo con RUT inválido | Muestra error inline |
| RU-10 | Continuar con RUT inválido | Clic "Guardar datos y continuar" | Bloquea navegación; notice de error |

### 4.2 Backend — regla `ValidRut` en `POST /api/orders`

| ID | Caso | Resultado esperado |
|----|------|-------------------|
| RB-01 | RUT válido en payload | Pedido creado (201) |
| RB-02 | RUT inválido (`12.345.678-0`) | 422 con mensaje "El RUT ingresado no es válido." |
| RB-03 | Coherencia FE/BE | Mismos casos RU-01–RU-07 | Mismo veredicto en frontend y backend |

### 4.3 Checkout — regresión validación

| ID | Caso | Resultado esperado |
|----|------|-------------------|
| RC-01 | Flujo normal pre-checkout → checkout auto | RUT validado en pre-checkout; pedido se crea |
| RC-02 | Editar RUT en checkout | Cambiar a RUT inválido y enviar | Debe rechazar con validación módulo 11 (frontend y/o backend) |

---

## 5. Eliminación de imágenes (admin)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|-------------------|
| IM-01 | Botón X visible | Expandir producto con imágenes | Botón × en cada miniatura |
| IM-02 | DELETE persistido | Eliminar imagen con `id` en BD | `DELETE /api/admin/products/{slug}/images/{id}`; imagen desaparece; notice éxito |
| IM-03 | Imagen ajena | DELETE con image_id de otro producto | 404 "La imagen no pertenece a este producto." |
| IM-04 | Imagen embebida (data URL) | Eliminar miniatura base64 sin id | Elimina del estado local y persiste vía update |
| IM-05 | Sin auth | DELETE sin token admin | 401/403 |
| IM-06 | Main image | Eliminar primera imagen | `mainImage` pasa a la siguiente disponible |

---

## 6. Pasarela de pago (placeholder)

| ID | Caso | Pasos | Resultado esperado |
|----|------|-------|-------------------|
| PY-01 | Binding DI | Verificar `AppServiceProvider` | `PaymentGatewayInterface` → `PlaceholderPaymentGateway` |
| PY-02 | Flujo checkout completo | Carrito → pre-checkout → checkout → pasarela | Página pasarela envía pago; redirige a detalle pedido |
| PY-03 | Estado post-pago | Tras enviar pago | `payment_status: prototype_submitted`; admin puede aceptar/rechazar |
| PY-04 | Placeholder no bloquea | Completar flujo sin proveedor real | Pedido queda en revisión; sin error 500 |

---

## 7. Regresión — Blade legacy eliminado

| ID | Caso | Resultado esperado |
|----|------|-------------------|
| RG-01 | `routes/web.php` | `/` redirige a frontend SPA; fallback JSON 404 |
| RG-02 | Sin rutas Blade rotas | `php artisan route:list` sin errores |
| RG-03 | Carrito SPA | Agregar/editar/quitar items en `/carrito` |
| RG-04 | Checkout → pedido → boleta | Flujo completo hasta resumen/boleta imprimible |
| RG-05 | Admin login | Login/logout en `/admin/login` |
| RG-06 | Admin CRUD productos | Crear, editar, eliminar producto |
| RG-07 | Admin pedidos | Aceptar/rechazar pedido con pago enviado |
| RG-08 | Seguridad admin API | Endpoints `/api/admin/*` sin token → 401/403 |
| RG-09 | Seguridad pedidos | `order_token` requerido para summary/payment/cancel |
| RG-10 | Build frontend | `vite build` exitoso |

---

## Criterios de aceptación (referencia)

1. Hero con 3 slides, autoplay 5s, pausa hover/focus, flechas, dots, CTA accesible y responsive.
2. Paginación visible: catálogo 9/pág, admin productos y pedidos 12/pág.
3. Overlay búsqueda cierra en blur, click fuera y Escape.
4. RUT validado con módulo 11 en frontend (pre-checkout) y backend (crear pedido).
5. Admin puede eliminar imágenes individualmente vía DELETE.
6. Pasarela abstracta registrada; flujo de pago no se rompe con placeholder.
7. Controladores/vistas Blade legacy eliminados; SPA + API operativos.

---

## Entorno de prueba sugerido

- Frontend: `npm run dev` (o build estático servido)
- Backend: `php artisan serve` con `.env` configurado
- Navegadores: Chrome, Firefox, Safari/mobile
- Datos: seed con ≥ 10 productos activos y ≥ 13 pedidos para probar paginación admin
