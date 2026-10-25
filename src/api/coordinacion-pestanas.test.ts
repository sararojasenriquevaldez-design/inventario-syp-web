import { afterEach, describe, expect, it, vi } from 'vitest'
import { crearCoordinador, VIGENCIA_CANDADO_MS } from './coordinacion-pestanas'
import { crearBusCanales, crearLocksFalsos } from '@/pruebas/falsos'

const pausa = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

/** Tarea que registra cuántas se ejecutan a la vez. */
function contador() {
  const estado = { activas: 0, max: 0, hechas: 0 }
  const tarea = async () => {
    estado.activas += 1
    estado.max = Math.max(estado.max, estado.activas)
    await pausa(20)
    estado.activas -= 1
    estado.hechas += 1
    return estado.hechas
  }
  return { estado, tarea }
}

afterEach(() => vi.useRealTimers())

describe('coordinación del refresh entre pestañas', () => {
  it('con Web Locks las tareas de varias pestañas no se cruzan', async () => {
    const locks = crearLocksFalsos()
    const bus = crearBusCanales()
    const pestanas = [1, 2, 3].map(() => crearCoordinador({ locks, crearCanal: bus.crearCanal }))
    const { estado, tarea } = contador()

    await Promise.all(pestanas.map((c) => c.conCandado(tarea)))

    expect(estado.max).toBe(1)
    expect(estado.hechas).toBe(3)
    expect(bus.enviados).toEqual([{ tipo: 'refresh-terminado' }, { tipo: 'refresh-terminado' }, { tipo: 'refresh-terminado' }])
  })

  it('con el candado de respaldo (solo BroadcastChannel) tampoco se cruzan, aunque pidan a la vez', async () => {
    const bus = crearBusCanales()
    const pestanas = [1, 2, 3].map(() => crearCoordinador({ locks: null, crearCanal: bus.crearCanal }))
    const { estado, tarea } = contador()

    await Promise.all(pestanas.map((c) => c.conCandado(tarea)))

    expect(estado.max).toBe(1)
    expect(estado.hechas).toBe(3)
  })

  it('libera el candado de respaldo aunque la tarea falle', async () => {
    const bus = crearBusCanales()
    const a = crearCoordinador({ locks: null, crearCanal: bus.crearCanal })
    const b = crearCoordinador({ locks: null, crearCanal: bus.crearCanal })

    await expect(a.conCandado(() => Promise.reject(new Error('sin red')))).rejects.toThrow('sin red')
    await expect(b.conCandado(() => Promise.resolve('ok'))).resolves.toBe('ok')
  })

  it('si la pestaña que tenía el candado se cerró, las demás siguen al vencer su vigencia', async () => {
    vi.useFakeTimers()
    const bus = crearBusCanales()
    const b = crearCoordinador({ locks: null, crearCanal: bus.crearCanal })
    // Otra pestaña anunció su refresh y se cerró sin avisar que terminó.
    const fantasma = bus.crearCanal('inventario-syp:sesion')
    fantasma.postMessage({ tipo: 'refresh-iniciado', id: 'pestana-cerrada' })
    fantasma.close()
    await vi.advanceTimersByTimeAsync(0)

    let hecho = false
    const promesa = b.conCandado(async () => {
      hecho = true
    })
    await vi.advanceTimersByTimeAsync(VIGENCIA_CANDADO_MS - 1_000)
    expect(hecho).toBe(false)
    await vi.advanceTimersByTimeAsync(2_000)
    await promesa
    expect(hecho).toBe(true)
  })

  it('sin Web Locks ni BroadcastChannel ejecuta la tarea directamente', async () => {
    const c = crearCoordinador({ locks: null, crearCanal: null })
    await expect(c.conCandado(() => Promise.resolve(42))).resolves.toBe(42)
    expect(() => c.avisarLogout()).not.toThrow()
  })

  it('el aviso de logout llega a las otras pestañas y solo dice "logout"', async () => {
    const bus = crearBusCanales()
    const a = crearCoordinador({ locks: null, crearCanal: bus.crearCanal })
    const b = crearCoordinador({ locks: null, crearCanal: bus.crearCanal })
    const oyente = vi.fn()
    b.alRecibirLogout(oyente)

    a.avisarLogout()
    await vi.waitFor(() => expect(oyente).toHaveBeenCalledOnce())
    expect(bus.enviados).toEqual([{ tipo: 'logout' }])
  })
})
