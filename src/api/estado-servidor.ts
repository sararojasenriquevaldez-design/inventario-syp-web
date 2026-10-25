// "Despertando el servidor…": cuántas peticiones están reintentando porque la API gratuita dormía.
// BannerServidor lo muestra mientras el contador sea mayor que cero.
import { useSyncExternalStore } from 'react'

let reintentando = 0
const oyentes = new Set<() => void>()

function avisar() {
  for (const oyente of oyentes) oyente()
}

export function empezarDespertar() {
  reintentando += 1
  if (reintentando === 1) avisar()
}

export function terminarDespertar() {
  reintentando = Math.max(0, reintentando - 1)
  if (reintentando === 0) avisar()
}

export const estaDespertando = () => reintentando > 0

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function useDespertando(): boolean {
  return useSyncExternalStore(suscribir, estaDespertando, estaDespertando)
}
