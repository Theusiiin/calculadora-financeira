import { lazy, Suspense, type ComponentProps } from 'react'

// O Recharts é carregado sob demanda, apenas quando o primeiro resultado é exibido.
const Chart = lazy(() => import('./EvolutionChart'))

export function EvolutionChart(props: ComponentProps<typeof Chart>) {
  return (
    <Suspense fallback={<div className="chart-skeleton" role="status">Carregando gráfico…</div>}>
      <Chart {...props} />
    </Suspense>
  )
}
