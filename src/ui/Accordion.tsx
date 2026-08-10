import { useState, type ReactNode } from 'react'

type Props = { title: string; children: ReactNode; defaultOpen?: boolean }

export function Accordion({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card">
      <button className="ghost daybtn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <h2 className="grow">{title}</h2>
        <span className="dim">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && <div style={{ marginTop: 6 }}>{children}</div>}
    </div>
  )
}
