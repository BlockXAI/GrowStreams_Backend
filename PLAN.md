# GrowStreams V2 — Execution Plan & Gap Analysis

> Last updated: 23 Feb 2026 | Owner: Satyam

---

## 1. V1 → V2 Gap Analysis

### What V1 Already Delivered (Carry Forward)

| Component | Status | Details |
|---|---|---|
| **Identity Registry Contract** | ✅ Shipped | Vara contract binding GitHub identities to on-chain actor IDs with scores. IDL defined, events emitted. |
| **AI GitHub Scoring Engine** | ✅ Shipped | 0-100 scoring across impact, quality, collaboration, security. Tier system (Beginner → Elite). |
| **Reclaim Protocol Integration** | ✅ Shipped | ZK-proof GitHub ownership verification (QR code flow, cryptographic proof on Vara). |
| **Leaderboard + Scorecards** | ✅ Shipped | Real-time rankings, public profiles, shareable SVG badges, social sharing templates. |
| **Achievement NFTs (Vara)** | ✅ Shipped | Mint score as NFT badge on Vara Network, IPFS metadata via Pinata. |
| **Frontend (Next.js 15)** | ✅ Shipped | Creator platform + Web3 challenge UI. React 19, TailwindCSS, Framer Motion. |
| **Backend (Railway)** | ✅ Shipped | PostgreSQL + REST API, Next.js API routes for scoring/leaderboard/badges. |
| **Wallet Support** | ✅ Shipped | Polkadot.js, SubWallet, MetaMask. |

### What V2 Needs (New Build)

| Component | Priority | Status | Notes |
|---|---|---|---|
| **StreamCore Contract** | P0 | ✅ Deployed | Core streaming state machine. 15 service methods. Deployed to Vara testnet. 11/11 E2E tests pass. |
| **TokenVault Contract** | P0 | ✅ Deployed | Deposit/buffer management, emergency pause/unpause, stream allocations. 12 service methods. 8/8 E2E tests pass. |
| **Build & Deploy Pipeline** | P0 | ✅ Done | `build.sh` → `.opt.wasm` artifacts. `deploy.mjs` via `@gear-js/api`. `e2e-test.mjs` (21 tests). |
| **Technical Docs** | P0 | ✅ Done | Protocol spec, contract API reference, SDK quickstart, security model in `docs/`. |
| **Twitter Content Plan** | P0 | ✅ Drafted | 2-week schedule in `content/twitter-plan.md`. |
| **SplitsRouter Contract** | P1 | 🔴 Not started | Weighted one-to-many distribution. Interface designed in IDL. |
| **PermissionManager Contract** | P1 | 🔴 Not started | Delegate roles, app-level permissions for creating/updating streams on behalf of users. |
| **BountyAdapter Contract** | P1 | 🔴 Not started | Connects AI verification scores to stream creation/adjustment. Bridges V1 scoring → V2 streams. |
| **Event Indexer** | P0 | 🔴 Not started | Index StreamCreated/Updated/Stopped/Withdrawn events for real-time UI. |
| **TypeScript SDK** | P0 | 🔴 Not started | Developer-facing SDK wrapping contract interactions via @gear-js/api. |
| **V2 Website (Marketing)** | P0 | 🔴 Not started | New IA: Home, Protocol, Use Cases, Developers, Ecosystem, Demo. |
| **Demo App** | P0 | 🔴 Not started | Create/update/stop/withdraw streams in a web UI. |
| **Vara.eth Integration** | P1 | 🔴 Not started | Deploy contracts via Vara.eth for bridgeless Ethereum access. |

### What Changes (Reposition)

| From (V1) | To (V2) |
|---|---|
| "Zero-fee creator economy + Web3 contribution challenge" | "Money streaming protocol on Vara" |
| AI scoring IS the product | AI scoring is ONE APP that triggers streams |
| Achievement NFTs as primary output | Continuous token streams as primary output |
| Single-app mindset | Protocol + application layer mindset |
| Vara Network (Polkadot parachain) only | Vara Network + Vara.eth (Ethereum integration) |
| REST API for scores/badges | TypeScript SDK for stream operations |

---

## 2. V2 Product Requirements (MVP Scope)

