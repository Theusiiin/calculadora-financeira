export const RATE_UNITS = [
  { value: 'month' as const, label: '% ao mês' },
  { value: 'year' as const, label: '% ao ano' },
]

export const TERM_UNITS = [
  { value: 'months' as const, label: 'meses' },
  { value: 'years' as const, label: 'anos' },
]

/** Cores escolhidas para contraste razoável nos temas claro e escuro. */
export const CHART_COLORS = {
  invested: '#3b82f6',
  interest: '#10b981',
  balance: '#8b5cf6',
  amortization: '#0ea5e9',
  cost: '#f59e0b',
  scenario: ['#3b82f6', '#10b981', '#f59e0b'],
}
