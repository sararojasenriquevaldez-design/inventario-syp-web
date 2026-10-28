// Resumen de la respuesta 201 de POST /importacion/historico: cuánto se cargó y las alertas del kardex.
import type { ResultadoImportacion } from '@/api/importacion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { formatearEntero } from '@/lib/formato'

export function ResumenCarga({ resultado }: { resultado: ResultadoImportacion }) {
  const { resumen } = resultado
  const conteos: [string, number][] = [
    ['Terceros', resumen.terceros],
    ['Saldos iniciales', resumen.saldosIniciales],
    ['Comprobantes', resumen.comprobantes],
    ['Movimientos', resumen.movimientos],
    ['Control de tonelaje', resumen.controlTonelaje],
    ['Periodos creados (abiertos)', resumen.periodos],
    ['Kardex recalculados (producto × año)', resumen.kardexRecalculados],
  ]
  const alertas = Object.entries(resumen.alertas)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Histórico cargado</h2>
        </CardTitle>
        <CardDescription>
          Lote <span className="font-mono">{resultado.loteId}</span> · huella SHA-256{' '}
          <span className="font-mono" title={resultado.hashSha256}>{resultado.hashSha256.slice(0, 12)}…</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {conteos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex justify-between gap-4 border-b py-1">
              <dt className="text-muted-foreground">{etiqueta}</dt>
              <dd className="tabular-nums">{formatearEntero(valor)}</dd>
            </div>
          ))}
        </dl>
        <div className="text-sm">
          <h3 className="font-medium">Alertas del kardex</h3>
          {alertas.length === 0 ? (
            <p className="text-muted-foreground">Sin alertas.</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-1">
              {alertas.map(([codigo, cantidad]) => (
                <li key={codigo}>
                  <span className="font-mono">{codigo}</span>: {formatearEntero(cantidad)} movimientos
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
