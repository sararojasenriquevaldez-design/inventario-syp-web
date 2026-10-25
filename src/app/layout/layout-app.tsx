// Estructura del módulo (docs/UI-UX.md §3): menú lateral + barra superior + contenido.
import { Outlet, useMatches } from 'react-router'
import { useTituloPagina } from '../titulo-pagina'
import { Encabezado } from './encabezado'
import { MenuLateral } from './menu-lateral'
import { SidebarInset, SidebarProvider } from '@/componentes/ui/sidebar'

export type DatosRuta = { titulo: string }

const tieneTitulo = (handle: unknown): handle is DatosRuta =>
  typeof handle === 'object' && handle !== null && typeof (handle as DatosRuta).titulo === 'string'

export function LayoutApp() {
  const coincidencias = useMatches()
  const titulo = [...coincidencias].reverse().map((c) => c.handle).find(tieneTitulo)?.titulo ?? 'Inicio'
  useTituloPagina(titulo)

  return (
    <SidebarProvider>
      <MenuLateral />
      <SidebarInset>
        <Encabezado titulo={titulo} />
        <main id="contenido" className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
