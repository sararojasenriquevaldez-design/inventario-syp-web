// Exige sesión y rol (docs/UI-UX.md §3). Sin permiso: vuelve a /inventario con el aviso.
import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { toast } from 'sonner'
import { RAIZ_MODULO } from './paginas'
import { tieneAlgunRol, type Rol } from '@/lib/roles'
import { useSesion } from '@/lib/sesion'

export const AVISO_SIN_PERMISO = 'No tienes permiso para ver esa página'

function RedirigirSinPermiso() {
  useEffect(() => {
    toast.warning(AVISO_SIN_PERMISO, { id: 'sin-permiso' })
  }, [])
  return <Navigate to={RAIZ_MODULO} replace />
}

type Props = {
  children: ReactNode
  /** Roles que pueden ver; sin roles basta con tener sesión. */
  roles?: readonly Rol[]
  /** /cambiar-password: se permite aunque deba cambiar la contraseña. */
  permitirCambioPendiente?: boolean
}

export function RutaProtegida({ children, roles, permitirCambioPendiente = false }: Props) {
  const { estado, usuario } = useSesion()
  const ubicacion = useLocation()

  // El arranque (RaizApp) aún verifica la sesión: no decidir todavía.
  if (estado === 'verificando') return null
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  if (usuario.debeCambiarPassword && !permitirCambioPendiente) return <Navigate to="/cambiar-password" replace />
  if (roles && !tieneAlgunRol('inventario', roles, usuario.roles)) return <RedirigirSinPermiso />
  return <>{children}</>
}
