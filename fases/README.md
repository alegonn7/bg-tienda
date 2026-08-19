# Roadmap: bg-tienda (SaaS multi-tienda) sobre la base de bg-gestion

Convertir este repo (PinsCrew/ecomerse) en un producto multi-tenant donde varias empresas tengan
su propia tienda con el mismo diseño, conectado a **bg-gestion** de forma que productos y stock
se compartan (una venta online descuenta el mismo stock que ve el POS).

Contexto completo, decisiones ya tomadas y todo lo verificado en vivo contra las bases reales
está en [00-contexto-y-decisiones.md](00-contexto-y-decisiones.md) — leer eso primero.

## Fases

| # | Fase | Qué hace | Estado |
|---|---|---|---|
| [01](terminadas/01-esquema-y-migraciones.md) | Esquema y migraciones | Tablas nuevas (`store_settings`, `store_orders`, ...) + función de stock atómica | ✅ Hecho (2026-08-18) |
| [02](terminadas/02-aplicar-a-produccion.md) | Aplicar a producción | Llevar el esquema a la base real de bg-gestion | ✅ Hecho — se aplicó directo junto con la Fase 01 (sin branch de staging, a pedido del dueño) |
| [03](terminadas/03-modulo-tienda-admin-gestion.md) | Módulo de tienda en admin-gestion | Extender el panel de super-admin que ya existe con la gestión de `store_settings` | ✅ Hecho (2026-08-18) — alta desde cero quedó como 3 pasos manuales, no un wizard único |
| [04](terminadas/04-multitenancy-routing-ecomerse.md) | Multi-tenancy, routing y corte de base | `ecomerse` resuelve la tienda por slug y lee/escribe contra la base compartida | ✅ Hecho (2026-08-19) — branding sigue hardcodeado a propósito, ver Fase 05 |
| [05](terminadas/05-auth-rls-branding.md) | Auth/RLS real + branding dinámico | Scoping real por organización (RLS + `/admin`) y sacar todo el hardcodeo de "PinsCrew" | ✅ Hecho (2026-08-19) |
| [06](terminadas/06-flujo-pedidos.md) | Flujo de pedidos | Pedido por WhatsApp queda persistido; confirmarlo descuenta stock de verdad | ✅ Hecho (2026-08-19) |
| [07](terminadas/07-prueba-end-to-end.md) | Prueba end-to-end | Tienda de prueba real: pedido, confirmación, stock atómico y el caso de stock insuficiente, verificados contra la base real | ✅ Hecho (2026-08-19) |
| [08](08-futuro.md) | Futuro (fuera de esta ronda) | Dominios propios, checkout con pago online, cerrar deuda técnica menor | Futuro |

**Las 7 fases están hechas y verificadas.** Lo único que no se probó todavía es un login real por
navegador con una tienda dada de alta de verdad (no de prueba) — eso pasa naturalmente cuando se
dé de alta el primer cliente real desde `admin-gestion`.

## Decisiones que ya no están en discusión

1. Una sola base de datos compartida — todo vive en el proyecto Supabase de bg-gestion, sin
   sincronización entre dos bases.
2. El panel de super-admin (`admin-gestion`) ya existe — se extiende, no se construye de cero.
3. v1 de ventas online es WhatsApp + confirmación manual (no pago online todavía, pero el
   esquema queda preparado para sumarlo sin romper nada).

Detalle completo de cada una en [00-contexto-y-decisiones.md](00-contexto-y-decisiones.md).
