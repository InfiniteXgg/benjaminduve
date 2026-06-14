# Benjamin Duve — Especificación de rediseño: Home

> Documento de diseño UI/UX para la página principal de la tienda e-commerce textil chilena.  
> Alcance: hero/carrusel + grilla de productos debajo del hero.  
> Versión: 1.0 · Junio 2026

---

## 1. Contexto y objetivos

La home debe comunicar **artesanía textil premium** con una estética **monocromática negra minimalista**, coherente con la identidad propia **Benjamin Duve / DUD**. El visitante debe poder:

1. Descubrir la marca y la oferta en el hero a ancho completo.
2. Explorar el catálogo en una grilla responsive con paginación.
3. Acceder al detalle de producto (modal existente) desde cada card.

**Restricción legal/de marca:** queda **prohibido** usar activos, logotipos, patrones o referencias visuales de Louis Vuitton u otras marcas de terceros. Solo contenido propio o placeholders genéricos de moda/textil.

---

## 2. Identidad visual

### 2.1 Logo y wordmark

| Elemento | Uso |
|----------|-----|
| **Benjamin Duve** | Wordmark principal en header y materiales de marca |
| **DUD** | Monograma / abreviatura en espacios compactos (favicon, badges) |
| Componente existente | `BrandLogo.jsx` — SVG monocromático con `currentColor` |

El logo debe mantenerse en blanco sobre header oscuro y adaptarse al tema claro vía `currentColor`.

### 2.2 Paleta de color

#### Modo oscuro (default — `:root`)

| Token semántico | Valor | Uso |
|-----------------|-------|-----|
| Negro puro | `#000000` | Fondos hero overlay, bordes fuertes |
| Negro profundo | `#0a0a0a` | Fondo base alternativo |
| Negro elevado | `#111111` | Superficies secundarias |
| Card oscura | `#1a1a1a` | Fondo de cards de producto |
| Gris oscuro | `#222222` | Superficies (`--surface` existente) |
| Gris medio | `#333333` | Bordes activos, hover |
| Gris texto secundario | `#666666` | Metadatos, captions |
| Gris muted | `#999999` | Placeholders, estados disabled |
| Gris claro | `#cccccc` | Texto secundario sobre oscuro |
| Blanco | `#ffffff` | Texto principal, iconos |
| Off-white | `#f5f5f5` | Texto sobre botones claros |
| **Acento dorado** | `#c9a84c` | **Solo** CTA primarios y detalles mínimos (subrayado activo, dot activo del carrusel) |

#### Modo claro (`html[data-theme='light']`)

Mantener coherencia con variables existentes en `index.css` (`--bg: #e7e7e4`, `--surface: #f5f5f2`, etc.). El acento dorado `#c9a84c` se conserva para CTAs.

### 2.3 Tipografía

| Rol | Familia | Peso | Tamaño desktop | Tamaño mobile |
|-----|---------|------|----------------|---------------|
| Display / Hero headline | `'Segoe UI', Arial, sans-serif` | 700 | 48–56px | 32–36px |
| Título sección | idem | 600 | 24–28px | 20–22px |
| Nombre producto (card) | idem | 600 | 16px | 15px |
| Precio CLP | idem | 700 | 18px | 17px |
| Cuerpo / muted | idem | 400–500 | 14–16px | 14px |
| CTA botón | idem | 600 | 14px | 14px |

- Precios siempre en **CLP** con formato chileno (`$12.990` vía `formatCurrency`).
- Letter-spacing sutil en títulos de producto (`.02em`, alineado con `.catalog-card h3` actual).

### 2.4 Espaciado y layout global

- Contenedor de grilla: `max-width: 1140px`, padding horizontal `18px` (consistente con `.container` actual).
- Hero: **fuera** del contenedor — ancho `100vw`, sin padding lateral en la imagen.
- Gap entre hero y grilla: `32px` mobile · `48px` desktop.
- Gap entre cards: `12px` mobile · `16px` tablet · `20px` desktop.

---

## 3. Hero / Carrusel

