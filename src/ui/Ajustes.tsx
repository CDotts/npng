import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { program, programFindings } from '../program/load'
import { wipe } from '../store/db'
import { buildBackup, buildCsv, importBackup, share } from '../store/transfer'
import { screenLockHeld, startKeepAlive, stopKeepAlive } from '../timer/keepAlive'
import { notifyRestDone, notifyState, requestNotify } from '../timer/notify'
import { NON_DEFAULT_FLAGS } from '../flags'
import { useLog } from './useLog'
import { StorageError } from './StorageError'

export function Ajustes() {
  const log = useLog()
  const [status, setStatus] = useState<string | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [notif, setNotif] = useState<string>(notifyState())
  const [lockHeld, setLockHeld] = useState<boolean | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doExportCsv = async () => {
    const result = await share('npng-treinos.csv', await buildCsv(), 'text/csv')
    if (result !== 'cancelled') setStatus('CSV gerado.')
  }

  const doExportBackup = async () => {
    const result = await share('npng-backup.json', await buildBackup(), 'application/json')
    if (result !== 'cancelled') setStatus('Backup gerado.')
  }

  const doImport = async (file: File) => {
    try {
      await importBackup(await file.text())
      await log.reload()
      setStatus('Backup restaurado.')
    } catch (err) {
      setStatus(`Falhou: ${(err as Error).message}`)
    }
  }

  if (log.error) return <StorageError message={log.error} onRetry={log.reload} />

  return (
    <div className="app">
      <div className="top">
        <h1>Ajustes</h1>
      </div>

      {NON_DEFAULT_FLAGS.length > 0 && (
        <div className="notice warn">
          <b>Modo de teste.</b>
          {NON_DEFAULT_FLAGS.map((f) => (
            <div key={f}>{f}</div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Bloco atual</h2>
        <p className="muted small" style={{ margin: '8px 0 0' }}>
          {program.blocks.map((b) => `${b.name} · ${b.weeks} semanas · regra ${b.rule}`).join(' → ')}
        </p>
        <p className="dim small" style={{ margin: '4px 0 0' }}>
          {program.exercises.length} exercícios · {program.blocks.length} bloco
          {program.blocks.length > 1 ? 's' : ''} declarado{program.blocks.length > 1 ? 's' : ''}
        </p>
      </div>

      <Link to="/glossario" className="card row between" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="col">
          <h2>Glossário</h2>
          <span className="dim small">RIR, banda, top set, deload e o resto da metodologia</span>
        </div>
        <span className="dim">›</span>
      </Link>

      <div className="card">
        <h2>Aviso de fim de descanso</h2>
        <p className="dim small" style={{ margin: '6px 0 10px' }}>
          O aviso é uma <b>notificação</b>, não um som. Alarme sonoro foi removido: no iOS, manter
          áudio tocando é a única forma de o timer sobreviver à tela bloqueada, e isso rouba a sessão
          de áudio do app de música sem devolver. Nenhuma categoria de{' '}
          <code>navigator.audioSession</code> resolveu as duas coisas. O histórico do que foi testado
          está em <code>DOCTRINE.md</code> §13.5.
        </p>

        {notif === 'granted' ? (
          <button
            className="big ghost"
            onClick={async () => {
              const ok = await notifyRestDone('Teste', 1)
              setStatus(ok ? 'Notificação enviada.' : 'Falhou ao notificar.')
            }}
          >
            Testar notificação
          </button>
        ) : (
          <button
            className="big"
            onClick={async () => {
              const r = await requestNotify()
              setNotif(r)
              setStatus(r === 'granted' ? 'Notificações liberadas.' : `Permissão: ${r}`)
            }}
          >
            {notif === 'denied' ? 'Permissão negada — libere nos ajustes do iOS' : 'Permitir notificações'}
          </button>
        )}

        <button
          className="big ghost"
          style={{ marginTop: 8 }}
          onClick={async () => {
            await startKeepAlive()
            setLockHeld(screenLockHeld())
            window.setTimeout(stopKeepAlive, 3000)
          }}
        >
          Testar Wake Lock
        </button>

        <p className="dim small" style={{ margin: '10px 0 0' }}>
          Notificações: <span className="mono">{notif}</span>
          {lockHeld !== null && (
            <>
              {' · '}Wake Lock: <span className="mono">{lockHeld ? 'ativo' : 'indisponível'}</span>
            </>
          )}
        </p>
        <p className="dim small" style={{ margin: '8px 0 0' }}>
          Com o Wake Lock ativo a tela não apaga durante o treino, e o timer roda normalmente. Se a
          tela apagar, o iOS suspende a página: ao voltar, o app avisa o descanso vencido com o atraso
          real.
        </p>
      </div>

      <div className="card">
        <h2>Dados</h2>
        <p className="dim small" style={{ margin: '6px 0 12px' }}>
          {log.sessions.length} sessões · {log.sets.length} séries ·{' '}
          {log.commitments.filter((c) => c.status === 'pending').length} commitments pendentes
        </p>
        <button className="big" onClick={doExportCsv} style={{ marginBottom: 8 }}>
          Exportar CSV (WhatsApp)
        </button>
        <button className="big" onClick={doExportBackup} style={{ marginBottom: 8 }}>
          Exportar backup completo
        </button>
        <button className="big" onClick={() => fileRef.current?.click()}>
          Restaurar backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void doImport(file)
            e.target.value = ''
          }}
        />
        <p className="dim small" style={{ marginBottom: 0 }}>
          O CSV é para ler e mandar. O backup restaura tudo — inclusive commitments e regulagens,
          que o CSV não carrega.
        </p>
      </div>

      <div className="card">
        <h2>Apagar tudo</h2>
        <p className="dim small" style={{ margin: '6px 0 12px' }}>
          Remove sessões, séries, commitments e regulagens deste aparelho. Não dá para desfazer —
          exporte o backup antes.
        </p>
        <button className="big ghost" onClick={() => setConfirmWipe(true)}>
          Apagar histórico
        </button>
      </div>

      {confirmWipe && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="wipe-title">
          <div className="dialog">
            <h2 id="wipe-title">Apagar todo o histórico?</h2>
            <p className="muted small" style={{ margin: '10px 0 0' }}>
              Vão embora <b>{log.sessions.length} sessões</b>, <b>{log.sets.length} séries</b>,{' '}
              <b>{log.commitments.length} commitments</b> e <b>{log.setups.length} regulagens</b>{' '}
              deste aparelho.
            </p>
            <p className="dim small" style={{ margin: '10px 0 16px' }}>
              Não dá para desfazer. Se ainda não exportou o backup, cancele e exporte primeiro.
            </p>
            <button
              className="big btn-danger"
              onClick={async () => {
                await wipe()
                await log.reload()
                setConfirmWipe(false)
                setStatus('Histórico apagado.')
              }}
            >
              Apagar tudo
            </button>
            <button className="big ghost" style={{ marginTop: 8 }} onClick={() => setConfirmWipe(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {programFindings.length > 0 && (
        <div className="card">
          <h2>Lint do programa</h2>
          {programFindings.map((f, i) => (
            <p key={i} className="muted small">
              <b>{f.rule}</b> — {f.message}
            </p>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Versão</h2>
        <p className="dim small mono" style={{ margin: '8px 0 0' }}>
          {__BUILD_SHA__} · {__BUILD_AT__}
        </p>
        <p className="dim small" style={{ margin: '8px 0 0' }}>
          Compare com o commit no repositório para saber se o app está atualizado. Se estiver velho,
          feche e reabra pela tela de início; o service worker troca na segunda abertura.
        </p>
      </div>

      {status && <p className="muted small">{status}</p>}
    </div>
  )
}
