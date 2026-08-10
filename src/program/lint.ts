import type { Block, Muscle, Program } from './schema'
import { CORE_PATTERNS } from './schema'
import { setsForWeek } from '../engine/mesocycle'
import { estimateDaySeconds, SESSION_CAP_S, fmtMinutes } from '../engine/duration'
import { PHOTOS } from './photos.generated'

export const SECONDARY_WEIGHT = 0.5

/** Faixas de reps por classe, direto da tabela "RELAÇÃO RPE — FAIXA DE REPS" da Planilha de Treino. */
const CLASS_REP_RANGE: Record<string, [number, number]> = {
  multi_inf_livre: [3, 8],
  multi_inf_guiado: [6, 12],
  acess_inf: [8, 20],
  multi_sup_livre: [3, 12],
  multi_sup_guiado: [6, 15],
  acess_sup: [8, 20],
}

const CLASS_RIR_RANGE: Record<string, [number, number]> = {
  multi_inf_livre: [2, 4],
  multi_inf_guiado: [1, 4],
  acess_inf: [0, 3],
  multi_sup_livre: [1, 4],
  multi_sup_guiado: [0, 4],
  acess_sup: [0, 3],
}

const FREE_COMPOUND_CLASSES = new Set(['multi_inf_livre', 'multi_sup_livre'])

export type Severity = 'error' | 'warn'

export type Finding = { severity: Severity; rule: string; message: string }

export type MuscleVolume = {
  muscle: Muscle
  direct: number
  indirect: number
  band?: { min: number; max: number }
}

export function weeklyVolume(program: Program, block: Block, week = 1): MuscleVolume[] {
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  const direct = new Map<Muscle, number>()
  const indirect = new Map<Muscle, number>()

  for (const day of block.days) {
    for (const exId of day.exercises) {
      const ex = byId.get(exId)
      if (!ex) continue
      const sets = setsForWeek(ex, block, week)
      for (const m of ex.primary) direct.set(m, (direct.get(m) ?? 0) + sets)
      for (const m of ex.secondary) indirect.set(m, (indirect.get(m) ?? 0) + sets * SECONDARY_WEIGHT)
    }
  }

  const muscles = new Set<Muscle>([...direct.keys(), ...indirect.keys()])
  return [...muscles]
    .map((muscle) => ({
      muscle,
      direct: direct.get(muscle) ?? 0,
      indirect: indirect.get(muscle) ?? 0,
      band: program.muscles[muscle],
    }))
    .sort((a, b) => b.direct - a.direct || b.indirect - a.indirect)
}

function dayVolume(
  program: Program,
  block: Block,
  dayExerciseIds: string[],
  week: number,
): Map<Muscle, number> {
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  const totals = new Map<Muscle, number>()
  for (const exId of dayExerciseIds) {
    const ex = byId.get(exId)
    if (!ex) continue
    for (const m of ex.primary) totals.set(m, (totals.get(m) ?? 0) + setsForWeek(ex, block, week))
  }
  return totals
}

