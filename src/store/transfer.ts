import { exerciseById } from '../program/load'
import { effectiveLoad } from '../engine/load'
import { snapshot, restore, type Snapshot } from './db'

const CSV_HEADER =
  'timestamp,session_id,block_id,meso_week,day,exercise_id,exercise,set_index,set_type,load_kg,load_unit,load_real_kg,reps,rir,rest_s,volume_kg'

function iso(at: number) {
  const d = new Date(at)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export async function buildCsv(): Promise<string> {
  const data = await snapshot()
  const sessionById = new Map(data.sessions.map((s) => [s.id, s]))
  const rows = [...data.sets].sort((a, b) => a.at - b.at).map((s) => {
    const session = sessionById.get(s.sessionId)
    const day = session?.dayId ?? ''
    const ex = exerciseById.get(s.exerciseId)
    const name = ex?.name ?? s.exerciseId
    const real = effectiveLoad(ex, s.loadKg)
    return [
      iso(s.at),
      s.sessionId,
      session?.blockId ?? '',
      String(session?.mesoWeek ?? ''),
      day,
      s.exerciseId,
      csvCell(name),
      String(s.index + 1),
      s.type,
      String(s.loadKg),
      ex?.load_unit ?? 'total',
      String(real),
      String(s.reps),
      String(s.rir),
      String(s.restS),
      String(Math.round(real * s.reps)),
    ].join(',')
  })
  return [CSV_HEADER, ...rows].join('\n')
}

export async function buildBackup(): Promise<string> {
  const data = await snapshot()
  return JSON.stringify({ version: 1, exportedAt: Date.now(), ...data }, null, 2)
}

export function isSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    Array.isArray(v.sessions) &&
    Array.isArray(v.sets) &&
    Array.isArray(v.commitments) &&
    Array.isArray(v.setups)
  )
}

export async function importBackup(text: string) {
  const parsed: unknown = JSON.parse(text)
  if (!isSnapshot(parsed)) throw new Error('Arquivo não parece um backup do NPNG.')
  await restore(parsed)
}

export async function share(filename: string, content: string, mime: string) {
  const file = new File([content], filename, { type: mime })
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return 'shared' as const
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled' as const
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded' as const
}
