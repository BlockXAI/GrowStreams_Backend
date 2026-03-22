# 🚀 Setup Guide: GrowStreams Canton Frontend + Demo

**Complete setup instructions for Canton Dev Fund proof**

---

## 📋 Prerequisites

- Node.js 18+ and npm
- Daml SDK 2.10.3 (already installed)
- Canton sandbox running
- Git

---

## 🎯 Step-by-Step Setup

### **Step 1: Start Canton Sandbox**

```bash
cd daml-contracts
daml sandbox --port 6865 --dar .daml/dist/growstreams-1.0.0.dar
```

**Expected output**:
```
Canton sandbox is ready.
Listening on localhost:6865
```

**Verify**:
```bash
lsof -i:6865
# Should show daml process
```

---

### **Step 2: Start Navigator UI**

Open a **new terminal**:

```bash
cd daml-contracts
daml navigator server localhost 6865 --port 4000 -c ui-backend.conf
```

**Expected output**:
```
Navigator backend server listening on port 4000
```

**Verify**: Open `http://localhost:4000` in browser
- Should see login screen
- Dropdown should show: Alice, Bob, Admin

---

### **Step 3: (Optional) Start Canton JSON API**

For full frontend integration (not required for Phase 1 demo):

```bash
daml json-api \
  --ledger-host localhost \
  --ledger-port 6865 \
  --http-port 7575 \
  --allow-insecure-tokens
```

**Verify**:
```bash
curl http://localhost:7575/v1/query
```

---

### **Step 4: Setup Frontend**

```bash
cd canton-frontend
npm install
```

**Create `.env.local`**:
```bash
cp env.example .env.local
```

**Update party IDs** in `.env.local`:
- Open `evidence/contract-ids.txt`
- Copy actual party IDs for Admin, Alice, Bob
- Paste into `.env.local`

---

### **Step 5: Run Frontend**

```bash
npm run dev
```

**Verify**: Open `http://localhost:3000`
- Should see "GrowStreams on Canton" dashboard
- Mock streams should be visible
- Real-time accrual should update every second

---

## 🎬 Record Demo Video

### **Terminal Layout**

Open 4 terminals:

**Terminal 1** - Canton Sandbox:
```bash
cd daml-contracts
daml sandbox --port 6865 --dar .daml/dist/growstreams-1.0.0.dar
```

**Terminal 2** - Navigator:
```bash
cd daml-contracts
daml navigator server localhost 6865 --port 4000 -c ui-backend.conf
```

**Terminal 3** - Frontend (optional):
```bash
cd canton-frontend
npm run dev
```

**Terminal 4** - Commands:
```bash
cd daml-contracts
# Use this for running test commands, etc.
```

---

### **Browser Tabs**

- **Tab 1**: Navigator UI - `http://localhost:4000`
- **Tab 2**: Frontend - `http://localhost:3000` (optional)

---

### **Recording Checklist**

Before you start recording:

- [ ] All terminals running without errors
- [ ] Navigator UI loads successfully
- [ ] Can see Alice, Bob, Admin in dropdown
- [ ] Can see active contracts in Navigator
- [ ] Frontend shows mock streams (if using)
- [ ] Terminal font size increased (16-18pt)
- [ ] Browser zoom at 125-150%
- [ ] Close unnecessary applications
- [ ] Quiet environment
- [ ] Microphone tested

---

### **Follow the Script**

Use `CANTON_DEMO_VIDEO_SCRIPT.md` for detailed recording instructions.

**Key sections to show**:
1. Canton sandbox running (`lsof -i:6865`)
2. Navigator UI with parties and contracts
3. Test results (`daml test` - 33/33 passing)
4. Live stream demo (ObligationView, Withdraw, Pause)
5. Evidence folder
6. Week-by-week documentation

---

## 🐛 Troubleshooting

### **Canton sandbox won't start**

**Error**: "Port 6865 already in use"

**Fix**:
```bash
# Kill existing process
lsof -i:6865
kill -9 <PID>

# Restart sandbox
daml sandbox --port 6865 --dar .daml/dist/growstreams-1.0.0.dar
```

---

### **Navigator shows no parties**

**Fix**: Use the config file:
```bash
daml navigator server localhost 6865 --port 4000 -c ui-backend.conf
```

Make sure `ui-backend.conf` exists with party IDs.

---

### **Navigator shows React errors**

**Status**: Cosmetic only - Navigator still works
**Impact**: None - contracts are visible and choices are executable
**Cause**: Navigator version mismatch with SDK 2.10.3

**Workaround**: Ignore the errors, they don't affect functionality.

---

### **Frontend won't start**

**Error**: "Cannot find module 'next'"

**Fix**:
```bash
cd canton-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### **Tests fail**

**Fix**: Rebuild DAR:
```bash
cd daml-contracts
daml clean
daml build
daml test
```

---

## 📊 Verification Commands

### **Check Canton is running**:
```bash
lsof -i:6865
```

### **Check Navigator is running**:
```bash
lsof -i:4000
```

### **Check JSON API is running** (optional):
```bash
lsof -i:7575
```

### **List parties**:
```bash
daml ledger list-parties --host localhost --port 6865
```

### **Run tests**:
```bash
cd daml-contracts
daml test
```

### **Count markdown files** (should be 28):
```bash
find . -name "*.md" -type f | grep -v node_modules | wc -l
```

---

## ✅ Success Checklist

Before recording your demo video:

- [ ] Canton sandbox running on port 6865
- [ ] Navigator UI accessible at `http://localhost:4000`
- [ ] Alice, Bob, Admin parties visible in Navigator
- [ ] Active contracts visible (StreamFactory, GrowToken, StreamAgreement)
- [ ] Tests passing: `daml test` shows 33/33
- [ ] Evidence folder complete (9 files)
- [ ] Documentation organized (docs/phase1/)
- [ ] Terminal font size increased
- [ ] Browser zoom comfortable
- [ ] Microphone working
- [ ] Quiet recording environment

---

## 🎯 After Recording

1. **Upload video** to YouTube/Loom/Vimeo
2. **Get shareable link**
3. **Create** `evidence/demo-video-url.txt` with the link
4. **Update** `evidence/README.md` with video link
5. **Commit** to GitHub:
   ```bash
   git add evidence/demo-video-url.txt evidence/README.md
   git commit -m "Add demo video for Canton Dev Fund submission"
   git push origin canton_native
   ```

---

## 📤 Submit to Canton Dev Fund

Once video is uploaded:

1. **GitHub repo link**: `https://github.com/BlockXAI/GrowStreams_Backend`
2. **Branch**: `canton_native`
3. **Evidence folder**: `evidence/`
4. **Demo video**: Link in `evidence/demo-video-url.txt`
5. **Documentation**: `docs/phase1/` + `GROWSTREAMS_SIMPLE_OVERVIEW.md`

---

**You're ready to record and submit! Good luck with Canton Dev Fund Phase 1!** 🚀
