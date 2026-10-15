import { describe, expect, it } from 'vitest'
import {
  annualToMonthlyEquivalent,
  annualToMonthlyProportional,
  compoundInterest,
  futureValue,
  monthlyToAnnualEquivalent,
  monthlyToAnnualProportional,
  nominalAnnualToEffectiveAnnual,
  pricePayment,
  round2,
  simpleInterest,
  simulateInvestment,
  simulateLoan,
  termInMonths,
  toMonthlyRate,
} from './finance'

describe('round2', () => {
  it('arredonda ao centavo de forma robusta a ponto flutuante', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(2.675)).toBe(2.68)
    expect(round2(-1.005)).toBe(-1.01)
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(0)).toBe(0)
  })
})

describe('conversão de taxas', () => {
  it('converte mensal → anual de forma equivalente e proporcional', () => {
    expect(monthlyToAnnualEquivalent(0.01)).toBeCloseTo(0.12682503, 8)
    expect(monthlyToAnnualProportional(0.01)).toBeCloseTo(0.12, 12)
  })
  it('converte anual → mensal de forma equivalente e proporcional', () => {
    expect(annualToMonthlyEquivalent(0.12682503013196977)).toBeCloseTo(0.01, 12)
    expect(annualToMonthlyEquivalent(0.1)).toBeCloseTo(0.00797414, 8)
    expect(annualToMonthlyProportional(0.12)).toBeCloseTo(0.01, 12)
  })
  it('ida e volta equivalente preserva a taxa', () => {
    for (const r of [0, 0.001, 0.0075, 0.05, 0.25]) {
      expect(annualToMonthlyEquivalent(monthlyToAnnualEquivalent(r))).toBeCloseTo(r, 12)
    }
  })
  it('nominal anual com capitalização mensal → efetiva anual', () => {
    expect(nominalAnnualToEffectiveAnnual(0.12)).toBeCloseTo(0.12682503, 8)
  })
  it('toMonthlyRate respeita unidade e modo', () => {
    expect(toMonthlyRate(0.02, 'month')).toBe(0.02)
    expect(toMonthlyRate(0.12, 'year', 'proportional')).toBeCloseTo(0.01, 12)
    expect(toMonthlyRate(0.12, 'year', 'equivalent')).toBeCloseTo(0.00948879, 8)
  })
  it('termInMonths converte anos para meses', () => {
    expect(termInMonths(2, 'years')).toBe(24)
    expect(termInMonths(1.5, 'years')).toBe(18)
    expect(termInMonths(7, 'months')).toBe(7)
  })
})

describe('juros simples', () => {
  it('J = P·i·n', () => {
    const r = simpleInterest(1000, 0.01, 12)
    expect(r.totalInterest).toBeCloseTo(120, 10)
    expect(r.finalAmount).toBeCloseTo(1120, 10)
    expect(r.rows).toHaveLength(12)
    expect(r.rows[5].balance).toBeCloseTo(1060, 10)
  })
  it('taxa zero não gera juros', () => {
    expect(simpleInterest(500, 0, 10).finalAmount).toBe(500)
  })
})

describe('juros compostos', () => {
  it('M = P·(1+i)^n', () => {
    const r = compoundInterest(1000, 0.01, 12)
    expect(r.finalAmount).toBeCloseTo(1126.825030, 5)
    expect(r.totalInterest).toBeCloseTo(126.825030, 5)
    expect(r.rows[11].balance).toBeCloseTo(r.finalAmount, 8)
  })
  it('é maior que juros simples para n > 1 e igual para n = 1', () => {
    expect(compoundInterest(1000, 0.02, 1).finalAmount).toBeCloseTo(simpleInterest(1000, 0.02, 1).finalAmount, 10)
    expect(compoundInterest(1000, 0.02, 24).finalAmount).toBeGreaterThan(simpleInterest(1000, 0.02, 24).finalAmount)
  })
})

