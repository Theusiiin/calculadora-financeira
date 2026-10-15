import { useState } from 'react'
import { EvolutionChart } from '../components/LazyChart'
import { CHART_COLORS, RATE_UNITS, TERM_UNITS } from '../lib/constants'
import { NumberField, Segmented, UnitSelect } from '../components/Field'
import { CalculatorForm, EmptyResult, Note, ResultPanel } from '../components/Layout'
import { simulateInvestment, type InvestmentResult, type RateUnit, type TermUnit, type Timing } from '../lib/finance'
import { describeMonths, formatPercent } from '../lib/format'
import { validateMoney, validateRate, validateTerm, type Errors } from '../lib/inputs'
import { useCurrencySymbol, useMoney } from '../settings'

interface Scenario {
  name: string
  initial: string
  contribution: string
  rate: string
  rateUnit: RateUnit
}

const SAMPLE: Scenario[] = [
  { name: 'Poupança', initial: '10.000,00', contribution: '300,00', rate: '0,6', rateUnit: 'month' },
  { name: 'Renda fixa', initial: '10.000,00', contribution: '300,00', rate: '11', rateUnit: 'year' },
]
const BLANK_SCENARIO = (n: number): Scenario => ({ name: `Cenário ${n}`, initial: '', contribution: '', rate: '', rateUnit: 'month' })

interface Output {
  months: number
  scenarios: { name: string; monthlyRate: number; result: InvestmentResult; color: string }[]
}

