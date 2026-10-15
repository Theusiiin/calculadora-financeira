import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { formatMoney, type CurrencyCode } from './lib/format'

interface Settings {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
}

const SettingsContext = createContext<Settings>({ currency: 'BRL', setCurrency: () => {} })
const STORAGE_KEY = 'calc-fin:currency'

function readStoredCurrency(): CurrencyCode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'BRL' || v === 'USD' || v === 'EUR') return v
  } catch {
    /* armazenamento indisponível: usa o padrão */
  }
  return 'BRL'
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(readStoredCurrency)
  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c)
    try {
      localStorage.setItem(STORAGE_KEY, c)
    } catch {
      /* ignora */
    }
  }, [])
  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}

export function useMoney() {
  const { currency } = useSettings()
  return useCallback((v: number) => formatMoney(v, currency), [currency])
}

const SYMBOLS: Record<string, string> = { BRL: 'R$', USD: 'US$', EUR: '€' }

export function useCurrencySymbol() {
  return SYMBOLS[useSettings().currency]
}