describe('simulação de investimentos', () => {
  it('aportes no fim do mês (série postecipada)', () => {
    const input = { initial: 0, contribution: 100, monthlyRate: 0.01, months: 12, timing: 'end' as const }
    const r = simulateInvestment(input)
    expect(r.finalBalance).toBeCloseTo(1268.250301, 5)
    expect(r.invested).toBe(1200)
    expect(r.finalBalance).toBeCloseTo(futureValue(input), 8)
  })
  it('aportes no início do mês (série antecipada) rendem um mês a mais', () => {
    const input = { initial: 0, contribution: 100, monthlyRate: 0.01, months: 12, timing: 'start' as const }
    const r = simulateInvestment(input)
    expect(r.finalBalance).toBeCloseTo(1280.932804, 5)
    expect(r.finalBalance).toBeCloseTo(futureValue(input), 8)
  })
  it('combina capital inicial e aportes e confere com a fórmula fechada', () => {
    const input = { initial: 5000, contribution: 500, monthlyRate: annualToMonthlyEquivalent(0.1), months: 120, timing: 'end' as const }
    const r = simulateInvestment(input)
    expect(r.finalBalance).toBeCloseTo(futureValue(input), 6)
    expect(r.invested).toBe(5000 + 500 * 120)
    expect(r.totalInterest).toBeCloseTo(r.finalBalance - r.invested, 6)
  })
  it('taxa zero: montante = total investido', () => {
    const input = { initial: 1000, contribution: 100, monthlyRate: 0, months: 10, timing: 'end' as const }
    const r = simulateInvestment(input)
    expect(r.finalBalance).toBe(2000)
    expect(r.totalInterest).toBe(0)
    expect(futureValue(input)).toBe(2000)
  })
  it('sem aportes equivale a juros compostos', () => {
    const r = simulateInvestment({ initial: 1000, contribution: 0, monthlyRate: 0.01, months: 12, timing: 'end' })
    expect(r.finalBalance).toBeCloseTo(compoundInterest(1000, 0.01, 12).finalAmount, 8)
  })
})

describe('financiamento — Tabela Price', () => {
  it('parcela fixa pela fórmula PMT', () => {
    expect(pricePayment(100000, 0.01, 12)).toBeCloseTo(8884.8788, 3)
    const r = simulateLoan({ principal: 100000, monthlyRate: 0.01, months: 12, system: 'price' })
    expect(round2(r.firstPayment)).toBe(8884.88)
    expect(r.rows.every((row) => Math.abs(row.payment - r.firstPayment) < 1e-6)).toBe(true)
  })
  it('quita o saldo e a soma das amortizações é o valor financiado', () => {
    const r = simulateLoan({ principal: 200000, monthlyRate: 0.011, months: 360, system: 'price' })
    expect(r.rows.at(-1)!.balance).toBe(0)
    const amortized = round2(r.rows.reduce((s, x) => s + x.amortization, 0))
    expect(amortized).toBe(200000)
    expect(r.totalPaid).toBeCloseTo(200000 + r.totalInterest, 2)
    // com precisão total, todas as parcelas Price são iguais (inclusive a última)
    expect(r.lastPayment).toBeCloseTo(r.firstPayment, 6)
  })
  it('taxa zero divide o valor igualmente', () => {
    const r = simulateLoan({ principal: 1200, monthlyRate: 0, months: 12, system: 'price' })
    expect(r.firstPayment).toBeCloseTo(100, 10)
    expect(r.totalInterest).toBe(0)
    expect(r.totalPaid).toBe(1200)
  })
})

describe('financiamento — SAC', () => {
  it('amortização constante e parcelas decrescentes', () => {
    const r = simulateLoan({ principal: 12000, monthlyRate: 0.01, months: 12, system: 'sac' })
    expect(r.rows.every((row) => row.amortization === 1000)).toBe(true)
    expect(r.firstPayment).toBeCloseTo(1120, 10)
    expect(r.lastPayment).toBeCloseTo(1010, 10)
    expect(r.totalInterest).toBe(780)
    expect(r.rows.at(-1)!.balance).toBe(0)
  })
  it('quita exatamente o saldo mesmo com divisão não exata', () => {
    const r = simulateLoan({ principal: 1000, monthlyRate: 0, months: 3, system: 'sac' })
    expect(r.rows.map((x) => round2(x.amortization))).toEqual([333.33, 333.33, 333.33])
    expect(r.rows.at(-1)!.balance).toBe(0)
    expect(r.totalPaid).toBe(1000)
  })
  it('paga menos juros que a Price nas mesmas condições', () => {
    const base = { principal: 150000, monthlyRate: 0.009, months: 240 }
    const sac = simulateLoan({ ...base, system: 'sac' })
    const price = simulateLoan({ ...base, system: 'price' })
    expect(sac.totalInterest).toBeLessThan(price.totalInterest)
  })
  it('funciona com uma única parcela', () => {
    const r = simulateLoan({ principal: 1000, monthlyRate: 0.02, months: 1, system: 'sac' })
    expect(r.firstPayment).toBeCloseTo(1020, 10)
    expect(r.rows[0].balance).toBe(0)
  })
})
