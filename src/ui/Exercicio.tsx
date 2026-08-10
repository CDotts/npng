import { useNavigate, useParams } from 'react-router-dom'
import { exerciseById } from '../program/load'

import { useLog, photoUrl } from './useLog'
import { StorageError } from './StorageError'
import { ExerciseTrend } from './ExerciseTrend'

export function Exercicio() {
  const { exerciseId = '' } = useParams()
  const nav = useNavigate()
  const log = useLog()
  const ex = exerciseById.get(exerciseId)

  if (log.error) return <StorageError message={log.error} onRetry={log.reload} />
  if (log.loading) return <div className="app" />
  if (!ex) {
    return (
      <div className="app">
        <div className="top">
          <h1>Exercício desconhecido</h1>
        </div>
        <button className="big" onClick={() => nav(-1)}>
          Voltar
        </button>
      </div>
    )
  }

  const setup = log.setups.find((s) => s.exerciseId === ex.id)?.text ?? ex.setup_hint

  return (
    <div className="app">
      <div className="top">
        <h1>{ex.name}</h1>
        <button className="ghost small" onClick={() => nav(-1)}>
          Voltar
        </button>
      </div>

      <img className="hero" src={photoUrl(ex.photo)} alt={ex.name} />

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row between mono small">
          <span className="muted">
            {ex.reps[0]}-{ex.reps[1]} reps · RIR {ex.rir} · +{ex.increment} kg
          </span>
          <span className="dim">{ex.failure_ok ? 'falha ok' : 'sem falha'}</span>
        </div>
        {setup && <p className="muted small" style={{ margin: '10px 0 0' }}>⚙ {setup}</p>}
        <a
          className="ghost small yt"
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' execução')}`}
          target="_blank"
          rel="noreferrer"
        >
          ▷ Ver execução no YouTube
        </a>
        <p className="dim small" style={{ margin: '6px 0 0' }}>
          Primário: {ex.primary.join(', ')}
          {ex.secondary.length > 0 ? ` · secundário: ${ex.secondary.join(', ')}` : ''}
        </p>
      </div>

      <div className="card">
        <h2>Evolução</h2>
        <div style={{ marginTop: 12 }}>
          <ExerciseTrend exerciseId={ex.id} sets={log.sets} />
        </div>
      </div>
    </div>
  )
}
