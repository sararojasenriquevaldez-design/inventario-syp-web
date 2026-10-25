// Aplica el tema con la clase .dark en <html>. Solo la preferencia del tema va a localStorage (nunca datos de sesión).
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ContextoTemaReact, type Tema } from './tema'

const CLAVE = 'inventario-syp:tema'

function temaGuardado(): Tema {
  try {
    return localStorage.getItem(CLAVE) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaGuardado)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    try {
      localStorage.setItem(CLAVE, tema)
    } catch {
      // Sin almacenamiento (modo privado): el tema dura lo que la pestaña.
    }
  }, [tema])

  const alternarTema = useCallback(() => setTema((actual) => (actual === 'dark' ? 'light' : 'dark')), [])
  const valor = useMemo(() => ({ tema, alternarTema }), [tema, alternarTema])
  return <ContextoTemaReact.Provider value={valor}>{children}</ContextoTemaReact.Provider>
}
