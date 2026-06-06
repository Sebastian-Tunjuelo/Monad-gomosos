# Monad Session Arena

> **1 signature → infinite actions · zero popups**

Session key infrastructure for high-frequency on-chain apps on Monad.

[![Tests](https://img.shields.io/badge/tests-25%2F25%20passing-brightgreen)](#testing)
[![Foundry](https://img.shields.io/badge/foundry-v1.7.1-blue)](#contracts)
[![Solidity](https://img.shields.io/badge/solidity-0.8.26-blue)](#contracts)
[![Network](https://img.shields.io/badge/network-Monad%20Testnet-purple)](#contracts)

---

## What it does

Monad Session Arena solves the biggest UX problem in high-frequency dApps: **signing every action with your main wallet**.

The user signs **once** to create a temporary session key with strict permissions. After that, the session key executes all actions on-chain via a relayer — no wallet popups, no friction.

```
User signs once (EIP-712)
  → Session key generated locally (ephemeral, never leaves browser)
  → Actions signed by session key
  → Relayer submits to Monad
  → SessionManager validates: sig · nonce · expiry · permissions · spend limit
  → Action executes on DemoGame or DemoSocial
  → Revoke anytime — one tx kills the key permanently
```

### Why Monad?

On a slow chain, 30 on-chain actions per game session is impractical. On Monad, the full session costs **less than $0.001 in gas**. Session keys make Monad's throughput *usable*.

---

## Live Demo Tabs

The frontend has **6 tabs**, each demonstrating a different aspect:

| Tab | What it shows |
|---|---|
| 🎮 **Game** | On-chain game — MOVE, ATTACK, COLLECT, BUY_ITEM without wallet popups + Monad Speed Test |
| 📢 **Social** | On-chain social feed — POST, LIKE, FOLLOW, REPOST using the same SessionManager |
| 🔍 **Explorer** | Real-time on-chain events: SessionCreated, ActionExecuted, SessionRevoked |
| 🏆 **Leaderboard** | Live rankings read directly from contract state, no database |
| 🛡 **Security** | Interactive threat model: simulate 6 attack vectors, prove each is blocked on-chain + Gas analysis |
| 🏗 **Architecture** | Full system diagram, security guarantees, "One Kit — Infinite Apps" |

---

## Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.26 + Foundry |
| Signatures | EIP-712 |
| Backend | TypeScript + Express + Viem |
| Database | SQLite |
| Frontend | React + Vite + Wagmi + Tailwind CSS |
| Package manager | pnpm workspaces |
| Testing | Foundry unit + fuzz + invariant tests |

---

## Contracts (Monad Testnet — chain 10143)

| Contract | Description | Address |
|---|---|---|
| `SessionManager` | Core: create sessions, validate permissions, execute actions, revoke | [`0xeC499f99c9Fbf6C6699110634b486B1c01538312`](https://monadvision.com/address/0xeC499f99c9Fbf6C6699110634b486B1c01538312) |
| `DemoGame` | Gaming app: MOVE · ATTACK · COLLECT · BUY_ITEM | [`0x18D73Ae1Fff59bBD0D362d9273A2E12aFB92EB25`](https://monadvision.com/address/0x18D73Ae1Fff59bBD0D362d9273A2E12aFB92EB25) |
| `DemoSocial` | Social app: POST · LIKE · FOLLOW · REPOST | [`0x572E98C1E7056EF173f2CA9ea86E2c9901961B2A`](https://monadvision.com/address/0x572E98C1E7056EF173f2CA9ea86E2c9901961B2A) |
| `GameToken` | ERC-20 mock `ARENA` with faucet | [`0xBE62364FCaD5eC0681cD2baBF95350fE2336F17C`](https://monadvision.com/address/0xBE62364FCaD5eC0681cD2baBF95350fE2336F17C) |
| `SessionTypes` | Shared structs | — |
| `SessionEIP712` | EIP-712 hashing | — |
| `SessionErrors` | Custom errors | — |
| `SessionEvents` | On-chain events | — |

---

## Testing

**25/25 tests passing.**

```bash
pnpm test:contracts          # run all tests
pnpm test:contracts:verbose  # with traces
pnpm gas                     # gas report
```

| Suite | Tests | Coverage |
|---|---:|---|
| Unit tests | 12 | Core session lifecycle |
| Fuzz tests | 7 | 256 runs each — nonce, expiry, actions, spend, signatures |
| Invariant tests | 6 | 256 runs × 128,000 calls each |
| **Total** | **25** | **All passing ✅** |

### Security invariants verified (128,000 calls each):
- `callCount` never exceeds `maxCalls`
- `tokenSpent` never exceeds `maxTokenSpend`
- Nonce is monotonically increasing (no replay possible)
- Revocation is irreversible
- Revoked sessions cannot execute further actions
- On-chain state matches handler tracking exactly

### Gas report (from `forge test --gas-report`):

| Function | Avg gas |
|---|---:|
| `createSession` | 162,217 |
| `executeAction` (median) | 40,633 |
| `revokeSession` | 58,251 |

---

## Project Structure

```
apps/
  frontend/          React + Vite demo (6 tabs)
  relayer/           Express relayer + SQLite

packages/
  contracts/         Solidity contracts + Foundry tests
    src/
      SessionManager.sol
      SessionTypes.sol
      SessionEIP712.sol
      SessionErrors.sol
      SessionEvents.sol
      demo/
        DemoGame.sol
        DemoSocial.sol
      token/
        GameToken.sol
    test/
      unit/
      fuzz/
      invariant/
    script/
      Deploy.s.sol
  sdk/               TypeScript SDK (EIP-712, session key, relayer client)
  shared/            Shared types and ABIs

reports/
  deploy-10143.json  Monad testnet contract addresses
  gas-report.md      Gas analysis from Foundry
```

---

## Relayer API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check with RPC latency, block number, all contract addresses |
| POST | `/sessions/register` | Create session on-chain via relayer |
| POST | `/sessions/execute` | Execute action with session key signature |
| POST | `/sessions/revoke` | Revoke session in relayer DB |
| GET | `/sessions/:id/nonce` | Get current on-chain nonce |
| GET | `/sessions/:id/dashboard` | Session stats + action history |
| GET | `/social/feed` | Recent posts from DemoSocial |
| GET | `/social/stats/:address` | User social stats |
| GET | `/social/live-events` | Recent on-chain events (SessionCreated, ActionExecuted, SessionRevoked) |
| GET | `/social/leaderboard` | Live rankings from contract state |

---

## Running the Project

### Prerequisites

- Node.js 18+
- pnpm 9 (`npm i -g pnpm@9`)
- A wallet with testnet MON — get it at [faucet.monad.xyz](https://faucet.monad.xyz)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Build the SDK

```bash
pnpm --filter @monad-session-arena/sdk build
```

### 3. Configure environment

The `.env` files are already populated with the deployed contract addresses on Monad testnet.
Copy your relayer private key into both files:

```bash
# apps/relayer/.env
RELAYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# .env (root)
RELAYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

The rest of the values are pre-configured:
- Chain: Monad testnet (10143)
- RPC: `https://testnet-rpc.monad.xyz`
- Contracts: already deployed (see addresses above)

### 4. Start the relayer

```bash
# Terminal 1
pnpm dev:relayer
```

Verify: `curl http://localhost:3001/health`

### 5. Start the frontend

```bash
# Terminal 2
pnpm dev:frontend
```

Open: **http://localhost:5173**

### 6. Configure wallet (MetaMask / Brave)

Add Monad Testnet:
- RPC URL: `https://testnet-rpc.monad.xyz`
- Chain ID: `10143`
- Currency symbol: `MON`
- Block explorer: `https://monadvision.com`

Get testnet MON at [faucet.monad.xyz](https://faucet.monad.xyz).

---

## Redeploying Contracts

If you need to redeploy the contracts (requires Foundry in WSL):

```bash
# 1. Set your deployer key in .env
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# 2. Deploy to Monad testnet
pnpm deploy:monad

# 3. Verify on all block explorers (MonadVision, Socialscan, Monadscan)
pnpm verify:monad
```

`deploy:monad` automatically updates `.env` files with the new addresses via `setup-local.js`.

> **Gas note:** On Monad, `gas_paid = gas_limit × price_per_gas` (not gas used). The relayer uses tight gas estimates (+10% buffer) to minimize costs.

---

## Block Explorers

| Explorer | URL |
|---|---|
| MonadVision | https://monadvision.com |
| Socialscan | https://monad-testnet.socialscan.io |
| Monadscan | https://testnet.monadscan.com |

---

## Demo Flow (3-4 minutes)

```
1. Connect wallet to Monad Testnet
2. Faucet & Approve ARENA (2 txs — only time you touch the wallet for tokens)
3. Approve Session — sign ONCE with EIP-712
4. Play: MOVE, ATTACK, COLLECT — zero wallet popups
5. Buy Item with ARENA — spend limit enforced on-chain
6. Speed Test — fire 5 actions automatically
7. Switch to Social tab — POST and LIKE on-chain, same session infrastructure
8. Switch to Explorer tab — watch real-time events
9. Switch to Security tab — simulate attack vectors, prove contract blocks them
10. Revoke Session — one tx
11. Try any action — contract rejects with SessionRevoked
12. Leaderboard updates with your score
```

---

## Security

All security is enforced **at the contract level**, not the frontend or relayer.

| Attack | Defense | Solidity |
|---|---|---|
| Replay attack | Sequential nonce | `if (state.nonce != action.nonce) revert InvalidNonce()` |
| Post-revocation execution | Revocation flag | `if (state.revoked) revert SessionRevoked()` |
| Cross-chain replay | EIP-712 domain with chainId | `chainId + verifyingContract in domain` |
| Forged signature | ECDSA recovery | `if (signer != policy.sessionKey) revert InvalidSignature()` |
| Spend overflow | Cumulative spend check | `if (tokenSpent + cost > maxTokenSpend) revert SpendLimitExceeded()` |
| Expired session | Timestamp check | `if (block.timestamp > validUntil) revert SessionExpired()` |

---

## Key Design Decisions

**One interface, infinite apps** — Any contract implementing `IDemoGame.executeAction(address, uint16, bytes)` can be a session target. DemoGame and DemoSocial both plug into the same SessionManager without any changes to the core.

**No global hot storage** — Each session has its own storage slot, enabling parallel execution on Monad without contention.

**EIP-712 everywhere** — Both session grants (owner signs) and session actions (session key signs) use EIP-712 typed data. Domain includes `chainId` and `verifyingContract` to prevent cross-chain and cross-contract replay.

**Relayer is untrusted** — The relayer can censor or reorder, but cannot forge signatures, bypass spend limits, or execute after revocation. All critical validation happens on-chain.

---

## Development Phases

| Phase | What was built |
|---|---|
| **Phase 1 — Core Infrastructure** | Project structure, Foundry setup, SessionTypes, SessionErrors, SessionEvents, SessionEIP712, SessionManager base |
| **Phase 2 — Session Execution** | executeAction, DemoGame, nonce replay protection, EIP-712 signature validation |
| **Phase 3 — Backend & SDK** | Relayer (Express), SDK (TypeScript), SQLite persistence, dashboard API |
| **Phase 4 — Token & Frontend** | GameToken ERC-20, spend limit, BUY_ITEM action, frontend integration, EIP-712 bug fixes |
| **Phase 5 — Testing & Security** | Fuzz tests (7), invariant tests (6), gas report, logger, rate limiting, Dashboard improvements, ArchitecturePanel |
| **Phase 6 — Social & UX** | DemoSocial contract, Live Explorer, StatsBar, AutoPlay stress test, SecurityRejection overlay, SessionKeyBadge, Leaderboard, ThreatModel, GasComparison, 6-tab UI |

---

## License

MIT
