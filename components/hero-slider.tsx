'use client'

import { useEffect, useState } from 'react'

// Fondo de la portada: las imágenes del banner pasan solas cada 5 segundos.
export function HeroSlider({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  // Solo se descargan la imagen visible y la siguiente (precarga para el fundido).
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1]))

  useEffect(() => {
    const next = (current + 1) % Math.max(images.length, 1)
    setLoaded((prev) => (prev.has(current) && prev.has(next) ? prev : new Set([...prev, current, next])))
  }, [current, images.length])

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => setCurrent((prev) => (prev + 1) % images.length), 5000)
    return () => clearInterval(interval)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <>
      {images.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            backgroundImage: loaded.has(i) ? `url(${url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}
      {/* Oscurece la foto donde va el texto, para que siempre se lea. */}
      <div className="absolute inset-0 md:hidden" style={{ background: 'linear-gradient(0deg, rgba(15,10,14,.82) 0%, rgba(15,10,14,.4) 50%, rgba(15,10,14,.1) 100%)' }} />
      <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(90deg, rgba(15,10,14,.72) 0%, rgba(15,10,14,.35) 45%, rgba(15,10,14,0) 75%)' }} />
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Imagen ${i + 1}`}
              className="h-[7px] rounded-full transition-all duration-300"
              style={{ width: i === current ? 22 : 7, backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,.55)' }}
            />
          ))}
        </div>
      )}
    </>
  )
}
