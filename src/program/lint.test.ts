import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { parseProgram } from './parse'
import { weeklyVolume } from './lint'

const source = readFileSync(new URL('../../training.yaml', import.meta.url), 'utf8')

test('training.yaml carrega sem erro', () => {
  const result = parseProgram(source)
  if (!result.ok) {
    throw new Error(result.findings.map((f) => `${f.rule}: ${f.message}`).join('\n'))
  }
  expect(result.ok).toBe(true)
})

// Decisão explícita registrada em RESTRICTIONS.md: os dias A e C passam do teto
// de 50 min (53 e 51 no pico) para caber a rosca direta e manter o bíceps dentro
// da banda, sem tocar no descanso longo dos compostos. Qualquer warning NOVO,
// inclusive um terceiro dia estourando, quebra o teste.
const ACCEPTED = ['session-too-long']

test('training.yaml não tem warning de doutrina além dos aceitos', () => {
  const result = parseProgram(source)
  const warnings = result.findings
    .filter((f) => f.severity === 'warn')
    .filter((f) => !ACCEPTED.includes(f.rule))
  expect(warnings.map((w) => `${w.rule}: ${w.message}`)).toEqual([])
})

// Depois da medição em campo (2026-08-11), o setup por série de barra subiu de
// 15s para 40s e a estimativa de pico passou a acusar TRÊS dias acima do teto.
// A lista é fixada aqui para que uma mudança — um quarto dia, ou um enxugamento
// do programa — não passe em silêncio. Decisão de enxugar está com o Caio.
test('exatamente os dias A, B e C passam do teto de tempo', () => {
  const result = parseProgram(source)
  const longos = result.findings.filter((f) => f.rule === 'session-too-long')
  expect(longos.map((f) => f.message.match(/Dia (\w+)/)?.[1]).sort()).toEqual(['A', 'B', 'C'])
})

test('volume no pico cabe nas bandas', () => {
  const result = parseProgram(source)
  if (!result.ok) throw new Error('programa inválido')
  const block = result.program.blocks[0]
  for (const { muscle, direct, band } of weeklyVolume(result.program, block, block.weeks)) {
    if (!band || direct === 0) continue
    expect(direct, `${muscle} no pico`).toBeGreaterThanOrEqual(band.min)
    expect(direct, `${muscle} no pico`).toBeLessThanOrEqual(band.max)
  }
})
