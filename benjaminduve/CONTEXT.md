# Contexto del Proyecto

Este archivo se usa para registrar instrucciones del usuario y cambios clave implementados durante el trabajo en este repositorio.

## Instrucciones Persistentes del Usuario
- Mantener un registro de instrucciones y de cada cambio clave solicitado.

## Registro de Cambios Clave

### 2026-05-04
- Se crea este archivo de contexto para llevar trazabilidad de instrucciones y mejoras solicitadas.
- Solicitud del usuario: levantar el proyecto en `localhost` usando Docker y dejar backend disponible junto a panel para gestión de base de datos.
- Se agrega configuración Docker local con:
  - `docker-compose.yml` (servicios `app`, `db` MySQL y `phpmyadmin`).
  - `Dockerfile` para Laravel sobre `php:8.3-apache` con extensiones `pdo_mysql`, `mysqli` y `zip`.
- Se actualiza `.env` para usar MySQL del contenedor (`DB_HOST=db`, `DB_DATABASE=benjaminduve`, `DB_USERNAME=benjaminduve`).
- Ajuste técnico durante el levantamiento: el proyecto (`laravel/framework ^13`) exige PHP `^8.3`, por lo que se corrige la imagen de `8.2` a `8.3`.
- Se corrige el error HTTP `500` por permisos de escritura agregando ajuste de grupo/permisos en `storage` y `bootstrap/cache` al arranque del contenedor `app`.
- Soporte solicitado para gestión de credenciales MySQL desde consola.
- Corrección del error `Table 'benjaminduve.sessions' doesn't exist`:
  - Se ejecutan migraciones en el entorno Docker (`php artisan migrate --force`).
  - Se valida la tabla `sessions` en MySQL con columnas compatibles con `SESSION_DRIVER=database`.
  - Se elimina migración temporal redundante generada durante diagnóstico (`database/migrations/2026_05_05_020350_create_sessions_table.php`) para evitar fallos futuros por tabla ya existente.
- Solicitud del usuario: agregar un header simple al `welcome.blade.php` y una pantalla de login minimalista (blanco, negro y grises) con separación de frontend/backend.
- Implementación backend:
  - Se crea `app/Http/Controllers/LoginController.php` con validación de credenciales contra base de datos.
  - Solo permite login si el usuario existe y la contraseña coincide.
  - Respuesta funcional solicitada: retorna texto `admin` si `role=admin`, y `usuario` en otro caso.
  - Se actualizan rutas en `routes/web.php` (`GET /` y `POST /login`).
- Implementación de datos:
  - Se agrega migración `database/migrations/2026_05_04_221655_add_role_to_users_table.php` para incorporar campo `role` en `users` con valor por defecto `usuario`.
  - Se actualiza `app/Models/User.php` para permitir `role` en atributos asignables.
- Implementación frontend:
  - Se reemplaza `resources/views/welcome.blade.php` por una vista básica con header, formulario de login y resultado textual.
- Solicitud del usuario: normalizar base de datos y usar atributo `is_admin` en `users` para definir la vista al iniciar sesión.
- Normalización aplicada:
  - Se agrega migración `database/migrations/2026_05_04_223300_normalize_users_with_is_admin.php`.
  - La migración crea `is_admin` (boolean, default `false`), migra datos existentes desde `role='admin'` y elimina columna `role`.
  - `app/Models/User.php` se actualiza para usar `is_admin` en `fillable` y `casts`.
- Flujo login actualizado:
  - `LoginController` ahora evalúa `is_admin` y redirige a vista `/admin` o `/usuario`.
  - Se agregan rutas `GET /admin` y `GET /usuario`.
  - Se crean vistas mínimas `resources/views/admin.blade.php` y `resources/views/usuario.blade.php`.
- Solicitud del usuario: crear un seeder para usuario administrador con correo `admin@gmail.com` y contraseña `123`.
- Se implementa `database/seeders/AdminUserSeeder.php` con `updateOrCreate` para garantizar idempotencia.
- `database/seeders/DatabaseSeeder.php` se actualiza para ejecutar `AdminUserSeeder`.
