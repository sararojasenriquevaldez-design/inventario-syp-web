// Menú lateral (240 px, plegable a íconos) filtrado por rol: lo que el usuario no puede ver no aparece.
import { NavLink, useLocation } from 'react-router'
import { BoxIcon } from 'lucide-react'
import { GRUPOS_MENU, RAIZ_MODULO } from '../paginas'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/componentes/ui/sidebar'
import { tieneAlgunRol } from '@/lib/roles'
import { useSesion } from '@/lib/sesion'

export function MenuLateral() {
  const { usuario } = useSesion()
  const { pathname } = useLocation()
  const roles = usuario?.roles ?? []

  const grupos = GRUPOS_MENU
    .map((grupo) => ({ ...grupo, paginas: grupo.paginas.filter((p) => tieneAlgunRol('inventario', p.roles, roles)) }))
    .filter((grupo) => grupo.paginas.length > 0)

  return (
    <Sidebar collapsible="icon" aria-label="Menú principal">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Inventario S&P">
              <NavLink to={RAIZ_MODULO}>
                <BoxIcon aria-hidden="true" className="text-primary" />
                <span className="font-semibold">Inventario S&amp;P</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Secciones del módulo">
          {grupos.map((grupo) => (
            <SidebarGroup key={grupo.titulo}>
              {grupo.titulo !== 'Inicio' && <SidebarGroupLabel>{grupo.titulo}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {grupo.paginas.map((pagina) => {
                    const activa = pagina.ruta === RAIZ_MODULO
                      ? pathname === RAIZ_MODULO
                      : pathname === pagina.ruta || pathname.startsWith(`${pagina.ruta}/`)
                    const Icono = pagina.icono
                    return (
                      <SidebarMenuItem key={pagina.ruta}>
                        <SidebarMenuButton asChild isActive={activa} tooltip={pagina.titulo}>
                          <NavLink to={pagina.ruta} end aria-current={activa ? 'page' : undefined}>
                            <Icono aria-hidden="true" />
                            <span>{pagina.titulo}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
