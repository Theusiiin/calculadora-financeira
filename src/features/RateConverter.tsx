import { NumberField, UnitSelect } from '../components/Field'
import { RATE_UNITS } from '../lib/constants'
import { CalculatorForm, EmptyResult, Note, ResultPanel } from '../components/Layout'
import {
  annualToMonthlyEquivalent,
  annualToMonthlyProportional,
  monthlyToAnnualEquivalent,
  monthlyToAnnualProportional,
  nominalAnnualToEffectiveAnnual,
  type RateUnit,
} from '../lib/finance'
import { formatPercent } from '../lib/format'
import { LIMITS, validateNumber } from '../lib/parse'
import { useCalculatorForm } from '../lib/useForm'

type Values = { rate: string; unit: RateUnit }

interface Output {
  rate: number
  unit: RateUnit
}

export function RateConverter() {
  const { values, set, errors, result, reset, commit } = useCalculatorForm<Values, Output>({ rate: '1', unit: 'month' }, { rate: '', unit: 'month' })

  const calculate = () => {
    const v = validateNumber(values.rate, {
      label: 'a taxa',
      min: 0,
      max: values.unit === 'month' ? LIMITS.maxRatePercentMonth : LIMITS.maxRatePercentYear,
    })
    if (!v.ok) return commit({ rate: v.error }, null)
    commit({}, { rate: v.value / 100, unit: values.unit })
  }

  let rows: { label: string; formula: string; value: number; highlight?: boolean }[] = []
  if (result) {
    const i = result.rate
    rows =
      result.unit === 'month'
        ? [
            { label: 'Anual equivalente (efetiva)', formula: '(1 + iₘ)¹² − 1', value: monthlyToAnnualEquivalent(i), highlight: true },
            { label: 'Anual proporcional (nominal)', formula: 'iₘ × 12', value: monthlyToAnnualProportional(i) },
          ]
        : [
            { label: 'Mensal equivalente', formula: '(1 + iₐ)^(1/12) − 1', value: annualToMonthlyEquivalent(i), highlight: true },
            { label: 'Mensal proporcional', formula: 'iₐ ÷ 12', value: annualToMonthlyProportional(i) },
            { label: 'Efetiva anual, se a taxa informada for nominal com capitalização mensal', formula: '(1 + iₐ/12)¹² − 1', value: nominalAnnualToEffectiveAnnual(i) },
          ]
  }

  return (
    <div className="calculator">
      <CalculatorForm
        title="Conversão de taxas"
        description={
          <p>
            Converta taxas entre mensal e anual e veja a diferença entre a conversão <strong>equivalente</strong> (juros compostos) e a{' '}
            <strong>proporcional</strong> (juros simples / taxa nominal).
          </p>
        }
        onSubmit={calculate}
        onReset={reset}
        submitLabel="Converter"
      >
        <NumberField
          id="conv-rate"
          label="Taxa informada"
          placeholder="Ex.: 1"
          value={values.rate}
          onChange={(v) => set('rate', v)}
          error={errors.rate}
          addon={<UnitSelect id="conv-unit" label="Unidade da taxa" value={values.unit} onChange={(v) => set('unit', v)} options={RATE_UNITS} />}
        />
      </CalculatorForm>

      {result ? (
        <ResultPanel title="Taxas convertidas">
          <ul className="rate-list">
            {rows.map((r) => (
              <li key={r.label} className={r.highlight ? 'is-highlight' : undefined}>
                <div>
                  <span className="rate-list__label">{r.label}</span>
                  <code>{r.formula}</code>
                </div>
                <strong>{formatPercent(r.value, 6)}</strong>
              </li>
            ))}
          </ul>
          <Note>
            <strong>Qual usar?</strong> Para aplicações e financiamentos (juros compostos), use a taxa <em>equivalente</em>: ela produz o mesmo
            montante no mesmo prazo. A proporcional só é correta em juros simples ou quando o contrato informa uma taxa <em>nominal</em> — que
            não é a taxa efetivamente cobrada.
          </Note>
        </ResultPanel>
      ) : (
        <EmptyResult text="Informe uma taxa e clique em “Converter”." />
      )}
    </div>
  )
}
