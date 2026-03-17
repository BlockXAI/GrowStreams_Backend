# Web3 Contribution Challenge — Campaign System

Part of the [GrowStreams](https://growstreams.app) platform. See the main [README.md](README.md) for the full project overview.

---

## Overview

The Web3 Contribution Challenge is a developer engagement campaign that analyzes GitHub contributions, scores them with AI, and mints achievement NFTs on Vara Network.

```
User Flow:
Connect Wallet → Verify GitHub (Reclaim) → AI Analysis → View Score → Mint NFT → Share → Leaderboard
```

---

## Pages

| Route | Purpose |
|-------|---------|
| `/campaign` | Main flow — step-by-step journey from wallet connect to NFT mint |
| `/campaign/leaderboard` | Live rankings with category filters (Overall, Impact, Quality, Collaboration, Security) |
| `/campaign/rules` | Eligibility, anti-gaming rules, scoring breakdown, prize distribution, FAQ |

---

## Architecture

### Frontend Components (`components/campaign/`)

| Component | Purpose |
|-----------|---------|
| Campaign page | Multi-step wizard with progress indicators |
| Leaderboard | Sortable/filterable table with tier badges |
| Rules page | Static content with expandable FAQ sections |

### Hooks

| Hook | Purpose |
|------|---------|
| `useVaraNFT` | NFT minting on Vara — metadata generation, transaction management |
| `useReclaimVerification` | Reclaim Protocol flow — QR code, proof generation, verification |
| `useReclaimContract` | On-chain proof validation via Vara contract |

### API Routes

```bash
POST   /api/web3/analyze           # Run AI scoring on a GitHub username
GET    /api/web3/health            # Scoring engine status
GET    /api/scorecard/:username    # Full scorecard JSON
GET    /api/badge/:username        # Embeddable SVG score badge
GET    /api/badge/tier/:username   # Embeddable SVG tier badge
GET    /api/leaderboard/all       # Paginated leaderboard (?page=1&limit=20&sort=score)
GET    /api/result/:actorId       # Shareable result page data
```

### Utilities (`lib/campaignUtils.ts`)

- Tweet text generation with pre-filled template
- Campaign window date calculations
- GitHub username validation
- Leaderboard sorting helpers
- Score → color mapping

---

## Scoring System

AI analyzes GitHub contributions across 4 dimensions (0–25 each, 100 total):

| Dimension | What it measures |
|-----------|-----------------|
| **Impact** (25) | Commit frequency, recency, reach |
| **Quality** (25) | Repo stars/forks, code quality signals |
| **Collaboration** (25) | PRs, issues, code reviews, teamwork |
| **Security** (25) | Dependabot, vulnerability management |

### Tier System

| Tier | Score | Badge |
|------|-------|-------|
| Elite | 80–100 | Gold |
| Expert | 60–79 | Silver |
| Advanced | 40–59 | Bronze |
| Intermediate | 20–39 | Blue |
| Beginner | 0–19 | Gray |

### Web3 Ecosystem Detection

The AI identifies contributions to specific ecosystems:
- Ethereum (Solidity, Hardhat, Foundry)
- Polkadot / Vara (Substrate, ink!, WASM, Gear)
- Solana (Rust, Anchor)
- Move (Aptos, Sui)
- 10+ additional ecosystems

---

## Blockchain Integration

### Vara Network

| Item | Details |
|------|---------|
| **Network** | Vara Testnet (`wss://testnet.vara.network`) |
| **Wallet support** | Polkadot.js Extension, SubWallet |
| **NFT standard** | Gear NFT (vNFT) |
| **Gas cost** | ~0.1 VARA per mint (free on testnet) |

### NFT Contract Methods

```rust
// Mint scorecard NFT
pub fn mint(&mut self, to: ActorId, github_id: String, scores: Scores, cid: String, window: Window) -> Result<TokenId, Error>

// Query NFT data
pub fn get_token_data(&self, token_id: TokenId) -> Option<ScorecardNFT>
```

### Scorecard NFT Data

```rust
struct ScorecardNFT {
    owner: ActorId,
    github_id: String,
    overall_score: u32,
    impact_score: u32,
    quality_score: u32,
    collaboration_score: u32,
    security_score: u32,
    cid: String,           // IPFS CID for full report
    window_start: u64,
    window_end: u64,
    minted_at: u64,
}
```

### Reclaim Protocol

Zero-knowledge proof of GitHub account ownership. No passwords shared. See `RECLAIM_SETUP.md` for full configuration guide.

---

## Environment Variables

Add these to `.env.local` (see `env.example`):

```bash
# Vara Network
NEXT_PUBLIC_VARA_NODE_ADDRESS=wss://testnet.vara.network
NEXT_PUBLIC_VARA_NFT_CONTRACT=<your-contract-address>

# Reclaim Protocol
NEXT_PUBLIC_RECLAIM_APP_ID=<your-app-id>
RECLAIM_APP_SECRET=<your-secret>
NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID=<provider-id>

# GitHub API (for AI scoring)
GITHUB_TOKEN=<personal-access-token>

# IPFS (for scorecard storage)
NEXT_PUBLIC_PINATA_JWT=<your-jwt>
```

---

## Embeddable Badges

Add to any GitHub README:

```markdown
![Web3 Score](https://growstreams.app/api/badge/your-username)
![Web3 Tier](https://growstreams.app/api/badge/tier/your-username)
```

---

## Security

- **Anti-gaming**: Reclaim proofs verified, duplicate GitHub IDs rejected, scores validated server-side
- **Sybil resistance**: One NFT per GitHub account, Reclaim verification required
- **Prize distribution**: Manual review of top scorers, wallet ownership verified, transaction hashes published

---

## Cost Estimate (Mainnet)

| Item | Cost |
|------|------|
| NFT mint | ~0.1 VARA per user |
| Contract deploy | ~1–2 VARA (one-time) |
| IPFS storage | ~$0.0001 per scorecard (~1KB) |
| **1,000 users total** | **~$10–20** |

---

## Resources

- [Vara NFT Standards](https://wiki.gear.foundation/docs/examples/Standards/vnft)
- [Gear Protocol Docs](https://wiki.gear.foundation/)
- [Reclaim Protocol Docs](https://dev.reclaimprotocol.org/)
- [GrowStreams Developers](https://growstreams.app/developers)
