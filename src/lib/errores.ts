// Errores de la API ({ codigo, mensaje, detalle }) → mensajes en español de docs/UI-UX.md §6.
import { formatearFecha, formatearToneladas, nombreMes } from './formato'

export type Detalle = Record<string, unknown>

export class ErrorApi extends Error {
  readonly status: number
  readonly codigo: string
  readonly detalle: Detalle | undefined
  readonly requestId: string | undefined

  constructor(status: number, codigo: string, mensaje: string, detalle?: Detalle, requestId?: string) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.codigo = codigo
    this.detalle = detalle
    this.requestId = requestId
  }
}

/** Códigos propios del cliente (no vienen de la API). */
export const SIN_RESPUESTA = 'SIN_RESPUESTA'
export const SIN_CONEXION = 'SIN_CONEXION'

type Plantilla = string | ((d: Detalle, e: ErrorApi) => string)

const texto = (d: Detalle, clave: string): string | undefined => {
  const valor = d[clave]
  return typeof valor === 'string' || typeof valor === 'number' ? String(valor) : undefined
}

const MENSAJES: Record<string, Plantilla> = {
  VALIDACION: 'Revisa los campos marcados.',
  NO_AUTENTICADO: 'Tu sesión terminó. Vuelve a ingresar.',
  SIN_PERMISO: 'No tienes permiso para esta acción.',
  NO_ENCONTRADO: 'No encontramos ese registro (quizá fue anulado).',
  PERIODO_CERRADO: (d) => {
    const mes = texto(d, 'mes')
    return `El mes${mes ? ` de ${nombreMes(Number.parseInt(mes, 10)).toLowerCase()}` : ''} está cerrado. Pide reabrirlo si necesitas cambiarlo.`
  },
  PERIODO_ANTERIOR_ABIERTO: 'Primero cierra el mes anterior.',
  PERIODO_POSTERIOR_CERRADO: 'Solo se puede reabrir el último mes cerrado.',
  STOCK_INSUFICIENTE: (d, e) => {
    const fecha = texto(d, 'fecha')
    const disponible = texto(d, 'disponible') ?? texto(d, 'disponibleAntes')
    if (!fecha || !disponible) return e.message || 'No hay stock suficiente.'
    return `No hay stock suficiente al ${formatearFecha(fecha)} (disponible ${formatearToneladas(disponible)} TN).`
  },
  COMPROBANTE_DUPLICADO: 'Ya existe ese comprobante de este tercero.',
  RUC_INVALIDO: 'El RUC no es válido (revisa los 11 dígitos).',
  DOCUMENTO_INVALIDO: 'El documento no tiene el formato correcto.',
  SUSTENTO_REQUERIDO: 'Indica el sustento (informe técnico o acta).',
  PRECIO_VENTA_REQUERIDO: 'Indica el valor de venta sin IGV de cada línea.',
  TIPO_CAMBIO_REQUERIDO: 'Para ventas en dólares indica el tipo de cambio de la fecha de emisión.',
  CIERRE_ANUAL_INCOMPLETO: 'Cierra los 12 meses antes del cierre anual.',
  VIGENCIA_SUPERPUESTA: 'Ya existe una regla vigente en esas fechas para el mismo tipo, producto y operación. Cierra la anterior con "vigente hasta".',
  COMPROBANTE_ANULADO: 'Ese comprobante está anulado: ya no se puede editar ni mover.',
  REORDEN_FUERA_DE_FECHA: 'Solo se puede mover dentro de la misma fecha.',
  HISTORICO_YA_CARGADO: 'El histórico 2024–2026 ya está cargado en esta base.',
  NO_DISPONIBLE_EN_DEMO: 'No disponible en la base de demostración.',
  REGLA_CONTABLE_FALTANTE: 'Hay movimientos sin regla contable: configúrala en Maestros → Reglas contables.',
  CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.',
  DEMASIADAS_SOLICITUDES: 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.',
  CAMBIO_PASSWORD_REQUERIDO: 'Debes cambiar tu contraseña antes de continuar.',
  ERROR_INTERNO: (_d, e) =>
    `Ocurrió un error inesperado. Intenta de nuevo; si continúa, avisa al administrador${e.requestId ? ` (código ${e.requestId})` : ''}.`,
  [SIN_RESPUESTA]: 'El servidor no respondió a tiempo. Si estabas guardando algo, revisa si se registró antes de repetirlo.',
  [SIN_CONEXION]: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
}

/** Mensaje para mostrar al usuario a partir de cualquier error. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) {
    const plantilla = MENSAJES[error.codigo]
    if (typeof plantilla === 'function') return plantilla(error.detalle ?? {}, error)
    if (plantilla) return plantilla
    return error.message || 'Ocurrió un error inesperado. Intenta de nuevo.'
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