### 3.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER (PublicHeader — existente, sticky o static)          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    HERO CARRUSEL 100vw                       │
│                    height: 50vh (mobile)                     │
│                           70vh (desktop)                     │
│                                                              │
│   ◀  [  Slide activo + overlay gradient  ]  ▶               │
│                                                              │
│              ● ○ ○   (dots)                                  │
│         [ Ver catálogo ]  ← CTA por slide                    │
└──────────────────────────────────────────────────────────────┘
```

| Propiedad | Mobile (< 640px) | Desktop (≥ 1024px) |
|-----------|------------------|---------------------|
| Ancho | `100vw` | `100vw` |
| Alto | `50vh` (min 320px) | `70vh` (max 720px) |
| Overflow | `hidden` | `hidden` |
| Posición | Relativa, debajo del header | idem |

### 3.2 Slides (mínimo 3)

Cada slide es un `<article>` dentro del carrusel con:

| Campo | Especificación |
|-------|----------------|
| Imagen de fondo | Placeholder genérico textil/moda (telas, costuras, mochilas genéricas). **Sin marcas.** |
| Overlay | Gradiente `linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.25) 50%, rgba(0,0,0,.15) 100%)` |
| Headline (opcional) | Máx. 2 líneas, blanco `#fff` |
| Subtítulo (opcional) | `#ccc`, 1 línea |
| CTA | Botón **"Ver catálogo"** — scroll suave a `#catalogo` |

**Contenido placeholder sugerido (3 slides):**

1. **"Bolsos a tu medida"** — Sub: "Cuero y telas seleccionadas en Chile"  
2. **"Mochilas urbanas"** — Sub: "Diseño funcional, acabado artesanal"  
3. **"Chaquetas y accesorios"** — Sub: "Personalización para tu marca o equipo"

### 3.3 Comportamiento

| Feature | Detalle |
|---------|---------|
| Autoplay | Intervalo **5000 ms** entre slides |
| Pausa al hover | Autoplay se detiene mientras `pointer` está sobre el carrusel |
| Pausa al focus | Autoplay se detiene si cualquier control del carrusel tiene `:focus-visible` |
| Transición | **Fade** preferido (opacity 0→1, **400 ms**, `ease-in-out`). Alternativa: slide horizontal **350 ms** `ease` |
| Lazy load | Imágenes con `loading="lazy"` excepto slide 1 (`loading="eager"` o sin lazy) |
| Loop infinito | Sí — al llegar al último slide, vuelve al primero |

### 3.4 Controles manuales

#### Flechas prev/next

- Posición: centrado vertical, inset `16px` (mobile) / `24px` (desktop)
- Tamaño botón: **44×44 px** mínimo (touch target WCAG)
- Estilo: fondo `rgba(0,0,0,.45)`, borde `1px solid rgba(255,255,255,.25)`, icono blanco
- Hover/focus: fondo `rgba(0,0,0,.65)`, borde blanco, `outline: 2px solid #c9a84c; outline-offset: 2px`
- `aria-label`: "Slide anterior" / "Slide siguiente"

#### Dots indicadores

- Posición: centrados horizontalmente, `bottom: 24px` (mobile) / `32px` (desktop)
- Dot inactivo: `8×8px`, `background: rgba(255,255,255,.4)`
- Dot activo: `10×10px`, `background: #c9a84c` (único uso de acento en dots)
- Espaciado entre dots: `8px`
- Cada dot es `<button>` con `aria-label="Ir al slide N"`

### 3.5 CTA "Ver catálogo"

- Posición: esquina inferior izquierda del slide o centrado inferior (decisión dev: inferior izquierda con padding `24px`)
- Estilo primario con acento dorado:
  - Fondo: `#c9a84c`
  - Texto: `#0a0a0a` (contraste AA sobre dorado)
  - Padding: `12px 24px`
  - Border-radius: `8px`
  - Hover: `filter: brightness(1.08)` + sombra sutil
- Acción: `scrollIntoView({ behavior: 'smooth', block: 'start' })` hacia `#catalogo`

### 3.6 Estructura HTML / ARIA recomendada

```html
<section
  id="hero"
  class="hero-carousel"
  role="region"
  aria-roledescription="carousel"
  aria-label="Destacados Benjamin Duve"
>
  <div class="hero-carousel-viewport" aria-live="polite">
    <!-- slides -->
  </div>
  <button type="button" aria-label="Slide anterior">…</button>
  <button type="button" aria-label="Slide siguiente">…</button>
  <div role="tablist" aria-label="Seleccionar slide">…</div>
</section>
```

### 3.7 Navegación por teclado

| Tecla | Acción |
|-------|--------|
| `ArrowLeft` | Slide anterior |
| `ArrowRight` | Slide siguiente |
| `Home` | Primer slide |
| `End` | Último slide |
| `Tab` | Recorre controles en orden lógico: prev → next → dots → CTA |

---

## 4. Grilla de productos

### 4.1 Posición y ancla

- Sección `<section id="catalogo">` inmediatamente debajo del hero.
- Título opcional: **"Catálogo"** (h2, muted, margin-bottom `16px`).
- Scroll-margin-top: `80px` para compensar header fijo si aplica.

### 4.2 Grid responsive

