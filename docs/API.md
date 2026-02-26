# GrowStreams REST API Documentation

> **Base URL:** `https://growstreams-core-production.up.railway.app`

All amounts are in raw token units (12 decimals). `1 GROW = 1_000_000_000_000` units.

POST endpoints accept an optional `"mode": "payload"` field — when set, the API returns the SCALE-encoded payload for client-side wallet signing instead of executing server-side.

---

## Table of Contents

1. [Health Check](#health-check)
2. [GROW Token](#grow-token)
   - [Metadata](#token-metadata)
   - [Balances & Allowance](#balances--allowance)
   - [Faucet](#faucet)
   - [Transfer / Approve / Mint / Burn](#token-operations)
3. [Token Vault](#token-vault)
   - [Config & Status](#vault-config--status)
   - [Balance](#vault-balance)
   - [Deposit & Withdraw](#vault-deposit--withdraw)
4. [Streams](#streams)
   - [Query Streams](#query-streams)
   - [Create Stream](#create-stream)
   - [Stream Lifecycle](#stream-lifecycle)
5. [Full E2E Flow (curl)](#full-e2e-flow)
6. [Admin Endpoints](#admin-endpoints)

---

## Health Check

```bash
curl https://growstreams-core-production.up.railway.app/health
```

---

## GROW Token

### Token Metadata

```bash
# Get token name, symbol, decimals, total supply, and program ID
curl https://growstreams-core-production.up.railway.app/api/grow-token/meta
```

**Response:**
```json
{
  "name": "GrowStreams Token",
  "symbol": "GROW",
  "decimals": 12,
  "totalSupply": "50000000000000000",
  "programId": "0x05a2a482..."
}
```

### Total Supply

```bash
curl https://growstreams-core-production.up.railway.app/api/grow-token/total-supply
```

### Balances & Allowance

```bash
# Check GROW balance for an account (use hex-encoded ActorId)
curl https://growstreams-core-production.up.railway.app/api/grow-token/balance/0xYOUR_HEX_ADDRESS

# Check allowance (how much spender can spend on behalf of owner)
curl https://growstreams-core-production.up.railway.app/api/grow-token/allowance/0xOWNER_HEX/0xSPENDER_HEX
```

**Response (balance):**
```json
{
  "account": "0x...",
  "balance": "5000000000000000"
}
```

### Faucet

The faucet mints **1,000 GROW** per request with a 5-minute rate limit per address.

```bash
# Request GROW tokens from faucet
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/faucet \
  -H "Content-Type: application/json" \
  -d '{"to": "0xYOUR_HEX_ADDRESS"}'
```

**Response:**
```json
{
  "success": true,
  "to": "0x...",
  "amount": "1000000000000000",
  "amountHuman": "1,000 GROW",
  "blockHash": "0x..."
}
```

```bash
# Check faucet configuration
curl https://growstreams-core-production.up.railway.app/api/grow-token/faucet/config
```

### Token Operations

```bash
# Transfer GROW tokens
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0xRECIPIENT_HEX",
    "amount": "1000000000000"
  }'

# Approve spender (e.g. TokenVault) to spend your GROW
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/approve \
  -H "Content-Type: application/json" \
  -d '{
    "spender": "0xTOKEN_VAULT_PROGRAM_ID",
    "amount": "100000000000000000"
  }'

# Transfer on behalf of another account (requires prior approval)
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/transfer-from \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0xOWNER_HEX",
    "to": "0xRECIPIENT_HEX",
    "amount": "1000000000000"
  }'

# Mint tokens (admin only)
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/mint \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0xRECIPIENT_HEX",
    "amount": "5000000000000"
  }'

# Burn tokens from your own balance
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/burn \
  -H "Content-Type: application/json" \
  -d '{"amount": "500000000000"}'
```

**Payload mode** — get encoded payload for client-side signing:
```bash
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/approve \
  -H "Content-Type: application/json" \
  -d '{
    "spender": "0xVAULT_ID",
    "amount": "100000000000000000",
    "mode": "payload"
  }'
# Returns: { "payload": "0x..." }
```

---

## Token Vault

The vault holds tokens in escrow for streaming. Users deposit GROW into the vault, which then allocates funds to active streams.

### Vault Config & Status

```bash
# Get vault configuration
curl https://growstreams-core-production.up.railway.app/api/vault/config

# Check if vault is paused
curl https://growstreams-core-production.up.railway.app/api/vault/paused
```

### Vault Balance

```bash
# Get vault balance for a specific owner + token pair
curl https://growstreams-core-production.up.railway.app/api/vault/balance/0xOWNER_HEX/0xGROW_TOKEN_ID

# Get stream allocation amount
curl https://growstreams-core-production.up.railway.app/api/vault/allocation/1
```

**Response:**
```json
{
  "owner": "0x...",
  "token": "0x...",
  "total_deposited": "4000000000000",
  "total_allocated": "3601000000",
  "available": "3996399000000"
}
```

### Vault Deposit & Withdraw

```bash
# Deposit GROW tokens into vault (requires prior approve on GROW token)
curl -X POST https://growstreams-core-production.up.railway.app/api/vault/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "token": "0xGROW_TOKEN_ID",
    "amount": "4000000000000"
  }'

# Withdraw available (non-allocated) GROW from vault
curl -X POST https://growstreams-core-production.up.railway.app/api/vault/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "token": "0xGROW_TOKEN_ID",
    "amount": "1000000000000"
  }'

# Deposit native VARA into vault
curl -X POST https://growstreams-core-production.up.railway.app/api/vault/deposit-native \
  -H "Content-Type: application/json" \
  -d '{"amount": "1000000000000"}'

# Withdraw native VARA from vault
curl -X POST https://growstreams-core-production.up.railway.app/api/vault/withdraw-native \
  -H "Content-Type: application/json" \
  -d '{"amount": "500000000000"}'
```

---

## Streams

### Query Streams

```bash
# Get stream configuration (min buffer, max streams, etc.)
curl https://growstreams-core-production.up.railway.app/api/streams/config

# Total number of streams created
curl https://growstreams-core-production.up.railway.app/api/streams/total

# Number of currently active streams
curl https://growstreams-core-production.up.railway.app/api/streams/active

# Get a specific stream by ID
curl https://growstreams-core-production.up.railway.app/api/streams/1

# Get withdrawable balance for a stream
curl https://growstreams-core-production.up.railway.app/api/streams/1/balance

# Get remaining buffer time for a stream
curl https://growstreams-core-production.up.railway.app/api/streams/1/buffer

# Get all streams where address is sender
curl https://growstreams-core-production.up.railway.app/api/streams/sender/0xSENDER_HEX

# Get all streams where address is receiver
curl https://growstreams-core-production.up.railway.app/api/streams/receiver/0xRECEIVER_HEX
```

### Create Stream

```bash
curl -X POST https://growstreams-core-production.up.railway.app/api/streams \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "0xRECEIVER_HEX_ADDRESS",
    "token": "0xGROW_TOKEN_ID",
    "flowRate": "1000000",
    "initialDeposit": "3601000000"
  }'
```

**Parameters:**
- `receiver` — hex-encoded ActorId of the stream recipient
- `token` — hex-encoded program ID of the token (GROW token ID)
- `flowRate` — tokens per second in raw units (e.g. `1000000` = 0.000001 GROW/sec)
- `initialDeposit` — must cover at least `flowRate * min_buffer_seconds` (default 3600s)

### Stream Lifecycle

```bash
# Pause a stream (sender only)
curl -X POST https://growstreams-core-production.up.railway.app/api/streams/1/pause

# Resume a paused stream (sender only)
curl -X POST https://growstreams-core-production.up.railway.app/api/streams/1/resume

# Add more deposit to a stream
curl -X POST https://growstreams-core-production.up.railway.app/api/streams/1/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": "2000000000000"}'

# Withdraw accrued tokens (receiver only)
curl -X POST https://growstreams-core-production.up.railway.app/api/streams/1/withdraw

# Update flow rate (sender only)
curl -X PUT https://growstreams-core-production.up.railway.app/api/streams/1 \
  -H "Content-Type: application/json" \
  -d '{"flowRate": "2000000"}'

# Stop a stream permanently (sender only)
curl -X POST https://growstreams-core-production.up.railway.app/api/streams/1/stop

# Liquidate an underfunded stream (anyone can call)
curl -X POST https://growstreams-core-production.up.railway.app/api/streams/1/liquidate
```

---

## Full E2E Flow

This mirrors the tested flow from `scripts/deploy-js/e2e-grow-token.mjs`. Replace placeholder addresses with real hex-encoded ActorIds.

```bash
BASE="https://growstreams-core-production.up.railway.app"
GROW_TOKEN="0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36"
VAULT_ID="0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b"
SENDER="0xYOUR_HEX_ADDRESS"
RECEIVER="0xRECEIVER_HEX_ADDRESS"

# ─── Step 1: Check token metadata ───
curl "$BASE/api/grow-token/meta"

# ─── Step 2: Get GROW from faucet (1,000 GROW) ───
curl -X POST "$BASE/api/grow-token/faucet" \
  -H "Content-Type: application/json" \
  -d "{\"to\": \"$SENDER\"}"

# ─── Step 3: Check your balance ───
curl "$BASE/api/grow-token/balance/$SENDER"

# ─── Step 4: Approve vault to spend your GROW (100 GROW) ───
curl -X POST "$BASE/api/grow-token/approve" \
  -H "Content-Type: application/json" \
  -d "{\"spender\": \"$VAULT_ID\", \"amount\": \"100000000000000\"}"

# ─── Step 5: Verify allowance ───
curl "$BASE/api/grow-token/allowance/$SENDER/$VAULT_ID"

# ─── Step 6: Deposit GROW into vault (4 GROW) ───
curl -X POST "$BASE/api/vault/deposit" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$GROW_TOKEN\", \"amount\": \"4000000000000\"}"

# ─── Step 7: Check vault balance ───
curl "$BASE/api/vault/balance/$SENDER/$GROW_TOKEN"

# ─── Step 8: Create a GROW stream ───
# Flow rate: 1,000,000 units/sec (0.000001 GROW/sec)
# Deposit: flowRate * 3601 = 3,601,000,000 units
curl -X POST "$BASE/api/streams" \
  -H "Content-Type: application/json" \
  -d "{
    \"receiver\": \"$RECEIVER\",
    \"token\": \"$GROW_TOKEN\",
    \"flowRate\": \"1000000\",
    \"initialDeposit\": \"3601000000\"
  }"

# ─── Step 9: Check your streams ───
curl "$BASE/api/streams/sender/$SENDER"

# ─── Step 10: Wait a few seconds, check withdrawable balance ───
sleep 5
curl "$BASE/api/streams/1/balance"

# ─── Step 11: Get stream details ───
curl "$BASE/api/streams/1"

# ─── Step 12: Receiver withdraws accrued tokens ───
curl -X POST "$BASE/api/streams/1/withdraw"

# ─── Step 13: Withdraw remaining GROW from vault ───
curl -X POST "$BASE/api/vault/withdraw" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$GROW_TOKEN\", \"amount\": \"1000000000000\"}"

# ─── Step 14: Direct transfer (1 GROW) ───
curl -X POST "$BASE/api/grow-token/transfer" \
  -H "Content-Type: application/json" \
  -d "{\"to\": \"$RECEIVER\", \"amount\": \"1000000000000\"}"

# ─── Step 15: Burn tokens (0.5 GROW) ───
curl -X POST "$BASE/api/grow-token/burn" \
  -H "Content-Type: application/json" \
  -d '{"amount": "500000000000"}'
```

---

## Admin Endpoints

These manage the faucet whitelist and mode.

```bash
# Get admin info
curl https://growstreams-core-production.up.railway.app/api/grow-token/admin/info

# Get whitelist
curl https://growstreams-core-production.up.railway.app/api/grow-token/admin/whitelist

# Add address to whitelist
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/admin/whitelist \
  -H "Content-Type: application/json" \
  -d '{"address": "0xSOME_ADDRESS"}'

# Remove address from whitelist
curl -X DELETE https://growstreams-core-production.up.railway.app/api/grow-token/admin/whitelist/0xSOME_ADDRESS

# Set faucet mode ("public" or "whitelist")
curl -X POST https://growstreams-core-production.up.railway.app/api/grow-token/admin/faucet-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "public"}'

# Emergency pause vault (admin only)
curl -X POST https://growstreams-core-production.up.railway.app/api/vault/pause

# Unpause vault (admin only)
curl -X POST https://growstreams-core-production.up.railway.app/api/vault/unpause
```

---

## Token Units Reference

| Human Amount | Raw Units |
|---|---|
| 0.000001 GROW | `1_000_000` |
| 0.001 GROW | `1_000_000_000` |
| 1 GROW | `1_000_000_000_000` |
| 100 GROW | `100_000_000_000_000` |
| 1,000 GROW | `1_000_000_000_000_000` |

## Error Responses

All errors return JSON with an `error` field:

```json
{ "error": "Missing: receiver, token, flowRate, initialDeposit" }
```

| Status | Meaning |
|---|---|
| 400 | Missing or invalid parameters |
| 403 | Address not whitelisted (when faucet in whitelist mode) |
| 404 | Stream not found |
| 429 | Rate limited (faucet: 5 min cooldown) |
| 500 | Contract call or server error |
