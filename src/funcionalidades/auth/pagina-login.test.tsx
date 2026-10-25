import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PaginaLogin } from './pagina-login'
import { iniciarSesion } from '@/api/auth'
import { ErrorApi } from '@/lib/errores'
import { establecerSesion, limpiarSesion, reiniciarSesionParaPruebas } from '@/lib/sesion'
import { usuarioDemo } from '@/pruebas/falsos'

vi.mock('@/api/auth', () => ({ iniciarSesion: vi.fn() }))
const iniciarSesionSimulado = vi.mocked(iniciarSesion)

function renderizar() {
  limpiarSesion()
  const router = createMemoryRouter(
    [
      { path: '/login', element: <PaginaLogin /> },
      { path: '/inventario', element: <p>Pantalla de inicio</p> },
      { path: '/cambiar-password', element: <p>Pantalla de cambio</p> },
    ],
    { initialEntries: ['/login'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => {
  reiniciarSesionParaPruebas()
  vi.clearAllMocks()
})

describe('Iniciar sesión', () => {
  it('muestra el formulario con etiquetas accesibles y el título de la página', () => {
    renderizar()
    expect(screen.getByRole('heading', { name: 'Sistema de Inventario S&P' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
    expect(document.title).toBe('Iniciar sesión · Inventario S&P')
  })

  it('valida en español antes de enviar', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Escribe tu correo.')).toBeInTheDocument()
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
    expect(iniciarSesionSimulado).not.toHaveBeenCalled()
  })

  it('el botón Mostrar alterna la visibilidad de la contraseña', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('con credenciales correctas entra al módulo', async () => {
    iniciarSesionSimulado.mockImplementation(async () => {
      establecerSesion('token-demo', usuarioDemo())
      return usuarioDemo()
    })
    const router = renderizar()
    await userEvent.type(screen.getByLabelText('Correo'), 'contadora.demo@syp.invalid')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'una-clave-de-ejemplo')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/inventario')
    expect(iniciarSesionSimulado).toHaveBeenCalledWith({ email: 'contadora.demo@syp.invalid', password: 'una-clave-de-ejemplo' })
  })

  it('si debe cambiar la contraseña va a Cambiar contraseña', async () => {
    iniciarSesionSimulado.mockImplementation(async () => {
      establecerSesion('token-demo', usuarioDemo(undefined, true))
      return usuarioDemo(undefined, true)
    })
    renderizar()
    await userEvent.type(screen.getByLabelText('Correo'), 'contadora.demo@syp.invalid')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-temporal-de-ejemplo')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Pantalla de cambio')).toBeInTheDocument()
  })

  it('CREDENCIALES_INVALIDAS muestra un único mensaje que no revela si el correo existe', async () => {
    iniciarSesionSimulado.mockRejectedValue(new ErrorApi(401, 'CREDENCIALES_INVALIDAS', ''))
    renderizar()
    await userEvent.type(screen.getByLabelText('Correo'), 'contadora.demo@syp.invalid')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Correo o contraseña incorrectos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.',
    )
  })

  it('429 muestra "Demasiados intentos"', async () => {
    iniciarSesionSimulado.mockRejectedValue(new ErrorApi(429, 'DEMASIADAS_SOLICITUDES', ''))
    renderizar()
    await userEvent.type(screen.getByLabelText('Correo'), 'contadora.demo@syp.invalid')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos seguidos')
  })

  it('deshabilita Ingresar mientras envía', async () => {
    let terminar: () => void = () => {}
    iniciarSesionSimulado.mockImplementation(() => new Promise((resolver) => {
      terminar = () => resolver(usuarioDemo())
    }))
    renderizar()
    await userEvent.type(screen.getByLabelText('Correo'), 'contadora.demo@syp.invalid')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'una-clave-de-ejemplo')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('button', { name: /Ingresando/ })).toBeDisabled()
    terminar()
  })
})
