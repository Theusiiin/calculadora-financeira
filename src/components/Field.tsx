import type { ReactNode } from 'react'

interface NumberFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  prefix?: string
  placeholder?: string
  /** controle adicional exibido à direita (ex.: seletor de unidade) */
  addon?: ReactNode
}

export function NumberField({ id, label, value, onChange, error, hint, prefix, placeholder, addon }: NumberFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field__row">
        <div className="field__input">
          {prefix && <span className="field__prefix" aria-hidden="true">{prefix}</span>}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
        {addon}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="field__hint">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface SelectProps<T extends string> {
  id: string
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  visuallyHiddenLabel?: boolean
}

export function UnitSelect<T extends string>({ id, label, value, onChange, options, visuallyHiddenLabel = true }: SelectProps<T>) {
  return (
    <>
      <label htmlFor={id} className={visuallyHiddenLabel ? 'sr-only' : undefined}>
        {label}
      </label>
      <select id={id} className="unit-select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  )
}

interface SegmentedProps<T extends string> {
  name: string
  legend: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; description?: string }[]
}

export function Segmented<T extends string>({ name, legend, value, onChange, options }: SegmentedProps<T>) {
  return (
    <fieldset className="segmented">
      <legend>{legend}</legend>
      <div className="segmented__options">
        {options.map((o) => (
          <label key={o.value} className={`segmented__option${value === o.value ? ' is-active' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {options.find((o) => o.value === value)?.description && (
        <p className="field__hint">{options.find((o) => o.value === value)?.description}</p>
      )}
    </fieldset>
  )
}

