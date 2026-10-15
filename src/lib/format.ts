export type CurrencyCode = 'BRL' | 'USD' | 'EUR'

export const CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: 'BRL', label: 'Real (R$)', locale: 'pt-BR' },
  { code: 'USD', label: 'Dólar (US$)', locale: 'pt-BR' },
  { code: 'EUR', label: 'Euro (€)', locale: 'pt-BR' },
]

const cache = new Map<string, Intl.NumberFormat>()

export function formatMoney(value: number, currency: CurrencyCode = 'BRL'): string {
  let f = cache.get(currency)
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
    cache.set(currency, f)
  }
  // evita exibir "-R$ 0,00" por resíduos de ponto flutuante
  return f.format(Math.abs(value) < 0.005 ? 0 : value)
}

/** Formata uma taxa decimal como porcentagem (0.01 -> "1,0000%"). */
export function formatPercent(decimal: number, digits = 4): string {
  return `${(decimal * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: digits })}%`
}

export function formatCompactMoney(value: number, currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function describeMonths(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  const parts: string[] = []
  if (y) parts.push(`${y} ${y === 1 ? 'ano' : 'anos'}`)
  if (m) parts.push(`${m} ${m === 1 ? 'mês' : 'meses'}`)
  return parts.join(' e ') || '0 meses'
}
