# Reporte de QA — Benjamin Duve

**Fecha:** 2026-06-13  
**Tipo de revisión:** Análisis estático de código + verificación de rutas/build (sin ejecución E2E en browser)  
**Referencia:** `QA-plan.md`

---

## Resumen ejecutivo

La implementación de los siete cambios solicitados está **mayormente completa y funcional** según revisión de código. El hero carrusel, la paginación, el cierre del overlay de búsqueda, la regla backend `ValidRut`, el endpoint DELETE de imágenes y la eliminación de rutas Blade legacy cumplen los criterios de aceptación.

Se detectaron **2 bugs** (1 medio, 1 bajo) y **2 observaciones menores** de UX/accesibilidad. Ninguno bloquea el build ni las rutas de Laravel. El flujo principal de compra funciona si el usuario no altera el RUT en checkout; el backend rechaza RUT inválidos en todo caso.

| Área | Casos | PASS | FAIL | Observaciones |
|------|-------|------|------|---------------|
| Hero Carrusel | 13 | 12 | 0 | 1 observación a11y |
| Paginación | 11 | 11 | 0 | — |
| Búsqueda | 6 | 6 | 0 | — |
| Validación RUT | 13 | 11 | 1 | 1 bug en CheckoutPage |
| Eliminación imágenes | 6 | 6 | 0 | — |
| Pasarela placeholder | 4 | 3 | 0 | 1 observación arquitectura |
| Regresión | 10 | 10 | 0 | — |
| **Total** | **63** | **59** | **1** | **3 observaciones** |

**Veredicto general:** **APROBADO CON OBSERVACIONES** — corregir validación RUT en `CheckoutPage` antes de release.

---

## Resultados por caso de prueba

### 1. Hero Carrusel

| ID | Estado | Evidencia / notas |
|----|--------|-------------------|
| HC-01 | **PASS** | `HeroCarousel.jsx`: 3 slides estáticos con gradientes, título, subtítulo y CTA |
| HC-02 | **PASS** | `AUTOPLAY_MS = 5000`; `setInterval` avanza índice cada 5s |
| HC-03 | **PASS** | `onMouseEnter/Leave` → `setPaused(true/false)` |
| HC-04 | **PASS** | `onFocusCapture` pausa; `onBlurCapture` reanuda si foco sale del region |
| HC-05 | **PASS** | Botón prev con `goPrev()` |
| HC-06 | **PASS** | Botón next con `goNext()` |
| HC-07 | **PASS** | Dots con `goTo(index)` y clase `is-active` |
| HC-08 | **PASS** | Listener `ArrowLeft` / `ArrowRight` en región con `tabIndex={0}` |
| HC-09 | **PASS** | CTA llama `scrollIntoView` sobre `#catalogo` (presente en `HomePage.jsx`) |
| HC-10 | **PASS** | CSS mobile: `--layout-hero-height-mobile`, tap targets, padding responsive |
| HC-11 | **PASS** | Media query `@media (min-width: 768px)` ajusta altura y tipografía |
| HC-12 | **PASS** | ARIA: region, roledescription, aria-hidden en slides inactivos, labels en controles |
| HC-13 | **OBS** | CSS desactiva transiciones con `prefers-reduced-motion`, pero **autoplay JS sigue activo** — recomendable pausar intervalo |

### 2. Paginación

| ID | Estado | Evidencia / notas |
|----|--------|-------------------|
| PG-01 | **PASS** | `HomePage`: paginación solo si `meta.lastPage > 1` |
| PG-02 | **PASS** | Controles Anterior/Siguiente + info de página |
| PG-03 | **PASS** | `goToPage` actualiza `?page=` en URLSearchParams |
| PG-04 | **PASS** | `disabled={meta.currentPage <= 1}` |
| PG-05 | **PASS** | `disabled={meta.currentPage >= meta.lastPage}` |
| PG-06 | **PASS** | Debounce búsqueda resetea `page` a `1`; backend `paginate(9)` |
| PA-01 | **PASS** | `AdminApiController::products` → `paginate(12)`; nav siempre visible en admin |
| PA-02 | **PASS** | `loadProducts({ page })` sincroniza estado y meta |
| PA-03 | **PASS** | `productQ` se usa como default en `loadProducts` |
| PO-01 | **PASS** | `orders` → `paginate(12)` |
| PO-02 | **PASS** | Filtros `q`, `date_from`, `date_to` + `orderPage` en `loadOrders` |

### 3. Búsqueda

