import type { Block, Day, Program } from '../program/schema'
import { setsForWeek } from './mesocycle'

export const SECONDS_PER_REP = 3

/**
 * Montagem por série. Barra com anilha custa muito mais que máquina ou halter —
 * medido em campo: a estimativa de 15s para tudo errou 36% numa sessão de barra.
 */
export const SET_SETUP_S = 15
export const SET_SETUP_BARBELL_S = 40

function setupSeconds(ex: { class: string; setup_s?: number }) {
  if (ex.setup_s !== undefined) return ex.setup_s
  return ex.class === 'multi_inf_livre' || ex.class === 'multi_sup_livre'
    ? SET_SETUP_BARBELL_S
    : SET_SETUP_S
}
export const TRANSITION_S = 60
export const WARMUP_S = 150

export const SESSION_CAP_S = 50 * 60

export function estimateDaySeconds(program: Program, block: Block, day: Day, week: number): number {
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  let total = 0

  for (const exId of day.exercises) {
    const ex = byId.get(exId)
    if (!ex) continue
    const sets = setsForWeek(ex, block, week)
    const perSet = ex.reps[1] * SECONDS_PER_REP + setupSeconds(ex)
    total += sets * perSet + Math.max(0, sets - 1) * ex.rest
    if (ex.warmup_hint) total += WARMUP_S
  }

  return total + Math.max(0, day.exercises.length - 1) * TRANSITION_S
}

export function fmtMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`
}
