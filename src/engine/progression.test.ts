import { expect, test } from 'vitest'
import { program, exerciseById } from '../program/load'
import {
  proposeProgression,
  currentLoad,
  pendingCommitment,
  commitmentForSession,
  honorsCommitment,
  warmupLadder,
  slackBump,
} from './progression'
import type { CommitmentRow, SetRow } from '../store/db'

const meso = program.blocks[0]
const supino = exerciseById.get('supino_reto_barra')!

function set(partial: Partial<SetRow>): SetRow {
  return {
    id: Math.random().toString(36),
    sessionId: 's1',
    exerciseId: supino.id,
    index: 0,
    type: 'work',
    loadKg: 31,
    reps: 8,
    rir: 2,
    restS: 180,
    at: Date.now(),
    ...partial,
  }
}

test('sem séries não propõe nada', () => {
  expect(proposeProgression(supino, meso, 1, []).kind).toBe('hold')
})

test('a top set manda: queda de rendimento nas séries seguintes não trava a subida', () => {
  const sets = [set({ reps: 8, rir: 2 }), set({ reps: 7, rir: 2 }), set({ reps: 6, rir: 2 })]
  const p = proposeProgression(supino, meso, 1, sets, 8)
  expect(p.kind).toBe('load')
})

test('não propõe quando a melhor série ficou abaixo das reps previstas', () => {
  const sets = [set({ reps: 7 }), set({ reps: 6 }), set({ reps: 6 })]
  const p = proposeProgression(supino, meso, 1, sets, 8)
  expect(p.kind).toBe('hold')
  expect(p.reason).toMatch(/abaixo das 8 previstas/)
})

test('dupla progressão sobe rep a rep antes de subir carga', () => {
  // prescrito 6 e fechou 6: sobe para 7 na mesma carga
  const seis = proposeProgression(supino, meso, 1, [set({ reps: 6, rir: 2 })], 6)
  expect(seis.kind).toBe('reps')
  if (seis.kind !== 'hold') {
    expect(seis.targetReps).toBe(7)
    expect(seis.targetLoadKg).toBe(31)
  }
  // no teto da faixa: reseta reps e sobe carga
  const oito = proposeProgression(supino, meso, 1, [set({ reps: 8, rir: 2 })], 8)
  expect(oito.kind).toBe('load')
  if (oito.kind !== 'hold') {
    expect(oito.targetReps).toBe(supino.reps[0])
    expect(oito.targetLoadKg).toBe(31 + supino.increment)
  }
})

// Este é o caso "leve" da EDN: reps cumpridas com folga de esforço significa que a
// carga estava abaixo do necessário. Segurar aqui travava a progressão justamente
// onde ela é mais evidente.
test('reps cumpridas com RIR acima do alvo sobem carga, não seguram', () => {
  const sets = [set({ reps: 8, rir: 3 }), set({ reps: 8, rir: 3 }), set({ reps: 8, rir: 3 })]
  const p = proposeProgression(supino, meso, 1, sets, 8)
  expect(p.kind).toBe('load')
  if (p.kind !== 'hold') {
    // 1 ponto de RIR sobrando ≈ 3% de 31 kg = 0,93, abaixo do incremento: vale o piso
    expect(p.targetLoadKg).toBe(31 + supino.increment)
    expect(p.targetReps).toBe(supino.reps[0])
  }
  expect(p.reason).toMatch(/Carga leve/)
})

test('a subida escala com a folga de RIR, em percentual da carga', () => {
  // 2 pontos de folga = 6% de 31 = 1,86 → arredonda para o incremento de 2,5
  const p = proposeProgression(supino, meso, 1, [set({ reps: 8, rir: 4 })], 8)
  if (p.kind === 'hold') throw new Error('deveria propor carga')
  expect(p.targetLoadKg).toBe(33.5)
  // a mesma folga numa carga muito maior vale muito mais quilo
  expect(slackBump(150, 3, 10)).toBe(10)
  expect(slackBump(150, 5, 10)).toBe(20)
  expect(slackBump(300, 2, 5)).toBe(20)
})

test('no meio da faixa, carga leve sobe carga e mantém as reps previstas', () => {
  const p = proposeProgression(supino, meso, 1, [set({ reps: 7, rir: 4 })], 7)
  if (p.kind === 'hold') throw new Error('deveria propor carga')
  expect(p.kind).toBe('load')
  expect(p.targetReps).toBe(7)
  expect(p.targetLoadKg).toBe(33.5)
})

test('reps abaixo do previsto seguram, mesmo com RIR alto', () => {
  const p = proposeProgression(supino, meso, 1, [set({ reps: 6, rir: 4 })], 8)
  expect(p.kind).toBe('hold')
})

