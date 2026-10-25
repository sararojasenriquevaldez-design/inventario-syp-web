// Inicio del módulo. En el Sprint 12 se convierte en el Dashboard (docs/UI-UX.md §5.2).
import { useSesion } from '@/lib/sesion'

export function PaginaInicio() {
  const { usuario } = useSesion()
  return (
    <section aria-labelledby="titulo-pagina" className="flex flex-col gap-2">
      <h1 id="titulo-pagina" className="text-xl font-semibold">Inicio</h1>
      <p className="text-muted-foreground">
        Hola, {usuario?.nombre}. Usa el menú de la izquierda para ir a cada sección; el resumen del inventario se
        mostrará aquí.
      </p>
    </section>
  )
}
