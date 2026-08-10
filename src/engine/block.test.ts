import { expect, test } from 'vitest'
import { program } from '../program/load'
import { activeBlock, blockLength } from './block'
import type { Program } from '../program/schema'
import type { SessionRow } from '../store/db'

const first = program.blocks[0]

function sessions(n: number, blockId?: string): SessionRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    startedAt: i,
    endedAt: i + 1,
    dayId: first.days[i % first.days.length].id,
    mesoWeek: 1,
    ...(blockId ? { blockId } : {}),
  }))
}

const twoBlocks: Program = {
  ...program,
  blocks: [first, { ...first, id: 'meso3_intensificacao', name: 'Meso 3' }],
}

test('o bloco avança de semana e entra em deload no fim da acumulação', () => {
  expect(activeBlock(program, sessions(0, first.id)).week).toBe(1)
  expect(activeBlock(program, sessions(12, first.id)).week).toBe(first.weeks)
  const deload = activeBlock(program, sessions(16, first.id))
  expect(deload.inDeload).toBe(true)
  expect(deload.finished).toBe(false)
  expect(activeBlock(program, sessions(blockLength(first), first.id)).finished).toBe(true)
})

test('sessões sem blockId pertencem ao primeiro bloco', () => {
  const a = activeBlock(program, sessions(8))
  expect(a.block.id).toBe(first.id)
  expect(a.week).toBe(3)
})

test('o segundo bloco só entra em vigor quando o primeiro fecha', () => {
  // primeiro bloco ainda no deload: continua ativo, com o próximo enfileirado
  const during = activeBlock(twoBlocks, sessions(16, first.id))
  expect(during.block.id).toBe(first.id)
  expect(during.inDeload).toBe(true)
  expect(during.queued.map((b) => b.id)).toEqual(['meso3_intensificacao'])

  // primeiro bloco completo: o segundo assume começando na semana 1
  const after = activeBlock(twoBlocks, sessions(blockLength(first), first.id))
  expect(after.block.id).toBe('meso3_intensificacao')
  expect(after.week).toBe(1)
  expect(after.done).toBe(0)
  expect(after.finished).toBe(false)
})

test('sessões do bloco anterior não contam para a semana do bloco novo', () => {
  const mixed = [...sessions(blockLength(first), first.id), ...sessions(4, 'meso3_intensificacao')]
  const a = activeBlock(twoBlocks, mixed)
  expect(a.block.id).toBe('meso3_intensificacao')
  expect(a.week).toBe(2)
})

test('o aviso de próximo bloco depende do fim da acumulação, não do deload', () => {
  const semDeload: Program = { ...program, blocks: [{ ...first, deload_week: null }] }
  const noMeio = activeBlock(semDeload, sessions(12, first.id))
  expect(noMeio.pastAccumulation).toBe(false)

  const fechou = activeBlock(semDeload, sessions(16, first.id))
  expect(fechou.pastAccumulation).toBe(true)
  expect(fechou.inDeload).toBe(false)
  expect(fechou.finished).toBe(true)
})
