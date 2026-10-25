import { z } from 'zod'

export const MINIMO_PASSWORD = 12

export const esquemaLogin = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo.')
    .max(120, 'El correo es demasiado largo.')
    .pipe(z.email('Escribe un correo válido.')),
  password: z.string().min(1, 'Escribe tu contraseña.').max(200, 'La contraseña es demasiado larga.'),
})

export type FormularioLogin = z.infer<typeof esquemaLogin>

export const esquemaCambioPassword = z
  .object({
    actual: z.string().min(1, 'Escribe tu contraseña actual.').max(200, 'La contraseña es demasiado larga.'),
    nueva: z
      .string()
      .min(MINIMO_PASSWORD, `La contraseña nueva debe tener al menos ${MINIMO_PASSWORD} caracteres.`)
      .max(200, 'La contraseña es demasiado larga.'),
    repetir: z.string().min(1, 'Repite la contraseña nueva.'),
  })
  .refine((d) => d.nueva === d.repetir, { path: ['repetir'], message: 'Las contraseñas no coinciden.' })
  .refine((d) => d.nueva !== d.actual, { path: ['nueva'], message: 'La contraseña nueva debe ser distinta de la actual.' })

export type FormularioCambioPassword = z.infer<typeof esquemaCambioPassword>

export type NivelPassword = { nivel: 0 | 1 | 2 | 3; texto: string }

/** Indicador orientativo (la API es la que valida): largo mínimo y variedad de caracteres. */
export function evaluarPassword(valor: string): NivelPassword {
  if (valor.length < MINIMO_PASSWORD) {
    return { nivel: 0, texto: `Muy corta: ${valor.length} de ${MINIMO_PASSWORD} caracteres` }
  }
  const variedad = [/[a-záéíóúñ]/, /[A-ZÁÉÍÓÚÑ]/, /\d/, /[^\wáéíóúñÁÉÍÓÚÑ]/].filter((r) => r.test(valor)).length
  if (valor.length >= 16 && variedad >= 3) return { nivel: 3, texto: 'Fuerte' }
  if (variedad >= 2) return { nivel: 2, texto: 'Aceptable' }
  return { nivel: 1, texto: 'Débil: combina letras, números o símbolos' }
}
