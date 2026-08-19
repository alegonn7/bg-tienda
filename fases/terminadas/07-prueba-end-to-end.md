# Fase 07 — Prueba end-to-end: primera tienda real ✅ hecho (2026-08-19)

## Cómo se hizo

Vía consola/DB directamente contra el proyecto real de bg-gestion (`eawotrxenraxxeozqpkv`), no a
través del navegador — decisión explícita del dueño para esta ronda. Se creó una organización de
prueba completa (`Tienda de Prueba QA`, slug `tienda-prueba-qa`) con sucursal online, tienda
habilitada, un usuario `owner` sintético (sin cuenta de Auth real — suficiente para probar la
lógica de autorización de las funciones, no para probar el login en sí) y 2 productos con precio
y stock reales, todo con SQL directo simulando exactamente lo que hacen `admin-gestion` y el
`/admin` de `ecomerse`.

## Qué se verificó, y cómo

1. **Vistas públicas** (`store_directory`, `store_catalog`): consultadas directo — devuelven
   exactamente los datos esperados de la tienda de prueba, sin ninguna columna sensible.
2. **Next.js real, no solo la base**: se levantó `next dev` y se pidieron las páginas reales por
   HTTP. `/tienda-prueba-qa` (home), `/tienda-prueba-qa/productos` y
   `/tienda-prueba-qa/productos/[id]` devolvieron 200 con el HTML correcto — nombre de la tienda
   ("Tienda de Prueba QA", no "PinsCrew"), los 2 productos de prueba, precios, medidas, y
   `--color-accent:#2563eb` inyectado como estilo inline (el color custom de la tienda de prueba,
   confirmando que el theming dinámico de la Fase 05 funciona en HTML servido de verdad).
3. **Pedido + confirmación con stock real**: se creó un pedido con 2 líneas (simulando
   `createPendingOrder`) y se confirmó llamando a `confirm_store_order` con la identidad del
   usuario de prueba simulada vía `SET LOCAL request.jwt.claim.sub` (técnica estándar para probar
   funciones que dependen de `auth.uid()` sin necesitar un login real). Resultado: los dos
   `products_branch` bajaron de stock exactamente lo esperado (1→0 y 10→8), se crearon los
   `inventory_movements` correspondientes (`movement_type: exit`, `transaction_type: sale`,
   `reason` con el número de pedido), se creó la `sales`/`sale_items` con precios correctos, y el
   pedido pasó a `confirmed` con `confirmed_by` apuntando al usuario correcto.
4. **Caso de stock insuficiente**: con el producto en 0 stock, se creó un segundo pedido pidiendo
   1 unidad y se intentó confirmar — la función rechazó con `insufficient_stock`, el pedido quedó
   en `pending` (no se tocó), y no se creó ningún `sales` huérfano. La transacción se revirtió
   completa, como estaba diseñado en la Fase 01.

## Encontrado en el camino

Al hacer `delete from organizations` para limpiar los datos de prueba, Postgres rechazó el borrado
en cascada: `sale_items.product_branch_id` **no tiene `ON DELETE CASCADE`** — a diferencia de la
mayoría de las otras tablas, esta relación no cascadea. Tiene sentido (no querés que un
registro de venta desaparezca solo porque se borra una organización, por temas de auditoría), pero
es bueno saberlo: **el botón "Eliminar" de `admin-gestion` para organizaciones puede fallar** si
esa organización tiene ventas históricas — no es un bug nuevo de esta fase, es preexistente, y
queda anotado en `08-futuro.md` junto con el resto de la deuda técnica de ese botón.

## Limpieza

Todos los datos de prueba se borraron al final (orden manual respetando FKs, ya que el cascade
automático no alcanza por lo del punto anterior). Confirmado después: 4 organizaciones reales (las
mismas de siempre), 641 productos, 1355 ventas — exactamente los números de antes de esta prueba,
cero rastro de la tienda de prueba.

## Conclusión

Las Fases 01-06 funcionan de punta a punta contra la base real: esquema, RLS, funciones de stock
atómicas, multi-tenancy por slug, branding dinámico, y el flujo completo de pedido → confirmación
→ descuento de stock. Lo único que esta ronda no cubrió es un login real por navegador — eso
queda para cuando se dé de alta la primera tienda real de verdad, con un usuario con cuenta de
Auth real.
