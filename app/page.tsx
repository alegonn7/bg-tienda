import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import {
  Boxes,
  Check,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  Palette,
  Truck,
} from 'lucide-react'
import { BINARY_GOATS_URL, SITE_URL, WHATSAPP_NUMBER } from '@/lib/site-config'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hola! Quiero info sobre BG Tienda para mi negocio.',
)}`

const TITLE = 'BG Tienda — Tienda online para tu comercio, conectada a tu stock'
const DESCRIPTION =
  'Creá la tienda online de tu negocio con tu marca, cobrá con Mercado Pago o transferencia, enviá con Correo Argentino o Andreani y mantené el stock sincronizado con BG Gestión.'

// Solo la landing (/) define este metadata: cada tienda (/[slug]) resuelve el suyo en
// app/[slug]/layout.tsx, así que nada de esto se filtra a las tiendas de los clientes.
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    'tienda online',
    'crear tienda online Argentina',
    'e-commerce para comercios',
    'tienda online con Mercado Pago',
    'tienda online sincronizada con stock',
    'catálogo online',
    'venta online para pymes',
    'BG Tienda',
    'BG Gestión',
    'Binary Goats',
  ],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: 'BG Tienda',
    type: 'website',
    locale: 'es_AR',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'BG Tienda — tienda online para comercios' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
}

const features = [
  {
    icon: Palette,
    title: 'Tu tienda, tu marca',
    text: 'Logo, colores, favicon, banner de portada y nombre propios. Tus clientes compran en tu tienda, no en un marketplace.',
  },
  {
    icon: Boxes,
    title: 'Stock sincronizado con BG Gestión',
    text: 'Una venta online descuenta el mismo stock que usás en el mostrador. Nada de cargar los productos dos veces ni vender lo que no tenés.',
  },
  {
    icon: CreditCard,
    title: 'Cobros con Mercado Pago y transferencia',
    text: 'Conectás tu cuenta de Mercado Pago, mostrás tu CBU o alias para transferencias, o recibís el pedido por WhatsApp. Vos elegís qué medios activar.',
  },
  {
    icon: Truck,
    title: 'Envíos a todo el país',
    text: 'Cotización automática con Correo Argentino o Andreani, montos fijos por provincia, o retiro en el local.',
  },
  {
    icon: ClipboardList,
    title: 'Panel de pedidos',
    text: 'Cada pedido queda registrado. Lo revisás, lo confirmás y el stock se descuenta en ese momento.',
  },
  {
    icon: LayoutGrid,
    title: 'Catálogo ordenado',
    text: 'Categorías, talles o tamaños, productos destacados y fotos. Podés mostrar precios o usarla como catálogo para consultar.',
  },
]

const steps = [
  {
    title: 'Hablamos',
    text: 'Nos contás de tu negocio por WhatsApp y damos de alta tu tienda.',
  },
  {
    title: 'La personalizás',
    text: 'Subís tu logo, elegís colores y cargás productos — o usás los que ya tenés en BG Gestión.',
  },
  {
    title: 'Empezás a vender',
    text: 'Compartís el link de tu tienda en Instagram, WhatsApp o donde quieras y recibís pedidos.',
  },
]

const rubros = [
  'Indumentaria',
  'Calzado',
  'Almacenes',
  'Kioscos',
  'Ferreterías',
  'Librerías',
  'Regalerías',
  'Cosmética',
  'Accesorios',
  'Distribuidoras',
]

// Fuente única para la sección visible y para el JSON-LD de FAQPage: Google exige que las
// preguntas marcadas estén en la página, así que ambas salen de este mismo array.
const faqs = [
  {
    q: '¿Necesito usar BG Gestión para tener mi tienda?',
    a: 'No. BG Tienda funciona sola. Si además usás BG Gestión en tu local, las dos se conectan y comparten productos y stock, así que una venta online descuenta del mismo inventario que el mostrador.',
  },
  {
    q: '¿Qué medios de pago puedo ofrecer?',
    a: 'Mercado Pago (conectando tu propia cuenta), transferencia bancaria con tu CBU o alias, y pedidos por WhatsApp. Cada uno se activa o desactiva desde el panel de tu tienda.',
  },
  {
    q: '¿Cómo funcionan los envíos?',
    a: 'Podés ofrecer retiro en el local y envío a domicilio. El costo de envío se cotiza automáticamente con Correo Argentino o Andreani (usando tu cuenta con ellos) o con montos fijos que vos definís por provincia.',
  },
  {
    q: '¿Puedo usar mi logo y los colores de mi marca?',
    a: 'Sí. Desde el panel cargás tu logo, favicon, banner de portada, color principal y los links a tu Instagram y Facebook.',
  },
  {
    q: '¿Qué pasa con el stock cuando vendo en el local?',
    a: 'Si usás BG Gestión, la venta en el mostrador descuenta el mismo stock que ve la tienda online, y la tienda lo refleja en menos de un minuto. Sin planillas ni cargas duplicadas.',
  },
  {
    q: '¿Cómo empiezo?',
    a: 'Escribinos por WhatsApp. Damos de alta tu tienda y te acompañamos en la puesta en marcha hasta que esté lista para vender.',
  },
]

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BG Tienda',
  url: `${SITE_URL}/`,
  description: DESCRIPTION,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'E-commerce',
  operatingSystem: 'Web',
  inLanguage: 'es-AR',
  image: `${SITE_URL}/og.png`,
  featureList: features.map((f) => f.title),
  // Sin "offers" ni "review": no publicamos precios ni reseñas en esta página, y marcar datos que
  // no están visibles (o inventarlos) hace que Google invalide el bloque entero.
  publisher: {
    '@type': 'Organization',
    name: 'Binary Goats',
    url: BINARY_GOATS_URL,
    logo: `${SITE_URL}/logo-binary-goats.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${WHATSAPP_NUMBER}`,
      contactType: 'sales',
      areaServed: 'AR',
      availableLanguage: ['Spanish'],
    },
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

const ACCENT = '#5B67AC'
const INK = '#2B2B2B'
const MUTED = '#5B5B58'
const SURFACE = '#F0F0EE'

function WhatsAppCta({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'light' }) {
  const colors =
    variant === 'primary'
      ? 'bg-[#5B67AC] text-[#F0F0EE] hover:bg-[#454F87]'
      : 'bg-[#F0F0EE] text-[#2B2B2B] hover:bg-white'
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-[10px] px-8 py-4 text-[17px] font-bold transition-colors ${colors}`}
    >
      {children}
    </a>
  )
}

