function shortenAddress(address) {
  if (!address) return null
  return `${address.slice(0, 4)}···${address.slice(-4)}`
}

// Signature element: two nodes on a star chart with a course plotted between
// them. Idle when there's no destination yet, lit up mid-transaction.
export default function TrajectoryCard({ source, destination, sending, children }) {
  const hasDestination = destination && destination.length > 10
  const active = sending

  return (
    <section className="panel send-panel">
      <div className="panel-label">Plot a payment</div>

      <div className={`trajectory ${active ? 'trajectory-active' : ''}`}>
        <div className="trajectory-node">
          <span className="node-dot node-dot-source" />
          <span className="node-caption">
            {source ? shortenAddress(source) : 'Your wallet'}
          </span>
        </div>

        <svg className="trajectory-path" viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true">
          <line x1="6" y1="12" x2="194" y2="12" className="trajectory-line-bg" />
          <line
            x1="6"
            y1="12"
            x2="194"
            y2="12"
            className={`trajectory-line-fg ${hasDestination ? 'trajectory-line-fg-visible' : ''}`}
          />
          {active && <circle r="3" className="trajectory-comet"><animateMotion dur="1.1s" repeatCount="indefinite" path="M6,12 L194,12" /></circle>}
        </svg>

        <div className="trajectory-node">
          <span className={`node-dot node-dot-dest ${hasDestination ? 'node-dot-dest-set' : ''}`} />
          <span className="node-caption">
            {hasDestination ? shortenAddress(destination) : 'Destination'}
          </span>
        </div>
      </div>

      {children}
    </section>
  )
}