### Must Have (Week 1)

1. **StreamCore contract** — create, update, stop a stream (sender → receiver, token, flowRate)
2. **TokenVault** — deposit/withdraw buffer, solvency checks, pause on buffer depletion
3. **Withdrawable balance** — receivers claim accrued tokens anytime
4. **USDC support** — first token; architecture supports adding more
5. **Event emission** — StreamCreated, StreamUpdated, StreamStopped, Withdrawn, Deposited
6. **Demo app** — web UI to create/manage/view streams
7. **V2 website** — at minimum: Home + Protocol + Use Cases pages
8. **README + docs** — enough for a developer to understand and integrate

### Should Have (Week 1-2)

9. **PermissionManager** — delegate stream management to apps
10. **BountyAdapter** — connect AI scoring to stream triggers
11. **Indexer** — real-time event processing for UI
12. **SDK v0.1** — TypeScript wrapper for core operations
13. **Developers page** — quickstart, code snippets, contract addresses
14. **Demo video** — 2-3 minute walkthrough

### Nice to Have (Week 2+)

15. **SplitsRouter** — weighted distribution to N recipients
16. **Distribution pools** — publisher → subscriber units (reward programs)
17. **Vara.eth deployment** — bridgeless Ethereum access
18. **Ecosystem/Partners page** — logos, integration CTA
19. **Advanced security** — formal invariant checks, threat model doc
20. **Additional tokens** — VARA, custom fungible tokens

---

## 3. Smart Contract Specifications

### 3.1 StreamCore

**State:**
```rust
struct Stream {
    id: StreamId,
    sender: ActorId,
    receiver: ActorId,
    token: ActorId,       // fungible token program ID
    flow_rate: u128,      // tokens per second (in smallest unit)
    start_time: u64,      // block timestamp when stream started
    last_update: u64,     // last time balances were settled
    deposited: u128,      // total deposited by sender
    withdrawn: u128,      // total withdrawn by receiver
    status: StreamStatus, // Active | Paused | Stopped
}

enum StreamStatus { Active, Paused, Stopped }
```

**Actions:**
```
CreateStream(receiver, token, flow_rate, initial_deposit) → StreamId
UpdateStream(stream_id, new_flow_rate) → ()
StopStream(stream_id) → ()
Withdraw(stream_id) → amount
Deposit(stream_id, amount) → ()
GetStream(stream_id) → Stream
GetWithdrawableBalance(stream_id) → u128
GetSenderStreams(sender) → Vec<StreamId>
GetReceiverStreams(receiver) → Vec<StreamId>
```

**Invariants:**
- `withdrawable_balance = flow_rate × (now - last_update) - withdrawn` (capped at deposited)
- Stream auto-pauses when `remaining_buffer < flow_rate × MIN_BUFFER_SECONDS`
- Only sender can update/stop; only receiver can withdraw
- Permissions can override sender restriction (via PermissionManager)

### 3.2 TokenVault

**Responsibilities:**
- Hold deposited tokens in escrow
- Track per-stream buffers
- Execute transfers on withdraw
- Emergency pause (admin-only)
- Liquidation: pause stream when buffer depleted

### 3.3 SplitsRouter (V2+)

**State:**
```rust
struct SplitGroup {
    id: GroupId,
    owner: ActorId,
    recipients: Vec<(ActorId, u32)>, // (address, weight)
    total_weight: u32,
}
```

**Actions:**
```
CreateSplitGroup(recipients, weights) → GroupId
UpdateSplitGroup(group_id, recipients, weights) → ()
DistributeToGroup(group_id, token, amount) → ()
```

### 3.4 IDL Design (StreamCore)

