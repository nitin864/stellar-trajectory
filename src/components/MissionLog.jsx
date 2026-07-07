const STATUS_ICON = {
  success: '✓',
  error: '✕',
  pending: '…',
  info: '·',
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function MissionLog({ entries, explorerBaseUrl }) {
  return (
    <section className="panel log-panel">
      <div className="panel-label">Mission log</div>
      {entries.length === 0 ? (
        <p className="empty-state">Wallet events and transaction results will appear here.</p>
      ) : (
        <ul className="log-list">
          {entries.map((entry) => (
            <li key={entry.id} className={`log-entry log-${entry.status}`}>
              <span className="log-icon" aria-hidden="true">{STATUS_ICON[entry.status] || '·'}</span>
              <div className="log-body">
                <div className="log-row">
                  <span className="log-title">{entry.title}</span>
                  <span className="log-time mono">{formatTime(entry.time)}</span>
                </div>
                {entry.detail && <div className="log-detail mono">{entry.detail}</div>}
                {entry.hash && (
                  <a
                    className="log-hash mono"
                    href={`${explorerBaseUrl}${entry.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {entry.hash.slice(0, 10)}…{entry.hash.slice(-6)} ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
