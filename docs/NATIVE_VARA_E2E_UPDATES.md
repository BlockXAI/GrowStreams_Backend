# Native VARA E2E Test Updates

## Summary

The E2E test suite has been updated to test the new native VARA streaming architecture where TokenVault and StreamCore are wired together via cross-contract calls. Previously, tests used placeholder token operations that didn't interact with the vault. Now, the tests validate the complete flow:

1. User deposits native VARA into TokenVault using `deposit_native()` with `msg::value()`
2. User creates a stream via StreamCore, which calls `TokenVault.allocate_to_stream()`
3. Receiver withdraws from stream, triggering `TokenVault.transfer_to_receiver()`
4. Native VARA is transferred to receiver's account

## Why Native VARA E2E Changes Were Required

### Previous Architecture Issues
- **No actual token transfers**: Tests called `DepositTokens()` but no real funds moved
- **No vault integration**: StreamCore didn't communicate with TokenVault
- **Placeholder logic**: `transfer_to_receiver()` had only a comment, no implementation
- **No native VARA support**: System assumed ERC20-like tokens only

### New Architecture Requirements
- **Cross-contract messaging**: StreamCore must call TokenVault methods during stream lifecycle
- **Native VARA handling**: TokenVault must accept `msg::value()` and send native transfers
- **Wired contracts**: TokenVault needs StreamCore address, StreamCore needs TokenVault address
- **End-to-end validation**: Tests must verify actual balance changes on-chain

## New Helpers Added

### 1. `depositNativeToVault(api, keyring, vaultId, value)`

**Purpose**: Deposit native VARA to TokenVault with attached value

**Implementation**:
```javascript
async function depositNativeToVault(api, keyring, vaultId, value) {
  const payload = buildPayload('VaultService', 'DepositNative');
  return await sendMessage(api, keyring, vaultId, payload, value);
}
```

**Usage**:
```javascript
// Deposit 10 VARA to vault
await depositNativeToVault(api, keyring, TOKEN_VAULT_ID, 10_000_000_000_000n);
```

**Parameters**:
- `api`: GearApi instance
- `keyring`: Account keyring for signing
- `vaultId`: TokenVault program ID
- `value`: Amount in picoVARA (1 VARA = 10^12 picoVARA)

**Returns**: Promise resolving to transaction reply hex

---

### 2. `getBalance(api, address)`

**Purpose**: Query native VARA balance of an account

**Implementation**:
```javascript
async function getBalance(api, address) {
  const { data: { free } } = await api.query.system.account(address);
  return BigInt(free.toString());
}
```

**Usage**:
```javascript
// Get receiver balance before withdrawal
const balanceBefore = await getBalance(api, RECEIVER_SS58);
console.log(`Balance: ${balanceBefore / 1_000_000_000_000n} VARA`);
```

**Parameters**:
- `api`: GearApi instance
- `address`: SS58 address or hex address

**Returns**: BigInt balance in picoVARA

---

### 3. Modified `sendMessage(api, keyring, programId, payload, value = 0)`

**Changes**: Added optional `value` parameter to support native VARA transfers

**Previous signature**:
```javascript
async function sendMessage(api, keyring, programId, payload)
```

**New signature**:
```javascript
async function sendMessage(api, keyring, programId, payload, value = 0)
```

**Impact**: All existing calls remain compatible (default `value = 0`), but now supports:
```javascript
// Send message with 1 VARA attached
await sendMessage(api, keyring, programId, payload, 1_000_000_000_000n);
```

## New Test Flow: `native_vara_stream_lifecycle`

### Test Structure

**Location**: After TokenVault tests, before SplitsRouter tests

**Test ID**: `[NATIVE-1]` through `[NATIVE-7]`

### Step-by-Step Flow

#### Step 1: Deposit Native VARA
```javascript
[NATIVE-1] Deposit 10 VARA to TokenVault
```
- Calls `TokenVault.deposit_native()` with `msg::value() = 10 VARA`
- Validates transaction succeeds without panic
- Waits for finalization

#### Step 2: Verify Vault Balance
```javascript
[NATIVE-2] Verify vault balance
```
- Queries `TokenVault.get_balance(owner, ActorId::zero())`
- Decodes SCALE-encoded `VaultBalance` struct
- Asserts `total_deposited >= 10 VARA`

