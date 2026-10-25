import { Link } from 'react-router'
import { RAIZ_MODULO } from './paginas'
import { useTituloPagina } from './titulo-pagina'
import { Button } from '@/componentes/ui/button'

export function PaginaNoEncontrada() {
  useTituloPagina('Página no encontrada')
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground">La dirección no existe o cambió.</p>
      <Button asChild>
        <Link to={RAIZ_MODULO}>Ir al inicio</Link>
      </Button>
    </main>
  )
}
