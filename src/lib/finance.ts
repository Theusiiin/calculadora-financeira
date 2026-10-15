/**
 * Regras de negócio da calculadora financeira.
 *
 * Convenções adotadas em todo o módulo:
 * - Taxas são números decimais (1% = 0.01).
 * - O período-base de capitalização é o MÊS. Prazos em anos são convertidos
 *   para meses (x 12) e taxas anuais são convertidas para mensais antes de
 *   qualquer cálculo — nunca se mistura taxa mensal com prazo anual.
 * - Os cálculos internos usam precisão total de ponto flutuante e o arredondamento
 *   ao centavo acontece apenas na exibição (inclusive nas tabelas de financiamento).
 */

export type RateUnit = 'month' | 'year'
export type TermUnit = 'months' | 'years'
export type Timing = 'start' | 'end'
export type ConversionMode = 'equivalent' | 'proportional'
export type AmortizationSystem = 'price' | 'sac'

/** Arredonda ao centavo (meio para longe do zero), robusto a erros de ponto flutuante. */
export function round2(value: number): number {
  const sign = Math.sign(value)
  return (sign * Math.round(Math.abs(value) * 100 + 1e-9)) / 100
}

// ---------------------------------------------------------------------------
// Conversão de taxas
// ---------------------------------------------------------------------------

/** Equivalente (juros compostos): (1 + im)^12 − 1 */
export const monthlyToAnnualEquivalent = (im: number) => Math.pow(1 + im, 12) - 1
/** Equivalente (juros compostos): (1 + ia)^(1/12) − 1 */
export const annualToMonthlyEquivalent = (ia: number) => Math.pow(1 + ia, 1 / 12) - 1
/** Proporcional (juros simples / taxa nominal): im × 12 */
export const monthlyToAnnualProportional = (im: number) => im * 12
/** Proporcional (juros simples / taxa nominal): ia ÷ 12 */
export const annualToMonthlyProportional = (ia: number) => ia / 12

/**
 * Taxa efetiva anual a partir de uma taxa NOMINAL anual capitalizada mensalmente.
 * Ex.: 12% a.a. capitalizados mensalmente = 1% a.m. efetivo = 12,6825% a.a. efetivo.
 */
export const nominalAnnualToEffectiveAnnual = (nominal: number) =>
  monthlyToAnnualEquivalent(nominal / 12)

/** Converte uma taxa informada (ao mês ou ao ano) para taxa mensal. */
export function toMonthlyRate(rate: number, unit: RateUnit, mode: ConversionMode = 'equivalent'): number {
  if (unit === 'month') return rate
  return mode === 'equivalent' ? annualToMonthlyEquivalent(rate) : annualToMonthlyProportional(rate)
}

/** Converte um prazo para meses. */
export function termInMonths(term: number, unit: TermUnit): number {
  return unit === 'years' ? Math.round(term * 12 * 1e6) / 1e6 : term
}

// ---------------------------------------------------------------------------
// Juros simples e compostos
// ---------------------------------------------------------------------------

export interface GrowthRow {
  period: number
  interest: number // juros do período
  totalInterest: number // juros acumulados
  balance: number // montante ao fim do período
}

export interface GrowthResult {
  principal: number
  totalInterest: number
  finalAmount: number
  rows: GrowthRow[]
}

/** Juros simples: J = P · i · n ; M = P · (1 + i · n) */
export function simpleInterest(principal: number, monthlyRate: number, months: number): GrowthResult {
  const rows: GrowthRow[] = []
  const interestPerPeriod = principal * monthlyRate
  for (let k = 1; k <= months; k++) {
    rows.push({
      period: k,
      interest: interestPerPeriod,
      totalInterest: interestPerPeriod * k,
      balance: principal + interestPerPeriod * k,
    })
  }
  const totalInterest = principal * monthlyRate * months
  return { principal, totalInterest, finalAmount: principal + totalInterest, rows }
}

