// React Router 8 en modo datos (docs/UI-UX.md §3). Todo el módulo cuelga de /inventario.
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { LayoutApp, type DatosRuta } from './layout/layout-app'
import { PaginaNoEncontrada } from './pagina-no-encontrada'
import { INICIO, PAGINAS_DEL_MODULO, RAIZ_MODULO } from './paginas'
import { RaizApp } from './raiz-app'
import { RutaProtegida } from './ruta-protegida'
import { EnConstruccion } from '@/componentes/comunes/en-construccion'
import { PaginaCambiarPassword } from '@/funcionalidades/auth/pagina-cambiar-password'
import { PaginaLogin } from '@/funcionalidades/auth/pagina-login'
import { PaginaInicio } from '@/funcionalidades/dashboard/pagina-inicio'
import { PaginaImportacion } from '@/funcionalidades/importacion/pagina-importacion'

const relativa = (ruta: string) => ruta.slice(RAIZ_MODULO.length + 1)

/** Pantallas ya implementadas, por ruta completa. Las demás muestran "En construcción". */
const PANTALLAS: Record<string, ReactNode> = {
  [`${RAIZ_MODULO}/configuracion/importacion`]: <PaginaImportacion />,
}

export const rutas: RouteObject[] = [
  {
    element: <RaizApp />,
    children: [
      { path: '/login', element: <PaginaLogin /> },
      {
        path: '/cambiar-password',
        element: (
          <RutaProtegida permitirCambioPendiente>
            <PaginaCambiarPassword />
          </RutaProtegida>
        ),
      },
      { path: '/', element: <Navigate to={RAIZ_MODULO} replace /> },
      {
        path: RAIZ_MODULO,
        element: (
          <RutaProtegida>
            <LayoutApp />
          </RutaProtegida>
        ),
        children: [
          {
            index: true,
            handle: { titulo: INICIO.titulo } satisfies DatosRuta,
            element: <RutaProtegida roles={INICIO.roles}><PaginaInicio /></RutaProtegida>,
          },
          ...PAGINAS_DEL_MODULO.map((pagina) => ({
            path: relativa(pagina.ruta),
            handle: { titulo: pagina.titulo } satisfies DatosRuta,
            element: (
              <RutaProtegida roles={pagina.roles}>
                {PANTALLAS[pagina.ruta] ?? <EnConstruccion titulo={pagina.titulo} sprint={pagina.sprint} />}
              </RutaProtegida>
            ),
          })),
        ],
      },
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
]

export const router = createBrowserRouter(rutas)
