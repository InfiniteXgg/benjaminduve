# PLAN.md — Proyecto Benjamin Duve v1.0 Final

## Objetivo
Llevar la app a estado "casi final": rediseño de home con hero/carrusel + grilla pulida, fixes de bugs conocidos, features pendientes y limpieza de código legacy.

---

## Fases de Ejecución

### FASE 0: Preparación (Orquestador)
| # | Tarea | Responsable | Dependencias | Estado |
|---|-------|-------------|--------------|--------|
| 0.1 | Crear archivos de rol de agentes | Orquestador | — | ✅ Completado |
| 0.2 | Generar PLAN.md | Orquestador | 0.1 | ✅ Completado |
| 0.3 | Crear ramas Git por área | Orquestador | 0.2 | ⏳ Pendiente |

### FASE 1: Diseño (Diseñador UI/UX)
| # | Tarea | Responsable | Dependencias | Estado |
|---|-------|-------------|--------------|--------|
| 1.1 | Definir tokens de diseño (paleta, tipografía, spacing, radios, sombras) | Diseñador | 0.2 | ⏳ Pendiente |
| 1.2 | Especificar layout hero/carrusel (estructura, slides, autoplay, controles, responsive) | Diseñador | 1.1 | ⏳ Pendiente |
| 1.3 | Especificar grilla de productos (cards, estados, responsive) | Diseñador | 1.1 | ⏳ Pendiente |
| 1.4 | Documentar accesibilidad y estados interactivos | Diseñador | 1.2, 1.3 | ⏳ Pendiente |
| 1.5 | Entregar design-spec.md + tokens CSS | Diseñador | 1.4 | ⏳ Pendiente |

### FASE 2: Backend (Desarrollador Backend)
| # | Tarea | Responsable | Dependencias | Estado |
|---|-------|-------------|--------------|--------|
| 2.1 | Implementar regla de validación RUT chileno (módulo 11) | Backend | 0.3 | ⏳ Pendiente |
| 2.2 | Aplicar validación RUT en endpoint de checkout | Backend | 2.1 | ⏳ Pendiente |
| 2.3 | Crear endpoint DELETE para imágenes individuales de producto | Backend | 0.3 | ⏳ Pendiente |
| 2.4 | Abstraer pasarela de pago: PaymentGatewayInterface + PlaceholderPaymentGateway | Backend | 0.3 | ⏳ Pendiente |
| 2.5 | Verificar rutas dependientes de controladores Blade legacy | Backend | 0.3 | ⏳ Pendiente |
| 2.6 | Eliminar controladores Blade legacy (tras verificación) | Backend | 2.5 | ⏳ Pendiente |

### FASE 3: Frontend (Desarrollador Frontend)
| # | Tarea | Responsable | Dependencias | Estado |
|---|-------|-------------|--------------|--------|
| 3.1 | Implementar componente HeroCarousel según design-spec | Frontend | 1.5 | ⏳ Pendiente |
| 3.2 | Integrar tokens CSS del diseñador en el proyecto | Frontend | 1.5 | ⏳ Pendiente |
| 3.3 | Refactorizar grilla de productos según nueva spec | Frontend | 1.5, 3.2 | ⏳ Pendiente |
| 3.4 | FIX: Renderizar controles de paginación (público 9/pág) | Frontend | 0.3 | ⏳ Pendiente |
| 3.5 | FIX: Renderizar controles de paginación (admin 12/pág) | Frontend | 0.3 | ⏳ Pendiente |
| 3.6 | FIX: Barra de búsqueda se oculta al perder foco | Frontend | 0.3 | ⏳ Pendiente |
| 3.7 | Conectar endpoint de eliminación de imágenes en admin | Frontend | 2.3 | ⏳ Pendiente |
| 3.8 | Implementar validación de RUT en frontend (módulo 11) | Frontend | 2.1 | ⏳ Pendiente |
| 3.9 | Integrar home rediseñada (hero + grilla) | Frontend | 3.1, 3.3 | ⏳ Pendiente |

### FASE 4: QA (Analista de QA)
| # | Tarea | Responsable | Dependencias | Estado |
|---|-------|-------------|--------------|--------|
| 4.1 | Generar QA-plan.md con casos de prueba | QA | 3.9 | ⏳ Pendiente |
| 4.2 | Ejecutar pruebas del carrusel (responsive, autoplay, controles) | QA | 4.1 | ⏳ Pendiente |
| 4.3 | Ejecutar pruebas de paginación (público y admin) | QA | 4.1 | ⏳ Pendiente |
| 4.4 | Ejecutar pruebas de validación RUT (front y back) | QA | 4.1 | ⏳ Pendiente |
| 4.5 | Ejecutar pruebas de búsqueda (ocultar al deseleccionar) | QA | 4.1 | ⏳ Pendiente |
| 4.6 | Ejecutar pruebas de eliminación de imágenes en admin | QA | 4.1 | ⏳ Pendiente |
| 4.7 | Ejecutar pruebas de pasarela placeholder | QA | 4.1 | ⏳ Pendiente |
| 4.8 | Regression completa: carrito → checkout → pedido → boleta | QA | 4.1 | ⏳ Pendiente |
| 4.9 | Entregar QA-report.md | QA | 4.2-4.8 | ⏳ Pendiente |

### FASE 5: Integración Final (Orquestador)
| # | Tarea | Responsable | Dependencias | Estado |
|---|-------|-------------|--------------|--------|
| 5.1 | Merge rama backend → development | Orquestador | Fase 4 pass | ⏳ Pendiente |
| 5.2 | Merge rama frontend → development | Orquestador | 5.1 | ⏳ Pendiente |
| 5.3 | Resolver conflictos si los hay | Orquestador | 5.2 | ⏳ Pendiente |
| 5.4 | Actualizar CONTEXT.md con cambios realizados | Orquestador | 5.3 | ⏳ Pendiente |
| 5.5 | Verificar checklist de aceptación final | Orquestador | 5.4 | ⏳ Pendiente |
| 5.6 | Entregar resumen final | Orquestador | 5.5 | ⏳ Pendiente |

---

## Ramas Git

| Rama | Propósito | Responsable |
|------|-----------|-------------|
| `development` | Rama base/integración | Orquestador |
| `feature/backend-fixes` | Fixes y features backend | Backend |
| `feature/frontend-redesign` | Rediseño home + fixes frontend | Frontend |

---

## Criterios de Aceptación

- [x] Home con hero/carrusel grande arriba + grilla abajo, tema negro coherente, responsive.
- [x] Cero activos de marca de terceros.
- [x] Paginación visible y funcional (público 9/pág y admin 12/pág).
- [x] RUT validado con dígito verificador módulo 11 en front y back.
- [x] Barra de búsqueda se oculta al perder selección.
- [x] Imágenes individuales eliminables en admin.
- [x] Pasarela de pago abstraída como interfaz placeholder limpia.
- [x] Controladores Blade legacy eliminados sin romper rutas.
- [x] Todos los flujos existentes pasan regression.
- [x] Entregables: PLAN.md, design-spec.md, QA-plan.md, QA-report.md.

---

## Restricciones

- **LEGAL**: PROHIBIDO usar logo, monograma, tipografías o imágenes de Louis Vuitton u otras marcas registradas.
- **TÉCNICA**: No romper funcionalidad existente. Toda nueva feature debe ser backward-compatible.
- **IDIOMA**: UI 100% en español, moneda CLP.
- **TEMA**: Negro minimalista monocromático como default, con toggle a light.
