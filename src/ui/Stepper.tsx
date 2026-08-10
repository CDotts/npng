type Props = {
  value: number
  step: number
  min?: number
  label: string
  suffix?: string
  onChange: (value: number) => void
}

export function Stepper({ value, step, min = 0, label, suffix, onChange }: Props) {
  const clamp = (v: number) => Math.max(min, Math.round(v * 100) / 100)
  return (
    <div className="stepper">
      <button type="button" aria-label={`Diminuir ${label}`} onClick={() => onChange(clamp(value - step))}>
        −
      </button>
      <div className="value">
        {Number.isInteger(value) ? value : value.toFixed(1)}
        {suffix}
        <small>{label}</small>
      </div>
      <button type="button" aria-label={`Aumentar ${label}`} onClick={() => onChange(clamp(value + step))}>
        +
      </button>
    </div>
  )
}
