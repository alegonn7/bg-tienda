# Fase 04 — Multi-tenancy, routing y corte a la base compartida ✅ hecho (2026-08-19)

## Qué se hizo (más grande de lo planeado originalmente — ver nota al final)

### Corte de base de datos
`.env.local` ahora apunta al proyecto Supabase de bg-gestion (`eawotrxenraxxeozqpkv`), no al de
Pins-crew. A partir de acá `ecomerse` lee/escribe contra la base compartida.

### Routing por slug
- `app/page.tsx`, `app/productos/page.tsx`, `app/productos/[id]/page.tsx` → movidos a
  `app/[slug]/page.tsx`, `app/[slug]/productos/page.tsx`, `app/[slug]/productos/[id]/page.tsx`.
- `app/[slug]/layout.tsx` (nuevo): resuelve la tienda por slug vía `getStoreBySlug` (lee la vista
  `store_directory`), hace `notFound()` si el slug no corresponde a ninguna tienda habilitada, y
  pone el `<title>`/favicon dinámicos de esa tienda.
- `lib/tenant.ts` (nuevo): `getStoreBySlug(slug)` (público, vía `store_directory`) y
  `getCurrentOrgForAdmin()` (deriva organización/rol/sucursal online del usuario logueado — nunca
  de la URL, la regla dura de esta fase).
- Todos los `Link` internos que apuntaban a `/` o `/productos` (navbar, footer, tarjetas de
  producto, carrusel) ahora arman la ruta con el slug (`/${slug}`, `/${slug}/productos`). Esto no
  era solo cosmético: sin este cambio la navegación de cualquier tienda te mandaba siempre a la
  raíz en vez de quedarte dentro de esa tienda.

### Capa de datos del storefront
`lib/products-server.ts` reescrito para leer de `store_catalog`/`store_catalog` (las vistas
públicas de la Fase 01) en vez de la tabla plana `products` de Pins-crew, filtrando por
`organization_id`. Se le agregó `created_at` a `store_catalog` (migración
`20260819100000_bg_tienda_catalog_created_at.sql`) para poder ordenar "más nuevos primero".

**Decisión de diseño para minimizar el cambio**: el tipo `Product` (`lib/products.ts`) mantiene
los mismos nombres de campo que ya usaba toda la UI (`id`, `category`, `active`...), mapeados
desde las columnas reales (`product_id`, `category_name`, `is_active`...) en la capa de datos.
Gracias a esto, `ProductCard`, `cart-context`, `product-purchase`, `cart-drawer`,
`featured-carousel` **no necesitaron ningún cambio de lógica** — el único touch fue agregarles un
prop `slug` para las rutas. Categorías y medidas del filtro de `/productos` ahora se derivan de
los productos ya traídos (no hay policy pública separada para las tablas `categories`/`sizes`).

### Admin (`/admin`) contra el esquema compartido
- `app/admin/layout.tsx`: si `getCurrentOrgForAdmin()` devuelve `null` (usuario sin organización,
  o su organización no tiene bg-tienda habilitada — cosa posible ahora que bg-gestion y
  bg-tienda comparten el mismo `auth.users`), muestra un mensaje claro en vez de un admin roto.
- `app/admin/actions.ts` reescrito: alta de producto pasa a ser dos inserts relacionados
  (`products` + `products_branch`, con el `branch_id` de la sucursal online resuelta por sesión)
  — portando la lógica que ya usa `bg-gestion/src/renderer/store/products.ts`. "Eliminar producto"
  pasó a **sacar de la tienda online** (borra solo la fila de `products_branch` de esa sucursal,
  no el producto maestro — porque ese maestro puede seguir en uso en otras sucursales de
  bg-gestion; un delete real ya no es una operación segura desde acá).
- **Categorías** (`/admin/categorias`): sin cambios de código en la página — RLS de bg-gestion ya
  scopea el `SELECT` por organización. Solo `createCategory` necesitaba mandar `organization_id`
  explícito (RLS lo exige en el `INSERT`).
- **Medidas** (`/admin/medidas`): **eliminada**. bg-gestion no tiene una tabla `sizes` — nunca se
  migró una en la Fase 01, a propósito. `product-form.tsx` pasa a un input de texto libre
  (chips, sin tabla de lookup detrás) para las medidas del producto.
- **Configuración/favicon**: repuntado de la tabla `settings` de Pins-crew (que no existe en la
  base compartida) a `store_settings.favicon_url`.
- **Banner** (`/admin/hero`): `hero_images` ahora requiere `organization_id` al insertar — se lo
  pasa el componente cliente vía prop desde la página server.
- Se agregaron campos de **precio y stock** al formulario de producto (antes no existían en
  Pins-crew) y una columna de precio/stock en la tabla de admin — sin esto, crear un producto
  desde acá lo dejaba sin precio ni stock de forma permanente, y no había manera de probar que el
  corte de base realmente funciona.

### Bug encontrado y corregido: rutas de Storage sin prefijo de organización
Las policies de Storage de la Fase 01 exigen que el primer segmento del path sea el
`organization_id` (`store_images_org_write`, etc. — ver Fase 01). Al escribir el código de subida
de imágenes (producto, banner, favicon) me olvidé de anteponer ese prefijo — subir cualquier
archivo hubiera fallado por RLS en el primer uso real. Corregido en los tres lugares
(`product-form.tsx`, `hero-manager.tsx`, `favicon-manager.tsx`) antes de darlo por terminado, y
de paso las tres subidas pasaron del bucket viejo `products` (Pins-crew) al nuevo
`store-product-images` (Fase 01).

## Deliberadamente fuera de esta fase (queda para la Fase 05)

El branding sigue 100% hardcodeado: "PinsCrew" como texto, el número de WhatsApp
(`542241579045`) y el color `#d81b8a` como literales en varios archivos. No se tocó nada de esto
— es exactamente el trabajo que ya estaba planeado para la Fase 05, y mezclarlo acá hubiera hecho
esta fase todavía más grande sin necesidad.

## Verificación

- `pnpm install` (el `node_modules` del repo tenía una instalación mixta npm/pnpm rota —
  `typescript` no resolvía; reinstalado limpio con pnpm, que es el lockfile más reciente).
- `tsc --noEmit`: limpio.
- `next build`: limpio, las 11 rutas esperadas aparecen (`/[slug]`, `/[slug]/productos`,
  `/[slug]/productos/[id]`, `/admin` y sus subpáginas).
- Smoke test en runtime (`next dev` + `curl`): `/` → 404 (no matchea `[slug]` vacío, esperado),
  `/no-existe` → 404 (slug sin tienda habilitada, esperado), `/admin/login` → 200,
  `/admin` sin sesión → 307 a login. Confirma que el routing y la resolución de tenant funcionan
  en runtime, no solo en el build.
- **No probado**: una tienda real con productos de punta a punta — hoy `store_settings` sigue en
  0 filas (nadie creó una tienda todavía desde `admin-gestion`). Eso es exactamente el contenido
  de la Fase 07.

## Nota al margen: el lint de este repo no corre

`package.json` tiene `"lint": "eslint ."` pero no hay ningún paquete de eslint instalado
(`eslint`, `eslint-config-next`, etc. no están en `devDependencies`) — preexistente, no lo causé
yo. `npx eslint` intenta bajar un eslint genérico sin config de Next y falla. No lo arreglé
(instalar y configurar eslint es una decisión aparte, no pedida) — queda anotado en
[08-futuro.md](../08-futuro.md).