export default function LandingPage() {
  return (
    <div className={manrope.className} style={{ color: INK, background: '#ffffff', overflowX: 'hidden' }}>
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />

      <header className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-6 py-5">
        <a href="/" className="flex items-center gap-3" aria-label="BG Tienda — inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-binary-goats.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="text-lg font-extrabold tracking-tight">BG Tienda</span>
        </a>
        <nav aria-label="Secciones" className="flex items-center gap-5 text-[15px] font-semibold" style={{ color: MUTED }}>
          <a href="#funciones" className="hidden sm:inline hover:underline">Funciones</a>
          <a href="#como-funciona" className="hidden sm:inline hover:underline">Cómo funciona</a>
          <a href="#preguntas" className="hidden sm:inline hover:underline">Preguntas</a>
          <a href="/admin/login" rel="nofollow" className="hover:underline" style={{ color: ACCENT }}>
            Ingresar
          </a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto flex max-w-[900px] flex-col items-center px-6 pb-20 pt-12 text-center sm:pb-24 sm:pt-16">
          <p
            className="mb-5 text-[13px] font-bold uppercase tracking-[0.08em]"
            style={{ color: ACCENT }}
          >
            Tienda online para comercios argentinos
          </p>
          <h1 className="mb-6 text-[36px] font-extrabold leading-[1.12] tracking-[-0.02em] sm:text-[52px]">
            Tu tienda online, conectada al stock de tu negocio
          </h1>
          <p
            className="mb-10 max-w-[640px] text-[18px] font-medium leading-relaxed sm:text-[20px]"
            style={{ color: MUTED }}
          >
            BG Tienda es la plataforma de e-commerce de Binary Goats: vendé online con tu marca, cobrá
            con Mercado Pago o transferencia y mantené el inventario sincronizado en tiempo real con tu
            sistema de gestión.
          </p>
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <WhatsAppCta>Quiero mi tienda</WhatsAppCta>
            <a
              href="#funciones"
              className="inline-flex items-center justify-center rounded-[10px] border-2 px-8 py-[14px] text-[17px] font-bold"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              Ver funciones
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] font-medium" style={{ color: MUTED }}>
            {['Mercado Pago y transferencia', 'Correo Argentino y Andreani', 'Stock en tiempo real'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Funciones */}
        <section id="funciones" aria-labelledby="funciones-title" className="mx-auto max-w-[1080px] scroll-mt-8 px-6 pb-24">
          <h2 id="funciones-title" className="mb-4 text-center text-[30px] font-extrabold leading-tight sm:text-[38px]">
            Todo lo que necesitás para vender online
          </h2>
          <p className="mx-auto mb-14 max-w-[620px] text-center text-[17px] leading-relaxed" style={{ color: MUTED }}>
            Una tienda completa, lista para compartir en Instagram y WhatsApp, que se administra desde un
            solo panel.
          </p>
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="flex flex-col gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: SURFACE, color: ACCENT }}
                  aria-hidden="true"
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="m-0 text-[20px] font-bold">{f.title}</h3>
                <p className="m-0 text-[16px] leading-relaxed" style={{ color: MUTED }}>
                  {f.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Diferencial */}
        <section style={{ background: SURFACE }} className="px-6 py-24 sm:py-28">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="mb-5 text-[14px] font-bold uppercase tracking-[0.08em]" style={{ color: ACCENT }}>
              La diferencia
            </p>
            <h2 className="m-0 text-[28px] font-extrabold leading-[1.35] tracking-[-0.01em] sm:text-[36px]">
              La mayoría de las tiendas online viven separadas del sistema de gestión del local. Con BG
              Tienda y BG Gestión tenés todo en un mismo sistema.
            </h2>
            <p className="mx-auto mt-6 max-w-[600px] text-[17px] leading-relaxed" style={{ color: MUTED }}>
              Productos, precios y stock se comparten entre la tienda y el punto de venta. Conocé{' '}
              <a
                href={`${BINARY_GOATS_URL}/bg-gestion`}
                className="font-semibold underline"
                style={{ color: ACCENT }}
              >
                BG Gestión, el sistema de inventario y punto de venta
              </a>
              .
            </p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section
          id="como-funciona"
          aria-labelledby="como-funciona-title"
          className="mx-auto max-w-[1080px] scroll-mt-8 px-6 py-24"
        >
          <h2 id="como-funciona-title" className="mb-14 text-center text-[30px] font-extrabold leading-tight sm:text-[38px]">
            Tu tienda online en tres pasos
          </h2>
          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[16px] font-extrabold"
                  style={{ background: ACCENT, color: SURFACE }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="m-0 text-[20px] font-bold">{s.title}</h3>
                <p className="m-0 text-[16px] leading-relaxed" style={{ color: MUTED }}>
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Rubros */}
        <section aria-labelledby="rubros-title" className="mx-auto max-w-[900px] px-6 pb-24 text-center">
          <h2 id="rubros-title" className="mb-8 text-[26px] font-extrabold leading-tight sm:text-[32px]">
            Pensada para comercios de todos los rubros
          </h2>
          <ul className="flex flex-wrap justify-center gap-3">
            {rubros.map((r) => (
              <li
                key={r}
                className="rounded-full px-4 py-2 text-[15px] font-semibold"
                style={{ background: SURFACE, color: INK }}
              >
                {r}
              </li>
            ))}
          </ul>
        </section>

        {/* Preguntas frecuentes */}
        <section
          id="preguntas"
          aria-labelledby="preguntas-title"
          style={{ background: SURFACE }}
          className="scroll-mt-8 px-6 py-24"
        >
          <div className="mx-auto max-w-[760px]">
            <h2 id="preguntas-title" className="mb-10 text-center text-[30px] font-extrabold leading-tight sm:text-[38px]">
              Preguntas frecuentes
            </h2>
            <div className="flex flex-col gap-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-xl bg-white px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-bold [&::-webkit-details-marker]:hidden">
                    <h3 className="m-0 text-[16px] font-bold">{f.q}</h3>
                    <span
                      className="text-[22px] leading-none transition-transform group-open:rotate-45"
                      style={{ color: ACCENT }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="m-0 mt-3 text-[15px] leading-relaxed" style={{ color: MUTED }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section style={{ background: ACCENT }} className="px-6 py-24 text-center">
          <h2
            className="mx-auto mb-9 max-w-[640px] text-[28px] font-extrabold leading-[1.3] sm:text-[34px]"
            style={{ color: SURFACE }}
          >
            ¿Tenés un negocio y querés vender online? Hablemos.
          </h2>
          <WhatsAppCta variant="light">Escribinos por WhatsApp</WhatsAppCta>
        </section>
      </main>

      <footer className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-binary-goats.png"
          alt="Binary Goats"
          width={24}
          height={24}
          className="h-6 w-6 rounded-full object-cover"
        />
        <p className="m-0 text-[14px] font-medium" style={{ color: '#8A8A86' }}>
          BG Tienda es un producto de{' '}
          <a href={`${BINARY_GOATS_URL}/bg-tienda`} className="underline hover:no-underline">
            Binary Goats
          </a>
          {' · '}
          <a href={`${BINARY_GOATS_URL}/bg-gestion`} className="underline hover:no-underline">
            BG Gestión
          </a>
          {' · '}© {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
