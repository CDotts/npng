import type { Block, Program } from '../program/schema'
import type { SessionRow } from '../store/db'

export type ActiveBlock = {
  block: Block
  index: number
  week: number
  done: number
  length: number
  inDeload: boolean
  /** As semanas prescritas do bloco acabaram — hora de preparar o próximo. */
  pastAccumulation: boolean
  finished: boolean
  queued: Block[]
}

export function blockLength(block: Block): number {
  const perWeek = block.days.length
  return (block.weeks + (block.deload_week !== null ? 1 : 0)) * perWeek
}

/** Sessões antigas não têm blockId: pertencem ao primeiro bloco declarado. */
export function sessionBlockId(session: SessionRow, program: Program): string {
  return session.blockId ?? program.blocks[0].id
}

export function doneInBlock(program: Program, sessions: SessionRow[], blockId: string): SessionRow[] {
  return sessions.filter((s) => s.endedAt !== null && sessionBlockId(s, program) === blockId)
}

export function activeBlock(program: Program, sessions: SessionRow[]): ActiveBlock {
  for (let i = 0; i < program.blocks.length; i++) {
    const block = program.blocks[i]
    const done = doneInBlock(program, sessions, block.id).length
    const length = blockLength(block)
    if (done < length || i === program.blocks.length - 1) {
      const perWeek = block.days.length
      const raw = Math.floor(done / perWeek) + 1
      const pastAccumulation = raw > block.weeks
      const inDeload = block.deload_week !== null && pastAccumulation
      const week = inDeload ? (block.deload_week as number) : Math.min(raw, block.weeks)
      return {
        block,
        index: i,
        week,
        done,
        length,
        inDeload,
        pastAccumulation,
        finished: done >= length,
        queued: program.blocks.slice(i + 1),
      }
    }
  }
  const block = program.blocks[0]
  return {
    block,
    index: 0,
    week: 1,
    done: 0,
    length: blockLength(block),
    inDeload: false,
    pastAccumulation: false,
    finished: false,
    queued: program.blocks.slice(1),
  }
}

export function nextDayId(active: ActiveBlock, program: Program, sessions: SessionRow[]): string {
  const done = doneInBlock(program, sessions, active.block.id).sort((a, b) => a.startedAt - b.startedAt)
  const ids = active.block.days.map((d) => d.id)
  if (done.length === 0) return ids[0]
  const lastIdx = ids.indexOf(done[done.length - 1].dayId)
  return ids[(lastIdx + 1) % ids.length]
}
