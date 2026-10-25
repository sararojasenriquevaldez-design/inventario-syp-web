// Formatos es-PE de docs/UI-UX.md §9. Los decimales llegan como string y se redondean con big.js
// (nunca Number ni parseFloat): miles con coma, decimal con punto y negativos con signo menos.
import Big from 'big.js'

const SIN_VALOR = '—'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

type Decimal = string | null | undefined

/** Redondea (mitad hacia arriba, como la API) y agrupa miles: "-1234.5" → "-1,234.50". */
export function formatearDecimal(valor: Decimal, decimales: number): string {
  if (valor === null || valor === undefined || valor.trim() === '') return SIN_VALOR
  let fijo: string
  try {
    fijo = new Big(valor.trim()).round(decimales, Big.roundHalfUp).toFixed(decimales)
  } catch {
    return valor
  }
  const negativo = fijo.startsWith('-')
  const [entero, fraccion] = (negativo ? fijo.slice(1) : fijo).split('.')
  const agrupado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const texto = fraccion ? `${agrupado}.${fraccion}` : agrupado
  // "-0.0000" se muestra como cero
  return negativo && /[1-9]/.test(texto) ? `-${texto}` : texto
}

/** Toneladas con 4 decimales: "1234.5" → "1,234.5000". */
export const formatearToneladas = (valor: Decimal) => formatearDecimal(valor, 4)

/** Soles con 2 decimales: "1234.5" → "S/ 1,234.50". */
export function formatearSoles(valor: Decimal): string {
  const texto = formatearDecimal(valor, 2)
  return texto === SIN_VALOR ? texto : `S/ ${texto}`
}

/** Costo unitario: 2 decimales (4 en el detalle). */
export const formatearCU = (valor: Decimal, detalle = false) => formatearDecimal(valor, detalle ? 4 : 2)

/** Tipo de cambio con 3 decimales. */
export const formatearTipoCambio = (valor: Decimal) => formatearDecimal(valor, 3)

/** "2026-03-15" → "15/03/2026", partiendo el texto (sin new Date: evita el corrimiento por zona horaria). */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return SIN_VALOR
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha)
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : fecha
}

/** dd/mm/aaaa → YYYY-MM-DD (null si no tiene ese formato). */
export function fechaAIso(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim())
  return partes ? `${partes[3]}-${partes[2]}-${partes[1]}` : null
}

/** Nombre del mes (1–12) con "Setiembre". */
export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes)
}

/** (2026, 3) → "Marzo 2026". */
export const formatearPeriodo = (anio: number, mes: number) => `${nombreMes(mes)} ${anio}`

/** ("F001", "123") → "F001-0000123". */
export function formatearDocumento(serie: string, numero: string): string {
  return `${serie.trim()}-${numero.trim().padStart(7, '0')}`
}
