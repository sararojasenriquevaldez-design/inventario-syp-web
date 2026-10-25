import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { MenuLateral } from './menu-lateral'
import { SidebarProvider } from '@/componentes/ui/sidebar'
import { TooltipProvider } from '@/componentes/ui/tooltip'
import { establecerSesion, reiniciarSesionParaPruebas } from '@/lib/sesion'
import { usuarioDemo } from '@/pruebas/falsos'

beforeAll(() => {
  // jsdom no trae matchMedia (lo usa el Sidebar para detectar móvil).
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: false, media: consulta, addEventListener: () => {}, removeEventListener: () => {},
  }))
})

afterEach(() => reiniciarSesionParaPruebas())

function renderizar(roles: string[]) {
  establecerSesion('token-demo', usuarioDemo(roles))
  const router = createMemoryRouter(
    [{ path: '/inventario/*', element: <TooltipProvider><SidebarProvider><MenuLateral /></SidebarProvider></TooltipProvider> }],
    { initialEntries: ['/inventario/kardex'] },
  )
  render(<RouterProvider router={router} />)
  return within(screen.getByRole('navigation', { name: 'Secciones del módulo' }))
}

describe('menú lateral según el rol', () => {
  it('CONSULTA no ve operaciones de escritura ni administración', () => {
    const menu = renderizar(['inventario:CONSULTA'])
    expect(menu.getByRole('link', { name: 'Kardex' })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Comprobantes' })).toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Compra' })).not.toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Merma' })).not.toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Excel contadora' })).not.toBeInTheDocument()
    expect(menu.queryByText('Administración')).not.toBeInTheDocument()
  })

  it('ASISTENTE registra compras y ventas, pero no mermas ni ajustes', () => {
    const menu = renderizar(['inventario:ASISTENTE'])
    expect(menu.getByRole('link', { name: 'Compra' })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Venta' })).toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Merma' })).not.toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Ajuste' })).not.toBeInTheDocument()
  })

  it('CONTADOR ve Configuración y Paridad, pero no Usuarios ni Respaldo', () => {
    const menu = renderizar(['inventario:CONTADOR'])
    expect(menu.getByRole('link', { name: 'Configuración' })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Paridad con Excel' })).toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
    expect(menu.queryByRole('link', { name: 'Respaldo' })).not.toBeInTheDocument()
  })

  it('ADMIN ve todo y la página actual queda marcada', () => {
    const menu = renderizar(['inventario:ADMIN'])
    expect(menu.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Auditoría' })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: 'Kardex' })).toHaveAttribute('aria-current', 'page')
  })
})
