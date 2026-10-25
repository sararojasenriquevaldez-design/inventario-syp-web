// Proveedores globales: datos del servidor (TanStack Query), tema, tooltips y notificaciones.
import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProveedorTema } from './proveedor-tema'
import { Toaster } from '@/componentes/ui/sonner'
import { TooltipProvider } from '@/componentes/ui/tooltip'
import { ErrorApi } from '@/lib/errores'

function crearClienteConsultas() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // El cliente de la API ya reintenta ante el servidor dormido; los errores de la API no se repiten.
        retry: (fallos, error) => !(error instanceof ErrorApi) && fallos < 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  })
}

export function Proveedores({ children }: { children: ReactNode }) {
  const [clienteConsultas] = useState(crearClienteConsultas)
  return (
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorTema>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="top-right" closeButton />
        </TooltipProvider>
      </ProveedorTema>
    </QueryClientProvider>
  )
}
