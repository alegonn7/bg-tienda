'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStoreBranding } from '@/app/admin/actions'
import { FEATURE_ICONS, FEATURE_ICON_KEYS } from '@/lib/feature-icons'

type Feature = { title: string; text: string; icon?: string }

type StoreSettings = {
  store_name: string | null
  hero_title: string | null
  hero_subtitle: string | null
  accent_color: string | null
  whatsapp_number: string | null
  instagram_url: string | null
  facebook_url: string | null
  show_prices: boolean
  features: Feature[] | null
}

const EMPTY_FEATURE: Feature = { title: '', text: '', icon: 'star' }
const FEATURE_SLOTS = 3

function initialFeatures(features: Feature[] | null): Feature[] {
  const base: Feature[] = (Array.isArray(features) ? features : []).map((f) => ({
    ...f,
    icon: f.icon ?? 'star',
  }))
  const padded: Feature[] = [...base]
  while (padded.length < FEATURE_SLOTS) padded.push({ ...EMPTY_FEATURE })
  return padded.slice(0, FEATURE_SLOTS)
}

const inputStyle = {
  border: '1px solid #e5e5e5',
  backgroundColor: '#fff',
  color: '#111111',
} as const

const labelStyle = { letterSpacing: '0.06em', color: '#6b6b6b' } as const

export function StoreBrandingForm({ store, slug }: { store: StoreSettings; slug: string }) {
  const router = useRouter()
  const [storeName, setStoreName] = useState(store.store_name ?? '')
  const [heroTitle, setHeroTitle] = useState(store.hero_title ?? '')
  const [heroSubtitle, setHeroSubtitle] = useState(store.hero_subtitle ?? '')
  const [accentColor, setAccentColor] = useState(store.accent_color ?? '')
  const [whatsappNumber, setWhatsappNumber] = useState(store.whatsapp_number ?? '')
  const [instagramUrl, setInstagramUrl] = useState(store.instagram_url ?? '')
  const [facebookUrl, setFacebookUrl] = useState(store.facebook_url ?? '')
  const [showPrices, setShowPrices] = useState(store.show_prices)
  const [features, setFeatures] = useState<Feature[]>(() => initialFeatures(store.features))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function setFeature(index: number, field: keyof Feature, value: string) {
    setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await updateStoreBranding({
        storeName,
        heroTitle,
        heroSubtitle,
        accentColor,
        whatsappNumber,
        instagramUrl,
        facebookUrl,
        showPrices,
        features,
      })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          URL de tu tienda
        </label>
        <p className="mt-2 text-[14px]" style={{ color: '#111111' }}>
          bgtienda.com/{slug}
        </p>
        <p className="mt-1 text-[12px]" style={{ color: '#6b6b6b' }}>
          Para cambiar esto, escribinos — cambiarlo rompe los links que ya compartiste.
        </p>
      </div>

      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Nombre de tu tienda
        </label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="Ej: Mi Negocio"
          className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Título del inicio
        </label>
        <input
          type="text"
          value={heroTitle}
          onChange={(e) => setHeroTitle(e.target.value)}
          placeholder="Ej: Bienvenido a Mi Negocio"
          className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Subtítulo del inicio
        </label>
        <textarea
          value={heroSubtitle}
          onChange={(e) => setHeroSubtitle(e.target.value)}
          rows={2}
          placeholder="Una frase corta debajo del título"
          className="mt-2 w-full resize-none px-4 py-3 text-[15px] outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-[12px] uppercase" style={labelStyle}>
          Franja de destacados (los 3 puntos debajo del inicio)
        </label>
        <div className="mt-2 flex flex-col gap-4">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col gap-2 p-3" style={{ border: '1px solid #f0f0ee' }}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={f.title}
                  onChange={(e) => setFeature(i, 'title', e.target.value)}
                  placeholder={`Título ${i + 1}`}
                  className="px-4 py-2.5 text-[14px] outline-none"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={f.text}
                  onChange={(e) => setFeature(i, 'text', e.target.value)}
                  placeholder={`Descripción ${i + 1}`}
                  className="px-4 py-2.5 text-[14px] outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FEATURE_ICON_KEYS.map((key) => {
                  const Icon = FEATURE_ICONS[key]
                  const isSelected = (f.icon ?? 'star') === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFeature(i, 'icon', key)}
                      className="flex h-8 w-8 items-center justify-center"
                      style={{
                        border: `1px solid ${isSelected ? '#111111' : '#e5e5e5'}`,
                        backgroundColor: isSelected ? '#111111' : '#fff',
                        color: isSelected ? '#fff' : '#6b6b6b',
                      }}
                      title={key}
                    >
                      <Icon size={15} strokeWidth={1.5} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px]" style={{ color: '#6b6b6b' }}>
          Dejá un título vacío para no mostrar ese punto.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Color de marca
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="color"
              value={accentColor || '#d81b8a'}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-11 w-14 cursor-pointer"
              style={{ border: '1px solid #e5e5e5', padding: 2 }}
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#d81b8a"
              className="flex-1 px-4 py-3 text-[15px] outline-none"
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            WhatsApp
          </label>
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="Ej: 5492241579045"
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Instagram (link)
          </label>
          <input
            type="text"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/..."
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase" style={labelStyle}>
            Facebook (link)
          </label>
          <input
            type="text"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/..."
            className="mt-2 w-full px-4 py-3 text-[15px] outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="show_prices"
          checked={showPrices}
          onChange={(e) => setShowPrices(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="show_prices" className="text-[14px]" style={{ color: '#111111' }}>
          Mostrar precios públicamente (si no, la tienda muestra &quot;a confirmar&quot;)
        </label>
      </div>

      {error && (
        <p className="text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-[13px]" style={{ color: '#16a34a' }}>
          Guardado.
        </p>
      )}

      <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid #e5e5e5' }}>
        <button
          type="submit"
          disabled={saving}
          className="pc-btn px-6 py-3 text-[14px] disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios →'}
        </button>
      </div>
    </form>
  )
}