```idl
type Stream = struct {
  id: u64,
  sender: actor_id,
  receiver: actor_id,
  token: actor_id,
  flow_rate: u128,
  start_time: u64,
  last_update: u64,
  deposited: u128,
  withdrawn: u128,
  status: StreamStatus,
};

type StreamStatus = enum {
  Active,
  Paused,
  Stopped,
};

constructor {
  New : (admin: actor_id, min_buffer_seconds: u64);
};

service StreamService {
  CreateStream : (receiver: actor_id, token: actor_id, flow_rate: u128, initial_deposit: u128) -> result (u64, str);
  UpdateStream : (stream_id: u64, new_flow_rate: u128) -> result (null, str);
  StopStream : (stream_id: u64) -> result (null, str);
  Deposit : (stream_id: u64, amount: u128) -> result (null, str);
  Withdraw : (stream_id: u64) -> result (u128, str);

  query GetStream : (stream_id: u64) -> opt Stream;
  query GetWithdrawableBalance : (stream_id: u64) -> u128;
  query GetSenderStreams : (sender: actor_id) -> vec u64;
  query GetReceiverStreams : (receiver: actor_id) -> vec u64;
  query TotalStreams : () -> u64;
  query AdminAddress : () -> actor_id;

  events {
    StreamCreated: struct { id: u64, sender: actor_id, receiver: actor_id, token: actor_id, flow_rate: u128, start_time: u64 };
    StreamUpdated: struct { id: u64, old_flow_rate: u128, new_flow_rate: u128, updated_at: u64 };
    StreamStopped: struct { id: u64, stopped_at: u64, sender_refund: u128 };
    Withdrawn: struct { id: u64, receiver: actor_id, amount: u128, timestamp: u64 };
    Deposited: struct { id: u64, sender: actor_id, amount: u128, new_buffer: u128 };
    StreamLiquidated: struct { id: u64, liquidated_at: u64, reason: str };
  }
};
```

---

## 4. Frontend V2 — Information Architecture

### Pages

| # | Page | Purpose | Priority |
|---|---|---|---|
| 1 | **Home** | Hero + value prop + CTA (Build / Integrate / Try Demo) | P0 |
| 2 | **Protocol** | How streams work, diagrams, buffer/solvency model, supported tokens | P0 |
| 3 | **Use Cases** | Cards: bounties, payroll, subscriptions, revenue share, grants, API metering, gaming, donations | P0 |
| 4 | **Developers** | SDK quickstart, contract addresses, code examples, FAQs | P1 |
| 5 | **Ecosystem** | Partner logos, integration CTA, contact form | P2 |
| 6 | **Demo App** | Create/update/stop/withdraw streams, view history | P0 |

### UX Requirements

- **Per-second animations:** ticker counting up, flowing particle effects, balance counter
- **Buffer visualization:** clear gauge showing solvency status
- **"Integrate in 10 minutes" flow:** copy-pastable code, inline playground
- **Mobile-first responsive design**
- **Dark mode by default** (crypto-native aesthetic)

---

## 5. Execution Progress

### Phase 1 — Contracts & Infrastructure (COMPLETE)

| Task | Status | Details |
|---|---|---|
| Confirm V2 scope | ✅ Done | StreamCore + TokenVault + USDC (SplitsRouter = V2+) |
| Write README.md | ✅ Done | V2 positioning, architecture, deployment tables, API tables |
| Write PLAN.md | ✅ Done | Gap analysis, specs, progress tracking |
| Define contract IDL files | ✅ Done | All 5 contract IDLs created |
| Project scaffold | ✅ Done | `contracts/`, `docs/`, `scripts/`, `content/`, `artifacts/` |
| Implement StreamCore | ✅ Deployed | Rust + Sails 0.6, 15 methods, full stream lifecycle |
| Implement TokenVault | ✅ Deployed | Rust + Sails 0.6, 12 methods, deposit/pause/allocate |
| Build pipeline | ✅ Done | `build.sh` → gear-wasm-builder → `.opt.wasm` |
| Deploy pipeline | ✅ Done | `deploy.mjs` via `@gear-js/api` v0.44.2 |
| E2E test suite | ✅ Done | `e2e-test.mjs` — 21/21 tests passing on Vara testnet |
| Deploy to Vara testnet | ✅ Done | Both contracts live, program IDs in `deploy-state.json` |
| Technical docs | ✅ Done | `protocol.md`, `contracts-api.md`, `sdk-quickstart.md`, `security.md` |
| Twitter content plan | ✅ Drafted | 2-week schedule in `content/twitter-plan.md` |

### Phase 2 — Frontend & SDK (NEXT)