export function ScenarioComparison() {
  const money = useMoney()
  const symbol = useCurrencySymbol()
  const [scenarios, setScenarios] = useState<Scenario[]>(SAMPLE)
  const [term, setTerm] = useState('5')
  const [termUnit, setTermUnit] = useState<TermUnit>('years')
  const [timing, setTiming] = useState<Timing>('end')
  const [errors, setErrors] = useState<Errors>({})
  const [output, setOutput] = useState<Output | null>(null)

  const update = (index: number, patch: Partial<Scenario>) => {
    setScenarios((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const reset = () => {
    setScenarios([BLANK_SCENARIO(1), BLANK_SCENARIO(2)])
    setTerm('')
    setTermUnit('months')
    setTiming('end')
    setErrors({})
    setOutput(null)
  }

  const calculate = () => {
    const errs: Errors = {}
    const t = validateTerm(term, termUnit)
    if (!t.ok) errs.term = t.error
    const parsed = scenarios.map((s, i) => {
      const p = validateMoney(s.initial, 'o capital inicial', { required: false })
      const a = validateMoney(s.contribution, 'o aporte mensal', { required: false })
      const r = validateRate(s.rate, s.rateUnit, 'equivalent')
      if (!p.ok) errs[`${i}-initial`] = p.error
      if (!a.ok) errs[`${i}-contribution`] = a.error
      if (!r.ok) errs[`${i}-rate`] = r.error
      if (p.ok && a.ok && p.value === 0 && a.value === 0) errs[`${i}-initial`] = 'Informe um capital inicial, um aporte ou ambos.'
      return { p, a, r, name: s.name.trim() || `Cenário ${i + 1}` }
    })
    setErrors(errs)
    if (Object.keys(errs).length || !t.ok) {
      setOutput(null)
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setOutput({
      months: t.months,
      scenarios: parsed.map(({ p, a, r, name }, i) => {
        if (!p.ok || !a.ok || !r.ok) throw new Error('unreachable')
        return {
          name,
          monthlyRate: r.monthly,
          color: CHART_COLORS.scenario[i],
          result: simulateInvestment({ initial: p.value, contribution: a.value, monthlyRate: r.monthly, months: t.months, timing }),
        }
      }),
    })
  }

  const best = output ? Math.max(...output.scenarios.map((s) => s.result.finalBalance)) : 0

  return (
    <div className="calculator">
      <CalculatorForm
        title="Comparação de cenários"
        description={<p>Compare até três investimentos com o mesmo prazo e a mesma regra de aportes. Taxas anuais são tratadas como efetivas.</p>}
        onSubmit={calculate}
        onReset={reset}
        submitLabel="Comparar"
      >
        <div className="scenario-grid">
          {scenarios.map((s, i) => (
            <fieldset key={i} className="scenario" style={{ borderTopColor: CHART_COLORS.scenario[i] }}>
              <legend className="sr-only">Cenário {i + 1}</legend>
              <div className="scenario__head">
                <label htmlFor={`sc-${i}-name`} className="sr-only">
                  Nome do cenário {i + 1}
                </label>
                <input id={`sc-${i}-name`} className="scenario__name" value={s.name} maxLength={30} onChange={(e) => update(i, { name: e.target.value })} />
                {scenarios.length > 2 && (
                  <button
                    type="button"
                    className="btn btn--icon"
                    aria-label={`Remover ${s.name || `cenário ${i + 1}`}`}
                    onClick={() => setScenarios((list) => list.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                )}
              </div>
              <NumberField id={`sc-${i}-initial`} label="Capital inicial" prefix={symbol} value={s.initial} onChange={(v) => update(i, { initial: v })} error={errors[`${i}-initial`]} />
              <NumberField
                id={`sc-${i}-contribution`}
                label="Aporte mensal"
                prefix={symbol}
                value={s.contribution}
                onChange={(v) => update(i, { contribution: v })}
                error={errors[`${i}-contribution`]}
              />
              <NumberField
                id={`sc-${i}-rate`}
                label="Taxa de juros"
                value={s.rate}
                onChange={(v) => update(i, { rate: v })}
                error={errors[`${i}-rate`]}
                addon={<UnitSelect id={`sc-${i}-rate-unit`} label="Unidade da taxa" value={s.rateUnit} onChange={(v) => update(i, { rateUnit: v })} options={RATE_UNITS} />}
              />
            </fieldset>
          ))}
        </div>
        {scenarios.length < 3 && (
          <button type="button" className="btn btn--ghost btn--add" onClick={() => setScenarios((l) => [...l, BLANK_SCENARIO(l.length + 1)])}>
            + Adicionar cenário
          </button>
        )}
        <NumberField
          id="sc-term"
          label="Prazo (comum a todos)"
          value={term}
          onChange={setTerm}
          error={errors.term}
          addon={<UnitSelect id="sc-term-unit" label="Unidade do prazo" value={termUnit} onChange={setTermUnit} options={TERM_UNITS} />}
        />
        <Segmented
          name="sc-timing"
          legend="Momento do aporte"
          value={timing}
          onChange={setTiming}
          options={[
            { value: 'end', label: 'Fim do mês' },
            { value: 'start', label: 'Início do mês' },
          ]}
        />
      </CalculatorForm>

      {output ? (
        <ResultPanel title="Comparativo">
          <div className="table-scroll">
            <table className="compare-table">
              <caption className="sr-only">Comparação entre cenários</caption>
              <thead>
                <tr>
                  <th scope="col">Cenário</th>
                  <th scope="col">Taxa mensal</th>
                  <th scope="col">Total investido</th>
                  <th scope="col">Juros</th>
                  <th scope="col">Montante final</th>
                  <th scope="col">Diferença p/ melhor</th>
                </tr>
              </thead>
              <tbody>
                {output.scenarios.map((s) => (
                  <tr key={s.name + s.color}>
                    <th scope="row">
                      <span className="dot" style={{ background: s.color }} aria-hidden="true" /> {s.name}
                    </th>
                    <td>{formatPercent(s.monthlyRate)}</td>
                    <td>{money(s.result.invested)}</td>
                    <td>{money(s.result.totalInterest)}</td>
                    <td>
                      <strong>{money(s.result.finalBalance)}</strong>
                    </td>
                    <td>{s.result.finalBalance === best ? <span className="badge">Melhor</span> : money(s.result.finalBalance - best)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>
            Prazo: {output.months} meses ({describeMonths(output.months)}). Simulação bruta: não considera impostos, taxas, liquidez, risco ou
            inflação.
          </Note>
          <EvolutionChart
            title="Saldo de cada cenário ao longo do tempo"
            kind="line"
            data={Array.from({ length: output.months }, (_, k) => {
              const row: Record<string, number> = { period: k + 1 }
              output.scenarios.forEach((s, i) => (row[`s${i}`] = s.result.rows[k].balance))
              return row
            })}
            series={output.scenarios.map((s, i) => ({ key: `s${i}`, label: s.name, color: s.color }))}
          />
        </ResultPanel>
      ) : (
        <EmptyResult text="Configure os cenários e clique em “Comparar”." />
      )}
    </div>
  )
}
