// GTIN (EAN-8, UPC-A, EAN-13, GTIN-14): el código de barras "de fábrica" que Google usa para
// identificar el producto en Shopping. En BG Gestión el código de barras también puede ser uno
// interno de la tienda; esos no pasan el dígito de control y no se mandan a Google como GTIN.

export function normalizeBarcode(raw: string | null | undefined): string {
  return (raw ?? '').replace(/[\s-]/g, '')
}

export function isValidGtin(raw: string | null | undefined): boolean {
  const code = normalizeBarcode(raw)
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false
  // Prefijos GS1 de uso interno (balanza, productos propios de la tienda): 20-29 en EAN-13, 2 y 4
  // en UPC-A (02 y 04 escrito como EAN-13). No son un GTIN global y Google los rechaza.
  const ean13 = code.padStart(14, '0').slice(1)
  if (code.length >= 12 && /^(2|02|04)/.test(ean13)) return false
  // Códigos cargados a mano como 0000000000044: no existe un prefijo de empresa con tantos ceros.
  if (code.length >= 12 && /^0{6}/.test(ean13)) return false
  const digits = code.padStart(14, '0').split('').map(Number)
  const check = digits.pop()!
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

// El GTIN para Google o null si el código no es uno válido.
export function gtinOrNull(raw: string | null | undefined): string | null {
  return isValidGtin(raw) ? normalizeBarcode(raw) : null
}
