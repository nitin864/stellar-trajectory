import { useCallback, useEffect, useRef, useState } from 'react'
import {
  connectWallet,
  disconnectWallet,
  fetchXlmBalance,
  fundWithFriendbot,
  sendXlmPayment,
  isValidStellarAddress,
} from './lib/stellar'
import Starfield from './components/Starfield.jsx'
import TrajectoryCard from './components/TrajectoryCard.jsx'
import MissionLog from './components/MissionLog.jsx'

const EXPLORER_TX_URL = 'https://stellar.expert/explorer/testnet/tx/'

function shortenAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 4)}···${address.slice(-4)}`
}

export default function App() {
  const [publicKey, setPublicKey] = useState(null)
  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [walletError, setWalletError] = useState(null)

  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [sending, setSending] = useState(false)

  const [log, setLog] = useState([])
  const logIdRef = useRef(0)

  const pushLog = useCallback((entry) => {
    logIdRef.current += 1
    setLog((prev) => [{ id: logIdRef.current, time: new Date(), ...entry }, ...prev])
  }, [])

  const refreshBalance = useCallback(async (key) => {
    if (!key) return
    setBalanceLoading(true)
    try {
      const value = await fetchXlmBalance(key)
      setBalance(value)
    } catch (err) {
      pushLog({ status: 'error', title: 'Could not load balance', detail: err.message })
    } finally {
      setBalanceLoading(false)
    }
  }, [pushLog])

  useEffect(() => {
    if (publicKey) refreshBalance(publicKey)
  }, [publicKey, refreshBalance])

  async function handleConnect() {
    setWalletError(null)
    setConnecting(true)
    try {
      const address = await connectWallet()
      setPublicKey(address)
      pushLog({ status: 'success', title: 'Wallet connected', detail: shortenAddress(address) })
    } catch (err) {
      setWalletError(err.message)
      pushLog({ status: 'error', title: 'Connection failed', detail: err.message })
    } finally {
      setConnecting(false)
    }
  }

  function handleDisconnect() {
    disconnectWallet()
    setPublicKey(null)
    setBalance(null)
    setDestination('')
    setAmount('')
    setMemo('')
    pushLog({ status: 'info', title: 'Wallet disconnected' })
  }

  async function handleFund() {
    if (!publicKey) return
    pushLog({ status: 'info', title: 'Requesting testnet XLM from Friendbot…' })
    try {
      await fundWithFriendbot(publicKey)
      pushLog({ status: 'success', title: 'Friendbot funded this account' })
      await refreshBalance(publicKey)
    } catch (err) {
      pushLog({ status: 'error', title: 'Friendbot request failed', detail: err.message })
    }
  }

  async function handleSend(event) {
    event.preventDefault()
    if (!publicKey) return

    if (!isValidStellarAddress(destination)) {
      pushLog({ status: 'error', title: 'Invalid destination address', detail: 'Stellar addresses start with G and are 56 characters long.' })
      return
    }
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      pushLog({ status: 'error', title: 'Invalid amount', detail: 'Enter an amount greater than 0.' })
      return
    }

    setSending(true)
    pushLog({ status: 'pending', title: 'Plotting course…', detail: `${numericAmount} XLM → ${shortenAddress(destination)}` })
    try {
      const result = await sendXlmPayment({
        sourcePublicKey: publicKey,
        destination,
        amount: numericAmount,
        memo,
      })
      pushLog({
        status: 'success',
        title: 'Transaction confirmed',
        detail: `${numericAmount} XLM sent to ${shortenAddress(destination)}`,
        hash: result.hash,
      })
      setDestination('')
      setAmount('')
      setMemo('')
      await refreshBalance(publicKey)
    } catch (err) {
      const detail =
        err?.response?.data?.extras?.result_codes?.operations?.join(', ') ||
        err?.message ||
        'Unknown error'
      pushLog({ status: 'error', title: 'Transaction failed', detail })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="app-shell">
      <Starfield />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <div className="brand-text">
            <span className="brand-name">Trajectory</span>
            <span className="brand-sub">Stellar Testnet Payments</span>
          </div>
        </div>

        {publicKey ? (
          <div className="wallet-pill">
            <span className="dot dot-live" aria-hidden="true" />
            <span className="mono">{shortenAddress(publicKey)}</span>
            <button className="btn btn-ghost" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect Freighter'}
          </button>
        )}
      </header>

      <main className="main-grid">
        <section className="panel balance-panel">
          <div className="panel-label">Balance · Testnet</div>
          {!publicKey && (
            <div className="empty-state">
              <p>Connect your Freighter wallet to see your balance and send a payment.</p>
              {walletError && <p className="error-text">{walletError}</p>}
            </div>
          )}
          {publicKey && (
            <>
              <div className="balance-figure">
                {balanceLoading && balance === null ? (
                  <span className="skeleton" />
                ) : balance === null ? (
                  <span className="balance-zero">Unfunded on testnet</span>
                ) : (
                  <>
                    <span className="balance-number">{Number(balance).toLocaleString(undefined, { maximumFractionDigits: 7 })}</span>
                    <span className="balance-unit">XLM</span>
                  </>
                )}
              </div>
              <div className="balance-actions">
                <button className="btn btn-ghost" onClick={() => refreshBalance(publicKey)} disabled={balanceLoading}>
                  {balanceLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                <button className="btn btn-ghost" onClick={handleFund}>
                  Fund via Friendbot
                </button>
              </div>
            </>
          )}
        </section>

        <TrajectoryCard
          source={publicKey}
          destination={destination}
          sending={sending}
        >
          <form className="send-form" onSubmit={handleSend}>
            <label className="field">
              <span className="field-label">Destination address</span>
              <input
                className="field-input mono"
                placeholder="GABC...XYZ"
                value={destination}
                onChange={(e) => setDestination(e.target.value.trim())}
                disabled={!publicKey || sending}
                required
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Amount</span>
                <input
                  className="field-input mono"
                  type="number"
                  min="0.0000001"
                  step="0.0000001"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!publicKey || sending}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Memo (optional)</span>
                <input
                  className="field-input"
                  placeholder="For the mission log"
                  maxLength={28}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  disabled={!publicKey || sending}
                />
              </label>
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={!publicKey || sending}>
              {sending ? 'Sending…' : 'Send XLM'}
            </button>
          </form>
        </TrajectoryCard>

        <MissionLog entries={log} explorerBaseUrl={EXPLORER_TX_URL} />
      </main>

      <footer className="footer-note">
        Stellar Testnet · Horizon <span className="mono">horizon-testnet.stellar.org</span>
      </footer>
    </div>
  )
}
