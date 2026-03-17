# Native VARA Deployment Guide

This guide covers building, deploying, and wiring the modified TokenVault and StreamCore contracts with native VARA support.

## Prerequisites

1. **Rust & Cargo** installed (for building contracts)
2. **Node.js** v18+ (for deployment scripts)
3. **VARA testnet account** with funds
4. **.env file** configured with `VARA_SEED` and `VARA_NODE`

## Step 1: Build Contracts

**Note:** Building requires Rust/Cargo in a Linux environment (WSL, Linux VM, or native Linux).

### Option A: Using WSL/Linux with Rust installed

```bash
# In WSL or Linux terminal
cd /path/to/GrowStreams_Backend
./scripts/build.sh
```

### Option B: Build only modified contracts

```bash
# StreamCore
cargo build --manifest-path contracts/stream-core/Cargo.toml \
  --target wasm32-unknown-unknown --release

# TokenVault
cargo build --manifest-path contracts/token-vault/Cargo.toml \
  --target wasm32-unknown-unknown --release
```

### Copy artifacts

```bash
# Create artifacts directory
mkdir -p artifacts

# Copy optimized WASM files
cp contracts/target/wasm32-unknown-unknown/wasm32-unknown-unknown/release/stream_core.opt.wasm \
   artifacts/stream_core.opt.wasm

cp contracts/target/wasm32-unknown-unknown/wasm32-unknown-unknown/release/token_vault.opt.wasm \
   artifacts/token_vault.opt.wasm
```

**Expected output:**
- `artifacts/stream_core.opt.wasm` (~30-50 KB)
- `artifacts/token_vault.opt.wasm` (~20-40 KB)

---

## Step 2: Deploy Contracts

The deployment script has been modified to only deploy `token-vault` and `stream-core`.

```bash
node scripts/deploy-js/deploy.mjs
```

**Expected output:**
```
=== GrowStreams V2 — Deploy to Vara Testnet ===
Node: wss://testnet.vara.network
Target: all

Connecting to Vara testnet...
  Connected: Vara Testnet
  Account: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
  Balance: 12.3456 VARA

Deploying token-vault...
  WASM: .../artifacts/token_vault.opt.wasm
  Code size: 35.2 KB
  Calculating gas...
  Gas limit: 450000000000
  Program ID: 0x1234...abcd
  Code ID: 0x5678...ef01
  In block: 0x9abc...def2
  Finalized: 0x3456...7890
  Saved to deploy-state.json

Deploying stream-core...
  WASM: .../artifacts/stream_core.opt.wasm
  Code size: 42.1 KB
  Calculating gas...
  Gas limit: 500000000000
  Program ID: 0xabcd...1234
  Code ID: 0xef01...5678
  In block: 0xdef2...9abc
  Finalized: 0x7890...3456
  Saved to deploy-state.json

=== Deployment complete ===
```

**Capture these values:**
- **TokenVault Program ID**: `0x1234...abcd`
- **StreamCore Program ID**: `0xabcd...1234`

---

## Step 3: Wire Contracts

Run the wiring script to call the setter methods:

```bash
node scripts/deploy-js/wire-contracts.mjs
```

This script will:
1. Read program IDs from `deploy-state.json`
2. Call `TokenVault.set_stream_core(streamCoreId)`
3. Call `StreamCore.set_token_vault(tokenVaultId)`

**Expected output:**
```
=== GrowStreams V2 — Wire Contracts ===
Node: wss://testnet.vara.network

StreamCore: 0xabcd...1234
TokenVault: 0x1234...abcd

Connecting to Vara...
Account: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

1. Setting StreamCore address in TokenVault...
  Sending message to 0x1234...abcd...
  In block: 0xblock...hash1
  Finalized: 0xfinal...hash1
  ✅ Success! Block: 0xfinal...hash1

2. Setting TokenVault address in StreamCore...
  Sending message to 0xabcd...1234...
  In block: 0xblock...hash2
  Finalized: 0xfinal...hash2
  ✅ Success! Block: 0xfinal...hash2

=== Wiring Complete ===
```

---

## Step 4: Verify Deployment

### Check on Gear IDEA

Visit: https://idea.gear-tech.io/programs?node=wss://testnet.vara.network

Search for your program IDs and verify:
- Both contracts are deployed
- Both transactions (wiring) are finalized

### Query Contract Config

```bash
# Check StreamCore config includes vault address
node -e "
const { GearApi } = require('@gear-js/api');
(async () => {
  const api = await GearApi.create({ providerAddress: 'wss://testnet.vara.network' });
  // Query StreamCore.get_config() and verify token_vault field
  await api.disconnect();
})();
"
```

---

## Step 5: Test Native VARA Streaming

### Deposit Native VARA

```javascript
// Example: Deposit 1 VARA to TokenVault
const depositTx = api.message.send({
  destination: TOKEN_VAULT_ID,
  payload: encodeSailsCall('VaultService', 'DepositNative', ''),
  gasLimit: 50_000_000_000n,
  value: 1_000_000_000_000n, // 1 VARA in picoVARA
});
```

### Create Native VARA Stream

```javascript
// Create stream with ActorId::zero() as token
const createStreamPayload = encodeSailsCall(
  'StreamService',
  'CreateStream',
  encodeArgs({
    receiver: RECEIVER_ADDRESS,
    token: '0x0000000000000000000000000000000000000000000000000000000000000000',
    flowRate: 1_000_000_000n, // 1 VARA per second
    initialDeposit: 3600_000_000_000n, // 1 hour buffer
  })
);
```

### Withdraw Streamed VARA

```javascript
// Receiver withdraws accrued VARA
const withdrawPayload = encodeSailsCall(
  'StreamService',
  'Withdraw',
  encodeU64LE(streamId)
);
```

---

## Troubleshooting

### Build Errors

**Issue:** `cargo: command not found`  
**Solution:** Install Rust: https://rustup.rs

**Issue:** `error: linker 'rust-lld' not found`  
**Solution:** Run `rustup target add wasm32-unknown-unknown`

### Deployment Errors

**Issue:** `WASM not found`  
**Solution:** Run build script first and verify `artifacts/` directory exists

**Issue:** `Insufficient balance`  
**Solution:** Get testnet VARA from faucet: https://idea.gear-tech.io/programs

**Issue:** `Gas calculation failed`  
**Solution:** Script uses fallback gas limit (500B), should work automatically

### Wiring Errors

**Issue:** `Only admin can set token_vault`  
**Solution:** Ensure you're using the same account that deployed the contracts

**Issue:** `Program IDs not found`  
**Solution:** Run deployment script first to populate `deploy-state.json`

---

## Files Modified

### Contracts
- `contracts/stream-core/src/lib.rs` - Added vault wiring and cross-contract calls
- `contracts/token-vault/src/lib.rs` - Added native VARA support

### Scripts
- `scripts/deploy-js/deploy.mjs` - Modified to deploy only token-vault and stream-core
- `scripts/deploy-js/wire-contracts.mjs` - NEW: Wiring automation script

### Configuration
- `.env.example` - Template with all environment variables
- `.env` - Your actual configuration (DO NOT COMMIT)

---

## Next Steps

1. Run E2E tests with native VARA
2. Update API to handle native token (ActorId::zero())
3. Update frontend to support native VARA deposits/withdrawals
4. Deploy remaining contracts (splits-router, permission-manager, etc.)
5. Implement full cross-contract integration for all contracts
