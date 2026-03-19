# Criterion 1: StreamAgreement Template

**Requirement**: Per-second token accrual with sender/receiver parties

**Status**: ✅ **VERIFIED**

---

## Implementation

**File**: `daml-contracts/daml/StreamCore.daml` (Lines 30-148)

```daml
template StreamAgreement
  with
    streamId    : Int
    sender      : Party
    receiver    : Party
    admin       : Party
    flowRate    : Decimal  -- GROW per second
    startTime   : Time
    lastUpdate  : Time
    deposited   : Decimal
    withdrawn   : Decimal
    status      : StreamStatus
  where
    signatory sender
    observer  receiver, admin
    
    ensure flowRate > 0.0 && deposited >= 0.0 && withdrawn >= 0.0 && withdrawn <= deposited
```

---

## Key Features

### 1. Per-Second Accrual ✅
- **flowRate**: Decimal tokens per second
- **lastUpdate**: Timestamp of last state change
- **Accrual calculation**: `flowRate * secondsElapsed`

### 2. Party Authorization ✅
- **Signatory**: sender (controls stream)
- **Observer**: receiver, admin (can view state)
- **Multi-party**: Supports sender/receiver model

### 3. State Management ✅
- **deposited**: Total tokens deposited
- **withdrawn**: Total tokens withdrawn
- **status**: Active | Paused | Stopped

---

## Verification Evidence

### Test: testStreamLifecycle
**File**: `daml-contracts/daml/Test/StreamCoreTest.daml` (Lines 12-62)

**Test Output**:
```
daml/Test/StreamCoreTest.daml:testStreamLifecycle: ok, 1 active contracts, 4 transactions.
```

**Test demonstrates**:
1. Stream creation with sender (Alice) and receiver (Bob)
2. Per-second accrual (0.1 GROW/second)
3. Withdrawal after 100 seconds (10 GROW accrued)
4. Stream stop after 500 seconds (50 GROW total)

### Contract on Canton Ledger
**Deployed**: March 19, 2026  
**Canton Sandbox**: localhost:6865  
**Parties**:
- Admin: `party-974f4e44-eb56-4d52-b912-9d0b43211b22::12200c904c539b9006bc40adf3c3727653320c5951a7ba3e23ece0b79f011257e614`
- Alice: `party-01f28f51-139f-4d3b-99e7-cccf9eeeb699::12200c904c539b9006bc40adf3c3727653320c5951a7ba3e23ece0b79f011257e614`
- Bob: `party-1939a953-f183-4e40-a268-5132ba44fa47::12200c904c539b9006bc40adf3c3727653320c5951a7ba3e23ece0b79f011257e614`

**Verification**: See `contract-ids.txt` for full party list

---

## Acceptance Criteria Met

- ✅ Template defined with sender/receiver parties
- ✅ Per-second accrual mechanism implemented
- ✅ Proper authorization (signatory/observer)
- ✅ State management (deposited/withdrawn)
- ✅ Deployed on Canton sandbox
- ✅ Tests passing (100%)

---

**Criterion 1: COMPLETE** ✅
