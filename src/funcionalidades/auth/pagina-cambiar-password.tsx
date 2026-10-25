// Cambiar contraseña (docs/UI-UX.md §5.1). Obligatoria si debeCambiarPassword: no deja navegar hasta cambiarla.
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { CircleAlertIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CampoPassword } from './campo-password'
import { esquemaCambioPassword, evaluarPassword, type FormularioCambioPassword } from './esquemas'
import { cambiarPassword, cerrarSesion } from '@/api/auth'
import { RAIZ_MODULO } from '@/app/paginas'
import { useTituloPagina } from '@/app/titulo-pagina'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/componentes/ui/field'
import { Spinner } from '@/componentes/ui/spinner'
import { mensajeDeError } from '@/lib/errores'
import { useSesion } from '@/lib/sesion'

const CLASE_NIVEL = ['bg-destructive', 'bg-warning', 'bg-primary', 'bg-success'] as const

function IndicadorPassword({ valor }: { valor: string }) {
  const { nivel, texto } = evaluarPassword(valor)
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 rounded-full ${i <= nivel && valor ? CLASE_NIVEL[nivel] : 'bg-muted'}`} />
        ))}
      </div>
      <p id="nueva-nivel" className="text-xs text-muted-foreground" aria-live="polite">
        Seguridad: {valor ? texto : `mínimo 12 caracteres`}
      </p>
    </div>
  )
}

export function PaginaCambiarPassword() {
  useTituloPagina('Cambiar contraseña')
  const { usuario } = useSesion()
  const navegar = useNavigate()
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const obligatoria = !!usuario?.debeCambiarPassword

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormularioCambioPassword>({
    resolver: zodResolver(esquemaCambioPassword),
    defaultValues: { actual: '', nueva: '', repetir: '' },
  })
  const nueva = useWatch({ control, name: 'nueva' })

  const enviar = handleSubmit(async ({ actual, nueva: clave }) => {
    setErrorEnvio(null)
    try {
      await cambiarPassword({ actual, nueva: clave })
      toast.success('Contraseña actualizada')
      navegar(RAIZ_MODULO, { replace: true })
    } catch (error) {
      setErrorEnvio(mensajeDeError(error))
    }
  })

  const salir = async () => {
    await cerrarSesion()
    navegar('/login', { replace: true })
  }

  const describir = (campo: keyof FormularioCambioPassword, extra?: string) =>
    [errors[campo] ? `${campo}-error` : null, extra].filter(Boolean).join(' ') || undefined

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Cambiar contraseña</h1>
          </CardTitle>
          <CardDescription>
            {obligatoria
              ? 'Por seguridad, cambia tu contraseña temporal antes de continuar.'
              : 'Al cambiarla se cierran tus otras sesiones abiertas.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.actual}>
                <FieldLabel htmlFor="actual">Contraseña actual</FieldLabel>
                <CampoPassword
                  id="actual"
                  autoComplete="current-password"
                  autoFocus
                  aria-invalid={!!errors.actual}
                  aria-describedby={describir('actual')}
                  {...register('actual')}
                />
                <FieldError id="actual-error" errors={[errors.actual]} />
              </Field>
              <Field data-invalid={!!errors.nueva}>
                <FieldLabel htmlFor="nueva">Contraseña nueva</FieldLabel>
                <CampoPassword
                  id="nueva"
                  autoComplete="new-password"
                  aria-invalid={!!errors.nueva}
                  aria-describedby={describir('nueva', 'nueva-nivel')}
                  {...register('nueva')}
                />
                <IndicadorPassword valor={nueva} />
                <FieldError id="nueva-error" errors={[errors.nueva]} />
              </Field>
              <Field data-invalid={!!errors.repetir}>
                <FieldLabel htmlFor="repetir">Repite la contraseña nueva</FieldLabel>
                <CampoPassword
                  id="repetir"
                  autoComplete="new-password"
                  aria-invalid={!!errors.repetir}
                  aria-describedby={describir('repetir')}
                  {...register('repetir')}
                />
                <FieldDescription>Usa una frase larga que no uses en otros sitios.</FieldDescription>
                <FieldError id="repetir-error" errors={[errors.repetir]} />
              </Field>

              {errorEnvio && (
                <div role="alert" className="flex gap-2 rounded-md border border-destructive p-3 text-sm text-destructive">
                  <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p>{errorEnvio}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {obligatoria ? (
                  <Button type="button" variant="outline" onClick={() => void salir()}>Salir</Button>
                ) : (
                  <Button type="button" variant="outline" asChild>
                    <Link to={RAIZ_MODULO}>Volver</Link>
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Spinner aria-hidden="true" />}
                  {isSubmitting ? 'Guardando…' : 'Cambiar contraseña'}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
