# Canton Deployment Guide

**Purpose**: How to deploy GrowStreams on Canton  
**Platform**: Canton Sandbox (local) or Canton Testnet

---

## 🚀 Local Deployment (Sandbox)

### Prerequisites
- Daml SDK 2.10.3+
- Canton SDK
- Java 11+

### Step 1: Build DAR
```bash
cd daml-contracts
daml build
# Output: .daml/dist/growstreams-1.0.0.dar
```

### Step 2: Start Canton Sandbox
```bash
daml sandbox
# Runs on port 6865
```

### Step 3: Verify Deployment
```bash
# Check Canton is running
lsof -i:6865

# List parties
daml ledger list-parties --host localhost --port 6865
```

### Step 4: Start Navigator (Optional)
```bash
daml navigator server localhost 6865 --port 4000 -c ui-backend.conf
# Open http://localhost:4000
```

---

## 🌐 Testnet Deployment

### Step 1: Build DAR
```bash
cd daml-contracts
daml build
```

### Step 2: Deploy to Testnet
```bash
# Upload DAR
daml ledger upload-dar .daml/dist/growstreams-1.0.0.dar \
  --host <testnet-host> \
  --port <testnet-port>
```

### Step 3: Allocate Parties
```bash
# Allocate parties on testnet
daml ledger allocate-party Admin --host <testnet-host> --port <testnet-port>
daml ledger allocate-party Alice --host <testnet-host> --port <testnet-port>
daml ledger allocate-party Bob --host <testnet-host> --port <testnet-port>
```

### Step 4: Run Demo Scripts
```bash
# Setup testnet
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.SetupTestnet:setupTestnet \
  --ledger-host <testnet-host> \
  --ledger-port <testnet-port>

# Run real-time demo
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.CreateStreamRealtime:createStreamRealtime \
  --ledger-host <testnet-host> \
  --ledger-port <testnet-port>
```

---

## 🧪 Testing Deployment

### Run All Tests
```bash
cd daml-contracts
daml test
# Expected: 33/33 tests passing
```

### Run Specific Test
```bash
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Test.StreamCoreTest:testStreamLifecycle \
  --ledger-host localhost \
  --ledger-port 6865
```

---

## 📊 Verification Checklist

### Canton Running ✅
```bash
lsof -i:6865
# Should show Java process
```

### DAR Deployed ✅
```bash
ls -lh .daml/dist/growstreams-1.0.0.dar
# Should exist (~500KB)
```

### Parties Allocated ✅
```bash
daml ledger list-parties --host localhost --port 6865
# Should show Admin, Alice, Bob
```

### Tests Passing ✅
```bash
daml test
# Should show 33/33 passing
```

### Navigator Working ✅
```
http://localhost:4000
# Should show login screen
```

---

## 🔧 Troubleshooting

### Canton won't start
```bash
# Check port not in use
lsof -i:6865
# Kill existing process if needed
kill -9 <PID>
```

### DAR upload fails
```bash
# Rebuild DAR
daml clean
daml build
```

### Tests failing
```bash
# Check SDK version
daml version
# Should be 2.10.3+
```

### Navigator not connecting
```bash
# Verify Canton is running
lsof -i:6865
# Check Navigator config
cat ui-backend.conf
```

---

## 📁 File Structure

```
daml-contracts/
├── daml.yaml                  # Project config
├── daml/                      # Source code
│   ├── StreamCore.daml
│   ├── GrowToken.daml
│   └── Test/
├── scripts/demo/              # Demo scripts
├── .daml/dist/                # Built DAR
└── ui-backend.conf            # Navigator config
```

---

## 🚀 Production Deployment

### Phase 2 (Future)
- Deploy to Canton DevNet
- Configure multi-validator setup
- Set up monitoring
- Production party management

**Current**: Phase 1 complete on sandbox ✅  
**Next**: Testnet deployment + demo video
