import { useMemo, useState } from 'react'
import { useMoney } from '../settings'

export interface Column<Row> {
  key: keyof Row & string
  label: string
  /** como agregar na visão anual: soma do período ou último valor (acumulados/saldos) */
  aggregate: 'sum' | 'last'
}

interface Props<Row extends { period: number }> {
  caption: string
  rows: Row[]
  columns: Column<Row>[]
}

type Aggregated = Record<string, number>

function aggregateYearly<Row extends { period: number }>(rows: Row[], columns: Column<Row>[]): Aggregated[] {
  const result: Aggregated[] = []
  for (let start = 0; start < rows.length; start += 12) {
    const chunk = rows.slice(start, start + 12)
    const out: Aggregated = { period: Math.floor(start / 12) + 1 }
    for (const col of columns) {
      out[col.key] =
        col.aggregate === 'sum'
          ? chunk.reduce((s, r) => s + Number(r[col.key]), 0)
          : Number(chunk[chunk.length - 1][col.key])
    }
    result.push(out)
  }
  return result
}

export function EvolutionTable<Row extends { period: number }>({ caption, rows, columns }: Props<Row>) {
  const money = useMoney()
  const canGroup = rows.length > 12
  const [view, setView] = useState<'monthly' | 'yearly'>(rows.length > 60 ? 'yearly' : 'monthly')
  const effectiveView = canGroup ? view : 'monthly'

  const data: Aggregated[] = useMemo(
    () =>
      effectiveView === 'yearly'
        ? aggregateYearly(rows, columns)
        : rows.map((r) => {
            const out: Aggregated = { period: r.period }
            for (const c of columns) out[c.key] = Number(r[c.key])
            return out
          }),
    [effectiveView, rows, columns],
  )

  return (
    <div className="table-block">
      <div className="table-block__header">
        <h3>Evolução por período</h3>
        {canGroup && (
          <div className="toggle" role="group" aria-label="Agrupamento da tabela">
            <button type="button" aria-pressed={effectiveView === 'monthly'} onClick={() => setView('monthly')}>
              Mensal
            </button>
            <button type="button" aria-pressed={effectiveView === 'yearly'} onClick={() => setView('yearly')}>
              Anual
            </button>
          </div>
        )}
      </div>
      <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}>
        <table>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{effectiveView === 'yearly' ? 'Ano' : 'Mês'}</th>
              {columns.map((c) => (
                <th scope="col" key={c.key}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.period}>
                <th scope="row">{r.period}</th>
                {columns.map((c) => (
                  <td key={c.key}>{money(r[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {effectiveView === 'yearly' && (
        <p className="field__hint">
          Na visão anual, valores do período (juros, parcelas, aportes) são somados nos 12 meses; saldos e acumulados
          mostram a posição ao fim do ano.
        </p>
      )}
    </div>
  )
}
