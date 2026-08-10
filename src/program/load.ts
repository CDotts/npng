import source from '../../training.yaml?raw'
import { parseProgram } from './parse'
import type { Program } from './schema'
import type { Finding } from './lint'

const result = parseProgram(source)

export const programFindings: Finding[] = result.findings

export const program: Program = (() => {
  if (!result.ok) {
    const detail = result.findings.map((f) => `${f.rule}: ${f.message}`).join('\n')
    throw new Error(`training.yaml inválido:\n${detail}`)
  }
  return result.program
})()

export const exerciseById = new Map(program.exercises.map((e) => [e.id, e]))

export const blockById = new Map(program.blocks.map((b) => [b.id, b]))

export function blockOfSession(session: { blockId?: string }) {
  return blockById.get(session.blockId ?? program.blocks[0].id) ?? program.blocks[0]
}

export function dayOf(session: { blockId?: string; dayId: string }) {
  const block = blockById.get(session.blockId ?? program.blocks[0].id) ?? program.blocks[0]
  return block.days.find((d) => d.id === session.dayId)
}
