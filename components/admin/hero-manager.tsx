'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteHeroImage } from '@/app/admin/actions'

type HeroImage = { id: string; url: string; position: number }

export function HeroManager({ images, organizationId }: { images: HeroImage[]; organizationId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError('')

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const filename = `${organizationId}/hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('store-product-images')
        .upload(filename, file)

      if (uploadError) {
        setError(`Error subiendo imagen: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('store-product-images').getPublicUrl(filename)

      const { error: dbError } = await supabase.from('hero_images').insert({
        url: data.publicUrl,
        position: images.length,
        organization_id: organizationId,
      })

      if (dbError) {
        setError(`Error guardando imagen: ${dbError.message}`)
        setUploading(false)
        return
      }
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta imagen del banner?')) return
    await deleteHeroImage(id)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
          id="hero-upload"
        />
        <label
          htmlFor="hero-upload"
          className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 text-[13px]"
          style={{
            border: '1px solid #111111',
            color: uploading ? '#6b6b6b' : '#111111',
            backgroundColor: '#fff',
          }}
        >
          {uploading ? 'Subiendo...' : '+ Agregar imagen'}
        </label>
        <p className="mt-2 text-[12px]" style={{ color: '#6b6b6b' }}>
          Las imágenes van rotando cada 5 segundos. Si subís una sola queda fija.
        </p>
      </div>

      {error && (
        <p className="mb-4 text-[13px]" style={{ color: '#d81b8a' }}>
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <div
          className="py-16 text-center text-[14px]"
          style={{ border: '1px solid #e5e5e5', color: '#6b6b6b' }}
        >
          No hay imágenes de banner todavía.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={img.id} className="relative group">
              {i === 0 && (
                <span
                  className="absolute left-2 top-2 z-10 px-2 py-0.5 text-[10px] uppercase"
                  style={{ backgroundColor: '#111111', color: '#fff', letterSpacing: '0.04em' }}
                >
                  Primera
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Banner ${i + 1}`}
                className="aspect-video w-full object-cover"
                style={{ border: '1px solid #e5e5e5' }}
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute right-2 top-2 px-2 py-1 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: '#d81b8a', color: '#fff' }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
