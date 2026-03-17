# Canton_Ginie Study Guide - Key Patterns for GrowStreams

> **Essential patterns from Canton_Ginie's proven Daml examples**  
> **Study these before implementing GrowToken and StreamCore**

---

## 📚 Overview

Canton_Ginie has **8 working Daml contract examples** that demonstrate proven patterns. We'll focus on the 2 most relevant for GrowStreams:

1. **`asset_transfer.daml`** → Pattern for GrowToken
2. **`escrow.daml`** → Pattern for StreamCore

---

## 🪙 Pattern 1: Asset Transfer (For GrowToken)

**File**: `@/Users/prakharmishra/Documents/canton/Canton_Ginie-main/backend/rag/daml_examples/asset_transfer.daml`

### Core Concepts

This example shows how to:
- ✅ Create fungible assets
- ✅ Transfer ownership
- ✅ Split assets into parts
- ✅ Merge assets together
- ✅ Propose transfers (two-party acceptance)

### Key Template: Asset

```daml
template Asset
  with
    owner       : Party
    issuer      : Party
    assetName   : Text
    quantity    : Decimal
    description : Text
  where
    signatory issuer
    observer  owner
    
    ensure quantity > 0.0
```

**What this teaches us**:
- `signatory issuer` - Issuer must approve asset creation
- `observer owner` - Owner can see the asset
- `ensure quantity > 0.0` - Validation rule

### Key Choice: ProposeTransfer

```daml
choice ProposeTransfer : ContractId TransferProposal
  with recipient : Party
  controller owner
  do
    create TransferProposal with
      asset = this
      sender = owner
      recipient = recipient
```

**What this teaches us**:
- Owner initiates transfer
- Creates a proposal (not immediate transfer)
- Recipient must accept (two-party pattern)

### Key Choice: Split

```daml
choice Split : (ContractId Asset, ContractId Asset)
  with splitAmount : Decimal
  controller owner
  do
    assertMsg "Split amount must be less than total" (splitAmount < quantity)
    part1 <- create this with quantity = splitAmount
    part2 <- create this with quantity = quantity - splitAmount
    return (part1, part2)
```

**What this teaches us**:
- Validate before action (`assertMsg`)
- Archive original (implicit when creating new)
- Return tuple of new contracts
- Immutability: old contract gone, two new contracts created

### Key Choice: Merge

```daml
choice Merge : ContractId Asset
  with otherAssetCid : ContractId Asset
  controller owner
  do
    otherAsset <- fetch otherAssetCid
    assertMsg "Same owner required" (otherAsset.owner == owner)
    assertMsg "Same issuer required" (otherAsset.issuer == issuer)
    archive otherAssetCid
    create this with quantity = quantity + otherAsset.quantity
```

**What this teaches us**:
- Use `fetch` to read another contract
- Validate compatibility
- Explicitly `archive` the other contract
- Create new merged contract

### Test Script Pattern

```daml
setup : Script ()
setup = script do
  -- Allocate parties
  alice <- allocateParty "Alice"
  bob <- allocateParty "Bob"
  issuer <- allocateParty "Issuer"
  
  -- Create asset
  assetCid <- submit issuer do
    createCmd Asset with
      owner = alice
      issuer = issuer
      assetName = "Gold"
      quantity = 100.0
      description = "100 oz of gold"
  
  -- Alice proposes transfer to Bob
  proposalCid <- submit alice do
    exerciseCmd assetCid ProposeTransfer with
      recipient = bob
  
  -- Bob accepts
  bobAssetCid <- submit bob do
    exerciseCmd proposalCid AcceptTransfer
  
  return ()
```

**What this teaches us**:
- Use `allocateParty` for test parties
- Use `submit party do` for actions
- Use `createCmd` to create contracts
- Use `exerciseCmd` to execute choices
- Chain actions together

---

## 🔒 Pattern 2: Escrow (For StreamCore)

**File**: `@/Users/prakharmishra/Documents/canton/Canton_Ginie-main/backend/rag/daml_examples/escrow.daml`

### Core Concepts

This example shows how to:
- ✅ Multi-party agreements (buyer, seller, agent)
- ✅ Conditional release of funds
- ✅ Time-based constraints
- ✅ Dispute handling
- ✅ Multiple related templates

