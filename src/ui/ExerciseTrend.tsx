import { useMemo } from 'react'
import type { SetRow } from '../store/db'
import { topSet } from '../engine/progression'
import { Chart } from './Chart'
import { fmtKg } from './useLog'

export function ExerciseTrend({ exerciseId, sets }: { exerciseId: string; sets: SetRow[] }) {
  const points = useMemo(() => {
    const bySession = new Map<string, SetRow[]>()
    for (const s of sets) {
      if (s.type !== 'work' || s.exerciseId !== exerciseId) continue
      bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s])
    }
    return [...bySession.values()]
      .map((group) => topSet(group)!)
      .filter(Boolean)
      .sort((a, b) => a.at - b.at)
  }, [sets, exerciseId])

  if (points.length === 0) return <span className="dim small">Sem histórico ainda.</span>

  return (
    <>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="small muted">Carga da melhor série</span>
      </div>
      <Chart points={points.map((p) => ({ at: p.at, value: p.loadKg }))} unit=" kg" format={fmtKg} />

      <div className="row between" style={{ margin: '16px 0 6px' }}>
        <span className="small muted">Reps da melhor série</span>
      </div>
      <Chart
        points={points.map((p) => ({ at: p.at, value: p.reps }))}
        color="var(--warn)"
        unit=" reps"
      />

      <p className="dim small" style={{ margin: '12px 0 0' }}>
        Na dupla progressão as reps sobem primeiro; ao atingir o teto da faixa, resetam e a carga
        sobe. Daí o padrão em degrau alternado entre os dois gráficos.
      </p>
    </>
  )
}
