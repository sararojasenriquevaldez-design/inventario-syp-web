// Tema claro (por defecto) u oscuro: contexto y hook. El proveedor está en proveedor-tema.tsx.
import { createContext, useContext } from 'react'

export type Tema = 'light' | 'dark'

export type ContextoTema = { tema: Tema; alternarTema: () => void }

export const ContextoTemaReact = createContext<ContextoTema>({ tema: 'light', alternarTema: () => {} })

export function useTema() {
  return useContext(ContextoTemaReact)
}
