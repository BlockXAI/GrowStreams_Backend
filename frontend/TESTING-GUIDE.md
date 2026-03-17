# GrowStreams Frontend Testing Guide

## Prerequisites

1. **Vara Wallet** — Install [SubWallet](https://www.subwallet.app/) or [Polkadot.js Extension](https://polkadot.js.org/extension/)
2. **Vara Testnet Tokens** — Get free VARA from [Vara Faucet](https://idea.gear-tech.io/programs?node=wss%3A%2F%2Ftestnet.vara.network) (you need ~2 VARA for gas fees)
3. **Start the dev server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Flow 1: GROW Token Full Lifecycle (Primary Flow)

This is the main feature — streaming GROW tokens per-second to another address.

### Step 1 — Connect Wallet

1. Open the app. You should see a wallet connect screen.
2. Click to connect your SubWallet or Polkadot.js extension.
3. Select your Vara testnet account.
4. You should land on the app dashboard after connecting.

### Step 2 — Navigate to GROW Token Page

1. In the sidebar, click **GROW Token**.
2. You should see:
   - Balance overview (Wallet, Allowance, Vault Available, Vault Locked)
   - A **Getting Started** step tracker (Get GROW → Approve → Deposit → Stream)
   - Tabbed action panel (Faucet, Approve, Vault, Transfer)

### Step 3 — Mint GROW Tokens (Faucet Tab)

1. The **Faucet** tab should be active by default.
2. Click **"Mint 1,000 GROW"**.
3. Your wallet extension will pop up — approve the transaction.
4. Wait ~10 seconds for confirmation. A success toast should appear.
5. Click the refresh button (top right) or wait — your **Wallet Balance** should show **1,000 GROW** (or 1K).
6. The step tracker should now show Step 1 as completed (green checkmark).

**Expected result:** Wallet balance = 1,000 GROW

### Step 4 — Approve Vault (Approve Tab)

1. Click the **Approve** tab.
2. You should see "Current allowance: 0 GROW".
3. Enter **1000** in the amount field (or click the "1,000" preset button).
4. Click **"Approve"**.
5. Approve the transaction in your wallet extension.
6. Wait for confirmation toast.
7. Refresh — **Vault Allowance** should now show **1K**.

**Expected result:** Allowance = 1,000 GROW

### Step 5 — Deposit to Vault (Vault Tab)

1. Click the **Vault** tab.
2. In the **Deposit** section, enter **500** (or click preset).
3. Click **"Deposit to Vault"**.
4. Approve the wallet transaction.
5. Wait for confirmation.
6. After refresh:
   - **Wallet Balance** should drop to ~500 GROW
   - **Vault Available** should show ~500 GROW
7. The step tracker should show Steps 1-3 as completed.

**Expected result:** 500 GROW in wallet, 500 GROW in vault

### Step 6 — Create a Stream (Streams Page)

1. Navigate to **Streams** page from the sidebar.
2. Click **"Create Stream"** (green button, top right).
3. Token should default to **GROW Token**.
4. Enter:
   - **Receiver Address**: Another Vara testnet address (can be your own second account, or any valid address like `kGkxsghNyASLV82VLsUe6PsqM3LzDfZ8zG885rTBKreVPjoUy`)
   - **Flow Rate**: `0.001` (preset button available) — this streams 0.001 GROW per second
   - **Initial Deposit**: `10` (preset button available) — this funds 10 GROW for the stream
5. The summary should show:
   - Stream duration: ~2h 46m
   - Daily outflow: 86.4 GROW/day
   - Min buffer (1h): 3.6 GROW
6. Click **"Create Stream"**.
7. Approve the wallet transaction.
8. Wait for confirmation toast.
9. The stream should appear in the list with status **Active** and a real-time progress bar.

**Expected result:** Active stream visible with real-time counter

### Step 7 — Stream Actions

With an active stream visible:

- **Sender actions** (if you are the sender):
  - **Pause** — Click pause icon. Stream stops counting.
  - **Resume** — Click play icon on a paused stream. Counting resumes.
  - **Top Up** — Enter amount and click "Top Up" to add more deposit.
  - **Stop** — Click stop icon. Stream ends, unstreamed funds returned.

- **Receiver actions** (if you are the receiver):
  - **Withdraw** — Click "Withdraw" to claim streamed tokens.

### Step 8 — Withdraw from Vault (GROW Page)

1. Go back to **GROW Token** page.
2. Click the **Vault** tab.
3. In the **Withdraw** section, enter an amount (or click "Max").
4. Click **"Withdraw from Vault"**.
5. Approve transaction.
6. Your **Wallet Balance** should increase.

### Step 9 — Transfer GROW (Optional)

1. On the GROW Token page, click the **Transfer** tab.
2. Enter a recipient address and amount (in GROW).
3. Click **"Send"**.
4. This is a direct wallet-to-wallet transfer, not a stream.

---

## Flow 2: Native VARA Streaming

1. On the **Streams** page, click "Create Stream".
2. Switch token to **"Native VARA"**.
3. Enter receiver, flow rate (in raw units — 1 VARA = 10^12 units), and deposit.
4. This streams native VARA instead of GROW tokens.
5. For VARA, you need to deposit native VARA into the vault first via the **Vault** page.

---

## Flow 3: Vault Page (Direct Vault Management)

1. Navigate to the **Vault** page from the sidebar.
2. This shows your vault balance for the zero token (native VARA).
3. You can deposit/withdraw VARA here.
4. Toggle between **VARA** and **VFT Token** modes.

---

## What to Verify at Each Step

| Step | What to Check |
|------|--------------|
| Connect Wallet | Address shows in header, sidebar loads |
| Mint GROW | Wallet balance updates after ~10s |
| Approve | Allowance value increases |
| Deposit | Wallet decreases, vault available increases |
| Create Stream | Stream appears in list with Active status |
| Stream Running | Progress bar moves, "Total Streamed" increases every second |
| Pause/Resume | Status changes, timer stops/starts |
| Withdraw (receiver) | Toast confirms withdrawal amount |
| Withdraw from Vault | Wallet balance increases |
| Transfer | Recipient balance increases (verify via GROW Token page) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Signing failed" or no wallet popup | Make sure the wallet extension is unlocked and connected to the app |
| Balance shows 0 after transaction | Click the refresh icon — balances update after ~3 seconds |
| Transaction fails | Ensure you have enough VARA for gas (~0.5 VARA per transaction) |
| Faucet mint fails | Only the token admin (deployer) can mint — contact the deployer |
| Stream create fails | Ensure deposit covers the minimum buffer (flow_rate × 3600 seconds) |
| "Approve" then "Deposit" still fails | Approve amount must be >= deposit amount |
| Page shows "Connecting to Vara..." indefinitely | Refresh the page, check if wallet extension is installed |

---

## Key Contract Addresses (Vara Testnet)

| Contract | Program ID |
|----------|-----------|
| GROW Token | `0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36` |
| TokenVault | `0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b` |
| StreamCore | `0x2e7c2064344449504c9c638261bab78238ae50b8a47faac5beae2d1915d70a56` |

## API Base URL

`https://growstreams-core-production.up.railway.app`

---

## Quick Smoke Test (5 minutes)

If you're short on time, do this minimal flow:

1. Connect wallet
2. Go to GROW Token → Faucet → Mint 1,000 GROW
3. Approve tab → Approve 1,000 GROW
4. Vault tab → Deposit 100 GROW
5. Go to Streams → Create Stream (0.001 GROW/s, 10 GROW deposit, any receiver)
6. Watch the stream progress bar move in real-time

If all 6 steps work without errors, the core flow is functional.
