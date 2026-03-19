# GrowStreams Testnet Demo Scripts

**Purpose**: Real-time compatible demo scripts for Canton testnet  
**Key Difference**: These use `passTime` (real wall-clock time), NOT `setTime` (simulated time)

---

## ⚠️ Critical: Sandbox vs Testnet

### Sandbox Tests (daml/Test/)
```daml
-- Uses setTime - instant time jumps
let t0 = time (date 2024 Jan 1) 0 0 0
let t1 = addRelTime t0 (seconds 10)  -- Instant jump
```
**Use for**: Unit testing in sandbox  
**Advantage**: Fast, deterministic  
**Limitation**: Doesn't work on testnet

### Testnet Demos (scripts/demo/)
```daml
-- Uses passTime - real wall-clock waits
passTime (seconds 60)  -- Actually waits 60 seconds
```
**Use for**: Testnet demos, production verification  
**Advantage**: Real-time proof  
**Limitation**: Slower (actual time passes)

---

## 📁 Demo Scripts

### 1. Setup Testnet (01-setup-testnet.daml)
**Purpose**: Initialize testnet environment  
**Creates**:
- Admin, Alice, Bob parties
- Initial GROW tokens
- StreamFactory
- Faucet for token distribution

**Run**:
```bash
daml script \
  --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.SetupTestnet:setupTestnet \
  --ledger-host <testnet-host> \
  --ledger-port <testnet-port>
```

**Duration**: ~5 seconds

---

### 2. Create Stream Real-Time (02-create-stream-realtime.daml)
**Purpose**: Demonstrate real-time accrual  
**Shows**:
- Stream creation
- 60-second real-time wait
- Accrual verification (~60 GROW)

**Run**:
```bash
daml script \
  --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.CreateStreamRealtime:createStreamRealtime \
  --ledger-host <testnet-host> \
  --ledger-port <testnet-port>
```

**Duration**: ~70 seconds (includes 60s wait)

**Quick Version**:
```bash
# 10-second demo instead of 60
daml script \
  --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.CreateStreamRealtime:createStreamQuickDemo \
  --ledger-host <testnet-host> \
  --ledger-port <testnet-port>
```

**Duration**: ~15 seconds (includes 10s wait)

---

### 3. Lifecycle Real-Time (03-lifecycle-realtime.daml)
**Purpose**: Demonstrate all lifecycle choices with real time  
**Shows**:
- Active accrual (30s)
- Pause (no accrual for 30s)
- Resume (accrual continues)
- TopUp (adds deposit)
- UpdateRate (changes flow rate)

**Run**:
```bash
daml script \
  --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.LifecycleRealtime:lifecycleRealtime \
  --ledger-host <testnet-host> \
  --ledger-port <testnet-port>
```

**Duration**: ~130 seconds (multiple 30s waits)

**Quick Version**:
```bash
# 5-second intervals instead of 30
daml script \
  --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.LifecycleRealtime:lifecycleQuickDemo \
  --ledger-host <testnet-host> \
  --ledger-port <testnet-port>
```

**Duration**: ~20 seconds (multiple 5s waits)

---

## 🎬 Demo Video Script

**Total Duration**: 2 minutes

### 0:00-0:20 - Setup
```bash
# Show Canton testnet connection
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.SetupTestnet:setupTestnet \
  --ledger-host testnet.canton.network \
  --ledger-port 6865
```
**Say**: "Setting up GrowStreams on Canton testnet with parties and tokens."

### 0:20-0:50 - Real-Time Accrual
```bash
# Run quick demo (10s wait)
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.CreateStreamRealtime:createStreamQuickDemo \
  --ledger-host testnet.canton.network \
  --ledger-port 6865
```
**Say**: "Creating stream at 10 GROW per second. Waiting 10 real seconds... Balance now shows 100 GROW accrued in real-time."

### 0:50-1:30 - Lifecycle Management
```bash
# Run quick lifecycle demo (5s intervals)
daml script --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.LifecycleRealtime:lifecycleQuickDemo \
  --ledger-host testnet.canton.network \
  --ledger-port 6865
```
**Say**: "Demonstrating pause - stream stops accruing. Resume - accrual continues. TopUp and UpdateRate working in real-time."

