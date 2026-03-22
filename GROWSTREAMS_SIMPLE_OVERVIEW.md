# GrowStreams on Canton — Simple Overview

**What it is**: Real-time money streaming — pay people every second instead of monthly  
**Platform**: Canton Network (Daml smart contracts)  
**Status**: Phase 1 Complete (90%) — Ready for $70K funding

---

## 1. ✅ What's Done

### Core System Working
- **StreamAgreement**: Two parties agree — sender pays receiver X tokens per second
- **Accrual Formula**: `tokens earned = rate × seconds elapsed` (automatic, precise)
- **ObligationView**: Check balance anytime without changing anything (free query)
- **Lifecycle Controls**:
  - Withdraw — receiver takes earned tokens
  - Pause/Resume — sender can freeze/unfreeze payments
  - Stop — sender ends stream, gets refund of remaining deposit
  - TopUp — sender adds more money to keep stream running
  - UpdateRate — sender changes payment rate

### Fully Tested
- **33 tests, all passing** (100%)
- Covers all features + edge cases
- Runs on Canton sandbox (local testing environment)

### Ready for Review
- All 6 acceptance criteria met
- Evidence folder complete with proof
- Documentation organized by week (Week 1-2, 3-4, 5-7, 8-10)
- Demo scripts ready for testnet

### What's Left
- Record 2-minute demo video (2 hours of work)
- Then submit to Canton Dev Fund

---

## 2. 🆕 What's New on Canton

**This is a complete rewrite from scratch** — not a copy-paste from our old Vara version.

### Key Differences

**Obligation-First Model** (new concept)
- Old way (Vara): Tokens moved every second automatically
- New way (Canton): Agreement sits on-chain, tokens only move when receiver withdraws
- Why better: More efficient, receiver controls when to settle

**Immutable Audit Trail**
- Every change creates a new contract version
- Full history preserved forever
- Can't be tampered with — built into Canton's design

**Non-Consuming Queries**
- Check your balance without any cost or state change
- Like reading a book vs writing in it
- Unique to Canton/Daml

**Multi-Party Signatures**
- Both sender and receiver cryptographically sign the agreement
- Not just "who called the function" — actual legal-grade signatures
- Enterprise-ready from day one

**Explicit Time Handling**
- Every action requires passing current time as parameter
- More transparent, easier to audit
- Testable with simulated time (sandbox) or real time (testnet)

---

## 3. 💎 Value to Canton

### What GrowStreams Brings

**A payment primitive Canton doesn't have**  
Canton is excellent infrastructure but lacks real-time streaming payments. GrowStreams fills that gap.

### Real Use Cases

1. **Payroll** — Companies stream salaries per-second instead of monthly batches
   - Employees can withdraw anytime
   - If company stops paying, stream runs dry — no trust needed

2. **Subscriptions** — Pay per second of actual usage
   - No monthly billing, no refunds
   - Stop using = stop paying automatically

3. **Grants** — Foundations stream funding over project timeline
   - Can adjust rate based on milestones
   - Stop project = stop funding, get refund

4. **API Billing** — Pay-as-you-go for API access
   - Stream payment while using API
   - Provider pauses access if payment stops

5. **Revenue Sharing** — Partners receive continuous share of revenue
   - Real-time distribution, not quarterly

### Why Canton Specifically

- **Audit Trail**: Every stream change is immutable — perfect for compliance
- **Privacy**: Stream details only visible to involved parties
- **Multi-Party**: Both parties sign — legally meaningful
- **Enterprise**: Canton's compliance tools work with streams out-of-box

### The Opportunity

**$500 trillion** in institutional payments happen monthly (payroll, settlements, grants).  
Almost all batch-processed on monthly cycles.  
Even 0.01% moving to real-time streams = massive volume for Canton.

---

## 4. ⚠️ Bottlenecks

### Technical Challenges

**Time Parameters**
- Every action needs current time passed in
- Risk: If client clock differs from server, calculations drift
- Solution: Frontend must fetch ledger time, not use local clock

**Two Script Sets**
- Tests use simulated time (instant, fast)
- Testnet demos use real time (actual seconds pass)
- Have to maintain both separately

**Token Accounting**
- Stream tracks deposits/withdrawals as numbers
- Not directly linked to actual token contracts after creation
- Risk: Sender could over-commit across multiple streams
- Fix: Phase 2 needs proper vault/escrow

**Stop Doesn't Issue Tokens**
- Stop calculates refund amount but doesn't create token contracts
- Caller has to handle token creation separately
- Fix: Phase 2 will automate this

**No Cross-Validator Test Yet**
- Only tested on single Canton sandbox
- Need proof it works across multiple validators
- Not a blocker but would strengthen submission

### Process Gaps

**Demo Video Not Done**
- Only thing blocking submission
- 2 hours of work, not technical complexity

**Testnet Not Deployed**
- Only on local sandbox so far
- Need Canton testnet credentials and deployment

---

## 5. 🚀 Future Plan

### This Week (Phase 1 Completion)
- Record demo video
- Submit to Canton Dev Fund
- Target: $70K Phase 1 funding

### Phase 2 ($80K, 10 weeks) — If Funded

**Split Router**
- One stream splits to multiple receivers
- Example: Payroll auto-splits to employee (70%), tax (20%), pension (10%)

**Credit Cap + Auto-Pause**
- Stream pauses before running out of money
- Prevents receiver from losing earned tokens

**SettlementAdapter**
- Connect to real currencies (not just GROW token)
- Work with Canton Coin, bank tokens, fiat

**Treasury Delegation**
- Admins manage streams on behalf of users
- Payroll admin doesn't need CEO signature for every payment

**Vault/Escrow**
- Lock actual tokens in vault at stream creation
- Fixes over-commitment risk

**Security Audit**
- External review before production
- Authorization, edge cases, arithmetic safety

**Enterprise Demo**
- Working integration with Canton payment system
- Proof it's not just a toy

### Phase 3 (After Phase 2)

- Deploy to Canton MainNet
- Full frontend UI
- Enterprise pilot with real institution
- Open-source SDK for other Canton builders
- Performance benchmarking

---

## Summary Table

| Topic | Key Point |
|-------|-----------|
| **What's Done** | 33/33 tests passing, all 6 criteria met, sandbox deployed, 90% ready |
| **What's New** | Obligation-first model, immutable contracts, non-consuming queries, multi-party signatures |
| **Value** | Real-time payment primitive for payroll, subscriptions, grants, APIs — $500T opportunity |
| **Bottlenecks** | Time params, token accounting off-ledger, Stop doesn't mint tokens, demo video pending |
| **Future** | Phase 1 submit → Phase 2 enterprise features → Phase 3 production |

---

**Bottom Line**: GrowStreams turns monthly payments into per-second streams on Canton. Phase 1 is done and ready for funding. Phase 2 adds enterprise features. Phase 3 goes to production.
