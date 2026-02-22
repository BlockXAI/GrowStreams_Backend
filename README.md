# GrowStreams V2 — Money Streaming Protocol on Vara

> **The money streaming protocol on Vara — stream USDC by the second for any use case.**

GrowStreams V2 is a generalized, token-agnostic money streaming infrastructure built on [Vara Network](https://vara.network) and [Vara.eth](https://eth.vara.network). It enables continuous, per-second token flows for payroll, bounties, subscriptions, grants, revenue sharing, and any programmable payment use case.

---

## Why Money Streaming?

Traditional payments are batch-based: monthly salaries, milestone invoices, periodic distributions. Money streaming replaces discrete transfers with **continuous flows** — tokens accrue to the receiver every second and can be withdrawn at any time.

```
Traditional:    ████████░░░░░░░░░░░░████████░░░░░░░░░░░░████████
                 Month 1               Month 2               Month 3

Streaming:      ▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░▓▒░
                 Every second, continuously
```

**Benefits:**
- Instant cancellation — stop paying the moment work stops
- Real-time earnings visibility — no more "when does payroll land?"
- Composable — streams can be split, routed, and programmatically controlled
- Capital efficient — deposit a buffer, not the full amount upfront

---

## Why Vara?

[Vara.eth](https://eth.vara.network) is a high-performance application platform on top of Ethereum with:

- **Near-instant finality** — per-second settlement that actually works
- **Bridgeless Ethereum integration** — interact with ETH users and liquidity without bridging
- **Massive parallel compute** — actor model with isolated states, up to 1000x more compute than Ethereum mainnet
- **Reverse-gas model** — applications pay for execution; end users pay zero gas
- **WASM VM + Rust** — battle-tested Gear execution engine, developer-friendly tooling
- **Consumer-grade hardware** — decentralized validators on standard machines

This makes Vara the ideal runtime for per-second financial streams at scale.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Bounties  │ │ Payroll  │ │ Subscript │ │ Grants   │ │ Revenue │ │
│  │ (AI gig)  │ │          │ │ ions      │ │          │ │ Splits  │ │
│  └─────┬─────┘ └────┬─────┘ └────┬──────┘ └────┬─────┘ └────┬────┘ │
│        │             │            │              │            │      │
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
│                     VARA / VARA.ETH                                   │
│  Actor model · WASM VM · Near-instant finality · Bridgeless ETH      │
└──────────────────────────────────────────────────────────────────────┘
```

### Core Contracts

| Contract | Purpose |
|---|---|
| **StreamCore** | State + accounting for all streams (flowRate, start, lastUpdate, balances). Generic — not tied to any single app. |
| **TokenVault** | Deposit/buffer management, safe token handling (ERC-20 / fungible), emergency pause. |
| **SplitsRouter** | Weighted routing of incoming funds to N recipients. Enables revenue sharing and distribution pools. |
| **PermissionManager** | Delegate roles; allow apps to create/update streams on behalf of users. |
| **AppAdapters** | Thin contracts translating app events into StreamCore calls (e.g., `BountyAdapter`, `PayrollAdapter`). |

### Events (for indexing)

```
StreamCreated   { id, sender, receiver, token, flowRate, startTime }
StreamUpdated   { id, newFlowRate, updatedAt }
StreamStopped   { id, stoppedAt, finalBalance }
Withdrawn       { id, receiver, amount, timestamp }
Deposited       { sender, token, amount, newBuffer }
SplitsUpdated   { groupId, recipients[], weights[] }
```

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
│   ├── stream-core/           # Core streaming logic
│   ├── token-vault/           # Deposit & buffer management
│   ├── splits-router/         # Weighted distribution
│   ├── permission-manager/    # Delegation & roles
│   ├── adapters/              # App-specific adapters
│   │   ├── bounty-adapter/
│   │   └── payroll-adapter/
│   └── identity-registry/     # V1 GitHub identity (carried forward)
├── indexer/                   # Event indexer for real-time UI
├── sdk/                       # TypeScript SDK for integrators
├── frontend/                  # Next.js 15 website + demo app
│   ├── app/
│   │   ├── (marketing)/       # Home, Protocol, Use Cases, Ecosystem
│   │   ├── developers/        # SDK docs, quickstart, examples
│   │   └── app/               # Demo: create/manage/view streams
│   └── components/
├── docs/                      # Technical documentation
│   ├── protocol.md
│   ├── contracts-api.md
│   ├── sdk-quickstart.md
│   └── security.md
├── content/                   # Marketing & social content
│   └── twitter-plan.md
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
Buffer = flowRate × minBufferDuration
```

### Withdrawing
Receivers can withdraw their accrued balance **at any time** — no lock-ups, no waiting periods.

### Updating / Stopping
Senders can update the flow rate or stop the stream instantly. Remaining buffer is returned to the sender.

---

## Quick Start (for Developers)

### 1. Create a Stream (SDK — coming soon)
```typescript
import { GrowStreams } from '@growstreams/sdk';

const gs = new GrowStreams({ network: 'vara-testnet' });

// Create a stream: 100 USDC/month ≈ 0.0000386 USDC/sec
const stream = await gs.createStream({
  receiver: '0xReceiver...',
  token: 'USDC',
  flowRate: '38580', // micro-units per second
  buffer: '1000000', // 1 USDC buffer
});

console.log('Stream ID:', stream.id);
console.log('Status:', stream.status); // 'active'
```

### 2. Withdraw Accrued Balance
```typescript
const balance = await gs.getWithdrawableBalance(streamId);
await gs.withdraw(streamId);
```

### 3. Update or Stop
```typescript
await gs.updateStream(streamId, { flowRate: '77160' }); // double the rate
await gs.stopStream(streamId); // instant stop, buffer returned
```

---

## V1 → V2 Evolution

| Aspect | V1 (Shipped) | V2 (Building) |
|---|---|---|
| **Positioning** | Creator challenge platform + GitHub scoring | Money streaming protocol + infra |
| **Core product** | AI-scored Web3 contributions, NFT badges, leaderboard | Generalized per-second token streams |
| **Contracts** | Identity Registry (GitHub binding + scores on Vara) | StreamCore + TokenVault + SplitsRouter + PermissionManager |
| **Tokens** | Achievement NFTs | USDC, VARA, any fungible token |
| **AI role** | The product (scoring engine) | One app among many (bounty verification trigger) |
| **Blockchain** | Vara Network (Polkadot parachain) + Camp Network | Vara.eth (Ethereum L1 integration) + Vara Network |
| **Frontend** | Challenge/leaderboard app | Infra website + protocol explainer + demo app |
| **SDK** | REST API endpoints | TypeScript SDK for stream operations |
| **Integrations** | Reclaim Protocol (ZK GitHub proofs) | Carried forward + new app adapters |

---

## Tech Stack

- **Smart Contracts:** Rust + [Gear Sails framework](https://github.com/gear-tech/sails) (WASM actors on Vara)
- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion, shadcn/ui
- **SDK:** TypeScript, [@vara-eth/api](https://github.com/gear-tech/gear-js/tree/main/apis/vara-eth)
- **Indexer:** Custom event indexer (Rust or TypeScript)
- **Blockchain:** Vara Network + Vara.eth (bridgeless Ethereum integration)
- **Wallet Support:** MetaMask (via Vara.eth), Polkadot.js, SubWallet
- **Verification:** Reclaim Protocol (ZK proofs), AI scoring engine (carried from V1)

---

## Links

- **Vara Network:** https://vara.network
- **Vara.eth:** https://eth.vara.network
- **Vara.eth API:** https://github.com/gear-tech/gear-js/tree/main/apis/vara-eth
- **Gear Sails:** https://github.com/gear-tech/sails
- **V1 Repo:** https://github.com/Satyam-10124/Vara-_Github_MVP

---

## Success Metrics

| Metric | Target (M0–M1) |
|---|---|
| Streams created on testnet | 100+ |
| Active streams | 20+ concurrent |
| Total volume streamed | $10K+ equivalent |
| Time-to-first-stream (dev) | < 10 minutes |
| SDK downloads / repo stars | 50+ |
| Partner conversations | 5+ |
| Weekly Twitter impressions | 10K+ |

---

## License

MIT

---

**Built by the GrowStreams team — shipping money streaming infrastructure on Vara.**
