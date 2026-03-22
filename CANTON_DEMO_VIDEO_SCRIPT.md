# 🎬 GrowStreams Canton Demo Video Script

**Target**: Canton Dev Fund Submission  
**Duration**: 2-3 minutes  
**Goal**: Prove GrowStreams works on Canton Network

---

## 📋 Pre-Recording Checklist

### Terminal Setup
- [ ] Terminal 1: Canton sandbox running
- [ ] Terminal 2: Canton JSON API running (optional for Phase 1)
- [ ] Terminal 3: Frontend dev server (optional)
- [ ] Terminal 4: For running commands

### Browser Setup
- [ ] Tab 1: Navigator UI (`http://localhost:4000`)
- [ ] Tab 2: Frontend demo (`http://localhost:3000`) - optional
- [ ] Close unnecessary tabs
- [ ] Zoom browser to 125% for better visibility

### Files Ready
- [ ] `evidence/` folder open
- [ ] `daml-contracts/` folder open
- [ ] Test output log ready to show

---

## 🎥 Video Script (2-3 minutes)

### **INTRO** (15 seconds)

**[Screen: Desktop with terminal]**

**You say**:
> "Hi, I'm [Your Name] from the GrowStreams team. Today I'm showing you our Phase 1 submission for the Canton Dev Fund - a real-time token streaming protocol built natively on Canton Network using Daml smart contracts."

---

### **SECTION 1: Proof Canton is Running** (30 seconds)

**[Screen: Terminal]**

**You say**:
> "First, let me prove Canton is actually running locally."

**Commands to run**:
```bash
# Show Canton sandbox is running
lsof -i:6865
```

**You say**:
> "Canton sandbox is running on port 6865."

**[Show Navigator UI in browser]**

**Navigate to**: `http://localhost:4000`

**You say**:
> "Here's the Canton Navigator UI. I can see Alice, Bob, and Admin parties are allocated."

**[Select Alice from dropdown, show contracts]**

**You say**:
> "And here are the active contracts on the ledger - StreamFactory, GrowToken, and StreamAgreement contracts."

---

### **SECTION 2: Show Test Results** (20 seconds)

**[Screen: Terminal in daml-contracts/ folder]**

**You say**:
> "Let me show you our test results."

**Commands to run**:
```bash
cd daml-contracts
daml test
```

**You say**:
> "33 out of 33 tests passing - 100% pass rate. This covers StreamCore, GrowToken, and all lifecycle choices."

---

### **SECTION 3: Live Stream Demo** (60 seconds)

**[Screen: Navigator UI]**

**You say**:
> "Now let me demonstrate a live stream. I'm logged in as Alice, the sender."

**Steps**:
1. **Find a StreamAgreement contract**
   - Click on "StreamAgreement" template
   - Show contract details (sender, receiver, flowRate, deposited, withdrawn)

**You say**:
> "This stream is sending tokens from Alice to Bob at 0.1 GROW per second. You can see the deposited amount, withdrawn amount, and current status."

2. **Execute ObligationView** (non-consuming query)
   - Click "ObligationView" choice
   - Pass current time
   - Show result

**You say**:
> "I'll execute ObligationView - this is a non-consuming choice that shows the withdrawable balance without changing the contract. See? The contract is still active, but we got the real-time balance."

3. **Switch to Bob and Withdraw**
   - Switch party to Bob in Navigator
   - Find same StreamAgreement
   - Execute "Withdraw" choice
   - Pass current time
   - Show new contract created with updated withdrawn amount

**You say**:
> "Now I'm Bob, the receiver. I'll withdraw my earned tokens. After withdrawal, you can see a new contract was created with the updated withdrawn amount - that's Canton's immutable UTXO model in action."

4. **Switch back to Alice and Pause**
   - Switch to Alice
   - Execute "Pause" choice
   - Show status changed to "Paused"

**You say**:
> "Back to Alice. I can pause the stream anytime. Notice the status changed to Paused and the lastUpdate timestamp was frozen."

