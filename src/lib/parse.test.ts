import { describe, expect, it } from 'vitest'
import { validateMoney, validateRate, validateTerm } from './inputs'
import { parseDecimal, validateNumber } from './parse'

describe('parseDecimal (formato brasileiro)', () => {
  it.each([
    ['1500', 1500],
    ['1.500', 1500],
    ['1.500.000', 1500000],
    ['1.500,75', 1500.75],
    ['1500,75', 1500.75],
    ['1500.75', 1500.75],
    ['R$ 1.500,75', 1500.75],
    ['2,5', 2.5],
    ['0,6%', 0.6],
    ['  10  ', 10],
  ])('"%s" → %d', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected)
  })

  it.each(['', 'abc', '1,2,3', '1.2.3,4,5', '12a', '--1'])('rejeita "%s"', (input) => {
    expect(parseDecimal(input)).toBeNull()
  })
})

describe('validação', () => {
  it('exige preenchimento quando obrigatório', () => {
    const r = validateNumber('', { label: 'o capital inicial' })
    expect(r).toEqual({ ok: false, error: 'Informe o capital inicial.' })
  })
  it('aceita vazio como zero quando opcional', () => {
    expect(validateMoney('', 'o aporte', { required: false })).toEqual({ ok: true, value: 0 })
  })
  it('rejeita valores negativos e zero quando precisa ser positivo', () => {
    expect(validateMoney('-10', 'o valor').ok).toBe(false)
    expect(validateMoney('0', 'o valor', { positive: true }).ok).toBe(false)
  })
  it('limita taxas absurdas', () => {
    expect(validateRate('150', 'month').ok).toBe(false)
    expect(validateRate('150', 'year').ok).toBe(true)
  })
  it('converte taxa anual para mensal', () => {
    const r = validateRate('12', 'year', 'proportional')
    expect(r.ok && r.monthly).toBeCloseTo(0.01, 12)
  })
  it('valida prazo em meses inteiros', () => {
    expect(validateTerm('1,5', 'years')).toEqual({ ok: true, months: 18 })
    expect(validateTerm('1,3', 'years').ok).toBe(false)
    expect(validateTerm('2,5', 'months').ok).toBe(false)
    expect(validateTerm('0', 'months').ok).toBe(false)
    expect(validateTerm('1201', 'months').ok).toBe(false)
    expect(validateTerm('100', 'years')).toEqual({ ok: true, months: 1200 })
  })
})
