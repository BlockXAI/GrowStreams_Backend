# GrowStreams — Canton Overview
**Version**: 1.0.0 (Canton Native)  
**Date**: March 2026  
**Branch**: `canton_native`  
**Funding Target**: Canton Dev Fund — Phase 1 ($70K)

---

## 1. What's Done

### Smart Contracts (Daml — Canton SDK 2.10.3)

**StreamCore.daml** — The heart of the system
- `StreamAgreement` template: per-second token accrual between two parties (sender → receiver)
- Accrual formula: `accrued = flowRate × secondsElapsed` (microsecond precision)
- `ObligationView` — non-consuming read-only query for real-time balance; no state change, no gas cost
- `LifecycleManager` choices on every stream:
  - `Withdraw` — receiver pulls earned tokens
  - `Pause` — sender freezes accrual (freezes `lastUpdate` at pause time)
  - `Resume` — sender unfreezes, accrual continues from where it stopped
  - `Stop` — permanently terminates stream, refunds remaining deposit to sender
  - `TopUp` — sender adds more deposit without resetting the accrual timer
  - `UpdateRate` — sender changes flow rate; resets `lastUpdate` so new rate applies cleanly from now
- `StreamFactory` — admin-controlled factory with auto-incrementing stream IDs
- `StreamProposal` — token-locked stream creation; receiver must accept, token gets archived into stream
- `GetStreamInfo` — multi-party non-consuming query (returns withdrawable, totalStreamed, status)

**GrowToken.daml** — Fungible GROW token
- `GrowToken` template: Transfer, Split, Merge, Burn
- `Allowance` template: ERC20-style delegated spending (Approve, TransferFrom, CancelAllowance)
- `Faucet` template: admin mints tokens (Mint, MintBatch) — for testnet use

**Authorization model**
- `StreamAgreement`: signatory = `sender`, observer = `receiver` + `admin`
- Sender controls: Pause, Resume, Stop, TopUp, UpdateRate
- Receiver controls: Withdraw, ObligationView, GetStreamInfo
- `StreamFactory`: signatory = `admin`, any whitelisted sender can call `CreateStream`

---

### Testing

| Test File | Tests | Status |
|-----------|-------|--------|
| StreamCoreTest.daml | 15 | ✅ 15/15 |
| GrowTokenTest.daml | 16 | ✅ 16/16 |
| UpdateRateTest.daml | 2 | ✅ 2/2 |
| **Total** | **33** | **✅ 33/33 (100%)** |

Coverage: 85.7% templates (6/7), 72.4% choices (21/29)

Tests cover: happy path, sequential withdrawals, stream depletion, pause/resume accrual continuity, TopUp without timer reset, UpdateRate timer reset, ObligationView non-consuming proof, token transfer chains, allowances, batch minting, edge cases (zero, negative, insufficient balance)

---

### Canton Deployment (Local Sandbox)

- Canton sandbox running on `localhost:6865`
- DAR uploaded: `growstreams-1.0.0.dar`
- Navigator UI running on `localhost:4000` (configured with `ui-backend.conf`)
- 22 parties allocated on ledger (Admin, Alice, Bob + test parties)
- Live contracts active, choices executable through Navigator
- `canton-config.conf` and `deploy-growstreams.canton` scripts in place

---

### Documentation & Evidence

```
evidence/
├── criterion-1-streaming-contract.md   ✅
├── criterion-2-accrual-formula.md      ✅
├── criterion-3-obligation-view.md      ✅
├── criterion-4-lifecycle-manager.md    ✅
├── criterion-5-testing.md              ✅
├── criterion-6-canton-deployment.md    ✅
├── test-output.log                     ✅ 33/33 passing
└── contract-ids.txt                    ✅ 22 parties

docs/phase1/
├── week1-2/   Foundation
├── week3-4/   Core Features
├── week5-7/   Streaming Engine
└── week8-10/  Deployment & Submission

scripts/demo/
├── 01-setup-testnet.daml
├── 02-create-stream-realtime.daml      uses passTime (real clock, not setTime)
└── 03-lifecycle-realtime.daml
```

**6/6 Phase 1 acceptance criteria met. 90% ready for submission (pending demo video).**

---

## 2. What's New in This Version on Canton

This is a full rewrite from the original Vara Network implementation. Not a port — a ground-up Canton-native rebuild.

### Obligation-First Architecture (new concept)
On Vara, the stream was transfer-first: tokens moved on every tick. On Canton, the stream is **obligation-first**: the agreement sits on-chain as a Daml contract. No tokens move until the receiver explicitly calls `Withdraw`. The obligation accrues continuously; settlement is on-demand. This is a fundamentally different and more efficient model.

### Daml UTXO Immutability (new)
Every state change (withdraw, pause, topup) archives the old contract and creates a new one. There is no mutable state. Every version of the stream is an immutable ledger event — full audit trail by default.

