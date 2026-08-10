import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { program, dayOf, exerciseById } from '../program/load'
import { isDeload, setsForWeek } from '../engine/mesocycle'
import { effectiveLoad, DEFAULT_BAR_KG } from '../engine/load'
import { blockOfSession } from '../program/load'
import {
  commitmentForSession,
  currentLoad,
  currentTargetReps,
  honorsCommitment,
  proposeProgression,
  warmupLadder,
  JUNK_RIR,
} from '../engine/progression'
import {
  addCommitment,
  addSet,
  discardSession,
  endSession,
  removeSet,
  resolveCommitment,
  saveSetup,
} from '../store/db'
import { useLog, photoUrl, fmtClock, fmtKg } from './useLog'
import { StorageError } from './StorageError'
import { Stepper } from './Stepper'
import { useRestTimer } from '../timer/useRestTimer'
import { startKeepAlive, stopKeepAlive } from '../timer/keepAlive'
import { FIRST_TIME_NOTICE } from '../flags'
import { Accordion } from './Accordion'
import { ExerciseTrend } from './ExerciseTrend'

const RIR_OPTIONS = [0, 1, 2, 3, 4]

/**
 * O passo do ajuste de carga é fixo em 0,5 kg, independente do `increment` do
 * exercício. `increment` é quanto a progressão SOBE; o passo é a granularidade
 * de digitação — e adivinhar a menor anilha de cada aparelho é inviável.
 */
const LOAD_STEP = 0.5