#### Step 3: Create Native VARA Stream
```javascript
[NATIVE-3] Create native VARA stream
```
- Calls `StreamCore.create_stream(receiver, ActorId::zero(), flow_rate, initial_deposit)`
- `ActorId::zero()` represents native VARA token
- StreamCore internally calls `TokenVault.allocate_to_stream()`
- Verifies stream ID incremented

#### Step 4: Wait for Streaming
```javascript
[NATIVE-4] Wait 2 seconds for streaming...
```
- Simulates time passage (2 seconds)
- Allows stream to accrue withdrawable balance
- In production, time-based accrual happens automatically

#### Step 5: Check Withdrawable Balance
```javascript
[NATIVE-5] Check withdrawable balance
```
- Queries `StreamCore.get_withdrawable_balance(stream_id)`
- Validates `withdrawable > 0` after time passage
- Logs withdrawable amount in VARA

#### Step 6: Withdraw from Stream
```javascript
[NATIVE-6] Withdraw from stream
```
- Records receiver balance before withdrawal
- Calls `StreamCore.withdraw(stream_id)`
- StreamCore internally calls `TokenVault.transfer_to_receiver()`
- TokenVault sends native VARA via `msg::send(receiver, b"", amount)`
- Records receiver balance after withdrawal
- **Asserts receiver balance increased**

#### Step 7: Verify Stream State
```javascript
[NATIVE-7] Verify stream withdrawn amount
```
- Queries `StreamCore.get_stream(stream_id)`
- Validates stream data updated correctly
- Confirms `stream.withdrawn` field incremented

### Expected Output

```
--- Native VARA Stream Lifecycle ---

[NATIVE-1] Deposit 10 VARA to TokenVault
  PASS: DepositNative succeeded
[NATIVE-2] Verify vault balance
  PASS: Vault balance >= 10 VARA
[NATIVE-3] Create native VARA stream
  PASS: Native stream created (ID=1)
[NATIVE-4] Wait 2 seconds for streaming...
[NATIVE-5] Check withdrawable balance
  Withdrawable: 0.002 VARA
  PASS: Withdrawable balance > 0
[NATIVE-6] Withdraw from stream
  Receiver balance before: 5.1234 VARA
  Receiver balance after: 5.1254 VARA
  PASS: Receiver balance increased after withdraw
[NATIVE-7] Verify stream withdrawn amount
  PASS: Stream data retrieved after withdrawal
```

## Modified Files

### `scripts/deploy-js/e2e-test.mjs`

**Changes**:
1. Added `depositNativeToVault()` helper function
2. Added `getBalance()` helper function
3. Modified `sendMessage()` to accept optional `value` parameter
4. Added `native_vara_stream_lifecycle` test section (7 test cases)
5. Marked test `[3] Create stream` as SKIPPED (replaced by native test)
6. Marked test `[14] DepositTokens` as SKIPPED (token-based)
7. Updated test `[17] Deposit blocked while paused` to use `DepositNative`

**Lines modified**: ~120 lines added, ~30 lines modified

**New test count**: +7 native VARA tests, +2 skipped tests

## How to Run E2E Tests

### Prerequisites

1. **Deployed contracts**: TokenVault and StreamCore must be deployed
2. **Wired contracts**: Contracts must be wired together:
   ```bash
   node scripts/deploy-js/wire-contracts.mjs
   ```
3. **Environment variables**: `.env` must contain:
   - `VARA_SEED`: Your account seed phrase
   - `VARA_NODE`: Vara network endpoint (default: testnet)
4. **Testnet VARA**: Account must have sufficient balance (>15 VARA recommended)

### Run All Tests

```bash
node scripts/deploy-js/e2e-test.mjs
```

**Expected output**:
```
=== GrowStreams V2 — E2E Test Suite ===

StreamCore:        0xabcd...
TokenVault:        0x1234...
Node: wss://testnet.vara.network

Account: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
Balance: 12.3456 VARA

--- StreamCore Tests ---
[1] Query StreamCore config
  PASS: GetConfig returns data
...

--- Native VARA Stream Lifecycle ---
[NATIVE-1] Deposit 10 VARA to TokenVault
  PASS: DepositNative succeeded
...

========================================
RESULTS: 45 passed, 0 failed, 2 skipped
========================================
```

