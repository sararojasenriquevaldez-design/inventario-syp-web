import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaginaImportacion } from './pagina-importacion'
import { cargarHistorico, verificarParidad, type FilaParidad, type Paridad, type ResultadoImportacion } from '@/api/importacion'
import { ErrorApi, SIN_RESPUESTA } from '@/lib/errores'

vi.mock('@/api/importacion', () => ({ cargarHistorico: vi.fn(), verificarParidad: vi.fn() }))
const cargarSimulado = vi.mocked(cargarHistorico)
const paridadSimulada = vi.mocked(verificarParidad)

// Solo datos ficticios (D-*): los códigos y cifras reales vienen de la API y nunca se escriben aquí.
const resultadoDemo: ResultadoImportacion = {
  loteId: '00000000-0000-4000-8000-000000000001',
  hashSha256: 'a'.repeat(64),
  resumen: {
    terceros: 4, saldosIniciales: 2, comprobantes: 7, movimientos: 11, controlTonelaje: 3, periodos: 5,
    kardexRecalculados: 2, alertas: { STOCK_NEGATIVO: 1 },
  },
}

const camino = (comparados: number, diferencias = 0) => ({ comparados, diferencias })
const fila = (anio: number, productoCodigo: string, difKardex = 0): FilaParidad => ({
  anio,
  productoCodigo,
  kardex: { guardado: camino(8, difKardex), motor: camino(8) },
  resumen: { guardado: camino(6), motor: camino(6) },
  libro: { guardado: { ...camino(8), nuevas: 0, resueltas: 0 }, motor: { ...camino(8), nuevas: 0, resueltas: 0 } },
})

const paridadDemo = (cambios: Partial<Paridad> = {}): Paridad => ({
  filas: [fila(2024, 'D-PRODUCTO-1'), fila(2024, 'D-PRODUCTO-2')],
  asientos: [{ anio: 2024, asientos: { guardado: camino(4), motor: camino(4) } }],
  maxima: { guardado: '0', motor: '0' },
  alertas: {},
  detalle: [],
  totalDiferencias: 0,
  ...cambios,
})

function renderizar() {
  const clienteConsultas = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={clienteConsultas}>
      <PaginaImportacion />
    </QueryClientProvider>,
  )
}

const botonCargar = () => screen.getByRole('button', { name: 'Cargar histórico 2024–2026' })
const botonParidad = () => screen.getByRole('button', { name: 'Verificar paridad' })

async function confirmarCarga() {
  await userEvent.click(botonCargar())
  const dialogo = await screen.findByRole('alertdialog')
  await userEvent.click(within(dialogo).getByRole('button', { name: 'Cargar histórico' }))
}

afterEach(() => vi.clearAllMocks())

