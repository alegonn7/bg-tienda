'use client'

import { useState, useEffect } from 'react'

export function HeroSlider({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0)
  // Solo se descargan la imagen visible y la siguiente (precarga para el fade). Antes se pedían
  // todas juntas al abrir la home, compitiendo con el resto de la página.
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1]))

  useEffect(() => {
    const next = (current + 1) % Math.max(images.length, 1)
    setLoaded((prev) => (prev.has(current) && prev.has(next) ? prev : new Set([...prev, current, next])))
  }, [current, images.length])

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
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


      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Imagen ${i + 1}`}
              className="h-1.5 transition-all duration-300"
              style={{
                width: i === current ? '24px' : '8px',
                backgroundColor: i === current ? '#ffffff' : 'rgba(255,255,255,0.5)',
                borderRadius: '2px',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
