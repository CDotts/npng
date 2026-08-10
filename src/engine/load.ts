import type { Exercise } from '../program/schema'

export const DEFAULT_BAR_KG = 20

/**
 * Converte o número registrado — que segue a convenção de observação do exercício
 * (`DOCTRINE.md` §13.4) — na carga real levantada. Só métricas de tonelagem usam
 * isto; progressão e prescrição continuam no número observado, que é o que se lê
 * no aparelho.
 */
export function effectiveLoad(ex: Pick<Exercise, 'load_unit' | 'bar_kg'> | undefined, loadKg: number): number {
  if (!ex) return loadKg
  if (ex.load_unit === 'por lado') return loadKg * 2 + (ex.bar_kg ?? DEFAULT_BAR_KG)
  if (ex.load_unit === 'por halter') return loadKg * 2
  return loadKg
}
