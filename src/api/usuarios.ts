// Tipos de /usuarios (docs/CONTRATO-API.md §6). La pantalla y sus consultas llegan en el Sprint 7.
import type { components } from './esquema'

/**
 * Usuario de la lista. `passwordTemporalExpira` (ISO, 72 h) indica hasta cuándo vale la contraseña temporal;
 * `null` = no vence. Pasada esa hora el login responde 401 y hay que restablecerla.
 */
export type Usuario = components['schemas']['UsuarioDto']
export type PaginaUsuarios = components['schemas']['UsuariosPaginaDto']
