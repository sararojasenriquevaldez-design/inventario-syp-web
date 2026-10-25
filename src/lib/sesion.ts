// Estado de la sesión EN MEMORIA (nunca localStorage ni sessionStorage). El access token vive solo aquí:
// al recargar la pestaña se pierde y se recupera con un refresh (la cookie HttpOnly la maneja el navegador).
import { useSyncExternalStore } from 'react'
import type { components } from '@/api/esquema'

export type UsuarioSesion = components['schemas']['UsuarioSesionDto']

/** verificando: aún no se intentó el refresh silencioso del arranque. */
export type EstadoSesion = 'verificando' | 'autenticado' | 'anonimo'

type Instantanea = { estado: EstadoSesion; usuario: UsuarioSesion | null }

let accessToken: string | null = null
let instantanea: Instantanea = { estado: 'verificando', usuario: null }
const oyentes = new Set<() => void>()

function publicar(siguiente: Instantanea) {
  instantanea = siguiente
  for (const oyente of oyentes) oyente()
}

export function obtenerToken(): string | null {
  return accessToken
}

export function obtenerSesion(): Instantanea {
  return instantanea
}

export function establecerSesion(token: string, usuario: UsuarioSesion) {
  accessToken = token
  publicar({ estado: 'autenticado', usuario })
}

/** Marca que el usuario debe cambiar su contraseña (403 CAMBIO_PASSWORD_REQUERIDO). */
export function marcarCambioPasswordRequerido() {
  if (instantanea.usuario && !instantanea.usuario.debeCambiarPassword) {
    publicar({ ...instantanea, usuario: { ...instantanea.usuario, debeCambiarPassword: true } })
  }
}

export function limpiarSesion() {
  accessToken = null
  publicar({ estado: 'anonimo', usuario: null })
}

/** Solo para pruebas: vuelve al estado inicial. */
export function reiniciarSesionParaPruebas() {
  accessToken = null
  instantanea = { estado: 'verificando', usuario: null }
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function useSesion(): Instantanea {
  return useSyncExternalStore(suscribir, obtenerSesion, obtenerSesion)
}
