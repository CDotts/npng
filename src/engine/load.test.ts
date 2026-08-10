import { expect, test } from 'vitest'
import { effectiveLoad, DEFAULT_BAR_KG } from './load'
import { program } from '../program/load'
import type { Exercise } from '../program/schema'

const byId = new Map(program.exercises.map((e) => [e.id, e]))
const ex = (id: string) => byId.get(id) as Exercise

test('total é o próprio número', () => {
  expect(effectiveLoad(ex('leg_press'), 100)).toBe(100)
})

test('por lado dobra e soma a barra', () => {
  expect(effectiveLoad(ex('supino_reto_barra'), 11)).toBe(42)
  expect(effectiveLoad(ex('agachamento_livre'), 30)).toBe(80)
})

test('por halter dobra sem barra', () => {
  expect(effectiveLoad(ex('supino_inclinado_halteres'), 26)).toBe(52)
})

test('crossover é por lado sem barra', () => {
  expect(effectiveLoad(ex('crucifixo_crossover'), 15)).toBe(30)
})

test('por lado sem bar_kg cai no default', () => {
  expect(effectiveLoad({ load_unit: 'por lado', bar_kg: undefined }, 10)).toBe(20 + DEFAULT_BAR_KG)
})

test('exercício desconhecido não converte', () => {
  expect(effectiveLoad(undefined, 40)).toBe(40)
})

// A conversão é mecânica: todo exercício `por lado` precisa declarar bar_kg, porque
// o default de 20 kg silenciosamente inventaria uma barra no crossover e no smith.
test('todo por lado declara bar_kg', () => {
  const faltando = program.exercises
    .filter((e) => e.load_unit === 'por lado' && e.bar_kg === undefined)
    .map((e) => e.id)
  expect(faltando).toEqual([])
})