### ObligationView as Non-Consuming Query (new)
On Vara, checking your balance required a read call that could trigger state. On Canton, `ObligationView` is a `nonconsuming choice` — it reads state without touching it, no archival, no gas cost beyond the query itself. This is a Canton-native primitive that Vara didn't have.

### Multi-Party Authorization Model (new)
Vara used caller-based auth (msg.sender). Daml uses multi-party signatures: the `StreamAgreement` requires the sender's signature to exist, and choices are gated by explicit `controller` declarations. Authorization is enforced at the protocol level, not in application logic.

### Time Handling (changed)
Vara used `exec::block_timestamp()` — block time was implicit and injected. Daml/Canton requires time to be passed explicitly as a parameter (`currentTime : Time`). Tests use `setTime` for deterministic sandbox testing. Testnet demo scripts use `passTime` to wait on real wall-clock time. These are intentionally separate.

### StreamFactory with Auto-Increment IDs (new)
No equivalent existed on Vara. Factory pattern gives each stream a unique `streamId` and returns both the updated factory and the new stream contract as a tuple — necessary because Daml's immutable model requires the old factory to be archived.

### StreamProposal with Token Locking (new)
A two-step stream creation where the sender proposes with a token contract ID, and the receiver accepts — at which point the token is archived (locked) into the stream. This ties token custody directly to the stream lifecycle.

---

## 3. Value to Canton

### What GrowStreams adds to the Canton ecosystem

**A real-time payment primitive that Canton doesn't have natively.**

Canton has excellent infrastructure for institutional finance: privacy, compliance, multi-party workflows. What it lacks is a streaming payment layer — a way to express "pay X per second, continuously" as a first-class Daml pattern. GrowStreams fills that gap.

**Specifically:**

1. **Payroll on Canton** — Companies can stream salaries per-second instead of monthly batch transfers. An employee can withdraw at any time. If a company stops paying, the stream runs dry — no trust required.

2. **Pay-as-you-go API access** — An API consumer streams payment to a provider. The provider can pause access if the stream runs dry. No invoicing, no credit, no chargeback. Pure atomic settlement.

3. **Grant disbursement** — A foundation streams grant funding to a recipient over a project period. Milestones can trigger rate updates. If the project stops, the sender stops the stream and gets the deposit back.

4. **Subscription services** — Per-second subscription instead of monthly billing. The recipient only earns what they're actually owed in the time period the service was delivered.

5. **Revenue sharing** — Investors or partners receive a continuous share of revenue as it comes in, not in quarterly distributions.

**Why Canton specifically benefits:**

- Daml's immutable contract model makes the accrual audit trail tamper-proof by construction
- Multi-party authorization means both parties sign the agreement — legally meaningful
- Privacy features mean individual stream details aren't visible to uninvolved parties
- Enterprise-grade compliance tooling can plug directly into stream lifecycle events
- GrowStreams demonstrates a real use case that can be shown to institutional partners considering Canton adoption

**The $500T opportunity:**  
Institutional finance moves ~$500T in payment obligations monthly — payroll, trade settlements, grants, subscriptions. Almost all of it is batch-processed on monthly or quarterly cycles. GrowStreams converts that into a real-time primitive. Even 0.01% of that moving through Canton-native streams is a significant volume.

---

## 4. Bottlenecks

These are real constraints identified from building and testing Phase 1:

### Technical Bottlenecks

**1. Time must be passed explicitly to every choice**  
Daml contracts cannot call `getCurrentTime` inside a choice body in pure test scripts (only in `Script` monad with `getTime`). This means every single choice — Withdraw, Pause, TopUp, etc. — requires the caller to pass `currentTime` as a parameter. In a production UI, this means the frontend must fetch ledger time and inject it. If there's clock skew between client and server, accrual calculations drift. This is a core Daml design constraint, not a GrowStreams bug.

**2. setTime trap for testnet migration**  
All 33 existing tests use `setTime` (sandbox-only, simulated time jumps). These tests are correct and fast for CI. But they cannot run on testnet where time is real. We've created separate `scripts/demo/` with `passTime` for testnet, but this means maintaining two sets of scripts for the same logic. Long-term, a time-abstraction layer would help.

**3. No cross-validator test yet**  
The Canton Dev Fund proposal ideally wants proof that a stream can execute across two validators through the Global Synchronizer. We have sandbox proof, but not multi-validator proof. Setting up two Canton validators locally is non-trivial and hasn't been done yet. This is the main remaining technical gap.

**4. Token accounting is off-ledger**  
`StreamAgreement` tracks `deposited` and `withdrawn` as Decimal fields — internal accounting. There's no on-chain link from the stream to an actual `GrowToken` contract balance after creation (except in `StreamProposal` which archives the token at stream start). A sender could theoretically over-commit if they create multiple streams against the same token balance. Phase 2 needs a proper vault/escrow pattern.

