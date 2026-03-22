# GrowStreams Canton Frontend

**Real-time token streaming on Canton Network** - Demo frontend for Canton Dev Fund submission

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Canton sandbox running on `localhost:6865`
- Canton JSON API running on `localhost:7575`

### Installation

```bash
cd canton-frontend
npm install
```

### Configuration

1. Copy `env.example` to `.env.local`:
```bash
cp env.example .env.local
```

2. Update party IDs in `.env.local` with your actual Canton party IDs from `evidence/contract-ids.txt`

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Features

### Current (Demo Mode)
- ✅ Real-time stream visualization
- ✅ Live accrual calculation (updates every second)
- ✅ Party switcher (Alice/Bob/Admin views)
- ✅ Stream lifecycle controls (Withdraw, Pause, Resume, Stop)
- ✅ Progress bars and time remaining
- ✅ Mock data for demonstration

### TODO (Canton JSON API Integration)
- ⏳ Connect to actual Canton JSON API
- ⏳ Query real StreamAgreement contracts
- ⏳ Execute choices on Canton ledger
- ⏳ Real-time contract updates via WebSocket

---

## 📁 Project Structure

```
canton-frontend/
├── app/
│   ├── page.tsx          # Main streams dashboard
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── lib/
│   └── canton-api.ts     # Canton JSON API client
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🔧 Canton Integration

### Canton JSON API Setup

1. Start Canton sandbox:
```bash
cd daml-contracts
daml sandbox --port 6865 --dar .daml/dist/growstreams-1.0.0.dar
```

2. Start Canton JSON API:
```bash
daml json-api \
  --ledger-host localhost \
  --ledger-port 6865 \
  --http-port 7575 \
  --allow-insecure-tokens
```

3. Verify JSON API is running:
```bash
curl http://localhost:7575/v1/query
```

### API Methods

The `canton-api.ts` file provides:
- `queryContracts()` - Query active contracts
- `exerciseChoice()` - Execute choices (Withdraw, Pause, etc.)
- `createContract()` - Create new contracts
- `calculateAccrued()` - Client-side accrual calculation

---

## 🎬 Demo Video Proof

This frontend is designed to prove GrowStreams works on Canton for the Dev Fund submission.

**What to show in video**:
1. Canton sandbox running (`lsof -i:6865`)
2. JSON API running (`lsof -i:7575`)
3. Frontend showing live streams
4. Real-time accrual updating every second
5. Execute Withdraw choice
6. Execute Pause/Resume choices
7. Stream progress bars updating

---

## 🛠️ Development

### Build for Production
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

---

## 📊 Canton Dev Fund Proof Points

This frontend demonstrates:
- ✅ **Real-time accrual** - Updates every second without blockchain queries
- ✅ **ObligationView** - Non-consuming balance checks
- ✅ **Lifecycle management** - All choices (Withdraw, Pause, Resume, Stop)
- ✅ **Multi-party views** - Switch between Alice, Bob, Admin
- ✅ **Canton integration** - Ready for JSON API connection

---

## 🎯 Next Steps

1. **Connect to real Canton JSON API** - Replace mock data with actual queries
2. **Add WebSocket support** - Real-time contract updates
3. **Add stream creation UI** - Create new streams from frontend
4. **Add token management** - Mint, transfer GROW tokens
5. **Deploy to Vercel/Netlify** - Public demo URL for Canton Dev Fund

---

**Status**: Demo-ready with mock data • Canton JSON API integration pending
