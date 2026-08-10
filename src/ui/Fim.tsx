import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dayOf, blockOfSession, exerciseById, program } from '../program/load'
import { proposeProgression, currentTargetReps, pendingCommitment, commitmentForSession } from '../engine/progression'
import { sessionReps, sessionTonnage } from '../engine/log'
import { addCommitment } from '../store/db'
import { buildCsv, share } from '../store/transfer'
import { useLog, fmtDuration, fmtKg } from './useLog'
import { StorageError } from './StorageError'

export function Fim() {
  const { sessionId = '' } = useParams()
  const nav = useNavigate()
  const log = useLog()
  const [committed, setCommitted] = useState<Record<string, boolean>>({})
  const [shared, setShared] = useState<string | null>(null)

  const session = log.sessions.find((s) => s.id === sessionId)
  const sets = useMemo(() => log.sets.filter((s) => s.sessionId === sessionId), [log.sets, sessionId])

  const reviewed = useMemo(() => {
    if (!session) return []
    const day = dayOf(session)
    if (!day) return []
    const meso = blockOfSession(session)
    return day.exercises
      .filter((id) => sets.some((s) => s.exerciseId === id && s.type === 'work'))
      .map((id) => {
        const ex = exerciseById.get(id)!
        const before = log.sets.filter((s) => s.sessionId !== sessionId)
        const applied = commitmentForSession(ex.id, log.commitments, session.startedAt)
        const prescribed = applied?.targetReps ?? currentTargetReps(ex, meso, session.mesoWeek, before)
        return {
          ex,
          proposal: proposeProgression(ex, meso, session.mesoWeek, sets, prescribed),
        }
      })
  }, [session, sets, log.sets, log.commitments, sessionId])

  const proposals = reviewed.filter((r) => r.proposal.kind !== 'hold')
  const holds = reviewed.filter((r) => r.proposal.kind === 'hold')

  if (log.error) return <StorageError message={log.error} onRetry={log.reload} />
  if (log.loading) return <div className="app" />
  if (!session) {
    return (
      <div className="app">
        <div className="top">
          <h1>Sessão não encontrada</h1>
        </div>
        <button className="big" onClick={() => nav('/')}>
          Voltar
        </button>
      </div>
    )
  }

  const day = dayOf(session)
  const duration = (session.endedAt ?? Date.now()) - session.startedAt
  const workSets = sets.filter((s) => s.type === 'work')

  const exportCsv = async () => {
    const csv = await buildCsv()
    const result = await share('npng-treinos.csv', csv, 'text/csv')
    setShared(result === 'shared' ? 'Compartilhado.' : result === 'downloaded' ? 'Arquivo baixado.' : null)
  }

  return (
    <div className="app">
      <div className="top">
        <h1>Treino concluído</h1>
        <span className="muted small mono">
          {day?.id} · semana {session.mesoWeek}
        </span>
      </div>

      <div className="card">
        <div className="row between mono">
          <div className="col">
            <b>{fmtDuration(duration)}</b>
            <span className="dim small">duração</span>
          </div>
          <div className="col">
            <b>{workSets.length}</b>
            <span className="dim small">séries</span>
          </div>
          <div className="col">
            <b>{sessionReps(sets)}</b>
            <span className="dim small">reps</span>
          </div>
          <div className="col">
            <b>{Math.round(sessionTonnage(program, sets)).toLocaleString('pt-BR')}</b>
            <span className="dim small">kg</span>
          </div>
        </div>
      </div>

      {proposals.length === 0 && (
        <div className="card">
          <h2>Nenhuma progressão proposta</h2>
          <p className="muted small" style={{ margin: '8px 0 0' }}>
            O critério de subida não foi atingido. Detalhe por exercício abaixo.
          </p>
        </div>
      )}

      {proposals.map(({ ex, proposal }) => {
          if (proposal.kind === 'hold') return null
          const key = ex.id
          return (
            <div className="card" key={key}>
              <div className="row between">
                <h2>{ex.name}</h2>
                <span className="muted mono small">
                  {proposal.targetReps} × {fmtKg(proposal.targetLoadKg)} kg
                </span>
              </div>
              <p className="muted small" style={{ margin: '8px 0 12px' }}>
                {proposal.reason}
              </p>
              {pendingCommitment(ex.id, log.commitments) || committed[key] ? (
                <span className="done small">Comprometido. Reaparece no próximo {day?.id}.</span>
              ) : (
                <div className="row">
                  <button
                    className="grow primary"
                    onClick={async () => {
                      await addCommitment(ex.id, proposal.targetReps, proposal.targetLoadKg, proposal.kind)
                      setCommitted((c) => ({ ...c, [key]: true }))
                      await log.reload()
                    }}
                  >
                    Comprometer
                  </button>
                  <button className="ghost" onClick={() => setCommitted((c) => ({ ...c, [key]: true }))}>
                    Agora não
                  </button>
                </div>
              )}
            </div>
          )
        })}

      {holds.length > 0 && (
        <div className="card">
          <h2>Sem progressão</h2>
          {holds.map(({ ex, proposal }) => {
            const mine = sets.filter((s) => s.exerciseId === ex.id && s.type === 'work')
            const best = mine.reduce((a, b) => (b.reps > a.reps ? b : a), mine[0])
            return (
              <div key={ex.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <div className="row between">
                  <span>{ex.name}</span>
                  <span className="dim small mono">
                    melhor {best.reps} × {fmtKg(best.loadKg)} kg · alvo {ex.reps[0]}-{ex.reps[1]} @ RIR{' '}
                    {ex.rir}
                  </span>
                </div>
                <p className="muted small" style={{ margin: '4px 0 0' }}>
                  {proposal.reason}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <button className="primary big" onClick={exportCsv} style={{ marginBottom: 10 }}>
        Compartilhar CSV
      </button>
      {shared && <p className="muted small">{shared}</p>}
      <button className="big" onClick={() => nav('/')}>
        Voltar ao início
      </button>
    </div>
  )
}
