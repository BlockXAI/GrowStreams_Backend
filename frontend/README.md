# GrowStreams

**Vara-native Money Streaming Protocol — per-second token payments for payroll, subscriptions, bounties, grants, and revenue sharing.**

[![Build](https://img.shields.io/badge/build-passing-10b981.svg)](https://growstreams.app)
[![Vara Network](https://img.shields.io/badge/built%20on-Vara%20Network-00D4AA.svg)](https://vara.network)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live**: [growstreams.app](https://growstreams.app) · **Docs**: [/developers](https://growstreams.app/developers) · **Testnet**: Vara Testnet

---

## What is GrowStreams?

GrowStreams is a **generalized token streaming protocol** on Vara Network. It enables real-time, per-second movement of tokens between addresses — composable, token-agnostic, and production-ready.

```
Sender ──► StreamCore Contract ──► Receiver
           (per-second flow)
           Buffer-secured
           Pause / Resume / Cancel
           Any ERC-20 / Vara token
```

### Core Contracts

| Contract | Purpose |
|----------|---------|
| **StreamCore** | Creates and manages per-second token streams |
| **TokenVault** | Holds deposited tokens and handles withdrawals |
| **SplitsRouter** | Splits a single stream into multiple recipients |

### Use Cases

- **Streaming Payroll** — pay teams every second, not every month
- **Subscriptions** — per-second SaaS billing with auto-cancel on insufficient buffer
- **Bounties & Gigs** — time-locked streams released on completion
- **Revenue Sharing** — automatic splits to contributors
- **Vesting Streams** — token vesting that flows continuously

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15, React 19, TypeScript, App Router |
| **Styling** | Tailwind CSS 3.4 + custom design system (`provn-*` tokens) |
| **Fonts** | Space Grotesk (UI) + JetBrains Mono (code/hashes) |
| **Animations** | Framer Motion, WebGL shaders (OGL) |
| **Blockchain** | Vara Network (Substrate/Wasm), Polkadot.js, Gear.js |
| **Wallets** | Polkadot.js Extension, SubWallet |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | IPFS via Pinata |
| **Hosting** | Vercel |

---

## Project Structure

```
growstreams/
├── app/
│   ├── page.tsx              # Landing page (hero, protocol, use cases, demo, CTA)
│   ├── developers/           # SDK docs, contract addresses, quickstart
│   ├── protocol/             # Stream lifecycle, security model, architecture
│   ├── use-cases/            # Detailed use case breakdowns
│   ├── ecosystem/            # Partner integrations + contact form
│   ├── campaign/             # Web3 Contribution Challenge (leaderboard, rules)
│   ├── dashboard/            # User dashboard
│   ├── explore/              # Content discovery
│   ├── upload/               # Content upload + derivative works
│   └── api/                  # 40+ API routes
│
├── components/
│   ├── v2/                   # 30+ custom UI components (see below)
│   ├── campaign/             # Campaign-specific components
│   ├── explore/              # Discovery UI
│   ├── provn/                # Legacy Provn components
│   └── ui/                   # shadcn/ui base components
│
├── hooks/                    # 13 custom React hooks
├── contexts/                 # Vara wallet, follow state, video modal
├── lib/                      # Utilities, API clients, campaign helpers
├── contracts/                # Smart contract ABIs
├── services/                 # Backend service layers
└── utils/                    # Shared utility functions
```

---

## UI Component Library (`components/v2/`)

GrowStreams ships with **31 custom components** — each designed for the dark, protocol-grade aesthetic.

### Backgrounds & Effects

| Component | Description |
|-----------|-------------|
| `aurora-background` | Animated radial gradient blobs with themed color variants (default/cyan/amber/purple) |
| `gradient-blinds` | WebGL shader background using OGL — diagonal animated blinds |
| `animated-grid` | Subtle grid pattern background |
| `dot-matrix` | Dot grid pattern with configurable color and density |
| `flowing-particles` | Canvas particle system with velocity and proximity connections |
| `floating-network` | Animated network nodes with connection lines |
| `pixel-blast` | Pixel explosion effect |
| `meteor-lines` | Animated meteor trail lines |

### Text Animations

| Component | Description |
|-----------|-------------|
| `true-focus` | Word-by-word focus animation with blur/unblur and corner bracket frame |
| `text-scramble` | Scramble-to-reveal text animation triggered on viewport entry |
| `gradient-text` | Animated gradient-filled text with optional shimmer |
| `word-rotate` | Rotating word animation for dynamic headlines |
| `code-typing` | Character-by-character code block typing animation |
| `split-text` | Per-character staggered text reveal |
| `letter-pullup` | Letters pull up from below with stagger |
| `shiny-text` | Shimmering text highlight effect |

### Interactive Elements

| Component | Description |
|-----------|-------------|
| `spotlight-card` | Card with radial glow that follows cursor on hover |
| `magnet-button` | Button that magnetically pulls toward cursor |
| `tilt-card` | 3D tilt effect on hover |
| `ripple-button` | Material-style ripple click effect |
| `border-beam` | Animated beam traveling around element border |

### Data & Display

| Component | Description |
|-----------|-------------|
| `stream-visualizer` | Live stream card with animated dots flowing sender → receiver |
| `streaming-counter` | Real-time ticking counter for streamed amounts |
| `number-ticker` | Animated number counting up |
| `count-up` | Simple count-up animation |
| `infinite-marquee` | Continuous scrolling text/logo marquee |

### Layout & Navigation

| Component | Description |
|-----------|-------------|
| `navigation-v2` | Sticky nav with sliding pill indicator + mobile menu |
| `footer-v2` | Full footer with trust strip, social links, sitemap |
| `scroll-progress` | Thin progress bar at page top showing scroll position |

---

## Pages Overview

### Landing Page (`/`)

The landing page is built as a **content factory** — every section is designed to be screenshot/screen-recorded independently for social content.

| Section | Key Elements |
|---------|-------------|
| **Hero** | TrueFocus animated headline, TextScramble badge, protocol status bento cards, live stream preview with ticking counter |
| **Protocol Features** | SpotlightCard bento grid with mouse-follow glow, animated mesh gradient blobs |
| **How It Works** | 5-step timeline with pulse dot, CodeTyping animation, contract address sidebar |
| **Use Cases** | Cards with micro-tags, hover reveal "Learn more" links, Link routing to anchors |
| **Stream Demo** | 4 scenario tabs (Payroll/Subscriptions/Bounties/Splits) with animated pill indicator |
| **Developer CTA** | Animated conic-gradient border, btn-shimmer buttons |
| **Footer** | Trust strip (Built on Vara, Audit-Ready, Open Source, Pilot Slots), social icons with magnetic hover |

### Other Pages

| Page | Purpose |
|------|---------|
| `/developers` | SDK reference, tab-based code switcher (TypeScript/Rust/CLI), contract addresses, quickstart guide |
| `/protocol` | Stream lifecycle, contract architecture, security model — cyan aurora theme |
| `/use-cases` | Detailed breakdowns per use case with alternating layouts — purple aurora theme |
| `/ecosystem` | Partner types, current integrations, contact form — amber aurora theme |
| `/campaign` | Web3 Contribution Challenge: wallet connect → GitHub verify → AI scoring → NFT mint |
| `/campaign/leaderboard` | Real-time rankings with category filters and prize breakdown |
| `/campaign/rules` | Eligibility, anti-gaming rules, scoring system, FAQ |

---

## Getting Started

### Prerequisites

```
Node.js >= 18.18
npm >= 9.8
```

### Install & Run

```bash
git clone https://github.com/growstreams/growstreams.git
cd growstreams
npm install
cp env.example .env.local   # fill in your credentials
npm run dev                  # → http://localhost:3000
```

### Environment Variables

See `env.example` for the full list. Key variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Vara Network
NEXT_PUBLIC_VARA_NODE_ADDRESS=wss://testnet.vara.network
NEXT_PUBLIC_VARA_NFT_CONTRACT=

# Reclaim Protocol (GitHub verification)
NEXT_PUBLIC_RECLAIM_APP_ID=
RECLAIM_APP_SECRET=

# GitHub (for AI scoring engine)
GITHUB_TOKEN=

# IPFS (Pinata)
NEXT_PUBLIC_PINATA_JWT=
```

### Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
```

### Deploy

```bash
vercel --prod
```

---

## API Routes

### Streaming Protocol (placeholder — contracts on Vara)

The streaming protocol lives on-chain via Vara smart contracts. The frontend interacts directly through `@gear-js/api` and `sails-js`.

### Web3 Challenge APIs

```bash
POST   /api/web3/analyze           # Analyze GitHub user's Web3 contributions
GET    /api/web3/health            # Scoring engine health check
GET    /api/scorecard/:username    # Full scorecard JSON
GET    /api/badge/:username        # SVG score badge (embeddable)
GET    /api/badge/tier/:username   # SVG tier badge
GET    /api/leaderboard/all       # Paginated leaderboard
GET    /api/result/:actorId       # Shareable result page data
```

### Platform APIs

```bash
GET    /api/explore/feed          # Content discovery
GET    /api/platform-stats        # Platform metrics
GET    /api/profile/:id           # User profile
POST   /api/follow                # Follow/unfollow
POST   /api/minted-content        # Upload + mint IP-NFT
POST   /api/tips                  # Creator tipping
```

---

## Content Factory

Every frontend section is designed as a **standalone visual asset** for marketing. The content team can screenshot or screen-record any section in isolation:

| Asset Type | Source | Content Angle |
|------------|--------|---------------|
| **GIF / short clip** | TrueFocus hero headline | Hook — "What if you got paid every second?" |
| **GIF** | Live stream preview with ticking counter | Product demo — "Watch tokens flow in real-time" |
| **Screenshot** | Protocol status bento cards | Credibility — "Here's exactly where we stand" |
| **Screen recording** | Demo tab switching (4 scenarios) | Walkthrough — "One protocol, four use cases" |
| **Screenshot per card** | Use case cards with micro-tags | Explainer series (5 posts) |
| **Scrolling capture** | How It Works timeline + CodeTyping | Dev education thread |
| **Screenshot** | Contract address sidebar | Technical trust — "Verify on-chain" |
| **GIF** | SpotlightCard mouse-follow glow | Aesthetic / design community content |
| **Screenshot** | Footer trust strip | Trust — "Open source. Audit-ready. 3 pilot slots left." |
| **Full scroll recording** | Entire landing page | Brand video with voiceover |

---

## Campaign System

The platform includes a **Web3 Contribution Challenge** for developer engagement:

1. **Connect** Vara wallet (Polkadot.js / SubWallet)
2. **Verify** GitHub ownership via Reclaim Protocol (zero-knowledge proof)
3. **Analyze** — AI scores contributions across impact, quality, collaboration, security (0–100)
4. **Mint** — score becomes an NFT badge on Vara Network
5. **Share** — one-click share to X/Twitter with pre-filled template
6. **Compete** — live leaderboard with prize pool

See `CAMPAIGN_README.md` for implementation details and `RECLAIM_SETUP.md` for Reclaim Protocol configuration.

---

## Security

- **Contracts**: Threat model documented, comprehensive test coverage, audit-ready
- **Wallet auth**: Signature-based, no passwords stored
- **API protection**: Rate limiting on all scoring/analysis endpoints
- **Content moderation**: Automated inappropriate content detection (Obscenity library)
- **Sybil resistance**: One NFT per GitHub account, Reclaim verification required

---

## License

MIT — see [LICENSE](LICENSE).

**Built on [Vara Network](https://vara.network).**
