import type { Exercise, Mesocycle } from '../program/schema'
import type { CommitmentRow, SetRow } from '../store/db'
import { isDeload, repsForWeek, rirForWeek } from './mesocycle'

export const JUNK_RIR = 4

export type Prescription = {
  sets: number
  reps: [number, number]
  rir: number
  loadKg: number
  fromSeed: boolean
}

export type Proposal =
  | { kind: 'reps'; targetReps: number; targetLoadKg: number; reason: string }
  | { kind: 'load'; targetReps: number; targetLoadKg: number; reason: string }
  | { kind: 'hold'; reason: string }

export function workSets(sets: SetRow[]): SetRow[] {
  return sets.filter((s) => s.type === 'work')
}

export function lastSessionSets(exerciseId: string, allSets: SetRow[]): SetRow[] {
  const mine = workSets(allSets.filter((s) => s.exerciseId === exerciseId))
  if (mine.length === 0) return []
  const lastSessionId = mine.reduce((a, b) => (a.at > b.at ? a : b)).sessionId
  return mine.filter((s) => s.sessionId === lastSessionId).sort((a, b) => a.index - b.index)
}

export function topSet(sets: SetRow[]): SetRow | null {
  const work = workSets(sets)
  if (work.length === 0) return null
  return work.reduce((a, b) => {
    if (b.loadKg !== a.loadKg) return b.loadKg > a.loadKg ? b : a
    return b.reps > a.reps ? b : a
  })
}

export function currentLoad(ex: Exercise, allSets: SetRow[]): { loadKg: number; fromSeed: boolean } {
  const last = lastSessionSets(ex.id, allSets)
  const top = topSet(last)
  if (top) return { loadKg: top.loadKg, fromSeed: false }
  return { loadKg: ex.seed_kg ?? 0, fromSeed: true }
}

export function currentTargetReps(ex: Exercise, meso: Mesocycle, week: number, allSets: SetRow[]): number {
  const [lo, hi] = repsForWeek(ex, meso, week)
  const last = lastSessionSets(ex.id, allSets)
  const top = topSet(last)
  if (!top) return lo
  return Math.min(Math.max(top.reps, lo), hi)
}

export function prescribe(
  ex: Exercise,
  meso: Mesocycle,
  week: number,
  setsThisWeek: number,
  allSets: SetRow[],
): Prescription {
  const { loadKg, fromSeed } = currentLoad(ex, allSets)
  return {
    sets: setsThisWeek,
    reps: repsForWeek(ex, meso, week),
    rir: rirForWeek(ex, meso, week),
    loadKg,
    fromSeed,
  }
}

export function proposeProgression(
  ex: Exercise,
  meso: Mesocycle,
  week: number,
  sessionSets: SetRow[],
  prescribedReps?: number,
): Proposal {
  const work = workSets(sessionSets).filter((s) => s.exerciseId === ex.id)
  if (work.length === 0) return { kind: 'hold', reason: 'Sem séries de trabalho registradas.' }

  // O deload roda com metade do volume: a sessão é mais fácil por desenho, então
  // não é base para decidir subida. Progressão só em semanas de acumulação.
  if (isDeload(meso, week)) {
    return {
      kind: 'hold',
      reason: 'Semana de deload. Progressão é avaliada apenas em semanas de acumulação.',
    }
  }

  const [lo, hi] = repsForWeek(ex, meso, week)
  const targetRir = rirForWeek(ex, meso, week)

  // A doutrina julga a progressão pela top set (DOCTRINE §5). As séries seguintes
  // caem por fadiga acumulada; exigir o teto em todas trava a progressão sem motivo.
  const top = topSet(work)!
  const junk = work.filter((s) => s.rir >= JUNK_RIR).length
  const junkNote = junk > 0 ? ` ${junk} série(s) a RIR ${JUNK_RIR}+ não contaram como volume.` : ''

  // Alvo desta sessão: o que estava prescrito, não o teto da faixa. É isso que
  // faz a dupla progressão andar de rep em rep até o teto antes de subir carga.
  const target = Math.min(Math.max(prescribedReps ?? top.reps, lo), hi)

  if (top.reps < target) {
    return {
      kind: 'hold',
      reason: `Melhor série: ${top.reps} reps, abaixo das ${target} previstas.${junkNote}`,
    }
  }
  // Reps cumpridas com RIR acima do alvo é o caso "leve" da EDN: a carga estava
  // abaixo do necessário, e a resposta doutrinária é subir CARGA, não segurar.
  // Segurar aqui travava a progressão exatamente onde ela é mais óbvia.
  // A subida escala com a folga: cada ponto de RIR sobrando vale um incremento,
  // porque um único incremento levaria semanas para cobrir 3-4 reps de reserva.
  if (top.rir > targetRir) {
    const atCeiling = top.reps >= hi
    const bump = slackBump(top.loadKg, top.rir - targetRir, ex.increment)
    return {
      kind: 'load',
      targetReps: atCeiling ? lo : target,
      targetLoadKg: round(top.loadKg + bump),
      reason: `Fechou ${top.reps} reps a RIR ${top.rir}; o alvo é RIR ${targetRir}. Carga leve: +${round(bump)} kg${atCeiling ? `, reps voltam a ${lo}` : ''}.${junkNote}`,
    }
  }

  const reached = Math.min(Math.max(top.reps, lo), hi)
  if (reached < hi) {
    return {
      kind: 'reps',
      targetReps: reached + 1,
      targetLoadKg: top.loadKg,
      reason: `Melhor série: ${reached} reps a RIR ${top.rir}. Próxima sessão: +1 rep, mesma carga.${junkNote}`,
    }
  }
  return {
    kind: 'load',
    targetReps: lo,
    targetLoadKg: round(top.loadKg + ex.increment),
    reason: `Melhor série: ${hi} reps a RIR ${top.rir}, teto da faixa. Próxima sessão: ${lo} reps e +${ex.increment} kg.${junkNote}`,
  }
}

