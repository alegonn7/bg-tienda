# Contexto y decisiones

## El problema

Hoy `ecomerse` es la tienda online de una sola empresa, PinsCrew. El objetivo es convertirlo en
un SaaS ("bg-tienda") donde muchas empresas tengan su propia tienda con el mismo diseño,
conectado con **bg-gestion** (`C:\Projects\trabajo\bg-gestion\bg-gestion`), el programa de
gestión/stock del mismo dueño:

- Un cliente puede tener **solo bg-gestion**, **solo bg-tienda**, o **ambos conectados**.
- Conectados: productos y stock se ven reflejados entre los dos sistemas, y una venta en la
  tienda descuenta el mismo stock que usa el POS de bg-gestion.

## Decisiones tomadas

1. **Arquitectura de datos: BD única compartida.** Las tablas nuevas de bg-tienda (pedidos
   online, config de tienda) se agregan directamente al proyecto Supabase que ya usa bg-gestion
   (`eawotrxenraxxeozqpkv`, org "Binary Goats"). Sin sincronización entre bases — una sola fuente
   de verdad para `organizations`/`products`/`products_branch`.
2. **"La base está casi llena" = límite de proyectos gratis de Supabase**, no volumen de datos.
   El proyecto standalone de Pins-crew (`bfjqrusawdixaodeygma`, otra cuenta) se retira una vez que
   `ecomerse` apunte al proyecto de bg-gestion — no hay datos reales que perder (0 filas en sus 5
   tablas, confirmado).
3. **"Joke time" descartado como destino.** Es el proyecto Supabase `Joketime`
   (`vpckisqvmfhcdtprupdb`), backend de una app de chistes (tablas `push_tokens`/`profiles`) sin
   ninguna relación con e-commerce/inventario. No aporta nada como base para bg-tienda.
4. **Alta de tiendas nuevas: el panel de super-admin ya existe.** Es `admin-gestion`
   (`C:\Projects\trabajo\bg-gestion\admin-gestion`) — ver detalle abajo. Se extiende con un
   módulo nuevo, no se construye de cero.
5. **Modelo de venta v1: simple ahora, pago online después.** Pedido por WhatsApp que queda
   guardado como "pendiente"; el dueño de la tienda lo confirma desde un panel y **eso** descuenta
   el stock. El esquema queda preparado (columnas reservadas) para sumar checkout con
   MercadoPago más adelante sin rehacer tablas.
6. **Las imágenes de producto son un interés exclusivo de bg-tienda.** bg-gestion no las maneja
   ni las necesita — la columna nueva `products.images` es aditiva y bg-gestion simplemente la
   ignora.

## Snapshot de la base real de bg-gestion (verificado en vivo)

Proyecto `eawotrxenraxxeozqpkv` ("BG-GESTION"), org Supabase "Binary Goats" (cuenta separada de
la de Pins-crew). Producción real, no un sandbox — cualquier cambio de esquema pasa primero por
una branch de staging.

- **Escala real**: 4 `organizations`, 4 `branches`, 7 `users`, 641 `products`, 632
  `products_branch`, 1355 `sales` / 1551 `sale_items`, 1776 `inventory_movements`, 150
  `cash_registers`, 52 `categories` (jerárquicas: `parent_id`, `color`, `icon`).
- **Tablas core reutilizables tal cual**: `organizations`, `branches`, `users`, `products`,
  `products_branch`, `categories`, `inventory_movements`, `sales`, `sale_items`, `suppliers`,
  `transfer_accounts`, `extra_movements`.
- **`plan_config`**: catálogo real de planes (`inicial` $25.000, `profesional` $40.000, `premium`
  $65.000, `enterprise` a medida), con `max_branches`/`max_products_per_branch`/
  `max_users_per_branch` y un campo `features jsonb` libre (hoy usado para `soporte`,
  `ventas_por_mes`, `historial_reportes_meses` — no para flags de producto, pero confirma que
  `jsonb` para flexibilidad ya es un patrón usado en este código).
- **`users.role`** es un enum (`superadmin, admin, employee, user, owner, manager`) — **ya
  incluye `superadmin`**, no hace falta ninguna columna nueva para marcar super-admins.
- **Límites de plan enforced en dos capas**: client-side (stores de Zustand) y server-side, vía
  triggers Postgres (`check_branch_limit`, `check_product_limit`, `check_user_limit` y sus
  variantes `_update`) — más robusto de lo que parecía mirando solo el código del Electron.
- **Descuento de stock hoy es read-then-write** (`src/renderer/store/pos.ts` → `processSale`):
  lee `stock_quantity`, calcula en el cliente, hace `UPDATE`. Sin problema con un solo escritor,
  pero bg-tienda sería un segundo escritor concurrente sobre el mismo stock — de ahí la función
  `adjust_branch_stock` de la Fase 01.
- **Storage**: un bucket público existente, `organization-logos` (usado para
  `organizations.logo_url`) — convención a seguir para el bucket nuevo de imágenes de producto.
