// Confirmación antes de una acción con efecto (docs/UI-UX.md §4): repite qué va a pasar. El motivo llega en el S8.
// Se abre controlado (sin AlertDialogTrigger), así que Radix no sabe a dónde devolver el foco: lo indica
// `focoAlCerrar` (normalmente el botón que lo abrió, docs/UI-UX.md §7).
import type { ReactNode, RefObject } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/componentes/ui/alert-dialog'

type Props = {
  abierto: boolean
  alCambiarAbierto: (abierto: boolean) => void
  titulo: string
  descripcion: ReactNode
  textoConfirmar: string
  alConfirmar: () => void
  focoAlCerrar?: RefObject<HTMLElement | null>
}

export function DialogoConfirmacion({
  abierto, alCambiarAbierto, titulo, descripcion, textoConfirmar, alConfirmar, focoAlCerrar,
}: Props) {
  return (
    <AlertDialog open={abierto} onOpenChange={alCambiarAbierto}>
      <AlertDialogContent
        onCloseAutoFocus={(evento) => {
          if (!focoAlCerrar?.current) return
          evento.preventDefault()
          focoAlCerrar.current.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={alConfirmar}>{textoConfirmar}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
