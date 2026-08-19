# Fase 06 — Flujo de pedidos ✅ hecho (2026-08-19)

## Qué se hizo

- `app/[slug]/actions.ts` (nuevo, storefront): `createPendingOrder(organizationId, branchId,
  items)` — crea `store_orders` (status `pending`) + sus `store_order_items`, corriendo con el
  cliente **anon** (las policies públicas de INSERT de la Fase 01 son las que autorizan esto).
  **Falla en silencio** (loguea el error y devuelve `null`) en vez de tirar una excepción — a
  propósito: si crear el pedido rastreado falla por lo que sea, el cliente igual tiene que poder
  llegar a WhatsApp. El canal principal no puede depender de una feature secundaria de tracking.
- `components/cart-drawer.tsx` y `components/product-purchase.tsx`: el botón de WhatsApp dejó de
  ser un `<a href>` directo — ahora es un botón que primero llama `createPendingOrder(...)` y
  recién después abre `wa.me` en una pestaña nueva (`window.open`). Se agregó un estado
  "Enviando pedido..." mientras tanto. Las dos superficies de contacto por WhatsApp que ya
  existían (el carrito completo, y el "consultar por este producto" de la página de detalle)
  quedaron cubiertas — no solo una.
- `app/admin/actions.ts`: `confirmOrder(orderId)` (llama al RPC `confirm_store_order` de la
  Fase 01 — la validación de que el pedido sea de tu organización ya está adentro de la función,
  no hace falta repetirla acá) y `cancelOrder(orderId)` (update directo a `status='cancelled'`,
  con guarda `.eq('status', 'pending')` para no cancelar algo que ya se confirmó).
- `/admin/pedidos` (nuevo): lista los últimos 100 pedidos de la organización (RLS ya los scopea),
  con sus items, y para los `pending` dos acciones — "Marcar como vendido" (confirma, descuenta
  stock atómicamente vía la función de la Fase 01, y si algún ítem no tiene stock suficiente
  muestra el error de Postgres tal cual en vez de confirmar nada) y "Cancelar".
- Nav: "Pedidos" agregado a `/admin`.

## Sobre `customer_name`/`customer_phone`

Las columnas existen (Fase 01) pero **no se piden en un formulario** antes de abrir WhatsApp — a
propósito, para no agregarle fricción al cliente antes de llegar al chat. El dueño de la tienda ve
nombre y teléfono reales del lado de WhatsApp mismo, que es donde realmente se negocia el pedido.
Si en algún momento hace falta tenerlos en la base (para reportes, por ejemplo), se agregan como
un paso opcional del formulario — no bloqueante para esta fase.

## Verificación

- `tsc --noEmit` y `next build`: limpios — `/admin/pedidos` y las dos nuevas acciones de servidor
  aparecen correctamente.
- Runtime: `/admin/pedidos` sin sesión → 307 a login, igual que el resto de `/admin/*`.
- **No probado con datos reales todavía**: crear un pedido de verdad, confirmarlo, y ver que el
  stock se descontó y apareció en `sales` de bg-gestion — depende de tener una tienda real con
  productos cargados, que es exactamente el contenido de la Fase 07.
