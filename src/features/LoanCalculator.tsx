import { EvolutionChart } from '../components/LazyChart'
import { CHART_COLORS, RATE_UNITS, TERM_UNITS } from '../lib/constants'
import { EvolutionTable } from '../components/EvolutionTable'
import { NumberField, Segmented, UnitSelect } from '../components/Field'
import { CalculatorForm, EmptyResult, Note, ResultPanel, Summary } from '../components/Layout'
import { simulateLoan, type AmortizationSystem, type LoanResult, type RateUnit, type TermUnit } from '../lib/finance'
import { describeMonths, formatPercent } from '../lib/format'
import { validateMoney, validateRate, validateTerm, type Errors } from '../lib/inputs'
import { useCalculatorForm } from '../lib/useForm'
import { useCurrencySymbol, useMoney } from '../settings'

type Values = {
  principal: string
  rate: string
  rateUnit: RateUnit
  term: string
  termUnit: TermUnit
  system: AmortizationSystem
}

const INITIAL: Values = { principal: '200.000,00', rate: '1,1', rateUnit: 'month', term: '360', termUnit: 'months', system: 'price' }
const BLANK: Values = { principal: '', rate: '', rateUnit: 'month', term: '', termUnit: 'months', system: 'price' }

interface Output {
  result: LoanResult
  principal: number
  monthlyRate: number
  months: number
  system: AmortizationSystem
}

export function LoanCalculator() {
  const money = useMoney()
  const symbol = useCurrencySymbol()
  const { values, set, errors, result, runId, reset, commit } = useCalculatorForm<Values, Output>(INITIAL, BLANK)

  const calculate = () => {
    const errs: Errors = {}
    const p = validateMoney(values.principal, 'o valor financiado', { positive: true })
    const r = validateRate(values.rate, values.rateUnit, 'equivalent')
    const t = validateTerm(values.term, values.termUnit)
    if (!p.ok) errs.principal = p.error
    if (!r.ok) errs.rate = r.error
    if (!t.ok) errs.term = t.error
    if (p.ok && t.ok && p.value / t.months < 0.01) errs.principal = 'O valor financiado é pequeno demais para o número de parcelas.'
    if (Object.keys(errs).length || !p.ok || !r.ok || !t.ok) return commit(errs, null)
    commit(
      {},
      {
        result: simulateLoan({ principal: p.value, monthlyRate: r.monthly, months: t.months, system: values.system }),
        principal: p.value,
        monthlyRate: r.monthly,
        months: t.months,
        system: values.system,
      },
    )
  }

  const isPrice = result?.system === 'price'

  return (
    <div className="calculator">
      <CalculatorForm
        title="Empréstimos e financiamentos"
        description={<p>Estime parcelas, juros totais e o saldo devedor pela Tabela Price (parcelas fixas) ou pelo SAC (amortização constante).</p>}
        onSubmit={calculate}
        onReset={reset}
      >
        <NumberField
          id="loan-principal"
          label="Valor financiado"
          prefix={symbol}
          placeholder="Ex.: 200.000,00"
          value={values.principal}
          onChange={(v) => set('principal', v)}
          error={errors.principal}
          hint="Valor emprestado, já descontada a entrada."
        />
        <NumberField
          id="loan-rate"
          label="Taxa de juros efetiva"
          placeholder="Ex.: 1,1"
          value={values.rate}
          onChange={(v) => set('rate', v)}
          error={errors.rate}
          hint={values.rateUnit === 'year' ? 'Taxa efetiva anual convertida para mensal pela equivalência: (1 + i)^(1/12) − 1.' : undefined}
          addon={<UnitSelect id="loan-rate-unit" label="Unidade da taxa" value={values.rateUnit} onChange={(v) => set('rateUnit', v)} options={RATE_UNITS} />}
        />
        <NumberField
          id="loan-term"
          label="Prazo"
          placeholder="Ex.: 360"
          value={values.term}
          onChange={(v) => set('term', v)}
          error={errors.term}
          addon={<UnitSelect id="loan-term-unit" label="Unidade do prazo" value={values.termUnit} onChange={(v) => set('termUnit', v)} options={TERM_UNITS} />}
        />
        <Segmented
          name="loan-system"
          legend="Sistema de amortização"
          value={values.system}
          onChange={(v) => set('system', v)}
          options={[
            { value: 'price', label: 'Tabela Price', description: 'Parcelas iguais; no início a maior parte da parcela é juros.' },
            { value: 'sac', label: 'SAC', description: 'Amortização constante; parcelas começam maiores e diminuem. Paga menos juros no total.' },
          ]}
        />
      </CalculatorForm>

      {result ? (
        <ResultPanel title="Resultado da simulação" key={runId}>
          <Summary
            items={
              isPrice
                ? [
                    { label: 'Parcela mensal', value: money(result.result.firstPayment), tone: 'accent', note: 'Parcela fixa (Price)' },
                    { label: 'Total de juros', value: money(result.result.totalInterest), tone: 'warning' },
                    { label: 'Total pago', value: money(result.result.totalPaid) },
                  ]
                : [
                    { label: 'Primeira parcela', value: money(result.result.firstPayment), tone: 'accent' },
                    { label: 'Última parcela', value: money(result.result.lastPayment) },
                    { label: 'Total de juros', value: money(result.result.totalInterest), tone: 'warning' },
                    { label: 'Total pago', value: money(result.result.totalPaid) },
                  ]
            }
          />
          <Note>
            Taxa mensal: <strong>{formatPercent(result.monthlyRate)}</strong> · {result.months} parcelas ({describeMonths(result.months)}) ·
            Sistema <strong>{isPrice ? 'Price' : 'SAC'}</strong>. Primeira parcela 1 mês após a contratação, sem carência. Valores
            arredondados ao centavo apenas na exibição. <strong>Não inclui</strong> seguros, tarifas, IOF nem correção
            monetária (TR/IPCA) — o custo efetivo total (CET) real será maior.
          </Note>
          <EvolutionChart
            title="Saldo devedor e juros pagos"
            data={(() => {
              let paidInterest = 0
              return [{ period: 0, balance: result.principal, paidInterest: 0 }].concat(
                result.result.rows.map((r) => {
                  paidInterest += r.interest
                  return { period: r.period, balance: r.balance, paidInterest }
                }),
              )
            })()}
            series={[
              { key: 'balance', label: 'Saldo devedor', color: CHART_COLORS.amortization },
              { key: 'paidInterest', label: 'Juros pagos (acumulado)', color: CHART_COLORS.cost },
            ]}
            kind="line"
          />
          <EvolutionTable
            caption="Tabela de amortização"
            rows={result.result.rows}
            columns={[
              { key: 'payment', label: 'Parcela', aggregate: 'sum' },
              { key: 'interest', label: 'Juros', aggregate: 'sum' },
              { key: 'amortization', label: 'Amortização', aggregate: 'sum' },
              { key: 'balance', label: 'Saldo devedor', aggregate: 'last' },
            ]}
          />
        </ResultPanel>
      ) : (
        <EmptyResult />
      )}
    </div>
  )
}
