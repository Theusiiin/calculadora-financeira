import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactMoney } from '../lib/format'
import { useMoney, useSettings } from '../settings'

export interface Series {
  key: string
  label: string
  color: string
}

interface Props {
  title: string
  data: Record<string, number>[]
  series: Series[]
  kind?: 'area-stacked' | 'line'
  xLabel?: string
}

/** Reduz séries muito longas para manter o gráfico legível e leve. */
function downsample<T>(data: T[], max = 240): T[] {
  if (data.length <= max) return data
  const step = Math.ceil(data.length / max)
  const out = data.filter((_, i) => i % step === 0)
  if (out[out.length - 1] !== data[data.length - 1]) out.push(data[data.length - 1])
  return out
}

export default function EvolutionChart({ title, data, series, kind = 'area-stacked', xLabel = 'Mês' }: Props) {
  const money = useMoney()
  const { currency } = useSettings()
  const points = downsample(data)
  const common = {
    data: points,
    margin: { top: 8, right: 12, bottom: 4, left: 4 },
  }
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" vertical={false} />
      <XAxis
        dataKey="period"
        tick={{ fontSize: 12, fill: 'currentColor' }}
        tickLine={false}
        axisLine={false}
        minTickGap={24}
        label={{ value: xLabel, position: 'insideBottomRight', offset: -2, fontSize: 11, fill: 'currentColor' }}
      />
      <YAxis
        tickFormatter={(v: number) => formatCompactMoney(v, currency)}
        tick={{ fontSize: 12, fill: 'currentColor' }}
        tickLine={false}
        axisLine={false}
        width={78}
      />
      <Tooltip
        formatter={(value) => money(Number(value))}
        labelFormatter={(label) => `${xLabel} ${label}`}
        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }}
      />
      <Legend wrapperStyle={{ fontSize: 13 }} />
    </>
  )

  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      <div className="chart__canvas" role="img" aria-label={`${title}. Os mesmos valores estão na tabela abaixo.`}>
        <ResponsiveContainer width="100%" height={300}>
          {kind === 'line' ? (
            <LineChart {...common}>
              {axes}
              {series.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={false} />
              ))}
            </LineChart>
          ) : (
            <AreaChart {...common}>
              {axes}
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stackId="1"
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
