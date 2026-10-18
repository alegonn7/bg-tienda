'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Eye, ImagePlus, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { deleteHeroImage, refreshStorefrontHero, reorderHeroImages, updateHeroText } from '@/app/admin/actions'
import { compressImage } from '@/lib/compress-image'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ErrorText, Field, PageHeader, SuccessText } from '@/components/admin/ui'

type HeroImage = { id: string; url: string; position: number }

type Props = {
  images: HeroImage[]
  organizationId: string
  storeName: string
  heroTitle: string | null
  heroSubtitle: string | null
}

export function HeroManager({ images: initial, organizationId, storeName, heroTitle, heroSubtitle }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [slide, setSlide] = useState(0)
  const [title, setTitle] = useState(heroTitle ?? '')
  const [subtitle, setSubtitle] = useState(heroSubtitle ?? '')
  const [savingText, setSavingText] = useState(false)
  const [textMsg, setTextMsg] = useState('')

  // El server manda la lista nueva después de cada cambio (subir, borrar, reordenar).
  useEffect(() => setImages(initial), [initial])

  // Igual que en la tienda: pasa sola cada 5 segundos.
  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setSlide((s) => (s + 1) % images.length), 5000)
    return () => clearInterval(t)
  }, [images.length])
  const current = images.length ? images[slide % images.length] : null

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const supabase = createClient()
    setUploading(true)
    setError('')
    let position = images.reduce((m, i) => Math.max(m, i.position + 1), 0)

    for (const original of files) {
      const file = await compressImage(original, { maxSize: 1920 })
      const ext = file.name.split('.').pop()
      const filename = `${organizationId}/hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('store-product-images').upload(filename, file)
      if (uploadError) {
        setError(`No se pudo subir la imagen: ${uploadError.message}`)
        break
      }
      const { data } = supabase.storage.from('store-product-images').getPublicUrl(filename)
      const { error: dbError } = await supabase
        .from('hero_images')
        .insert({ url: data.publicUrl, position: position++, organization_id: organizationId })
      if (dbError) {
        setError(`No se pudo guardar la imagen: ${dbError.message}`)
        break
      }
    }

    await refreshStorefrontHero()
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(null)
    setError('')
    try {
      await deleteHeroImage(id)
      setSlide(0)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.')
    }
  }

  async function move(index: number, delta: number) {
    const to = index + delta
    if (to < 0 || to >= images.length) return
    const next = [...images]
    ;[next[index], next[to]] = [next[to], next[index]]
    setImages(next)
    setError('')
    try {
      await reorderHeroImages(next.map((i) => i.id))
      router.refresh()
    } catch (err) {
      setImages(images)
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el orden.')
    }
  }

  async function saveText(e: React.FormEvent) {
    e.preventDefault()
    setSavingText(true)
    setTextMsg('')
    setError('')
    try {
      await updateHeroText(title, subtitle)
      setTextMsg('Guardado')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSavingText(false)
    }
  }

  const textChanged = title !== (heroTitle ?? '') || subtitle !== (heroSubtitle ?? '')

  return (
    <>
      <ConfirmDialog
        open={!!deletingId}
        title="Eliminar imagen"
        message="¿Sacar esta imagen del banner?"
        confirmText="Eliminar"
        danger
        onConfirm={() => deletingId && handleDelete(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" id="hero-upload" />

      <PageHeader
        sub
        title="Banner de portada"
        description="Las imágenes grandes que se ven arriba de todo en tu tienda. Pasan solas cada 5 segundos."
        actions={
          <label htmlFor="hero-upload" className={`adm-btn adm-btn-pri hidden cursor-pointer md:inline-flex ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
            <Upload />
            {uploading ? 'Subiendo…' : 'Subir imagen'}
          </label>
        }
      />

      <div className="grid gap-4">
        {/* Vista previa: imita la portada real (foto oscurecida con el texto a la izquierda). */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--adm-muted)' }}>
            <Eye className="h-3.5 w-3.5" />
            Vista previa
          </p>
          <div
            className="relative flex aspect-[4/3] items-end overflow-hidden rounded-[14px] sm:aspect-[16/9] md:aspect-[16/6] md:items-center"
            style={{ background: 'linear-gradient(135deg, #1d1a22 0%, #2a1a2a 45%, var(--adm-accent) 130%)', border: '1px solid var(--adm-line)' }}
          >
            {images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                style={{ opacity: current?.id === img.id ? 1 : 0 }}
              />
            ))}
            {current && <div className="absolute inset-0" style={{ background: 'linear-gradient(60deg, rgba(15,10,14,.75) 0%, rgba(15,10,14,.35) 50%, rgba(15,10,14,0) 85%)' }} />}
            <div className="relative max-w-[520px] px-5 pb-8 text-white md:px-10 md:pb-0">
              <p className="text-balance text-[22px] font-bold leading-[1.08] md:text-[36px]">{title.trim() || `Bienvenido a ${storeName}`}</p>
              {subtitle.trim() && <p className="mt-2 max-w-[400px] text-[13px] opacity-90 md:text-[15px]">{subtitle}</p>}
              <span className="mt-4 inline-block rounded-full px-4 py-2 text-[12px] font-semibold md:text-[13px]" style={{ backgroundColor: 'var(--adm-accent)' }}>
                Ver productos →
              </span>
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSlide(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: current?.id === img.id ? 18 : 6, backgroundColor: current?.id === img.id ? '#fff' : 'rgba(255,255,255,0.6)' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="adm-card">
            <div className="adm-card-h flex-wrap gap-y-1">
              <h3>Imágenes ({images.length})</h3>
              <span className="hidden text-[12px] sm:block" style={{ color: 'var(--adm-muted)' }}>
                Con las flechas cambiás el orden · ideal 1920×720 px
              </span>
            </div>
            <div className="p-3 md:p-4">
              <ErrorText>{error}</ErrorText>
              <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${error ? 'mt-3' : ''}`}>
                {images.map((img, i) => (
                  <div key={img.id} className="overflow-hidden rounded-[10px]" style={{ border: '1px solid var(--adm-line)' }}>
                    <button type="button" onClick={() => setSlide(i)} className="relative block w-full" aria-label={`Ver imagen ${i + 1} en la vista previa`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`Banner ${i + 1}`} className="aspect-video w-full object-cover" />
                      <span
                        className="absolute left-2 top-2 grid h-5 min-w-5 place-items-center rounded-[6px] px-1 text-[11px] font-semibold"
                        style={{ backgroundColor: '#fff', color: 'var(--adm-ink)' }}
                      >
                        {i + 1}
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5 px-1.5 py-1" style={{ borderTop: '1px solid var(--adm-line2)' }}>
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="adm-btn adm-btn-ghost adm-btn-sm !px-1.5" aria-label="Mover antes">
                        <ChevronLeft />
                      </button>
                      <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="adm-btn adm-btn-ghost adm-btn-sm !px-1.5" aria-label="Mover después">
                        <ChevronRight />
                      </button>
                      <button type="button" onClick={() => setDeletingId(img.id)} className="adm-btn adm-btn-ghost adm-btn-sm ml-auto !px-1.5" aria-label="Eliminar imagen">
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))}
                <label
                  htmlFor="hero-upload"
                  className={`grid min-h-[120px] cursor-pointer place-items-center rounded-[10px] text-center ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                  style={{ border: '1.5px dashed var(--adm-line)', color: 'var(--adm-muted)' }}
                >
                  <span>
                    <ImagePlus className="mx-auto h-5 w-5" />
                    <span className="mt-1 block text-[13px]">{uploading ? 'Subiendo…' : 'Agregar imagen'}</span>
                    <span className="block text-[11px]" style={{ color: 'var(--adm-soft)' }}>
                      JPG o PNG
                    </span>
                  </span>
                </label>
              </div>
              {images.length === 0 && (
                <p className="adm-hint mt-3">Sin imágenes, la portada muestra solo el texto sobre un fondo liso.</p>
              )}
            </div>
          </div>

          <form onSubmit={saveText} className="adm-card">
            <div className="adm-card-h block">
              <h3>Texto sobre el banner</h3>
              <p className="adm-hint mt-0.5 text-[12px]">Si lo dejás vacío dice &ldquo;Bienvenido a {storeName}&rdquo;.</p>
            </div>
            <div className="grid gap-3 p-4">
              <Field label="Título">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="adm-input" placeholder={`Bienvenido a ${storeName}`} maxLength={80} />
              </Field>
              <Field label="Subtítulo" hint="Opcional. Una línea corta.">
                <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="adm-input" placeholder="Ej: Envíos a todo el país" maxLength={140} />
              </Field>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingText || !textChanged} className="adm-btn adm-btn-pri">
                  {savingText ? 'Guardando…' : 'Guardar texto'}
                </button>
                {!textChanged && <SuccessText>{textMsg}</SuccessText>}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