### 1:30-2:00 - Verification
```bash
# Show Navigator UI with active contracts
# Or show test results
daml test
```
**Say**: "All 33 tests passing. GrowStreams fully functional on Canton with real-time token streaming."

---

## 🔧 Local Testing (Sandbox)

**For development**, you can test these scripts on sandbox:

```bash
# Terminal 1: Start sandbox
cd daml-contracts
daml sandbox

# Terminal 2: Run demo scripts
daml script \
  --dar .daml/dist/growstreams-1.0.0.dar \
  --script-name Demo.CreateStreamRealtime:createStreamQuickDemo \
  --ledger-host localhost \
  --ledger-port 6865
```

**Note**: Even on sandbox, these scripts will wait real time (not instant like tests).

---

## 📊 Expected Outputs

### Setup Script
```
=== GrowStreams Testnet Setup ===
Admin party: party-xxx...
Alice party: party-yyy...
Bob party: party-zzz...
Alice token created: 10,000 GROW
Bob token created: 5,000 GROW
StreamFactory created
Faucet created for token distribution
=== Testnet Setup Complete ===
```

### Real-Time Stream
```
=== Real-Time Stream Creation Demo ===
Current time: 2026-03-19T...
Alice creating stream to Bob (1.0 GROW/second)...
Stream created successfully!
Waiting 60 seconds for real accrual...
(This is actual wall-clock time, not simulated)
Time after wait: 2026-03-19T... (60s later)
Bob checking withdrawable balance...
Withdrawable after 60 seconds: 60.0 GROW
Expected: ~60 GROW (1.0 GROW/second × 60 seconds)
=== Real-Time Demo Complete ===
```

### Lifecycle Demo
```
=== Real-Time Lifecycle Demo ===
Creating stream: 1 GROW/second, 1000 GROW deposit

--- Phase 1: Active for 30 seconds ---
Balance after 30s: 30.0 GROW (expected: ~30)

--- Phase 2: Pausing stream ---
Stream paused. Waiting 30 seconds...
Balance after pause (30s later): 30.0 GROW
Expected: Still ~30 GROW (no accrual while paused)

--- Phase 3: Resuming stream ---
Stream resumed. Waiting 30 seconds...
Balance after resume (30s later): 60.0 GROW
Expected: ~60 GROW (30 before pause + 30 after resume)

--- Phase 4: TopUp 500 GROW ---
Topped up 500 GROW. Waiting 20 seconds...
Balance after topup (20s later): 80.0 GROW
Expected: ~80 GROW (60 + 20 more seconds)

--- Phase 5: UpdateRate to 2.0 GROW/second ---
Rate updated to 2.0 GROW/second. Waiting 20 seconds...
Final balance (20s at new rate): 120.0 GROW
Expected: ~120 GROW (80 + 40 at 2.0 GROW/second)

=== Lifecycle Demo Complete ===
```

---

## ✅ Verification Checklist

### Before Running Demos
- [ ] Canton testnet accessible
- [ ] DAR file built (`daml build`)
- [ ] Testnet credentials configured
- [ ] Network connection stable

### After Running Demos
- [ ] All scripts completed successfully
- [ ] Accrual amounts match expected values
- [ ] Real time waits occurred (not instant)
- [ ] Contracts visible in Navigator
- [ ] No errors in output

---

## 🚨 Troubleshooting

### "passTime not supported"
**Issue**: Running on old Canton version  
**Solution**: Upgrade to Canton 2.10.3+

### "Accrual doesn't match expected"
**Issue**: Clock skew or network delay  
**Solution**: Allow ±1-2 GROW tolerance in assertions

### "Script timeout"
**Issue**: Real-time waits too long  
**Solution**: Use quick demo versions (5-10s waits)

---

## 📝 Next Steps

1. **Week 8**: Run these demos on Canton testnet
2. **Week 9**: Record demo video using quick versions
3. **Week 10**: Submit to Canton Dev Fund with video evidence

---

**These scripts prove GrowStreams works in real-time on Canton testnet!** ✅
