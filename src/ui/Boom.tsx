import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null; info: string }

/**
 * Sem isto, qualquer erro de render vira tela branca — indistinguível de cache
 * velho, rede ruim ou app quebrado, e impossível de diagnosticar de longe.
 */
export class Boom extends Component<Props, State> {
  state: State = { error: null, info: '' }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info: info.componentStack ?? '' })
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children
    const text = `NPNG ${__BUILD_SHA__} (${__BUILD_AT__})\n${navigator.userAgent}\n\n${error.name}: ${error.message}\n${error.stack ?? ''}\n${info}`
    return (
      <div className="app">
        <div className="top">
          <h1>O app quebrou</h1>
        </div>
        <div className="notice danger">
          <b>{error.name}: {error.message}</b>
          <p style={{ margin: '8px 0 0' }}>
            Build {__BUILD_SHA__} · {__BUILD_AT__}
          </p>
        </div>
        <button className="big primary" onClick={() => navigator.clipboard?.writeText(text)}>
          Copiar detalhes do erro
        </button>
        <button className="big ghost" style={{ marginTop: 8 }} onClick={() => location.reload()}>
          Recarregar
        </button>
        <pre
          className="dim small"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 16 }}
        >
          {text}
        </pre>
      </div>
    )
  }
}
