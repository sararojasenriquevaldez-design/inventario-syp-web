// Raíz de todas las rutas: conecta el cliente de la API con la navegación y recupera la sesión al abrir.
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { recuperarSesion } from '@/api/auth'
import { configurarCliente } from '@/api/cliente'
import { BannerServidor } from '@/componentes/comunes/banner-servidor'
import { Spinner } from '@/componentes/ui/spinner'
import { useSesion } from '@/lib/sesion'

// Una sola recuperación por carga de página (StrictMode monta dos veces en desarrollo).
let recuperacion: Promise<void> | null = null

export function RaizApp() {
  const navegar = useNavigate()
  const { estado } = useSesion()

  useEffect(() => {
    configurarCliente({
      alExpirarSesion: () => {
        toast.info('Tu sesión terminó. Vuelve a ingresar.', { id: 'sesion-terminada' })
        navegar('/login', { replace: true })
      },
      alRequerirCambioPassword: () => navegar('/cambiar-password', { replace: true }),
    })
    recuperacion ??= recuperarSesion()
  }, [navegar])

  return (
    <>
      <BannerServidor />
      {estado === 'verificando' ? (
        <div className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground">
          <Spinner />
          <span aria-hidden="true">Cargando…</span>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  )
}
