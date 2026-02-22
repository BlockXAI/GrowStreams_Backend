# GrowStreams V2 — Security Model

## Threat Model

### Assets at Risk
- Deposited tokens in TokenVault (sender funds)
- Accrued but unwithdrawn tokens (receiver entitlements)
- Stream state integrity (flow rates, balances)

### Threat Actors
- Malicious sender: attempts to withdraw after committing to a stream
- Malicious receiver: attempts to withdraw more than accrued
- Malicious third party: attempts to manipulate streams or drain vault
- Compromised admin: misuse of emergency controls

---

## Security Invariants

### 1. Solvency Guarantee
```
For every active stream:
  deposited ≥ streamed ≥ withdrawn
  remaining_buffer = deposited - total_streamed ≥ 0
```

**Enforcement:** 
- Initial deposit must cover `flow_rate × min_buffer_seconds`
- Liquidation mechanism pauses streams approaching insolvency
- Withdrawal capped at `min(total_streamed, deposited) - withdrawn`

### 2. Authorization
```
CreateStream, UpdateStream, StopStream, PauseStream, Deposit → sender only
Withdraw → receiver only
Liquidate → anyone (incentivized public good)
EmergencyPause/Unpause → admin only
AllocateToStream, ReleaseFromStream, TransferToReceiver → StreamCore only
```

### 3. No Double-Spend
- TokenVault tracks per-stream allocations separately
- Release and transfer reduce allocation atomically
- Total allocated across all streams ≤ total deposited per (owner, token)

### 4. No Reentrancy
- State updates happen before external calls (checks-effects-interactions)
- Vara's actor model provides isolation between message handlers

### 5. Time Manipulation Resistance
- Uses `block_timestamp` (consensus-agreed time)
- Minimum buffer provides safety margin against timestamp variance
- Settlement is lazy; no time-dependent race conditions

---

## Buffer / Liquidation Model

### Parameters
- `min_buffer_seconds`: Minimum seconds of runway required (default: 3600 = 1 hour)
- Configurable by admin at deployment

### Liquidation Flow
1. Stream buffer drops below `flow_rate × min_buffer_seconds`
2. Any actor calls `Liquidate(stream_id)`
3. Contract settles accrual, pauses stream
4. Sender can top up buffer and resume, or stop and claim refund

### Why This Works
- Prevents "promise more than you have" scenarios
- Receivers always receive tokens backed by real deposits
- Liquidation is permissionless — no reliance on a single keeper

---

## Emergency Controls

### Emergency Pause
- Admin can pause the entire TokenVault
- All deposits, withdrawals, allocations, and transfers are halted
- Streams continue accruing (state changes still happen) but no token movement
- Used if a critical vulnerability is discovered

### Recovery
- Admin unpause resumes normal operations
- No funds are lost during pause — state is preserved
- Consider timelock / multisig for admin key in production

---

## Audit Checklist

### Pre-Deployment
- [ ] All invariants verified with unit tests
- [ ] Fuzz testing for edge cases (zero flow rate, max u128, same sender/receiver)
- [ ] Static analysis (clippy, cargo audit)
- [ ] Manual review of settlement math (overflow, rounding)
- [ ] Test liquidation edge cases (exactly at threshold, just below, just above)
- [ ] Test permission delegation + revocation
- [ ] Verify emergency pause stops all token movements
- [ ] Check that stopped streams cannot be restarted

### Post-Deployment
- [ ] Monitor for unusual stream patterns (very high flow rates, rapid create/stop)
- [ ] Track liquidation events (should be rare)
- [ ] Verify indexer matches on-chain state
- [ ] Regular buffer health checks across all active streams

---

## Known Limitations (MVP)

1. **No keeper incentive:** Liquidation callers are not rewarded; may need to add incentive in V2+
2. **Single admin key:** Emergency controls depend on one admin; upgrade to multisig planned
3. **No formal verification:** Invariants tested but not formally proved
4. **Timestamp granularity:** Block timestamps have ~second granularity; micro-second precision not possible
5. **Token whitelist:** No token whitelist in MVP; any ActorId accepted as token (validate externally)
