// Roles con prefijo de módulo ("inventario:CONTADOR"). Toda consulta de permisos pasa por aquí.
// La API valida igual: esto solo decide qué se muestra.
import { obtenerSesion } from './sesion'

export type Modulo = 'inventario'
export type Rol = 'ADMIN' | 'CONTADOR' | 'ASISTENTE' | 'CONSULTA'

/** Atajos de docs/UI-UX.md §3 (A, C, S; "todos" incluye CONSULTA). */
export const TODOS: readonly Rol[] = ['ADMIN', 'CONTADOR', 'ASISTENTE', 'CONSULTA']
export const A_C_S: readonly Rol[] = ['ADMIN', 'CONTADOR', 'ASISTENTE']
export const A_C: readonly Rol[] = ['ADMIN', 'CONTADOR']
export const SOLO_A: readonly Rol[] = ['ADMIN']

const rolesActuales = () => obtenerSesion().usuario?.roles ?? []

/** tieneRol('inventario', 'CONTADOR'). Sin `roles` usa los de la sesión actual. */
export function tieneRol(modulo: Modulo, rol: Rol, roles: readonly string[] = rolesActuales()): boolean {
  return roles.includes(`${modulo}:${rol}`)
}

/** true si tiene al menos uno de los roles. */
export function tieneAlgunRol(modulo: Modulo, permitidos: readonly Rol[], roles: readonly string[] = rolesActuales()): boolean {
  return permitidos.some((rol) => tieneRol(modulo, rol, roles))
}