test('série de apoio a RIR 4+ não trava a subida, mas é reportada', () => {
  const sets = [set({ reps: 8, rir: 0 }), set({ reps: 8, rir: 0 }), set({ reps: 8, rir: 4 })]
  const p = proposeProgression(supino, meso, 1, sets, 8)
  expect(p.kind).toBe('load')
  expect(p.reason).toMatch(/não contaram como volume/)
})

test('top set a RIR 4+ com as reps fechadas é carga leve, não bloqueio', () => {
  const sets = [set({ reps: 8, rir: 4 }), set({ reps: 6, rir: 2 })]
  const p = proposeProgression(supino, meso, 1, sets, 8)
  expect(p.kind).toBe('load')
  expect(p.reason).toMatch(/não contaram como volume/)
})

test('no teto da faixa com esforço cumprido, sobe a carga e reseta as reps', () => {
  const sets = [set({ reps: 8, rir: 1 }), set({ reps: 8, rir: 2 }), set({ reps: 8, rir: 2 })]
  const p = proposeProgression(supino, meso, 1, sets, 8)
  expect(p.kind).toBe('load')
  if (p.kind !== 'hold') {
    expect(p.targetLoadKg).toBe(31 + supino.increment)
    expect(p.targetReps).toBe(supino.reps[0])
  }
})

test('carga atual vem do log, e só cai no seed quando não há histórico', () => {
  expect(currentLoad(supino, []).fromSeed).toBe(true)
  expect(currentLoad(supino, []).loadKg).toBe(supino.seed_kg)
  const logged = currentLoad(supino, [set({ loadKg: 42, at: 1 }), set({ loadKg: 40, at: 2 })])
  expect(logged.loadKg).toBe(42)
  expect(logged.fromSeed).toBe(false)
})

test('commitment adiado continua pendente e reaparece', () => {
  const rows: CommitmentRow[] = [
    {
      id: 'c1',
      exerciseId: supino.id,
      createdAt: 1,
      targetReps: 6,
      targetLoadKg: 33.5,
      status: 'pending',
      resolvedAt: null,
    },
    {
      id: 'c0',
      exerciseId: supino.id,
      createdAt: 0,
      targetReps: 6,
      targetLoadKg: 31,
      status: 'honored',
      resolvedAt: 1,
    },
  ]
  expect(pendingCommitment(supino.id, rows)?.id).toBe('c1')
  expect(pendingCommitment('outro', rows)).toBeNull()
})

test('rampa de aquecimento sai da carga de trabalho e respeita o incremento', () => {
  expect(warmupLadder(0, 2.5)).toEqual([])
  const ladder = warmupLadder(100, 5)
  expect(ladder).toEqual([50, 70, 80, 90])
})

test('deload não propõe progressão nem com o alvo cumprido', () => {
  const deloadWeek = meso.deload_week ?? meso.weeks + 1
  const sets = [set({ reps: 8, rir: 1 }), set({ reps: 8, rir: 2 })]
  const p = proposeProgression(supino, meso, deloadWeek, sets, 8)
  expect(p.kind).toBe('hold')
  expect(p.reason).toMatch(/deload/i)
})

function commitment(over: Partial<CommitmentRow> = {}): CommitmentRow {
  return {
    id: 'c',
    exerciseId: supino.id,
    createdAt: 100,
    targetReps: 6,
    targetLoadKg: 33.5,
    kind: 'load',
    status: 'pending',
    resolvedAt: null,
    ...over,
  }
}

test('commitment de reps só é honrado ao alcançar as reps', () => {
  const c = commitment({ kind: 'reps', targetReps: 9, targetLoadKg: 30 })
  expect(honorsCommitment(c, 30, 8)).toBe(false)
  expect(honorsCommitment(c, 30, 9)).toBe(true)
})

test('commitment de carga é honrado ao adotar a carga', () => {
  const c = commitment({ kind: 'load', targetReps: 6, targetLoadKg: 33.5 })
  expect(honorsCommitment(c, 31, 8)).toBe(false)
  expect(honorsCommitment(c, 33.5, 5)).toBe(true)
})

test('o commitment da sessão continua valendo depois de honrado', () => {
  const honored = commitment({ status: 'honored', resolvedAt: 250 })
  expect(commitmentForSession(supino.id, [honored], 200)?.id).toBe('c')
  // resolvido antes da sessão começar: não vale mais
  const old = commitment({ status: 'honored', resolvedAt: 150 })
  expect(commitmentForSession(supino.id, [old], 200)).toBeNull()
})

test('honrar uma subida de carga não trava o veredito da própria sessão', () => {
  const sets = [set({ loadKg: 33.5, reps: 6, rir: 2 }), set({ loadKg: 33.5, reps: 6, rir: 2 })]
  const applied = commitment({ status: 'honored', resolvedAt: 250 })
  const prescribed = commitmentForSession(supino.id, [applied], 200)!.targetReps
  const p = proposeProgression(supino, meso, 1, sets, prescribed)
  expect(p.kind).toBe('reps')
  if (p.kind !== 'hold') expect(p.targetReps).toBe(7)
})