/**
 * O commitment que valia PARA esta sessão — criado antes dela e ainda não
 * resolvido, ou resolvido durante ela. É ele que define as reps previstas,
 * mesmo depois de honrado: sem isso o veredito volta a comparar com o alvo da
 * sessão anterior e segura uma progressão legítima.
 */
export function commitmentForSession(
  exerciseId: string,
  commitments: CommitmentRow[],
  sessionStartedAt: number,
): CommitmentRow | null {
  const mine = commitments.filter(
    (c) =>
      c.exerciseId === exerciseId &&
      c.createdAt < sessionStartedAt &&
      (c.status === 'pending' || (c.resolvedAt ?? 0) >= sessionStartedAt),
  )
  if (mine.length === 0) return null
  return mine.reduce((a, b) => (b.createdAt > a.createdAt ? b : a))
}

/**
 * Um commitment de carga é honrado ao adotar a carga nova. Um de reps mantém a
 * carga, então só é honrado ao alcançar as reps — caso contrário qualquer série
 * o marcaria como cumprido, inclusive uma tentativa fracassada ou adiada.
 */
export function honorsCommitment(c: CommitmentRow, loadKg: number, reps: number): boolean {
  if (loadKg < c.targetLoadKg) return false
  return (c.kind ?? 'load') === 'load' ? true : reps >= c.targetReps
}

export function pendingCommitment(exerciseId: string, commitments: CommitmentRow[]): CommitmentRow | null {
  const mine = commitments.filter((c) => c.exerciseId === exerciseId && c.status === 'pending')
  if (mine.length === 0) return null
  return mine.reduce((a, b) => (b.createdAt > a.createdAt ? b : a))
}

/** Cada ponto de RIR sobrando vale ~3% da carga. Heurística padrão das tabelas RPE. */
export const RIR_LOAD_PCT = 0.03

/**
 * Quanto subir quando a carga se revelou leve. Percentual, não múltiplo do
 * `increment`: o incremento é a granularidade da anilha, não uma medida de
 * intensidade relativa — 10 kg no leg press de 150 é outra coisa que 10 kg no
 * stiff de 30. Arredonda para o incremento do exercício, com piso de um.
 */
export function slackBump(loadKg: number, slack: number, increment: number): number {
  const raw = loadKg * RIR_LOAD_PCT * slack
  return Math.max(increment, roundTo(raw, increment))
}

export function warmupLadder(loadKg: number, increment: number): number[] {
  if (loadKg <= 0) return []
  return [0.5, 0.7, 0.8, 0.9].map((p) => roundTo(loadKg * p, increment))
}

function roundTo(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step)
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