### Key Template: Escrow

```daml
template Escrow
  with
    buyer       : Party
    seller      : Party
    escrowAgent : Party
    amount      : Decimal
    currency    : Text
    conditions  : Text
    deadline    : Time
  where
    signatory buyer
    observer  seller, escrowAgent
    
    ensure amount > 0.0
```

**What this teaches us**:
- Multiple observers: `seller, escrowAgent`
- Time field: `deadline : Time`
- Multi-party coordination
- Buyer is signatory (they're depositing funds)

### Key Choice: ConfirmDelivery

```daml
choice ConfirmDelivery : ContractId EscrowRelease
  controller buyer
  do
    create EscrowRelease with
      escrowAgent = escrowAgent
      recipient = seller
      amount = amount
      currency = currency
      reason = "Buyer confirmed delivery"
```

**What this teaches us**:
- Buyer confirms delivery
- Creates a release instruction
- Transfers control to escrowAgent
- Reason field for audit trail

### Key Choice: RaiseDispute

```daml
choice RaiseDispute : ContractId Dispute
  with reason : Text
  controller buyer
  do
    create Dispute with
      buyer = buyer
      seller = seller
      escrowAgent = escrowAgent
      amount = amount
      reason = reason
```

**What this teaches us**:
- Alternative path (dispute instead of release)
- Creates different contract type
- Captures reason for audit

### Key Choice: CancelEscrow

```daml
choice CancelEscrow : ContractId EscrowRefund
  with reason : Text
  controller buyer
  do
    currentTime <- getTime
    assertMsg "Cannot cancel after deadline" (currentTime < deadline)
    create EscrowRefund with
      buyer = buyer
      amount = amount
      currency = currency
      reason = reason
```

**What this teaches us**:
- Use `getTime` for current time
- Time-based validation
- Refund pattern

### Related Template: EscrowRelease

```daml
template EscrowRelease
  with
    escrowAgent : Party
    recipient   : Party
    amount      : Decimal
    currency    : Text
    reason      : Text
  where
    signatory escrowAgent
    observer  recipient
    
    choice ExecuteRelease : ()
      controller escrowAgent
      do
        return ()
```

**What this teaches us**:
- Separate template for release instruction
- EscrowAgent becomes signatory
- Simple execution choice

---

## 🎯 How These Patterns Apply to GrowStreams

### GrowToken.daml (From Asset Transfer)

| Asset Transfer Pattern | GrowToken Application |
|----------------------|---------------------|
| `Asset` template | `GrowToken` template |
| `ProposeTransfer` | `Transfer` choice |
| `Split` | `Split` choice (same) |
| `Merge` | `Merge` choice (same) |
| `TransferProposal` | `Allowance` template |
| `quantity : Decimal` | `amount : Decimal` |

### StreamCore.daml (From Escrow)

| Escrow Pattern | StreamCore Application |
|---------------|---------------------|
| `Escrow` template | `StreamAgreement` template |
| `buyer` | `sender` |
| `seller` | `receiver` |
| `amount : Decimal` | `deposited : Decimal` |
| `deadline : Time` | `lastUpdate : Time` |
| `ConfirmDelivery` | `Withdraw` choice |
| `RaiseDispute` | `Stop` choice |
| `CancelEscrow` | `Pause` choice |
| `EscrowRelease` | Settlement instruction |

---

## 📝 Key Daml Patterns Demonstrated

### Pattern 1: Two-Party Acceptance

```daml
-- Step 1: Party A proposes
choice Propose : ContractId Proposal
  controller partyA
  do
    create Proposal with ...

-- Step 2: Party B accepts
choice Accept : ContractId Result
  controller partyB
  do
    create Result with ...
```

**Use in GrowStreams**: Allowance mechanism

### Pattern 2: Conditional Execution

```daml
choice DoSomething : ()
  controller party
  do
    currentTime <- getTime
    assertMsg "Too late" (currentTime < deadline)
    -- proceed
```

**Use in GrowStreams**: Credit cap checks, time-based accrual

### Pattern 3: Multi-Contract Coordination

```daml
choice Combine : ContractId Result
  with otherCid : ContractId Other
  controller party
  do
    other <- fetch otherCid
    archive otherCid
    create Result with ...
```

**Use in GrowStreams**: Token + Stream integration

### Pattern 4: State Transitions

```daml
-- Active → Paused
choice Pause : ContractId Stream
  controller sender
  do
    create this with status = Paused

-- Paused → Active
choice Resume : ContractId Stream
  controller sender
  do
    create this with status = Active
```

**Use in GrowStreams**: Stream lifecycle management

---

## 🧪 Test Script Patterns

### Pattern 1: Basic Setup

```daml
test : Script ()
test = script do
  -- Allocate parties
  alice <- allocateParty "Alice"
  bob <- allocateParty "Bob"
  
  -- Create contract
  cid <- submit alice do
    createCmd MyContract with ...
  
  -- Exercise choice
  result <- submit bob do
    exerciseCmd cid MyChoice with ...
  
  return ()
```

### Pattern 2: Assertions

```daml
test : Script ()
test = script do
  -- ... setup ...
  
  result <- submit party do
    exerciseCmd cid Choice
  
  assertMsg "Result should be 100" (result == 100.0)
  
  return ()
```

### Pattern 3: Query Contracts

```daml
test : Script ()
test = script do
  -- ... create contract ...
  
  -- Query by contract ID
  Some contract <- queryContractId alice cid
  assertMsg "Owner should be Alice" (contract.owner == alice)
  
  return ()
```

---

## 🔍 Code Review Checklist

When writing Daml contracts, check:

### Template Structure
- [ ] `with` block has no commas
- [ ] All party fields use `Party` type
- [ ] All amount fields use `Decimal` type
- [ ] Single `ensure` clause with `&&`
- [ ] `signatory` specified
- [ ] `observer` specified (if needed)

### Choice Structure
- [ ] `with` comes before `controller`
- [ ] `controller` specifies who can execute
- [ ] `do` block returns correct type
- [ ] Validations use `assertMsg`
- [ ] Time queries use `getTime`

### Test Scripts
- [ ] Parties allocated with `allocateParty`
- [ ] Contracts created with `createCmd`
- [ ] Choices exercised with `exerciseCmd`
- [ ] Results validated with `assertMsg`
- [ ] Returns `()` at end

---

## 📖 Additional Canton_Ginie Examples

If you want to study more patterns:

| Example | Pattern | Relevance to GrowStreams |
|---------|---------|------------------------|
| `bond.daml` | Time-based obligations | Medium - coupon payments |
| `cash_payment.daml` | Simple transfers | Low - too simple |
| `crowdfunding.daml` | Pooled funds | Low - different model |
| `invoice.daml` | Payment requests | Medium - similar to streams |
| `loan.daml` | Debt obligations | Medium - accrual pattern |
| `supply_chain.daml` | Multi-step process | Low - different domain |

---

## 🎓 Learning Progression

### Week 1-2 (Current)
1. Read `asset_transfer.daml` - Understand token patterns
2. Read `escrow.daml` - Understand multi-party patterns
3. Write `HelloStream.daml` - Practice basic syntax

### Week 3-4 (Next)
1. Implement `GrowToken.daml` using Asset Transfer patterns
2. Add Transfer, Split, Merge choices
3. Add Allowance template
4. Write comprehensive tests

### Week 5-7 (Future)
1. Implement `StreamCore.daml` using Escrow patterns
2. Add accrual calculation
3. Add Pause/Resume/Clip lifecycle
4. Integrate with GrowToken

---

## 🚀 Quick Reference

### Most Important Patterns for GrowStreams

1. **Token Transfer** (from asset_transfer.daml)
   - Archive old, create new
   - Return new contract ID

2. **Token Split** (from asset_transfer.daml)
   - Validate split amount
   - Create two new contracts
   - Return tuple

3. **Multi-Party Agreement** (from escrow.daml)
   - Multiple observers
   - Conditional release
   - Dispute handling

4. **Time-Based Logic** (from escrow.daml)
   - Use `getTime`
   - Compare with deadline
   - Validate timing

5. **State Transitions** (from escrow.daml)
   - Archive old state
   - Create new state
   - Preserve data

---

**Study these patterns thoroughly before implementing GrowToken and StreamCore!**

**Next Step**: Once Daml SDK is installed, compile and test HelloStream.daml