| ID | Estado | Evidencia / notas |
|----|--------|-------------------|
| BS-01 | **PASS** | `toggleSearchPanel` / `openSearchPanel` con `autoFocus` |
| BS-02 | **PASS** | `handleSearchInputBlur` cierra tras 180ms si foco no va al panel |
| BS-03 | **PASS** | Backdrop `catalog-search-backdrop` → `closeSearchPanel` |
| BS-04 | **PASS** | `useEffect` escucha `Escape` cuando panel abierto |
| BS-05 | **PASS** | Debounce 260ms → `setParams` con `q` y `page=1` |
| BS-06 | **PASS** | Blur ignorado si `relatedTarget` está dentro de `searchPanelRef` |

### 4. Validación RUT

| ID | Estado | Evidencia / notas |
|----|--------|-------------------|
| RU-01 | **PASS** | Algoritmo módulo 11: body `12345678` → DV `5` ✓ |
| RU-02 | **PASS** | body `11111111` → DV `1` ✓ |
| RU-03 | **PASS** | body `76086428` → DV `5` ✓ |
| RU-04 | **PASS** | body `5126663` → DV `3` ✓ |
| RU-05 | **PASS** | DV calculado `5` ≠ `0` → rechazado |
| RU-06 | **PASS** | DV calculado `1` ≠ `K` → rechazado |
| RU-07 | **PASS** | Sin formato `NNNNNNNN-D` → rechazado |
| RU-08 | **PASS** | Regex acepta `\d{7,8}-` sin puntos |
| RU-09 | **PASS** | `onBlur={() => validateTaxId()}` en PreCheckoutPage |
| RU-10 | **PASS** | `continuePurchase` llama `validateTaxId()` antes de navegar |
| RB-01 | **PASS** | `StoreApiController::createOrder` usa `new ValidRut` |
| RB-02 | **PASS** | Regla rechaza RUT con DV incorrecto |
| RB-03 | **PASS** | `ValidRut.php` y `utils.js` comparten misma regex y algoritmo |
| RC-01 | **PASS** | PreCheckout valida → `/checkout?auto=1` → auto submit |
| RC-02 | **FAIL** | Ver bug **BUG-001** |

### 5. Eliminación de imágenes

| ID | Estado | Evidencia / notas |
|----|--------|-------------------|
| IM-01 | **PASS** | Botón `.image-remove-btn` con `aria-label` en admin |
| IM-02 | **PASS** | `adminApi.deleteProductImage(slug, id)` → ruta DELETE registrada |
| IM-03 | **PASS** | `deleteProductImage` valida `product_id` → 404 si no coincide |
| IM-04 | **PASS** | Fallback local + `onUpdateProduct` para data URLs sin id |
| IM-05 | **PASS** | Ruta bajo `auth:sanctum` + `requireAdmin` |
| IM-06 | **PASS** | Recalcula `mainImage` al eliminar primera imagen |

### 6. Pasarela de pago

| ID | Estado | Evidencia / notas |
|----|--------|-------------------|
| PY-01 | **PASS** | `AppServiceProvider`: bind a `PlaceholderPaymentGateway` |
| PY-02 | **PASS** | `PaymentGatewayPage` → `storeApi.submitPayment` con `gateway_pending` |
| PY-03 | **PASS** | `submitPayment` actualiza a `prototype_submitted` |
| PY-04 | **PASS** | Flujo no depende de llamar al gateway real; sin integración rota |
| — | **OBS** | `PaymentGatewayInterface` **no se inyecta** en `StoreApiController`; placeholder existe pero no se usa aún — aceptable para fase actual |

### 7. Regresión

| ID | Estado | Evidencia / notas |
|----|--------|-------------------|
| RG-01 | **PASS** | `web.php`: redirect a `frontend_url` + fallback JSON |
| RG-02 | **PASS** | Confirmado: `route:list` sin errores |
| RG-03 | **PASS** | Rutas SPA: `/carrito`, `CartContext` intacto |
| RG-04 | **PASS** | Flujo: pre-checkout → checkout → order → pasarela → order page |
| RG-05 | **PASS** | `/admin/login`, Sanctum token, `ensureAuth` en dashboard |
| RG-06 | **PASS** | CRUD vía `AdminApiController` + `AdminDashboardPage` |
| RG-07 | **PASS** | `acceptOrder` / `rejectOrder` con validación de estados |
| RG-08 | **PASS** | Middleware `auth:sanctum` en grupo admin |
| RG-09 | **PASS** | `orderTokenMatches` con `hash_equals` en operaciones de pedido |
| RG-10 | **PASS** | Confirmado: `vite build` exitoso |

---

## Bugs encontrados

### BUG-001 — Validación RUT inconsistente en CheckoutPage

