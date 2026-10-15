import { termInMonths, toMonthlyRate, type ConversionMode, type RateUnit, type TermUnit } from './finance'
import { LIMITS, validateNumber, type Validated } from './parse'

export type Errors = Record<string, string>

/** Valor monetário não negativo (ou estritamente positivo, se `positive`). */
export function validateMoney(raw: string, label: string, opts: { positive?: boolean; required?: boolean } = {}): Validated {
  return validateNumber(raw, {
    label,
    min: 0,
    minExclusive: opts.positive,
    max: LIMITS.maxMoney,
    required: opts.required,
  })
}

/** Taxa em % convertida para decimal mensal. */
export function validateRate(
  raw: string,
  unit: RateUnit,
  mode: ConversionMode = 'equivalent',
): { ok: true; percent: number; monthly: number } | { ok: false; error: string } {
  const v = validateNumber(raw, {
    label: 'a taxa de juros',
    min: 0,
    max: unit === 'month' ? LIMITS.maxRatePercentMonth : LIMITS.maxRatePercentYear,
  })
  if (!v.ok) return v
  return { ok: true, percent: v.value, monthly: toMonthlyRate(v.value / 100, unit, mode) }
}

/** Prazo convertido para meses inteiros. */
export function validateTerm(raw: string, unit: TermUnit): { ok: true; months: number } | { ok: false; error: string } {
  const v = validateNumber(raw, { label: 'o prazo', min: 0, minExclusive: true })
  if (!v.ok) return v
  const months = termInMonths(v.value, unit)
  if (!Number.isInteger(months)) {
    return {
      ok: false,
      error:
        unit === 'years'
          ? 'O prazo em anos precisa corresponder a meses inteiros (ex.: 1,5 ano = 18 meses).'
          : 'O prazo deve ser um número inteiro de meses.',
    }
  }
  if (months > LIMITS.maxMonths) {
    return { ok: false, error: `O prazo máximo é de ${LIMITS.maxMonths} meses (100 anos).` }
  }
  return { ok: true, months }
}