| Task | Status | Priority |
|---|---|---|
| Initialize Next.js 15 project | 🔴 Not started | P0 |
| Build Home page (hero, streaming animation) | 🔴 Not started | P0 |
| Build Protocol page (how it works, diagrams) | 🔴 Not started | P0 |
| Build Use Cases page (card grid) | 🔴 Not started | P0 |
| Build Demo App (connect wallet, create/manage streams) | 🔴 Not started | P0 |
| Integrate wallet connection (MetaMask + Polkadot.js) | 🔴 Not started | P0 |
| TypeScript SDK v0.1 | 🔴 Not started | P0 |
| Event indexer | 🔴 Not started | P0 |

### Phase 3 — QA + Launch

| Task | Status | Priority |
|---|---|---|
| Static analysis (clippy, cargo audit) | 🔴 Not started | P1 |
| Solvency invariant review | 🔴 Not started | P1 |
| Threat model document | 🔴 Not started | P1 |
| SplitsRouter contract | 🔴 Not started | P1 |
| PermissionManager contract | 🔴 Not started | P1 |
| BountyAdapter contract | 🔴 Not started | P1 |
| Demo video (2-3 min) | 🔴 Not started | P1 |
| Pitch deck update | 🔴 Not started | P2 |
| Vara.eth deployment | 🔴 Not started | P2 |

---

## 6. Twitter Content Plan (2-Week Schedule)

### Content Pillars (Rotate Daily)

| Pillar | Examples |
|---|---|
| **Education** | What is money streaming? Why per-second > monthly? Explain buffers/solvency. |
| **Product** | Demo clips, UI animations, "build in 10 min", new page reveals. |
| **Use Cases** | Payroll story, bounty story, subscription story — each as a mini-thread. |
| **Ecosystem** | Vara-native benefits, partner spotlights, co-marketing threads. |
| **Proof** | Testnet metrics, security updates, user quotes, repo activity. |

### Week 1 Schedule

| Day | Type | Content |
|---|---|---|
| Mon | Thread (6 tweets) | "Imagine getting paid every second..." (the launch thread from the brief) |
| Tue | Single tweet | Demo GIF: creating a stream in the UI |
| Wed | Education tweet | "What is a buffer in money streaming?" (visual explainer) |
| Thu | Use case tweet | "Streaming payroll: your team gets paid every second, not every 2 weeks" |
| Fri | Product tweet | "GrowStreams SDK: create a stream in 5 lines of code" (code screenshot) |
| Sat | Ecosystem tweet | "Why we're building on Vara.eth" (Vara benefits thread) |
| Sun | Proof tweet | Testnet stats: X streams created, Y volume streamed |

### Week 2 Schedule

| Day | Type | Content |
|---|---|---|
| Mon | Thread | Deep dive: How StreamCore works under the hood |
| Tue | Use case tweet | "AI-verified bounties → instant streaming payments" |
| Wed | Demo video | 2-min walkthrough: create → accrue → withdraw |
| Thu | Education tweet | "Money streaming vs. traditional payments" (comparison visual) |
| Fri | Partner tweet | Integration CTA: "Build on GrowStreams" |
| Sat | Use case tweet | "Revenue splits: route incoming funds to your team automatically" |
| Sun | Metrics tweet | Week 1 recap + community growth |

### Cadence Target
- **1 thread/week** (6-10 tweets)
- **3-5 standalone tweets/week**
- **1 demo video/week** (30-120 seconds)
- **Coordinate with Vara global for RT/amplify**

---

## 7. Success Metrics

### Protocol (M0-M1)

| Metric | Target | How to Measure |
|---|---|---|
| Streams created | 100+ | On-chain events |
| Active streams | 20+ concurrent | Indexer query |
| Total volume streamed | $10K+ eq. | Cumulative flow |
| Time-to-first-stream | < 10 min | SDK quickstart test |
| Contract uptime | 99.9% | Monitoring |

### Product (M0-M1)

| Metric | Target | How to Measure |
|---|---|---|
| Demo app DAU | 50+ | Analytics |
| SDK downloads | 50+ | npm stats |
| Repo stars | 50+ | GitHub |
| Dev docs page views | 500+ | Analytics |

