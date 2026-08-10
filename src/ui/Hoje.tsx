import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { program, exerciseById } from '../program/load'
import { sessionTonnage } from '../engine/log'
import { activeBlock, nextDayId } from '../engine/block'
import { setsForWeek } from '../engine/mesocycle'
import { estimateDaySeconds, fmtMinutes, SESSION_CAP_S } from '../engine/duration'
import { useLog, photoUrl, fmtKg } from './useLog'
import { Chart } from './Chart'
import { currentLoad, currentTargetReps } from '../engine/progression'
import { StorageError } from './StorageError'
import { discardSession, startSession } from '../store/db'
import { startKeepAlive } from '../timer/keepAlive'
import { buildCsv, share } from '../store/transfer'
import type { Day } from '../program/schema'

export function Hoje() {
  const nav = useNavigate()
  const log = useLog()
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [exported, setExported] = useState<string | null>(null)

  if (log.error) return <StorageError message={log.error} onRetry={log.reload} />
  if (log.loading) return <div className="app" />

  const active = activeBlock(program, log.sessions)
  const meso = active.block
  const week = active.week
  const nextId = nextDayId(active, program, log.sessions)
  const isDeload = active.inDeload
  const openSession = log.sessions.find((s) => s.endedAt === null)
  const heldCommitments = log.commitments.filter((c) => c.status === 'pending').length

  const begin = async (dayId: string) => {
    await startKeepAlive()
    if (openSession) {
      nav(`/treino/${openSession.id}`)
      return
    }
    const session = await startSession(dayId, week, meso.id)
    nav(`/treino/${session.id}`)
  }

  const setsOf = (day: Day) =>
    day.exercises.reduce((sum, id) => sum + setsForWeek(exerciseById.get(id)!, meso, week), 0)

  const tonnageOf = (dayId: string) =>
    log.sessions
      .filter((s) => s.dayId === dayId && s.endedAt !== null)
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((s) => ({
        at: s.startedAt,
        value: sessionTonnage(program, log.sets.filter((x) => x.sessionId === s.id)),
      }))

  const lastDone = (dayId: string) => {
    const done = log.sessions.filter((s) => s.dayId === dayId && s.endedAt !== null)
    if (done.length === 0) return null
    return new Date(Math.max(...done.map((s) => s.startedAt)))
  }

  return (
    <div className="app">
      <div className="top">
        <h1>Hoje</h1>
        <span className="muted small mono">
          {meso.name} · semana {week}
        </span>
      </div>

      {isDeload && !active.finished && (
        <div className="notice warn">
          <b>Semana de deload.</b> Volume cortado pela metade após o acúmulo de fadiga do bloco.
          Progressão e commitments ficam suspensos até o próximo bloco.
        </div>
      )}

      {active.queued.length > 0 && (
        <div className="notice info">
          <b>Próximo bloco já carregado:</b> {active.queued[0].name}. Entra em vigor quando o bloco
          atual fechar, sem interromper o deload.
        </div>
      )}

      {active.pastAccumulation && active.queued.length === 0 && (
        <div className="card">
          <h2>Próximo bloco</h2>
          <p className="muted small" style={{ margin: '8px 0 0' }}>
            As {meso.weeks} semanas de {meso.type === 'acumulacao' ? 'acumulação' : meso.type} estão
            fechadas — os dados para o diagnóstico já estão completos. Gere o próximo bloco{' '}
            <b>agora</b>
            {isDeload ? ', durante o deload' : ''}: é o prazo disponível para escrever, validar e
            publicar sem atrasar o início.
          </p>
          <p className="dim small" style={{ margin: '8px 0 12px' }}>
            Exporte o CSV e peça a análise. O procedimento está na skill{' '}
            <code>proximo-bloco</code> do repositório.
          </p>
          <button
            className="big"
            onClick={async () => {
              const result = await share('npng-treinos.csv', await buildCsv(), 'text/csv')
              if (result !== 'cancelled') setExported('CSV gerado.')
            }}
          >
            Exportar CSV do bloco
          </button>
          {exported && (
            <p className="dim small" style={{ margin: '10px 0 0' }}>
              {exported}
            </p>
          )}
        </div>
      )}

      {active.finished && active.queued.length === 0 && (
        <div className="notice warn">
          <b>Bloco concluído.</b> {active.done} sessões registradas, incluindo o deload. O app segue
          repetindo a semana de deload até um novo <code>training.yaml</code> ser publicado.
          {heldCommitments > 0 && (
            <>
              {' '}
              {heldCommitments} commitment{heldCommitments > 1 ? 's' : ''} guardado
              {heldCommitments > 1 ? 's' : ''} para a primeira semana do próximo bloco.
            </>
          )}
        </div>
      )}

      {openSession && (
        <div className="notice info">
          <div className="row between">
            <span>
              Treino em andamento desde{' '}
              {new Date(openSession.startedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}
              .
            </span>
            <button
              className="ghost small"
              onClick={async () => {
                await discardSession(openSession.id)
                await log.reload()
              }}
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {meso.days.map((day) => {
        const isNext = day.id === nextId
        const estimate = estimateDaySeconds(program, meso, day, week)
        const expanded = isNext || openDay === day.id
        const last = lastDone(day.id)
        return (
          <div className={isNext ? 'card next' : 'card'} key={day.id}>
            <button
              className="ghost daybtn"
              onClick={() => setOpenDay(expanded && !isNext ? null : day.id)}
              aria-expanded={expanded}
            >
              <div className="col grow" style={{ alignItems: 'flex-start' }}>
                <span className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <b>
                    {day.id} · {day.name}
                  </b>
                  {isDeload && <span className="tag warn">deload</span>}
                </span>
                <span className="dim small mono">
                  {setsOf(day)} séries · ≈{fmtMinutes(estimate)}
                  {last
                    ? ` · último em ${last.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
                    : ' · nunca feito'}
                </span>
              </div>
              {!isNext && <span className="dim">{expanded ? '⌃' : '⌄'}</span>}
            </button>

            {expanded && (
              <div style={{ marginTop: 10 }}>
                {day.exercises.map((id) => {
                  const ex = exerciseById.get(id)!
                  return (
                    <div className="row" key={id} style={{ padding: '7px 0' }}>
                      <img className="thumb" src={photoUrl(ex.photo)} alt="" loading="lazy" />
                      <div className="grow col">
                        <span>{ex.name}</span>
                        <span className="dim small mono">
                          {setsForWeek(ex, meso, week)}×{' '}
                          {currentTargetReps(ex, meso, week, log.sets)} reps ·{' '}
                          {fmtKg(currentLoad(ex, log.sets).loadKg)} kg · RIR {ex.rir}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {tonnageOf(day.id).length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <span className="small muted">Carga total deste treino</span>
                      <span className="dim small mono">reps × peso</span>
                    </div>
                    <Chart
                      points={tonnageOf(day.id)}
                      unit=" kg"
                      height={70}
                      format={(v) => Math.round(v).toLocaleString('pt-BR')}
                    />
                  </div>
                )}

                {estimate > SESSION_CAP_S && (
                  <p className="small" style={{ color: 'var(--warn)', margin: '10px 0 0' }}>
                    Estimativa acima do teto de {fmtMinutes(SESSION_CAP_S)}.
                  </p>
                )}

                {isNext && (
                  <button className="primary big" style={{ marginTop: 12 }} onClick={() => begin(day.id)}>
                    {openSession ? 'Continuar treino' : `Iniciar ${day.id}`}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      <p className="dim small" style={{ marginTop: 4 }}>
        A ordem A→B→C→D deriva da última sessão concluída, não do dia da semana.
      </p>
    </div>
  )
}
