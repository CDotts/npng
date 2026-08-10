import { useMemo } from 'react'
import { dayOf, program } from '../program/load'
import { sessionTonnage, weekStart } from '../engine/log'
import { useLog, fmtDuration } from './useLog'
import { StorageError } from './StorageError'
import { Calendar } from './Calendar'
import { Chart } from './Chart'
import { Accordion } from './Accordion'

export function Historico() {
  const log = useLog()

  const sessions = useMemo(
    () => log.sessions.filter((s) => s.endedAt !== null).sort((a, b) => a.startedAt - b.startedAt),
    [log.sessions],
  )

  // Por sessão o gráfico serrilha: um dia de perna pesa muito mais que um de
  // superior. Por semana a tendência aparece.
  const tonnage = useMemo(() => {
    const byWeek = new Map<number, number>()
    for (const s of sessions) {
      const w = weekStart(s.startedAt)
      const t = sessionTonnage(program, log.sets.filter((x) => x.sessionId === s.id))
      byWeek.set(w, (byWeek.get(w) ?? 0) + t)
    }
    return [...byWeek.entries()].sort((a, b) => a[0] - b[0]).map(([at, value]) => ({ at, value }))
  }, [sessions, log.sets])

  if (log.error) return <StorageError message={log.error} onRetry={log.reload} />
  if (log.loading) return <div className="app" />

  const weeks = new Set(sessions.map((s) => weekStart(s.startedAt)))
  const recent = [...sessions].reverse()

  return (
    <div className="app">
      <div className="top">
        <h1>Histórico</h1>
        <span className="muted small mono">
          {sessions.length} sessões · {weeks.size} semanas
        </span>
      </div>

      {sessions.length === 0 && (
        <div className="card">
          <h2>Ainda vazio</h2>
          <p className="muted small" style={{ margin: '8px 0 0' }}>
            O calendário e a curva de carga total aparecem após a primeira sessão registrada.
          </p>
        </div>
      )}

      {sessions.length > 0 && (
        <>
          <div className="card">
            <div className="row between" style={{ marginBottom: 12 }}>
              <h2>Calendário</h2>
              <span className="dim small mono">{weeks.size} semanas treinadas</span>
            </div>
            <Calendar entries={sessions.map((s) => ({ at: s.startedAt, dayId: s.dayId }))} />
          </div>

          <div className="card">
            <div className="row between" style={{ marginBottom: 10 }}>
              <h2>Carga total por semana</h2>
              <span className="dim small mono">reps × peso</span>
            </div>
            <Chart points={tonnage} unit=" kg" format={(v) => Math.round(v).toLocaleString('pt-BR')} />
            <p className="dim small" style={{ margin: '10px 0 0' }}>
              Soma de reps × peso de todas as séries da semana. Responde a carga, reps e número de
              séries. Carga e reps separadas ficam na tela do exercício.
            </p>
          </div>

          <Accordion title={`Sessões (${sessions.length})`}>
            {recent.map((s) => {
              const sets = log.sets.filter((x) => x.sessionId === s.id && x.type === 'work')
              const day = dayOf(s)
              return (
                <div className="row between" key={s.id} style={{ padding: '10px 0' }}>
                  <div className="col grow">
                    <span>
                      {day?.id} · {day?.name}
                    </span>
                    <span className="dim small">
                      {new Date(s.startedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}{' '}
                      · semana {s.mesoWeek}
                    </span>
                  </div>
                  <div className="col mono small" style={{ textAlign: 'right' }}>
                    <span>{sets.length} séries</span>
                    <span className="dim">
                      {s.endedAt ? fmtDuration(s.endedAt - s.startedAt) : '—'} ·{' '}
                      {Math.round(sessionTonnage(program, sets)).toLocaleString('pt-BR')} kg
                    </span>
                  </div>
                </div>
              )
            })}
          </Accordion>
        </>
      )}
    </div>
  )
}
