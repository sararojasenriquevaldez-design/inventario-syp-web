import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { toast } from 'sonner'
import { AVISO_SIN_PERMISO, RutaProtegida } from './ruta-protegida'
import { A_C } from '@/lib/roles'
import { establecerSesion, limpiarSesion, reiniciarSesionParaPruebas } from '@/lib/sesion'
import { usuarioDemo } from '@/pruebas/falsos'

vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }))

function renderizar(ruta: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>Pantalla de login</p> },
      { path: '/cambiar-password', element: <p>Pantalla de cambio</p> },
      { path: '/inventario', element: <RutaProtegida><p>Pantalla de inicio</p></RutaProtegida> },
      { path: '/inventario/periodos/cierre-anual', element: <RutaProtegida roles={A_C}><p>Cierre anual</p></RutaProtegida> },
    ],
    { initialEntries: [ruta] },
  )
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => {
  reiniciarSesionParaPruebas()
  vi.clearAllMocks()
})

describe('RutaProtegida', () => {
  it('sin sesión lleva a /login recordando la página pedida', async () => {
    limpiarSesion()
    const router = renderizar('/inventario/periodos/cierre-anual')
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ desde: '/inventario/periodos/cierre-anual' })
  })

  it('mientras se verifica la sesión no decide nada', () => {
    renderizar('/inventario')
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
    expect(screen.queryByText('Pantalla de inicio')).not.toBeInTheDocument()
  })

  it('con el rol correcto muestra la página', async () => {
    establecerSesion('token-demo', usuarioDemo(['inventario:CONTADOR']))
    renderizar('/inventario/periodos/cierre-anual')
    expect(await screen.findByText('Cierre anual')).toBeInTheDocument()
  })

  it('CONSULTA sin permiso vuelve a /inventario con el aviso', async () => {
    establecerSesion('token-demo', usuarioDemo(['inventario:CONSULTA']))
    renderizar('/inventario/periodos/cierre-anual')
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument()
    expect(toast.warning).toHaveBeenCalledWith(AVISO_SIN_PERMISO, { id: 'sin-permiso' })
  })

  it('si debe cambiar la contraseña no deja navegar', async () => {
    establecerSesion('token-demo', usuarioDemo(['inventario:ADMIN'], true))
    renderizar('/inventario')
    expect(await screen.findByText('Pantalla de cambio')).toBeInTheDocument()
  })
})
