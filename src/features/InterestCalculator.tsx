import { EvolutionChart } from '../components/LazyChart'
import { CHART_COLORS, RATE_UNITS, TERM_UNITS } from '../lib/constants'
import { EvolutionTable } from '../components/EvolutionTable'
import { NumberField, Segmented, UnitSelect } from '../components/Field'
import { CalculatorForm, EmptyResult, Note, ResultPanel, Summary } from '../components/Layout'
import { compoundInterest, simpleInterest, type ConversionMode, type GrowthResult, type RateUnit, type TermUnit } from '../lib/finance'
import { describeMonths, formatPercent } from '../lib/format'
import { validateMoney, validateRate, validateTerm, type Errors } from '../lib/inputs'
import { useCalculatorForm } from '../lib/useForm'
import { useCurrencySymbol, useMoney } from '../settings'

type Regime = 'simple' | 'compound'

type Values = {
  principal: string
  rate: string
  rateUnit: RateUnit
  conversion: ConversionMode
  term: string
  termUnit: TermUnit
}

const INITIAL: Values = { principal: '10.000,00', rate: '1', rateUnit: 'month', conversion: 'equivalent', term: '24', termUnit: 'months' }
const BLANK: Values = { principal: '', rate: '', rateUnit: 'month', conversion: 'equivalent', term: '', termUnit: 'months' }

interface Output {
  result: GrowthResult
  monthlyRate: number
  months: number
}

export function InterestCalculator({ regime }: { regime: Regime }) {
  const money = useMoney()
  const symbol = useCurrencySymbol()
  const { values, set, errors, result, runId, reset, commit } = useCalculatorForm<Values, Output>(INITIAL, BLANK)
  const id = (name: string) => `${regime}-${name}`
  const isSimple = regime === 'simple'

  const calculate = () => {
    const errs: Errors = {}
    const p = validateMoney(values.principal, 'o capital inicial', { positive: true })
    // Em juros simples, a conversão anual → mensal é sempre proporcional (i/12).
    const r = validateRate(values.rate, values.rateUnit, isSimple ? 'proportional' : values.conversion)
    const t = validateTerm(values.term, values.termUnit)
    if (!p.ok) errs.principal = p.error
    if (!r.ok) errs.rate = r.error
    if (!t.ok) errs.term = t.error
    if (!p.ok || !r.ok || !t.ok) return commit(errs, null)
    const fn = isSimple ? simpleInterest : compoundInterest
    commit({}, { result: fn(p.value, r.monthly, t.months), monthlyRate: r.monthly, months: t.months })
  }

  return (
    <div className="calculator">
      <CalculatorForm
        title={isSimple ? 'Juros simples' : 'Juros compostos'}
        description={
          isSimple ? (
            <p>
              Os juros incidem sempre sobre o capital inicial: <code>J = P · i · n</code>.
            </p>
          ) : (
            <p>
              Os juros de cada mês são incorporados ao saldo (juros sobre juros): <code>M = P · (1 + i)ⁿ</code>.
            </p>
          )
        }
        onSubmit={calculate}
        onReset={reset}
      >
        <NumberField
          id={id('principal')}
          label="Capital inicial"
          prefix={symbol}
          placeholder="Ex.: 10.000,00"
          value={values.principal}
          onChange={(v) => set('principal', v)}
          error={errors.principal}
        />
        <NumberField
          id={id('rate')}
          label="Taxa de juros"
          placeholder="Ex.: 1,5"
          value={values.rate}
          onChange={(v) => set('rate', v)}
          error={errors.rate}
          hint={
            values.rateUnit === 'year'
              ? isSimple
                ? 'Taxa anual convertida para mensal de forma proporcional (÷ 12), como manda o regime simples.'
                : undefined
              : undefined
          }
          addon={
            <UnitSelect id={id('rate-unit')} label="Unidade da taxa" value={values.rateUnit} onChange={(v) => set('rateUnit', v)} options={RATE_UNITS} />
          }
        />
        {!isSimple && values.rateUnit === 'year' && (
          <Segmented
            name={id('conversion')}
            legend="Como interpretar a taxa anual"
            value={values.conversion}
            onChange={(v) => set('conversion', v)}
            options={[
              { value: 'equivalent', label: 'Efetiva (equivalente)', description: 'Taxa efetiva anual: mensal = (1 + i)^(1/12) − 1.' },
              { value: 'proportional', label: 'Nominal (proporcional)', description: 'Taxa nominal com capitalização mensal: mensal = i ÷ 12.' },
            ]}
          />
        )}
        <NumberField
          id={id('term')}
          label="Prazo"
          placeholder="Ex.: 24"
          value={values.term}
          onChange={(v) => set('term', v)}
          error={errors.term}
          addon={<UnitSelect id={id('term-unit')} label="Unidade do prazo" value={values.termUnit} onChange={(v) => set('termUnit', v)} options={TERM_UNITS} />}
        />
      </CalculatorForm>

      {result ? (
        <ResultPanel title="Resultado da simulação" key={runId}>
          <Summary
            items={[
              { label: 'Capital inicial', value: money(result.result.principal) },
              { label: 'Juros acumulados', value: money(result.result.totalInterest), tone: 'positive' },
              { label: 'Montante final', value: money(result.result.finalAmount), tone: 'accent' },
            ]}
          />
          <Note>
            Taxa mensal usada: <strong>{formatPercent(result.monthlyRate)}</strong> · Prazo: <strong>{result.months} meses</strong> (
            {describeMonths(result.months)}).
          </Note>
          <EvolutionChart
            title="Evolução do montante"
            data={[{ period: 0, principal: result.result.principal, totalInterest: 0 }].concat(
              result.result.rows.map((r) => ({ period: r.period, principal: result.result.principal, totalInterest: r.totalInterest })),
            )}
            series={[
              { key: 'principal', label: 'Capital', color: CHART_COLORS.invested },
              { key: 'totalInterest', label: 'Juros acumulados', color: CHART_COLORS.interest },
            ]}
          />
          <EvolutionTable
            caption="Evolução mensal dos juros e do montante"
            rows={result.result.rows}
            columns={[
              { key: 'interest', label: 'Juros do período', aggregate: 'sum' },
              { key: 'totalInterest', label: 'Juros acumulados', aggregate: 'last' },
              { key: 'balance', label: 'Montante', aggregate: 'last' },
            ]}
          />
        </ResultPanel>
      ) : (
        <EmptyResult />
      )}
    </div>
  )
}
