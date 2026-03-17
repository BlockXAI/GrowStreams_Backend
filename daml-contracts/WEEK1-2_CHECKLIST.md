# Week 1-2 Completion Checklist

> **Phase 1 - Environment Setup & Learning**  
> **Goal**: Daml SDK installed, project created, first contract working

---

## 📋 Week 1: Daml SDK Setup

### Task 1: Install Daml SDK 2.10.3 ⚠️ MANUAL STEP REQUIRED

**Status**: ⬜ Not Started

**Instructions**:

The automatic installation didn't work, so please install manually:

**Option A: Try automatic install in your terminal**
```bash
curl -sSL https://get.daml.com/ | sh
```

**Option B: Manual download**
1. Visit: https://github.com/digital-asset/daml/releases/tag/v2.10.3
2. Download the installer for macOS
3. Run the installer
4. Add to PATH: `export PATH="$HOME/.daml/bin:$PATH"`

**Option C: Use existing Canton Daml SDK**
```bash
# If you have the daml-main repository
export PATH="$HOME/Documents/canton/daml-main/sdk/bin:$PATH"
```

**Verification**:
```bash
daml version
# Should show: SDK versions: 2.10.3
```

**Deliverable**: ✅ `daml version` command works

---

### Task 2: Study Canton_Ginie Examples ✅ READY TO START

**Status**: ⬜ Not Started

**Location**: `~/Documents/canton/Canton_Ginie-main/backend/rag/daml_examples/`

#### 2a. Read `asset_transfer.daml` (Token Pattern)

**File**: `@/Users/prakharmishra/Documents/canton/Canton_Ginie-main/backend/rag/daml_examples/asset_transfer.daml`

**What to learn**:
- ✅ Template structure with `with`, `where`, `signatory`, `observer`
- ✅ Choice structure: `with` before `controller`
- ✅ How to use `create` to make new contracts
- ✅ How to use `archive` to delete contracts
- ✅ Pattern: Transfer (create new, archive old)
- ✅ Pattern: Split (create two from one)
- ✅ Pattern: Merge (combine two into one)

**Key Code to Understand**:
```daml
template Asset
  with
    owner    : Party
    quantity : Decimal
  where
    signatory issuer
    observer  owner
    
    choice ProposeTransfer : ContractId TransferProposal
      with recipient : Party
      controller owner
      do
        create TransferProposal with ...
```

**Action**: Read the file, take notes on patterns

---

#### 2b. Read `escrow.daml` (Vault Pattern)

**File**: `@/Users/prakharmishra/Documents/canton/Canton_Ginie-main/backend/rag/daml_examples/escrow.daml`

**What to learn**:
- ✅ Multi-party contracts (buyer, seller, escrowAgent)
- ✅ Conditional logic in choices
- ✅ Time-based constraints (`deadline : Time`)
- ✅ Pattern: Conditional release
- ✅ Pattern: Dispute handling
- ✅ How multiple templates work together

**Key Code to Understand**:
```daml
template Escrow
  with
    buyer  : Party
    seller : Party
    amount : Decimal
    deadline : Time
  where
    signatory buyer
    observer seller, escrowAgent
    
    choice ConfirmDelivery : ContractId EscrowRelease
      controller buyer
      do
        create EscrowRelease with ...
```

**Action**: Read the file, understand multi-party patterns

---

#### 2c. Understand `canton_client_v2.py` (API Integration)

**File**: `@/Users/prakharmishra/Documents/canton/Canton_Ginie-main/backend/canton/canton_client_v2.py`

**What to learn**:
- ✅ How to upload DAR files via HTTP
- ✅ How to allocate parties
- ✅ How to create contracts via JSON API
- ✅ How to exercise choices
- ✅ JWT token generation for sandbox

**Key Functions**:
- `upload_dar()` - POST /v1/packages
- `allocate_party()` - POST /v1/parties/allocate
- `create_contract()` - POST /v1/create
- `exercise_choice()` - POST /v1/exercise

**Action**: Skim the file, understand the API flow

---

### Task 3: Create GrowStreams Daml Project ✅ COMPLETE

**Status**: ✅ Done

**Created Files**:
- ✅ `daml-contracts/daml.yaml` - Project configuration
- ✅ `daml-contracts/daml/` - Source directory
- ✅ `daml-contracts/README.md` - Project documentation

**Verification**:
```bash
cd ~/Documents/canton/GrowStreams_Backend-main/daml-contracts
ls -la
# Should see: daml.yaml, daml/, README.md
```

---

### Task 4: Test Compile Empty Project ⚠️ REQUIRES DAML SDK

**Status**: ⬜ Waiting for SDK installation

**Command**:
```bash
cd ~/Documents/canton/GrowStreams_Backend-main/daml-contracts
daml build
```

**Expected Output**:
```
Compiling growstreams to a DAR.
Created .daml/dist/growstreams-1.0.0.dar
```

**If it fails**: Check that Daml SDK is installed correctly

---

## 📋 Week 2: Daml Language Mastery

### Task 5: Complete Daml Quickstart Tutorial ⚠️ REQUIRES DAML SDK

**Status**: ⬜ Not Started

**Option A: Use Canton's Daml SDK**
```bash
cd ~/Documents/canton/daml-main/sdk/templates/skeleton-single-package
cat daml/Main.daml
# Study the Asset template structure
```

**Option B: Use Daml's official quickstart**
```bash
daml new quickstart --template quickstart-java
cd quickstart
daml start
```

**What to learn**:
- Template structure
- Party allocation
- Contract creation
- Choice execution
- Test scripts

---

### Task 6: Study Daml Syntax Rules ✅ READY TO STUDY

**Status**: ⬜ Not Started

