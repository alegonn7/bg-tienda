# Fase 05 — Auth/RLS real + branding dinámico ✅ hecho (2026-08-19)

## Auth/RLS

Ya estaba resuelto por construcción de las Fases 01 y 04: las policies RLS de las tablas nuevas
siguen el patrón `organization_id = (select ... from users where auth_id = auth.uid())` desde
que se escribieron, y `getCurrentOrgForAdmin()` (Fase 04) ya deriva la organización siempre de la
sesión, nunca de la URL. No hubo nada pendiente de cerrar acá aparte de la matriz rol→permisos,
que sigue como pregunta abierta menor (ver `00-contexto-y-decisiones.md`) — RLS de bg-gestion ya
restringe escritura de `products`/`products_branch`/`categories` a owner/admin/manager, así que
un `employee` que intente escribir recibe un error claro de Postgres en vez de lograrlo; falta
solamente ocultar los botones que no le sirven, que es UX y no seguridad.

## Branding dinámico

Reemplazado todo el hardcodeo listado en el plan (verificado con grep antes y después):

| Qué | Antes | Ahora |
|---|---|---|
| Nombre de marca | `"PinsCrew"` literal en 9 archivos | `store.storeName ?? store.organizationName`, o el logo (`store.logoUrl`) si está cargado |
| WhatsApp | `542241579045` hardcodeado en 3 archivos | `store.whatsappNumber` — si una tienda no lo cargó, el botón flotante de WhatsApp directamente no se muestra (antes era imposible que faltara) |
| Color de marca | `#d81b8a` como literal en 4 archivos + 3 reglas CSS | `var(--color-accent)`, sobreescrito por tienda en `app/[slug]/layout.tsx` vía `style` inline; `app/globals.css` define el fallback si una tienda no cargó `accent_color` |
| Redes sociales | Instagram/Facebook de PinsCrew hardcodeados en el footer | `store.instagramUrl`/`store.facebookUrl` — los íconos no se muestran si la tienda no los cargó |

**El color se resolvió sin tocar la mayoría de los componentes**: en vez de leer
`store.accentColor` en cada lugar, se corrigió el bug real de `globals.css` (`--color-accent` se
definía dos veces en el mismo bloque `@theme inline` — la del tema de shadcn pisaba a la de
marca; confirmado que ningún componente de shadcn (`components/ui/button.tsx`) ni ninguna clase
`bg-accent`/`accent-foreground` se usa en el proyecto, así que borrar el duplicado no rompe nada),
y se reemplazó el literal `#d81b8a` por `var(--color-accent)` en los 4 archivos y 3 reglas CSS que
lo usaban. La variable se sobreescribe una sola vez por tienda en `app/[slug]/layout.tsx`, y
cascada normal de CSS custom properties hace el resto — sin necesidad de leer `accentColor` en
cada componente.

**Para nombre/WhatsApp/logo/redes sí hizo falta pasar datos reales** (a diferencia del color, son
texto/URLs, no se resuelven solos vía CSS): `SiteShell` pasa a recibir el objeto `store` completo
(antes solo `slug`) y lo reparte a `Navbar`, `Footer`, `WhatsAppButton`, `CartDrawer`. Los que no
son hijos directos de `SiteShell` (`ProductPurchase`, en la página de detalle) lo reciben como
prop desde la page, que ya lo tenía resuelto.

## Bug encontrado de paso: el carrito no estaba scopeado por tienda

`CartProvider` vivía en el layout raíz (`app/layout.tsx`), compartido por **todas** las tiendas —
si alguien navegaba de una tienda a otra en la misma pestaña, el carrito arrastraba productos de
la tienda anterior. Se movió `CartProvider` a `app/[slug]/layout.tsx` con `key={slug}`, así React
lo remonta limpio cada vez que cambia de tienda. No estaba en el plan original de esta fase, pero
apareció naturalmente al mover la lógica de WhatsApp (que ya depende de "qué tienda es esta") al
mismo lugar.

## Deliberadamente sin tocar

- Todo el **admin** (`/admin/*`) sigue con el color `#d81b8a` hardcodeado — es la paleta del
  panel interno, no de la tienda pública; no hay pedido de themear la herramienta de gestión por
  tienda, y hacerlo hubiera sido alcance no pedido.
- `/admin/login`: es una página **compartida por todas las tiendas** (nadie sabe todavía a qué
  tienda pertenece quien la visita, recién se sabe después de loguearse) — no puede mostrar marca
  de una tienda puntual. Se dejó neutra ("bg-tienda") en vez de "PinsCrew", y el email de ejemplo
  hardcodeado (`admin@pinscrew.com`) se sacó del todo.

## Verificación

- `tsc --noEmit` y `next build`: limpios.
- Smoke test en runtime: `/` → 404, slug inexistente → 404, `/admin/login` → 200 — sin
  regresiones respecto a la Fase 04.
- Grep final de `PinsCrew|542241579045|#d81b8a` en todo el repo: cero resultados fuera de
  `/admin/*` (deliberado) y el fallback default de `globals.css` (también deliberado).
- **No verificado visualmente todavía** (no hay ninguna tienda real con `accent_color`/
  `whatsapp_number` cargados para comparar contra el diseño original) — se confirma en la
  Fase 07, junto con el resto del flujo end-to-end.