---

### **SECTION 4: Evidence Folder** (20 seconds)

**[Screen: Finder/File Explorer showing evidence/ folder]**

**You say**:
> "All our evidence is organized in the evidence folder."

**Show files**:
- `criterion-1-streaming-contract.md`
- `criterion-2-accrual-formula.md`
- `criterion-3-obligation-view.md`
- `criterion-4-lifecycle-manager.md`
- `criterion-5-testing.md`
- `criterion-6-canton-deployment.md`
- `test-output.log`
- `contract-ids.txt`

**You say**:
> "We have detailed evidence for all 6 acceptance criteria, test outputs, and party allocations."

---

### **SECTION 5: Phase-by-Phase Documentation** (15 seconds)

**[Screen: docs/phase1/ folder]**

**You say**:
> "Our documentation is organized week-by-week showing the development progression."

**Show folders**:
- `week1-2/` - Foundation
- `week3-4/` - Core Features
- `week5-7/` - Streaming Engine
- `week8-10/` - Deployment

**You say**:
> "Each week has detailed documentation of what was built, tested, and delivered."

---

### **SECTION 6: Key Differentiators** (20 seconds)

**[Screen: README.md or overview doc]**

**You say**:
> "What makes GrowStreams unique on Canton?"

**Highlight**:
1. **Obligation-First Model** - "Tokens don't move until withdrawal, unlike transfer-first models"
2. **Immutable Audit Trail** - "Every state change creates a new contract version"
3. **Non-Consuming Queries** - "Check balance without gas cost or state change"
4. **Multi-Party Signatures** - "Both parties cryptographically sign the agreement"

---

### **OUTRO** (10 seconds)

**[Screen: Back to terminal or summary slide]**

**You say**:
> "That's GrowStreams on Canton - 33 passing tests, all 6 criteria met, running live on Canton sandbox. We're ready for Phase 1 funding and excited to build Phase 2 enterprise features. Thank you!"

**[End screen with text]**:
```
GrowStreams on Canton
Phase 1 Complete ✅
33/33 Tests Passing
6/6 Criteria Met

GitHub: [your-repo-url]
Contact: [your-email]
```

---

## 🎬 Recording Tips

### Technical Setup
- **Screen Resolution**: 1920x1080 or 1280x720
- **Recording Tool**: OBS Studio, Loom, or QuickTime
- **Audio**: Clear microphone, quiet room
- **Font Size**: Increase terminal font to 16-18pt
- **Browser Zoom**: 125-150% for better visibility

### Presentation Tips
- **Speak clearly and confidently**
- **Don't rush** - 2-3 minutes is plenty of time
- **Show, don't just tell** - Execute actual commands
- **Pause briefly** after each section
- **Practice once** before final recording

### What to Avoid
- ❌ Don't apologize for anything
- ❌ Don't say "um" or "uh" too much
- ❌ Don't show errors (practice first!)
- ❌ Don't go over 3 minutes
- ❌ Don't read from script word-for-word (sound natural)

---

## 📤 After Recording

### Video Editing (Optional)
- Trim dead space at start/end
- Add intro/outro slides (5 seconds each)
- Add background music (low volume, optional)
- Add captions (recommended for accessibility)

### Upload
- **YouTube**: Unlisted or Public
- **Loom**: Share link
- **Vimeo**: Public

### Add to Evidence
1. Upload video
2. Get shareable link
3. Add to `evidence/demo-video-url.txt`
4. Update `evidence/README.md` with video link

---

## ✅ Success Criteria

Your video should clearly show:
- ✅ Canton sandbox running and accessible
- ✅ Navigator UI with active contracts
- ✅ 33/33 tests passing
- ✅ Live stream execution (ObligationView, Withdraw, Pause)
- ✅ Immutable contract updates (UTXO model)
- ✅ Evidence folder with all 6 criteria
- ✅ Week-by-week documentation

---

**Good luck with your recording! This will be the final proof for Canton Dev Fund submission.** 🚀
