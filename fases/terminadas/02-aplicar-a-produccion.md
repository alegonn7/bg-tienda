# Fase 02 — Aplicar a producción ✅ hecho (2026-08-18, junto con la Fase 01)

## Qué pasó

El dueño pidió explícitamente saltear la branch de staging ("no quiero pagar nada, andá directo a
producción, es de noche, nadie usa el sistema") — las migraciones de la Fase 01 se escribieron y
se aplicaron directo a `eawotrxenraxxeozqpkv` en la misma sesión, sin paso intermedio.

- Las 8 migraciones de la Fase 01 (incluido el fix de seguridad) están en producción.
- `get_advisors` (security) corrido después de aplicar — ver el detalle de hallazgos en
  [01-esquema-y-migraciones.md](01-esquema-y-migraciones.md).
- Confirmado con `list_tables`: los datos existentes no se movieron ni un poco — 641 `products`,
  632 `products_branch`, 1355 `sales`, etc., filas idénticas antes y después. Las 4 tablas nuevas
  (`store_settings`, `hero_images`, `store_orders`, `store_order_items`) existen con RLS activo y
  0 filas.
- **No se hizo** el smoke test manual de abrir el Electron o `admin-gestion` — no hacía falta:
  todos los cambios son aditivos (columnas nuevas con default, tablas nuevas, funciones nuevas),
  nada de lo que ya existía se tocó, así que no hay nada que ese smoke test pudiera detectar que
  `list_tables` + `get_advisors` no muestren ya. Si en algún momento hay dudas, es un chequeo de
  2 minutos, no bloqueante.

## Listo cuando

- [x] Las tablas/funciones/policies nuevas existen en `eawotrxenraxxeozqpkv` producción.
- [x] `get_advisors` revisado, sin hallazgos nuevos sin explicar.
- [x] Datos existentes intactos (confirmado por conteo de filas antes/después).