**Critical Rules** (from Canton_Ginie):

#### Rule 1: Template Structure
```daml
template MyContract
  with
    party1 : Party      -- NO commas!
    amount : Decimal    -- NO commas!
  where
    signatory party1
    observer party2
    ensure amount > 0.0  -- Single ensure with &&
```

#### Rule 2: Choice Structure
```daml
choice DoSomething : ContractId MyContract
  with                    -- 'with' FIRST
    newAmount : Decimal
  controller party1       -- 'controller' SECOND
  do
    create this with amount = newAmount
```

#### Rule 3: Type Rules
- ✅ Use `Party` not `Text` for parties
- ✅ Use `Decimal` not `Float` for numbers
- ✅ Use `Time` for timestamps
- ✅ Use `Int` for counts

#### Rule 4: Ensure Clause
```daml
-- ❌ WRONG - Multiple ensures
ensure amount > 0.0
ensure party1 /= party2

-- ✅ RIGHT - Single ensure with &&
ensure amount > 0.0 && party1 /= party2
```

#### Rule 5: Field Access
```daml
-- ❌ WRONG - Module-qualified
bond <- fetch CouponPayment.bondCid

-- ✅ RIGHT - Direct access
bond <- fetch bondCid
```

**Action**: Review these rules, understand why each matters

---

### Task 7: Write First Simple Contract ✅ COMPLETE

**Status**: ✅ Done

**File Created**: `daml/HelloStream.daml`

**What it does**:
- Defines a simple stream between sender and receiver
- Has a `Withdraw` choice for receiver
- Includes a test script

**Code Review Checklist**:
- ✅ Template has `with`, `where`, `signatory`, `observer`
- ✅ Choice has `with` before `controller`
- ✅ Single `ensure` clause
- ✅ Uses `Party` type (not Text)
- ✅ Uses `Decimal` type (not Float)
- ✅ Test script allocates parties
- ✅ Test script creates and exercises contract

---

### Task 8: Compile and Test HelloStream ⚠️ REQUIRES DAML SDK

**Status**: ⬜ Waiting for SDK installation

**Commands**:
```bash
cd ~/Documents/canton/GrowStreams_Backend-main/daml-contracts

# Build
daml build

# Test
daml test --files daml/HelloStream.daml
```

**Expected Output**:
```
Script execution succeeded:
  testSimple
```

**If it fails**: Check syntax against the rules above

---

## 📊 Week 1-2 Deliverables Summary

| Deliverable | Status | Verification |
|-------------|--------|--------------|
| **Daml SDK installed and working** | ⬜ | `daml version` shows 2.10.3 |
| **GrowStreams Daml project created** | ✅ | Files exist in `daml-contracts/` |
| **Successful test compilation** | ⬜ | `daml build` succeeds |
| **Canton_Ginie examples studied** | ⬜ | Can explain asset_transfer pattern |
| **Daml syntax mastery** | ⬜ | Can write template without errors |
| **First contract compiles** | ⬜ | `HelloStream.daml` builds |
| **First test passes** | ⬜ | `testSimple` succeeds |

---

## 🎯 Success Criteria

### Week 1 Success
- ✅ Daml SDK installed
- ✅ Project structure created
- ✅ Empty project compiles
- ✅ Canton_Ginie examples reviewed

### Week 2 Success
- ✅ Daml syntax rules understood
- ✅ HelloStream.daml compiles
- ✅ testSimple passes
- ✅ Ready to start GrowToken.daml

---

## 🚨 Current Blockers

### Blocker 1: Daml SDK Installation

**Issue**: Automatic installation failed

**Solutions**:
1. Try manual download from GitHub
2. Use existing Canton Daml SDK if available
3. Install via Homebrew (if available): `brew install daml`

**Priority**: HIGH - Blocks all compilation tasks

---

## 📝 Notes & Learning

### Key Insights from Canton_Ginie

1. **Immutability**: Contracts are never modified, only archived and recreated
2. **Party Model**: Every action has a controller, every contract has signatories
3. **Privacy**: Only signatories and observers see contract data
4. **Time**: Use Ledger Time for deterministic timestamps
5. **Testing**: Daml Scripts are the primary testing mechanism

### Common Mistakes to Avoid

1. ❌ Using commas in `with` block
2. ❌ Multiple `ensure` clauses
3. ❌ Using `Text` for parties
4. ❌ Using `Float` for amounts
5. ❌ Putting `controller` before `with`

---

## 🔜 Next Steps After Week 1-2

Once all Week 1-2 tasks are complete:

1. **Week 3-4**: Implement `GrowToken.daml`
   - Full token contract with Transfer, Split, Merge
   - Allowance mechanism
   - Faucet for testing
   - Complete test suite

2. **Week 5-7**: Implement `StreamCore.daml`
   - StreamAgreement template
   - Accrual formula implementation
   - Pause/Resume/Clip lifecycle
   - Integration with GrowToken

3. **Week 8-9**: Deploy to Canton
   - Start Canton sandbox
   - Upload DAR file
   - Create contracts via Python client

---

## 📞 Getting Help

**If stuck on**:
- **Daml syntax**: Review `QUICK_START_MIGRATION_CHEATSHEET.md`
- **Canton concepts**: Review `CANTON_LEARNING_GUIDE.md`
- **Migration strategy**: Review `GROWSTREAMS_TO_CANTON_MASTER_ROADMAP.md`
- **Code examples**: Check Canton_Ginie examples

---

**Last Updated**: Week 1-2 Setup Phase  
**Current Focus**: Install Daml SDK → Compile HelloStream → Pass testSimple  
**Next Milestone**: Week 3 - GrowToken.daml implementation
