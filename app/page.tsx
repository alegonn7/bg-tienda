import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const WHATSAPP_NUMBER = '542241527649'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

const COLORS = {
  accent: '#5B67AC',
  accentHover: '#454F87',
  ink: '#2B2B2B',
  mutedText: '#5B5B58',
  footerText: '#8A8A86',
  surface: '#F0F0EE',
}

const features = [
  {
    title: 'Tu tienda, tu marca',
    text: 'Nombre, colores y logo propios. Es tu negocio.',
  },
  {
    title: 'Stock siempre al día',
    text: 'Sincronizado en tiempo real con bg-gestión. Nada de cargar dos veces.',
  },
  {
    title: 'Todos los medios de pago',
    text: 'Tus clientes pueden pagar con transferencia, Mercado Pago o efectivo.',
  },
]

export default function LandingPage() {
  return (
    <div
      className={manrope.className}
      style={{ width: '100%', color: COLORS.ink, overflowX: 'hidden', background: '#ffffff' }}
    >
      {/* Hero */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '72px 24px 96px',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-binary-goats.png"
          alt="Binary Goats"
          style={{
            width: 185,
            height: 190,
            objectFit: 'cover',
            borderRadius: '50%',
            marginBottom: 36,
          }}
        />
        <h1
          style={{
            fontSize: 56,
            lineHeight: 1.12,
            fontWeight: 800,
            margin: '0 0 24px',
            letterSpacing: '-0.02em',
          }}
        >
          Tu tienda online de confianza
        </h1>
        <p
          style={{
            fontSize: 20,
            lineHeight: 1.5,
            color: COLORS.mutedText,
            maxWidth: 620,
            margin: '0 0 40px',
            fontWeight: 500,
          }}
        >
          Se sincroniza en tiempo real con tu software de gestión.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: COLORS.accent,
            color: COLORS.surface,
            fontWeight: 700,
            fontSize: 17,
            padding: '16px 40px',
            borderRadius: 10,
          }}
        >
          Hablemos
        </a>
      </section>

      {/* Features */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 48,
          maxWidth: 1080,
          margin: '0 auto',
          padding: '0 24px 96px',
        }}
      >
        {features.map((f) => (
          <div key={f.title} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{f.title}</h3>
            <p style={{ fontSize: 16, lineHeight: 1.55, color: COLORS.mutedText, margin: 0 }}>
              {f.text}
            </p>
          </div>
        ))}
      </section>

      {/* Diferencial */}
      <section style={{ background: COLORS.surface, padding: '120px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: COLORS.accent,
              margin: '0 0 20px',
            }}
          >
            La diferencia
          </p>
          <h2
            style={{
              fontSize: 38,
              lineHeight: 1.35,
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            La mayoría de las tiendas online viven separadas del sistema de gestión del local. En
            bg-tienda, tenés todo en un mismo sistema.
          </h2>
        </div>
      </section>

      {/* Cierre */}
      <section style={{ background: COLORS.accent, padding: '96px 24px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 34,
            lineHeight: 1.3,
            fontWeight: 800,
            color: COLORS.surface,
            maxWidth: 640,
            margin: '0 auto 36px',
          }}
        >
          ¿Tenés un negocio y querés vender online? Hablemos.
        </h2>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: COLORS.surface,
            color: COLORS.ink,
            fontWeight: 700,
            fontSize: 17,
            padding: '16px 40px',
            borderRadius: 10,
          }}
        >
          Escribinos por WhatsApp
        </a>
      </section>

      {/* Footer */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '40px 24px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-binary-goats.png"
          alt="Binary Goats"
          style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: '50%' }}
        />
        <span style={{ fontSize: 14, color: COLORS.footerText, fontWeight: 500 }}>
          © Binary Goats
        </span>
        <a
          href="https://binarygoats.vercel.app/"
          title="binarygoats.vercel.app"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: `1.5px solid ${COLORS.footerText}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: 22,
              height: 22,
              border: `1.5px solid ${COLORS.footerText}`,
              borderRadius: '50%',
              transform: 'scale(0.55,1)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 0,
              borderTop: `1.5px solid ${COLORS.footerText}`,
            }}
          />
        </a>
      </footer>
    </div>
  )
}
