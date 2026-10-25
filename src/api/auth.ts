// Sesión contra /auth/* (docs/CONTRATO-API.md §3).
import { avisarLogoutAPestanas, ENCABEZADO_CSRF, refrescarSesion, solicitar } from './cliente'
import type { components } from './esquema'
import { establecerSesion, limpiarSesion } from '@/lib/sesion'

type SesionRespuesta = components['schemas']['SesionRespuestaDto']
type Salud = components['schemas']['SaludRespuestaDto']
export type DatosLogin = components['schemas']['LoginDto']
export type DatosCambioPassword = components['schemas']['CambiarPasswordDto']

/** Login: un 401 aquí es CREDENCIALES_INVALIDAS y nunca dispara el refresh. Se puede repetir si el servidor dormía. */
export async function iniciarSesion(datos: DatosLogin) {
  const sesion = await solicitar<SesionRespuesta>('/auth/login', {
    metodo: 'POST',
    cuerpo: datos,
    sinRefresh: true,
    idempotente: true,
  })
  establecerSesion(sesion.accessToken, sesion.usuario)
  return sesion.usuario
}

/** Cambia la contraseña; la API devuelve una sesión nueva (las anteriores quedan revocadas). */
export async function cambiarPassword(datos: DatosCambioPassword) {
  const sesion = await solicitar<SesionRespuesta>('/auth/cambiar-password', { metodo: 'POST', cuerpo: datos })
  establecerSesion(sesion.accessToken, sesion.usuario)
  return sesion.usuario
}

/** Cierra la sesión aquí y en las demás pestañas, aunque la API no responda. */
export async function cerrarSesion() {
  try {
    await solicitar<void>('/auth/logout', { metodo: 'POST', encabezados: { ...ENCABEZADO_CSRF } })
  } catch {
    // Sin red o sesión ya vencida: igual se borra el token de memoria.
  }
  limpiarSesion()
  avisarLogoutAPestanas()
}

export const obtenerSalud = () => solicitar<Salud>('/salud')

/**
 * Al abrir la app: despierta la API (GET /salud, que se puede repetir sin riesgo) y luego intenta el refresh
 * silencioso. Así el refresh, que no se repite ante un tiempo agotado, no choca con el servidor dormido.
 */
export async function recuperarSesion(): Promise<void> {
  try {
    await obtenerSalud()
  } catch {
    // Si /salud falla, el refresh decidirá.
  }
  const resultado = await refrescarSesion()
  if (resultado !== 'ok') limpiarSesion()
}