| Breakpoint | Columnas | Clase sugerida |
|------------|----------|----------------|
| `< 640px` (default) | **1** | `.catalog-grid--1col` |
| `≥ 640px` (sm) | **1** | mobile-first mantiene 1 |
| `≥ 768px` (md) | **2** | `.catalog-grid--2col` |
| `≥ 1024px` (lg) | **3** | `.catalog-grid--3col` |

```css
/* Referencia de implementación */
.catalog-grid {
  display: grid;
  gap: var(--space-3); /* 12px */
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .catalog-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
}
@media (min-width: 1024px) {
  .catalog-grid { grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
}
```

### 4.3 Card de producto

Extiende `.card.catalog-card` existente con tokens nuevos.

```
┌─────────────────────────┐
│                         │
│   Imagen 1:1            │
│   (aspect-ratio 1/1)    │
│                         │
├─────────────────────────┤
│  Nombre producto        │
│  $24.990                │
└─────────────────────────┘
```

| Elemento | Especificación |
|----------|----------------|
| Fondo | `#1a1a1a` (dark) / `var(--surface)` en light |
| Borde | `1px solid` — `#333` dark / `var(--border)` light |
| Border-radius | `10px` (card) · `12px` (imagen) |
| Imagen | `aspect-ratio: 1 / 1`, `object-fit: cover`, lazy load |
| Nombre | 16px, peso 600, máx. 2 líneas (`line-clamp: 2`) |
| Precio | 18px, peso 700, color `var(--text)` |
| Click imagen | Abre modal de detalle (comportamiento actual) |

#### Hover / focus

- `transform: scale(1.02)`
- `box-shadow: var(--shadow-card)` → elevada en hover `var(--shadow-elevated)`
- Transición: `300ms ease`
- `:focus-visible` en card/imagen: outline dorado `2px solid #c9a84c`

### 4.4 Estados de la grilla

#### Loading (skeleton)

Mostrar **6 skeleton cards** (2 filas × 3 cols en desktop) mientras `loading && !hasLoadedOnce`.

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ ░░░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │
│ ░░░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │
│ ░░░ ░░░  │  │ ░░░ ░░░  │  │ ░░░ ░░░  │
└──────────┘  └──────────┘  └──────────┘
```

- Skeleton: fondo `#222`, animación shimmer `1.4s infinite`
- Bloques: cuadrado 1:1 + 2 líneas de texto
- `aria-busy="true"` en contenedor, `aria-label="Cargando productos"`

#### Vacío

- Mensaje: **"No hay productos"** (o "No hay productos disponibles" si hay búsqueda activa)
- Icono opcional: bolsa/outline monocromático
- CTA secundario: "Volver al inicio" o limpiar búsqueda si `q` presente
- Contenedor: `.panel` con padding `32px`, texto centrado, color `var(--muted)`

#### Error

- Mensaje del error API (vía `readApiError`)
- Tono: borde `var(--danger)`, fondo `var(--surface-soft)`
- Botón **"Reintentar"** que vuelve a disparar fetch
- `role="alert"` para anuncio a lectores de pantalla

### 4.5 Paginación

Ubicada **debajo** de la grilla, clase `.pagination` existente.

| Elemento | Especificación |
|----------|----------------|
| Layout | Flex, space-between, wrap en mobile |
| Botón Anterior | Disabled en página 1 |
| Botón Siguiente | Disabled si no hay más productos (respuesta API) |
| Indicador | "Página X" centrado |
| Estilo | Botones con `var(--dark)` / `.btn-alt` para secundarios |
| Tap target | Mínimo 44px alto en mobile |

---

## 5. Responsive

### 5.1 Enfoque mobile-first

Todos los estilos base apuntan a mobile; breakpoints añaden complejidad progresiva.

### 5.2 Breakpoints (referencia — no usar en custom properties)

| Token | Valor | Uso principal |
|-------|-------|---------------|
| `sm` | `640px` | Ajustes tipográficos menores |
| `md` | `768px` | Grilla 2 columnas |
| `lg` | `1024px` | Grilla 3 columnas, hero 70vh |
| `xl` | `1280px` | Márgenes hero amplios, max-width contenido slide |

### 5.3 Resumen responsive

| Componente | Mobile | Tablet (md) | Desktop (lg+) |
|------------|--------|-------------|---------------|
| Hero height | 50vh | 60vh | 70vh |
| Grilla cols | 1 | 2 | 3 |
| Carousel controls | 44px, inset 12px | 44px | 48px, inset 24px |
| CTA hero | full-width opcional < 400px | auto | auto |
| Paginación | columna | fila | fila |

---

## 6. Accesibilidad (WCAG 2.1 AA)

### 6.1 Contraste