- **Precedente arquitectónico útil**: la facturación electrónica AFIP/ARCA usa un certificado
  fiscal compartido a nivel plataforma, y cada organización se autoriza contra él
  (`fiscal_shared_cert.sql`) — mismo espíritu de "infraestructura compartida, autorización por
  tenant" que necesita bg-tienda.
- **Seguridad — hallazgos de paso, no relacionados a bg-tienda, sin tocar por ahora**:
  `fiscal_wsaa_cache` tiene RLS deshabilitado (singleton, `id` siempre 1, riesgo bajo); 6
  funciones con `search_path` mutable (warning menor); `get_auth_user_info()` es
  `SECURITY DEFINER` invocable por `anon`/`authenticated` (patrón intencional para evitar
  recursión de RLS sobre `users`, ver abajo). En el proyecto `Joketime` (no relacionado),
  `push_tokens` también tiene RLS deshabilitado.

## admin-gestion — el panel de super-admin

`C:\Projects\trabajo\bg-gestion\admin-gestion`: Next.js 16 **separado** del Electron y de
`ecomerse`, con sus propias rutas `/organizations`, `/users`, `/plans`, `/stats`.

- **Autorización**: `src/proxy.ts` valida sesión con la anon key y después hace un `fetch` directo
  con la **service-role key** contra `/rest/v1/users?...&auth_id=eq.<uid>` para confirmar
  `role === 'superadmin'`. Por eso ninguna policy de RLS menciona `superadmin` — la autorización
  vive enteramente en este middleware, no en Postgres. Todas las API routes
  (`/api/admin/organizations`, `/api/admin/users`, `/api/admin/create-user`, etc.) usan un
  cliente con service-role key, bypaseando RLS — mismo patrón que `getSupabaseAdmin()` en el
  Electron.
- **Ya hace hoy**: alta/edición/baja de `organizations` (nombre, slug, plan — límites
  auto-completados desde `plan_config`), alta/edición de `users` (email, password, organización,
  rol — `superadmin` es una opción más del dropdown de roles), CRUD de `plan_config` con textarea
  JSON libre para `features`.
- **Organizaciones reales hoy**: `glad`, `prueba`, `sistema` (id fijo
  `00000000-0000-0000-0000-000000000001`, probablemente un org placeholder), `oveja-negra` — las
  cuatro en plan `enterprise`.
- **Falta para bg-tienda**: un módulo nuevo (`/tiendas` o una pestaña en `/organizations`) que
  gestione `store_settings` — ver Fase 03.
- **Dos riesgos menores notados, no bloquean nada, quedan a criterio del dueño**:
  `OrganizationActions.tsx` borra la organización con `DELETE` real tras un simple `confirm()` de
  navegador, sin usar el `is_active` que la tabla ya tiene; y cualquier usuario se puede promover
  a `superadmin` desde el mismo dropdown de rol que admin/employee, sin fricción extra.

## Snapshot de la base de Pins-crew (previa, ya no se usa — preservada como referencia)

Proyecto `bfjqrusawdixaodeygma` ("Pins-crew"), otra cuenta de Supabase ("Binary Goats" —
organización distinta a la de bg-gestion pese al mismo nombre). **Las 5 tablas tenían 0 filas**;
esto es solo estructura de referencia, no hubo datos que migrar. No existían migraciones
versionadas; este es el único registro de la forma real de esa base.

- **`products`**: `id uuid PK`, `name text`, `category text` (string libre, no FK), `description
  text`, `images text[]`, `active boolean`, `created_at`, `sizes text[]`, `featured boolean`. Sin
  `price`, sin stock.
- **`categories`** / **`sizes`**: `id uuid PK`, `name text unique`, `created_at`.
- **`hero_images`**: `id uuid PK`, `url text`, `position int`, `created_at`.
- **`settings`**: `key text PK`, `value text`, `updated_at` — key/value genérico, solo usado para
  `key='favicon'`.
- **RLS**: dos policies por tabla — `"Admin acceso total"` (`FOR ALL USING (auth.role() =
  'authenticated')`, sin scoping — **el patrón a NO copiar**) y `"Lectura pública"` (`FOR SELECT
  USING (true)`, o `USING (active = true)` en `products`).
- **Storage**: bucket único `products`, reusado por prefijo (`hero/`, `favicon/favicon.<ext>`,
  raíz para imágenes de producto).
- **Auth**: Supabase Auth email/password, un solo login admin, cualquier autenticado = admin
  total, sin roles.

## Preguntas de producto abiertas (no bloquean, se resuelven sobre la marcha)

- `store_settings.show_prices`: ¿la tienda muestra precio público, o sigue "a confirmar" como hoy
  en Pins-crew? Default recomendado: mantener "a confirmar" (`false`) para no cambiar el modelo
  de negocio sin pedirlo explícitamente.
- Matriz rol→permisos dentro de bg-tienda (owner/admin acceso completo; employee limitado a ver/
  confirmar pedidos, a definir).
