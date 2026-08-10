import type { Exercise, Mesocycle } from '../program/schema'

export function setsForWeek(ex: Exercise, meso: Mesocycle, week: number): number {
  // O deload é metade do PICO, não da base: cortar sobre a base esvaziaria
  // justamente os exercícios que mais acumularam durante o bloco.
  if (meso.deload_week !== null && week >= meso.deload_week) {
    return Math.max(1, Math.round(peakSets(ex, meso) / 2))
  }
  const w = Math.min(Math.max(week, 1), meso.weeks)
  if (meso.rule === 'sets_ramp' && ex.ramp) return ex.sets + (w - 1)
  return ex.sets
}

export function isDeload(meso: Mesocycle, week: number): boolean {
  return meso.deload_week !== null && week >= meso.deload_week
}

export function peakSets(ex: Exercise, meso: Mesocycle): number {
  if (meso.rule === 'sets_ramp' && ex.ramp) return ex.sets + (meso.weeks - 1)
  return ex.sets
}

export function peakWeek(meso: Mesocycle): number {
  return meso.weeks
}

export function repsForWeek(ex: Exercise, meso: Mesocycle, week: number): [number, number] {
  if (meso.rule !== 'load_ramp') return ex.reps
  const [lo, hi] = ex.reps
  const shift = Math.min(Math.max(week, 1), meso.weeks) - 1
  return [Math.max(1, lo - shift), Math.max(1, hi - shift)]
}

export function rirForWeek(ex: Exercise, meso: Mesocycle, week: number): number {
  if (meso.rule !== 'rir_ramp') return ex.rir
  const shift = Math.min(Math.max(week, 1), meso.weeks) - 1
  return Math.max(0, ex.rir - shift)
}
