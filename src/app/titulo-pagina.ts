import { useEffect } from 'react'

export const NOMBRE_APP = 'Inventario S&P'

/** Título único por página (docs/UI-UX.md §7): "Kardex · Inventario S&P". */
export function useTituloPagina(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · ${NOMBRE_APP}`
  }, [titulo])
}
