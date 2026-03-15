# 🌊 GrowStreams — Money Streaming Protocol on Vara

> **Stream tokens by the second to any address on Vara Network.**

GrowStreams is a real-time money streaming protocol built on [Vara Network](https://vara.network). It enables continuous, per-second token flows for payroll, subscriptions, grants, revenue sharing, and any programmable payment use case.

## ⚡ New: GrowStreams Campaign System

**Earn XP and USDC rewards for contributing to GrowStreams!**

- 🛠️ **OSS Track**: Submit GitHub PRs, earn XP + daily accumulation + merge bonuses
- 📱 **Content Track**: Create quality Twitter content about GrowStreams
- 🤖 **AI-Powered Scoring**: GPT-4o-mini evaluates all contributions (0-100 scale)
- 🏆 **Leaderboard**: Real-time rankings with estimated USDC payouts
- 💰 **Automated Payouts**: Fair distribution based on total XP earned

[**Join the Campaign →**](https://growstreams.app/campaign)

## Live

| Service | URL |
|---|---|
| **Frontend** | [growstreams.xyz](https://growstreams.xyz) / [growstreams-v2.vercel.app](https://growstreams-v2.vercel.app) |
| **REST API** | [growstreams-core-production.up.railway.app](https://growstreams-core-production.up.railway.app) |
| **Network** | Vara Testnet (`wss://testnet.vara.network`) |

---

## Deployed Contracts (Vara Testnet)

| Contract | Program ID | Purpose |
|---|---|---|
| **GROW Token** | `0x05a2a482...ee8fe36` | VFT fungible token (12 decimals) |
| **StreamCore** | `0x2e7c2064...15d70a56` | Per-second streaming state machine |
| **TokenVault** | `0x7e081c0f...bb2c254b` | Token escrow & buffer management |
| **SplitsRouter** | `0xe4fe5916...88b894` | Weighted fund distribution |
| **PermissionManager** | `0x6cce6602...9f88cb` | Delegation & access control |
| **BountyAdapter** | `0xd5377611...268f81` | Milestone-based bounty streams |
| **IdentityRegistry** | `0xb6389d1d...9d948a` | GitHub identity binding |

<details>
<summary>Full Program IDs</summary>

```
GROW Token:        0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36
StreamCore:        0x2e7c2064344449504c9c638261bab78238ae50b8a47faac5beae2d1915d70a56
TokenVault:        0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b
SplitsRouter:      0xe4fe59166d824a0f710488b02e039f3fe94980756e3571fc93ba083b5b88b894
PermissionManager: 0x6cce66023765a57cbc6adf5dfe7df66ee636af56ab7d92a8f614bd8c229f88cb
BountyAdapter:     0xd5377611a285d3efcbe9369361647d13f3a9c60ed70d648eaa21c08c72268f81
IdentityRegistry:  0xb6389d1da594b84a73f3a5178caa25ff56ec0f57f2f8a9d42f8b1b6fba9d948a
```
</details>

---

## How It Works

```
1. Get GROW tokens    →  Mint from faucet (testnet)
2. Approve vault      →  Allow vault to pull tokens
3. Deposit to vault   →  Fund your streaming escrow
4. Create stream      →  Set receiver + flow rate → tokens flow per-second
```

Receivers can withdraw accrued tokens at any time. Senders can pause, resume, top up, or stop streams instantly.

### Buffer Model

Every stream requires a buffer deposit (flow_rate x 3600 seconds minimum). If the buffer depletes, the stream can be liquidated — ensuring receivers are never owed tokens that don't exist.

---

## Quick Start (User)

1. Install [SubWallet](https://www.subwallet.app/) or Polkadot.js extension
2. Get testnet VARA from [Vara Faucet](https://idea.gear-tech.io/programs?node=wss%3A%2F%2Ftestnet.vara.network)
3. Open [growstreams.xyz/app/grow](https://growstreams.xyz/app/grow)
4. Mint GROW → Approve → Deposit → Create Stream

See [TESTING-GUIDE.md](frontend/TESTING-GUIDE.md) for detailed step-by-step instructions.

---

## REST API

**Base URL:** `https://growstreams-core-production.up.railway.app`

### GROW Token

| Endpoint | Method | Description |
|---|---|---|
| `/api/grow-token/meta` | GET | Token name, symbol, decimals, supply, admin |
| `/api/grow-token/balance/:account` | GET | GROW balance for an address |
| `/api/grow-token/allowance/:owner/:spender` | GET | Token allowance |
| `/api/grow-token/total-supply` | GET | Total GROW supply |
| `/api/grow-token/faucet` | POST | Mint 1,000 GROW (server-side, rate limited) |
| `/api/grow-token/transfer` | POST | Transfer tokens |
| `/api/grow-token/approve` | POST | Approve spender |
| `/api/grow-token/mint` | POST | Mint tokens (admin only) |
| `/api/grow-token/burn` | POST | Burn tokens |

### Streams

| Endpoint | Method | Description |
|---|---|---|
| `/api/streams/config` | GET | Protocol config |
| `/api/streams/total` | GET | Total stream count |
| `/api/streams/active` | GET | Active stream count |
| `/api/streams/:id` | GET | Get stream by ID |
| `/api/streams/:id/balance` | GET | Withdrawable balance |
| `/api/streams/:id/buffer` | GET | Remaining buffer |
| `/api/streams/sender/:address` | GET | Streams by sender |
| `/api/streams/receiver/:address` | GET | Streams by receiver |
| `/api/streams` | POST | Create stream `{ receiver, token, flowRate, initialDeposit }` |
| `/api/streams/:id/pause` | POST | Pause stream |
| `/api/streams/:id/resume` | POST | Resume stream |
| `/api/streams/:id/deposit` | POST | Add deposit `{ amount }` |
| `/api/streams/:id/withdraw` | POST | Withdraw accrued tokens |
| `/api/streams/:id/stop` | POST | Stop stream |
| `/api/streams/:id/liquidate` | POST | Liquidate depleted stream |

### Vault

| Endpoint | Method | Description |
|---|---|---|
| `/api/vault/config` | GET | Vault configuration |
| `/api/vault/paused` | GET | Pause status |
| `/api/vault/balance/:owner/:token` | GET | Vault balance (deposited, allocated, available) |
| `/api/vault/allocation/:streamId` | GET | Stream allocation amount |
| `/api/vault/deposit` | POST | Deposit tokens `{ token, amount }` |
| `/api/vault/withdraw` | POST | Withdraw tokens `{ token, amount }` |
| `/api/vault/deposit-native` | POST | Deposit VARA `{ amount }` |
| `/api/vault/withdraw-native` | POST | Withdraw VARA `{ amount }` |

### Campaign & Leaderboard

| Endpoint | Method | Description |
|---|---|---|
| `/api/campaign/register` | POST | Register for campaign `{ wallet, github_handle?, x_handle?, track }` |
| `/api/campaign/participant/:wallet` | GET | Get participant stats with XP history |
| `/api/campaign/config` | GET | Campaign configuration (dates, XP tiers, pool) |
| `/api/campaign/payout-snapshot` | POST | Generate payout table (admin, requires Bearer token) |
| `/api/leaderboard` | GET | Paginated leaderboard `?page=1&limit=50&track=OSS` |
| `/api/leaderboard/stats` | GET | Aggregate campaign statistics |
| `/api/leaderboard/:wallet` | GET | Individual participant stats |
| `/api/webhooks/github` | POST | GitHub webhook endpoint (HMAC verified) |

**Campaign Tracks:**
- `OSS`: GitHub PR contributions (requires `github_handle`)
- `CONTENT`: Twitter/X content (requires `x_handle`)
- `BOTH`: Participate in both tracks

**XP Tiers (OSS):**
- Score 70-79: 700 XP initial + 100 XP/day
- Score 80-89: 1200 XP initial + 150 XP/day
- Score 90-100: 2000 XP initial + 200 XP/day
- Merge bonus: +500 XP

**XP Tiers (Content):**
- Score 70-79: 500 XP
- Score 80-89: 800 XP
- Score 90-100: 1200 XP
- Thread bonus: +30% for 5+ tweet threads
- Viral bonus: +800 XP at 500+ engagements
- Reshare bonus: +500 XP if @VaraNetwork retweets

### Other Contracts

| Endpoint | Description |
|---|---|
| `/api/splits/*` | Revenue splits (create groups, distribute) |
| `/api/permissions/*` | Access control (grant, revoke, check) |
| `/api/bounty/*` | Bounty streams (create, claim, verify, complete) |
| `/api/identity/*` | Identity binding (GitHub verification) |

### Payload Mode (Client-Side Signing)

All POST routes accept `{ "mode": "payload" }` to return an encoded payload for wallet signing instead of server-side execution:

```bash
# Get encoded payload for client-side signing
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/approve \
  -H "Content-Type: application/json" \
  -d '{"spender":"0x7e08...254b","amount":"1000000000000000","mode":"payload"}'

# Response: { "payload": "0x28566674..." }
# Sign this payload with the user's wallet and submit to Vara
```

### Example: Full Flow via API

```bash
API=https://growstreams-core-production.up.railway.app

# 1. Mint GROW tokens
curl -X POST $API/api/grow-token/faucet \
  -H "Content-Type: application/json" \
  -d '{"to":"0xYOUR_HEX_ADDRESS"}'

# 2. Check balance
curl $API/api/grow-token/balance/0xYOUR_HEX_ADDRESS

# 3. Approve vault (server-side execution)
curl -X POST $API/api/grow-token/approve \
  -H "Content-Type: application/json" \
  -d '{"spender":"0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b","amount":"500000000000000"}'

# 4. Deposit to vault
curl -X POST $API/api/vault/deposit \
  -H "Content-Type: application/json" \
  -d '{"token":"0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36","amount":"100000000000000"}'

# 5. Create stream (0.001 GROW/s, 50 GROW deposit)
curl -X POST $API/api/streams \
  -H "Content-Type: application/json" \
  -d '{"receiver":"0xRECEIVER_HEX","token":"0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36","flowRate":"1000000000","initialDeposit":"50000000000000"}'

# 6. Check stream
curl $API/api/streams/1
```

---

## 🎯 Campaign System Features

### AI-Powered Contribution Scoring

**GitHub PRs (OSS Track):**
- 5-factor LLM evaluation: correctness, test coverage, code quality, issue relevance, completeness
- Anti-gaming: rejects trivial PRs (<5 meaningful lines changed)
- Automatic re-scoring on new commits
- CI status integration
- Merge bonus: +500 XP when PR is merged
- Daily accumulation for 14 days (100-200 XP/day based on score tier)

**Twitter/X Content (Content Track):**
- 5-factor LLM evaluation: quality, relevance, originality, educational value, engagement
- Anti-gaming: rejects low-effort mentions (<20 chars)
- Engagement velocity scoring (likes + retweets + replies / follower count)
- Thread detection with +30% bonus for 5+ tweet threads
- Viral bonus: +800 XP at 500+ engagements
- Reshare bonus: +500 XP if @VaraNetwork retweets
- Re-evaluation at 6h and 24h for engagement bonuses

### Automation & Background Jobs

**Cron Schedules (UTC):**
- `0 0 * * *` — Daily XP accumulation for active OSS contributions
- `5 0 * * *` — Leaderboard snapshot (captures daily ranks for "rank change" arrows)
- `0 */6 * * *` — X/Twitter re-evaluation (checks viral/reshare bonuses)

### Security & Anti-Gaming

- **Rate limiting**: 5 registrations per IP per minute
- **HMAC-SHA256 verification**: GitHub webhooks cryptographically verified
- **Campaign window gating**: contributions outside campaign dates are rejected
- **Duplicate prevention**: unique constraints on (track, external_id)
- **XP idempotency**: one-time bonuses can't be awarded twice
- **Admin-only endpoints**: payout snapshot requires Bearer token
- **Trivial contribution rejection**: GitHub PRs <5 lines, tweets <20 chars

## Project Structure

```
growstreams/
├── contracts/                   # Vara smart contracts (Rust + Sails)
│   ├── stream-core/             # Per-second streaming engine
│   ├── token-vault/             # Token escrow with VFT cross-contract calls
│   ├── grow-token/              # GROW VFT token (12 decimals)
│   ├── splits-router/           # Weighted fund distribution
│   ├── permission-manager/      # Access control & delegation
│   ├── adapters/bounty-adapter/ # AI-scored bounty streams
│   └── identity-registry/       # GitHub identity binding
├── api/                         # REST API (Express + sails-js)
│   ├── src/
│   │   ├── routes/              # Route handlers (streams, vault, campaign, leaderboard, webhooks)
│   │   ├── services/            # Business logic (XP, LLM scorer, GitHub agent, X agent)
│   │   ├── cron/                # Scheduled jobs (daily XP, snapshots, re-evaluation)
│   │   └── sails-client.mjs     # Vara blockchain client
│   ├── idl/                     # Contract IDL files
│   └── deploy-state.json        # Deployed program IDs
├── frontend/                    # Next.js 15 frontend
│   ├── app/app/                 # App pages (dashboard, grow, streams, vault, campaign)
│   ├── hooks/useGrowStreams.ts  # Contract interaction hooks
│   ├── lib/growstreams-api.ts   # API client
│   └── TESTING-GUIDE.md         # Step-by-step testing guide
├── sdk/                         # TypeScript SDK
├── scripts/deploy-js/           # Deploy & E2E test scripts
└── deploy-state.json            # Contract addresses
```

---

## Development

### Prerequisites

- Rust stable + `wasm32-unknown-unknown` target
- Node.js 18+
- `rustup component add rust-src`

### Build Contracts

```bash
cd contracts && cargo build --release
```

### Run API Locally

```bash
cd api
npm install
cp .env.example .env  # set VARA_SEED
npm run dev
```

### Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Run E2E Tests

```bash
cd scripts/deploy-js
node e2e-grow-token.mjs   # GROW token lifecycle
node e2e-test.mjs          # Full protocol test (53 tests)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Rust + Gear Sails 0.6 (WASM actors) |
| Token Standard | VFT (Vara Fungible Token) |
| Backend API | Express.js + sails-js + Railway |
| Campaign Database | Supabase (PostgreSQL) |
| AI Scoring | OpenAI GPT-4o-mini |
| GitHub Integration | Octokit + Webhooks (HMAC-SHA256) |
| Twitter Integration | Twitter API v2 (Filtered Stream) |
| Cron Jobs | node-cron (UTC timezone) |
| Frontend | Next.js 15 + React 19 + TailwindCSS + Vercel |
| Wallet | SubWallet / Polkadot.js / @gear-js/wallet-connect |
| Blockchain | Vara Network (Polkadot ecosystem) |

---

## 🗄️ Campaign Database Schema

**Tables:**
- `participants` — campaign registrations (wallet, handles, track, total_xp)
- `contributions` — OSS PRs + X posts (track, score, status, XP awarded)
- `xp_events` — all XP transactions (wallet, delta, reason, contribution_id)
- `daily_snapshots` — leaderboard history (wallet, rank, XP per day)

**Key Features:**
- Unique constraints prevent duplicate contributions
- XP idempotency for one-time bonuses
- 14-day accumulation cap via `max_daily_until`
- Rank change tracking via daily snapshots

See `.env.example` for Supabase connection configuration.

---

## 🚀 Campaign Quick Start

### For Participants

**OSS Track:**
1. Register at `POST /api/campaign/register` with your wallet + GitHub handle
2. Submit PRs to `BlockXAI/GrowStreams_Backend`
3. AI scores your PR (0-100) and awards initial XP
4. Earn daily XP for 14 days if score ≥70
5. Get +500 XP merge bonus when PR is merged

**Content Track:**
1. Register at `POST /api/campaign/register` with your wallet + X handle
2. Post tweets mentioning `@GrowStreams` or `#GrowStreams`
3. AI scores your content + engagement velocity
4. Earn XP immediately if score ≥70
5. Get bonuses for viral performance + @VaraNetwork retweets

**Check Your Stats:**
```bash
curl https://growstreams-core-production.up.railway.app/api/leaderboard/:your_wallet
```

### For Admins

**Setup Campaign:**
1. Create Supabase project + run table creation SQL
2. Set all environment variables (30 total, see `.env.example`)
3. Register GitHub App + set webhook to `/api/webhooks/github`
4. Get Twitter API credentials (Basic tier minimum)
5. Deploy to Railway (cron jobs start automatically)

**Generate Payout Snapshot:**
```bash
curl -X POST https://growstreams-core-production.up.railway.app/api/campaign/payout-snapshot \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET"
```

---

## 📊 Campaign Metrics & Monitoring

**Real-Time Stats:**
- Total participants
- Total XP earned across all tracks
- OSS vs Content contribution breakdown
- Top contributor
- Days remaining in campaign
- USDC pool allocation

**Access at:** `GET /api/leaderboard/stats`

**Logs to Monitor:**
- `[github-agent]` — PR webhook processing
- `[x-agent]` — Tweet stream processing
- `[daily-xp]` — Daily accumulation runs
- `[snapshot]` — Leaderboard snapshot runs
- `[x-reeval]` — Tweet re-evaluation runs
- `[xp]` — All XP award events

---

## License

MIT

---

**Built by the GrowStreams team — real-time money streaming on Vara Network.**

🌊 **Stream it. Earn it. Own it.**
