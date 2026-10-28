// Importación del histórico y paridad (docs/CONTRATO-API.md §6.1). Solo ADMIN; la API las niega en modo demostración.
import { obtenerSalud } from './auth'
import { solicitar } from './cliente'
import type { components } from './esquema'

export type ResultadoImportacion = components['schemas']['ImportacionHistoricoDto']
export type Paridad = components['schemas']['ParidadDto']
export type FilaParidad = components['schemas']['FilaParidadDto']

/** Las dos operaciones tardan de 1 a 3 minutos: cada intento espera hasta 4. */
export const TIEMPO_OPERACION_LARGA_MS = 240_000

/**
 * Primero despierta la API con GET /salud (se puede repetir sin riesgo, con "Despertando el servidor…").
 * Así el tiempo largo cuenta solo para la operación y no para el arranque del servidor gratuito.
 */
async function despertar() {
  try {
    await obtenerSalud()
  } catch {
    // Si /salud falla, la operación mostrará el error.
  }
}

/**
 * POST /importacion/historico. No se repite ante 502/504 o tiempo agotado: la carga puede seguir en el servidor
 * (el cliente lanza SIN_RESPUESTA). Repetirla tampoco duplica: la API responde 409 HISTORICO_YA_CARGADO.
 */
export async function cargarHistorico(): Promise<ResultadoImportacion> {
  await despertar()
  return solicitar<ResultadoImportacion>('/importacion/historico', {
    metodo: 'POST',
    tiempoMs: TIEMPO_OPERACION_LARGA_MS,
    proxyPuedeCortar: true,
  })
}

/** GET /importacion/paridad (sin filtros: todos los años y productos). */
export async function verificarParidad(): Promise<Paridad> {
  await despertar()
  return solicitar<Paridad>('/importacion/paridad', { tiempoMs: TIEMPO_OPERACION_LARGA_MS })
}
