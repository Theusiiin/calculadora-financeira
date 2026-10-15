import { EvolutionChart } from '../components/LazyChart'
import { CHART_COLORS, RATE_UNITS, TERM_UNITS } from '../lib/constants'
import { EvolutionTable } from '../components/EvolutionTable'
import { NumberField, Segmented, UnitSelect } from '../components/Field'
import { CalculatorForm, EmptyResult, Note, ResultPanel, Summary } from '../components/Layout'
import { simulateInvestment, type ConversionMode, type InvestmentResult, type RateUnit, type TermUnit, type Timing } from '../lib/finance'
import { describeMonths, formatPercent } from '../lib/format'
import { validateMoney, validateRate, validateTerm, type Errors } from '../lib/inputs'
import { useCalculatorForm } from '../lib/useForm'
import { useCurrencySymbol, useMoney } from '../settings'

type Values = {
  initial: string
  contribution: string
  rate: string
  rateUnit: RateUnit
  conversion: ConversionMode
  term: string
  termUnit: TermUnit
  timing: Timing
}

const INITIAL: Values = {
  initial: '5.000,00',
  contribution: '500,00',
  rate: '10',
  rateUnit: 'year',
  conversion: 'equivalent',
  term: '10',
  termUnit: 'years',
  timing: 'end',
}
const BLANK: Values = { initial: '', contribution: '', rate: '', rateUnit: 'month', conversion: 'equivalent', term: '', termUnit: 'months', timing: 'end' }

interface Output {
  result: InvestmentResult
  monthlyRate: number
  months: number
  timing: Timing
}

export function InvestmentCalculator() {
  const money = useMoney()
  const symbol = useCurrencySymbol()
  const { values, set, errors, result, runId, reset, commit } = useCalculatorForm<Values, Output>(INITIAL, BLANK)

  const calculate = () => {
    const errs: Errors = {}
    const p = validateMoney(values.initial, 'o capital inicial', { required: false })
    const a = validateMoney(values.contribution, 'o aporte mensal', { required: false })
    const r = validateRate(values.rate, values.rateUnit, values.conversion)
    const t = validateTerm(values.term, values.termUnit)
    if (!p.ok) errs.initial = p.error
    if (!a.ok) errs.contribution = a.error
    if (!r.ok) errs.rate = r.error
    if (!t.ok) errs.term = t.error
    if (p.ok && a.ok && p.value === 0 && a.value === 0) {
      errs.initial = 'Informe um capital inicial, um aporte mensal ou ambos.'
    }
    if (Object.keys(errs).length || !p.ok || !a.ok || !r.ok || !t.ok) return commit(errs, null)
    commit(
      {},
      {
        result: simulateInvestment({ initial: p.value, contribution: a.value, monthlyRate: r.monthly, months: t.months, timing: values.timing }),
        monthlyRate: r.monthly,
        months: t.months,
        timing: values.timing,
      },
    )
  }

  return (
    <div className="calculator">
      <CalculatorForm
        title="Simulação de investimentos"
        description={<p>Capital inicial + aportes mensais rendendo juros compostos. Ideal para planejar metas de longo prazo.</p>}
        onSubmit={calculate}
        onReset={reset}
      >
        <NumberField
          id="inv-initial"
          label="Capital inicial"
          prefix={symbol}
          placeholder="Ex.: 5.000,00"
          value={values.initial}
          onChange={(v) => set('initial', v)}
          error={errors.initial}
          hint="Pode ser zero se você só fará aportes."
        />
        <NumberField
          id="inv-contribution"
          label="Aporte mensal"
          prefix={symbol}
          placeholder="Ex.: 500,00"
          value={values.contribution}
          onChange={(v) => set('contribution', v)}
          error={errors.contribution}
        />
        <NumberField
          id="inv-rate"
          label="Taxa de juros"
          placeholder="Ex.: 10"
          value={values.rate}
          onChange={(v) => set('rate', v)}
          error={errors.rate}
          addon={<UnitSelect id="inv-rate-unit" label="Unidade da taxa" value={values.rateUnit} onChange={(v) => set('rateUnit', v)} options={RATE_UNITS} />}
        />
        {values.rateUnit === 'year' && (
          <Segmented
            name="inv-conversion"
            legend="Como interpretar a taxa anual"
            value={values.conversion}
            onChange={(v) => set('conversion', v)}
            options={[
              { value: 'equivalent', label: 'Efetiva (equivalente)', description: 'Rendimento anual efetivo (ex.: CDI anual). Mensal = (1 + i)^(1/12) − 1.' },
              { value: 'proportional', label: 'Nominal (proporcional)', description: 'Taxa nominal capitalizada mensalmente. Mensal = i ÷ 12.' },
            ]}
          />
        )}
        <NumberField
          id="inv-term"
          label="Prazo"
          placeholder="Ex.: 10"
          value={values.term}
          onChange={(v) => set('term', v)}
          error={errors.term}
          addon={<UnitSelect id="inv-term-unit" label="Unidade do prazo" value={values.termUnit} onChange={(v) => set('termUnit', v)} options={TERM_UNITS} />}
        />
        <Segmented
          name="inv-timing"
          legend="Momento do aporte"
          value={values.timing}
          onChange={(v) => set('timing', v)}
          options={[
            { value: 'end', label: 'Fim do mês', description: 'O aporte entra no fim do mês e só começa a render no mês seguinte (postecipado).' },
            { value: 'start', label: 'Início do mês', description: 'O aporte entra no início do mês e já rende no próprio mês (antecipado).' },
          ]}
        />
      </CalculatorForm>

      {result ? (
        <ResultPanel title="Resultado da simulação" key={runId}>
          <Summary
            items={[
              { label: 'Total investido', value: money(result.result.invested) },
              { label: 'Juros acumulados', value: money(result.result.totalInterest), tone: 'positive' },
              { label: 'Montante final', value: money(result.result.finalBalance), tone: 'accent' },
            ]}
          />
          <Note>
            Taxa mensal equivalente: <strong>{formatPercent(result.monthlyRate)}</strong> · Prazo: <strong>{result.months} meses</strong> (
            {describeMonths(result.months)}) · Aportes no <strong>{result.timing === 'start' ? 'início' : 'fim'}</strong> de cada mês. Não
            considera impostos (IR, IOF), taxas de administração nem inflação.
          </Note>
          <EvolutionChart
            title="Composição do patrimônio"
            data={result.result.rows.map((r) => ({ period: r.period, invested: r.invested, totalInterest: r.totalInterest }))}
            series={[
              { key: 'invested', label: 'Total investido', color: CHART_COLORS.invested },
              { key: 'totalInterest', label: 'Juros acumulados', color: CHART_COLORS.interest },
            ]}
          />
          <EvolutionTable
            caption="Evolução mensal do investimento"
            rows={result.result.rows}
            columns={[
              { key: 'contribution', label: 'Aporte', aggregate: 'sum' },
              { key: 'interest', label: 'Juros do período', aggregate: 'sum' },
              { key: 'invested', label: 'Total investido', aggregate: 'last' },
              { key: 'totalInterest', label: 'Juros acumulados', aggregate: 'last' },
              { key: 'balance', label: 'Saldo', aggregate: 'last' },
            ]}
          />
        </ResultPanel>
      ) : (
        <EmptyResult />
      )}
    </div>
  )
}
