'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Eye, Search, ShoppingBag, Sparkles, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateStoreBranding, updateStoreFavicon, updateStoreLogo, updateStoreLogoDisplay } from '@/app/admin/actions'
import { FEATURE_ICONS, FEATURE_ICON_KEYS } from '@/lib/feature-icons'
import { formatPrice } from '@/lib/format'
import { Field, PageHeader, Toggle } from '@/components/admin/ui'

type Feature = { title: string; text: string; icon?: string }
type HeaderDisplay = 'logo' | 'name' | 'both'

export type AppearanceSettings = {
  store_name: string | null
  accent_color: string | null
  whatsapp_number: string | null
  instagram_url: string | null
  facebook_url: string | null
  show_prices: boolean
  features: Feature[] | null
  logo_height: number
  header_display: string
}

type Props = {
  store: AppearanceSettings
  slug: string
  organizationId: string
  organizationName: string
  logoUrl: string | null
  faviconUrl: string | null
  heroImage: string | null
  heroTitle: string | null
  sampleProducts: { name: string; image: string | null; price: number | null }[]
}

const SWATCHES = ['#d81b8a', '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#111111']
const FEATURE_SLOTS = 3
const MIN_HEIGHT = 16
const MAX_HEIGHT = 56
const HEX = /^#[0-9a-f]{6}$/i

function initialFeatures(features: Feature[] | null): Feature[] {
  const base = (Array.isArray(features) ? features : []).map((f) => ({ ...f, icon: f.icon ?? 'star' }))
  while (base.length < FEATURE_SLOTS) base.push({ title: '', text: '', icon: 'star' })
  return base.slice(0, FEATURE_SLOTS)
}

// Sube un archivo al bucket de la tienda pisando el anterior y devuelve la URL pública.
async function uploadReplacing(file: File, path: string) {
  const supabase = createClient()
  await supabase.storage.from('store-product-images').remove([path])
  const { error } = await supabase.storage.from('store-product-images').upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  return supabase.storage.from('store-product-images').getPublicUrl(path).data.publicUrl
}

