// Dobles de prueba: Web Locks y BroadcastChannel compartidos entre "pestañas" simuladas, y respuestas HTTP.
import type { MensajeCanal } from '@/api/coordinacion-pestanas'

/** navigator.locks falso: un candado exclusivo por nombre, compartido por todas las pestañas de la prueba. */
export function crearLocksFalsos() {
  const colas = new Map<string, Promise<unknown>>()
  return {
    request<T>(nombre: string, callback: () => Promise<T>): Promise<T> {
      const previo = colas.get(nombre) ?? Promise.resolve()
      const actual = previo.then(() => callback())
      colas.set(nombre, actual.catch(() => undefined))
      return actual
    },
  }
}

/** BroadcastChannel falso: entrega a las OTRAS instancias del mismo nombre y guarda todo lo enviado. */
export function crearBusCanales() {
  const instancias = new Set<CanalFalso>()
  const enviados: MensajeCanal[] = []

  class CanalFalso {
    onmessage: ((evento: MessageEvent<MensajeCanal>) => void) | null = null
    readonly name: string
    constructor(nombre: string) {
      this.name = nombre
      instancias.add(this)
    }
    postMessage(mensaje: MensajeCanal) {
      // structuredClone como el navegador: solo viaja lo que se puede clonar.
      enviados.push(structuredClone(mensaje))
      for (const otra of instancias) {
        if (otra !== this && otra.name === this.name) {
          void Promise.resolve().then(() => otra.onmessage?.({ data: structuredClone(mensaje) } as MessageEvent<MensajeCanal>))
        }
      }
    }
    close() {
      instancias.delete(this)
    }
  }

  return { CanalFalso, enviados, crearCanal: (nombre: string) => new CanalFalso(nombre) }
}

export function respuestaJson(cuerpo: unknown, status = 200, encabezados: Record<string, string> = {}) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', ...encabezados },
  })
}

export const usuarioDemo = (roles: string[] = ['inventario:CONTADOR'], debeCambiarPassword = false) => ({
  id: '3f2b8c1e-5a4d-4e7f-9b6a-1c2d3e4f5a6b',
  email: 'contadora.demo@syp.invalid',
  nombre: 'Contadora (demo)',
  roles,
  debeCambiarPassword,
})

/** Instala (o quita) navigator.locks en jsdom. */
export function instalarLocks(locks: ReturnType<typeof crearLocksFalsos> | undefined) {
  Object.defineProperty(globalThis.navigator, 'locks', { value: locks, configurable: true })
  if (!locks) Reflect.deleteProperty(globalThis.navigator, 'locks')
}
