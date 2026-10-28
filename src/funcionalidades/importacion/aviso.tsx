// Aviso que no es un error (ya cargado, demostración, la carga sigue en el servidor): ícono + título + texto.
import type { ReactNode } from 'react'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'

type Tono = 'info' | 'advertencia' | 'exito'

const ESTILO: Record<Tono, string> = {
  info: 'border-border',
  advertencia: 'border-warning',
  exito: 'border-success',
}

const ICONO: Record<Tono, ReactNode> = {
  info: <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />,
  advertencia: <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />,
  exito: <CircleCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />,
}

export function Aviso({ tono, titulo, children }: { tono: Tono; titulo: string; children?: ReactNode }) {
  return (
    <div role="status" className={`flex gap-3 rounded-md border p-3 text-sm ${ESTILO[tono]}`}>
      {ICONO[tono]}
      <div className="flex flex-col gap-1">
        <p className="font-medium">{titulo}</p>
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </div>
  )
}
