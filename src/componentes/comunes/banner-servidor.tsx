// "Conectando con el servidor…" mientras el cliente reintenta porque la API gratuita dormía (docs/UI-UX.md §6).
import { ServerIcon } from 'lucide-react'
import { useDespertando } from '@/api/estado-servidor'

export function BannerServidor() {
  const despertando = useDespertando()
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-0 z-50">
      {despertando && (
        <div className="border-b border-warning bg-card text-foreground shadow-sm">
          <p className="flex items-center justify-center gap-2 px-4 py-2 text-sm">
            <ServerIcon aria-hidden="true" className="size-4 text-warning" />
            Conectando con el servidor… (puede tardar hasta 1 minuto)
          </p>
          <div className="h-1 overflow-hidden bg-muted" aria-hidden="true">
            <div className="h-full w-1/3 animate-pulse bg-warning motion-reduce:animate-none" />
          </div>
        </div>
      )}
    </div>
  )
}