### Run with Receiver Address (Recommended)

To verify actual balance changes, provide a receiver address:

```bash
node scripts/deploy-js/e2e-test.mjs 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
```

**Benefits**:
- Test `[NATIVE-6]` will verify receiver balance increased
- More comprehensive validation of native transfers
- Confirms end-to-end flow works correctly

### Debugging Failed Tests

**Issue**: `DepositNative failed: Vault is paused`  
**Solution**: Run `EmergencyUnpause` first or check test `[18]`

**Issue**: `CreateStream failed: Insufficient balance`  
**Solution**: Increase deposit amount or ensure vault has funds

**Issue**: `Withdraw failed: Nothing to withdraw`  
**Solution**: Increase wait time in `[NATIVE-4]` or check stream flow rate

**Issue**: `Receiver balance did not increase`  
**Solution**: Verify contracts are wired correctly, check `deploy-state.json`

## Test Coverage

### Native VARA Flow ✅
- Deposit native VARA with `msg::value()`
- Create stream with `ActorId::zero()` token
- Cross-contract call: `allocate_to_stream()`
- Time-based accrual of withdrawable balance
- Withdraw triggering `transfer_to_receiver()`
- Native VARA transfer via `msg::send()`
- Balance verification on receiver account

### Token-Based Flow ⏭️ (Skipped)
- `DepositTokens()` - Skipped (token-based)
- ERC20-like token transfers - Not implemented yet
- Token contract integration - Future work

### Vault Pause/Unpause ✅
- Emergency pause blocks deposits
- Emergency unpause restores functionality
- Tested with native deposits

### Stream Lifecycle ✅
- Create, pause, resume, update, stop, deposit
- Sender/receiver stream queries
- Active stream count tracking

## Future Enhancements

1. **Multi-token support**: Add tests for ERC20-like tokens once implemented
2. **Liquidation tests**: Test buffer exhaustion and auto-pause
3. **Permission-based streams**: Test delegated stream creation
4. **Batch operations**: Test multiple streams in parallel
5. **Gas optimization**: Measure and optimize cross-contract call costs

## Related Documentation

- `DEPLOYMENT_GUIDE.md` - How to deploy and wire contracts
- `contracts/token-vault/src/lib.rs` - TokenVault implementation
- `contracts/stream-core/src/lib.rs` - StreamCore implementation
- `scripts/deploy-js/wire-contracts.mjs` - Contract wiring automation

## Troubleshooting

### Common Errors

**Error**: `MODULE_NOT_FOUND: dotenv`  
**Fix**: `npm install dotenv`

**Error**: `Missing core program IDs in deploy-state.json`  
**Fix**: Run `node scripts/deploy-js/deploy.mjs` first

**Error**: `Gas calculation failed`  
**Fix**: Ensure account has sufficient VARA balance (>1 VARA)

**Error**: `Only admin can set token_vault`  
**Fix**: Use the same account that deployed the contracts

### Verification Steps

1. **Check contracts deployed**:
   ```bash
   cat deploy-state.json | grep programId
   ```

2. **Check contracts wired**:
   ```bash
   # Query StreamCore config, verify token_vault != 0x000...
   # Query TokenVault config, verify stream_core != 0x000...
   ```

3. **Check account balance**:
   ```bash
   # Visit Gear IDEA explorer
   # https://idea.gear-tech.io/programs?node=wss://testnet.vara.network
   ```

## Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| `sendMessage()` | Added `value` parameter | Supports native VARA transfers |
| `depositNativeToVault()` | New helper | Simplifies native deposits |
| `getBalance()` | New helper | Enables balance verification |
| Test `[3]` | Marked SKIPPED | Replaced by native test |
| Test `[14]` | Marked SKIPPED | Token-based, not applicable |
| Test `[17]` | Updated to native | Uses `DepositNative` instead |
| `native_vara_stream_lifecycle` | New test section | 7 comprehensive tests |

**Total**: +2 helpers, +7 tests, +2 skipped, ~150 lines added
