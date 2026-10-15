import { useCallback, useState } from 'react'
import type { Errors } from './inputs'

/**
 * Estado simples de formulário: valores (texto), erros e resultado.
 * `reset` volta todos os campos para `blank` e descarta resultado e erros.
 */
export function useCalculatorForm<V extends Record<string, string>, R>(initial: V, blank: V) {
  const [values, setValues] = useState<V>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [result, setResult] = useState<R | null>(null)
  const [runId, setRunId] = useState(0)

  const set = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => {
      if (!e[key as string]) return e
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setValues(blank)
    setErrors({})
    setResult(null)
  }, [blank])

  const commit = useCallback((nextErrors: Errors, nextResult: R | null) => {
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setResult(null)
      // move o foco para o primeiro campo inválido
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        first?.focus()
      })
      return
    }
    setResult(nextResult)
    setRunId((n) => n + 1)
  }, [])

  return { values, set, errors, result, runId, reset, commit }
}
