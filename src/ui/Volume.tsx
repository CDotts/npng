import { program, exerciseById } from '../program/load'
import { volumeOfSets } from '../engine/log'
import { activeBlock, doneInBlock } from '../engine/block'
import { weeklyVolume } from '../program/lint'
import { setsForWeek } from '../engine/mesocycle'
import { useLog } from './useLog'
import { Accordion } from './Accordion'
import { StorageError } from './StorageError'
import type { Muscle } from '../program/schema'

type Status = 'ok' | 'pending' | 'short' | 'over' | 'indirect'

const STATUS_LABEL: Record<Status, string> = {
  ok: 'fechou o plano',
  pending: 'em dia',
  short: 'vai faltar',
  over: 'acima da banda',
  indirect: 'só indireto',
}

export function Volume() {
  const log = useLog()
  if (log.error) return <StorageError message={log.error} onRetry={log.reload} />
  if (log.loading) return <div className="app" />

  const active = activeBlock(program, log.sessions)
  const meso = active.block
  const week = active.week
  // A semana é a do BLOCO (contada por sessões), não a do calendário: comparar
  // séries feitas numa janela Mon-Dom contra o alvo da semana do bloco produz
  // faltas fantasma sempre que as duas não coincidem.
  const blockSessions = doneInBlock(program, log.sessions, meso.id).sort(
    (a, b) => a.startedAt - b.startedAt,
  )
  const perWeek = meso.days.length
  const thisWeekSessions = blockSessions.slice(blockSessions.length - (blockSessions.length % perWeek))
  const doneIds = new Set(thisWeekSessions.map((s) => s.id))
  const doneDayIds = new Set(thisWeekSessions.map((s) => s.dayId))
  const remainingDays = meso.days.filter((d) => !doneDayIds.has(d.id))

  const pending = new Map<Muscle, number>()
  for (const day of remainingDays) {
    for (const id of day.exercises) {
      const ex = exerciseById.get(id)!
      const sets = setsForWeek(ex, meso, week)
      for (const m of ex.primary) pending.set(m, (pending.get(m) ?? 0) + sets)
    }
  }

  const doneByMuscle = new Map(
    volumeOfSets(
      program,
      log.sets.filter((x) => doneIds.has(x.sessionId)),
    ).map((v) => [v.muscle, v]),
  )
  const plannedByMuscle = new Map(weeklyVolume(program, meso, week).map((v) => [v.muscle, v]))

  const rows = [...plannedByMuscle.values()]
    .filter((p) => p.direct > 0 || p.indirect > 0)
    .map((p) => {
      const d = doneByMuscle.get(p.muscle)
      const done = d?.direct ?? 0
      const junk = d?.junk ?? 0
      const left = pending.get(p.muscle) ?? 0
      const projected = done + left
      const band = p.band
      // O alvo da semana é o PRESCRITO dela, não a banda: num bloco de acumulação
      // as primeiras semanas ficam abaixo da banda de propósito.
      const target = p.direct
      let status: Status = 'ok'
      if (p.direct === 0) status = 'indirect'
      else if (band && projected > band.max) status = 'over'
      else if (projected < target) status = 'short'
      else if (left > 0) status = 'pending'
      return { ...p, done, junk, left, projected, band, target, status }
    })

  const totalJunk = rows.reduce((s, r) => s + r.junk, 0)
  const isDeload = active.inDeload
  const ramping = meso.rule === 'sets_ramp' && week < meso.weeks && !isDeload

  return (
    <div className="app">
      <div className="top">
        <h1>Volume</h1>
        <span className="muted small mono">semana {week} · séries efetivas</span>
      </div>

      <Accordion title="Quando olhar e como ler">
        <p className="muted small" style={{ margin: '8px 0 0' }}>
          Tela de revisão semanal. Não é referência durante a sessão: ali vale a prescrição.
        </p>
        <p className="dim small" style={{ margin: '8px 0 0' }}>
          Em cada barra: o traço vertical é o <b>alvo desta semana</b>; a faixa clara é a{' '}
          <b>banda</b>, a dose semanal do grupo no pico do bloco. A barra deve alcançar o traço nesta
          semana e terminar dentro da faixa clara na semana do pico.
        </p>
        {ramping && (
          <p className="dim small" style={{ margin: '8px 0 0' }}>
            Bloco de acumulação: a semana {week} fica abaixo da banda por desenho e sobe até
            alcançá-la na semana {meso.weeks}.
          </p>
        )}
      </Accordion>

      {totalJunk > 0 && (
        <div className="notice warn">
          <b>
            {totalJunk} série{totalJunk > 1 ? 's' : ''} com RIR 4+
          </b>{' '}
          nesta semana. Não entram no volume efetivo.
        </div>
      )}

      <div className="card">
        <div className="legend" style={{ marginTop: 0, marginBottom: 4 }}>
          <span>
            <i style={{ background: 'var(--accent)' }} />
            feito
          </span>
          <span>
            <i className="hatch" />
            previsto
          </span>
          <span>
            <i style={{ background: 'var(--warn)' }} />
            RIR 4+, não conta
          </span>
          <span>
            <i style={{ background: 'rgba(255,255,255,0.16)' }} />
            banda
          </span>
          <span>
            <i style={{ background: 'var(--text)', width: 2 }} />
            alvo da semana
          </span>
        </div>

        {rows.map((r) => {
          const scale = Math.max(r.band?.max ?? 0, r.projected, r.done + r.junk, 1) * 1.12
          const pct = (n: number) => `${(n / scale) * 100}%`

          const candidates = [
            { at: r.projected, label: String(r.projected), kind: 'data', rank: 0 },
            r.left > 0 && r.done > 0
              ? { at: r.done, label: String(r.done), kind: 'data', rank: 1 }
              : null,
            r.band ? { at: r.band.max, label: String(r.band.max), kind: 'band', rank: 2 } : null,
            r.band ? { at: r.band.min, label: String(r.band.min), kind: 'band', rank: 3 } : null,
          ].filter(Boolean) as { at: number; label: string; kind: string; rank: number }[]

          const kept: typeof candidates = []
          for (const c of [...candidates].sort((a, b) => a.rank - b.rank)) {
            if (kept.every((k) => Math.abs(k.at - c.at) / scale > 0.09)) kept.push(c)
          }

          if (r.status === 'indirect') {
            const feitas = doneByMuscle.get(r.muscle)?.indirect ?? 0
            return (
              <div key={r.muscle} style={{ padding: '14px 0 6px' }}>
                <div className="row between">
                  <span style={{ textTransform: 'capitalize' }}>{r.muscle}</span>
                  <span className="status indirect">{STATUS_LABEL.indirect}</span>
                </div>
                <p className="dim small mono" style={{ margin: '7px 0 0' }}>
                  {feitas} de {r.indirect} séries indiretas · nenhuma série direta prescrita
                </p>
              </div>
            )
          }

          return (
            <div key={r.muscle} style={{ padding: '14px 0 6px' }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <span>
                  <span style={{ textTransform: 'capitalize' }}>{r.muscle}</span>
                  {(doneByMuscle.get(r.muscle)?.indirect ?? 0) > 0 && (
                    <span className="dim small"> +{doneByMuscle.get(r.muscle)?.indirect} ind.</span>
                  )}
                </span>
                <span className={`status ${r.status}`}>
                  {STATUS_LABEL[r.status]}
                  {r.status === 'short' ? ` ${r.target - r.projected}` : ''}
                  {r.status === 'over' && r.band ? ` ${r.projected - r.band.max}` : ''}
                </span>
              </div>

              <div className="meter">
                <div className="bar band">
                  {r.band && (
                    <span
                      className="zone"
                      style={{ left: pct(r.band.min), width: pct(r.band.max - r.band.min) }}
                    />
                  )}
                  <span className="ok" style={{ width: pct(r.done) }} />
                  <span className="junkfill" style={{ width: pct(r.junk) }} />
                  <span className="left" style={{ width: pct(r.left) }} />
                  <span className="target" style={{ left: pct(r.target) }} />
                </div>
                <div className="ruler">
                  {kept.map((t) => (
                    <span key={`${t.kind}${t.at}`} className={`tick ${t.kind}`} style={{ left: pct(t.at) }}>
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Accordion title="Como ler o estado">
        <div className="states">
          <div>
            <span className="status pending">em dia</span>
            <p className="dim small">Restam treinos nesta semana e a projeção alcança o alvo.</p>
          </div>
          <div>
            <span className="status ok">fechou o plano</span>
            <p className="dim small">A semana atingiu o alvo prescrito.</p>
          </div>
          <div>
            <span className="status short">vai faltar 2</span>
            <p className="dim small">
              Mesmo executando o que resta, a semana termina 2 séries abaixo do alvo. Causas: sessão
              pulada, série cortada, ou mudança de programa no meio da semana.
            </p>
          </div>
          <div>
            <span className="status over">acima da banda 3</span>
            <p className="dim small">Projeção 3 séries acima do teto da banda.</p>
          </div>
          <div>
            <span className="status indirect">só indireto</span>
            <p className="dim small">
              O programa não prescreve série direta para esse grupo, de propósito. Ele é treinado
              como secundário em outros exercícios. O motivo está em RESTRICTIONS.md.
            </p>
          </div>
        </div>
      </Accordion>
    </div>
  )
}
