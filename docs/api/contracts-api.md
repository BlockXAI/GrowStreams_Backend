# GrowStreams V2 — Smart Contract API Reference

## Contract Addresses

> **Testnet addresses will be populated after deployment.**

| Contract | Vara Testnet | Vara.eth Testnet |
|---|---|---|
| StreamCore | `TBD` | `TBD` |
| TokenVault | `TBD` | `TBD` |
| SplitsRouter | `TBD` | `TBD` |
| PermissionManager | `TBD` | `TBD` |
| BountyAdapter | `TBD` | `TBD` |
| IdentityRegistry (V1) | `TBD` | `TBD` |

---

## StreamCore

### Mutations

#### `CreateStream(receiver, token, flow_rate, initial_deposit) → Result<StreamId, String>`
Create a new payment stream.

| Param | Type | Description |
|---|---|---|
| `receiver` | `ActorId` | Address receiving the streamed tokens |
| `token` | `ActorId` | Fungible token program ID (e.g., USDC) |
| `flow_rate` | `u128` | Tokens per second in smallest unit |
| `initial_deposit` | `u128` | Amount deposited to fund the stream |

**Requirements:**
- `flow_rate > 0`
- `sender ≠ receiver`
- `initial_deposit ≥ flow_rate × min_buffer_seconds`

**Emits:** `StreamCreated`

---

#### `UpdateStream(stream_id, new_flow_rate) → Result<(), String>`
Change the flow rate of an active or paused stream.

**Requirements:** Caller must be sender. Stream must not be stopped.

**Emits:** `StreamUpdated`

---

#### `StopStream(stream_id) → Result<(), String>`
Permanently stop a stream. Remaining buffer is refunded to sender.

**Emits:** `StreamStopped`

---

#### `PauseStream(stream_id) → Result<(), String>`
Temporarily pause an active stream.

**Emits:** `StreamPaused`

---

#### `ResumeStream(stream_id) → Result<(), String>`
Resume a paused stream.

**Emits:** `StreamResumed`

---

#### `Deposit(stream_id, amount) → Result<(), String>`
Add more tokens to an existing stream's buffer.

**Emits:** `Deposited`

---

#### `Withdraw(stream_id) → Result<u128, String>`
Receiver withdraws all accrued tokens. Returns amount withdrawn.

**Emits:** `Withdrawn`

---

#### `Liquidate(stream_id) → Result<(), String>`
Anyone can call this to pause a stream whose buffer is below the minimum threshold.

**Emits:** `StreamLiquidated`

---

### Queries

| Method | Returns | Description |
|---|---|---|
| `GetStream(stream_id)` | `Option<Stream>` | Full stream details |
| `GetWithdrawableBalance(stream_id)` | `u128` | Amount receiver can withdraw now |
| `GetRemainingBuffer(stream_id)` | `u128` | Tokens remaining in sender's buffer |
| `GetSenderStreams(sender)` | `Vec<u64>` | All stream IDs for a sender |
| `GetReceiverStreams(receiver)` | `Vec<u64>` | All stream IDs for a receiver |
| `TotalStreams()` | `u64` | Total number of streams created |
| `ActiveStreams()` | `u64` | Currently active streams |
| `GetConfig()` | `Config` | Admin address, min buffer, next ID |

---

### Events

| Event | Fields |
|---|---|
| `StreamCreated` | id, sender, receiver, token, flow_rate, start_time, initial_deposit |
| `StreamUpdated` | id, old_flow_rate, new_flow_rate, updated_at |
| `StreamStopped` | id, stopped_at, sender_refund, total_streamed |
| `StreamPaused` | id, paused_at |
| `StreamResumed` | id, resumed_at |
| `Withdrawn` | id, receiver, amount, timestamp |
| `Deposited` | id, sender, amount, new_buffer |
| `StreamLiquidated` | id, liquidated_at, shortfall |

---

## TokenVault

### Mutations

| Method | Description |
|---|---|
| `DepositTokens(token, amount)` | Deposit fungible tokens into vault |
| `WithdrawTokens(token, amount)` | Withdraw unallocated tokens |
| `AllocateToStream(owner, token, amount, stream_id)` | Lock tokens for a stream (StreamCore only) |
| `ReleaseFromStream(owner, token, amount, stream_id)` | Unlock tokens on stream stop (StreamCore only) |
| `TransferToReceiver(token, receiver, amount, stream_id)` | Pay receiver (StreamCore only) |
| `EmergencyPause()` | Admin pause all operations |
| `EmergencyUnpause()` | Admin resume operations |

### Queries

| Method | Returns | Description |
|---|---|---|
| `GetBalance(owner, token)` | `VaultBalance` | Deposited, allocated, available |
| `GetStreamAllocation(stream_id)` | `u128` | Tokens allocated to a stream |
| `IsPaused()` | `bool` | Vault pause status |
| `GetConfig()` | `VaultConfig` | Admin, StreamCore address, pause state |

---

## Integration Example

```typescript
import { VaraEthApi, EthereumClient } from '@vara-eth/api';

// 1. Deposit tokens to vault
await vault.DepositTokens(USDC_PROGRAM_ID, 1_000_000); // 1 USDC

// 2. Create a stream (100 USDC/month ≈ 38,580 micro-USDC/sec)
const streamId = await streamCore.CreateStream(
  receiverAddress,
  USDC_PROGRAM_ID,
  38_580n,
  1_000_000n  // 1 USDC initial deposit
);

// 3. Check withdrawable balance
const balance = await streamCore.GetWithdrawableBalance(streamId);

// 4. Receiver withdraws
const amount = await streamCore.Withdraw(streamId);

// 5. Sender stops stream
await streamCore.StopStream(streamId);
```
