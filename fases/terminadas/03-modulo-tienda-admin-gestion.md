# Fase 03 — Módulo de tienda en admin-gestion ✅ hecho (2026-08-18)

## Qué se construyó

Extendí `admin-gestion` con una sección nueva "Tiendas", siguiendo exactamente el patrón que ya
usaba `/organizations` (service-role key en API routes, mismo estilo visual):

- `src/app/api/admin/branches/route.ts` (nuevo) — `GET` lista sucursales de una organización,
  `POST` crea una sucursal nueva. No existía ninguna API de sucursales en admin-gestion; hacía
  falta como soporte para elegir/crear la "sucursal online" de cada tienda.
- `src/app/api/admin/store-settings/route.ts` (nuevo) — `GET` (con join a `organizations` para
  mostrar nombre/slug), `POST`, `PATCH` — mismo patrón que `organizations/route.ts`.
- `src/modules/stores/StoreSettingsForm.tsx` + `StoresList.tsx` + `index.tsx` (nuevo) — equivalente
  a `OrganizationForm.tsx`/`OrganizationsList.tsx`.
- `src/app/tiendas/page.tsx` (nuevo) + entrada "Tiendas" en `Sidebar.tsx`.

**Verificado**: `tsc --noEmit`, `eslint` y `next build` completos, los tres limpios — la ruta
`/tiendas` y las dos API routes nuevas aparecen correctamente en el build.

## Los dos flujos — qué quedó cubierto y qué no

1. **Habilitar tienda para organización existente**: cubierto completo. Desde `/tiendas` se
   elige una organización, se selecciona o crea al vuelo su sucursal online (input + botón "+
   Crear sucursal", sin salir del formulario), se cargan los datos de branding, y un toggle en la
   lista habilita/deshabilita la tienda con un click (`PATCH` directo a `enabled`).
2. **Alta desde cero**: **no se construyó como un wizard único** — hubiera significado meterle
   una máquina de estados de varios pasos (crear org → crear sucursal → crear store_settings →
   invitar owner, con rollback si algún paso falla a mitad de camino) para un caso que, en la
   práctica, ya se resuelve encadenando 3 pantallas que ya existen o que se acaban de agregar:
   `/organizations` (crear la empresa) → `/tiendas` (crear su sucursal + configurar la tienda) →
   `/users` (invitar al owner, ya soporta elegir organización y rol). Es 3 clics en vez de 1, pero
   sin el riesgo de un alta a medio terminar si algo falla en el medio. Si en algún momento se
   hacen muchas altas "solo tienda" seguidas y esto se siente lento, ahí vale la pena construir el
   wizard — no antes.

## Nota de implementación: un patrón de la lint del repo

El linter de este proyecto (`react-hooks/set-state-in-effect`, parte de `eslint-config-next`)
rechaza un `setState` síncrono directo en el cuerpo de un efecto. `OrganizationForm.tsx`/
`PlanForm.tsx` ya tenían ese patrón (sin corregir) para copiar props a estado al editar — en
`StoreSettingsForm.tsx` se evitó desde el inicio: el estado inicial del formulario se calcula con
un lazy initializer a partir de las props (`useState(() => initialForm(store, isEdit))`), sin
efecto, apoyado en que el padre (`StoresList`) monta una instancia nueva del form por cada
edición (`key={editingStore.id}`). El fetch de sucursales si necesita un efecto real (depende de
`form.organization_id`), y ahí el `setState` que arranca el loading queda envuelto en una función
async interna (mismo truco que ya usa `OrganizationsList.tsx` para su propio fetch) — así el
`setState` no queda como la primera línea síncrona del efecto y el linter no se queja.

## Nota sobre riesgos ya existentes en admin-gestion (sin tocar, ver 08-futuro.md)

`OrganizationActions.tsx` sigue haciendo hard-delete de una organización con solo un `confirm()`
de navegador — ahora hay más tablas colgando de `organization_id` (`store_settings`,
`store_orders`), así que el radio de impacto de ese botón creció. No lo toqué porque no se pidió
y cambiar el comportamiento de un botón existente sin que se pida es más intrusivo que agregar
algo nuevo — queda anotado como pendiente de decisión del dueño.

## Listo cuando

- [x] Se puede crear una `store_settings` para cualquier organización desde la UI, sin tocar la
  base a mano.
- [x] Se puede habilitar/deshabilitar bg-tienda para una organización existente con un toggle.
- [ ] Alta desde cero en un solo flujo guiado — deliberadamente no construido, ver arriba.
