type Props = { message: string; onRetry: () => void }

export function StorageError({ message, onRetry }: Props) {
  return (
    <div className="app">
      <div className="top">
        <h1>Sem acesso aos dados</h1>
      </div>
      <div className="notice danger">
        <b>{message}</b>
        <p style={{ margin: '8px 0 0' }}>
          Falha ao abrir o banco local. O histórico não foi afetado. Causa mais comum: outra aba do
          NPNG mantendo o banco aberto.
        </p>
      </div>
      <button className="big primary" onClick={onRetry} style={{ marginBottom: 8 }}>
        Tentar de novo
      </button>
      <button className="big ghost" onClick={() => location.reload()}>
        Recarregar o app
      </button>
      <p className="dim small" style={{ marginTop: 12 }}>
        Se persistir: feche as outras abas do NPNG e recarregue. O histórico só é perdido ao apagar
        os dados do site.
      </p>
    </div>
  )
}