| Campo | Detalle |
|-------|---------|
| **Severidad** | **Media** |
| **Estado** | Abierto |
| **Ubicación** | `frontend/src/pages/CheckoutPage.jsx` líneas 87–92 |
| **Descripción** | `CheckoutPage` valida el RUT solo con regex `/^[0-9kK.-]{7,40}$/`, **sin módulo 11**. `PreCheckoutPage` sí usa `validateRut`. Un usuario puede editar el RUT en checkout (campo editable) e ingresar un DV incorrecto (ej. `12.345.678-0`) que pasa el frontend pero falla en backend con 422 genérico. También se puede acceder directamente a `/checkout` omitiendo pre-checkout. |
| **Impacto** | Mala UX en auto-submit (`?auto=1`); mensaje de error poco específico; bypass parcial de validación frontend |
| **Reproducción** | 1) Completar pre-checkout con RUT válido. 2) En checkout, cambiar RUT a `12.345.678-0`. 3) Enviar pedido → error 422. |
| **Recomendación** | Importar y usar `validateRut` en `CheckoutPage.submitOrder` (reemplazar regex). Opcional: deshabilitar edición del RUT en checkout o revalidar en blur. |

### BUG-002 — Autoplay del carrusel ignora prefers-reduced-motion

| Campo | Detalle |
|-------|---------|
| **Severidad** | **Baja** |
| **Estado** | Abierto |
| **Ubicación** | `frontend/src/components/HeroCarousel.jsx` + `HeroCarousel.css` |
| **Descripción** | CSS respeta `prefers-reduced-motion` desactivando transiciones, pero el `setInterval` de autoplay continúa ejecutándose. Usuarios sensibles al movimiento siguen viendo cambios automáticos de contenido. |
| **Recomendación** | Detectar `window.matchMedia('(prefers-reduced-motion: reduce)')` y no iniciar autoplay, o pausar por defecto. |

---

## Observaciones menores (no bloqueantes)

1. **Paginación admin siempre visible:** En catálogo público la paginación se oculta con 1 página; en admin se muestra siempre ("Página 1 de 1" con botones disabled). Inconsistencia UX menor.

2. **CTA catálogo sin productos:** Si no hay productos, `#catalogo` no existe en DOM y el scroll del CTA no hace nada. Edge case aceptable.

3. **Pasarela abstracta sin wiring:** `PlaceholderPaymentGateway` está registrado en DI pero `StoreApiController::submitPayment` no lo invoca; el pago sigue siendo manual/prototype. Coherente con placeholder, documentar para integración futura.

---

## Verificación de criterios de aceptación

| # | Criterio | Estado | Comentario |
|---|----------|--------|------------|
| 1 | Hero 3 slides, autoplay 5s, pausa hover/focus, flechas, dots, CTA, a11y, responsive | **Cumple** | Observación reduced-motion |
| 2 | Paginación catálogo 9/pág, admin 12/pág productos y pedidos | **Cumple** | Backend y frontend alineados |
| 3 | Búsqueda cierra blur / click fuera / Escape | **Cumple** | Implementado en HomePage |
| 4 | RUT módulo 11 frontend + backend | **Parcial** | PreCheckout + backend OK; CheckoutPage con gap (BUG-001) |
| 5 | DELETE imagen individual en admin | **Cumple** | Endpoint + UI + validación ownership |
| 6 | Pasarela abstracta; flujo no roto | **Cumple** | Interface + placeholder; flujo vía `gateway_pending` |
| 7 | Blade legacy eliminado; rutas OK | **Cumple** | `web.php` limpio; SPA routes en `App.jsx` |

---

## Archivos revisados

- `frontend/src/components/HeroCarousel.jsx`, `HeroCarousel.css`
- `frontend/src/pages/HomePage.jsx`, `AdminDashboardPage.jsx`, `PreCheckoutPage.jsx`, `CheckoutPage.jsx`, `PaymentGatewayPage.jsx`
- `frontend/src/utils.js`, `frontend/src/api/adminApi.js`, `frontend/src/App.jsx`
- `app/Rules/ValidRut.php`
- `app/Contracts/PaymentGatewayInterface.php`, `app/Services/PlaceholderPaymentGateway.php`, `app/Services/PaymentResult.php`
- `app/Http/Controllers/Api/AdminApiController.php`, `StoreApiController.php`
- `app/Providers/AppServiceProvider.php`
- `routes/api.php`, `routes/web.php`

---

## Próximos pasos recomendados

1. **Corregir BUG-001** — unificar `validateRut` en `CheckoutPage`.
2. **Opcional:** Pausar autoplay con `prefers-reduced-motion` (BUG-002).
3. Ejecutar prueba manual E2E del flujo carrito → boleta con datos seed ≥ 10 productos.
4. Tras fix de BUG-001, re-ejecutar casos RC-02 y RB-03 en browser.