**5. Stop choice doesn't issue refund tokens**  
`Stop` returns `(finalAccrued, refundAmount)` as Decimal values — it calculates what's owed and what's refunded but doesn't actually create token contracts for those amounts. The caller has to handle minting/transferring refund tokens externally. This is an intentional Phase 1 simplification but will need to be addressed for production.

### Process Bottlenecks

**6. Demo video not recorded**  
The only remaining blocker for Canton Dev Fund submission is a 2-minute demo video. Everything else is done. This is a process bottleneck, not a technical one.

**7. Testnet deployment not done**  
We've only deployed to local Canton sandbox. Testnet requires credentials, network access, and running the demo scripts against real Canton infrastructure. Not yet done.

**8. Navigator has cosmetic React errors**  
Navigator UI shows a `500 Internal Server Error` on `/api/config` and some React console errors. These are harmless (Navigator still works, parties are selectable, contracts are visible), but they look bad in a demo. The root cause is likely a Navigator version mismatch with SDK 2.10.3.

---

## 5. Future Plan

### Phase 1 Completion (This Week)
- [ ] Record 2-minute demo video using `scripts/demo/` quick scripts
- [ ] Upload to YouTube/Loom, add URL to `evidence/demo-video-url.txt`
- [ ] Optional: set up cross-validator test to strengthen submission

### Phase 1 Submission (Week 9-10)
- [ ] Final review of all 6 evidence files
- [ ] Submit to Canton Dev Fund with GitHub link + evidence folder + video
- [ ] Target: $70K Phase 1 funding

---

### Phase 2: Enterprise Controls ($80K target, 10 weeks)

These are the planned features for Phase 2, to be built after Phase 1 funding is received:

**Split Router**  
One stream fans out to N receivers with weighted percentages. E.g., a company streams payroll and 70% goes to employee, 20% to tax escrow, 10% to pension. All in one atomic stream. Useful for consortiums and multi-party revenue distribution.

**Credit Cap + Auto-Pause**  
A proactive solvency mechanism. If `deposited - withdrawn` falls below a threshold, the stream auto-pauses before it runs dry. Prevents receivers from losing earned tokens due to sender insolvency. Requires an on-chain watcher or trigger pattern in Daml.

**SettlementAdapter**  
An interface layer between `StreamAgreement` and external settlement systems — Canton Coin, bank tokens, fiat instruction messages. Allows GrowStreams to settle in real-world currencies, not just GROW token. Critical for institutional adoption.

**Treasury Delegation**  
An admin can manage streams on behalf of users. Companies need payroll admins who can create/modify/stop streams without requiring the CEO's cryptographic signature on every payroll run. Needs a proper delegation pattern in Daml.

**Vault/Escrow for Tokens**  
Fix the off-ledger token accounting issue from Phase 1. Lock actual `GrowToken` contracts in a vault at stream creation. This ties the `deposited` amount to real on-chain token custody, preventing over-commitment.

**Refund Token Issuance on Stop**  
Make `Stop` actually create and return `GrowToken` contracts for the refund amount rather than just returning a Decimal. Completes the full token lifecycle.

**Security Audit**  
External review of Daml contracts before production use. Authorization model, edge cases in accrual, overflow/underflow in Decimal arithmetic, re-entrancy equivalents in Daml's model.

**Reference Integration**  
A working demo that integrates GrowStreams with a Canton payment interface or bank token. Shows that GrowStreams is not just a toy — it connects to real financial rails.

**API Gateway Pay-as-you-go Pattern**  
A demo application where an API consumer streams payment to a provider per API call or per second of usage. Shows GrowStreams as infrastructure for the API economy on Canton.

---

### Phase 3: Production (After Phase 2)

- Canton DevNet/MainNet deployment
- Frontend integration with full React UI and Canton JSON API
- Performance benchmarking (streams per second, throughput)
- Enterprise pilot with a real institution using Canton
- Open-source SDK so other Canton builders can plug streaming payments into their apps

---

## Summary

| Topic | Status |
|-------|--------|
| What's Done | 33/33 tests, 6/6 criteria, sandbox deployed, evidence folder complete |
| What's New on Canton | Obligation-first model, immutable UTXO streams, non-consuming ObligationView, multi-party auth |
| Value to Canton | Real-time payment primitive — payroll, subscriptions, grants, API billing |
| Bottlenecks | Explicit time params, no cross-validator test, off-ledger token accounting, Stop doesn't mint refunds |
| Future Plan | Phase 1 submit → Phase 2 enterprise controls → Phase 3 production |

---

*GrowStreams — turning financial obligations into real-time streams on Canton.*
