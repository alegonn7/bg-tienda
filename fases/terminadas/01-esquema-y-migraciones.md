# Fase 01 — Esquema y migraciones ✅ hecho (2026-08-18)

**Depende de**: nada. **Bloquea**: todo lo demás (ya desbloqueado).

## Objetivo

Escribir las migraciones SQL nuevas para soportar bg-tienda sobre el esquema real de bg-gestion.

**Cambios sobre lo planeado originalmente:**
- Los archivos quedaron en `C:\Projects\trabajo\bg-gestion\bg-gestion\supabase\migrations\`
  (no en `ecomerse`) — ese repo ya está enlazado por Supabase CLI al proyecto real
  (`supabase/.temp/linked-project.json`), así que es la única carpeta que tiene sentido como
  historial de migraciones de esa base.
- El catálogo público (`products`/`store_settings` para el storefront anónimo) se resolvió con
  **vistas** (`store_directory`, `store_catalog`) en vez de policies RLS públicas directas —
  evita exponer `price_cost` o columnas fiscales de `organizations` a cualquiera que pegue
  contra la REST API. Ver el archivo `..._public_catalog_views.sql`.
- **Se aplicó directo a producción**, sin branch de staging — decisión explícita del dueño (sin
  costo, de noche, sin uso del sistema). Las migraciones son 100% aditivas (tablas/columnas/
  funciones nuevas), así que no había riesgo para los datos existentes — confirmado después:
  los 641 `products`/1355 `sales` preexistentes quedaron intactos.
- **Se encontró y corrigió un problema de seguridad real** en la primera versión de las
  funciones (ver más abajo) antes de darlo por terminado.

## Archivos (8, en orden, todos aplicados)

1. `20260818090000_bg_tienda_products_columns.sql`
2. `20260818090100_bg_tienda_store_settings.sql`
3. `20260818090200_bg_tienda_hero_images.sql`
4. `20260818090300_bg_tienda_store_orders.sql`
5. `20260818090400_bg_tienda_stock_functions.sql`
6. `20260818090500_bg_tienda_public_catalog_views.sql`
7. `20260818090600_bg_tienda_storage_bucket.sql`
8. `20260818090700_bg_tienda_stock_functions_security_fix.sql` — ver "Fix de seguridad" abajo

## Columnas nuevas sobre tablas existentes (aditivo, no rompe nada)

```sql
alter table products add column if not exists images text[] default '{}';
alter table products add column if not exists sizes text[] default '{}';
alter table products add column if not exists featured boolean default false;
alter table products add column if not exists show_online boolean default true;
```

`show_online` permite que un producto del catálogo interno no aparezca en la tienda sin tocar
`is_active` (que ya tiene otro significado para el POS). bg-gestion ignora estas columnas por
completo — confirmado que no maneja imágenes.

## Tablas nuevas

**`store_settings`** (1:1 con `organizations`):
`organization_id` (FK único), `branch_id` (FK — qué sucursal vende online), `custom_domain`
(nullable, a futuro), `store_name`, `logo_url`, `favicon_url`, `accent_color`, `whatsapp_number`,
`whatsapp_message_template`, `instagram_url`, `facebook_url`, `show_prices boolean default true`
(ver pregunta abierta en 00-contexto), `enabled boolean default false` (flag "bg-tienda
habilitado"), `payment_online_enabled boolean default false` (reservado para MercadoPago),
`extra jsonb default '{}'` (mismo idioma que `plan_config.features`).

**No se agrega un campo `slug` acá** — el slug público de la tienda reutiliza
`organizations.slug` directamente (ya es único, kebab-case, curado a mano en admin-gestion:
`glad`, `prueba`, `oveja-negra`). Si algún día una tienda necesita una URL distinta de su slug
interno, se agrega como override recién en ese momento.

**`hero_images`**: igual a la de Pins-crew + `organization_id` FK.

**`store_orders`**: `organization_id`, `branch_id` (copiado de `store_settings.branch_id` al
momento del pedido, no como referencia viva), `status text check (status in ('pending',
'confirmed','cancelled'))`, `customer_name`, `customer_phone`, `customer_note`, `subtotal
numeric`, `total numeric` (nullable), `payment_method text default 'whatsapp' check (in
('whatsapp','mercadopago'))`, `mp_payment_id text`, `mp_status text` (reservados, sin usar en
v1), `confirmed_by` (FK `users`), `confirmed_at`, `cancelled_reason`, `created_at`, `updated_at`.

**`store_order_items`**: `store_order_id` (FK cascade), `product_id` (FK `products`, `on delete
set null`), `product_name text` (snapshot), `size text`, `quantity int check (quantity > 0)`,
`unit_price numeric` (nullable), `subtotal numeric` (nullable) — mismo patrón de snapshot que ya
usa `sale_items`.

**Confirmar un pedido también inserta en `sales`/`sale_items`** (ver Fase 06) — así los reportes
de bg-gestion funcionan también para ventas online, sin dashboard paralelo.

## Función de descuento de stock atómico

`processSale` en bg-gestion hoy hace *read-then-write* de `stock_quantity`
(`src/renderer/store/pos.ts`) — bg-tienda sería un segundo escritor concurrente sobre el mismo
stock, así que hace falta resolverlo en el servidor, no en el cliente:

```sql
create or replace function adjust_branch_stock(
  p_product_branch_id uuid, p_delta int, p_transaction_type text,
  p_reference_type text default null, p_reference_id uuid default null,
  p_created_by uuid default null
) returns products_branch language plpgsql security definer as $$
declare v_row products_branch;
begin
  update products_branch
     set stock_quantity = stock_quantity + p_delta,
         version = version + 1, updated_at = now()
   where id = p_product_branch_id
     and stock_quantity + p_delta >= 0
  returning * into v_row;
  if not found then raise exception 'insufficient_stock'; end if;
  insert into inventory_movements (product_branch_id, branch_id, movement_type, quantity,
    stock_before, stock_after, transaction_type, created_by)
  values (p_product_branch_id, v_row.branch_id, case when p_delta < 0 then 'salida' else 'entrada' end,
    abs(p_delta), v_row.stock_quantity - p_delta, v_row.stock_quantity, p_transaction_type, p_created_by);
  return v_row;