/** Juros compostos: M = P · (1 + i)^n ; J = M − P */
export function compoundInterest(principal: number, monthlyRate: number, months: number): GrowthResult {
  const rows: GrowthRow[] = []
  let balance = principal
  for (let k = 1; k <= months; k++) {
    const interest = balance * monthlyRate
    balance += interest
    rows.push({ period: k, interest, totalInterest: balance - principal, balance })
  }
  const finalAmount = principal * Math.pow(1 + monthlyRate, months)
  return { principal, totalInterest: finalAmount - principal, finalAmount, rows }
}

// ---------------------------------------------------------------------------
// Simulação de investimentos com aportes periódicos
// ---------------------------------------------------------------------------

export interface InvestmentInput {
  initial: number
  contribution: number // aporte mensal
  monthlyRate: number
  months: number
  timing: Timing // aporte no início ou no fim de cada mês
}

export interface InvestmentRow {
  period: number
  contribution: number
  interest: number
  invested: number // total investido acumulado (inicial + aportes)
  totalInterest: number
  balance: number
}

export interface InvestmentResult {
  invested: number
  totalInterest: number
  finalBalance: number
  rows: InvestmentRow[]
}

export function simulateInvestment(input: InvestmentInput): InvestmentResult {
  const { initial, contribution, monthlyRate, months, timing } = input
  const rows: InvestmentRow[] = []
  let balance = initial
  let invested = initial
  let totalInterest = 0
  for (let k = 1; k <= months; k++) {
    if (timing === 'start') {
      balance += contribution
      invested += contribution
    }
    const interest = balance * monthlyRate
    balance += interest
    totalInterest += interest
    if (timing === 'end') {
      balance += contribution
      invested += contribution
    }
    rows.push({ period: k, contribution, interest, invested, totalInterest, balance })
  }
  return { invested, totalInterest, finalBalance: balance, rows }
}

/**
 * Fórmula fechada do valor futuro (usada para conferir a simulação):
 * VF = P·(1+i)^n + A·[((1+i)^n − 1) / i]·(1+i)^t   — t = 1 se aporte no início, 0 se no fim.
 */
export function futureValue(input: InvestmentInput): number {
  const { initial, contribution, monthlyRate: i, months: n, timing } = input
  if (i === 0) return initial + contribution * n
  const growth = Math.pow(1 + i, n)
  const annuity = contribution * ((growth - 1) / i) * (timing === 'start' ? 1 + i : 1)
  return initial * growth + annuity
}

// ---------------------------------------------------------------------------
// Financiamentos (Tabela Price e SAC)
// ---------------------------------------------------------------------------

export interface LoanInput {
  principal: number
  monthlyRate: number
  months: number
  system: AmortizationSystem
}

export interface LoanRow {
  period: number
  payment: number
  interest: number
  amortization: number
  balance: number
}

export interface LoanResult {
  rows: LoanRow[]
  totalPaid: number
  totalInterest: number
  firstPayment: number
  lastPayment: number
}

/** Parcela fixa da Tabela Price: PMT = PV · i / (1 − (1 + i)^−n) */
export function pricePayment(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
}

export function simulateLoan(input: LoanInput): LoanResult {
  const { principal, monthlyRate, months, system } = input
  const rows: LoanRow[] = []
  let balance = principal
  const fixedPayment = pricePayment(principal, monthlyRate, months)
  const fixedAmortization = principal / months

  for (let k = 1; k <= months; k++) {
    const interest = balance * monthlyRate
    let amortization = system === 'price' ? fixedPayment - interest : fixedAmortization
    // A última parcela quita exatamente o saldo (elimina resíduos de ponto flutuante).
    if (k === months || amortization > balance) amortization = balance
    const payment = interest + amortization
    balance = k === months ? 0 : balance - amortization
    rows.push({ period: k, payment, interest, amortization, balance })
  }

  const totalPaid = round2(rows.reduce((s, r) => s + r.payment, 0))
  const totalInterest = round2(rows.reduce((s, r) => s + r.interest, 0))
  return {
    rows,
    totalPaid,
    totalInterest,
    firstPayment: rows[0]?.payment ?? 0,
    lastPayment: rows[rows.length - 1]?.payment ?? 0,
  }
}
