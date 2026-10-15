/**
 * Conversão de texto digitado (formato brasileiro) em número e validação de campos.
 *
 * Aceita: "1500", "1.500", "1.500,75", "1500,75", "1500.75", "R$ 1.500,75", "2,5".
 * Regra: havendo vírgula, ela é o separador decimal e os pontos são de milhar.
 * Sem vírgula, pontos em grupos de 3 dígitos ("1.500.000") são tratados como milhar;
 * caso contrário o ponto é decimal ("1.5").
 */
export function parseDecimal(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '').replace(/^R\$/i, '').replace(/%$/, '')
  if (!s) return null
  let normalized: string
  if (s.includes(',')) {
    normalized = s.replace(/\./g, '').replace(',', '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    normalized = s.replace(/\./g, '')
  } else {
    normalized = s
  }
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export interface NumberRule {
  label: string
  required?: boolean
  min?: number
  /** quando true, o valor precisa ser estritamente maior que `min` */
  minExclusive?: boolean
  max?: number
  integer?: boolean
}

export type Validated = { ok: true; value: number } | { ok: false; error: string }

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 6 })

export function validateNumber(raw: string, rule: NumberRule): Validated {
  if (!raw.trim()) {
    if (rule.required === false) return { ok: true, value: 0 }
    return { ok: false, error: `Informe ${rule.label}.` }
  }
  const value = parseDecimal(raw)
  if (value === null) {
    return { ok: false, error: `${capitalize(rule.label)} deve ser um número (ex.: 1.500,00).` }
  }
  if (rule.min !== undefined) {
    if (rule.minExclusive && value <= rule.min) {
      return { ok: false, error: `${capitalize(rule.label)} deve ser maior que ${fmt(rule.min)}.` }
    }
    if (!rule.minExclusive && value < rule.min) {
      return { ok: false, error: `${capitalize(rule.label)} não pode ser menor que ${fmt(rule.min)}.` }
    }
  }
  if (rule.max !== undefined && value > rule.max) {
    return { ok: false, error: `${capitalize(rule.label)} não pode ser maior que ${fmt(rule.max)}.` }
  }
  if (rule.integer && !Number.isInteger(value)) {
    return { ok: false, error: `${capitalize(rule.label)} deve ser um número inteiro.` }
  }
  return { ok: true, value }
}

function capitalize(s: string) {
  const text = s.replace(/^(o|a|os|as) /, '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Limites gerais usados pela interface. */
export const LIMITS = {
  maxMoney: 1_000_000_000_000, // 1 trilhão
  maxRatePercentMonth: 100,
  maxRatePercentYear: 10_000,
  maxMonths: 1200, // 100 anos
}