### Community (M0-M1)

| Metric | Target | How to Measure |
|---|---|---|
| Twitter impressions/week | 10K+ | Twitter analytics |
| Follower growth | 500+ new | Twitter analytics |
| Partner conversations | 5+ | CRM/tracker |
| AMA attendance | 50+ | Platform metrics |

---

## 8. Deliverables Checklist (M0 — "Prove It First")

| # | Deliverable | Status |
|---|---|---|
| 1 | StreamCore deployed on Vara testnet + addresses documented | ✅ Done |
| 2 | TokenVault deployed + integrated with StreamCore | ✅ Done |
| 3 | E2E tests: create/update/stop/withdraw streams (21/21 pass) | ✅ Done |
| 4 | Technical docs (contract API, protocol flow, SDK quickstart) | ✅ Done |
| 5 | Content plan doc + 2-week schedule finalized | ✅ Done |
| 6 | Build + deploy pipeline (repeatable, scripted) | ✅ Done |
| 7 | V2 website live (new positioning + use cases + dev page) | 🔴 Not started |
| 8 | Demo app: create/update/stop/withdraw streams in web UI | 🔴 Not started |
| 9 | Demo video (2-3 minutes) | 🔴 Not started |
| 10 | Security review notes + "zero critical vuln" statement | 🔴 Not started |
| 11 | Identity Registry (V1) integrated as one app adapter | 🔴 Not started |
| 12 | SDK v0.1 published (npm or GitHub package) | 🔴 Not started |

---

## 9. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Vara.eth testnet instability | High | Fall back to Vara Network (Polkadot) for initial deployment; migrate later |
| Solvency edge cases in StreamCore | Critical | Formal invariant testing; conservative buffer requirements; pause mechanisms |
| Low initial traction | Medium | Coordinate Vara amplification; lead with demo video; focus on developer experience |
| SDK breaking changes (Vara.eth API) | Medium | Pin API versions; abstract behind our own SDK layer |
| Scope creep (SplitsRouter in week 1) | Medium | Strict P0/P1 prioritization; SplitsRouter is designed but not built in week 1 |

---

## 10. Deployed Contract Details

| Field | StreamCore | TokenVault |
|---|---|---|
| **Program ID** | `0xf8e1e0ab…c2ea249` | `0x25e433af…997d3e` |
| **Code ID** | `0x87ab0f16…56b9087` | `0x61c0a68a…026d2b6` |
| **Network** | Vara Testnet | Vara Testnet |
| **Node** | `wss://testnet.vara.network` | `wss://testnet.vara.network` |
| **Framework** | Sails-rs 0.6 + gstd 1.6 | Sails-rs 0.6 + gstd 1.6 |
| **WASM Size** | 62 KB (.opt.wasm) | 59 KB (.opt.wasm) |
| **Service Methods** | 15 (7 commands + 8 queries) | 12 (8 commands + 4 queries) |
| **E2E Tests** | 11/11 pass | 8/8 pass (+ 2 cross-checks) |
| **Admin** | `kGkLork3scX9…snYiZA` (deployer) | `kGkLork3scX9…snYiZA` (deployer) |

---

## 11. Open Decisions

| Decision | Options | Recommendation | Status |
|---|---|---|---|
| Deploy target | Vara Network vs Vara.eth testnet | Vara Network (deployed, working) | ✅ Decided |
| SplitsRouter in MVP? | Include vs defer | Defer build, design interface now | ✅ Decided |
| Token for MVP | USDC only vs USDC + VARA | Token-agnostic (ActorId-based); USDC first | ✅ Decided |
| Frontend framework | Next.js 15 (match V1) vs fresh | Next.js 15 (consistency, reuse V1 components) | ✅ Decided |
| Deploy tooling | gcli vs @gear-js/api | @gear-js/api v0.44.2 (gcli fails to compile) | ✅ Decided |
| WASM artifacts | Raw cargo output vs gear-wasm-builder | `.opt.wasm` from gear-wasm-builder (required for Gear runtime) | ✅ Decided |
| Indexer tech | Custom Rust vs TypeScript vs SubQuery | TypeScript (faster to build); migrate to Rust if needed | ⏳ Pending |
