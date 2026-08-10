import { useCallback, useEffect, useRef, useState } from 'react'
import { notifyRestDone } from './notify'

export type RestTimer = {
  remaining: number
  total: number
  running: boolean
  start: (seconds: number) => void
  stop: () => void
  add: (seconds: number) => void
}

export function useRestTimer(context?: { exercise: string; nextSet: number }): RestTimer {
  const [total, setTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const endsAt = useRef<number | null>(null)
  const fired = useRef(false)
  // O intervalo é criado uma vez; sem ref o callback fecharia sobre o contexto
  // do primeiro render e a notificação citaria sempre o mesmo exercício.
  const ctx = useRef(context)
  ctx.current = context

  useEffect(() => {
    const id = window.setInterval(() => {
      if (endsAt.current === null) return
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0 && !fired.current) {
        fired.current = true
        if (ctx.current) void notifyRestDone(ctx.current.exercise, ctx.current.nextSet)
        endsAt.current = null
      }
    }, 250)
    // Se a página foi suspensa com a tela apagada, o intervalo não roda e o
    // descanso vence sem aviso. Ao voltar, notifica uma vez com o atraso real.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (endsAt.current === null || fired.current) return
      if (Date.now() < endsAt.current) return
      fired.current = true
      endsAt.current = null
      setRemaining(0)
      if (ctx.current) void notifyRestDone(ctx.current.exercise, ctx.current.nextSet)
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const start = useCallback((seconds: number) => {
    fired.current = false
    endsAt.current = Date.now() + seconds * 1000
    setTotal(seconds)
    setRemaining(seconds)
  }, [])

  const stop = useCallback(() => {
    endsAt.current = null
    setRemaining(0)
    setTotal(0)
  }, [])

  const add = useCallback((seconds: number) => {
    if (endsAt.current === null) return
    endsAt.current += seconds * 1000
    setTotal((t) => t + seconds)
  }, [])

  return { remaining, total, running: endsAt.current !== null, start, stop, add }
}
