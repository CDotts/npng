import type { Muscle, Program } from '../program/schema'
import type { SetRow } from '../store/db'
import { SECONDARY_WEIGHT } from '../program/lint'
import { JUNK_RIR } from './progression'
import { effectiveLoad } from './load'

export function weekStart(at: number): number {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.getTime()
}

export type LoggedVolume = {
  muscle: Muscle
  direct: number
  indirect: number
  junk: number
  band?: { min: number; max: number }
}

export function volumeOfSets(program: Program, sets: SetRow[]): LoggedVolume[] {
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  const direct = new Map<Muscle, number>()
  const indirect = new Map<Muscle, number>()
  const junk = new Map<Muscle, number>()

  for (const s of sets) {
    if (s.type !== 'work') continue
    const ex = byId.get(s.exerciseId)
    if (!ex) continue
    const isJunk = s.rir >= JUNK_RIR
    for (const m of ex.primary) {
      if (isJunk) junk.set(m, (junk.get(m) ?? 0) + 1)
      else direct.set(m, (direct.get(m) ?? 0) + 1)
    }
    if (!isJunk) {
      for (const m of ex.secondary) indirect.set(m, (indirect.get(m) ?? 0) + SECONDARY_WEIGHT)
    }
  }

  const muscles = new Set<Muscle>([...direct.keys(), ...indirect.keys(), ...junk.keys()])
  return [...muscles]
    .map((muscle) => ({
      muscle,
      direct: direct.get(muscle) ?? 0,
      indirect: indirect.get(muscle) ?? 0,
      junk: junk.get(muscle) ?? 0,
      band: program.muscles[muscle],
    }))
    .sort((a, b) => b.direct - a.direct)
}

/**
 * Tonelagem em carga real, não no número observado: `por lado` e `por halter` são
 * convertidos por `effectiveLoad`. Sem isso a soma mistura convenções e não é
 * comparável entre exercícios nem entre semanas com composição diferente.
 */
export function sessionTonnage(program: Program, sets: SetRow[]): number {
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  return sets
    .filter((s) => s.type === 'work')
    .reduce((sum, s) => sum + effectiveLoad(byId.get(s.exerciseId), s.loadKg) * s.reps, 0)
}

export function sessionReps(sets: SetRow[]): number {
  return sets.filter((s) => s.type === 'work').reduce((sum, s) => sum + s.reps, 0)
}
