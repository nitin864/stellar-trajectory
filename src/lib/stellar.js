import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api'
import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  Memo,
  BASE_FEE,
} from '@stellar/stellar-sdk'

// --- Network config -------------------------------------------------------

export const NETWORK_PASSPHRASE = Networks.TESTNET
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const FRIENDBOT_URL = 'https://friendbot.stellar.org'

const server = new Horizon.Server(HORIZON_URL)

// --- Wallet (Freighter) -----------------------------------------------------

/**
 * Checks whether the Freighter browser extension is installed at all.
 */
export async function isFreighterInstalled() {
  const result = await freighterIsConnected()
  return !result?.error && !!result?.isConnected
}

/**
 * Asks the user to allow this site to talk to Freighter, then returns the
 * selected public key (address). Throws a friendly error on rejection.
 */
export async function connectWallet() {
  const installed = await isFreighterInstalled()
  if (!installed) {
    throw new Error(
      'Freighter is not installed. Add the extension from freighter.app and refresh the page.'
    )
  }

  const allowed = await freighterIsAllowed()
  if (allowed?.error) {
    throw new Error(allowed.error)
  }
  if (!allowed?.isAllowed) {
    const setResult = await freighterSetAllowed()
    if (setResult?.error) {
      throw new Error(setResult.error)
    }
  }

  const access = await freighterRequestAccess()
  if (access?.error) {
    throw new Error(access.error)
  }

  const addressResult = access?.address ? access : await freighterGetAddress()
  if (addressResult?.error) {
    throw new Error(addressResult.error)
  }
  if (!addressResult?.address) {
    throw new Error('Freighter did not return a wallet address.')
  }

  return addressResult.address
}

/**
 * There is no real "disconnect" call in Freighter's API (the extension owns
 * that permission). Locally we just forget the address so the app returns to
 * its signed-out state.
 */
export function disconnectWallet() {
  return true
}

// --- Balance -----------------------------------------------------------------

/**
 * Loads an account from Horizon testnet and returns its native XLM balance
 * as a string, e.g. "9999.9999900". Returns null if the account has not
 * been created/funded on the network yet.
 */
export async function fetchXlmBalance(publicKey) {
  try {
    const account = await server.loadAccount(publicKey)
    const native = account.balances.find((b) => b.asset_type === 'native')
    return native ? native.balance : '0'
  } catch (err) {
    if (err?.response?.status === 404) {
      return null // account not yet funded on testnet
    }
    throw err
  }
}

/**
 * Requests 10,000 testnet XLM from Friendbot for a freshly created account.
 */
export async function fundWithFriendbot(publicKey) {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`)
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Friendbot funding failed: ${body || response.statusText}`)
  }
  return true
}

// --- Payments ------------------------------------------------------------

/**
 * Builds, signs (via Freighter) and submits a native XLM payment on testnet.
 * Returns the Horizon submission result, which includes the transaction hash.
 */
export async function sendXlmPayment({ sourcePublicKey, destination, amount, memo }) {
  const sourceAccount = await server.loadAccount(sourcePublicKey)

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({
      destination,
      asset: Asset.native(),
      amount: String(amount),
    })
  )

  if (memo) {
    txBuilder.addMemo(Memo.text(memo.slice(0, 28)))
  }

  const transaction = txBuilder.setTimeout(60).build()

  const { signedTxXdr, error: signError } = await freighterSignTransaction(
    transaction.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  )

  if (signError) {
    throw new Error(signError)
  }

  const signedTransaction = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  const result = await server.submitTransaction(signedTransaction)
  return result
}

export function isValidStellarAddress(address) {
  return typeof address === 'string' && /^G[A-Z2-7]{55}$/.test(address)
}
