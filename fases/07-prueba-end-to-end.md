# Fase 07 — Prueba end-to-end: primera tienda real

**Depende de**: Fases 01-06 completas.

## Objetivo

Confirmar que todo el circuito funciona de punta a punta, sin intervención manual en la base,
antes de dar de alta el primer cliente real de bg-tienda.

## Caso a probar: organización "solo tienda"

Confirma que no hace falta ningún modelo paralelo para un cliente que nunca va a usar el Electron
de bg-gestion — se provisiona igual que cualquier organización:

1. Desde `admin-gestion` (Fase 03): alta de organización de prueba nueva → `branches` ("Sucursal
   Online") → `store_settings` (`enabled=true`) → primer usuario `owner`.
2. Login como ese owner en `ecomerse` `/admin`, cargar 2-3 productos con precio/stock/imagen
   (usando el join `products`+`products_branch` de la Fase 04/05 — carga de producto pasa a ser
   dos inserts relacionados, portando la lógica que ya existe en `createProduct` de
   `bg-gestion/src/renderer/store/products.ts`, líneas 213-309).
3. Visitar el storefront público por slug (`/<slug-de-la-organizacion>`) sin sesión — confirmar
   que se ven los productos cargados y el branding de esa organización, no el de PinsCrew ni el
   de ninguna otra.
4. Hacer un pedido desde el storefront (Fase 06) → aparece en `/admin/pedidos` como `pending`.
5. Confirmar el pedido → stock descontado en `products_branch`, movimiento en
   `inventory_movements`, fila nueva en `sales`/`sale_items`.
6. Si el dueño después "instala" bg-gestion para esa misma organización (hipotético, no hace
   falta hacerlo de verdad en esta prueba): debería ver el mismo `organization_id`, mismos
   productos y mismo stock — cero migración.

## Caso a probar: aislamiento entre tiendas

Repetir el paso 2-3 con una segunda organización de prueba en paralelo — confirmar que ninguna ve
productos, pedidos ni configuración de la otra, ni por RLS (API) ni por URL (dos slugs
distintos).

## Listo cuando

- Los 6 pasos del caso "solo tienda" funcionan sin ningún `UPDATE`/`INSERT` manual vía SQL
  Editor.
- El caso de aislamiento no muestra ningún dato cruzado entre las dos organizaciones de prueba.
- Recién después de esto se da de alta el primer cliente real.
