import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Hoje } from './ui/Hoje'
import { Runner } from './ui/Runner'
import { Fim } from './ui/Fim'
import { Volume } from './ui/Volume'
import { Historico } from './ui/Historico'
import { Exercicio } from './ui/Exercicio'
import { Ajustes } from './ui/Ajustes'
import { Glossario } from './ui/Glossario'

const TABS = [
  { to: '/', icon: '▲', label: 'Hoje' },
  { to: '/volume', icon: '▤', label: 'Volume' },
  { to: '/historico', icon: '◷', label: 'Histórico' },
  { to: '/ajustes', icon: '⚙', label: 'Ajustes' },
]

function TabBar() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/treino/') && !pathname.endsWith('/fim')) return null
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}>
          <b>{t.icon}</b>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Hoje />} />
        <Route path="/treino/:sessionId" element={<Runner />} />
        <Route path="/treino/:sessionId/fim" element={<Fim />} />
        <Route path="/volume" element={<Volume />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/exercicio/:exerciseId" element={<Exercicio />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="/glossario" element={<Glossario />} />
      </Routes>
      <TabBar />
    </HashRouter>
  )
}
