import type { FormEvent, ReactNode } from 'react'

interface CalculatorFormProps {
  title: string
  description: ReactNode
  onSubmit: () => void
  onReset: () => void
  children: ReactNode
  submitLabel?: string
}

/** Formulário padrão: título, campos e botões Calcular / Limpar. */
export function CalculatorForm({ title, description, onSubmit, onReset, children, submitLabel = 'Calcular' }: CalculatorFormProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }
  return (
    <form className="panel panel--form" onSubmit={handleSubmit} noValidate>
      <header className="panel__header">
        <h2>{title}</h2>
        <div className="panel__description">{description}</div>
      </header>
      <div className="form-grid">{children}</div>
      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Limpar e reiniciar
        </button>
      </div>
    </form>
  )
}

export interface SummaryItem {
  label: string
  value: string
  tone?: 'default' | 'accent' | 'positive' | 'warning'
  note?: string
}

export function Summary({ items }: { items: SummaryItem[] }) {
  return (
    <dl className="summary">
      {items.map((item) => (
        <div key={item.label} className={`summary__item summary__item--${item.tone ?? 'default'}`}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.note && <p className="summary__note">{item.note}</p>}
        </div>
      ))}
    </dl>
  )
}

export function ResultPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel panel--result" aria-live="polite">
      <h2 className="panel__title">{title}</h2>
      {children}
    </section>
  )
}

export function EmptyResult({ text = 'Preencha os campos e clique em “Calcular” para ver o resultado.' }: { text?: string }) {
  return (
    <section className="panel panel--empty" aria-live="polite">
      <div className="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="56" height="56">
          <rect x="8" y="36" width="10" height="20" rx="2" />
          <rect x="27" y="24" width="10" height="32" rx="2" />
          <rect x="46" y="10" width="10" height="46" rx="2" />
        </svg>
      </div>
      <p>{text}</p>
    </section>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>
}
