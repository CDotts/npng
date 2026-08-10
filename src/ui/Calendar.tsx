import { weekStart } from '../engine/log'

const DAY = 86400000
const LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

type Entry = { at: number; dayId: string }

export function Calendar({ entries, maxWeeks = 12 }: { entries: Entry[]; maxWeeks?: number }) {
  const thisWeek = weekStart(Date.now())
  const earliest = entries.length ? weekStart(Math.min(...entries.map((e) => e.at))) : thisWeek
  const span = Math.round((thisWeek - earliest) / (7 * DAY)) + 1
  const weeks = Math.min(maxWeeks, Math.max(4, span))
  const first = thisWeek - (weeks - 1) * 7 * DAY

  const byDay = new Map<number, string[]>()
  for (const e of entries) {
    const d = new Date(e.at)
    d.setHours(0, 0, 0, 0)
    const key = d.getTime()
    byDay.set(key, [...(byDay.get(key) ?? []), e.dayId])
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = Array.from({ length: weeks }, (_, w) => {
    const start = first + w * 7 * DAY
    return {
      start,
      days: Array.from({ length: 7 }, (_, i) => {
        const at = start + i * DAY
        return { at, ids: byDay.get(at) ?? [], future: at > today.getTime() }
      }),
    }
  })

  return (
    <div className="calendar">
      <div className="calrow head">
        <span />
        {LABELS.map((l, i) => (
          <span key={i} className="dim">
            {l}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div className="calrow" key={row.start}>
          <span className="calweek dim mono">
            {new Date(row.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
          {row.days.map((d) => (
            <span
              key={d.at}
              className={`cell${d.ids.length ? ' on' : ''}${d.at === today.getTime() ? ' today' : ''}${d.future ? ' future' : ''}`}
              title={new Date(d.at).toLocaleDateString('pt-BR')}
            >
              {d.ids[0] ?? ''}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
