// Coordinación del refresh ENTRE PESTAÑAS.
//
// Por qué: la cookie de refresh es una sola para todas las pestañas y la API la rota en cada uso. Si dos pestañas
// envían a la vez la MISMA cookie, la API lo toma como reutilización (robo) y cierra la sesión. Por eso los refresh
// se hacen de uno en uno: la pestaña que espera, al obtener el candado, hace SU propio refresh con la cookie ya
// rotada (es secuencial, no reutilización).
//
// Cada pestaña guarda solo SU access token en memoria: el token NUNCA viaja por el canal. Por el BroadcastChannel
// solo pasan avisos sin secretos: "refresh-terminado", "logout" (cierra la sesión en todas) y, solo en el candado
// de respaldo, "refresh-iniciado" con un id aleatorio de la pestaña.
//
// Candado: navigator.locks (Web Locks API) si existe; si no, un candado con BroadcastChannel; si tampoco existe,
// solo el single-flight dentro de la pestaña.

export const NOMBRE_CANDADO = 'inventario-syp:refresh'
export const NOMBRE_CANAL = 'inventario-syp:sesion'

/** Lo único que viaja entre pestañas. Sin tokens ni datos del usuario. */
export type MensajeCanal =
  | { tipo: 'refresh-iniciado'; id: string }
  | { tipo: 'refresh-terminado'; id?: string }
  | { tipo: 'logout' }

type Locks = { request<T>(nombre: string, callback: () => Promise<T>): Promise<T> }
type Canal = {
  postMessage(mensaje: MensajeCanal): void
  onmessage: ((evento: MessageEvent<MensajeCanal>) => void) | null
  close(): void
}

export type DependenciasCoordinador = {
  locks: Locks | null
  crearCanal: ((nombre: string) => Canal) | null
}

export interface Coordinador {
  /** Ejecuta `fn` sin que otra pestaña esté haciendo un refresh al mismo tiempo. */
  conCandado<T>(fn: () => Promise<T>): Promise<T>
  avisarLogout(): void
  alRecibirLogout(oyente: () => void): () => void
  cerrar(): void
}

/** Tiempo máximo que se respeta el candado de otra pestaña (por si se cerró a mitad del refresh). */
export const VIGENCIA_CANDADO_MS = 30_000
/** Ventana para detectar que otra pestaña pidió el candado al mismo tiempo. */
export const VENTANA_EMPATE_MS = 50

function dependenciasDelNavegador(): DependenciasCoordinador {
  const locks = typeof navigator !== 'undefined' && 'locks' in navigator ? (navigator.locks as Locks) : null
  const crearCanal = typeof BroadcastChannel === 'function'
    ? (nombre: string) => new BroadcastChannel(nombre) as unknown as Canal
    : null
  return { locks, crearCanal }
}

const idAleatorio = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`

export function crearCoordinador(dependencias: DependenciasCoordinador = dependenciasDelNavegador()): Coordinador {
  const { locks, crearCanal } = dependencias
  const canal = crearCanal ? crearCanal(NOMBRE_CANAL) : null
  const oyentesLogout = new Set<() => void>()

  // Candado de respaldo: refresh en curso de OTRAS pestañas (id → vence en) y quién espera a que terminen.
  const ocupados = new Map<string, number>()
  let despertarEsperas: Array<() => void> = []

  const liberarEsperas = () => {
    const esperas = despertarEsperas
    despertarEsperas = []
    for (const despertar of esperas) despertar()
  }

  if (canal) {
    canal.onmessage = (evento) => {
      const mensaje = evento.data
      if (mensaje.tipo === 'logout') {
        for (const oyente of oyentesLogout) oyente()
      } else if (mensaje.tipo === 'refresh-iniciado') {
        ocupados.set(mensaje.id, Date.now() + VIGENCIA_CANDADO_MS)
      } else if (mensaje.tipo === 'refresh-terminado') {
        if (mensaje.id) ocupados.delete(mensaje.id)
        liberarEsperas()
      }
    }
  }

  const enviar = (mensaje: MensajeCanal) => canal?.postMessage(mensaje)

  const dormir = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms))

  /** Espera a que otra pestaña avise "refresh-terminado" (o a que venza su candado). */
  const esperarLiberacion = () => {
    const ahora = Date.now()
    for (const [id, vence] of ocupados) if (vence <= ahora) ocupados.delete(id)
    if (ocupados.size === 0) return Promise.resolve()
    const vencimiento = Math.min(...ocupados.values()) - ahora
    return Promise.race([new Promise<void>((resolver) => despertarEsperas.push(resolver)), dormir(vencimiento)])
  }

  async function conCandadoDeRespaldo<T>(fn: () => Promise<T>): Promise<T> {
    const miId = idAleatorio()
    for (;;) {
      while (ocupados.size > 0) await esperarLiberacion()
      enviar({ tipo: 'refresh-iniciado', id: miId })
      await dormir(VENTANA_EMPATE_MS)
      // Empate: si otra pestaña pidió el candado a la vez, gana el id menor; la otra se retira y espera.
      const pierdo = [...ocupados.keys()].some((otro) => otro < miId)
      if (!pierdo) break
      enviar({ tipo: 'refresh-terminado', id: miId })
    }
    try {
      return await fn()
    } finally {
      enviar({ tipo: 'refresh-terminado', id: miId })
    }
  }

  return {
    async conCandado(fn) {
      if (locks) {
        return locks.request(NOMBRE_CANDADO, async () => {
          try {
            return await fn()
          } finally {
            enviar({ tipo: 'refresh-terminado' })
          }
        })
      }
      if (canal) return conCandadoDeRespaldo(fn)
      return fn()
    },
    avisarLogout() {
      enviar({ tipo: 'logout' })
    },
    alRecibirLogout(oyente) {
      oyentesLogout.add(oyente)
      return () => oyentesLogout.delete(oyente)
    },
    cerrar() {
      canal?.close()
      oyentesLogout.clear()
    },
  }
}
