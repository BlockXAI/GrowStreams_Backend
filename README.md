# GrowStreams V2 — Money Streaming Protocol on Vara

> **The money streaming protocol on Vara — stream tokens by the second for any use case.**

GrowStreams V2 is a generalized, token-agnostic money streaming infrastructure built on [Vara Network](https://vara.network). It enables continuous, per-second token flows for payroll, bounties, subscriptions, grants, revenue sharing, and any programmable payment use case.

---

## Deployed Contracts (Vara Testnet)

| Contract | Program ID | Code ID |
|---|---|---|
| **StreamCore** | `0xf8e1e0ab…c2ea249` | `0x87ab0f16…56b9087` |
| **TokenVault** | `0x25e433af…997d3e` | `0x61c0a68a…026d2b6` |

| Detail | Value |
|---|---|
| **Network** | Vara Testnet (`wss://testnet.vara.network`) |
| **Deployed** | 23 Feb 2026 |
| **Admin** | `kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA` |
| **E2E Tests** | 21/21 passing |
| **Explorer** | [idea.gear-tech.io/programs](https://idea.gear-tech.io/programs?node=wss://testnet.vara.network) |

<details>
<summary>Full Program IDs</summary>

- **StreamCore:** `0xf8e1e0ab81434b94357c1203b681206931c2e30ef350c0aac8fcfac45c2ea249`
- **TokenVault:** `0x25e433af499bd4428c8bf9b190722e8f9b66339d08df3d7b84bc31565d997d3e`
</details>

---

## E2E Test Results

All contract functions verified on Vara testnet with real transactions:

### StreamCore — 11/11 Pass

| # | Test | Result |
|---|---|---|
| 1 | `GetConfig` — returns admin + buffer config | PASS |
| 2 | `TotalStreams` — reads current count | PASS |
| 3 | `CreateStream` — new stream, total increments | PASS |
| 4 | `GetStream` — returns full stream data | PASS |
| 5 | `ActiveStreams` — count increases after create | PASS |
| 6 | `PauseStream` — pauses active stream | PASS |
| 7 | `ResumeStream` — resumes paused stream | PASS |
| 8 | `Deposit` — adds buffer to active stream | PASS |
| 9 | `UpdateStream` — changes flow rate | PASS |
| 10 | `GetSenderStreams` — returns sender's stream IDs | PASS |
| 11 | `StopStream` — stops stream permanently | PASS |

### TokenVault — 8/8 Pass

| # | Test | Result |
|---|---|---|
| 12 | `GetConfig` — returns admin + pause state | PASS |
| 13 | `IsPaused` — reads pause state | PASS |
| 14 | `DepositTokens` — deposits to vault | PASS |
| 15 | `GetBalance` — returns balance after deposit | PASS |
| 16 | `EmergencyPause` — admin pauses vault | PASS |
| 17 | Deposit blocked while paused | PASS |
| 18 | `EmergencyUnpause` — admin unpauses vault | PASS |
| 19 | `GetStreamAllocation` — reads allocation | PASS |

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
│   ├── splits-router/         # Weighted distribution (planned)
│   ├── permission-manager/    # Delegation & roles (planned)
│   ├── adapters/              # App-specific adapters
│   │   └── bounty-adapter/    # AI scoring → stream trigger (planned)
│   └── identity-registry/     # V1 GitHub identity (carried forward)
├── artifacts/                 # Compiled .opt.wasm files
├── scripts/
│   ├── build.sh               # Build contracts to WASM
│   └── deploy-js/             # Node.js deploy + E2E test scripts
│       ├── deploy.mjs         # Deploy to Vara testnet
│       └── e2e-test.mjs       # Full E2E test suite (21 tests)
├── docs/                      # Technical documentation
│   ├── protocol.md
│   ├── contracts-api.md
│   ├── sdk-quickstart.md
│   └── security.md
├── content/                   # Marketing & social content
│   └── twitter-plan.md
├── deploy-state.json          # Deployed program IDs
├── .env.example               # Environment template (seed phrase, node URL)
├── PLAN.md                    # Execution plan & gap analysis
└── README.md                  # This file
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

### Create a Stream (SDK — coming soon)
```typescript
import { GrowStreams } from '@growstreams/sdk';

const gs = new GrowStreams({ network: 'vara-testnet' });

const stream = await gs.createStream({
  receiver: '0xReceiver...',
  token: 'USDC',
  flowRate: '38580',
  buffer: '1000000',
});

console.log('Stream ID:', stream.id);
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

## Success Metrics

| Metric | Target (M0–M1) | Current |
|---|---|---|
| Core contracts deployed | 2 (StreamCore + TokenVault) | 2 |
| E2E tests passing | 100% | 21/21 (100%) |
| Streams created on testnet | 100+ | 3+ (testing) |
| Active streams | 20+ concurrent | — |
| Total volume streamed | $10K+ equivalent | — |
| Time-to-first-stream (dev) | < 10 minutes | — |
| SDK downloads / repo stars | 50+ | — |

---

## License

MIT

---

**Built by the GrowStreams team — shipping money streaming infrastructure on Vara.**