| Par | Ratio mínimo | Cumple |
|----|--------------|--------|
| Texto `#eee` sobre `#1a1a1a` | ≥ 4.5:1 | ✓ |
| Texto `#ccc` sobre `#000` | ≥ 4.5:1 | ✓ |
| CTA `#0a0a0a` sobre `#c9a84c` | ≥ 4.5:1 | ✓ (verificar en implementación) |
| Texto muted `#666` sobre `#1a1a1a` | ≥ 4.5:1 para texto grande; evitar para cuerpo pequeño |

### 6.2 Focus visible

Todos los elementos interactivos (flechas, dots, CTA, cards, paginación) deben mostrar:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### 6.3 Imágenes

- Toda `<img>` requiere `alt` descriptivo (nombre producto o descripción del slide).
- Imágenes decorativas del hero: `alt=""` + `aria-hidden="true"` si el texto del slide ya comunica el mensaje.

### 6.4 Carrusel accesible

- `role="region"` + `aria-roledescription="carousel"`
- `aria-label` descriptivo en el contenedor
- Slide activo: `aria-hidden="false"` en activo, `aria-hidden="true"` en inactivos (si solo uno visible)
- Autoplay: anunciar pausa al recibir focus (opcional: `aria-live="polite"` al cambiar slide)
- Controles con `aria-label` en español

### 6.5 Reducción de movimiento

Respetar `prefers-reduced-motion: reduce`:

- Desactivar autoplay del carrusel
- Reemplazar transiciones fade/slide por cambio instantáneo
- Desactivar `scale` en hover de cards (mantener solo cambio de borde/sombra)
- Desactivar shimmer del skeleton (fondo estático)

```css
@media (prefers-reduced-motion: reduce) {
  .hero-carousel,
  .catalog-card {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 7. Integración con código existente

| Pieza actual | Acción en rediseño |
|--------------|-------------------|
| `HomePage.jsx` | Insertar `<HeroCarousel />` antes de `<main>`. Mover grilla a `#catalogo`. Añadir skeleton y estados error/vacío diferenciados. |
| `index.css` | Añadir clases `.hero-carousel*`, `.catalog-grid`, `.skeleton-*`. Importar `design-tokens.css`. |
| `design-tokens.css` | Tokens aditivos; no sobrescribir `--bg`, `--surface`, etc. |
| `ThemeToggle` | Sin cambios — sigue usando `html[data-theme='light']` |
| `PublicHeader` | Sin cambios estructurales |
| `formatCurrency` | Mantener para precios CLP |
| Paginación URL | Mantener query params `?page=` y `?q=` |

### 7.1 Orden de secciones en DOM

1. `PublicHeader`
2. `HeroCarousel` (nuevo, full-bleed)
3. `main.container`
   - `NoticeBanner`
   - `#catalogo` → grilla / skeleton / vacío / error
   - `.pagination`

---

## 8. Assets y placeholders

### 8.1 Imágenes hero (placeholders)

Usar servicios de placeholder o assets locales genéricos:

- Texturas de lona, cuero, costuras
- Siluetas de bolsos/mochilas sin logos
- Paleta desaturada compatible con overlay oscuro

**Prohibido:** monogramas LV, GG, CC, swoosh, o cualquier marca reconocible.

### 8.2 Formato recomendado

| Contexto | Formato | Dimensiones |
|----------|---------|-------------|
| Hero slide | WebP + fallback JPG | 1920×1080 (crop center) |
| Card producto | WebP | Cuadrado, mín. 600×600 |

---

## 9. Criterios de aceptación

- [ ] Hero ocupa 100vw con alturas 50vh / 70vh según breakpoint
- [ ] Mínimo 3 slides con autoplay 5s, pausa hover/focus
- [ ] Flechas, dots y navegación por teclado funcionales
- [ ] CTA "Ver catálogo" hace scroll suave a `#catalogo`
- [ ] Grilla 1 / 2 / 3 columnas según breakpoints
- [ ] Cards oscuras con hover scale 1.02 + sombra
- [ ] Estados loading (skeleton), vacío y error implementados
- [ ] Paginación visible bajo la grilla
- [ ] Contraste AA, focus visible, alt text, ARIA carrusel
- [ ] `prefers-reduced-motion` respetado
- [ ] Tema claro/oscuro coherente con toggle existente
- [ ] Cero activos de marcas terceras

---

## 10. Referencias de tokens

Ver `frontend/src/design-tokens.css` para variables CSS utilizables en la implementación.

Variables legacy en `index.css` que **no deben eliminarse**:

- `--bg`, `--surface`, `--surface-soft`, `--text`, `--muted`, `--border`, `--dark`
- `--header-start`, `--header-end`, `--danger`

Los tokens nuevos (`--color-*`, `--space-*`, `--shadow-*`, etc.) complementan y pueden usarse en componentes nuevos del hero y la grilla.