export function AppearanceEditor(props: Props) {
  const { store, slug, organizationId, organizationName } = props
  const router = useRouter()
  const logoRef = useRef<HTMLInputElement>(null)
  const favRef = useRef<HTMLInputElement>(null)

  const [storeName, setStoreName] = useState(store.store_name ?? '')
  const [accent, setAccent] = useState(store.accent_color ?? '')
  const [whatsapp, setWhatsapp] = useState(store.whatsapp_number ?? '')
  const [instagram, setInstagram] = useState(store.instagram_url ?? '')
  const [facebook, setFacebook] = useState(store.facebook_url ?? '')
  const [showPrices, setShowPrices] = useState(store.show_prices)
  const [features, setFeatures] = useState(() => initialFeatures(store.features))
  const [display, setDisplay] = useState<HeaderDisplay>((store.header_display as HeaderDisplay) || 'logo')
  const [height, setHeight] = useState(store.logo_height || 32)
  const [logo, setLogo] = useState(props.logoUrl)
  const [favicon, setFavicon] = useState(props.faviconUrl)
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null)
  const [openIcon, setOpenIcon] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const dirty =
    storeName !== (store.store_name ?? '') ||
    accent !== (store.accent_color ?? '') ||
    whatsapp !== (store.whatsapp_number ?? '') ||
    instagram !== (store.instagram_url ?? '') ||
    facebook !== (store.facebook_url ?? '') ||
    showPrices !== store.show_prices ||
    display !== ((store.header_display as HeaderDisplay) || 'logo') ||
    height !== (store.logo_height || 32) ||
    JSON.stringify(features) !== JSON.stringify(initialFeatures(store.features))

  const accentOk = !accent || HEX.test(accent)
  const accentColor = HEX.test(accent) ? accent : '#d81b8a'

  function touch() {
    setSaved(false)
  }

  function setFeature(i: number, field: keyof Feature, value: string) {
    touch()
    setFeatures((prev) => prev.map((f, j) => (j === i ? { ...f, [field]: value } : f)))
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('logo')
    setError('')
    try {
      const url = await uploadReplacing(file, `${organizationId}/logo.${file.name.split('.').pop()}`)
      await updateStoreLogo(url)
      setLogo(`${url}?t=${Date.now()}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el logo.')
    } finally {
      setUploading(null)
      if (logoRef.current) logoRef.current.value = ''
    }
  }

  async function handleFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading('favicon')
    setError('')
    try {
      const url = await uploadReplacing(file, `${organizationId}/favicon.${file.name.split('.').pop()}`)
      await updateStoreFavicon(url)
      setFavicon(`${url}?t=${Date.now()}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el ícono.')
    } finally {
      setUploading(null)
      if (favRef.current) favRef.current.value = ''
    }
  }

  async function save() {
    if (!accentOk) {
      setError('El color tiene que tener el formato #RRGGBB, por ejemplo #d81b8a.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateStoreBranding({
        storeName,
        accentColor: accent,
        whatsappNumber: whatsapp,
        instagramUrl: instagram,
        facebookUrl: facebook,
        showPrices,
        features,
      })
      await updateStoreLogoDisplay({ logoHeight: height, headerDisplay: display })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const name = storeName.trim() || organizationName
  const preview = (
    <StorePreview
      name={name}
      logo={logo}
      display={display}
      height={height}
      accent={accentColor}
      heroImage={props.heroImage}
      heroTitle={props.heroTitle || `Bienvenido a ${name}`}
      features={features.filter((f) => f.title.trim())}
      products={props.sampleProducts}
      showPrices={showPrices}
    />
  )

  const saveLabel = saving ? 'Guardando…' : saved && !dirty ? 'Guardado' : 'Guardar cambios'

  return (
    <>
      <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={handleLogo} className="hidden" id="logo-upload" />
      <input ref={favRef} type="file" accept="image/png,image/svg+xml,image/x-icon,image/jpeg" onChange={handleFavicon} className="hidden" id="favicon-upload" />

      <PageHeader
        sub
        title="Apariencia"
        description="Cómo ven tu tienda los clientes. Los cambios se ven al instante en la vista previa."
        actions={
          <>
            <button type="button" onClick={() => setPreviewOpen(true)} className="adm-btn lg:hidden">
              <Eye />
              Vista previa
            </button>
            <button type="button" onClick={save} disabled={saving || !dirty} className="adm-btn adm-btn-pri hidden md:inline-flex">
              <Check />
              {saveLabel}
            </button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="grid min-w-0 gap-4">
          {error && (
            <div className="adm-alert" style={{ backgroundColor: 'var(--adm-bad-soft)', color: 'var(--adm-bad)' }}>
              {error}
            </div>
          )}

          <section className="adm-card">
            <div className="adm-card-h">
              <h3>Logo y nombre</h3>
            </div>
            <div className="grid gap-4 p-4">
              <div className="flex items-center gap-4">
                <div
                  className="grid h-16 w-16 flex-shrink-0 place-items-center overflow-hidden rounded-[14px]"
                  style={{ border: '1px solid var(--adm-line)', backgroundColor: '#fafaf8' }}
                >
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="Logo" className="h-12 w-12 object-contain" />
                  ) : (
                    <span className="text-[11px]" style={{ color: 'var(--adm-soft)' }}>
                      Sin logo
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <label htmlFor="logo-upload" className={`adm-btn adm-btn-sm cursor-pointer ${uploading === 'logo' ? 'pointer-events-none opacity-60' : ''}`}>
                    <Upload />
                    {uploading === 'logo' ? 'Subiendo…' : logo ? 'Cambiar logo' : 'Subir logo'}
                  </label>
                  <p className="mt-1.5 text-[12px]" style={{ color: 'var(--adm-muted)' }}>
                    PNG con fondo transparente queda mejor. Se usa también en bg-gestion.
                  </p>
                </div>
              </div>
              <Field label="Nombre de la tienda">
                <input
                  value={storeName}
                  onChange={(e) => {
                    touch()
                    setStoreName(e.target.value)
                  }}
                  placeholder={organizationName}
                  className="adm-input"
                />
              </Field>
              <Field label="En el encabezado mostrar">
                <div className="inline-flex w-full rounded-[10px] p-1 sm:w-auto" style={{ backgroundColor: '#efefec' }}>
                  {(
                    [
                      ['logo', 'Solo logo'],
                      ['name', 'Solo nombre'],
                      ['both', 'Logo y nombre'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        touch()
                        setDisplay(value)
                      }}
                      className="flex-1 whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] sm:flex-none"
                      style={
                        display === value
                          ? { backgroundColor: '#fff', color: 'var(--adm-ink)', boxShadow: '0 1px 2px rgba(0,0,0,.08)' }
                          : { color: 'var(--adm-muted)' }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              {display !== 'name' && (
                <Field label={`Tamaño del logo · ${height}px`}>
                  <input
                    type="range"
                    min={MIN_HEIGHT}
                    max={MAX_HEIGHT}
                    value={height}
                    onChange={(e) => {
                      touch()
                      setHeight(Number(e.target.value))
                    }}
                    className="w-full max-w-[320px]"
                    style={{ accentColor: 'var(--adm-ink)' }}
                  />
                </Field>
              )}
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-h block">
              <h3>Color principal</h3>
              <p className="adm-hint mt-0.5 text-[12px]">Se usa en detalles de la tienda: íconos, líneas y etiquetas.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 p-4">
              {SWATCHES.map((c) => {
                const on = accentColor.toLowerCase() === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      touch()
                      setAccent(c)
                    }}
                    aria-label={`Usar ${c}`}
                    className="h-9 w-9 rounded-full"
                    style={{ backgroundColor: c, boxShadow: on ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }}
                  />
                )
              })}
              <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full" style={{ border: '1px dashed var(--adm-line)' }} title="Elegir otro color">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => {
                    touch()
                    setAccent(e.target.value)
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className="grid h-full place-items-center text-[16px]" style={{ color: 'var(--adm-muted)' }}>
                  +
                </span>
              </label>
              <div className="relative w-[130px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: 'var(--adm-soft)' }}>
                  #
                </span>
                <input
                  value={accent.replace(/^#/, '')}
                  onChange={(e) => {
                    touch()
                    setAccent(e.target.value ? '#' + e.target.value.replace(/^#/, '') : '')
                  }}
                  placeholder="d81b8a"
                  maxLength={7}
                  className="adm-input !pl-7"
                  style={!accentOk ? { borderColor: 'var(--adm-bad)' } : undefined}
                />
              </div>
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-h block">
              <h3>Lo que te diferencia</h3>
              <p className="adm-hint mt-0.5 text-[12px]">Tres puntos que aparecen debajo del banner. Dejá el título vacío para no mostrar uno.</p>
            </div>
            <div className="grid gap-3 p-4">
              {features.map((f, i) => {
                const Icon = (f.icon && FEATURE_ICONS[f.icon]) || Sparkles
                return (
                  <div key={i} className="rounded-[12px] p-3" style={{ border: '1px solid var(--adm-line)' }}>
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setOpenIcon(openIcon === i ? null : i)}
                        className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[10px]"
                        style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
                        aria-label="Cambiar ícono"
                        title="Cambiar ícono"
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                      </button>
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                        <input value={f.title} onChange={(e) => setFeature(i, 'title', e.target.value)} placeholder={`Título ${i + 1}, ej: Envíos a todo el país`} className="adm-input" />
                        <input value={f.text} onChange={(e) => setFeature(i, 'text', e.target.value)} placeholder="Detalle, ej: Por Correo Argentino" className="adm-input" />
                      </div>
                    </div>
                    {openIcon === i && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {FEATURE_ICON_KEYS.map((key) => {
                          const I = FEATURE_ICONS[key]
                          const on = (f.icon ?? 'star') === key
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setFeature(i, 'icon', key)
                                setOpenIcon(null)
                              }}
                              className="grid h-9 w-9 place-items-center rounded-[9px]"
                              style={{
                                border: `1px solid ${on ? 'var(--adm-ink)' : 'var(--adm-line)'}`,
                                backgroundColor: on ? 'var(--adm-ink)' : '#fff',
                                color: on ? '#fff' : 'var(--adm-muted)',
                              }}
                            >
                              <I size={16} strokeWidth={1.75} />
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-h">
              <h3>Contacto y redes</h3>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Field label="WhatsApp" hint="Con código de país, ej: 5491155551234" className="sm:col-span-2">
                <input value={whatsapp} onChange={(e) => { touch(); setWhatsapp(e.target.value) }} inputMode="tel" placeholder="5491155551234" className="adm-input" />
              </Field>
              <Field label="Instagram">
                <input value={instagram} onChange={(e) => { touch(); setInstagram(e.target.value) }} placeholder="https://instagram.com/..." className="adm-input" />
              </Field>
              <Field label="Facebook">
                <input value={facebook} onChange={(e) => { touch(); setFacebook(e.target.value) }} placeholder="https://facebook.com/..." className="adm-input" />
              </Field>
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-h">
              <h3>Más opciones</h3>
            </div>
            <div className="grid gap-0">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">Mostrar precios</p>
                  <p className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>Si lo apagás, la tienda muestra &ldquo;Consultá precio&rdquo; en vez del precio.</p>
                </div>
                <Toggle checked={showPrices} onChange={(v) => { touch(); setShowPrices(v) }} label="Mostrar precios" />
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: '1px solid var(--adm-line2)' }}>
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-[10px]" style={{ border: '1px solid var(--adm-line)', backgroundColor: '#fafaf8' }}>
                  {favicon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={favicon} alt="Ícono" className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="text-[10px]" style={{ color: 'var(--adm-soft)' }}>—</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">Ícono de la pestaña</p>
                  <p className="text-[12px]" style={{ color: 'var(--adm-muted)' }}>El que se ve en la pestaña del navegador. Cuadrado, ideal 512×512.</p>
                </div>
                <label htmlFor="favicon-upload" className={`adm-btn adm-btn-sm cursor-pointer ${uploading === 'favicon' ? 'pointer-events-none opacity-60' : ''}`}>
                  {uploading === 'favicon' ? 'Subiendo…' : 'Cambiar'}
                </label>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: '1px solid var(--adm-line2)' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">Dirección de tu tienda</p>
                  <p className="truncate text-[13px]" style={{ color: 'var(--adm-muted)' }}>bgtienda.com/{slug}</p>
                  <p className="text-[12px]" style={{ color: 'var(--adm-soft)' }}>Para cambiarla escribinos: cambiarla rompe los links que ya compartiste.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="sticky top-[88px] hidden lg:block">{preview}</aside>
      </div>

      {/* Celular: barra fija para guardar, encima de la barra de pestañas no (esta pantalla no la tiene). */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 p-3 md:hidden"
        style={{ backgroundColor: '#fff', borderTop: '1px solid var(--adm-line)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button type="button" onClick={save} disabled={saving || !dirty} className="adm-btn adm-btn-pri w-full !py-3">
          <Check />
          {saveLabel}
        </button>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto p-4 lg:hidden" style={{ backgroundColor: 'rgba(22,22,26,.6)' }} onClick={() => setPreviewOpen(false)}>
          <div className="mx-auto max-w-[360px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => setPreviewOpen(false)} className="adm-btn adm-btn-sm">
                <X />
                Cerrar
              </button>
            </div>
            {preview}
          </div>
        </div>
      )}
    </>
  )
}

function StorePreview({
  name,
  logo,
  display,
  height,
  accent,
  heroImage,
  heroTitle,
  features,
  products,
  showPrices,
}: {
  name: string
  logo: string | null
  display: HeaderDisplay
  height: number
  accent: string
  heroImage: string | null
  heroTitle: string
  features: Feature[]
  products: Props['sampleProducts']
  showPrices: boolean
}) {
  const showLogo = display !== 'name' && logo
  const showName = display !== 'logo' || !logo
  return (
    <div className="rounded-[34px] p-2.5" style={{ backgroundColor: '#16161a' }}>
      <div className="h-[600px] overflow-hidden rounded-[26px] bg-white">
        <div className="flex h-12 items-center gap-2 px-4" style={{ borderBottom: '1px solid #eee' }}>
          {showLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" style={{ height: Math.round(height * 0.75), width: 'auto', objectFit: 'contain' }} />
          )}
          {showName && <span className="truncate text-[13px] font-medium">{name}</span>}
          <Search className="ml-auto h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          <ShoppingBag className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
        </div>
        <div className="relative grid h-[230px] place-items-center overflow-hidden" style={{ backgroundColor: '#f3f3f1' }}>
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="relative mx-5 px-5 py-5 text-center" style={heroImage ? { backgroundColor: 'rgba(255,255,255,.75)', backdropFilter: 'blur(6px)' } : {}}>
            <span className="mx-auto mb-3 block h-px w-6" style={{ backgroundColor: accent }} />
            <p className="text-balance text-[19px] font-medium leading-[1.15]">{heroTitle}</p>
            <span className="mt-3 inline-block px-3 py-1.5 text-[10px]" style={{ border: '1px solid #111', backgroundColor: '#fff' }}>
              Ver productos →
            </span>
          </div>
        </div>
        {features.length > 0 && (
          <div className="flex justify-around gap-1 px-2 py-3" style={{ borderBottom: '1px solid #eee' }}>
            {features.map((f, i) => {
              const Icon = (f.icon && FEATURE_ICONS[f.icon]) || Sparkles
              return (
                <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
                  <Icon size={15} strokeWidth={1.5} style={{ color: accent }} />
                  <span className="line-clamp-2 text-[9px] leading-tight">{f.title}</span>
                </div>
              )
            })}
          </div>
        )}
        <p className="px-4 pb-2 pt-3 text-[12px] font-medium">Productos</p>
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {products.slice(0, 4).map((p, i) => (
            <div key={i} className="min-w-0">
              <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#f3f3f1' }}>
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <p className="mt-1 truncate text-[10px]">{p.name}</p>
              <p className="text-[10px] font-medium">{showPrices ? (p.price != null ? formatPrice(p.price) : '') : 'Consultá precio'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
