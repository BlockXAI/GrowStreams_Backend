# GrowStreams V2 — Money Streaming Protocol on Vara

> **The money streaming protocol on Vara — stream tokens by the second for any use case.**

GrowStreams V2 is a generalized, token-agnostic money streaming infrastructure built on [Vara Network](https://vara.network). It enables continuous, per-second token flows for payroll, bounties, subscriptions, grants, revenue sharing, and any programmable payment use case.

---

## Deployed Contracts (Vara Testnet)

| Contract | Program ID |
|---|---|
| **StreamCore** | `0xf8e1e0ab…c2ea249` |
| **TokenVault** | `0x25e433af…997d3e` |
| **SplitsRouter** | `0xe4fe5916…88b894` |
| **PermissionManager** | `0x6cce6602…9f88cb` |
| **BountyAdapter** | `0xd5377611…268f81` |
| **IdentityRegistry** | `0xb6389d1d…9d948a` |

| Detail | Value |
|---|---|
| **Network** | Vara Testnet (`wss://testnet.vara.network`) |
| **Deployed** | 23 Feb 2026 |
| **Admin** | `kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA` |
| **E2E Tests** | 53/53 passing |
| **Explorer** | [idea.gear-tech.io/programs](https://idea.gear-tech.io/programs?node=wss://testnet.vara.network) |

<details>
<summary>Full Program IDs</summary>

- **StreamCore:** `0xf8e1e0ab81434b94357c1203b681206931c2e30ef350c0aac8fcfac45c2ea249`
- **TokenVault:** `0x25e433af499bd4428c8bf9b190722e8f9b66339d08df3d7b84bc31565d997d3e`
- **SplitsRouter:** `0xe4fe59166d824a0f710488b02e039f3fe94980756e3571fc93ba083b5b88b894`
- **PermissionManager:** `0x6cce66023765a57cbc6adf5dfe7df66ee636af56ab7d92a8f614bd8c229f88cb`
- **BountyAdapter:** `0xd5377611a285d3efcbe9369361647d13f3a9c60ed70d648eaa21c08c72268f81`
- **IdentityRegistry:** `0xb6389d1da594b84a73f3a5178caa25ff56ec0f57f2f8a9d42f8b1b6fba9d948a`
</details>

---

## E2E Test Results — 53/53 Pass

All contract functions verified on Vara testnet with real transactions:

| Contract | Tests | Status |
|---|---|---|
| **StreamCore** | 11 tests (create, pause, resume, deposit, update, stop, queries) | 11/11 |
| **TokenVault** | 8 tests (deposit, withdraw, pause, unpause, balance, allocation) | 8/8 |
| **SplitsRouter** | 10 tests (create group, update, preview, distribute, delete) | 10/10 |
| **PermissionManager** | 8 tests (grant, check, revoke, revoke-all, queries) | 8/8 |
| **BountyAdapter** | 10 tests (create, claim, verify, adjust, complete, cancel) | 10/10 |
| **IdentityRegistry** | 6 tests (bind, lookup, update score, revoke) | 6/6 |

---

## Why Money Streaming?

Traditional payments are batch-based: monthly salaries, milestone invoices, periodic distributions. Money streaming replaces discrete transfers with **continuous flows** — tokens accrue to the receiver every second and can be withdrawn at any time.

```
Traditional:    ████████░░░░░░░░░░░░████████░░░░░░░░░░░░████████
                 Month 1               Month 2               Month 3

Streaming:      ▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░
                 Every second, continuously
```

- **Instant cancellation** — stop paying the moment work stops
- **Real-time earnings** — no more "when does payroll land?"
- **Composable** — streams can be split, routed, and programmatically controlled
- **Capital efficient** — deposit a buffer, not the full amount upfront

---

## Why Vara?

[Vara Network](https://vara.network) is a high-performance application platform with:

- **Near-instant finality** — per-second settlement that actually works
- **Massive parallel compute** — actor model with isolated states
- **WASM VM + Rust** — battle-tested Gear execution engine
- **Consumer-grade hardware** — decentralized validators on standard machines

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Bounties  │ │ Payroll  │ │ Subscript │ │ Grants   │ │ Revenue │ │
│  │ (AI gig)  │ │          │ │ ions      │ │          │ │ Splits  │ │
│  └─────┬─────┘ └────┬─────┘ └────┬──────┘ └────┬─────┘ └────┬────┘ │
│        └─────────────┴────────────┴──────────────┴────────────┘      │
│                               │                                      │
│                     ┌─────────▼──────────┐                           │
│                     │   App Adapters     │                           │
│                     │ (BountyAdapter,    │                           │
│                     │  PayrollAdapter…)  │                           │
│                     └─────────┬──────────┘                           │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────┐
│                        PROTOCOL LAYER                                │
│  ┌────────────────┐  ┌───────▼────────┐  ┌────────────────────────┐ │
│  │  TokenVault    │  │  StreamCore    │  │  PermissionManager     │ │
│  │  - deposits    │◄─┤  - flowRate    │──┤  - delegates           │ │
│  │  - buffers     │  │  - start/stop  │  │  - roles               │ │
│  │  - ERC-20 ops  │  │  - accounting  │  │  - app permissions     │ │
│  │  - pause       │  │  - liquidation │  └────────────────────────┘ │
│  └────────────────┘  └───────┬────────┘                              │
│                              │                                       │
│                     ┌────────▼────────┐                              │
│                     │  SplitsRouter   │                              │
│                     │  - weighted %   │                              │
│                     │  - one-to-many  │                              │
│                     │  - dist. pools  │                              │
│                     └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────┐
│                     VARA NETWORK                                     │
│  Actor model · WASM VM · Near-instant finality · Gear Sails         │
└──────────────────────────────────────────────────────────────────────┘
```

### Contract API

#### StreamCore — StreamService

| Method | Type | Signature |
|---|---|---|
| `CreateStream` | command | `(receiver, token, flow_rate, initial_deposit) → u64` |
| `UpdateStream` | command | `(stream_id, new_flow_rate) → ()` |
| `StopStream` | command | `(stream_id) → ()` |
| `PauseStream` | command | `(stream_id) → ()` |
| `ResumeStream` | command | `(stream_id) → ()` |
| `Deposit` | command | `(stream_id, amount) → ()` |
| `Withdraw` | command | `(stream_id) → u128` |
| `GetStream` | query | `(stream_id) → Option<Stream>` |
| `GetWithdrawableBalance` | query | `(stream_id) → u128` |
| `GetRemainingBuffer` | query | `(stream_id) → u128` |
| `GetSenderStreams` | query | `(sender) → Vec<u64>` |
| `GetReceiverStreams` | query | `(receiver) → Vec<u64>` |
| `TotalStreams` | query | `() → u64` |
| `ActiveStreams` | query | `() → u64` |
| `GetConfig` | query | `() → Config` |

#### TokenVault — VaultService

| Method | Type | Signature |
|---|---|---|
| `DepositTokens` | command | `(token, amount) → ()` |
| `WithdrawTokens` | command | `(token, amount) → ()` |
| `AllocateToStream` | command | `(owner, token, amount, stream_id) → ()` |
| `ReleaseFromStream` | command | `(owner, token, amount, stream_id) → ()` |
| `TransferToReceiver` | command | `(token, receiver, amount, stream_id) → ()` |
| `EmergencyPause` | command | `() → ()` |
| `EmergencyUnpause` | command | `() → ()` |
| `SetStreamCore` | command | `(stream_core) → ()` |
| `GetBalance` | query | `(owner, token) → VaultBalance` |
| `GetStreamAllocation` | query | `(stream_id) → u128` |
| `IsPaused` | query | `() → bool` |
| `GetConfig` | query | `() → VaultConfig` |

---

## Use Cases

| Use Case | How It Works |
|---|---|
| **Bounties & Gigs** | AI-verified work triggers a stream; adjust rate based on quality score; stop on completion. |
| **Streaming Payroll** | Per-second salary with pause/resume and clawback rules. |
| **Subscriptions** | Pay-as-you-use; instant cancellation; no overpaying. |
| **Revenue Sharing** | Route incoming funds to teams, contributors, and referrers by weight. |
| **Vesting** | Linear token unlock with optional stoppability. |
| **Grants** | Milestone-gated streams; transparent runway visible on-chain. |
| **API Metering** | Pay per request or compute-second. |
| **Gaming** | Real-time rewards; battle-pass style continuous payouts. |
| **Donations / Patronage** | Creator support via recurring streams and splits. |

---

## Project Structure

```
growstreams-v2/
├── contracts/                 # Vara/Gear smart contracts (Rust + Sails)
│   ├── stream-core/           # Core streaming state machine
│   ├── token-vault/           # Deposit & buffer management
│   ├── splits-router/         # Weighted fund distribution
│   ├── permission-manager/    # Delegation & roles
│   ├── adapters/
│   │   └── bounty-adapter/    # AI scoring → stream trigger
│   └── identity-registry/     # GitHub identity binding (V1)
├── api/                       # REST API backend (Express + sails-js)
│   ├── src/
│   │   ├── index.mjs          # Express entry point
│   │   ├── sails-client.mjs   # Sails IDL parser + contract instances
│   │   └── routes/            # Route handlers for all 6 contracts
│   ├── idl/                   # Bundled IDL files for deployment
│   ├── railway.json           # Railway deployment config
│   └── Procfile
├── sdk/                       # TypeScript SDK (@growstreams/sdk)
│   ├── src/
│   │   ├── client.ts          # GrowStreams client class
│   │   ├── types.ts           # Type definitions
│   │   └── index.ts           # Package entry
│   └── dist/                  # Compiled JS + type declarations
├── artifacts/                 # Compiled .opt.wasm files
├── scripts/
│   ├── build.sh               # Build contracts to WASM
│   └── deploy-js/
│       ├── deploy.mjs         # Deploy to Vara testnet
│       └── e2e-test.mjs       # Full E2E test suite (53 tests)
├── docs/                      # Technical documentation
├── deploy-state.json          # Deployed program IDs
├── PLAN.md                    # Execution plan
└── README.md
```

---

## How Streams Work

### Creating a Stream
```
Sender deposits tokens → sets flowRate (tokens/sec) → receiver balance accrues in real-time
```

### Buffer / Solvency Model
Every stream requires a **buffer deposit** proportional to the flow rate. If the buffer runs dry, the stream is auto-paused (liquidated). This ensures receivers are never owed tokens that don't exist.

```
Buffer = flowRate × minBufferDuration (default: 3600s)
```

### Withdrawing
Receivers can withdraw their accrued balance **at any time** — no lock-ups, no waiting periods.

### Updating / Stopping
Senders can update the flow rate or stop the stream instantly. Remaining buffer is returned to the sender.

---

## Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| Rust | stable + `wasm32-unknown-unknown` target |
| `rust-src` | `rustup component add rust-src` |
| Node.js | 18+ |

### Build

```bash
./scripts/build.sh
```

Outputs optimized `.opt.wasm` files to `artifacts/`.

### Deploy

```bash
cp .env.example .env
# Edit .env with your seed phrase
cd scripts/deploy-js
npm install
node deploy.mjs
```

### Run E2E Tests

```bash
cd scripts/deploy-js
node e2e-test.mjs
```

### Start the REST API

```bash
cd api
npm install
cp .env.example .env   # edit with your seed / contract IDs
npm run dev
# → http://localhost:3000
```

The API auto-loads program IDs from `deploy-state.json`. Environment variables override if set.

### REST API — Key Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Node status, balance, all contract IDs |
| `/api/streams/config` | GET | Admin, buffer config, next stream ID |
| `/api/streams/:id` | GET | Full stream data |
| `/api/streams` | POST | Create a new stream |
| `/api/streams/:id/pause` | POST | Pause an active stream |
| `/api/vault/balance/:owner/:token` | GET | Vault balance for an address |
| `/api/splits/:id/preview/:amount` | GET | Preview distribution shares |
| `/api/bounty/open` | GET | List all open bounties |
| `/api/identity/github/:username` | GET | Look up actor by GitHub handle |

All POST routes accept `{ "mode": "payload" }` to return an encoded payload for **client-side wallet signing** instead of server-side execution.

Full endpoint list: `GET /`

### TypeScript SDK

```bash
cd sdk && npm install && npm run build
```

```typescript
import { GrowStreams } from '@growstreams/sdk';

const gs = new GrowStreams({ baseUrl: 'https://your-api.railway.app' });

// Check protocol health
const health = await gs.health();
console.log(health.contracts);

// Query a stream
const stream = await gs.streams.get(1);
console.log(stream.flow_rate, stream.status);

// Create a stream (server-signed)
const tx = await gs.streams.create({
  receiver: '0x0001...',
  token: '0x0000...',
  flowRate: '1000',
  initialDeposit: '5000000',
});
console.log('Block:', tx.blockHash);

// Get encoded payload for wallet signing
const { payload } = await gs.streams.create({
  receiver: '0x0001...',
  token: '0x0000...',
  flowRate: '1000',
  initialDeposit: '5000000',
  mode: 'payload',
});
// → sign `payload` with user wallet and submit to Vara

// Bounties
const bounty = await gs.bounty.get(1);
const open = await gs.bounty.open();

// Identity
const binding = await gs.identity.byGithub('octocat');
```

---

## V1 → V2 Evolution

| Aspect | V1 (Shipped) | V2 (Deployed) |
|---|---|---|
| **Positioning** | Creator challenge platform + GitHub scoring | Money streaming protocol + infra |
| **Core product** | AI-scored Web3 contributions, NFT badges, leaderboard | Generalized per-second token streams |
| **Contracts** | Identity Registry (GitHub binding + scores on Vara) | StreamCore + TokenVault (live on testnet) |
| **Tokens** | Achievement NFTs | USDC, VARA, any fungible token |
| **AI role** | The product (scoring engine) | One app among many (bounty verification trigger) |
| **Blockchain** | Vara Network (Polkadot parachain) + Camp Network | Vara Network Testnet |
| **Frontend** | Challenge/leaderboard app | Infra website + protocol explainer + demo app |
| **SDK** | REST API endpoints | TypeScript SDK for stream operations |
| **Integrations** | Reclaim Protocol (ZK GitHub proofs) | Carried forward + new app adapters |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Smart Contracts** | Rust + [Gear Sails 0.6](https://github.com/gear-tech/sails) (WASM actors) |
| **Build** | `gear-wasm-builder` → optimized `.opt.wasm` |
| **Deploy/Test** | Node.js + `@gear-js/api` v0.44.2 |
| **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui |
| **Blockchain** | Vara Network (`wss://testnet.vara.network`) |
| **Wallet Support** | MetaMask, Polkadot.js, SubWallet |
| **Verification** | Reclaim Protocol (ZK proofs), AI scoring engine (V1) |

---

## Links

- **Vara Network:** https://vara.network
- **Gear Sails:** https://github.com/gear-tech/sails
- **Gear IDEA (Explorer):** https://idea.gear-tech.io/programs?node=wss://testnet.vara.network
- **V1 Repo:** https://github.com/Satyam-10124/Vara-_Github_MVP

---

## Revenue Model

GrowStreams is designed as open protocol infrastructure with sustainable revenue streams:

| Revenue Source | Mechanism |
|---|---|
| **Protocol Fee** | Small % fee on every stream (configurable by governance, initially 0.1–0.5%) |
| **Premium API Tiers** | Free tier for reads; paid tiers for higher throughput, webhooks, and analytics |
| **Hosted SDK** | Managed API hosting for teams that don't want to run their own node |
| **Adapter Marketplace** | Revenue share from third-party adapters built on the protocol |
| **Enterprise Deployments** | Custom contract deployments with SLA guarantees |

The protocol fee is collected at the contract level during stream settlement, making it trustless and transparent.

---

## Success Metrics

| Metric | Target (M1) | Current |
|---|---|---|
| Contracts deployed | 6 | 6/6 |
| E2E tests passing | 100% | 53/53 (100%) |
| REST API endpoints | 40+ | 40+ (all contracts) |
| TypeScript SDK | Published | Built, ready to publish |
| Streams created on testnet | 100+ | 6+ (testing) |
| Active streams | 20+ concurrent | 1 |
| Time-to-first-stream (dev) | < 10 minutes | Ready (SDK + API) |

---

## License

MIT

---

**Built by the GrowStreams team — shipping money streaming infrastructure on Vara.**
