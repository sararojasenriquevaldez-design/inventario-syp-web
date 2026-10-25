import { describe, expect, it } from 'vitest'
import { ErrorApi, mensajeDeError } from './errores'

describe('mensajes de error (docs/UI-UX.md §6)', () => {
  it('traduce el código de la API al mensaje en español', () => {
    expect(mensajeDeError(new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'x'))).toBe(
      'Correo o contraseña incorrectos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.',
    )
    expect(mensajeDeError(new ErrorApi(429, 'DEMASIADAS_SOLICITUDES', 'x'))).toMatch(/Espera un minuto/)
  })

  it('completa el mes del periodo cerrado', () => {
    expect(mensajeDeError(new ErrorApi(409, 'PERIODO_CERRADO', '', { anio: 2026, mes: 3 }))).toBe(
      'El mes de marzo está cerrado. Pide reabrirlo si necesitas cambiarlo.',
    )
  })

  it('incluye el requestId en el error interno', () => {
    expect(mensajeDeError(new ErrorApi(500, 'ERROR_INTERNO', '', undefined, 'abc-123'))).toMatch(/código abc-123/)
  })

  it('usa el mensaje de la API si el código es desconocido', () => {
    expect(mensajeDeError(new ErrorApi(409, 'CODIGO_NUEVO', 'Mensaje de la API'))).toBe('Mensaje de la API')
  })

  it('error que no es de la API: mensaje genérico', () => {
    expect(mensajeDeError(new Error('boom'))).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
  })
})
