import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { Proveedores } from './app/proveedores'
import { router } from './app/router'
import './estilos/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Proveedores>
      <RouterProvider router={router} />
    </Proveedores>
  </StrictMode>,
)