end $$;
```

La clave: `stock_quantity + p_delta` se calcula **dentro** del mismo `UPDATE`, contra el valor
bloqueado por Postgres en ese momento — dos llamadas concurrentes contra stock=1 se serializan
solas: una tiene éxito, la otra recibe `insufficient_stock`, sin ventana de carrera ni stock
negativo.

Segunda función, `confirm_store_order(p_store_order_id, p_confirmed_by)`: recorre
`store_order_items`, llama `adjust_branch_stock` por cada línea **dentro de la misma
transacción** (si un ítem no tiene stock, no se confirma nada), actualiza `store_orders.status` e
inserta en `sales`/`sale_items`.

bg-tienda usa esta función desde el día uno. Migrar `pos.ts` de bg-gestion para usarla también
queda para la Fase 08 (fuera de esta ronda) — no bloquea el lanzamiento de bg-tienda.

## RLS — el patrón a copiar (y el que NO)

Copiar el patrón que ya usa bg-gestion en `fiscal_contadores`/`barcode_sheets`:

```sql
organization_id = (select organization_id from users where auth_id = auth.uid())
```

**Explícitamente no** el patrón que tenía Pins-crew (`FOR ALL USING (auth.role() =
'authenticated')` — cualquier autenticado, sin scoping). Portar eso a la base compartida
reintroduciría el mismo agujero cross-tenant el día uno, ahora sobre datos de clientes reales
pagando.

El storefront público necesita policies de lectura anónima nuevas (no existen hoy en bg-gestion,
ahí todo vive detrás de auth):

```sql
using (
  organization_id in (select organization_id from store_settings where enabled = true)
  and is_active = true
)
```

sobre `products` (join contra `products_branch`/`store_settings`) y equivalente sobre
`store_settings`/`hero_images`.

## Storage

Bucket nuevo `store-product-images`, público, paths prefijados por `organization_id` — misma
convención que el bucket existente `organization-logos`.

## Fix de seguridad encontrado (antes de dar la fase por cerrada)

`get_advisors` después de aplicar las primeras 7 migraciones marcó dos problemas reales en
`adjust_branch_stock`/`confirm_store_order`:

1. Postgres otorga `EXECUTE` a `PUBLIC` (incluido `anon`) sobre funciones nuevas por default —
   tal como habían quedado, **cualquier visitante sin sesión podía llamar
   `/rest/v1/rpc/adjust_branch_stock` directo y modificar el stock de cualquier producto de
   cualquier organización**, sin pasar por `confirm_store_order` ni por ninguna validación.
2. `confirm_store_order` recibía `p_confirmed_by` como parámetro confiando en quien llama — un
   atacante podía pasar cualquier `uuid` de usuario ajeno sin haber iniciado sesión como ese
   usuario.

Migración 8 (`..._security_fix.sql`) corrige ambas cosas: `confirm_store_order` ahora deriva el
usuario de `auth.uid()` (no de un parámetro), y se revocó `EXECUTE` de `anon`/`PUBLIC` en las dos
funciones (`adjust_branch_stock` queda como helper interno, sin ningún grant directo — solo
`confirm_store_order`, ya autenticado, la puede invocar desde adentro). Confirmado con
`get_advisors` después del fix: ambos hallazgos desaparecieron.

**Impacto real**: bajo — se aplicó y corrigió en la misma sesión, de noche, sin ninguna tienda
todavía habilitada (`store_settings` con 0 filas en todo momento), así que no hubo ventana de
explotación real con datos de clientes.

## Hallazgos de `get_advisors` que quedan, evaluados y aceptados (no son bugs)

- **`security_definer_view` (ERROR) en `store_directory`/`store_catalog`**: intencional. Estas
  vistas necesitan bypassear el RLS de `organizations`/`products_branch` para que un visitante
  anónimo pueda leerlas — por eso están definidas así. La razón por la que es seguro pese al
  ERROR: cada vista solo expone las columnas que están explícitamente en su `SELECT` (nunca
  `price_cost`, `cuit`, `subscription_status`, etc.), y son vistas multi-tabla (no
  auto-actualizables), así que tampoco se puede escribir a través de ellas. Si en el futuro se
  quiere silenciar el advisor sin cambiar el comportamiento, revisar
  `security_invoker` — pero activarlo rompería el acceso anónimo, que es el propósito de la vista.
- El resto (`fiscal_wsaa_cache` sin RLS, funciones `check_*_limit` con `search_path` mutable,
  `get_auth_user_info`, leaked password protection) ya eran preexistentes y no tienen relación
  con bg-tienda — quedaron anotados en `00-contexto-y-decisiones.md` / `08-futuro.md`.

## Validación pendiente (no se hizo, decisión explícita del dueño)

No se probó nada de esto todavía — se aplicó directo a producción de noche sin validación previa
porque las migraciones son aditivas y no tocan datos existentes. Vale la pena probar en algún
momento antes de dar de alta la primera tienda real:

1. Concurrencia: dos llamadas simultáneas a `adjust_branch_stock` sobre un `products_branch` con
   `stock_quantity = 1` → una da éxito, la otra `insufficient_stock`, nunca stock negativo.
2. Aislamiento RLS: crear 2 organizaciones de prueba, confirmar que ninguna ve datos de la otra
   en `store_settings`/`store_orders`/`store_catalog` vía el cliente anon+auth.
3. Que `store_directory`/`store_catalog` devuelven exactamente las columnas esperadas y nada más,
   consultándolas como `anon`.

Esto se termina de cubrir en la Fase 07 (prueba end-to-end con la primera tienda real).

## Listo cuando

- [x] Migraciones versionadas en `bg-gestion/supabase/migrations/`.
- [x] Aplicadas a producción, `get_advisors` revisado y sin hallazgos nuevos sin explicar.
- [ ] Validación de concurrencia/aislamiento con datos reales — pendiente, se hace en la Fase 07.
