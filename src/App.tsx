import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Formulas } from './features/Formulas'
import { InterestCalculator } from './features/InterestCalculator'
import { InvestmentCalculator } from './features/InvestmentCalculator'
import { LoanCalculator } from './features/LoanCalculator'
import { RateConverter } from './features/RateConverter'
import { ScenarioComparison } from './features/ScenarioComparison'
import { CURRENCIES, type CurrencyCode } from './lib/format'
import { SettingsProvider, useSettings } from './settings'

const TABS = [
  { id: 'investimentos', label: 'Investimentos', render: () => <InvestmentCalculator /> },
  { id: 'financiamento', label: 'Financiamento', render: () => <LoanCalculator /> },
  { id: 'juros-compostos', label: 'Juros compostos', render: () => <InterestCalculator regime="compound" /> },
  { id: 'juros-simples', label: 'Juros simples', render: () => <InterestCalculator regime="simple" /> },
  { id: 'comparar', label: 'Comparar cenários', render: () => <ScenarioComparison /> },
  { id: 'taxas', label: 'Conversão de taxas', render: () => <RateConverter /> },
  { id: 'formulas', label: 'Fórmulas', render: () => <Formulas /> },
] as const

type TabId = (typeof TABS)[number]['id']

function tabFromHash(): TabId {
  const id = window.location.hash.replace('#', '')
  return (TABS.find((t) => t.id === id)?.id ?? 'investimentos') as TabId
}

function CurrencyPicker() {
  const { currency, setCurrency } = useSettings()
  return (
    <div className="currency-picker">
      <label htmlFor="currency">Moeda</label>
      <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function Shell() {
  const [active, setActive] = useState<TabId>(tabFromHash)
  const [visited, setVisited] = useState<Set<TabId>>(() => new Set([tabFromHash()]))
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const activate = useCallback((id: TabId) => {
    setActive(id)
    // abas já visitadas continuam montadas (ocultas) para preservar o que foi digitado
    setVisited((v) => (v.has(id) ? v : new Set(v).add(id)))
  }, [])

  useEffect(() => {
    const onHash = () => activate(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [activate])

  useEffect(() => {
    // mantém a aba ativa visível na barra rolável (telas pequenas)
    const el = tabRefs.current[active]
    const list = el?.parentElement
    if (el && list) list.scrollLeft = el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2
  }, [active])

  const select = (id: TabId, focus = false) => {
    activate(id)
    history.replaceState(null, '', `#${id}`)
    if (focus) tabRefs.current[id]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const idx = TABS.findIndex((t) => t.id === active)
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length
    if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = TABS.length - 1
    if (next >= 0) {
      e.preventDefault()
      select(TABS[next].id, true)
    }
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <rect width="32" height="32" rx="8" />
                <path d="M8 22l6-6 4 4 7-9" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h1>Calculadora Financeira</h1>
              <p>Simule juros, investimentos e financiamentos com clareza.</p>
            </div>
          </div>
          <CurrencyPicker />
        </div>
        <nav className="tabs" aria-label="Calculadoras">
          <div role="tablist" aria-label="Tipo de cálculo" className="tabs__list" onKeyDown={onKeyDown}>
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el
                }}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={active === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={active === t.id ? 0 : -1}
                className="tabs__tab"
                onClick={() => select(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main id="conteudo" className="container">
        {TABS.map((t) =>
          visited.has(t.id) ? (
            <section key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
              {t.render()}
            </section>
          ) : null,
        )}
      </main>

      <footer className="footer">
        <p>
          <strong>Aviso:</strong> os resultados são simulações com fins educativos e não constituem aconselhamento financeiro. Valores reais
          dependem de impostos, tarifas, seguros e condições contratuais.
        </p>
        <p>
          Desenvolvido por Matheus Bonfatti ·{' '}
          <a href="https://github.com/Theusiiin/calculadora-financeira" target="_blank" rel="noreferrer">
            Código-fonte no GitHub
          </a>
        </p>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  )
}