describe('Importación y paridad', () => {
  it('pide confirmación antes de cargar y Cancelar no llama a la API', async () => {
    renderizar()
    expect(document.title).toBe('Importación y paridad · Inventario S&P')
    await userEvent.click(botonCargar())
    const dialogo = await screen.findByRole('alertdialog', { name: '¿Cargar el histórico 2024–2026?' })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(botonCargar()).toHaveFocus()
    expect(cargarSimulado).not.toHaveBeenCalled()
  })

  it('201: muestra el resumen de lo cargado', async () => {
    cargarSimulado.mockResolvedValue(resultadoDemo)
    renderizar()
    await confirmarCarga()
    expect(await screen.findByRole('heading', { name: 'Histórico cargado' })).toBeInTheDocument()
    expect(screen.getByText('Comprobantes').nextElementSibling).toHaveTextContent('7')
    expect(screen.getByText('Movimientos').nextElementSibling).toHaveTextContent('11')
    expect(screen.getByText('Periodos creados (abiertos)').nextElementSibling).toHaveTextContent('5')
    expect(screen.getByText('Kardex recalculados (producto × año)').nextElementSibling).toHaveTextContent('2')
    expect(screen.getByText('STOCK_NEGATIVO')).toBeInTheDocument()
    expect(cargarSimulado).toHaveBeenCalledTimes(1)
  })

  it('mientras carga, los dos botones quedan bloqueados sin perder el foco y el final se anuncia', async () => {
    let terminar: (valor: ResultadoImportacion) => void = () => {}
    cargarSimulado.mockImplementation(() => new Promise((resolver) => { terminar = resolver }))
    renderizar()
    await confirmarCarga()
    const botonOcupado = await screen.findByRole('button', { name: /Cargando histórico/ })
    expect(botonOcupado).toHaveAttribute('aria-disabled', 'true')
    expect(botonOcupado).toHaveFocus()
    expect(botonParidad()).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText(/Puede tardar de 1 a 3 minutos/)).toBeInTheDocument()
    await userEvent.click(botonParidad())
    await userEvent.keyboard('{Enter}')
    expect(paridadSimulada).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    terminar(resultadoDemo)
    expect(await screen.findByRole('heading', { name: 'Histórico cargado' })).toBeInTheDocument()
    expect(botonCargar()).toHaveAttribute('aria-disabled', 'false')
    expect(screen.getByText('Terminó la carga del histórico.')).toBeInTheDocument()
  })

  it('409 HISTORICO_YA_CARGADO: aviso informativo, no error', async () => {
    cargarSimulado.mockRejectedValue(new ErrorApi(409, 'HISTORICO_YA_CARGADO', ''))
    renderizar()
    await confirmarCarga()
    expect(await screen.findByText('El histórico ya estaba cargado')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('no duplica')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('409 NO_DISPONIBLE_EN_DEMO al cargar: aviso de demostración', async () => {
    cargarSimulado.mockRejectedValue(new ErrorApi(409, 'NO_DISPONIBLE_EN_DEMO', ''))
    renderizar()
    await confirmarCarga()
    expect(await screen.findByText('No disponible en la base de demostración')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('502/504 o tiempo agotado al cargar: avisa que puede seguir en el servidor, sin error genérico', async () => {
    cargarSimulado.mockRejectedValue(new ErrorApi(0, SIN_RESPUESTA, 'El servidor no respondió a tiempo.'))
    renderizar()
    await confirmarCarga()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'La carga puede seguir procesándose en el servidor. Espera 2–3 minutos y pulsa «Verificar paridad»; si vuelves a pulsar «Cargar histórico» y ya terminó, verás «El histórico ya estaba cargado» (no se duplica).',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('otro error al cargar: mensaje en español y Reintentar vuelve a pedir confirmación', async () => {
    cargarSimulado.mockRejectedValue(new ErrorApi(500, 'ERROR_INTERNO', '', undefined, 'req-demo-1'))
    renderizar()
    await confirmarCarga()
    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
  })

  it('paridad con 0 diferencias: tabla por año y producto y todo coincide', async () => {
    paridadSimulada.mockResolvedValue(paridadDemo())
    renderizar()
    await userEvent.click(botonParidad())
    expect(await screen.findByText('Paridad completa: 0 diferencias')).toBeInTheDocument()
    expect(screen.getByText('Terminó la verificación de paridad: todo coincide.')).toBeInTheDocument()
    expect(screen.getAllByText('0.000000')).toHaveLength(2)
    const tabla = screen.getByRole('table')
    expect(within(tabla).getByRole('rowheader', { name: '2024 · D-PRODUCTO-1' })).toBeInTheDocument()
    expect(within(tabla).getAllByText('Coincide')).toHaveLength(2)
    expect(screen.getByText(/Asientos 2024: 4 comparados/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Detalle de las diferencias' })).not.toBeInTheDocument()
    expect(cargarSimulado).not.toHaveBeenCalled()
  })

  it('paridad con diferencias: marca la fila, la máxima con 6 decimales y el detalle', async () => {
    paridadSimulada.mockResolvedValue(paridadDemo({
      filas: [fila(2024, 'D-PRODUCTO-1'), fila(2025, 'D-PRODUCTO-2', 2)],
      maxima: { guardado: '0.0100', motor: '2.58e-10' },
      detalle: ['2025 D-PRODUCTO-2 orden 3 saldoCantidad', '2025 D-PRODUCTO-2 orden 4 saldoCantidad'],
      totalDiferencias: 2,
    }))
    renderizar()
    await userEvent.click(botonParidad())
    expect(await screen.findByRole('alert')).toHaveTextContent('Se encontraron 2 diferencias')
    const filaConDiferencia = screen.getByRole('rowheader', { name: '2025 · D-PRODUCTO-2' }).closest('tr')
    expect(filaConDiferencia).toHaveTextContent('2 / 0')
    expect(filaConDiferencia).toHaveTextContent('2 con diferencia')
    expect(screen.getByText('0.010000 (1 × 10⁻²)')).toBeInTheDocument()
    // Lo visible queda oculto a los lectores de pantalla, que leen la versión en palabras.
    const visible = screen.getByText('0.000000 (2.58 × 10⁻¹⁰)')
    expect(visible).toHaveAttribute('aria-hidden', 'true')
    expect(visible.nextElementSibling).toHaveClass('sr-only')
    expect(visible.nextElementSibling).toHaveTextContent('0.000000, valor exacto 2.58 por 10 a la menos 10')
    expect(screen.getByText('0.010000, valor exacto 1 por 10 a la menos 2')).toBeInTheDocument()
    expect(screen.getByText('Terminó la verificación de paridad: 2 diferencias.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Detalle de las diferencias' })).toBeInTheDocument()
    expect(screen.getByText('2025 D-PRODUCTO-2 orden 3 saldoCantidad')).toBeInTheDocument()
  })

  it('paridad en la base de demostración: aviso en lugar de la tabla', async () => {
    paridadSimulada.mockRejectedValue(new ErrorApi(409, 'NO_DISPONIBLE_EN_DEMO', ''))
    renderizar()
    await userEvent.click(botonParidad())
    expect(await screen.findByText('No disponible en la base de demostración')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('Reintentar en paridad deja el foco en «Verificar paridad»', async () => {
    paridadSimulada.mockRejectedValueOnce(new ErrorApi(500, 'ERROR_INTERNO', '')).mockResolvedValueOnce(paridadDemo())
    renderizar()
    await userEvent.click(botonParidad())
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Paridad completa: 0 diferencias')).toBeInTheDocument()
    expect(botonParidad()).toHaveFocus()
  })
})