export function lint(program: Program): Finding[] {
  const findings: Finding[] = []
  const byId = new Map(program.exercises.map((e) => [e.id, e]))
  const push = (severity: Severity, rule: string, message: string) =>
    findings.push({ severity, rule, message })

  const referenced = new Set<string>()

  const seenBlockIds = new Set<string>()
  for (const block of program.blocks) {
    if (seenBlockIds.has(block.id)) {
      push('error', 'duplicate-block', `Bloco "${block.id}" declarado mais de uma vez.`)
    }
    seenBlockIds.add(block.id)
  }

  for (const block of program.blocks) {
  const peak = block.weeks
  const tag = program.blocks.length > 1 ? `[${block.id}] ` : ''

  for (const day of block.days) {
    for (const exId of day.exercises) {
      referenced.add(exId)
      if (!byId.has(exId)) {
        push('error', 'unknown-exercise', `${tag}Dia ${day.id} referencia "${exId}", que não existe em exercises.`)
      }
    }

    for (let i = 1; i < day.exercises.length; i++) {
      const prev = byId.get(day.exercises[i - 1])
      const cur = byId.get(day.exercises[i])
      if (!prev || !cur) continue
      const shared = cur.primary.filter((m) => prev.primary.includes(m))
      if (shared.length > 0) {
        push(
          'warn',
          'consecutive-primary',
          `${tag}Dia ${day.id}: "${prev.name}" e "${cur.name}" são consecutivos e dividem o primário ${shared.join(', ')}. A fadiga do primeiro vira volume lixo no segundo.`,
        )
      }
    }

    for (const w of [1, peak]) {
      const seconds = estimateDaySeconds(program, block, day, w)
      if (seconds > SESSION_CAP_S) {
        push(
          'warn',
          'session-too-long',
          `${tag}Dia ${day.id} na semana ${w}: ~${fmtMinutes(seconds)} estimados, acima do teto de ${fmtMinutes(SESSION_CAP_S)}.`,
        )
      }
    }

    for (const [muscle, sets] of dayVolume(program, block, day.exercises, peak)) {
      if (sets > 12) {
        push(
          'warn',
          'day-volume-ceiling',
          `${tag}Dia ${day.id}: ${sets} séries de ${muscle} numa sessão só na semana ${peak}. Acima de 12 o retorno cai — divida na semana.`,
        )
      }
    }
  }

  for (const { muscle, direct, band } of weeklyVolume(program, block, peak)) {
    if (direct === 0) continue
    if (!band) {
      push('warn', 'no-band', `${tag}${muscle} recebe ${direct} séries diretas/semana mas não tem banda em muscles.`)
      continue
    }
    if (direct < band.min) {
      push(
        'warn',
        'volume-below-band',
        `${tag}${muscle}: ${direct} séries diretas no pico (semana ${peak}), abaixo da banda ${band.min}-${band.max}.`,
      )
    }
    if (direct > band.max) {
      push(
        'warn',
        'volume-above-band',
        `${tag}${muscle}: ${direct} séries diretas no pico (semana ${peak}), acima da banda ${band.min}-${band.max}. Volume lixo.`,
      )
    }
  }

  const patternDays = new Map<string, number>()
  for (const day of block.days) {
    const seen = new Set<string>()
    for (const exId of day.exercises) {
      const ex = byId.get(exId)
      if (ex) seen.add(ex.pattern)
    }
    for (const p of seen) patternDays.set(p, (patternDays.get(p) ?? 0) + 1)
  }
  for (const p of CORE_PATTERNS) {
    const hit = patternDays.get(p) ?? 0
    if (hit < 2) {
      push('warn', 'pattern-frequency', `${tag}Padrão ${p} aparece em ${hit} dia(s). A doutrina pede frequência 2.`)
    }
  }

  if (block.deload_week !== null && block.deload_week <= block.weeks) {
    push(
      'error',
      'deload-inside-block',
      `${tag}deload_week ${block.deload_week} cai dentro do bloco de ${block.weeks} semanas.`,
    )
  }
  if (block.type === 'acumulacao' && block.deload_week === null) {
    push('warn', 'missing-deload', `${tag}Bloco de acumulação sem deload_week.`)
  }

  }

  for (const ex of program.exercises) {
    if (!referenced.has(ex.id)) {
      push('warn', 'orphan-exercise', `"${ex.name}" está declarado mas não aparece em nenhum dia.`)
    }

    const [lo, hi] = ex.reps
    if (lo > hi) {
      push('error', 'rep-range', `"${ex.name}": faixa de reps invertida (${lo}-${hi}).`)
    }
    const repRange = CLASS_REP_RANGE[ex.class]
    if (repRange && (lo < repRange[0] || hi > repRange[1])) {
      push(
        'warn',
        'rep-range-out-of-class',
        `"${ex.name}": faixa ${lo}-${hi} fora de ${repRange[0]}-${repRange[1]}, que a Planilha de Treino define para ${ex.class}.`,
      )
    }

    if (FREE_COMPOUND_CLASSES.has(ex.class) && ex.failure_ok) {
      push(
        'warn',
        'failure-on-free-compound',
        `"${ex.name}" é multiarticular livre com failure_ok: true. A doutrina evita falha mecânica aqui.`,
      )
    }

    const range = CLASS_RIR_RANGE[ex.class]
    if (range && (ex.rir < range[0] || ex.rir > range[1])) {
      push(
        'warn',
        'rir-out-of-class',
        `"${ex.name}": RIR ${ex.rir} fora da faixa ${range[0]}-${range[1]} típica de ${ex.class}.`,
      )
    }

    if (!(PHOTOS as readonly string[]).includes(ex.photo)) {
      push('error', 'photo-missing', `"${ex.name}": foto "${ex.photo}" não existe em public/ex.`)
    }
  }


  return findings
}
