import { useCallback, useEffect, useState } from 'react'
import { snapshot, type Snapshot } from '../store/db'

const EMPTY: Snapshot = { sessions: [], sets: [], commitments: [], setups: [] }

const OPEN_TIMEOUT_MS = 6000

export function useLog() {
  const [data, setData] = useState<Snapshot>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // O IndexedDB pode ficar pendurado indefinidamente (delete bloqueado, outra
      // aba segurando o banco). Sem timeout o app fica numa tela branca sem saída.
      const result = await Promise.race([
        snapshot(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('O banco local não respondeu.')), OPEN_TIMEOUT_MS),
        ),
      ])
      setData(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...data, loading, error, reload }
}

export function photoUrl(photo: string) {
  return `${import.meta.env.BASE_URL}${photo}`
}

export function fmtDuration(ms: number) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function fmtClock(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function fmtKg(kg: number) {
  return Number.isInteger(kg) ? `${kg}` : kg.toFixed(1)
}

/** Histórico sobrevive à troca de bloco: um exercício logado pode não estar mais no training.yaml. */
export function exerciseLabel(id: string, name?: string) {
  return name ?? `${id} (fora do bloco atual)`
}
