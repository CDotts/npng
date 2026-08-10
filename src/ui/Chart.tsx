type Point = { at: number; value: number }

type Props = {
  points: Point[]
  color?: string
  unit?: string
  height?: number
  format?: (v: number) => string
}

const W = 320

export function Chart({ points, color = 'var(--accent)', unit = '', height = 84, format }: Props) {
  if (points.length === 0) return <span className="dim small">Sem histórico ainda.</span>
  const fmt = format ?? ((v: number) => String(Math.round(v)))

  if (points.length === 1) {
    return (
      <span className="mono small muted">
        {fmt(points[0].value)}
        {unit} — um treino só, a linha começa no segundo.
      </span>
    )
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.max(1, max * 0.1)
  const pad = 14
  const step = (W - pad * 2) / (points.length - 1)
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)
  const x = (i: number) => pad + i * step
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} ${x(points.length - 1).toFixed(1)},${height - pad} ${x(0).toFixed(1)},${height - pad}`
  const last = points[points.length - 1]

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <polygon points={area} fill={color} opacity="0.1" />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 3.5 : 2} fill={color} />
        ))}
      </svg>
      <div className="row between small dim mono">
        <span>
          {new Date(points[0].at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ·{' '}
          {fmt(min)}
          {unit}
        </span>
        <span style={{ color }}>
          {fmt(last.value)}
          {unit}
        </span>
      </div>
    </div>
  )
}
