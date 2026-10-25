// Iniciar sesión (docs/UI-UX.md §5.1).
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { CircleAlertIcon } from 'lucide-react'
import { CampoPassword } from './campo-password'
import { esquemaLogin, type FormularioLogin } from './esquemas'
import { iniciarSesion } from '@/api/auth'
import { RAIZ_MODULO } from '@/app/paginas'
import { useTituloPagina } from '@/app/titulo-pagina'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/componentes/ui/field'
import { Input } from '@/componentes/ui/input'
import { Spinner } from '@/componentes/ui/spinner'
import { mensajeDeError } from '@/lib/errores'
import { useSesion } from '@/lib/sesion'

/** Solo se vuelve a rutas internas del módulo (nunca a una URL externa). */
function destinoSeguro(desde: unknown): string {
  return typeof desde === 'string' && desde.startsWith(`${RAIZ_MODULO}`) ? desde : RAIZ_MODULO
}

export function PaginaLogin() {
  useTituloPagina('Iniciar sesión')
  const { usuario } = useSesion()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const destino = destinoSeguro((ubicacion.state as { desde?: unknown } | null)?.desde)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormularioLogin>({ resolver: zodResolver(esquemaLogin), defaultValues: { email: '', password: '' } })

  if (usuario) {
    return <Navigate to={usuario.debeCambiarPassword ? '/cambiar-password' : destino} replace />
  }

  const enviar = handleSubmit(async (datos) => {
    setErrorEnvio(null)
    try {
      const nuevo = await iniciarSesion(datos)
      navegar(nuevo.debeCambiarPassword ? '/cambiar-password' : destino, { replace: true })
    } catch (error) {
      setErrorEnvio(mensajeDeError(error))
    }
  })

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Sistema de Inventario S&amp;P</h1>
          </CardTitle>
          <CardDescription>Ingresa con tu correo y contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Correo</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                <FieldError id="email-error" errors={[errors.email]} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <CampoPassword
                  id="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <FieldError id="password-error" errors={[errors.password]} />
              </Field>

              {errorEnvio && (
                <div role="alert" className="flex gap-2 rounded-md border border-destructive p-3 text-sm text-destructive">
                  <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p>{errorEnvio}</p>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner aria-hidden="true" />}
                {isSubmitting ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
