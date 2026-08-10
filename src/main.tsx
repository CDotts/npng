import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Boom } from './ui/Boom'

const root = createRoot(document.getElementById('root')!)

// Erro no módulo (YAML inválido, API ausente no navegador) acontece antes de
// qualquer componente montar, então o error boundary não alcança: precisa de
// uma rede de segurança em volta do próprio render inicial.
try {
  root.render(
    <StrictMode>
      <Boom>
        <App />
      </Boom>
    </StrictMode>,
  )
} catch (err) {
  const e = err as Error
  document.getElementById('root')!.innerHTML =
    `<div style="padding:24px;font:16px -apple-system,sans-serif;color:#f2f3f5">` +
    `<h1 style="font-size:22px">O app não iniciou</h1>` +
    `<p style="color:#f28a8a"><b>${e.name}: ${e.message}</b></p>` +
    `<p style="color:#a8acb4">Build ${__BUILD_SHA__} · ${__BUILD_AT__}</p>` +
    `<pre style="white-space:pre-wrap;word-break:break-word;color:#7b8089;font-size:12px">${e.stack ?? ''}\n${navigator.userAgent}</pre>` +
    `</div>`
}
