# Trajectory — A Simple Payment dApp on Stellar Testnet

Trajectory is a beginner-friendly Stellar dApp built for the **Level 1 – White Belt** challenge.
It lets you connect a Freighter wallet, view your live testnet XLM balance, and send a payment
to any Stellar address — with clear success/failure feedback and a link to the transaction on
a block explorer.

Built with **React + Vite**, [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api)
for wallet connectivity, and [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk)
for talking to Horizon on the Stellar **Testnet**.

## Features

- **Connect / disconnect** a Freighter wallet
- **Live XLM balance** for the connected account, with a manual refresh and one-click
  Friendbot funding for brand-new testnet accounts
- **Send XLM** to any address, with client-side validation (address format, positive amount)
- **Transaction feedback**: a "mission log" panel shows every wallet/transaction event with a
  success, error, or pending state, plus the transaction hash linked to
  [stellar.expert](https://stellar.expert/explorer/testnet)

## Tech stack

| Layer      | Choice                                            |
|------------|----------------------------------------------------|
| UI         | React 18 + Vite                                    |
| Wallet     | Freighter browser extension via `@stellar/freighter-api` |
| Chain      | Stellar **Testnet** via `@stellar/stellar-sdk` (Horizon) |
| Funding    | Friendbot (`https://friendbot.stellar.org`)        |

No backend, no API keys, no smart contracts — everything happens client-side against public
Stellar Testnet infrastructure.

## Prerequisites

1. **Node.js** 18+ and npm
2. **[Freighter](https://www.freighter.app/)** browser extension installed
3. Inside Freighter: switch the network to **Test Net** (Settings → Preferences → Network)

## Setup — run it locally

```bash
# 1. Clone the repo
git clone https://github.com/nitin864/stellar-trajectory.git
cd stellar-trajectory

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`) in a browser that has the
Freighter extension installed and set to **Test Net**.

### Using the app

1. Click **Connect Freighter** and approve the connection in the extension popup.
2. If your account is new, click **Fund via Friendbot** to receive 10,000 test XLM.
3. Your balance appears automatically and can be refreshed at any time.
4. Enter a destination address (starts with `G…`, 56 characters) and an amount, then click
   **Send XLM**.
5. Watch the **Mission log** for the outcome — a success entry links straight to the
   transaction on stellar.expert; a failure entry explains what went wrong.

### Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  lib/stellar.js          Wallet connection + Horizon/Friendbot/payment helpers
  components/
    Starfield.jsx          Ambient background canvas
    TrajectoryCard.jsx      Send form + the source→destination course visual
    MissionLog.jsx          Transaction/event feedback list
  App.jsx                  App state, wiring, and layout
  index.css                Design system (colors, type, layout)
```

## Error handling notes

- Freighter not installed → clear message pointing to freighter.app
- Wallet permission denied → surfaced in the Mission log
- Invalid destination address or non-positive amount → caught before submission
- Unfunded testnet account → balance panel shows "Unfunded on testnet" with a Friendbot shortcut
- Failed transaction submission (e.g. insufficient balance) → Horizon's operation result codes
  are surfaced in the log entry

 

## Notes

- This project is for **Testnet only**. Do not send mainnet funds to any address generated
  or used here.
- Freighter has no programmatic "disconnect" call — disconnecting in this app clears the
  locally held address so the UI returns to its signed-out state; the site's permission can
  also be revoked from within the Freighter extension itself.
