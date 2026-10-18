'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Eye, EyeOff, Star, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/products'
import { createProduct, updateProduct } from '@/app/admin/actions'
import { compressImage } from '@/lib/compress-image'
import { formatPrice } from '@/lib/format'
import { ErrorText, Field, Toggle } from '@/components/admin/ui'

type Item = { id: string; name: string }

type Props = {
  product?: Product
  // Para "Duplicar": arranca un producto nuevo con los datos de otro.
  copyFrom?: Product
  categories: Item[]
  sizes: Item[]
  organizationId: string
  stats?: { soldThisMonth: number; lastSale: string | null }
}

export function ProductForm({ product, copyFrom, categories, sizes: availableSizes, organizationId, stats }: Props) {
  const isEdit = !!product
  const base = product ?? copyFrom
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  // El producto trae el nombre de la categoría, no el id: se busca por nombre para que editar no
  // la cambie sola a la primera de la lista.
  const initialCategory = categories.find((c) => c.name === base?.category)?.id ?? categories[0]?.id ?? ''

  const [name, setName] = useState(copyFrom && !product ? `${copyFrom.name} (copia)` : base?.name ?? '')
  const [categoryId, setCategoryId] = useState(initialCategory)
  const [description, setDescription] = useState(base?.description ?? '')
  const [images, setImages] = useState<string[]>(base?.images ?? [])
  const [sizes, setSizes] = useState<string[]>(base?.sizes ?? [])
  const [active, setActive] = useState(base?.active ?? true)
  const [featured, setFeatured] = useState(base?.featured ?? false)
  const [price, setPrice] = useState(base?.price?.toString() ?? '')
  const [cost, setCost] = useState(base?.cost?.toString() ?? '')
  const [stock, setStock] = useState(base?.stock?.toString() ?? '')
  const [weightGrams, setWeightGrams] = useState(base?.weightGrams?.toString() ?? '')
  const [lengthCm, setLengthCm] = useState(base?.lengthCm?.toString() ?? '')
  const [widthCm, setWidthCm] = useState(base?.widthCm?.toString() ?? '')
  const [heightCm, setHeightCm] = useState(base?.heightCm?.toString() ?? '')
  const [showDims, setShowDims] = useState(!!(base?.weightGrams || base?.lengthCm))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(!!copyFrom && !product)

  // Cualquier cambio de un campo marca el formulario como "con cambios sin guardar".
  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setDirty(true)
    }
  }

  const margin = useMemo(() => {
    const p = Number(price)
    const c = Number(cost)
    if (!p || !c) return null
    return { amount: p - c, pct: Math.round(((p - c) / p) * 100) }
  }, [price, cost])

  function toggleSize(sizeName: string) {
    setSizes((prev) => (prev.includes(sizeName) ? prev.filter((s) => s !== sizeName) : [...prev, sizeName]))
    setDirty(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError('')

    const urls: string[] = []

    for (const original of files) {
      const file = await compressImage(original, { maxSize: 1400 })
      const ext = file.name.split('.').pop()
      const filename = `${organizationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage.from('store-product-images').upload(filename, file)

      if (uploadError) {
        setError(`Error subiendo imagen: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('store-product-images').getPublicUrl(filename)
      urls.push(data.publicUrl)
    }

    setImages((prev) => [...prev, ...urls])
    setDirty(true)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
    setDirty(true)
  }

  function makeMain(url: string) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)])
    setDirty(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const data = {
        name,
        categoryId,
        description,
        images,
        sizes,
        active,
        featured,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        stock: Number(stock) || 0,
        weightGrams: weightGrams.trim() === '' ? null : Number(weightGrams),
        lengthCm: lengthCm.trim() === '' ? null : Number(lengthCm),
        widthCm: widthCm.trim() === '' ? null : Number(widthCm),
        heightCm: heightCm.trim() === '' ? null : Number(heightCm),
      }
      if (isEdit && product?.productBranchId) {
        await updateProduct(product.id, product.productBranchId, data)
      } else {
        await createProduct(data)
      }
      router.push('/admin/productos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando producto')
      setSaving(false)
    }
  }

  const visibilityCard = (
    <div className="adm-card adm-sec">
      <div className="flex items-center gap-3">
        {active ? (
          <Eye className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--adm-ok)' }} />
        ) : (
          <EyeOff className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--adm-soft)' }} />
        )}
        <div className="min-w-0 flex-1">
          <b className="block font-semibold">Visible en la tienda</b>
          <span className="text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
            {active
              ? Number(stock) > 0 || stock === ''
                ? 'Los clientes lo pueden ver y comprar.'
                : 'Activo, pero sin stock no aparece en la tienda.'
              : 'Oculto: los clientes no lo ven.'}
          </span>
        </div>
        <Toggle checked={active} onChange={edit(setActive)} label="Visible en la tienda" />
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 items-start gap-3 md:gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3 md:gap-4">
          <div className="lg:hidden">{visibilityCard}</div>

          {/* Fotos */}
          <div className="adm-card adm-sec">
            <h3 className="adm-h3">Fotos</h3>
            <p className="adm-hint mt-0.5">La primera es la que se ve en la tienda. Tocá una foto para hacerla principal.</p>
            <div className="mt-3.5 grid grid-cols-4 gap-2 md:grid-cols-5 md:gap-2.5">
              {images.map((url, i) => (
                <div key={url} className="group relative aspect-square">
                  <button
                    type="button"
                    onClick={() => makeMain(url)}
                    className="h-full w-full overflow-hidden rounded-xl"
                    style={{ border: '1px solid var(--adm-line)', backgroundColor: '#f5f5f3' }}
                    aria-label={i === 0 ? 'Foto principal' : 'Hacer principal'}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                  {i === 0 && (
                    <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-white px-1.5 py-0.5 text-[10.5px] font-semibold">
                      Principal
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 shadow"
                    aria-label="Quitar foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label
                htmlFor="image-upload"
                className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[12px]"
                style={{ border: '1.5px dashed #d4d4d0', color: 'var(--adm-muted)' }}
              >
                <Upload className="h-5 w-5" />
                {uploading ? 'Subiendo…' : 'Subir'}
              </label>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="image-upload" />
            </div>
          </div>

          {/* Información */}
          <div className="adm-card adm-sec">
            <h3 className="adm-h3">Información</h3>
            <Field label="Nombre" className="mt-3.5">
              <input
                type="text"
                value={name}
                onChange={(e) => edit(setName)(e.target.value)}
                required
                placeholder="Ej: Remera oversize negra"
                className="adm-input"
              />
            </Field>
            <Field label="Descripción" className="mt-3.5">
              <textarea
                value={description}
                onChange={(e) => edit(setDescription)(e.target.value)}
                rows={4}
                placeholder="Contá de qué está hecho, medidas, cómo se usa…"
                className="adm-input"
              />
            </Field>
          </div>

          {/* Precio y stock */}
          <div className="adm-card adm-sec">
            <h3 className="adm-h3">Precio y stock</h3>
            <div className="mt-3.5 grid grid-cols-3 gap-2 md:gap-3">
              <Field label="Precio">
                <MoneyInput value={price} onChange={edit(setPrice)} placeholder="0" />
              </Field>
              <Field label={<>Costo <span className="font-normal" style={{ color: 'var(--adm-soft)' }}>(opc.)</span></>}>
                <MoneyInput value={cost} onChange={edit(setCost)} placeholder="0" />
              </Field>
              <Field label="Stock">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={stock}
                  onChange={(e) => edit(setStock)(e.target.value)}
                  placeholder="0"
                  className="adm-input"
                />
              </Field>
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-[10px] px-3 py-2.5 text-[13px]" style={{ backgroundColor: 'var(--adm-bg)' }}>
              <span style={{ color: 'var(--adm-muted)' }}>Ganancia por unidad</span>
              {margin ? (
                <b style={{ color: margin.amount >= 0 ? 'var(--adm-ok)' : 'var(--adm-bad)' }}>
                  {formatPrice(margin.amount)} · {margin.pct}%
                </b>
              ) : (
                <span style={{ color: 'var(--adm-soft)' }}>Cargá precio y costo</span>
              )}
            </div>
            <p className="mt-2 text-[12px]" style={{ color: 'var(--adm-soft)' }}>
              El costo no lo ve el cliente; sirve para calcular tu ganancia.
            </p>
          </div>

          {/* Tamaños: se eligen de la lista de la organización (/admin/tamanos), no texto libre —
              así el mismo tamaño se llama siempre igual y el filtro de la tienda funciona. */}
          <div className="adm-card adm-sec">
            <h3 className="adm-h3">Tamaños</h3>
            <p className="adm-hint mt-0.5">Marcá los que vendés. El cliente elige uno al comprar.</p>
            {availableSizes.length === 0 ? (
              <p className="mt-3 text-[13px]" style={{ color: 'var(--adm-muted)' }}>
                Todavía no creaste tamaños.{' '}
                <Link href="/admin/tamanos" className="font-medium underline" style={{ color: 'var(--adm-ink)' }}>
                  Crealos acá
                </Link>
                .
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const on = sizes.includes(size.name)
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => toggleSize(size.name)}
                      className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px]"
                      style={{
                        border: `1px solid ${on ? 'var(--adm-ink)' : 'var(--adm-line)'}`,
                        backgroundColor: on ? '#fafaf8' : '#fff',
                      }}
                    >
                      <span
                        className="grid h-4 w-4 place-items-center rounded-[5px]"
                        style={{ border: `1.5px solid ${on ? 'var(--adm-ink)' : '#cfcfcc'}`, backgroundColor: on ? 'var(--adm-ink)' : '#fff' }}
                      >
                        {on && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      {size.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Peso y dimensiones: opcionales — solo hacen falta para cotizar envío calculado. Si se
              dejan vacíos, shipping-quote usa un default de la tienda o de la plataforma en vez de
              bloquear la cotización. */}
          <div className="adm-card">
            <button type="button" onClick={() => setShowDims((v) => !v)} className="adm-sec flex w-full items-center gap-3 text-left">
              <span className="flex-1">
                <b className="adm-h3 block">Peso y medidas</b>
                <span className="adm-hint">Solo si usás envío calculado por el correo</span>
              </span>
              <ChevronDown className="h-5 w-5 transition-transform" style={{ color: 'var(--adm-soft)', transform: showDims ? 'rotate(180deg)' : undefined }} />
            </button>
            {showDims && (
              <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 md:grid-cols-4 md:px-5 md:pb-5">
                <Field label="Peso (g)">
                  <input type="number" min={0} value={weightGrams} onChange={(e) => edit(setWeightGrams)(e.target.value)} placeholder="500" className="adm-input" />
                </Field>
                <Field label="Largo (cm)">
                  <input type="number" min={0} value={lengthCm} onChange={(e) => edit(setLengthCm)(e.target.value)} placeholder="20" className="adm-input" />
                </Field>
                <Field label="Ancho (cm)">
                  <input type="number" min={0} value={widthCm} onChange={(e) => edit(setWidthCm)(e.target.value)} placeholder="15" className="adm-input" />
                </Field>
                <Field label="Alto (cm)">
                  <input type="number" min={0} value={heightCm} onChange={(e) => edit(setHeightCm)(e.target.value)} placeholder="10" className="adm-input" />
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 md:gap-4">
          <div className="hidden lg:block">{visibilityCard}</div>

          <div className="adm-card adm-sec">
            <h3 className="adm-h3">Organización</h3>
            <Field label="Categoría" className="mt-3.5">
              {categories.length === 0 ? (
                <p className="text-[13px]" style={{ color: 'var(--adm-muted)' }}>
                  No hay categorías.{' '}
                  <Link href="/admin/categorias" className="font-medium underline" style={{ color: 'var(--adm-ink)' }}>
                    Creá una acá
                  </Link>
                  .
                </p>
              ) : (
                <select value={categoryId} onChange={(e) => edit(setCategoryId)(e.target.value)} required className="adm-input">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div className="mt-4 flex items-center gap-3">
              <Star className="h-[18px] w-[18px]" style={{ color: featured ? 'var(--adm-accent)' : 'var(--adm-soft)' }} />
              <div className="flex-1">
                <b className="block text-[13px] font-medium">Destacado</b>
                <span className="text-[12.5px]" style={{ color: 'var(--adm-muted)' }}>
                  Aparece en “Más vendidos” de la tienda
                </span>
              </div>
              <Toggle checked={featured} onChange={edit(setFeatured)} label="Destacado" />
            </div>
          </div>

          {stats && (
            <div className="adm-card adm-sec">
              <h3 className="adm-h3">Resumen</h3>
              <div className="mt-2.5 flex justify-between">
                <span style={{ color: 'var(--adm-muted)' }}>Vendidos este mes (tienda)</span>
                <b>{stats.soldThisMonth}</b>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span style={{ color: 'var(--adm-muted)' }}>Última venta online</span>
                <b>{stats.lastSale ?? '—'}</b>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de guardar: fija abajo, siempre a mano. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 px-4 pt-3 backdrop-blur md:sticky md:-mx-7 md:mt-4 md:px-7 md:pb-3"
        style={{
          backgroundColor: 'rgba(255,255,255,.94)',
          borderTop: '1px solid var(--adm-line)',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="hidden min-w-0 flex-1 items-center gap-2 text-[13px] md:flex" style={{ color: 'var(--adm-muted)' }}>
          {error ? (
            <ErrorText>{error}</ErrorText>
          ) : dirty ? (
            <>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--adm-warn)' }} />
              Tenés cambios sin guardar
            </>
          ) : null}
        </div>
        {error && (
          <div className="absolute inset-x-4 -top-9 rounded-lg bg-white px-3 py-2 shadow md:hidden">
            <ErrorText>{error}</ErrorText>
          </div>
        )}
        <button type="button" onClick={() => router.back()} className="adm-btn flex-1 !py-3 md:flex-none md:!py-[9px]">
          {dirty ? 'Descartar' : 'Volver'}
        </button>
        <button type="submit" disabled={saving || uploading} className="adm-btn adm-btn-pri flex-1 !py-3 md:flex-none md:!py-[9px]">
          <Check />
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: 'var(--adm-soft)' }}>
        $
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="adm-input !pl-6"
      />
    </div>
  )
}
