# Fase 08 — Futuro (fuera de esta ronda)

No bloquean el lanzamiento de bg-tienda. Se retoman cuando haga falta.

## Dominios propios / subdominios

Migrar de slug-en-path (`bgtienda.com/glad`) a subdominio (`glad.bgtienda.com`) y eventualmente
dominio propio por cliente (`tienda.clientedelcliente.com`). Cambia solo cómo se resuelve el
tenant (leer `host` en vez de `[slug]`), no el modelo de datos — `organizations.slug` sigue
siendo el mismo valor. Dominio propio es el patrón estándar de Vercel para multi-tenant: un solo
proyecto, N dominios asociados vía su API, resolución final siempre por `host`.

## Checkout con pago online (MercadoPago)

`store_settings.payment_online_enabled` y las columnas `payment_method`/`mp_payment_id`/
`mp_status` de `store_orders` (Fase 01) ya están preparadas. El trabajo es: una Edge Function de
webhook (mismo patrón que `fiscal-emit`/`fiscal-setup` de bg-gestion) que reciba la notificación
de pago, llene esas columnas y llame a `confirm_store_order`. Se activa opcionalmente por tienda.

## Migrar `pos.ts` de bg-gestion al RPC compartido

Una vez que `adjust_branch_stock` (Fase 01) esté en producción y en uso por bg-tienda, migrar
`processSale` en `bg-gestion/src/renderer/store/pos.ts` para llamarla también, en vez de su
read-then-write actual. PR separada y de bajo riesgo en el repo de bg-gestion — cierra el gap de
concurrencia end-to-end una vez que hay dos escritores reales sobre el mismo stock.

## Deuda técnica menor notada en el camino

- `admin-gestion`: `OrganizationActions.tsx` hace hard-delete de organizaciones con solo un
  `confirm()` de navegador — evaluar soft-delete real vía `is_active`.
- `admin-gestion`: cualquier usuario se puede promover a `superadmin` desde el mismo dropdown de
  rol que admin/employee, sin fricción extra — evaluar una confirmación adicional.
- Proyecto Supabase `Pins-crew` (`bfjqrusawdixaodeygma`) standalone: decidir pausarlo o darlo de
  baja una vez que `ecomerse` apunte al proyecto compartido — 0 filas, nada que perder.
- `fiscal_wsaa_cache` (bg-gestion) y `push_tokens` (Joketime) con RLS deshabilitado — sin relación
  con bg-tienda, pero quedaron anotados durante esta investigación.
- `ecomerse` no tiene eslint instalado pese a tener el script `lint` en `package.json` (ni
  `eslint` ni `eslint-config-next` están en `devDependencies`) — preexistente, notado en la
  Fase 04.
- `ecomerse` tenía `package-lock.json` y `pnpm-lock.yaml` conviviendo, con un `node_modules`
  mixto que dejó `typescript` sin resolver (arreglado reinstalando con pnpm en la Fase 04) — vale
  la pena borrar `package-lock.json` y quedarse solo con pnpm para que no se repita.
