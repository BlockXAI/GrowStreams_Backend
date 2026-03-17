# GrowStreams Canton Daml Contracts

> **Phase 1 Migration**: Vara Network → Canton Network

## Project Structure

```
daml-contracts/
├── daml.yaml           # Daml project configuration
├── daml/               # Daml source files
│   ├── HelloStream.daml      # Week 2: Learning exercise
│   ├── GrowToken.daml        # Week 3-4: Token contract (TODO)
│   ├── StreamCore.daml       # Week 5-7: Core streaming (TODO)
│   └── Test/                 # Test scripts
└── README.md           # This file
```

## Prerequisites

### 1. Install Daml SDK 2.10.3

**Option A: Automatic Install (Recommended)**
```bash
curl -sSL https://get.daml.com/ | sh
```

**Option B: Manual Install**
1. Download from: https://github.com/digital-asset/daml/releases/tag/v2.10.3
2. Extract and add to PATH
3. Verify: `daml version`

**Option C: Use existing Daml SDK**
If you have the Canton repository with Daml SDK:
```bash
export PATH="$HOME/Documents/canton/daml-main/sdk/bin:$PATH"
daml version
```

### 2. Verify Installation

```bash
daml version
# Should output: SDK versions: 2.10.3
```

## Week 1-2 Tasks

### Week 1: Setup ✅

- [x] Create project structure
- [x] Create `daml.yaml`
- [x] Create `daml/` directory
- [ ] Install Daml SDK 2.10.3
- [ ] Test compile empty project

### Week 2: Learning

- [ ] Study Canton_Ginie examples
  - [ ] `asset_transfer.daml` (token pattern)
  - [ ] `escrow.daml` (vault pattern)
- [ ] Write `HelloStream.daml`
- [ ] Compile and test

## Quick Start

### 1. Install Daml SDK

```bash
curl -sSL https://get.daml.com/ | sh
source ~/.daml/bash_completion.sh  # Optional: bash completion
```

### 2. Build Project

```bash
cd daml-contracts
daml build
```

### 3. Run Tests

```bash
daml test --files daml/HelloStream.daml
```

### 4. Start Daml Studio (Optional)

```bash
daml studio
```

## Learning Resources

### Canton_Ginie Examples (Study These!)

Located at: `~/Documents/canton/Canton_Ginie-main/backend/rag/daml_examples/`

**Key Examples**:
- `asset_transfer.daml` - Token transfer, split, merge patterns
- `escrow.daml` - Multi-party agreements, conditional release
- `bond.daml` - Time-based obligations
- `cash_payment.daml` - Payment settlement patterns

### Official Documentation

- **Daml Docs**: https://docs.daml.com/
- **Canton Docs**: https://docs.digitalasset.com/
- **Daml Cheat Sheet**: https://docs.daml.com/cheat-sheet/

## Daml Syntax Rules (Critical!)

From Canton_Ginie's proven patterns:

### 1. Template Structure
```daml
template MyContract
  with
    party1 : Party      -- NO commas between fields
    amount : Decimal
  where
    signatory party1
    observer party2
    ensure amount > 0.0  -- Single ensure with &&
```

### 2. Choice Structure
```daml
choice DoSomething : ContractId MyContract
  with                    -- 'with' BEFORE 'controller'
    newAmount : Decimal
  controller party1       -- 'controller' AFTER 'with'
  do
    create this with amount = newAmount
```

### 3. Common Mistakes to Avoid

| ❌ Wrong | ✅ Right |
|---------|---------|
| `Float` | `Decimal` |
| `Text` for parties | `Party` |
| Multiple `ensure` clauses | Single `ensure` with `&&` |
| `this.fieldName` | `fieldName` (direct access) |
| `controller` before `with` | `with` before `controller` |

## Next Steps

After completing Week 1-2:

1. **Week 3-4**: Implement `GrowToken.daml`
   - Token transfer, split, merge
   - Allowance mechanism
   - Faucet for testing

2. **Week 5-7**: Implement `StreamCore.daml`
   - StreamAgreement template
   - Accrual formula: `(Now - Last Settled) × Rate`
   - Pause/Resume/Clip lifecycle

3. **Week 8-9**: Deploy to Canton
   - Start Canton sandbox
   - Upload DAR file
   - Create contracts via JSON API

## Troubleshooting

### Daml SDK Installation Issues

**Issue**: `curl` command fails
- **Solution**: Download manually from GitHub releases

**Issue**: `daml: command not found`
- **Solution**: Add to PATH: `export PATH="$HOME/.daml/bin:$PATH"`

**Issue**: Wrong SDK version
- **Solution**: `daml install 2.10.3`

### Compilation Errors

**Error**: `Multiple ensure clauses`
```daml
-- Wrong
ensure amount > 0.0
ensure party1 /= party2

-- Right
ensure amount > 0.0 && party1 /= party2
```

**Error**: `Type mismatch`
- Check you're using `Decimal` not `Float`
- Check you're using `Party` not `Text`

## Support

- **Roadmap**: `../GROWSTREAMS_TO_CANTON_MASTER_ROADMAP.md`
- **Migration Guide**: `../GROWSTREAMS_CANTON_MIGRATION_COMPLETE_GUIDE.md`
- **Quick Reference**: `../QUICK_START_MIGRATION_CHEATSHEET.md`

---

**Status**: Week 1-2 Setup Phase  
**Next Milestone**: HelloStream.daml compiles and tests pass