export function Runner() {
  const { sessionId = '' } = useParams()
  const nav = useNavigate()
  const log = useLog()
  const [pos, setPos] = useState(0)
  const [load, setLoad] = useState<number | null>(null)
  const [reps, setReps] = useState<number | null>(null)
  const [rir, setRir] = useState(2)
  const [editingSetup, setEditingSetup] = useState(false)
  const [setupText, setSetupText] = useState('')
  const [declined, setDeclined] = useState<string[]>([])

  const session = log.sessions.find((s) => s.id === sessionId)
  const day = session ? dayOf(session) : undefined
  const meso = session ? (blockOfSession(session) ?? program.blocks[0]) : program.blocks[0]
  const exercise = day ? exerciseById.get(day.exercises[pos]) : undefined

  const sessionSets = useMemo(
    () => log.sets.filter((s) => s.sessionId === sessionId),
    [log.sets, sessionId],
  )
  const doneHere = useMemo(
    () => sessionSets.filter((s) => s.exerciseId === exercise?.id).sort((a, b) => a.index - b.index),
    [sessionSets, exercise?.id],
  )

  const historySets = useMemo(
    () => log.sets.filter((s) => s.sessionId !== sessionId),
    [log.sets, sessionId],
  )

  const timer = useRestTimer(
    exercise ? { exercise: exercise.name, nextSet: doneHere.length + 1 } : undefined,
  )

  const planned = exercise && session ? setsForWeek(exercise, meso, session.mesoWeek) : 0
  const inDeload = session ? isDeload(meso, session.mesoWeek) : false
  const carried =
    exercise && session ? commitmentForSession(exercise.id, log.commitments, session.startedAt) : null
  // Commitment criado nesta sessão vale para a PRÓXIMA — não deve reaparecer como
  // pendente no mesmo treino em que foi decidido.
  // No deload o commitment fica guardado: subir carga contraria o propósito da semana.
  const commitment = carried && carried.status === 'pending' && !inDeload ? carried : null
  const heldByDeload = carried && carried.status === 'pending' && inDeload ? carried : null
  const committedNow = exercise
    ? log.commitments.find(
        (c) => c.exerciseId === exercise.id && session && c.createdAt >= session.startedAt,
      ) ?? null
    : null

  const base = exercise ? currentLoad(exercise, historySets) : null
  const targetReps =
    exercise && session ? currentTargetReps(exercise, meso, session.mesoWeek, historySets) : 0

  useEffect(() => {
    if (!exercise || !base) return
    const last = doneHere[doneHere.length - 1]
    setLoad(last ? last.loadKg : (commitment?.targetLoadKg ?? base.loadKg))
    setReps(last ? last.reps : (commitment?.targetReps ?? targetReps))
    setRir(exercise.rir)
    setSetupText(log.setups.find((s) => s.exerciseId === exercise.id)?.text ?? exercise.setup_hint)
    setEditingSetup(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise?.id, doneHere.length, log.loading])

  useEffect(() => {
    void startKeepAlive()
    return () => stopKeepAlive()
  }, [])

  if (log.error) return <StorageError message={log.error} onRetry={log.reload} />
  if (log.loading) return <div className="app focus" />
  if (!session || !day || !exercise) {
    return (
      <div className="app focus">
        <div className="top">
          <h1>Treino não encontrado</h1>
        </div>
        <button className="big" onClick={() => nav('/')}>
          Voltar
        </button>
      </div>
    )
  }

  const isLast = pos === day.exercises.length - 1
  const complete = doneHere.length >= planned

  const register = async () => {
    if (load === null || reps === null) return
    await addSet({
      sessionId,
      exerciseId: exercise.id,
      index: doneHere.length,
      type: 'work',
      loadKg: load,
      reps,
      rir,
      restS: exercise.rest,
    })
    if (commitment && honorsCommitment(commitment, load, reps)) {
      await resolveCommitment(commitment.id, 'honored')
    }
    // Reforça o desbloqueio do áudio: se a sessão foi retomada sem gesto do
    // usuário, o keep-alive falhou silenciosamente e o alarme ficaria mudo.
    void startKeepAlive()
    timer.start(exercise.rest)
    await log.reload()
  }

  const undo = async (id: string) => {
    await removeSet(id)
    await log.reload()
  }

  const finish = async () => {
    timer.stop()
    stopKeepAlive()
    // Sessão sem série registrada não vira histórico: contaria como semana
    // cumprida no bloco e adiantaria a rotação de dias sem nada ter sido feito.
    if (sessionSets.length === 0) {
      await discardSession(sessionId)
      nav('/')
      return
    }
    await endSession(sessionId)
    nav(`/treino/${sessionId}/fim`)
  }

  const persistSetup = async () => {
    await saveSetup(exercise.id, setupText)
    setEditingSetup(false)
    await log.reload()
  }

  const ladder = exercise.warmup_hint ? warmupLadder(load ?? base?.loadKg ?? 0, exercise.increment) : []

  // Vale o commitment desta sessão mesmo depois de honrado — é ele que define
  // as reps previstas, não o alvo da sessão anterior.
  const applied = inDeload ? null : carried
  const prescribedLoad = applied?.targetLoadKg ?? base?.loadKg ?? 0
  const prescribedReps = applied?.targetReps ?? targetReps
  const prescriptionSource = commitment
    ? 'commitment aceito'
    : base?.fromSeed
      ? 'estimativa inicial'
      : 'repete o último treino'
  const adjusted = load !== prescribedLoad || reps !== prescribedReps

  return (
    <div className={`app focus${timer.remaining > 0 ? ' resting' : ''}`}>
      <div className="top">
        <div className="col">
          <h1>
            {day.id} · {day.name}
          </h1>
          <span className="dim small">
            exercício {pos + 1} de {day.exercises.length} · semana {session.mesoWeek}
          </span>
        </div>
        <button className="ghost small" onClick={() => nav('/')}>
          Sair
        </button>
      </div>

      <div className="pills">
        {day.exercises.map((id, i) => {
          const doneCount = sessionSets.filter((x) => x.exerciseId === id).length
          const target = setsForWeek(exerciseById.get(id)!, meso, session.mesoWeek)
          const state = doneCount >= target ? 'ok' : doneCount > 0 ? 'partial' : ''
          return (
            <button
              key={id}
              className={`pill ${state} ${i === pos ? 'here' : ''}`}
              onClick={() => setPos(i)}
              aria-label={exerciseById.get(id)!.name}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      <img className="hero" src={photoUrl(exercise.photo)} alt={exercise.name} />

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row between">
          <h2>{exercise.name}</h2>
          <span className="muted small mono">
            {planned}× {exercise.reps[0]}-{exercise.reps[1]} · RIR {exercise.rir}
          </span>
        </div>

        <div className="row small dim" style={{ marginTop: 6 }}>
          {exercise.failure_ok ? 'Falha técnica permitida' : 'Não levar à falha'} · descanso{' '}
          {fmtClock(exercise.rest)}
        </div>

        <a
          className="ghost small yt"
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' execução')}`}
          target="_blank"
          rel="noreferrer"
        >
          ▷ Ver execução no YouTube
        </a>

        {editingSetup ? (
          <div className="col" style={{ marginTop: 10, gap: 8 }}>
            <input
              type="text"
              value={setupText}
              placeholder="Regulagem: pino, encosto, altura…"
              onChange={(e) => setSetupText(e.target.value)}
            />
            <div className="row">
              <button className="grow" onClick={persistSetup}>
                Salvar regulagem
              </button>
              <button className="ghost" onClick={() => setEditingSetup(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            className="ghost small"
            style={{ marginTop: 10, width: '100%', textAlign: 'left' }}
            onClick={() => setEditingSetup(true)}
          >
            {setupText ? `⚙ ${setupText}` : '⚙ Anotar regulagem'}
          </button>
        )}
      </div>

      {FIRST_TIME_NOTICE && base?.fromSeed && doneHere.length === 0 && (
        <div className="notice warn">
          <b>Primeira vez neste exercício.</b> {fmtKg(base.loadKg)} kg é estimativa baseada no
          histórico. Ajuste antes de registrar. A partir daí o app ancora no que você levantou.
        </div>
      )}

      {heldByDeload && (
        <div className="notice warn">
          <b>Commitment guardado:</b> {heldByDeload.targetReps} reps a{' '}
          {fmtKg(heldByDeload.targetLoadKg)} kg. O deload mantém as cargas; a subida fica para a
          primeira semana do próximo bloco.
        </div>
      )}

      {commitment && (
        <div className="notice info">
          <b>Commitment pendente:</b> {commitment.targetReps} reps a {fmtKg(commitment.targetLoadKg)} kg.
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className="grow"
              onClick={() => {
                setLoad(commitment.targetLoadKg)
                setReps(commitment.targetReps)
              }}
            >
              Honrar
            </button>
            <button className="grow ghost" onClick={() => setLoad(base?.loadKg ?? load)}>
              Adiar
            </button>
            <button
              className="ghost"
              onClick={async () => {
                await resolveCommitment(commitment.id, 'dropped')
                await log.reload()
              }}
            >
              Descartar
            </button>
          </div>
          <div className="dim small" style={{ marginTop: 8 }}>
            Adiar mantém o commitment pendente para a próxima sessão.
          </div>
        </div>
      )}

      {exercise.warmup_hint && doneHere.length === 0 && (
        <div className="card">
          <div className="small muted">Aquecimento — não conta como volume</div>
          {ladder.length > 0 ? (
            <div className="row mono small dim" style={{ marginTop: 6, gap: 16 }}>
              {ladder.map((kg, i) => (
                <span key={i}>{fmtKg(kg)} kg</span>
              ))}
            </div>
          ) : (
            <div className="small dim" style={{ marginTop: 6 }}>
              3 a 4 séries leves antes da primeira válida. Sem percentual: o exercício é de peso
              corporal.
            </div>
          )}
        </div>
      )}

      <div className="card">
        {doneHere.map((s, i) => (
          <div className="setrow" key={s.id}>
            <span className="idx done">✓</span>
            <div className="row between">
              <span className="mono">
                {s.reps} × {fmtKg(s.loadKg)} kg
                <span className={s.rir >= JUNK_RIR ? 'small' : 'dim small'} style={{ marginLeft: 8 }}>
                  RIR {s.rir}
                  {s.rir >= JUNK_RIR ? ' · lixo' : ''}
                </span>
              </span>
              <button className="ghost small" onClick={() => undo(s.id)} aria-label={`Desfazer série ${i + 1}`}>
                desfazer
              </button>
            </div>
          </div>
        ))}

        {!complete && (
          <div className={doneHere.length > 0 ? 'editor bordered' : 'editor'}>
            <div className="col" style={{ gap: 10 }}>
              <div className="row between prescription">
                <span className="small muted">
                  Prescrito: <b className="mono">{prescribedReps}</b> reps a{' '}
                  <b className="mono">{fmtKg(prescribedLoad)} kg</b>
                </span>
                <span className="dim small">{prescriptionSource}</span>
              </div>
              {adjusted && (
                <span className="small" style={{ color: 'var(--warn)' }}>
                  Ajustado. O log registra o executado, não o previsto.
                </span>
              )}
              <div className="row">
                <Stepper
                  label={exercise.load_unit === 'total' ? 'carga' : `carga · ${exercise.load_unit}`}
                  suffix=" kg"
                  value={load ?? 0}
                  step={LOAD_STEP}
                  onChange={setLoad}
                />
                <Stepper label="reps" value={reps ?? 0} step={1} min={1} onChange={setReps} />
              </div>
              {exercise.load_unit !== 'total' && (
                <span className="dim small">
                  = {fmtKg(effectiveLoad(exercise, load ?? 0))} kg reais
                  {exercise.load_unit === 'por lado' && ` (2 × ${fmtKg(load ?? 0)} + barra ${fmtKg(exercise.bar_kg ?? DEFAULT_BAR_KG)})`}
                </span>
              )}
              <div className="chips">
                {RIR_OPTIONS.map((v) => (
                  <button
                    key={v}
                    className={`chip ${v >= JUNK_RIR ? 'junk' : ''} ${rir === v ? 'on' : ''}`}
                    onClick={() => setRir(v)}
                  >
                    RIR {v}
                    {v === JUNK_RIR ? '+' : ''}
                  </button>
                ))}
              </div>
              <button className="primary big" onClick={register}>
                Registrar série {doneHere.length + 1} de {planned}
              </button>
            </div>
          </div>
        )}

        {complete && (
          <div style={{ marginTop: 10 }}>
            <p className="muted small" style={{ margin: 0 }}>
              {planned} séries fechadas.
            </p>
            {(() => {
              const p = proposeProgression(
                exercise,
                meso,
                session.mesoWeek,
                doneHere,
                prescribedReps,
              )
              if (p.kind === 'hold') {
                return (
                  <p className="small muted" style={{ margin: '6px 0 0' }}>
                    {p.reason}
                  </p>
                )
              }
              if (declined.includes(exercise.id)) {
                return (
                  <p className="small muted" style={{ margin: '6px 0 0' }}>
                    {p.reason} Não comprometido.
                  </p>
                )
              }
              if (committedNow) {
                return (
                  <p className="small done" style={{ margin: '6px 0 0' }}>
                    Commitment registrado: {committedNow.targetReps} reps a{' '}
                    {fmtKg(committedNow.targetLoadKg)} kg no próximo {day.id}.
                  </p>
                )
              }
              return (
                <div style={{ marginTop: 8 }}>
                  <p className="small" style={{ margin: '0 0 10px', color: 'var(--accent)' }}>
                    {p.reason}
                  </p>
                  <div className="row" style={{ alignItems: 'stretch' }}>
                    <button
                      className="grow primary stacked"
                      onClick={async () => {
                        await addCommitment(exercise.id, p.targetReps, p.targetLoadKg, p.kind)
                        await log.reload()
                      }}
                    >
                      Comprometer
                      <small>
                        {p.targetReps} × {fmtKg(p.targetLoadKg)} kg
                      </small>
                    </button>
                    <button className="ghost" onClick={() => setDeclined((d) => [...d, exercise.id])}>
                      Agora não
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <Accordion title="Evolução deste exercício">
        <div style={{ marginTop: 12 }}>
          <ExerciseTrend exerciseId={exercise.id} sets={historySets} />
        </div>
      </Accordion>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className="grow ghost" disabled={pos === 0} onClick={() => setPos((p) => p - 1)}>
          ← Anterior
        </button>
        {isLast ? (
          <button className="grow primary" onClick={finish}>
            Finalizar treino
          </button>
        ) : (
          <button className="grow" onClick={() => setPos((p) => p + 1)}>
            Próximo →
          </button>
        )}
      </div>

      {timer.remaining > 0 && (
        <div className="timerbar">
          <div className="row between">
            <div className="col">
              <span className="timer mono">{fmtClock(timer.remaining)}</span>
              <span className="dim small">descanso</span>
            </div>
            <div className="row">
              <button onClick={() => timer.add(30)}>+30s</button>
              <button onClick={timer.stop}>Pular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
