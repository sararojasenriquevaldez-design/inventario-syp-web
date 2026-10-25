// Lugar de las pantallas que todavía no se implementan (se reemplaza en su sprint).
import { ConstructionIcon } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/componentes/ui/empty'

export function EnConstruccion({ titulo, sprint }: { titulo: string; sprint: number }) {
  return (
    <section aria-labelledby="titulo-pagina" className="flex flex-col gap-6">
      <h1 id="titulo-pagina" className="text-xl font-semibold">{titulo}</h1>
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ConstructionIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>En construcción</EmptyTitle>
          <EmptyDescription>Esta pantalla se implementa en el Sprint {sprint}.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </section>
  )
}
