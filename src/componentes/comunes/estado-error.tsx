// Error de una carga (docs/UI-UX.md §4 y §6): ícono + mensaje en español + "Reintentar".
import { CircleAlertIcon, RotateCwIcon } from 'lucide-react'
import { Button } from '@/componentes/ui/button'

export function EstadoError({ mensaje, alReintentar }: { mensaje: string; alReintentar?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-md border border-destructive p-3 text-sm text-destructive">
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1">{mensaje}</p>
      {alReintentar && (
        <Button type="button" variant="outline" size="sm" onClick={alReintentar}>
          <RotateCwIcon aria-hidden="true" />
          Reintentar
        </Button>
      )}
    </div>
  )
}
